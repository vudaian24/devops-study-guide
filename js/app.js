/* ============================================================
   app.js — render, lọc, lưu tiến độ, chế độ luyện.
   Không phụ thuộc thư viện ngoài. Mở trực tiếp index.html là chạy.
   ============================================================ */

/* ---------- Hằng số ---------- */
const PRI = {
  gap:    { nhan: "GAP",      mo: "Mình yếu — học trước",      c: "var(--gap)",    cbg: "var(--gap-bg)" },
  high:   { nhan: "HAY HỎI",  mo: "Xác suất cao — phải trôi chảy", c: "var(--high)",   cbg: "var(--high-bg)" },
  strong: { nhan: "THẾ MẠNH", mo: "Chủ động kéo về đây",       c: "var(--strong)", cbg: "var(--strong-bg)" }
};

const NHOM = {
  core:      "Kiến thức cốt lõi",
  cv:        "Đào sâu dự án trong CV",
  tinhhuong: "Tình huống & sự cố",
  hoinguoc:  "Câu hỏi bạn nên hỏi ngược"
};

const STATUS = [
  { key: "new",    ky: "○", ten: "Chưa học" },
  { key: "review", ky: "◐", ten: "Cần ôn lại" },
  { key: "known",  ky: "✓", ten: "Đã thuộc" }
];

/* Chỉ tính tiến độ trên câu mình phải học, không tính câu hỏi ngược */
const HOC = QUESTIONS.filter(q => q.nhom !== "hoinguoc");

/* ---------- Trạng thái lưu lại ---------- */
const KEY = "warroom.v1";
let S = { theme: "dark", status: {}, roadmap: {}, view: "dashboard" };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

/* Bộ lọc — không lưu, mỗi lần mở là về mặc định */
let F = { chuDe: "all", uu: "all", q: "", chuaThuoc: false, moHet: false };

/* ---------- Tiện ích ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* Bọc `...` thành <code> */
const fmt = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');

const trangThai = id => S.status[id] || "new";

/* ---------- Theme ---------- */
function applyTheme() {
  document.documentElement.setAttribute("data-theme", S.theme);
  $("#themeToggle").textContent = S.theme === "dark" ? "☀" : "☾";
  $("#themeToggle").title = S.theme === "dark" ? "Chuyển sang nền sáng" : "Chuyển sang nền tối";
}

/* ---------- Chuyển màn ---------- */
function showView(v) {
  S.view = v; save();
  $$(".view").forEach(el => el.classList.toggle("is-active", el.id === "view-" + v));
  $$(".tab").forEach(b => b.classList.toggle("is-active", b.dataset.view === v));
  if (v === "dashboard") renderDashboard();
  if (v === "practice" && !PR.queue.length) prBuild();
  window.scrollTo({ top: 0 });
}

/* ============================================================
   MÀN 1 — TỔNG QUAN
   ============================================================ */
function renderDashboard() {
  /* Độ khớp CV ↔ JD */
  $("#matchList").innerHTML = MATCH.map(m => {
    const p = PRI[m.loai];
    return `<div class="match-row" style="--c:${p.c}">
      <div class="match-name">${esc(m.ten)}</div>
      <div class="bar"><i style="width:${m.muc}%"></i></div>
      <div class="match-tag">${esc(m.nhan)}</div>
    </div>`;
  }).join("");

  /* Ba rủi ro */
  $("#riskList").innerHTML = RISKS.map(r => `
    <div class="risk-card">
      <div class="risk-no">${esc(r.so)}</div>
      <div>
        <div class="risk-ten">${esc(r.ten)}</div>
        <p class="risk-noi">${fmt(r.noi)}</p>
      </div>
    </div>`).join("");

  /* Tiến độ */
  const dem = { new: 0, review: 0, known: 0 };
  HOC.forEach(q => dem[trangThai(q.id)]++);
  const pct = Math.round(dem.known / HOC.length * 100);
  const gapChuaThuoc = HOC.filter(q => q.uu === "gap" && trangThai(q.id) !== "known").length;

  $("#progressBox").innerHTML = `
    <div class="stat-big">${dem.known} <span style="font-size:19px;color:var(--muted);font-weight:500">/ ${HOC.length}</span></div>
    <div class="stat-sub">câu đã thuộc${gapChuaThuoc ? ` · còn <b style="color:var(--gap)">${gapChuaThuoc} câu 🔴 chưa xong</b>` : " · đã xong hết câu 🔴"}</div>
    <div class="progress-track"><i style="width:${pct}%"></i></div>
    <div class="legend">
      <div><span class="dot" style="--c:var(--strong)"></span> Đã thuộc <b>${dem.known}</b></div>
      <div><span class="dot" style="--c:var(--high)"></span> Cần ôn lại <b>${dem.review}</b></div>
      <div><span class="dot" style="--c:var(--muted)"></span> Chưa học <b>${dem.new}</b></div>
    </div>`;

  /* Lộ trình */
  $("#roadmapList").innerHTML = ROADMAP.map((r, i) => {
    const done = !!S.roadmap[i];
    return `<label class="rm-item ${done ? "done" : ""}">
      <input type="checkbox" data-rm="${i}" ${done ? "checked" : ""}>
      <div style="flex:1">
        <div class="rm-ten" style="color:${done ? "" : PRI[r.uu].c}">${esc(r.ten)}</div>
        <div class="rm-ghi">${esc(r.ghi)}</div>
      </div>
      <span class="rm-gio">${esc(r.gio)}</span>
    </label>`;
  }).join("");

  $("#ruleList").innerHTML = RULES.map(r => `<li>${fmt(r)}</li>`).join("");
  $("#frameworkList").innerHTML = FRAMEWORK.map(f => `<li>${fmt(f)}</li>`).join("");
}

