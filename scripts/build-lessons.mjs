#!/usr/bin/env node
/* ============================================================
   build-lessons.mjs — gói mỗi thư mục content/<series>/ thành js/series/<series>.js.

   Vì sao cần bước này: trang mở thẳng bằng file:// (không server), mà trình duyệt chặn
   fetch() file .md khi không có server. Nên nội dung viết bằng Markdown cho dễ sửa,
   rồi được gói thành một biến JS. Chỉ người SỬA nội dung cần Node; người đọc thì không.

     content/<series>/series.json   { ten, nhan, tomTat, raSoat }
     content/<series>/NN-*.md       mỗi file một bài, sắp theo tên file;
                                    đầu file là khối  ---\n key: value \n---  (bắt buộc có "ten")

   Chạy:   node scripts/build-lessons.mjs           sinh lại mọi series
           node scripts/build-lessons.mjs --check   chỉ kiểm tra file sinh ra còn khớp .md không
                                                    (thoát mã 1 nếu lệch — dùng được trong CI)
   Không dùng thư viện ngoài.
   ============================================================ */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = join(ROOT, "content");
const OUT = join(ROOT, "js", "series");
const CHECK = process.argv.includes("--check");

function docBai(file) {
  const raw = readFileSync(file, "utf8").replace(/\r\n?/g, "\n");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error(`${file}: thiếu khối --- ở đầu file`);
  const meta = {};
  for (const dong of m[1].split("\n")) {
    const kv = dong.match(/^(\w+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  if (!meta.ten) throw new Error(`${file}: thiếu "ten"`);
  return { ...meta, md: raw.slice(m[0].length).trim() + "\n" };
}

let lech = 0;
mkdirSync(OUT, { recursive: true });

for (const id of readdirSync(CONTENT).sort()) {
  const dir = join(CONTENT, id);
  if (!statSync(dir).isDirectory()) continue;

  const series = JSON.parse(readFileSync(join(dir, "series.json"), "utf8"));
  const bai = readdirSync(dir).filter(f => /^\d+.*\.md$/.test(f)).sort()
    .map((f, i) => ({ so: i + 1, file: f, ...docBai(join(dir, f)) }));

  const js = `/* SINH TỰ ĐỘNG từ content/${id}/ bởi scripts/build-lessons.mjs — đừng sửa tay.\n` +
             `   Sửa file .md rồi chạy:  node scripts/build-lessons.mjs */\n` +
             `const SERIES = ${JSON.stringify({ id, ...series, bai }, null, 1)};\n`;
  const dich = join(OUT, `${id}.js`);

  if (CHECK) {
    const khop = existsSync(dich) && readFileSync(dich, "utf8") === js;
    if (!khop) lech++;
    console.log(`${khop ? "✓" : "✗"} js/series/${id}.js${khop ? "" : " — chưa build lại sau khi sửa .md"}`);
  } else {
    writeFileSync(dich, js);
    console.log(`js/series/${id}.js — ${bai.length} bài`);
  }
}

if (lech) process.exit(1);
