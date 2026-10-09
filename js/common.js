/* ============================================================
   common.js — phần dùng chung cho mọi trang: tiện ích, trạng thái lưu lại,
   đổi nền sáng/tối, ngăn kéo dùng chung và thanh trên (nút Menu mở danh sách trang).

   Muốn thêm một tab/trang mới: thêm một dòng vào TABS bên dưới, tạo file HTML
   tương ứng (copy một trang có sẵn, đổi data-page) — menu các trang tự cập nhật.
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
  { id: "k8s",        file: "k8s-co-ban.html", ten: "K8s cơ bản" },      // trang học theo series — js/lesson.js
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

/* ---------- Ngăn kéo dùng chung (menu các trang, danh sách bài của trang học) ----------
   <aside class="drawer" id="…" role="dialog" aria-modal="true" inert> trượt từ trái vào, nền mờ .scrim
   dùng chung. Nút mở khai báo aria-controls="<id>" để được cập nhật aria-expanded.
   Mỗi lúc chỉ mở một ngăn kéo; Esc / bấm nền mờ để đóng, Tab không thoát ra ngoài ngăn kéo. */
let drawerMo = null;          // ngăn kéo đang mở (null nếu không có)
let drawerTruocDo = null;     // phần tử có focus trước khi mở, để trả focus lại khi đóng

function moDrawer(el, mo) {
  if (mo && drawerMo && drawerMo !== el) moDrawer(drawerMo, false);
  if (mo === (drawerMo === el)) return;
  el.classList.toggle("is-open", mo);
  el.inert = !mo;
  document.documentElement.classList.toggle("has-drawer", mo);
  $$(`[aria-controls="${el.id}"]`).forEach(b => b.setAttribute("aria-expanded", mo ? "true" : "false"));
  drawerMo = mo ? el : null;
  if (mo) {
    drawerTruocDo = document.activeElement;
    const act = $$(".is-active", el);   // có mục con đang mở (vd bài học) thì focus vào đó
    (act[act.length - 1] || $("[data-drawer-close]", el)).focus();
  } else if (drawerTruocDo && document.contains(drawerTruocDo)) {
    drawerTruocDo.focus();
  }
}

document.body.insertAdjacentHTML("beforeend", '<div class="scrim" id="scrim"></div>');

document.addEventListener("click", e => {
  if (drawerMo && e.target.closest("#scrim, [data-drawer-close]")) moDrawer(drawerMo, false);
});

document.addEventListener("keydown", e => {
  if (!drawerMo) return;
  if (e.key === "Escape") { e.preventDefault(); moDrawer(drawerMo, false); }
  else if (e.key === "Tab") {
    const f = $$("a[href], button:not([disabled])", drawerMo);
    const dau = f[0], cuoi = f[f.length - 1];
    if (e.shiftKey && document.activeElement === dau) { e.preventDefault(); cuoi.focus(); }
    else if (!e.shiftKey && document.activeElement === cuoi) { e.preventDefault(); dau.focus(); }
  }
});

/* ---------- Thanh trên: nút menu + tên trang + nút đổi nền ----------
   Danh sách trang không bày thành dải tab nữa mà nằm trong ngăn kéo #siteNav — đỡ rối mắt khi học. */
function renderNav() {
  const cur = document.body.dataset.page;
  const tab = TABS.find(t => t.id === cur);
  /* Ngay dưới trang đang mở có chỗ trống #navSub: trang nào có mục con (vd trang học: danh sách bài)
     thì tự đổ vào đó — một menu duy nhất cho cả "đi trang khác" lẫn "đi bài khác". */
  const links = TABS.map((t, i) => {
    const on = t.id === cur;
    return (t.tach ? '<div class="drw-sep" role="separator"></div>' : "") +
      `<a class="drw-item${on ? " is-active" : ""}" href="${t.file}"${on ? ' aria-current="page"' : ""}>
        <span class="drw-no">${String(i + 1).padStart(2, "0")}</span><span class="drw-t">${esc(t.ten)}</span></a>` +
      (on ? '<div class="drw-sub" id="navSub" hidden></div>' : "");
  }).join("");

  $("#topbar").innerHTML =
    `<button class="nav-btn" type="button" aria-controls="siteNav" aria-expanded="false" title="Các trang">
       <span aria-hidden="true">☰</span><span class="nav-btn-t">Menu</span></button>
     <div class="crumb"><a class="crumb-site" href="index.html">DevOps Study Guide</a>${tab
       ? `<span class="crumb-sep" aria-hidden="true">/</span><span class="crumb-cur">${esc(tab.ten)}</span>` : ""}</div>
     <button class="icon-btn" id="themeToggle" type="button"></button>`;

  document.body.insertAdjacentHTML("beforeend", `
    <aside class="drawer" id="siteNav" role="dialog" aria-modal="true" aria-labelledby="siteNavTitle" inert>
      <div class="drw-head">
        <div>
          <div class="kb-eyebrow">DevOps Study Guide</div>
          <div class="drw-title" id="siteNavTitle">Các trang</div>
        </div>
        <button class="icon-btn" type="button" data-drawer-close aria-label="Đóng menu">✕</button>
      </div>
      <nav class="drw-list" aria-label="Các trang">${links}</nav>
      <div class="drw-foot" id="navFoot" hidden></div>
    </aside>`);

  /* Mọi nút có aria-controls="siteNav" (nút Menu, và nút của trang học) đều bật / tắt menu */
  document.addEventListener("click", e => {
    if (e.target.closest('[aria-controls="siteNav"]')) moDrawer($("#siteNav"), drawerMo !== $("#siteNav"));
  });
  $("#themeToggle").addEventListener("click", () => {
    S.theme = S.theme === "dark" ? "light" : "dark"; save(); applyTheme();
  });
  applyTheme();
}

renderNav();