/* ============================================================
   MÀN 2 — NGÂN HÀNG CÂU HỎI
   ============================================================ */
function locCauHoi() {
  const q = F.q.trim().toLowerCase();
  return QUESTIONS.filter(x => {
    if (F.chuDe !== "all" && x.chuDe !== F.chuDe) return false;
    if (F.uu !== "all" && x.uu !== F.uu) return false;
    if (F.chuaThuoc && trangThai(x.id) === "known") return false;
    if (q) {
      const kho = (x.ch + " " + x.chuDe + " " + x.tk.join(" ") + " " + x.dy.join(" ") + " " + (x.bay || "")).toLowerCase();
      if (!kho.includes(q)) return false;
    }
    return true;
  });
}

function renderSidebar() {
  const nhoms = {};
  QUESTIONS.forEach(q => {
    (nhoms[q.nhom] = nhoms[q.nhom] || {});
    nhoms[q.nhom][q.chuDe] = (nhoms[q.nhom][q.chuDe] || 0) + 1;
  });

  let html = `<div class="side-group">
    <button class="side-link ${F.chuDe === "all" ? "is-active" : ""}" data-chude="all">
      Tất cả chủ đề <span class="side-count">${QUESTIONS.length}</span>
    </button></div>`;

  for (const [nk, chuDes] of Object.entries(nhoms)) {
    html += `<div class="side-group"><div class="side-head">${esc(NHOM[nk])}</div>`;
    for (const [cd, n] of Object.entries(chuDes)) {
      const conLai = QUESTIONS.filter(q => q.chuDe === cd && trangThai(q.id) !== "known").length;
      html += `<button class="side-link ${F.chuDe === cd ? "is-active" : ""}" data-chude="${esc(cd)}">
        ${esc(cd)} <span class="side-count">${conLai ? conLai + "/" + n : "✓ " + n}</span>
      </button>`;
    }
    html += `</div>`;
  }
  $("#sideNav").innerHTML = html;
}

function cardHTML(q) {
  const p = PRI[q.uu];
  const tt = trangThai(q.id);
  const open = F.moHet;

  const nutTT = STATUS.map(s =>
    `<button data-status="${q.id}" data-s="${s.key}" class="${tt === s.key ? "on" : ""}" title="${s.ten}">${s.ky}</button>`
  ).join("");

  const laHoiNguoc = q.nhom === "hoinguoc";

  return `<article class="card ${open ? "is-open" : ""}" style="--c:${p.c};--c-bg:${p.cbg}" data-id="${q.id}">
    <div class="card-head">
      <div class="card-main">
        <div class="card-meta">
          <span class="pri" title="${p.mo}">${p.nhan}</span>
          <span class="topic">${esc(q.chuDe)}</span>
          <span class="qid">#${esc(q.id)}</span>
        </div>
        <p class="card-q">${fmt(q.ch)}</p>
      </div>
      <div class="status-set">${nutTT}</div>
      <span class="chev">▼</span>
    </div>
    <div class="card-body">
      <div class="blk">
        <div class="blk-head">${laHoiNguoc ? "Nghe gì trong câu trả lời của họ" : "Từ khoá phải nói"}</div>
        <div class="chips">${q.tk.map(t => `<span class="chip">${esc(t)}</span>`).join("")}</div>
      </div>
      <div class="blk">
        <div class="blk-head">${laHoiNguoc ? "Vì sao nên hỏi" : "Dàn ý trả lời"}</div>
        <ol class="steps">${q.dy.map(d => `<li>${fmt(d)}</li>`).join("")}</ol>
      </div>
      ${q.bay ? `<div class="blk"><div class="trap">
        <span class="trap-ico">⚠</span><div><b>Bẫy cần tránh — </b>${fmt(q.bay)}</div>
      </div></div>` : ""}
    </div>
  </article>`;
}

