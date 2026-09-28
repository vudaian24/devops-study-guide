# Interview War Room

Bộ ôn phỏng vấn vị trí **DevOps Engineer** (JD: Linux/Windows Server, GitLab CI/CD, Docker,
Monitoring, Backup/DR, IaC — 25–35 triệu, Long Biên).

## Mở như thế nào

Nhấp đúp vào `index.html`, hoặc:

```bash
xdg-open index.html
```

Không cần server, không cần cài gì, chạy được offline.

## Ba màn hình

| Màn | Dùng khi nào |
|---|---|
| **Tổng quan** | Mở đầu mỗi buổi ôn — xem chỗ nào đang hổng và học gì trước |
| **Ngân hàng câu hỏi** | Ôn theo chủ đề, lọc theo mức ưu tiên, đánh dấu đã thuộc |
| **Luyện tập** | Trước ngày phỏng vấn — một câu một lần, tự trả lời thành tiếng, bấm giờ |

Nghe thay vì đọc: bấm 🔊 trên từng thẻ, hoặc bật **Chế độ rảnh tay** ở màn Luyện tập.

## Cách dùng hiệu quả

1. **Đọc câu hỏi trước, tự trả lời trong đầu (hoặc nói thành tiếng), rồi mới bấm mở gợi ý.**
   Đáp án bị ẩn mặc định là có chủ ý — đọc hiểu không đồng nghĩa với nói được.
2. Đánh dấu `○ chưa học` / `◐ cần ôn` / `✓ đã thuộc` cho từng câu.
   Vòng ôn sau bật **"Chỉ câu chưa thuộc"** để không đọc lại thứ đã nắm.
3. Ưu tiên theo màu: 🔴 **gap** học trước, 🟠 **hay hỏi** phải trôi chảy, 🟢 **thế mạnh** chủ động kéo về.
4. Vào **Luyện tập**, bật "Ưu tiên câu 🔴", tập nói trong vòng 2 phút mỗi câu.

Tiến độ lưu trong `localStorage` của trình duyệt — đóng mở lại vẫn còn,
nhưng **không đồng bộ giữa các máy** và sẽ mất nếu bạn xoá dữ liệu duyệt web.

## Nghe thay vì đọc

Trang dùng Web Speech API có sẵn trong trình duyệt — không backend, không API key,
chạy được cả khi offline miễn là máy có giọng đọc.

- **Nút 🔊 trên mỗi thẻ** — thẻ đang đóng thì chỉ đọc câu hỏi, thẻ mở thì đọc cả gợi ý.
  Giữ đúng nguyên tắc tự trả lời trước khi xem đáp án.
- **Chế độ rảnh tay** (màn Luyện tập) — đọc câu hỏi → im lặng cho bạn trả lời thành tiếng
  → đọc gợi ý → tự sang câu tiếp, lặp mãi cho tới khi bạn bấm dừng. Dùng được khi đang
  đi đường, nấu cơm hay tập thể dục.
- **Tự đọc khi sang câu mới** — bật lên thì mỗi lần bấm "Câu tiếp" là máy đọc luôn.
- Nút 🔊 trên thanh trên mở phần chọn **giọng** và **tốc độ**; lựa chọn được ghi nhớ.

### Cài giọng tiếng Việt

| Máy | Cách làm |
|---|---|
| **Android** | Cài *Google Text-to-speech*, vào Cài đặt → Ngôn ngữ → Đầu ra TTS, tải gói tiếng Việt |
| **iPhone** | Cài đặt → Trợ năng → Nội dung nói → Giọng nói → Tiếng Việt |
| **Linux** | `sudo apt install speech-dispatcher espeak-ng` rồi mở lại trình duyệt |
| **Windows** | Settings → Time & language → Speech → Add voices → Vietnamese |

Máy chưa có giọng nào, hoặc có giọng nhưng không có tiếng Việt, thì thanh âm thanh
sẽ hiện lời nhắc kèm hướng dẫn thay vì đọc sai.

Giọng trên điện thoại (Google, Apple) nghe tự nhiên hơn hẳn giọng máy espeak-ng
trên Linux. Dù vậy, thuật ngữ tiếng Anh xen trong câu tiếng Việt — `CrashLoopBackOff`,
`pg_stat_statements` — giọng nào đọc cũng méo. Phần đọc hợp để **ôn lại và nhớ ý**,
không thay được việc đọc bằng mắt lần đầu.

## Thêm hoặc sửa câu hỏi

Chỉ sửa `js/data.js`, không cần đụng vào HTML. Mỗi câu là một object:

```js
{
  id: "G10",                    // mã ngắn, không trùng
  nhom: "core",                 // core | cv | tinhhuong | hoinguoc
  chuDe: "GitLab CI",           // tự sinh ra mục lục bên sidebar
  uu: "gap",                    // gap (đỏ) | high (cam) | strong (xanh)
  ch: "Câu hỏi…",
  tk: ["từ khoá phải nói", "…"],
  dy: ["ý thứ nhất", "ý thứ hai"],
  bay: "Bẫy cần tránh…"         // tuỳ chọn, bỏ trống cũng được
}
```

Bọc lệnh bằng dấu backtick — ví dụ `` `kubectl logs --previous` `` — sẽ tự render thành ô mã.

Muốn sửa thanh **độ khớp CV ↔ JD**, ba **rủi ro**, hay **lộ trình ôn**: sửa các mảng
`MATCH`, `RISKS`, `ROADMAP` ở đầu cùng file.

## In ra giấy

`Ctrl/Cmd + P`. Bản in tự mở hết đáp án, bỏ mọi nút bấm và chuyển sang nền trắng chữ đen.

## Cấu trúc

```
interview-prep/
├── index.html      khung trang
├── css/style.css   giao diện, dark/light, responsive, bản in
├── js/data.js      toàn bộ nội dung — sửa ở đây
├── js/tts.js       đọc thành tiếng (Web Speech API)
└── js/app.js       lọc, tìm kiếm, lưu tiến độ, chế độ luyện
```
