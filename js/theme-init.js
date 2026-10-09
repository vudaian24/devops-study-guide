/* Chạy sớm trong <head> — để mỗi lần sang trang khác không bị nháy nền tối rồi mới đổi sang nền sáng
   (và trang học không bị hiện mục lục rồi mới ẩn khi đang ở chế độ tập trung). */
try {
  const s = JSON.parse(localStorage.getItem("warroom.v1") || "{}");
  if (s.theme === "light" || s.theme === "dark") document.documentElement.setAttribute("data-theme", s.theme);
  if (s.focus) document.documentElement.classList.add("is-focus");   // chỉ có tác dụng ở trang nạp css/lesson.css
} catch (e) {}