function renderCards() {
  const ds = locCauHoi();
  const box = $("#cardList");

  if (!ds.length) {
    box.innerHTML = `<div class="empty"><div class="empty-big">∅</div>
      Không có câu nào khớp bộ lọc.<br>Thử bỏ bớt điều kiện hoặc xoá ô tìm kiếm.</div>`;
  } else {
    box.innerHTML = ds.map(cardHTML).join("");
  }

  const dem = { gap: 0, high: 0, strong: 0 };
  ds.forEach(q => dem[q.uu]++);
  $("#resultLine").innerHTML =
    `Hiện <b>${ds.length}</b> / ${QUESTIONS.length} câu` +
    (ds.length ? ` — <span style="color:var(--gap)">${dem.gap} gap</span> · <span style="color:var(--high)">${dem.high} hay hỏi</span> · <span style="color:var(--strong)">${dem.strong} thế mạnh</span>` : "");

  renderSidebar();
}

/* ============================================================
   MÀN 3 — CHẾ ĐỘ LUYỆN
   ============================================================ */
const PR = { queue: [], i: 0, t0: 0, tick: null, uuTien: true, tronDeu: true };

function prBuild() {
  let ds = QUESTIONS.filter(q => q.nhom !== "hoinguoc");

  if (PR.tronDeu) {
    for (let i = ds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ds[i], ds[j]] = [ds[j], ds[i]];
    }
  }
  if (PR.uuTien) {
    const diem = q => (q.uu === "gap" ? 0 : q.uu === "high" ? 1 : 2) + (trangThai(q.id) === "known" ? 3 : 0);
    ds.sort((a, b) => diem(a) - diem(b));
  }
  PR.queue = ds;
  PR.i = 0;
  prShow();
}

function prShow() {
  const q = PR.queue[PR.i];
  if (!q) return;
  const p = PRI[q.uu];

  $("#prStage").style.setProperty("--c", p.c);
  $("#prStage").style.setProperty("--c-bg", p.cbg);
  $("#prCount").textContent = `Câu ${PR.i + 1} / ${PR.queue.length}`;
  $("#prMeta").innerHTML =
    `<span class="pri" style="--c:${p.c};--c-bg:${p.cbg}">${p.nhan}</span>
     <span class="topic">${esc(q.chuDe)}</span> <span class="qid">#${esc(q.id)}</span>`;
  $("#prQ").innerHTML = fmt(q.ch);

  $("#prBody").innerHTML = `
    <div class="blk"><div class="blk-head">Từ khoá phải nói</div>
      <div class="chips">${q.tk.map(t => `<span class="chip">${esc(t)}</span>`).join("")}</div></div>
    <div class="blk"><div class="blk-head">Dàn ý trả lời</div>
      <ol class="steps">${q.dy.map(d => `<li>${fmt(d)}</li>`).join("")}</ol></div>
    ${q.bay ? `<div class="blk"><div class="trap"><span class="trap-ico">⚠</span>
      <div><b>Bẫy cần tránh — </b>${fmt(q.bay)}</div></div></div>` : ""}
    <div class="pr-actions" style="margin-top:20px">
      ${STATUS.map(s => `<button class="btn btn-ghost" data-prstatus="${s.key}"
        style="${trangThai(q.id) === s.key ? "border-color:var(--accent);color:var(--accent)" : ""}">${s.ky} ${s.ten}</button>`).join("")}
    </div>`;
  $("#prBody").hidden = true;
  $("#prReveal").textContent = "Hiện gợi ý";
  prTimerReset();
}

