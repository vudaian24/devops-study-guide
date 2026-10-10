/* ============================================================
   lesson.js — dựng trang học theo series (vd k8s-co-ban.html) từ biến SERIES
   (js/series/<id>.js, sinh từ content/<id>/*.md bằng scripts/build-lessons.mjs).
   Cần nạp sau common.js, data.js, md.js và file series.

   Bố cục giống trang kiến thức (kb-head, mục lục trái, panel từng mục, pager).
   Khác ở chỗ — để ít xao nhãng khi học:
   - Danh sách bài KHÔNG nằm thành dải tab: nó nằm ngay trong menu các trang (common.js),
     lồng dưới mục của trang này — một menu duy nhất. Mở bằng nút Menu, nút nổi "Bài n/N"
     khi đã cuộn xuống, hoặc phím M.
   - Chế độ tập trung (nút ⤢ trên thanh trên, cạnh nút đổi nền, hoặc phím F): ẩn mục lục
     và dải chip, thu hẹp cột chữ; thanh trên vẫn giữ để còn nút Menu / thoát tập trung.
   - ← / → sang bài trước / sau, Esc đóng ngăn kéo hoặc thoát tập trung.
   Mỗi bài có địa chỉ riêng: k8s-co-ban.html#bai-3, hoặc #bai-3/<id-mục> để nhảy tới một mục.
   Tiến độ (bài đã học, bài đang đọc) và chế độ tập trung lưu chung vào S (common.js).
   ============================================================ */

const SE = SERIES;
const TONG = SE.bai.length;
S.series = S.series || {};
const TD = S.series[SE.id] = Object.assign({ done: [], last: 1 }, S.series[SE.id]);   // tiến độ của series này

let cur = 0;          // số thứ tự bài đang mở (1…TONG)
let ioMuc = null;     // IntersectionObserver làm sáng mục lục

const daHoc = n => TD.done.includes(n);
const so2   = n => String(n).padStart(2, "0");

/* "#bai-3/buoc-2" → { n: 3, muc: "buoc-2" } */
function docHash() {
  let h = location.hash.slice(1);
  try { h = decodeURIComponent(h); } catch (e) {}
  const m = h.match(/^bai-(\d+)(?:\/(.+))?$/);
  const n = m ? +m[1] : 0;
  return n >= 1 && n <= TONG ? { n, muc: m[2] || "" } : { n: 0, muc: "" };
}

/* ---------- Khung trang: dựng một lần ---------- */
function dungKhung() {
  document.body.insertAdjacentHTML("beforeend", `
    <div class="lsn-prog" aria-hidden="true"><span id="lsnProg"></span></div>
    <button class="lsn-fab" id="lsnFab" type="button" aria-controls="siteNav" aria-expanded="false"
      title="Menu và danh sách bài (M)" aria-label="Mở menu và danh sách bài"></button>`);

  /* Nút chế độ tập trung trên thanh trên, cạnh nút đổi nền */
  $("#themeToggle").insertAdjacentHTML("beforebegin",
    '<button class="icon-btn" id="focusToggle" type="button" data-focus aria-pressed="false"></button>');

  /* Danh sách bài nằm ngay trong menu các trang (common.js), dưới mục của trang này */
  $(`#siteNav .drw-item[aria-current="page"]`).classList.replace("is-active", "is-parent");
  $("#navSub").hidden = false;
  $("#navFoot").hidden = false;
  $("#navFoot").innerHTML = `
    <button class="btn btn-ghost drw-focus" type="button" data-focus></button>
    <div class="drw-keys"><kbd>M</kbd> menu · <kbd>F</kbd> tập trung · <kbd>←</kbd><kbd>→</kbd> đổi bài · <kbd>Esc</kbd> đóng</div>`;
}

/* ---------- Danh sách bài trong menu ---------- */
function veNganKeo() {
  $("#navSub").innerHTML =
    `<div class="drw-sub-head">${TONG} bài · ${TD.done.length} đã học</div>` +
    SE.bai.map(b => {
      const on = b.so === cur;
      return `<a class="drw-item${on ? " is-active" : ""}${daHoc(b.so) ? " is-done" : ""}" href="#bai-${b.so}"${on ? ' aria-current="step"' : ""}>
        <span class="drw-no">${so2(b.so)}</span>
        <span class="drw-t">${esc(b.ten)}${b.thoiGian ? `<span class="drw-meta">${esc(b.thoiGian)}</span>` : ""}</span>
        <span class="drw-check" aria-label="${daHoc(b.so) ? "đã học" : "chưa học"}">${daHoc(b.so) ? "✓" : ""}</span>
      </a>`;
    }).join("");
  const nhan = S.focus ? "Thoát chế độ tập trung (F)" : "Chế độ tập trung (F)";
  $$("[data-focus]").forEach(b => {
    b.setAttribute("aria-pressed", S.focus ? "true" : "false");
    if (b.classList.contains("icon-btn")) { b.textContent = S.focus ? "⤡" : "⤢"; b.title = nhan; b.setAttribute("aria-label", nhan); }
    else b.textContent = (S.focus ? "⤡ " : "⤢ ") + nhan.replace(" (F)", "");
  });
}

