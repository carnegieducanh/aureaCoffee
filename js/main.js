// Smooth wheel scrolling for the whole page (touch scrolling stays native), and in-page links
// that glide to their section instead of jumping.
function initSmoothScroll() {
  if (typeof Lenis !== 'function') return null;

  const lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.9,
    // Windows reports reduced motion whenever "Animation effects" is off.
    respectReducedMotion: false,
  });

  requestAnimationFrame(function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  });

  // Not Lenis's `anchors` option: it doesn't cancel the click, so the browser jumps there first.
  // The skip link keeps the native jump, which also moves keyboard focus into <main>.
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]:not(.skip-link)');
    if (!link) return;
    event.preventDefault();
    lenis.scrollTo(link.getAttribute('href'), { duration: 1.2 });
  });

  return lenis;
}

function initHeader() {
  const header = document.querySelector('.site-header');
  const SCROLL_OFFSET = 40;

  const update = () => header.classList.toggle('is-scrolled', window.scrollY > SCROLL_OFFSET);

  window.addEventListener('scroll', update, { passive: true });
  update();
}

function initMobileNav(lenis) {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-nav');
  const pageRegions = document.querySelectorAll('main, .site-footer');
  const desktop = window.matchMedia('(min-width: 1100px)');

  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-nav-open', open);
    pageRegions.forEach((region) => {
      region.inert = open;
    });
    // Lenis scrolls the page itself, so the overflow lock on <body> doesn't stop it.
    if (open) {
      lenis?.stop();
    } else {
      lenis?.start();
    }
  }

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  // Runs before the link's smooth scroll (handled on document), so Lenis is running again by then.
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isOpen()) return;
    setOpen(false);
    toggle.focus();
  });

  desktop.addEventListener('change', () => setOpen(false));
}

// The initial theme is set by the inline script in <head>; this only flips and saves it.
function initThemeToggle() {
  const toggle = document.querySelector('.theme-toggle');
  const root = document.documentElement;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const isDark = () => root.dataset.theme === 'dark';

  function switchTheme() {
    root.dataset.theme = isDark() ? 'light' : 'dark';
    toggle.setAttribute('aria-pressed', String(isDark()));
    themeColor.content = getComputedStyle(root).getPropertyValue('--color-bg').trim();
    localStorage.setItem('theme', root.dataset.theme);
  }

  toggle.setAttribute('aria-pressed', String(isDark()));

  // Crossfades the whole page into the new theme; browsers without View Transitions just switch.
  toggle.addEventListener('click', () => {
    if (document.startViewTransition) {
      document.startViewTransition(switchTheme);
    } else {
      switchTheme();
    }
  });
}

// Rotates the list so the carousel loops, then slides every card from where it is on screen
// into its new slot. The card that wraps around leaves through a copy of itself, so it slides
// out of view on one side while it slides back in on the other.
function initDrinksCarousel() {
  const list = document.getElementById('drinks-list');
  const buttons = document.querySelectorAll('.drinks__button');
  const SLIDE = { duration: 700, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' };
  // Copies still sliding out, by card, with the direction they went.
  const leaving = new Map();

  function slide(direction) {
    const cards = [...list.children].filter((child) => !child.classList.contains('drinks__item--leaving'));
    const card = direction === 'next' ? cards[0] : cards[cards.length - 1];
    const step = cards[1].offsetLeft - cards[0].offsetLeft;
    const exit = direction === 'next' ? -step : step;

    // Measure before cancelling, so a card caught mid-slide carries on from where it is.
    const from = new Map(cards.map((item) => [item, item.getBoundingClientRect().left]));
    cards.forEach((item) => item.getAnimations().forEach((animation) => animation.cancel()));

    const copy = card.cloneNode(true);
    copy.classList.add('drinks__item--leaving');
    copy.setAttribute('aria-hidden', 'true');
    copy.inert = true;
    copy.querySelector('img').loading = 'eager';
    copy.style.left = `${card.offsetLeft}px`;
    copy.style.top = `${card.offsetTop}px`;
    copy.style.width = `${card.offsetWidth}px`;
    const copyStart = from.get(card) - card.getBoundingClientRect().left;

    // Clicked back while the card's copy is still on its way out: the card turns round there.
    const previous = leaving.get(card);
    const turnsRound = previous && previous.direction !== direction;
    if (turnsRound) {
      from.set(card, previous.copy.getBoundingClientRect().left);
      previous.copy.remove();
    }

    // Scroll snapping would chase the card to the other end of the list and undo the slide.
    list.classList.add('is-sliding');
    if (direction === 'next') {
      list.append(card);
    } else {
      list.prepend(card);
    }
    list.append(copy);

    const animations = cards.map((item) => {
      const offset = item === card && !turnsRound ? -exit : from.get(item) - item.getBoundingClientRect().left;
      return item.animate([{ transform: `translateX(${offset}px)` }, { transform: 'none' }], SLIDE);
    });

    // `forwards` keeps the copy out of view until it is removed.
    copy
      .animate([{ transform: `translateX(${copyStart}px)` }, { transform: `translateX(${exit}px)` }], { ...SLIDE, fill: 'forwards' })
      .finished.then(() => {
        copy.remove();
        if (leaving.get(card)?.copy === copy) leaving.delete(card);
      });
    leaving.set(card, { copy, direction });

    // A newer slide cancels these animations and restores snapping once its own have finished.
    Promise.all(animations.map((animation) => animation.finished)).then(
      () => list.classList.remove('is-sliding'),
      () => {}
    );
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => slide(button.dataset.direction));
  });
}

// Fades [data-reveal] elements in as they scroll into view. Siblings form one sequence,
// so they appear one after another.
function initScrollReveal() {
  if (typeof ScrollReveal !== 'function') return;

  const sr = ScrollReveal({
    distance: '24px',
    duration: 900,
    easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
    viewFactor: 0.15,
    cleanup: true,
    // `cleanup` only stops tracking the element: it leaves these inline, so drop them
    // to hand the element back to the stylesheet.
    afterReveal: (element) => {
      ['opacity', 'transform', 'transition'].forEach((property) => element.style.removeProperty(property));
    },
  });

  const groups = new Map();
  document.querySelectorAll('[data-reveal]').forEach((element) => {
    const siblings = groups.get(element.parentElement) ?? [];
    siblings.push(element);
    groups.set(element.parentElement, siblings);
  });

  // `interval` only works per reveal() call, not in the constructor defaults.
  groups.forEach((elements) => sr.reveal(elements, { interval: 120 }));
}

// Marks the nav link of the section currently in the middle of the viewport.
function initActiveNavLink() {
  const links = document.querySelectorAll('.site-nav__link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => {
        if (link.hash === `#${entry.target.id}`) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    });
  }, { rootMargin: '-45% 0px -54% 0px' });

  links.forEach((link) => {
    const section = document.querySelector(link.hash);
    if (section) observer.observe(section);
  });
}

const lenis = initSmoothScroll();
initHeader();
initMobileNav(lenis);
initThemeToggle();
initDrinksCarousel();
initScrollReveal();
initActiveNavLink();
