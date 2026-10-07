# DevOps Study Guide

Bộ ôn tập kiến thức cho vị trí **DevOps Engineer** (JD: Linux/Windows Server, GitLab CI/CD, Docker,
Monitoring, Backup/DR, IaC — 25–35 triệu, Long Biên).

Nội dung kiến thức bám **đúng CV** (`cv-devops.pdf`): mỗi dòng trong phần *Skills* là một trang riêng,
kèm các dòng CV mà bạn phải bảo vệ được khi bị hỏi sâu.

## Mở như thế nào

Nhấp đúp vào `index.html`, hoặc:

```bash
open index.html          # macOS (Linux: xdg-open)
```

Không cần server, không cần build, chạy được offline. Cũng deploy thẳng lên GitHub Pages được
(có `.nojekyll`, mọi trang đều `noindex`).

## Mười trang

Mỗi tab là **một file HTML riêng**; thanh tab ở đầu trang dùng chung.

| Tab | File | Nội dung |
|---|---|---|
| Container & K8s | `index.html` | Docker, Compose, Kubernetes, Helm, kubectl |
| CI/CD | `cicd.html` | Jenkins, GitLab CI, GitHub Actions, Liquibase |
| IaC & Script | `iac.html` | Terraform, Bash, Python, jq |
| Linux & On-prem | `linux.html` | Linux, systemd, Nginx, SSH hardening, Proxmox |
| AWS | `aws.html` | VPC, ECS Fargate, EKS, Aurora/ElastiCache, CloudFront/WAF/S3, SQS/SES, IAM/Secrets Manager/Cognito, Backup, Bedrock |
| Monitoring | `monitoring.html` | CloudWatch Logs, Grafana, cảnh báo |
| Database | `database.html` | PostgreSQL, MySQL, MongoDB, Redis, migration, backup/HA |
| **Case thực tế** | `cases.html` | 16 tình huống DevOps thật: multi-tenant, migration schema, cutover hệ thống, truy cập DB trong private network, rollout/rollback ECS, phát hành SPA, OOMKilled, SSRF, lộ/xoay secret, restore một tenant, chi phí AWS, và **zero-downtime cho FE + BE** trên ECS Fargate / EKS / on-prem (cơ chế chung, từng nền tảng, kiểm chứng bằng tải) |
| **Debug sự cố** | `incident.html` | Khung xử lý sự cố production + 10 kịch bản: 5xx sau deploy, hệ thống chậm, database quá tải, pod Kubernetes không lên, ECS task bị dừng, đầy đĩa, mạng / DNS, chứng chỉ hết hạn, hàng đợi SQS ùn, rò rỉ tài nguyên; kèm cách viết postmortem |
| Ngân hàng câu hỏi | `bank.html` | 91 câu hỏi có gợi ý ẩn, lọc theo chủ đề / ưu tiên, đánh dấu đã thuộc |

Cuối mỗi trang kiến thức có liên kết **“Luyện lại bằng câu hỏi”** nhảy thẳng tới đúng chủ đề trong ngân hàng
(`bank.html#chude=<tên chủ đề>`).

> Phần *Development* trong CV, Windows Server và SQL Server không có trang riêng (không nằm trong các dòng Skills
> DevOps); câu hỏi liên quan vẫn nằm trong ngân hàng.

## Cách dùng hiệu quả

1. **Đọc từng trang kiến thức** theo mục lục bên trái; đầu trang luôn là khung *“Trong CV bạn đã viết”*.
2. **Với ngân hàng câu hỏi: tự trả lời trong đầu (hoặc nói thành tiếng), rồi mới bấm mở gợi ý.**
   Đáp án bị ẩn mặc định là có chủ ý — đọc hiểu không đồng nghĩa với nói được.
3. Đánh dấu `○ chưa học` / `◐ cần ôn` / `✓ đã thuộc` cho từng câu.
   Vòng ôn sau bật **“Chỉ câu chưa thuộc”** để không đọc lại thứ đã nắm.