/* Mở / đóng bằng moDrawer của common.js */
const dangMo = () => drawerMo === $("#siteNav");
const moNganKeo = mo => moDrawer($("#siteNav"), mo);

/* ---------- Chế độ tập trung ---------- */
function datTapTrung(on) {
  S.focus = on; save();
  document.documentElement.classList.toggle("is-focus", on);
  veNganKeo();
}

/* ---------- Một bài ---------- */
function lienQuan(b) {
  const ds = (b.bank || "").split(",").map(s => s.trim()).filter(Boolean).map(cd => {
    const qs = QUESTIONS.filter(q => q.chuDe === cd);
    if (!qs.length) return "";
    const biet = qs.filter(q => trangThai(q.id) === "known").length;
    return `<a href="bank.html#chude=${encodeURIComponent(cd)}">${esc(cd)}
      <span class="n">${qs.length} câu · ${biet} đã thuộc</span></a>`;
  }).join("");
  return ds ? `<section class="kb-sec" id="luyen"><div class="panel">
      <h2 class="section-title">Luyện lại bằng câu hỏi trong ngân hàng</h2>
      <div class="rel">${ds}</div>
    </div></section>` : "";
}

function pager(n) {
  const a = (b, huong) => b
    ? `<a class="pg pg-${huong}" href="#bai-${b.so}"><span class="pg-k">${huong === "prev" ? "← Bài trước" : "Bài tiếp →"}</span><span class="pg-t">${esc(b.ten)}</span></a>`
    : "<span></span>";
  return `<nav class="pager" aria-label="Chuyển bài">${a(SE.bai[n - 2], "prev")}${a(SE.bai[n], "next")}</nav>`;
}

function veBai(n) {
  const b = SE.bai[n - 1];
  const B = mdLesson(b.md);
  cur = n; TD.last = n; save();

  /* Đoạn đầu tiên làm lời dẫn; phần còn lại của phần mở đầu vào khung "Mục tiêu bài học" */
  const coLead = B.moDau[0] && B.moDau[0].t === "p";
  const lead = coLead ? B.moDau[0].inner : "";
  const moDau = (coLead ? B.moDau.slice(1) : B.moDau).map(x => x.html).join("");
  const chips = (b.chip || "").split(",").map(s => s.trim()).filter(Boolean);

  const mucTieu = moDau ? `<section class="kb-sec" id="muc-tieu"><div class="panel cv-box">
      <h2 class="section-title">Mục tiêu bài học</h2>
      <div class="md-body md-intro">${moDau}</div>
    </div></section>` : "";

  const muc = B.muc.map((m, k) => `<section class="kb-sec" id="${m.id}">
      <h2 class="kb-h"><span class="kb-no">${so2(k + 1)}</span>${esc(m.ten)}</h2>
      <div class="panel md-body">${m.html}</div>
    </section>`).join("");

  const mucLuc = (mucTieu ? [`<a class="side-link" href="#bai-${n}/muc-tieu">Mục tiêu bài học</a>`] : [])
    .concat(B.muc.map((m, k) => `<a class="side-link" href="#bai-${n}/${m.id}"><span class="side-no">${so2(k + 1)}</span>${esc(m.ten)}</a>`))
    .concat(b.bank ? [`<a class="side-link" href="#bai-${n}/luyen">Luyện câu hỏi</a>`] : [])
    .join("");

  $("#kb").innerHTML = `
    <header class="kb-head" id="lsnHead">
      <h1 class="kb-title">${esc(b.ten)}</h1>
      ${lead ? `<p class="kb-lead">${lead}</p>` : ""}
      ${chips.length ? `<div class="kb-skill-label">Công cụ và khái niệm trong bài</div>
        <div class="chips">${chips.map(s => `<span class="chip">${esc(s)}</span>`).join("")}</div>` : ""}
    </header>
    <div class="kb-layout">
      <aside class="sidebar"><nav class="side-nav" id="sideNav"><div class="side-group">
        <div class="side-head">Trong bài này</div>${mucLuc}
      </div></nav></aside>
      <div class="kb-body">
        ${mucTieu}${muc}${lienQuan(b)}
        <div class="lsn-done-row">
          <button class="btn lsn-done${daHoc(n) ? " is-on" : ""}" type="button" data-done aria-pressed="${daHoc(n)}">
            ${daHoc(n) ? "✓ Đã học bài này" : "Đánh dấu đã học"}</button>
        </div>
        ${pager(n)}
      </div>
    </div>`;

  $("#lsnFab").textContent = `Bài ${n}/${TONG}`;
  document.title = `Bài ${n}: ${b.ten} · ${SE.nhan || SE.ten} · DevOps Study Guide`;
  veNganKeo();
  theoDoiMuc();
  theoDoiDauBai();
}

