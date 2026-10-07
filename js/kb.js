/* ============================================================
   kb.js — dựng một trang kiến thức từ biến TRANG (js/kb/<trang>.js).
   Cần nạp sau common.js, data.js và file dữ liệu của trang.

   TRANG = {
     id, ten, tomTat,
     cvSkill: [...],                 // đúng dòng Skills tương ứng trong CV
     // nhãn tuỳ chọn (trang không bám dòng Skills, vd Case thực tế):
     // nhan (dòng nhỏ phía trên tiêu đề), nhanSkill (nhãn dải chip),
     // nhanCV (tiêu đề khung CV), mucLucCV (chữ trong mục lục)
     cv:   [{ nguon, noi }],         // các dòng CV phải bảo vệ được
     bank: ["Docker", ...],          // chuDe trong data.js để nối sang ngân hàng câu hỏi
     muc: [{                         // mỗi phần một mục, có mục lục bên trái
       id, ten,
       y:    ["ý cần nắm", ...],
       bang: { ten?, cot: [...], hang: [[...], ...] },
       ma:   { ten, noi: ["dòng 1", "dòng 2"] }   // hoặc mảng các khối như vậy
       lenh: [["lệnh", "giải thích"], ...],
       bay:  "bẫy cần tránh",                      // chuỗi hoặc mảng chuỗi
       cv:   "cách gắn với CV khi trả lời"
     }]
   }
   Trong chuỗi: `code` thành ô mã, **chữ đậm**, *chữ nghiêng*.
   ============================================================ */

/* `code`, **đậm**, *nghiêng* — phần trong backtick được cất đi trước nên dấu * trong lệnh không bị hiểu nhầm */
function fmtK(s) {
  const code = [];
  let t = esc(s).replace(/`([^`]+)`/g, (_, c) => "\u0000" + (code.push(c) - 1) + "\u0000");
  t = t.replace(/\*\*(.+?)\*\*(?!\*)/g, "<b>$1</b>")
       .replace(/(^|[^*\w])\*([^*\n]+?)\*(?![*\w])/g, "$1<i>$2</i>");
  return t.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${code[i]}</code>`);
}
const mang  = v => v == null ? [] : Array.isArray(v) ? v : [v];
const so2   = n => String(n).padStart(2, "0");
const khoi  = (ten, noi) => `<div class="blk"><div class="blk-head">${esc(ten)}</div>${noi}</div>`;

/* Các trang kiến thức = những tab đứng trước vạch ngăn */
const KT = TABS.slice(0, TABS.findIndex(t => t.tach));

