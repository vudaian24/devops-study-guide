/* ============================================================
   common.js — phần dùng chung cho mọi trang: tiện ích, trạng thái lưu lại,
   đổi nền sáng/tối và thanh tab.

   Muốn thêm một tab/trang mới: thêm một dòng vào TABS bên dưới, tạo file HTML
   tương ứng (copy một trang có sẵn, đổi data-page) — thanh tab tự cập nhật.
   ============================================================ */

/* ---------- Danh sách tab — mỗi tab là một file HTML riêng ---------- */
const TABS = [
  { id: "containers", file: "index.html",      ten: "Container & K8s" },
  { id: "cicd",       file: "cicd.html",       ten: "CI/CD" },
  { id: "iac",        file: "iac.html",        ten: "IaC & Script" },
  { id: "linux",      file: "linux.html",      ten: "Linux & On-prem" },
  { id: "aws",        file: "aws.html",        ten: "AWS" },
  { id: "monitoring", file: "monitoring.html", ten: "Monitoring" },
  { id: "database",   file: "database.html",   ten: "Database" },
  { id: "cases",      file: "cases.html",      ten: "Case thực tế" },
  { id: "incident",   file: "incident.html",   ten: "Debug sự cố" },
  { id: "bank",       file: "bank.html",       ten: "Ngân hàng câu hỏi", tach: true }   // tach: vạch ngăn trước tab này
];

/* ---------- Tiện ích ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* Bọc `...` thành <code> */
const fmt = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');

/* ---------- Trạng thái lưu lại ---------- */
const KEY = "warroom.v1";   // giữ nguyên khoá cũ để không mất tiến độ đã đánh dấu
let S = { theme: "dark", status: {} };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
delete S.view; delete S.roadmap;   // dữ liệu của các màn đã bỏ
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

const trangThai = id => S.status[id] || "new";

/* ---------- Theme ---------- */
function applyTheme() {
  document.documentElement.setAttribute("data-theme", S.theme);
  const b = $("#themeToggle");
  if (!b) return;
  b.textContent = S.theme === "dark" ? "☀" : "☾";
  b.title = S.theme === "dark" ? "Chuyển sang nền sáng" : "Chuyển sang nền tối";
}

/* ---------- Thanh trên: tab + nút đổi nền ---------- */
function renderNav() {
  const cur = document.body.dataset.page;
  const links = TABS.map(t => {
    const on = t.id === cur;
    return (t.tach ? '<span class="tab-sep" aria-hidden="true"></span>' : "") +
      `<a class="tab${on ? " is-active" : ""}" href="${t.file}"${on ? ' aria-current="page"' : ""}>${esc(t.ten)}</a>`;
  }).join("");

  $("#topbar").innerHTML =
    `<nav class="tabs" aria-label="Các trang">${links}</nav>
     <button class="icon-btn" id="themeToggle" type="button"></button>`;

  /* Dải tab có thể cuộn ngang (màn hẹp): đưa tab đang mở ra giữa dải */
  const box = $(".tabs"), act = $(".tab.is-active", box);
  if (act) box.scrollLeft = act.offsetLeft - (box.clientWidth - act.offsetWidth) / 2;

  $("#themeToggle").addEventListener("click", () => {
    S.theme = S.theme === "dark" ? "light" : "dark"; save(); applyTheme();
  });
  applyTheme();
}

renderNav();
