/* Chạy sớm trong <head> — để mỗi lần sang trang khác không bị nháy nền tối rồi mới đổi sang nền sáng. */
try {
  const t = JSON.parse(localStorage.getItem("warroom.v1") || "{}").theme;
  if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
} catch (e) {}
