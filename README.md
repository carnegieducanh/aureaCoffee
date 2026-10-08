# CAFÉ AUREA — Landing Page

Landing page cho thương hiệu café CAFÉ AUREA, xây dựng bằng **HTML5 + SCSS + Vanilla JavaScript** (không framework). Thư viện runtime duy nhất là [ScrollReveal](https://scrollrevealjs.org/) cho hiệu ứng hiện nội dung khi cuộn.

## Chạy dự án

```bash
npm install        # cài Sass và ScrollReveal
npm run build      # scss/main.scss -> css/main.css (compressed)
npm run watch      # tự compile lại khi sửa SCSS
npm run vendor     # chép ScrollReveal từ node_modules sang js/vendor/ (chạy lại khi nâng version)
```

Sau đó mở `index.html` trực tiếp trên trình duyệt, hoặc dùng extension Live Server của VS Code. JavaScript không dùng ES module nên chạy được cả qua `file://`.

## Cấu trúc

```text
index.html                 Toàn bộ markup (semantic HTML)
css/main.css               CSS đã compile — không sửa trực tiếp
js/main.js                 Header, mobile menu, carousel, scroll reveal, active nav link
js/vendor/                 ScrollReveal đã build sẵn — không sửa trực tiếp
scss/
  main.scss                Điểm vào, @use các partial
  base/                    _variables (design tokens), _reset, _typography, _motion
  components/              _buttons, _brand (logo + badge)
  layout/                  _header, _footer
  sections/                _hero, _drinks, _story, _menu, _moments, _reservation
assets/
  images/                  Ảnh nội dung (WebP), đặt tên theo nội dung ảnh
  icons/                   Icon trang trí (WebP)
```

## Design tokens

- Màu: `scss/base/_variables.scss` — lấy đúng mã HEX từ Color System (`#FAF3EA`, `#F2E4D4`, `#DDC9B3`, `#2B1B0D`, `#664C2D`, `#513118`, `#98562B`).
- Font (Google Fonts): Zen Old Mincho (heading tiếng Nhật), Noto Serif JP (nội dung), Cormorant Garamond (heading tiếng Anh, label), Caveat (chữ viết tay trang trí).
- Breakpoint (desktop-first): `1279px` laptop, `1099px` chuyển sang menu hamburger, `1023px` tablet, `767px` mobile. Giá trị `1099px` phải khớp với media query trong `js/main.js`.

## Hiệu ứng khi cuộn

- Gắn `data-reveal` vào phần tử cần hiện khi cuộn tới. Các phần tử `data-reveal` **cùng cha** tạo thành một chuỗi và hiện lần lượt, cách nhau 120ms (cấu hình trong `initScrollReveal()` ở `js/main.js`).
- Không gắn `data-reveal` cho từng `.drinks__item`: hàng đồ uống cuộn ngang, ScrollReveal chỉ đo theo trang nên thẻ nằm ngoài khung sẽ bị ẩn mãi. Gắn cho cả `.drinks__carousel`.
- `scrollreveal.min.js` được nạp trong `<head>` (không `defer`) để class `.sr` có trên `<html>` trước khi trang hiển thị; CSS dùng class này để ẩn sẵn `[data-reveal]`, tránh nội dung nháy lên rồi biến mất. Nếu file không tải được thì nội dung vẫn hiện bình thường.
- Trang cố ý không xử lý `prefers-reduced-motion`: mọi hiệu ứng (hero, cuộn mượt, carousel, scroll reveal, hover) chạy như nhau kể cả khi người dùng bật giảm chuyển động trong hệ điều hành.
- **Bản quyền:** ScrollReveal 4 dùng giấy phép GPL-3.0 cho dự án mã nguồn mở / phi thương mại. Website thương mại cần mua [commercial license](https://scrollrevealjs.org/pricing/).

## Phần cần tích hợp thật

Các vị trí đều có comment `TODO` trong `index.html`:

| Thành phần | Hiện tại | Cần |
| --- | --- | --- |
| Nút「お席を予約する」trong section Reservation | Cuộn tới footer (`#contact`) | URL hệ thống đặt bàn |
| Nút「店舗を探す」 | Cuộn tới footer (`#contact`) | Trang / URL tìm cửa hàng |
| Form newsletter | Có validate email, chưa có `action` | Endpoint dịch vụ email |
| Icon Facebook / Instagram / YouTube | Trỏ tới trang chủ của từng nền tảng | URL tài khoản chính thức |

## Ảnh

Toàn bộ ảnh dùng định dạng WebP, đã resize theo kích thước hiển thị (tổng ~2.9MB). Ảnh trong suốt (ly đồ uống, icon, hoa trang trí) được cắt bỏ viền trong suốt thừa. Khi thêm ảnh mới, chuyển sang WebP trước (ví dụ qua [Squoosh](https://squoosh.app), quality ~80) và đặt tên tiếng Anh ngắn, không dấu cách, mô tả nội dung ảnh.