function bangHTML(b) {
  return `<div class="tbl-wrap"><table class="tbl">
    <thead><tr>${b.cot.map(c => `<th>${fmtK(c)}</th>`).join("")}</tr></thead>
    <tbody>${b.hang.map(h => `<tr>${h.map(c => `<td>${fmtK(c)}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
}

function mucHTML(m) {
  let h = "";
  if (m.y)    h += khoi("Cần nắm", `<ul class="pts">${m.y.map(x => `<li>${fmtK(x)}</li>`).join("")}</ul>`);
  if (m.bang) h += khoi(m.bang.ten || "So sánh", bangHTML(m.bang));
  mang(m.ma).forEach(c => {
    h += khoi(c.ten, `<pre class="code"><code>${esc(mang(c.noi).join("\n"))}</code></pre>`);
  });
  if (m.lenh) {
    h += khoi("Lệnh / cấu hình cần thuộc", `<div class="cmds">${m.lenh.map(([c, d]) =>
      `<div class="cmd"><span class="cmd-c">${esc(c)}</span><span class="cmd-d">${fmtK(d)}</span></div>`).join("")}</div>`);
  }
  if (m.bay) {
    h += `<div class="blk">${mang(m.bay).map(b =>
      `<div class="trap"><span class="trap-ico">⚠</span><div><b>Bẫy cần tránh — </b>${fmtK(b)}</div></div>`).join("")}</div>`;
  }
  if (m.cv) {
    h += `<div class="blk"><div class="cvtip"><span class="cvtip-ico">★</span><div><b>Gắn với CV — </b>${fmtK(m.cv)}</div></div></div>`;
  }
  return h;
}

function lienQuanHTML(T) {
  const ds = (T.bank || []).map(cd => {
    const qs = QUESTIONS.filter(q => q.chuDe === cd);
    if (!qs.length) return "";
    const biet = qs.filter(q => trangThai(q.id) === "known").length;
    return `<a href="bank.html#chude=${encodeURIComponent(cd)}">${esc(cd)}
      <span class="n">${qs.length} câu · ${biet} đã thuộc</span></a>`;
  }).join("");
  if (!ds) return "";
  return `<section class="kb-sec" id="luyen"><div class="panel">
    <h2 class="section-title">Luyện lại bằng câu hỏi trong ngân hàng</h2>
    <div class="rel">${ds}</div>
  </div></section>`;
}

function pagerHTML(i) {
  const prev = KT[i - 1];
  const next = KT[i + 1] || TABS.find(t => t.tach);
  const a = (t, huong) => t
    ? `<a class="pg pg-${huong}" href="${t.file}"><span class="pg-k">${huong === "prev" ? "← Trước" : "Tiếp →"}</span><span class="pg-t">${esc(t.ten)}</span></a>`
    : "<span></span>";
  return `<nav class="pager" aria-label="Chuyển trang">${a(prev, "prev")}${a(next, "next")}</nav>`;
}

function render() {
  const root = $("#kb");
  if (typeof TRANG === "undefined") {
    root.innerHTML = `<div class="empty"><div class="empty-big">∅</div>Không tải được nội dung trang này.</div>`;
    return;
  }
  const T = TRANG;
  const i = KT.findIndex(t => t.id === T.id);

  const muc = T.muc.map((m, k) => `<section class="kb-sec" id="${esc(m.id)}">
      <h2 class="kb-h"><span class="kb-no">${so2(k + 1)}</span>${esc(m.ten)}</h2>
      <div class="panel">${mucHTML(m)}</div>
    </section>`).join("");

  const cv = `<section class="kb-sec" id="cv"><div class="panel cv-box">
      <h2 class="section-title">${esc(T.nhanCV || "Trong CV bạn đã viết — phải kể được chi tiết")}</h2>
      <ul class="cv-list">${T.cv.map(c =>
        `<li><span class="cv-src">${esc(c.nguon)}</span><p class="cv-q">${fmt(c.noi)}</p></li>`).join("")}</ul>
    </div></section>`;

  const mucLuc = [`<a class="side-link" href="#cv">${esc(T.mucLucCV || "Trong CV của bạn")}</a>`]
    .concat(T.muc.map((m, k) => `<a class="side-link" href="#${esc(m.id)}"><span class="side-no">${so2(k + 1)}</span>${esc(m.ten)}</a>`))
    .concat(T.bank && T.bank.length ? [`<a class="side-link" href="#luyen">Luyện câu hỏi</a>`] : [])
    .join("");

  root.innerHTML = `
    <header class="kb-head">
      <div class="kb-eyebrow">${esc(T.nhan || "Kiến thức theo CV")} · ${i + 1} / ${KT.length}</div>
      <h1 class="kb-title">${esc(T.ten)}</h1>
      <p class="kb-lead">${fmtK(T.tomTat)}</p>
      <div class="kb-skill-label">${esc(T.nhanSkill || "Dòng Skills trong CV")}</div>
      <div class="chips">${T.cvSkill.map(s => `<span class="chip">${esc(s)}</span>`).join("")}</div>
    </header>
    <div class="kb-layout">
      <aside class="sidebar"><nav class="side-nav" id="sideNav"><div class="side-group">
        <div class="side-head">Trong trang này</div>${mucLuc}
      </div></nav></aside>
      <div class="kb-body">${cv}${muc}${lienQuanHTML(T)}${pagerHTML(i)}</div>
    </div>`;

  /* Mục lục bên trái sáng theo phần đang đọc */
  if ("IntersectionObserver" in window) {
    const links = new Map($$(".side-link", $("#sideNav")).map(a => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.remove("is-active"));
      const l = links.get(e.target.id);
      if (l) l.classList.add("is-active");
    }), { rootMargin: "-80px 0px -65% 0px" });
    $$(".kb-sec").forEach(s => io.observe(s));
  }

  /* Liên kết sâu (cases.html#truy-cap-db-private): nội dung dựng bằng JS nên trình duyệt có thể cuộn
     trước khi mục tồn tại, hoặc bị scroll-behavior: smooth làm dở dang trên trang dài */
  if (location.hash.length > 1) {
    let id = location.hash.slice(1);
    try { id = decodeURIComponent(id); } catch (e) {}
    const el = document.getElementById(id);
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: "instant" }));
  }
}

render();