/* ---------- Mục lục trái sáng theo mục đang đọc (như kb.js) ---------- */
function theoDoiMuc() {
  if (ioMuc) ioMuc.disconnect();
  if (!("IntersectionObserver" in window)) return;
  const links = new Map($$(".side-link", $("#sideNav")).map(a => [a.getAttribute("href").split("/")[1], a]));
  ioMuc = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(l => l.classList.remove("is-active"));
    const l = links.get(e.target.id);
    if (l) l.classList.add("is-active");
  }), { rootMargin: "-80px 0px -65% 0px" });
  $$(".kb-sec").forEach(s => ioMuc.observe(s));
}

/* ---------- Nút nổi "Bài n/N" chỉ hiện khi đầu bài đã cuộn khỏi màn hình ---------- */
let ioDau = null;
function theoDoiDauBai() {
  if (ioDau) ioDau.disconnect();
  if (!("IntersectionObserver" in window)) { $("#lsnFab").classList.add("is-shown"); return; }
  ioDau = new IntersectionObserver(([e]) => $("#lsnFab").classList.toggle("is-shown", !e.isIntersecting));
  ioDau.observe($("#lsnHead"));
}

function cuonToi(id) {
  const el = id && document.getElementById(id);
  if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: "instant" }));
  else window.scrollTo({ top: 0, behavior: "instant" });
}

/* ---------- Điều hướng theo hash ---------- */
function theoHash() {
  const h = docHash();
  const n = h.n || TD.last || 1;
  if (!h.n) history.replaceState(null, "", `#bai-${n}`);
  if (n !== cur) veBai(n);
  moNganKeo(false);
  cuonToi(h.muc);
}

const sangBai = n => { if (n >= 1 && n <= TONG) location.hash = `bai-${n}`; };

/* ---------- Sự kiện ---------- */
function ganSuKien() {
  window.addEventListener("hashchange", theoHash);

  document.addEventListener("click", e => {
    const t = e.target.closest("[data-focus], [data-done], .md-copy, .side-link, #navSub .drw-item");
    if (!t) return;
    if (t.matches(".drw-item")) moNganKeo(false);   // đổi bài do hashchange lo; bấm lại bài đang mở thì chỉ đóng
    else if (t.matches("[data-focus]")) datTapTrung(!S.focus);
    else if (t.matches("[data-done]")) {
      TD.done = daHoc(cur) ? TD.done.filter(x => x !== cur) : TD.done.concat(cur).sort((a, b) => a - b);
      save();
      t.classList.toggle("is-on", daHoc(cur));
      t.setAttribute("aria-pressed", daHoc(cur));
      t.textContent = daHoc(cur) ? "✓ Đã học bài này" : "Đánh dấu đã học";
      veNganKeo();
    }
    else if (t.matches(".md-copy")) {
      const code = t.parentElement.querySelector("code").textContent;
      const xong = ok => { t.textContent = ok ? "Đã copy" : "Không copy được"; setTimeout(() => t.textContent = "Copy", 1400); };
      navigator.clipboard ? navigator.clipboard.writeText(code).then(() => xong(true), () => xong(false)) : xong(false);
    }
    else if (t.matches(".side-link")) {
      /* Cuộn trong bài mà không tạo thêm mục lịch sử — nút Back vẫn quay về bài trước */
      e.preventDefault();
      const id = t.getAttribute("href").split("/")[1];
      history.replaceState(null, "", t.getAttribute("href"));
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  });

  document.addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;

    if (e.defaultPrevented) return;          // Esc / Tab trong ngăn kéo đã được common.js xử lý
    if (drawerMo) {
      if (dangMo() && e.key.toLowerCase() === "m") { e.preventDefault(); moNganKeo(false); }
      return;
    }
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === "m") { e.preventDefault(); moNganKeo(true); }
    else if (k === "f") { e.preventDefault(); datTapTrung(!S.focus); }
    else if (k === "ArrowLeft")  sangBai(cur - 1);
    else if (k === "ArrowRight") sangBai(cur + 1);
    else if (k === "Escape" && S.focus) datTapTrung(false);
  });

  /* Vạch tiến độ đọc của bài */
  const prog = $("#lsnProg");
  const ve = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    prog.style.width = (max > 0 ? Math.min(100, scrollY / max * 100) : 0) + "%";
  };
  addEventListener("scroll", ve, { passive: true });
  addEventListener("resize", ve);
}

dungKhung();
ganSuKien();
document.documentElement.classList.toggle("is-focus", !!S.focus);
theoHash();
