/* ============================================================
   md.js — Markdown của bài học → HTML dùng đúng class của trang kiến thức
   (panel, .pts, .steps, .code, .tbl) để trang học trông như các trang khác.
   Cần nạp sau common.js (dùng esc).

   Hỗ trợ (đủ cho content/<series>/*.md, không hơn):
     ## Mục          → mỗi mục một panel có số thứ tự (do lesson.js dựng)
     ### Tiêu đề phụ
     đoạn văn, danh sách một cấp (- hoặc 1.), ```khối mã```, bảng | a | b |,
     > [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] / [!CAUTION]   (callout kiểu GitHub)
     inline: `code`, **đậm**, *nghiêng*, [chữ](https://…)
   Mọi chữ đều được escape — Markdown không chèn được HTML thô.
   ============================================================ */

const MD_CALLOUT = {
  NOTE:      { cls: "md-note",    ico: "i", ten: "Ghi chú" },
  TIP:       { cls: "md-tip",     ico: "★", ten: "Mẹo" },
  IMPORTANT: { cls: "md-imp",     ico: "!", ten: "Quan trọng" },
  WARNING:   { cls: "md-warn",    ico: "⚠", ten: "Cẩn thận" },
  CAUTION:   { cls: "md-caution", ico: "⚠", ten: "Nguy hiểm" }
};

/* "Bước 1: Cài kubectl" → "buoc-1-cai-kubectl" */
const mdSlug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/* Phần trong backtick được cất đi trước, để dấu * hay [ ] trong lệnh không bị hiểu nhầm */
function mdInline(s) {
  const code = [];
  let t = esc(s).replace(/`([^`]+)`/g, (_, c) => "\u0000" + (code.push(c) - 1) + "\u0000");
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, txt, url) =>
         /^https?:\/\//.test(url) ? `<a href="${url}" target="_blank" rel="noopener">${txt}</a>` : txt)
       .replace(/\*\*(.+?)\*\*(?!\*)/g, "<b>$1</b>")
       .replace(/(^|[^*\w])\*([^*\n]+?)\*(?![*\w])/g, "$1<i>$2</i>");
  return t.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${code[i]}</code>`);
}

/* Danh sách dòng → mảng khối { t: loại, html, inner? } */
function mdBlocks(L) {
  const out = [];
  const batDauKhoi = /^(```|>|#{3,4}\s|\s*[-*]\s+|\s*\d+\.\s+|\|)/;
  let i = 0, m;

  while (i < L.length) {
    const l = L[i];
    if (!l.trim() || /^-{3,}\s*$/.test(l)) { i++; continue; }

    /* Khối mã */
    if ((m = l.match(/^```\s*([\w+-]*)\s*$/))) {
      const buf = [];
      for (i++; i < L.length && !/^```\s*$/.test(L[i]); i++) buf.push(L[i]);
      i++;
      out.push({ t: "code", html: `<div class="md-code">` +
        (m[1] && m[1] !== "text" ? `<span class="md-lang">${esc(m[1])}</span>` : "") +
        `<button class="md-copy" type="button">Copy</button>` +
        `<pre class="code"><code>${esc(buf.join("\n"))}</code></pre></div>` });
      continue;
    }

    /* Tiêu đề phụ */
    if ((m = l.match(/^#{3,4}\s+(.+?)\s*$/))) {
      out.push({ t: "h", html: `<h3 class="md-h3">${mdInline(m[1])}</h3>` });
      i++; continue;
    }

    /* Trích dẫn / callout — nội dung bên trong được phân tích lại như Markdown thường */
    if (/^>/.test(l)) {
      const buf = [];
      while (i < L.length && /^>/.test(L[i])) buf.push(L[i++].replace(/^>\s?/, ""));
      const c = buf[0].match(/^\[!(\w+)\]\s*$/);
      const k = c && MD_CALLOUT[c[1].toUpperCase()];
      const noi = mdBlocks(k ? buf.slice(1) : buf).map(b => b.html).join("");
      out.push({ t: "quote", html: k
        ? `<div class="md-callout ${k.cls}"><span class="md-c-ico" aria-hidden="true">${k.ico}</span>` +
          `<div class="md-c-body"><b class="md-c-t">${k.ten}</b>${noi}</div></div>`
        : `<blockquote class="md-quote">${noi}</blockquote>` });
      continue;
    }

    /* Bảng: dòng tiêu đề + dòng |---| */
    if (/^\|/.test(l) && /^\|?\s*:?-{3,}/.test(L[i + 1] || "")) {
      const o = r => r.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map(x => mdInline(x.trim().replace(/\\\|/g, "|")));
      const dau = o(l), hang = [];
      for (i += 2; i < L.length && /^\|/.test(L[i]); i++) hang.push(o(L[i]));
      out.push({ t: "table", html: `<div class="tbl-wrap"><table class="tbl">` +
        `<thead><tr>${dau.map(x => `<th>${x}</th>`).join("")}</tr></thead>` +
        `<tbody>${hang.map(h => `<tr>${h.map(x => `<td>${x}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` });
      continue;
    }

    /* Danh sách một cấp; dòng thụt vào ngay sau một mục được nối vào mục đó */
    if ((m = l.match(/^\s*([-*]|\d+\.)\s+/))) {
      const ol = /\d/.test(m[1]);
      const re = ol ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/;
      const muc = [];
      for (; i < L.length && L[i].trim(); i++) {
        if (re.test(L[i])) muc.push(L[i].replace(re, ""));
        else if (/^\s+\S/.test(L[i]) && muc.length) muc[muc.length - 1] += " " + L[i].trim();
        else break;
      }
      const li = muc.map(x => `<li>${mdInline(x)}</li>`).join("");
      out.push({ t: "list", html: ol ? `<ol class="steps">${li}</ol>` : `<ul class="pts">${li}</ul>` });
      continue;
    }

    /* Đoạn văn */
    const buf = [L[i++].trim()];
    while (i < L.length && L[i].trim() && !batDauKhoi.test(L[i])) buf.push(L[i++].trim());
    const inner = mdInline(buf.join(" "));
    out.push({ t: "p", inner, html: `<p class="md-p">${inner}</p>` });
  }
  return out;
}

/* Cả bài: phần mở đầu (trước ## đầu tiên) + các mục ## */
function mdLesson(src) {
  const phan = [{ ten: null, dong: [] }];
  let trongMa = false;
  for (const l of src.replace(/\r\n?/g, "\n").split("\n")) {
    if (/^```/.test(l)) trongMa = !trongMa;
    const m = !trongMa && l.match(/^##\s+(.+?)\s*$/);
    if (m) phan.push({ ten: m[1], dong: [] });
    else phan[phan.length - 1].dong.push(l);
  }
  const daCo = {};
  const id = t => { const s = mdSlug(t) || "muc"; daCo[s] = (daCo[s] || 0) + 1; return daCo[s] > 1 ? `${s}-${daCo[s]}` : s; };
  const [moDau, ...muc] = phan;
  return {
    moDau: mdBlocks(moDau.dong),
    muc: muc.map(p => ({ id: id(p.ten), ten: p.ten, html: mdBlocks(p.dong).map(b => b.html).join("") }))
  };
}
