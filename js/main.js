function initHeader() {
  const header = document.querySelector('.site-header');
  const SCROLL_OFFSET = 40;

  const update = () => header.classList.toggle('is-scrolled', window.scrollY > SCROLL_OFFSET);

  window.addEventListener('scroll', update, { passive: true });
  update();
}

function initMobileNav() {
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
  }

  toggle.addEventListener('click', () => setOpen(!isOpen()));

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
  const isDark = () => root.dataset.theme === 'dark';

  function switchTheme() {
    root.dataset.theme = isDark() ? 'light' : 'dark';
    toggle.setAttribute('aria-pressed', String(isDark()));
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

// Rotates the list so the carousel loops, then slides the cards into their new slots.
function initDrinksCarousel() {
  const list = document.getElementById('drinks-list');
  const buttons = document.querySelectorAll('.drinks__button');
  const SLIDE_DURATION = 700;

  function slide(direction) {
    const items = list.children;
    const step = items[1].offsetLeft - items[0].offsetLeft;

    if (direction === 'next') {
      list.append(items[0]);
    } else {
      list.prepend(items[items.length - 1]);
    }

    const offset = direction === 'next' ? step : -step;
    for (const item of list.children) {
      item.animate(
        [{ transform: `translateX(${offset}px)` }, { transform: 'translateX(0)' }],
        { duration: SLIDE_DURATION, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }
      );
    }
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

initHeader();
initMobileNav();
initThemeToggle();
initDrinksCarousel();
initScrollReveal();
initActiveNavLink();