function prTimerReset() {
  clearInterval(PR.tick);
  PR.t0 = Date.now();
  const el = $("#prTimer");
  const ve = () => {
    const s = Math.floor((Date.now() - PR.t0) / 1000);
    el.textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
    el.className = "pr-timer" + (s >= 120 ? " over" : s >= 90 ? " warn" : "");
  };
  ve();
  PR.tick = setInterval(ve, 1000);
}

function prNext(buoc = 1) {
  PR.i = (PR.i + buoc + PR.queue.length) % PR.queue.length;
  prShow();
}

/* ============================================================
   GẮN SỰ KIỆN
   ============================================================ */
function bind() {
  /* Tab + theme */
  $$(".tab").forEach(b => b.addEventListener("click", () => showView(b.dataset.view)));
  $("#themeToggle").addEventListener("click", () => {
    S.theme = S.theme === "dark" ? "light" : "dark"; save(); applyTheme();
  });

  /* Lộ trình */
  $("#roadmapList").addEventListener("change", e => {
    const i = e.target.dataset.rm;
    if (i === undefined) return;
    S.roadmap[i] = e.target.checked; save(); renderDashboard();
  });

  /* Sidebar */
  $("#sideNav").addEventListener("click", e => {
    const b = e.target.closest("[data-chude]");
    if (!b) return;
    F.chuDe = b.dataset.chude; renderCards();
  });

  /* Toolbar */
  $("#searchInput").addEventListener("input", e => { F.q = e.target.value; renderCards(); });
  $("#segUu").addEventListener("click", e => {
    const b = e.target.closest("[data-uu]");
    if (!b) return;
    F.uu = b.dataset.uu;
    $$("#segUu button").forEach(x => x.classList.toggle("is-active", x === b));
    renderCards();
  });
  $("#chkChuaThuoc").addEventListener("change", e => { F.chuaThuoc = e.target.checked; renderCards(); });
  $("#btnMoHet").addEventListener("click", () => {
    F.moHet = !F.moHet;
    $("#btnMoHet").textContent = F.moHet ? "Thu gọn hết" : "Mở hết";
    renderCards();
  });

  /* Card: mở/đóng + đổi trạng thái */
  $("#cardList").addEventListener("click", e => {
    const nut = e.target.closest("[data-status]");
    if (nut) {
      e.stopPropagation();
      S.status[nut.dataset.status] = nut.dataset.s; save();
      const set = nut.parentElement;
      $$("button", set).forEach(b => b.classList.toggle("on", b === nut));
      renderSidebar();
      return;
    }
    const head = e.target.closest(".card-head");
    if (head) head.parentElement.classList.toggle("is-open");
  });

  /* Luyện tập */
  $("#prReveal").addEventListener("click", () => {
    const b = $("#prBody");
    b.hidden = !b.hidden;
    $("#prReveal").textContent = b.hidden ? "Hiện gợi ý" : "Ẩn gợi ý";
  });
  $("#prNext").addEventListener("click", () => prNext(1));
  $("#prPrev").addEventListener("click", () => prNext(-1));
  $("#prShuffle").addEventListener("click", prBuild);
  $("#prUuTien").addEventListener("change", e => { PR.uuTien = e.target.checked; prBuild(); });
  $("#prTron").addEventListener("change", e => { PR.tronDeu = e.target.checked; prBuild(); });
  $("#prBody").addEventListener("click", e => {
    const b = e.target.closest("[data-prstatus]");
    if (!b) return;
    S.status[PR.queue[PR.i].id] = b.dataset.prstatus; save();
    $$("[data-prstatus]", $("#prBody")).forEach(x =>
      x.style.cssText = x === b ? "border-color:var(--accent);color:var(--accent)" : "");
  });

  /* Phím tắt trong chế độ luyện */
  document.addEventListener("keydown", e => {
    if (S.view !== "practice") return;
    if (/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.code === "Space")      { e.preventDefault(); $("#prReveal").click(); }
    if (e.key === "ArrowRight")  { e.preventDefault(); prNext(1); }
    if (e.key === "ArrowLeft")   { e.preventDefault(); prNext(-1); }
  });
}

/* ---------- Khởi động ---------- */
applyTheme();
bind();
renderCards();
showView(S.view || "dashboard");
