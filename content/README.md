# content/ — nội dung các series bài học

Mỗi thư mục con là một series, hiển thị bằng một trang riêng (ví dụ `k8s-co-ban/` → `k8s-co-ban.html`).
Nội dung viết bằng Markdown, rồi được gói thành `js/series/<series>.js` để trang mở được bằng `file://`.

```bash
node scripts/build-lessons.mjs           # sau mỗi lần sửa .md
node scripts/build-lessons.mjs --check   # kiểm tra file sinh ra còn khớp .md không
```

## Cấu trúc một series

```
content/<series>/
├── series.json        { ten, nhan, tomTat, tacGia, noiDang, nguon, raSoat }
├── 01-<slug>.md       mỗi file một bài, thứ tự theo tên file
└── 02-<slug>.md
```

Đầu mỗi file bài:

```
---
ten: Tên bài (hiện ở tiêu đề, ngăn kéo, pager)
goc: https://… link bài gốc
thoiGian: 30 phút
chip: Từ khoá, cách nhau, bằng dấu phẩy
bank: Kubernetes, Networking        # chuDe trong js/data.js → khối "Luyện câu hỏi"
---
```

## Markdown được hỗ trợ (`js/md.js`)

| Viết | Hiển thị |
|---|---|
| Đoạn đầu tiên trước `##` đầu tiên | Lời dẫn dưới tiêu đề bài |
| `## Mục` | Một panel có số thứ tự + một dòng trong mục lục trái |
| `### Tiêu đề phụ` | Tiêu đề nhỏ trong panel |
| `- a` / `1. a` | Danh sách chấm / danh sách đánh số (một cấp) |
| ` ```bash ` … ` ``` ` | Khối mã có nhãn ngôn ngữ và nút Copy (` ```text ` thì không có nhãn) |
| `\| a \| b \|` | Bảng |
| `` `code` ``, `**đậm**`, `*nghiêng*`, `[chữ](https://…)` | Như GitHub |

Callout (cú pháp alert của GitHub, nên file `.md` xem trên GitHub cũng đẹp):

| Viết | Dùng cho |
|---|---|
| `> [!IMPORTANT]` | Quan trọng — điều dễ làm sai mà người học phải nhớ |
| `> [!NOTE]` | Ghi chú thêm |
| `> [!TIP]` | Mẹo |
| `> [!WARNING]` | Cẩn thận (bẫy, lỗi hay gặp) |
| `> [!CAUTION]` | Nguy hiểm (mất tiền, mất dữ liệu, lộ bí mật) |

Không hỗ trợ HTML thô và danh sách lồng nhau — mọi chữ đều được escape.

## Bản quyền

Series `k8s-co-ban` phỏng theo series *Kubernetes cơ bản* của tác giả Hữu Giang trên DevOps VietNam
(<https://devops.vn/series/kubernetes-co-ban-mrzero/>). Nội dung đã được viết lại và cập nhật theo công cụ, thực hành hiện tại; mỗi bài
dẫn link về bài gốc.