4. Ưu tiên theo màu: 🔴 **gap** học trước, 🟠 **hay hỏi** phải trôi chảy, 🟢 **thế mạnh** chủ động kéo về.
5. Với trang **Case thực tế**: tập kể từng case trong 2–3 phút theo khung 8 bước ở mục đầu trang.
6. Với trang **Debug sự cố**: tập nói thành tiếng theo thứ tự *giảm thiệt hại → giữ bằng chứng → giả thuyết → kiểm chứng → phòng ngừa*, và nói ra điều bạn đã loại trừ ở mỗi bước.

Tiến độ và nền sáng/tối lưu trong `localStorage` (khoá `warroom.v1`) — đóng mở lại vẫn còn,
nhưng **không đồng bộ giữa các máy** và sẽ mất nếu bạn xoá dữ liệu duyệt web.

## Thêm hoặc sửa nội dung

### Sửa / thêm một mục trong trang kiến thức

Mở `js/kb/<trang>.js`. Mỗi file chỉ chứa một biến `TRANG`; `js/kb.js` lo phần dựng giao diện.

```js
const TRANG = {
  id: "cicd", ten: "…", tomTat: "…",
  cvSkill: ["Jenkins", "GitLab CI"],            // chip hiển thị đầu trang
  cv:   [{ nguon: "Dự án · mảng", noi: "dòng CV…" }],
  bank: ["GitLab CI"],                          // chuDe trong data.js để nối sang ngân hàng
  muc: [{
    id: "ten-muc", ten: "Tên mục",
    y:    ["ý cần nắm…"],
    bang: { ten: "…", cot: ["A", "B"], hang: [["a1", "b1"]] },
    ma:   { ten: "…", noi: ["dòng mã 1", "dòng mã 2"] },
    lenh: [["lệnh", "giải thích"]],
    bay:  "bẫy cần tránh",                      // chuỗi hoặc mảng chuỗi
    cv:   "cách gắn với CV khi trả lời"
  }]
};
```

Trong chuỗi: `` `code` `` → ô mã, `**đậm**`, `*nghiêng*`. Có thể đổi nhãn bằng `nhan`, `nhanSkill`, `nhanCV`,
`mucLucCV` (trang Case thực tế và Debug sự cố dùng các nhãn này).

### Thêm một trang mới

1. Thêm một dòng vào `TABS` trong `js/common.js` (đặt **trước** tab có `tach: true`).
2. Copy một trang HTML có sẵn, đổi `<body data-page="…">`, `<title>` và đường dẫn `js/kb/<trang>.js`
   (giữ nguyên hai thẻ `robots` / `googlebot` noindex).
3. Viết `js/kb/<trang>.js`. Thanh tab, nút Trước/Tiếp và mục lục tự cập nhật.

### Sửa / thêm câu hỏi trong ngân hàng

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
  bay: "Bẫy cần tránh…"         // tuỳ chọn
}
```

Bọc lệnh bằng dấu backtick — ví dụ `` `kubectl logs --previous` `` — sẽ tự render thành ô mã.

> Màn **Tổng quan** (độ khớp CV ↔ JD, rủi ro, lộ trình ôn) đã được gỡ và thay bằng các trang kiến thức ở trên.
> Dữ liệu cũ (`MATCH`, `RISKS`, `ROADMAP`, `RULES`, `FRAMEWORK`) vẫn xem lại được trong lịch sử git (commit `5046b16`).

## In ra giấy

`Ctrl/Cmd + P`. Bản in tự mở hết đáp án, bỏ mọi nút bấm và chuyển sang nền trắng chữ đen.

## Cấu trúc

```
devops-study-guide/
├── index.html … incident.html, bank.html   mỗi tab một trang
├── css/style.css                         giao diện, dark/light, responsive, bản in
└── js/
    ├── theme-init.js   áp nền sáng/tối trước khi vẽ (tránh nháy)
    ├── common.js       danh sách TABS, thanh tab, theme, trạng thái lưu
    ├── kb.js           dựng một trang kiến thức từ biến TRANG
    ├── kb/<trang>.js   nội dung từng trang — sửa ở đây
    ├── data.js         ngân hàng câu hỏi (91 câu) + META
    └── app.js          lọc, tìm kiếm, lưu tiến độ của ngân hàng câu hỏi
```

> Thư mục `cv/` (CV gốc, có thông tin liên hệ cá nhân) chỉ để đối chiếu nội dung và **không được commit**.
