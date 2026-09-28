/* ============================================================
   data.js — toàn bộ nội dung ôn phỏng vấn.
   Muốn thêm/sửa câu hỏi: chỉ cần sửa file này, không đụng HTML.

   Mỗi câu hỏi:
     id   : mã ngắn, duy nhất
     nhom : core | cv | tinhhuong | hoinguoc
     chuDe: tên chủ đề (tự sinh ra mục lục bên sidebar)
     uu   : gap (đỏ, mình yếu) | high (cam, hay hỏi) | strong (xanh, thế mạnh)
     ch   : câu hỏi
     tk   : từ khóa phải nói ra
     dy   : dàn ý trả lời, mỗi phần tử là một ý
     bay  : bẫy cần tránh (tuỳ chọn)
   Bọc `code` bằng dấu backtick sẽ tự render thành ô mã.
   ============================================================ */

const META = {
  viTri: "DevOps Engineer",
  luong: "25 – 35 triệu",
  diaDiem: "285A Ngô Gia Tự, Long Biên, Hà Nội",
  lichLam: "5,5 ngày/tuần"
};

/* Độ khớp CV ↔ JD — hiển thị thành thanh ở màn Tổng quan */
const MATCH = [
  { ten: "Docker",                muc: 100, nhan: "Vượt yêu cầu",        loai: "strong" },
  { ten: "Tự động hoá deploy / rollback", muc: 100, nhan: "Vượt yêu cầu", loai: "strong" },
  { ten: "Kubernetes (JD: lợi thế)", muc: 95, nhan: "Ăn trọn điểm cộng", loai: "strong" },
  { ten: "Terraform / IaC (JD: điểm cộng)", muc: 95, nhan: "Ăn trọn điểm cộng", loai: "strong" },
  { ten: "Cloud AWS (JD: điểm cộng)", muc: 90, nhan: "Ăn trọn điểm cộng", loai: "strong" },
  { ten: "CI/CD với GitLab CI",   muc: 55,  nhan: "Mạnh CI/CD nhưng lệch tool", loai: "gap" },
  { ten: "Linux",                 muc: 80,  nhan: "Tốt — có host tự quản", loai: "high" },
  { ten: "Troubleshooting",       muc: 80,  nhan: "Tốt — có ca thật",    loai: "high" },
  { ten: "Security hardening (JD: nên có)", muc: 75, nhan: "Khá — có ca SSRF", loai: "high" },
  { ten: "PostgreSQL",            muc: 65,  nhan: "Khá — qua Aurora + Liquibase", loai: "high" },
  { ten: "Networking",            muc: 55,  nhan: "Có cloud, thiếu on-prem", loai: "high" },
  { ten: "Backup / Restore / DR", muc: 45,  nhan: "Có AWS Backup, chưa DR drill", loai: "gap" },
  { ten: "Monitoring / Logging / Alerting", muc: 30, nhan: "Thiếu — JD đòi tự xây", loai: "gap" },
  { ten: "SQL Server",            muc: 20,  nhan: "Chưa làm — cần vá",   loai: "gap" },
  { ten: "Windows Server",        muc: 5,   nhan: "Trống — cần kịch bản", loai: "gap" }
];

/* Ba rủi ro lớn nhất — phải có kịch bản trả lời sẵn */
const RISKS = [
  {
    so: "01",
    ten: "Kinh nghiệm 2 năm 6 tháng < mốc 3 năm của JD",
    noi: "Không nói dối, không làm tròn. Chuyển từ tranh luận về THỜI GIAN sang tranh luận về PHẠM VI TRÁCH NHIỆM — đó là sân nhà của bạn: người duy nhất sở hữu hạ tầng và pipeline của 3 sản phẩm, cộng một dịch vụ production tự vận hành từ A đến Z."
  },
  {
    so: "02",
    ten: "GitLab CI — JD xếp 'thành thạo', CV chỉ có một dòng liệt kê",
    noi: "Rủi ro lớn nhất của buổi phỏng vấn. Chiều sâu của bạn nằm ở Jenkins và GitHub Actions; nếu trả lời GitLab chung chung thì toàn bộ phần CI/CD mạnh mất giá trị. 9 câu chủ đề GitLab CI là phần phải học trước tiên."
  },
  {
    so: "03",
    ten: "Windows Server trống hoàn toàn + Monitoring quá mỏng",
    noi: "JD ghi rõ 'XÂY DỰNG hệ thống Monitoring, Logging và Alerting' — họ cần người dựng từ đầu, không phải người đọc dashboard có sẵn. Windows thì phải có kịch bản thành thật + nền tảng chuyển đổi, tuyệt đối không bịa."
  }
];

/* Lộ trình ôn — có checkbox lưu lại */
const ROADMAP = [
  { uu: "gap",    ten: "GitLab CI",                  gio: "3–4h", ghi: "Viết thử một .gitlab-ci.yml hoàn chỉnh: build → migrate → deploy → rollback" },
  { uu: "gap",    ten: "Monitoring / Alerting",      gio: "3h",   ghi: "Dựng thử Prometheus + Grafana + Alertmanager bằng Docker Compose" },
  { uu: "high",   ten: "Câu chuyện sự cố Kotae + lần làm hỏng production", gio: "1h", ghi: "Viết ra giấy, tập kể thành tiếng 2 lần" },
  { uu: "gap",    ten: "Windows Server + SQL Server", gio: "2h",  ghi: "Chỉ cần khái niệm + kịch bản trả lời không lúng túng" },
  { uu: "high",   ten: "Backup / DR + RTO / RPO",    gio: "1h",   ghi: "Dễ ăn điểm chỉ bằng khái niệm đúng" },
  { uu: "high",   ten: "Networking on-prem",         gio: "1h",   ghi: "VLAN, firewall, routing, DNS — dễ bị hỏi bất ngờ" },
  { uu: "strong", ten: "Ôn lại chính dự án của mình", gio: "1h",  ghi: "Đọc lại Terraform và workflow của chính bạn, nhớ con số" }
];

/* Ba nguyên tắc mang vào phòng phỏng vấn */
const RULES = [
  "Luôn kéo câu trả lời về bằng chứng cụ thể — 'em đã làm X, gặp vấn đề Y, xử lý bằng Z' mạnh hơn mọi định nghĩa sách vở.",
  "Nói thật về chỗ mình chưa biết, kèm cách mình sẽ học. Với gap 3 năm kinh nghiệm, sự đáng tin là tài sản lớn nhất của bạn.",
  "Luôn đi tới bước 'phòng ngừa tái diễn'. Khác biệt giữa người vận hành 2 năm và 5 năm không nằm ở sửa nhanh, mà ở việc sau đó hệ thống có tốt lên không."
];

/* Khung trả lời chung cho mọi câu tình huống */
const FRAMEWORK = [
  "Làm rõ mức độ ảnh hưởng — bao nhiêu user, chức năng nào, từ khi nào.",
  "Ổn định trước, tìm nguyên nhân sau — rollback hoặc failover để dừng chảy máu.",
  "Thông báo — cho stakeholder biết tình hình và ETA.",
  "Điều tra có phương pháp — thay đổi gần nhất là gì, đọc log và metric, thu hẹp dần.",
  "Khắc phục dứt điểm.",
  "Postmortem không đổ lỗi + hành động phòng ngừa cụ thể."
];

const QUESTIONS = [

/* ===================== LINUX ===================== */
{
  id: "L1", nhom: "core", chuDe: "Linux", uu: "high",
  ch: "Server báo đầy ổ nhưng `du -sh /*` cộng lại vẫn thấp hơn nhiều so với `df -h`. Giải thích?",
  tk: ["file descriptor", "lsof +L1", "inode chưa giải phóng", "df -i", "mount đè lên data"],
  dy: [
    "Nguyên nhân số một: file đã bị xoá nhưng process vẫn giữ file descriptor → inode chưa được giải phóng, `df` vẫn tính nhưng `du` không thấy.",
    "Tìm bằng `lsof +L1` hoặc `lsof | grep deleted`, rồi restart process đang giữ — thường là log file bị `rm` thay vì để logrotate xử lý.",
    "Nguyên nhân khác cần loại trừ: hết inode (kiểm tra `df -i`), hoặc mount point đè lên một thư mục vốn đã có dữ liệu bên dưới."
  ],
  bay: "Đừng đi xoá thêm file rồi ngồi chờ — dung lượng sẽ không tự về chừng nào process còn giữ fd."
},
{
  id: "L2", nhom: "core", chuDe: "Linux", uu: "high",
  ch: "Quy trình xử lý khi load average cao bất thường?",
  tk: ["uptime", "%us / %wa / %sy", "iostat -x 1", "iotop", "pidstat", "trạng thái D"],
  dy: [
    "`uptime` xác nhận con số, rồi `top`/`htop` phân biệt %us (CPU-bound) với %wa (I/O wait) và %sy (kernel).",
    "Nếu I/O wait cao → `iostat -x 1` và `iotop` để tìm tiến trình đang hành đĩa.",
    "Nếu CPU cao → `pidstat`, `ps aux --sort=-%cpu` khoanh vùng process.",
    "Chi tiết phân biệt người biết thật: load average trên Linux tính cả process ở trạng thái D (uninterruptible sleep), nên load cao KHÔNG đồng nghĩa CPU cao — máy kẹt I/O cũng đẩy load lên."
  ],
  bay: "Nói 'load cao tức là CPU cao' là dấu hiệu học vẹt, người phỏng vấn có nghề sẽ nhận ra ngay."
},
{
  id: "L3", nhom: "core", chuDe: "Linux", uu: "high",
  ch: "systemd với `Restart=always` khác gì một process manager như supervisor hay PM2? Khi nào dùng cái nào?",
  tk: ["init system", "After= / Requires=", "cgroup resource limit", "journald", "một container một process"],
  dy: [
    "systemd là init system cấp OS: quản lý dependency qua `After=`/`Requires=`, giới hạn tài nguyên bằng cgroup, gom log vào journald, hỗ trợ socket activation.",
    "Process manager tầng ứng dụng chỉ giải quyết vòng đời process, không biết gì về thứ tự khởi động ở mức hệ thống.",
    "Thực tế của em: dùng systemd cho service chạy thẳng trên host tự quản.",
    "Trong container thì restart policy thuộc về Docker hoặc Kubernetes — nguyên tắc là một container một process, để orchestrator quản vòng đời, không chồng thêm process manager bên trong."
  ],
  bay: "Nhét supervisor vào trong container là anti-pattern: orchestrator mất khả năng biết process thật đã chết."
},
{
  id: "L4", nhom: "core", chuDe: "Linux", uu: "high",
  ch: "Giải thích permission `chmod 4755`. Khi nào nó nguy hiểm?",
  tk: ["SUID bit", "chạy bằng quyền owner", "privilege escalation", "find / -perm -4000"],
  dy: [
    "Số 4 đứng đầu là SUID: process chạy với quyền của owner file (thường là root) thay vì quyền của người gọi.",
    "Nguy hiểm vì bất kỳ lỗ hổng nào trong binary đó lập tức trở thành đường leo thang đặc quyền lên root.",
    "Trong hardening: audit định kỳ bằng `find / -perm -4000 -type f`, gỡ SUID khỏi binary không thực sự cần."
  ]
},
{
  id: "L5", nhom: "core", chuDe: "Linux", uu: "high",
  ch: "Dịch vụ chạy tốt khi start bằng tay nhưng fail khi boot. Debug thế nào?",
  tk: ["journalctl -u -b", "After=network-online.target", "EnvironmentFile=", "WorkingDirectory", "dependency chưa sẵn sàng"],
  dy: [
    "`journalctl -u <service> -b` đọc log đúng lần boot này, đó là nguồn sự thật đầu tiên.",
    "Thứ tự khởi động: cần IP thật thì phải `After=network-online.target`, không phải `network.target`.",
    "Biến môi trường có trong shell của bạn nhưng không có trong unit file → khai báo `EnvironmentFile=`.",
    "Kiểm tra `WorkingDirectory`, quyền của user chạy service, và dependency bên ngoài như mount NFS hay database chưa kịp sẵn sàng."
  ],
  bay: "Nguyên nhân hay bị bỏ sót nhất chính là biến môi trường — chạy tay thì shell của bạn đã có sẵn, systemd thì không."
},

/* ===================== NETWORKING ===================== */
{
  id: "N1", nhom: "core", chuDe: "Networking", uu: "high",
  ch: "Gõ một URL đến khi nhận response — đi qua những gì?",
  tk: ["DNS resolve", "TCP 3-way handshake", "TLS handshake", "reverse proxy", "backend"],
  dy: [
    "DNS resolve: cache local → /etc/hosts → resolver → root → TLD → authoritative.",
    "TCP three-way handshake, rồi TLS handshake: ClientHello, cert chain, key exchange.",
    "HTTP request đi tới reverse proxy hoặc load balancer, được định tuyến xuống backend.",
    "Bám vào hệ thống thật của bạn: 'Trên hệ thống em vận hành thì sau DNS là CloudFront, qua WAF, tới ALB rồi mới vào ECS task; còn trên host tự quản thì Nginx terminate TLS rồi proxy_pass vào container.'"
  ],
  bay: "Đây là câu kinh điển — ai cũng trả lời được phần lý thuyết. Điểm khác biệt nằm ở chỗ bạn ánh xạ nó vào hạ tầng bạn thật sự vận hành."
},
{
  id: "N2", nhom: "core", chuDe: "Networking", uu: "high",
  ch: "Phân biệt Load Balancer L4 và L7. Khi nào dùng cái nào?",
  tk: ["L4 = IP:port", "L7 đọc HTTP header/path", "TLS termination", "X-Forwarded-For", "Ingress là L7"],
  dy: [
    "L4 (TCP/UDP): định tuyến theo IP và port, nhanh, không đọc nội dung, giữ nguyên protocol — hợp cho database, gRPC thuần, traffic không phải HTTP.",
    "L7: đọc HTTP header, path, host → định tuyến theo path, sticky session, TLS termination, chèn header như `X-Forwarded-For`.",
    "Liên hệ thực tế: Nginx và ALB là L7, HAProxy làm được cả hai, trong Kubernetes thì Service kiểu LoadBalancer là L4 còn Ingress là L7."
  ]
},
{
  id: "N3", nhom: "core", chuDe: "Networking", uu: "high",
  ch: "Service A không gọi được service B. Bạn debug tầng nào trước?",
  tk: ["dig / nslookup", "ping / traceroute", "nc -zv host port", "curl -v", "firewall / NetworkPolicy"],
  dy: [
    "Đi từ dưới lên, mỗi tầng một lệnh dứt khoát: DNS (`dig` — có resolve ra đúng IP không) → L3 (`ping`, `traceroute` — có tới được host không) → L4 (`nc -zv host port` — port có mở không) → L7 (`curl -v` — app có trả lời đúng không).",
    "Song song kiểm tra firewall: `iptables -L`, security group, NetworkPolicy của Kubernetes.",
    "Loại trừ thêm MTU và proxy nằm giữa làm hỏng kết nối."
  ],
  bay: "Điểm cộng lớn: nói rõ bạn luôn xác định 'packet dừng ở đâu' TRƯỚC khi đoán nguyên nhân. Đoán trước rồi thử là cách làm mất thời gian nhất."
},
{
  id: "N4", nhom: "core", chuDe: "Networking", uu: "high",
  ch: "Subnet /24 và /26 khác nhau ra sao? Tại sao phải chia subnet?",
  tk: ["/24 = 256 địa chỉ", "/26 = 64 địa chỉ", "broadcast domain", "firewall theo tier", "public / private / isolated"],
  dy: [
    "/24 cho 256 địa chỉ (254 dùng được), /26 cho 64 (62 dùng được).",
    "Chia subnet để tách broadcast domain, áp firewall rule theo tầng, và thực thi least-privilege ở mức mạng.",
    "Liên hệ trực tiếp dự án ERC: trong Terraform VPC bạn tách public subnet cho ALB và NAT, private subnet cho ECS task, isolated subnet cho Aurora — database không hề có route ra internet."
  ]
},
{
  id: "N5", nhom: "core", chuDe: "Networking", uu: "high",
  ch: "NAT Gateway, Internet Gateway và reverse proxy khác nhau thế nào?",
  tk: ["IGW hai chiều", "NAT chỉ đi ra", "reverse proxy nhận vào", "che giấu topology"],
  dy: [
    "Internet Gateway: cho phép giao tiếp hai chiều với instance có public IP.",
    "NAT Gateway: cho phép private subnet đi RA internet nhưng không cho kết nối từ ngoài VÀO.",
    "Reverse proxy: nhận request từ ngoài, phân phối tới backend nội bộ, che giấu topology bên trong.",
    "Trên on-premise, vai trò NAT thường do chính firewall hoặc router đảm nhiệm — nói ý này cho thấy bạn hình dung được môi trường của họ."
  ]
},

/* ===================== GITLAB CI ===================== */
{
  id: "G1", nhom: "core", chuDe: "GitLab CI", uu: "gap",
  ch: "Kiến trúc GitLab Runner: shared, group hay project runner? Có những executor nào?",
  tk: ["runner poll job", "shared / group / project", "shell executor", "docker executor", "kubernetes executor"],
  dy: [
    "Runner đăng ký với GitLab bằng token rồi chủ động poll job về chạy — GitLab không push xuống runner.",
    "Phạm vi: instance-wide (shared), group, hoặc riêng từng project.",
    "Executor: `shell` chạy thẳng trên host (nhanh nhưng bẩn state giữa các job), `docker` mỗi job một container sạch (mặc định nên dùng), `docker+machine` để autoscale, `kubernetes` mỗi job một pod.",
    "Nêu đánh đổi rõ ràng: shell executor nhanh nhưng dễ ô nhiễm môi trường giữa các lần chạy; docker executor sạch nhưng phải xử lý bài toán build image bên trong container."
  ]
},
{
  id: "G2", nhom: "core", chuDe: "GitLab CI", uu: "gap",
  ch: "Build Docker image bên trong GitLab CI — có mấy cách và rủi ro của từng cách?",
  tk: ["docker:dind", "privileged = true", "mount /var/run/docker.sock", "Kaniko", "Buildah rootless"],
  dy: [
    "Cách 1 — DinD: service `docker:dind` với `DOCKER_HOST=tcp://docker:2375`, bắt buộc `privileged = true` → rủi ro bảo mật, có thể thoát container.",
    "Cách 2 — mount docker socket: nhanh hơn nhưng job có toàn quyền trên host, còn tệ hơn DinD.",
    "Cách 3 — Kaniko hoặc Buildah: build rootless, không cần privileged → đây là cái nên khuyến nghị.",
    "Nối vào kinh nghiệm thật: 'Bên GitHub Actions em dùng Buildx với layer caching, nguyên tắc chuyển sang GitLab là như nhau, chỉ khác cách khai báo runner.'"
  ],
  bay: "Trả lời mỗi 'dùng dind' mà không nói tới privileged là bỏ lỡ đúng chỗ người phỏng vấn muốn nghe."
},
{
  id: "G3", nhom: "core", chuDe: "GitLab CI", uu: "gap",
  ch: "Phân biệt `cache` và `artifacts`. Dùng sai gây hậu quả gì?",
  tk: ["cache = tăng tốc", "artifacts = kết quả đầu ra", "cache:key", "policy: pull", "expire_in"],
  dy: [
    "`cache` để tăng tốc, nội dung KHÔNG được đảm bảo tồn tại, chia sẻ giữa các pipeline — hợp cho node_modules, .m2, vendor.",
    "`artifacts` là kết quả đầu ra của job, truyền sang job ở stage sau, có `expire_in`, tải về được từ giao diện.",
    "Sai lầm điển hình: dùng cache để truyền build output → job sau chạy trên runner khác là fail ngẫu nhiên, và đây là loại lỗi cực kỳ khó truy vì nó không lặp lại đều.",
    "Nói thêm cho có chiều sâu: `cache:key: $CI_COMMIT_REF_SLUG` để tách cache theo branch, và `policy: pull` cho job chỉ đọc không cần ghi lại cache."
  ],
  bay: "Đây là câu phân loại rất nhanh giữa người dùng GitLab thật và người mới đọc tài liệu. Phải nói được vế 'fail ngẫu nhiên'."
},
{
  id: "G4", nhom: "core", chuDe: "GitLab CI", uu: "gap",
  ch: "`rules` khác `only/except` thế nào và vì sao nên dùng `rules`? Cho ví dụ chỉ deploy khi merge vào main.",
  tk: ["only/except là cú pháp cũ", "rules: if / changes / exists", "when: manual", "match đầu tiên thắng"],
  dy: [
    "`only/except` là cú pháp cũ, không kết hợp được điều kiện phức tạp.",
    "`rules` cho phép `if`, `changes`, `exists` kết hợp với `when` và `allow_failure`, đánh giá theo thứ tự và match đầu tiên thắng.",
    "Ví dụ: `rules: - if: '$CI_COMMIT_BRANCH == \"main\" && $CI_PIPELINE_SOURCE == \"push\"' when: manual`",
    "Nối vào CV rất đẹp: 'Em đã làm path-based selective build bên GitHub Actions — bên GitLab chính là `rules:changes`.'"
  ]
},
{
  id: "G5", nhom: "core", chuDe: "GitLab CI", uu: "gap",
  ch: "`needs:` khác `stage` ở điểm nào?",
  tk: ["stage chạy tuần tự", "needs tạo DAG", "không chờ cả stage", "tối đa 50 job"],
  dy: [
    "`stage` chạy tuần tự theo nhóm: cả stage phải xong mới sang stage kế.",
    "`needs` tạo DAG — job chạy ngay khi dependency riêng của nó xong, không phải chờ cả stage → rút ngắn pipeline đáng kể.",
    "Giới hạn cần biết: tối đa 50 job trong `needs`, và job dùng `needs` chỉ nhận artifact từ đúng những job được khai báo."
  ]
},
{
  id: "G6", nhom: "core", chuDe: "GitLab CI", uu: "gap",
  ch: "Quản lý secret trong GitLab CI như thế nào?",
  tk: ["Masked variable", "Protected variable", "file-type variable", "HashiCorp Vault qua JWT", "OIDC"],
  dy: [
    "CI/CD variables ở cấp project, group hoặc instance. Bật Masked để che trong log.",
    "Bật Protected là điểm sống còn: nếu quên, bất kỳ ai push một branch bất kỳ cũng lấy được secret production.",
    "File-type variable cho certificate hoặc kubeconfig.",
    "Nâng cao: tích hợp HashiCorp Vault qua JWT, hoặc OIDC ra cloud để không phải lưu credential dài hạn."
  ],
  bay: "Không bao giờ `echo` biến secret để debug — nó sẽ nằm trong log pipeline vĩnh viễn."
},
{
  id: "G7", nhom: "core", chuDe: "GitLab CI", uu: "gap",
  ch: "Thiết kế pipeline cho ba môi trường dev / staging / prod có rollback. Mô tả `.gitlab-ci.yml` của bạn.",
  tk: ["lint → test → build → migrate → deploy → verify", "tag theo $CI_COMMIT_SHA", "environment:", "job manual rollback", "healthcheck có retry"],
  dy: [
    "Stage: `lint → test → build → migrate → deploy → verify`.",
    "`build`: image tag theo `$CI_COMMIT_SHA` chứ không dùng `latest`, push vào GitLab Container Registry.",
    "`migrate`: job riêng, gate theo branch, chạy Liquibase, in link log khi fail để triage nhanh.",
    "`deploy`: khai báo `environment: { name: production, url: ... }` để GitLab tự lưu deployment history.",
    "Rollback: vì tag theo SHA nên rollback chính là deploy lại SHA cũ — thêm job `when: manual` nhận biến `ROLLBACK_TAG`, hoặc dùng nút Re-deploy trong mục Environments.",
    "`verify`: healthcheck có retry, fail thì bắn alert."
  ],
  bay: "Đây là câu bạn ghi điểm mạnh nhất. Chốt bằng: 'Đây đúng là mô hình em đang chạy production, chỉ khác cú pháp.'"
},
{
  id: "G8", nhom: "core", chuDe: "GitLab CI", uu: "gap",
  ch: "`include:` và pipeline template dùng để làm gì?",
  tk: ["include: local / project / remote / template", "repo ci-templates", "override phần cần thiết", "workflow_call tương đương"],
  dy: [
    "`include` với bốn dạng local, project, remote, template để tái sử dụng cấu hình.",
    "Với nhiều repo cùng một pattern: tạo một repo `ci-templates` chứa job chuẩn, các project `include: project:` vào rồi override phần riêng.",
    "Nối thẳng vào CV: 'Em đã làm đúng việc này với `workflow_call` bên GitHub Actions — tái cấu trúc CI của HR platform thành component tái sử dụng.' Câu này chứng minh bạn hiểu NGUYÊN LÝ chứ không chỉ thuộc CÚ PHÁP."
  ]
},
{
  id: "G9", nhom: "core", chuDe: "GitLab CI", uu: "gap",
  ch: "Pipeline chạy rất chậm, bạn tối ưu thế nào?",
  tk: ["đo trước khi sửa", "cache đúng key", "needs song song hoá", "rules:changes", "layer caching", "parallel:", "interruptible: true"],
  dy: [
    "Đo trước: xem job nào thật sự chiếm thời gian, đừng tối ưu theo cảm tính.",
    "Cache dependency với key đúng; dùng `needs` để song song hoá; `rules:changes` bỏ qua phần không đổi trong monorepo.",
    "Docker layer caching và multi-stage build, sắp xếp layer để phần ít thay đổi nằm trên; base image nhẹ.",
    "Runner đủ mạnh và đặt gần registry; tách test thành nhiều job chạy song song bằng `parallel:`.",
    "`interruptible: true` để tự huỷ pipeline cũ khi có push mới — tiết kiệm rất nhiều tài nguyên runner."
  ]
},

/* ===================== DOCKER ===================== */
{
  id: "D1", nhom: "core", chuDe: "Docker", uu: "strong",
  ch: "Tại sao dùng multi-stage build? Bạn đã giảm được gì?",
  tk: ["tách build khỏi runtime", "giảm attack surface", "không còn compiler/shell", "cache tốt hơn"],
  dy: [
    "Tách môi trường build (compiler, devDependencies, source code) khỏi image runtime.",
    "Kết quả: image nhỏ hơn nhiều lần, giảm attack surface vì không còn shell hay compiler cho kẻ tấn công lợi dụng, và build nhanh hơn nhờ cache.",
    "Kể thẳng từ CV: bạn đã multi-stage + user non-root + HEALTHCHECK cho service production tự vận hành."
  ]
},
{
  id: "D2", nhom: "core", chuDe: "Docker", uu: "strong",
  ch: "`CMD` khác `ENTRYPOINT` thế nào? Exec form khác shell form ra sao?",
  tk: ["ENTRYPOINT cố định", "CMD là tham số mặc định", "exec form nhận signal", "shell form bọc /bin/sh -c", "SIGTERM không tới app"],
  dy: [
    "ENTRYPOINT là lệnh cố định, CMD là tham số mặc định có thể override khi `docker run`.",
    "Exec form `[\"node\",\"app.js\"]`: process chạy ở PID 1, nhận signal trực tiếp.",
    "Shell form `node app.js`: bị bọc trong `/bin/sh -c`, PID 1 là shell → SIGTERM không tới được app → container không graceful shutdown, bị SIGKILL sau grace period."
  ],
  bay: "Đây là bug production kinh điển: deploy tưởng zero-downtime nhưng request đang xử lý bị cắt giữa chừng. Nói được ý này là ăn điểm to."
},
{
  id: "D3", nhom: "core", chuDe: "Docker", uu: "strong",
  ch: "Container bị mất data sau khi restart. Nguyên nhân và cách xử lý?",
  tk: ["writable layer", "named volume", "bind mount", "tmpfs", "container phải stateless"],
  dy: [
    "Nguyên nhân: ghi vào writable layer của container thay vì volume — layer này mất khi container bị tạo lại.",
    "Named volume: Docker quản lý, portable, backup được. Bind mount: map thư mục host, tiện cho dev nhưng phụ thuộc host và dễ sai permission. tmpfs: nằm trên RAM, mất khi dừng.",
    "Nguyên tắc: container phải stateless, mọi state đẩy ra volume hoặc dịch vụ bên ngoài."
  ]
},
{
  id: "D4", nhom: "core", chuDe: "Docker", uu: "strong",
  ch: "Hardening Docker image theo checklist nào?",
  tk: ["pin theo digest", "USER non-root", "--read-only", "--cap-drop=ALL", "BuildKit secret mount", "Trivy scan"],
  dy: [
    "Base image tối giản (distroless, alpine, slim) và pin theo digest chứ không phải theo tag.",
    "Chạy bằng `USER` non-root; filesystem read-only kèm tmpfs cho /tmp; `--cap-drop=ALL` rồi add lại đúng capability cần.",
    "Không bao giờ để secret trong ENV hay trong layer — nó nằm trong image history vĩnh viễn; dùng BuildKit secret mount.",
    "`.dockerignore` đủ chặt, scan image bằng Trivy hoặc Grype ngay trong pipeline, và đặt resource limit."
  ]
},
{
  id: "D5", nhom: "core", chuDe: "Docker", uu: "strong",
  ch: "Image build ở máy bạn chạy được, đưa lên server thì fail. Vì sao?",
  tk: ["khác architecture arm64/amd64", "buildx --platform", "tag latest trỏ image khác", "build context", "promote cùng một digest"],
  dy: [
    "Khác architecture: máy dev arm64 còn server amd64 → dùng `buildx --platform`.",
    "Tag `latest` trên server trỏ tới một image khác; hoặc biến môi trường và secret khác nhau.",
    "File có ở local nhưng bị `.dockerignore` loại trên CI; volume mount đè lên file trong image; khác kernel hoặc cgroup version.",
    "Cách phòng tận gốc: build một lần duy nhất trong CI rồi promote CÙNG MỘT DIGEST qua các môi trường, không build lại ở từng môi trường."
  ],
  bay: "Vế 'promote cùng một digest' mới là câu trả lời cấp senior — liệt kê nguyên nhân thôi thì chỉ dừng ở mức khá."
},

/* ===================== KUBERNETES ===================== */
{
  id: "K1", nhom: "core", chuDe: "Kubernetes", uu: "strong",
  ch: "Pod bị `CrashLoopBackOff`. Quy trình chẩn đoán của bạn?",
  tk: ["kubectl describe pod", "Events + Last State", "logs --previous", "exit 137 = OOMKilled", "liveness quá gắt"],
  dy: [
    "`kubectl describe pod` — đọc Events, Last State và Exit Code.",
    "`kubectl logs --previous` — log của lần chết trước, đây là nguồn quan trọng nhất và hay bị bỏ qua nhất.",
    "Phân loại theo exit code: 137 là OOMKilled hoặc bị SIGKILL, 1 là app tự crash, 143 là nhận SIGTERM.",
    "Rồi kiểm tra: thiếu config/secret, liveness probe quá gắt khiến app chưa kịp khởi động đã bị giết, dependency như database chưa sẵn sàng, hoặc image sai."
  ],
  bay: "Bạn có kinh nghiệm thật ở đây — đừng trả lời lý thuyết suông, hãy kể luôn một ca cụ thể trên Kotae."
},
{
  id: "K2", nhom: "core", chuDe: "Kubernetes", uu: "strong",
  ch: "Phân biệt `resources.requests` và `limits`. QoS class là gì?",
  tk: ["requests dùng để schedule", "limits là trần cứng", "CPU bị throttle", "memory vượt là OOMKilled ngay", "Guaranteed / Burstable / BestEffort"],
  dy: [
    "`requests` là căn cứ để scheduler chọn node và là mức tối thiểu được đảm bảo; `limits` là trần cứng.",
    "Khác biệt then chốt: CPU vượt limit thì bị throttle, còn memory vượt limit thì bị OOMKilled NGAY — memory không throttle được.",
    "QoS: Guaranteed (requests bằng limits) bị evict cuối cùng; Burstable ở giữa; BestEffort (không đặt gì) bị evict đầu tiên.",
    "Kinh nghiệm thật: workload AI của Kotae memory-heavy và bursty, phải tune requests/limits sao cho vừa không OOM vừa không lãng phí node."
  ]
},
{
  id: "K3", nhom: "core", chuDe: "Kubernetes", uu: "strong",
  ch: "Liveness, Readiness và Startup probe khác nhau ra sao? Dùng sai gây hậu quả gì?",
  tk: ["readiness gỡ khỏi endpoint", "liveness restart container", "startup probe hoãn hai cái kia", "cascade failure", "initialDelaySeconds"],
  dy: [
    "Readiness fail → pod bị gỡ khỏi Service endpoint, ngừng nhận traffic nhưng KHÔNG restart.",
    "Liveness fail → restart container.",
    "Startup probe → hoãn hai probe kia lại cho app khởi động chậm.",
    "Lỗi kinh điển 1: dùng liveness để check dependency — database chập chờn làm toàn bộ pod restart liên tục, biến sự cố nhỏ thành cascade failure.",
    "Lỗi kinh điển 2: `initialDelaySeconds` quá ngắn với app khởi động chậm → CrashLoopBackOff vĩnh viễn."
  ],
  bay: "CV bạn ghi 'tuning probe thresholds' — chắc chắn sẽ bị đào. Chuẩn bị kể con số cụ thể bạn đã chỉnh và vì sao."
},
{
  id: "K4", nhom: "core", chuDe: "Kubernetes", uu: "strong",
  ch: "Helm cho bạn cái gì mà `kubectl apply` không có? Rollback bằng Helm thế nào?",
  tk: ["template + values theo môi trường", "revision history", "helm rollback", "hooks", "--atomic", "helm diff"],
  dy: [
    "Template hoá cùng `values.yaml` riêng theo môi trường; quản lý release có revision history; `helm rollback <release> <revision>` quay về manifest cũ; hooks cho pre/post-install; quản lý dependency chart.",
    "Kể thật: bạn vận hành 4 môi trường (development, test, demo, production) bằng cùng một chart với values riêng — đúng bài toán multi-environment mà JD quan tâm.",
    "Nói thêm `--atomic` để tự rollback khi upgrade fail, `helm history` và `helm diff` trước khi upgrade."
  ]
},
{
  id: "K5", nhom: "core", chuDe: "Kubernetes", uu: "strong",
  ch: "Zero-downtime deploy trên Kubernetes cần những gì?",
  tk: ["maxSurge / maxUnavailable", "readinessProbe chính xác", "preStop hook", "terminationGracePeriodSeconds", "xử lý SIGTERM", "PodDisruptionBudget"],
  dy: [
    "RollingUpdate với `maxSurge`/`maxUnavailable` phù hợp.",
    "ReadinessProbe CHÍNH XÁC — nếu sai, pod mới nhận traffic khi chưa thật sự sẵn sàng.",
    "`preStop` hook sleep vài giây để load balancer kịp gỡ endpoint trước khi process dừng.",
    "`terminationGracePeriodSeconds` đủ dài và app phải xử lý SIGTERM để drain connection đang chạy.",
    "PodDisruptionBudget để việc bảo trì node không hạ quá nhiều pod cùng lúc."
  ],
  bay: "Thiếu readiness probe đúng là nguyên nhân số một của 'deploy zero-downtime nhưng vẫn rớt request'."
},

/* ===================== TERRAFORM ===================== */
{
  id: "T1", nhom: "core", chuDe: "Terraform / IaC", uu: "strong",
  ch: "Terraform state là gì? Vì sao không để local? Xử lý state lock bị kẹt ra sao?",
  tk: ["ánh xạ code ↔ resource thật", "remote backend S3 + DynamoDB", "versioning + encryption", "terraform force-unlock"],
  dy: [
    "State ánh xạ resource trong code với resource thật, lưu cả metadata và đôi khi cả giá trị nhạy cảm.",
    "Không để local vì: team không đồng bộ, mất máy là mất state, và không có locking thì hai người apply cùng lúc sẽ làm hỏng hạ tầng.",
    "Remote backend: S3 kèm DynamoDB lock, bật versioning và encryption.",
    "Lock kẹt do process chết giữa chừng → `terraform force-unlock <id>`, nhưng chỉ sau khi xác nhận chắc chắn không còn apply nào đang chạy."
  ]
},
{
  id: "T2", nhom: "core", chuDe: "Terraform / IaC", uu: "strong",
  ch: "Ai đó sửa tay trên console gây drift. Bạn xử lý thế nào?",
  tk: ["terraform plan phát hiện drift", "apply để kéo về code", "terraform import", "ignore_changes", "chặn quyền write trên console"],
  dy: [
    "`terraform plan` phát hiện drift.",
    "Ba lựa chọn: apply để kéo hạ tầng về đúng code (mặc định); `terraform import` nếu thay đổi đó hợp lệ và cần đưa vào code; `ignore_changes` cho field thực sự do hệ thống bên ngoài quản lý.",
    "Quan trọng hơn là phòng ngừa: chặn quyền write trên console ở môi trường production, chạy `plan` định kỳ trong pipeline để phát hiện drift sớm, bắt buộc mọi thay đổi đi qua merge request."
  ],
  bay: "Trả lời mỗi 'apply đè lại' là chưa đủ — người phỏng vấn đang chờ nghe phần phòng ngừa."
},
{
  id: "T3", nhom: "core", chuDe: "Terraform / IaC", uu: "strong",
  ch: "Thiết kế module Terraform tái sử dụng — nguyên tắc của bạn là gì?",
  tk: ["module nhận input trả output", "một module một trách nhiệm", "tách state theo blast radius", "pin version", "tflint / checkov trong CI"],
  dy: [
    "Module nhận input trả output, không hardcode môi trường; mỗi module một trách nhiệm.",
    "Tách state theo blast radius — network, data, app riêng — để lỗi một chỗ không kéo theo toàn hệ thống.",
    "Pin version của provider và module; `terraform fmt`, `validate`, `tflint`, `checkov` chạy trong CI; plan bắt buộc review trước khi apply.",
    "Trả lời bằng chính dự án ERC: 22 module, và mô hình per-tenant cho phép dựng môi trường cho khách hàng mới từ cùng bộ module đó."
  ],
  bay: "Đây là câu trả lời mạnh nhất trong toàn bộ buổi phỏng vấn của bạn — đừng trả lời lý thuyết, hãy trả lời bằng dự án."
},
{
  id: "T4", nhom: "core", chuDe: "Terraform / IaC", uu: "strong",
  ch: "`count` và `for_each` khác nhau thế nào? Vì sao `for_each` thường tốt hơn?",
  tk: ["count index theo số", "xoá phần tử giữa → destroy/recreate", "for_each key theo string", "multi-tenant"],
  dy: [
    "`count` đánh index theo số thứ tự → xoá một phần tử ở giữa danh sách làm TOÀN BỘ resource phía sau bị destroy rồi recreate.",
    "`for_each` đánh key theo string ổn định → thêm hay bớt một phần tử không ảnh hưởng các phần tử khác.",
    "Với mô hình multi-tenant như dự án của bạn, `for_each` gần như là bắt buộc."
  ]
},

/* ===================== DATABASE ===================== */
{
  id: "DB1", nhom: "core", chuDe: "Database", uu: "high",
  ch: "Chiến lược backup PostgreSQL cho production?",
  tk: ["pg_dump logical", "pg_basebackup + WAL archiving", "PITR", "quy tắc 3-2-1", "restore drill"],
  dy: [
    "Ba tầng: logical (`pg_dump`) portable nhưng chậm, hợp DB nhỏ và migration; physical (`pg_basebackup` + WAL archiving) cho phép PITR — đây mới là thứ production cần; snapshot ở tầng storage (AWS Backup, EBS snapshot).",
    "Áp dụng quy tắc 3-2-1: ba bản sao, hai loại phương tiện, một bản offsite.",
    "Điều quan trọng nhất: backup chưa restore thử thì chưa phải là backup — phải có lịch restore drill định kỳ.",
    "Trung thực: 'Ở AWS em dùng automated backup và AWS Backup theo policy; phần PITR tự quản bằng WAL archiving thì em nắm lý thuyết và đã dựng thử.'"
  ]
},
{
  id: "DB2", nhom: "core", chuDe: "Database", uu: "gap",
  ch: "So sánh backup SQL Server với PostgreSQL.",
  tk: ["Full / Differential / Transaction Log", "recovery model FULL", "chuỗi restore Full → Diff → Log", "Always On AG", "log backup ≈ WAL"],
  dy: [
    "SQL Server có ba loại backup: Full (toàn bộ), Differential (thay đổi kể từ full gần nhất), Transaction Log (log kể từ log backup gần nhất, bắt buộc recovery model FULL).",
    "Chuỗi restore điển hình: Full → Differential mới nhất → các Log backup cho tới thời điểm cần → ra được PITR.",
    "Recovery model: SIMPLE (không log backup, không PITR), FULL, BULK_LOGGED.",
    "HA: Always On Availability Groups, Failover Cluster Instance, Log Shipping.",
    "Câu chốt để vá gap: 'Khái niệm gần như ánh xạ một-một với WAL của PostgreSQL — transaction log backup chính là WAL archiving — nên em tự tin học nhanh.'"
  ],
  bay: "Đây là gap thật. Đừng vờ đã làm — hãy chứng minh bạn hiểu cơ chế và chuyển đổi được kiến thức."
},
{
  id: "DB3", nhom: "core", chuDe: "Database", uu: "high",
  ch: "Query chậm đột ngột dù code không hề đổi. Điều tra thế nào?",
  tk: ["data volume tăng đổi plan", "ANALYZE / UPDATE STATISTICS", "EXPLAIN (ANALYZE, BUFFERS)", "pg_stat_statements", "pg_stat_activity"],
  dy: [
    "Data volume tăng khiến planner đổi execution plan; hoặc thống kê đã cũ (`ANALYZE` với PostgreSQL, `UPDATE STATISTICS` với SQL Server).",
    "Index bloat hoặc thiếu index cho pattern truy vấn mới; lock/blocking; connection pool cạn.",
    "Công cụ: `EXPLAIN (ANALYZE, BUFFERS)`, `pg_stat_statements`, `pg_stat_activity` để xem query nào đang chờ lock. Bên SQL Server là Query Store, execution plan và DMV.",
    "Nguyên tắc: đọc PLAN THẬT chứ không đoán."
  ]
},
{
  id: "DB4", nhom: "core", chuDe: "Database", uu: "strong",
  ch: "Chạy migration schema trên production an toàn — nguyên tắc của bạn?",
  tk: ["job riêng có gate", "one-off task", "changelog versioned", "snapshot trước khi chạy", "expand-contract"],
  dy: [
    "Đây là thế mạnh có bằng chứng của bạn: migration là job riêng, gate theo branch, chạy như one-off ECS Fargate task, changelog được versioned bởi Liquibase và có rollback script.",
    "Backup hoặc snapshot ngay trước khi chạy.",
    "Expand-contract cho thay đổi phá vỡ tương thích: thêm cột mới → deploy code đọc được cả hai → backfill → mới bỏ cột cũ.",
    "Tránh `ALTER TABLE` khoá bảng lớn vào giờ cao điểm.",
    "Đừng quên kể: bạn tự động sinh link CloudWatch Logs khi migration fail để triage nhanh — chi tiết này rất ấn tượng."
  ]
},

/* ===================== MONITORING ===================== */
{
  id: "M1", nhom: "core", chuDe: "Monitoring", uu: "gap",
  ch: "Thiết kế hệ thống monitoring từ đầu cho khoảng 20 server và vài chục container. Bạn dựng gì?",
  tk: ["Prometheus pull", "node_exporter / cAdvisor / blackbox_exporter", "Loki hoặc ELK", "Alertmanager", "cảnh báo theo triệu chứng"],
  dy: [
    "Metrics: Prometheus (mô hình pull) với node_exporter cho host, cAdvisor cho container, postgres_exporter / mssql_exporter cho database, blackbox_exporter để probe HTTP/TCP từ bên ngoài. Grafana làm dashboard. Lưu trữ dài hạn thì Thanos hoặc VictoriaMetrics.",
    "Logs: Loki + Promtail (nhẹ, hợp nếu đã có Grafana) hoặc ELK/OpenSearch (mạnh về search). Log phải có cấu trúc JSON, có trace_id, retention chia theo tier.",
    "Alerting: Alertmanager — routing theo severity, grouping để tránh bão alert, inhibition (node down thì không bắn alert cho từng service trên node đó), silence khi bảo trì. Gửi về Telegram, Slack hoặc email.",
    "Chốt bằng nguyên tắc: cảnh báo theo TRIỆU CHỨNG NGƯỜI DÙNG CẢM NHẬN ĐƯỢC, không phải theo nguyên nhân. CPU 90% không đáng gọi điện lúc 2h sáng, nhưng error rate 5% thì có."
  ],
  bay: "Đừng chỉ đọc tên tool. Giá trị nằm ở ba trụ metrics/logs/alerting và ở nguyên tắc cảnh báo theo triệu chứng."
},
{
  id: "M2", nhom: "core", chuDe: "Monitoring", uu: "gap",
  ch: "Pull (Prometheus) và push (Zabbix, StatsD) — ưu nhược của từng mô hình?",
  tk: ["pull tự biết target chết (up == 0)", "service discovery", "Pushgateway cho job ngắn", "push hợp batch job và thiết bị sau NAT"],
  dy: [
    "Pull: server chủ động scrape nên tự biết target nào chết qua metric `up == 0`, dễ kiểm soát, hợp môi trường có service discovery. Nhược: khó với job ngắn hạn (phải dùng Pushgateway) và với target nằm sau NAT hoặc firewall.",
    "Push: hợp với batch job, thiết bị mạng, và môi trường không thể mở port vào.",
    "Thực tế thường lai cả hai — nói ý này cho thấy bạn nghĩ theo bài toán chứ không theo tool."
  ]
},
{
  id: "M3", nhom: "core", chuDe: "Monitoring", uu: "gap",
  ch: "Four Golden Signals, RED và USE là gì?",
  tk: ["Latency / Traffic / Errors / Saturation", "RED: Rate, Errors, Duration", "USE: Utilization, Saturation, Errors", "SLI / SLO / error budget", "burn rate"],
  dy: [
    "Four Golden Signals của Google SRE: Latency, Traffic, Errors, Saturation.",
    "RED cho service: Rate, Errors, Duration. USE cho tài nguyên: Utilization, Saturation, Errors.",
    "Nói thêm SLI/SLO/error budget: định nghĩa 'tốt' bằng con số, ví dụ 99,9% request dưới 500ms trong 30 ngày.",
    "Nâng cao: alert dựa trên BURN RATE của error budget thay vì ngưỡng tĩnh — cách này ít báo động giả hơn hẳn."
  ]
},
{
  id: "M4", nhom: "core", chuDe: "Monitoring", uu: "gap",
  ch: "Đội bạn bị bắn 200 cảnh báo mỗi ngày và mọi người bắt đầu phớt lờ. Xử lý thế nào?",
  tk: ["page / ticket / dashboard", "xoá alert không ai hành động", "grouping + inhibition", "for: duration", "mỗi alert một runbook"],
  dy: [
    "Phân loại lại toàn bộ alert thành ba nhóm: cần hành động ngay (page), cần xem trong giờ làm việc (ticket), chỉ để tham khảo (dashboard).",
    "Xoá thẳng những alert chưa ai từng hành động theo.",
    "Gộp alert cùng nguyên nhân bằng grouping và inhibition; thêm `for:` duration để bỏ qua nhiễu tức thời.",
    "Mỗi alert bắt buộc kèm link runbook. Review lại danh sách alert hàng tháng.",
    "Nguyên tắc chốt: nếu một alert không dẫn tới hành động nào thì nó không phải alert."
  ],
  bay: "Câu này đánh vào TƯ DUY VẬN HÀNH chứ không phải kiến thức tool — đây chính là thứ JD gọi là 'nâng cao độ tin cậy hệ thống'."
},
{
  id: "M5", nhom: "core", chuDe: "Monitoring", uu: "gap",
  ch: "Hiện tại bạn dùng gì để monitor?",
  tk: ["CloudWatch Logs + metrics + alarm", "Grafana dashboard", "kubectl ở tầng pod", "đang tự dựng Prometheus + Alertmanager + Loki"],
  dy: [
    "Trả lời trung thực: 'Ở AWS em dùng CloudWatch Logs và metrics, có alarm cho các ngưỡng quan trọng, và Grafana cho dashboard. Trên Kubernetes em làm việc nhiều với kubectl và metric ở tầng pod để xử lý sự cố.'",
    "Rồi chủ động nối sang JD: 'Phần em muốn làm sâu hơn và đang tự dựng là stack Prometheus + Alertmanager + Loki tự quản — vì đó chính là thứ phù hợp với môi trường on-premise, khác với môi trường managed em đang có.'",
    "Cách trả lời này vừa thành thật, vừa cho thấy bạn đã đọc kỹ JD và chủ động chuẩn bị."
  ],
  bay: "Họ sẽ hỏi thẳng câu này. Đừng phóng đại — CloudWatch và Grafana là thật, Prometheus tự dựng thì nói rõ là đang học."
},

/* ===================== BACKUP / DR ===================== */
{
  id: "B1", nhom: "core", chuDe: "Backup & DR", uu: "high",
  ch: "RTO và RPO là gì? Hai con số này quyết định điều gì?",
  tk: ["RPO = mất bao nhiêu dữ liệu", "RTO = bao lâu khôi phục xong", "quyết định kinh doanh", "DevOps đưa chi phí, business chọn"],
  dy: [
    "RPO: mất bao nhiêu dữ liệu là chấp nhận được → quyết định tần suất backup hoặc replication.",
    "RTO: bao lâu phải khôi phục xong → quyết định kiến trúc DR.",
    "Điểm ăn tiền: đây là QUYẾT ĐỊNH KINH DOANH, không phải quyết định kỹ thuật. DevOps đưa ra chi phí cho từng mức, business chọn mức họ sẵn sàng trả."
  ]
},
{
  id: "B2", nhom: "core", chuDe: "Backup & DR", uu: "high",
  ch: "Có mấy chiến lược DR và chi phí ra sao?",
  tk: ["Backup & Restore", "Pilot Light", "Warm Standby", "Multi-site Active/Active"],
  dy: [
    "Backup & Restore: RTO tính bằng giờ tới ngày, rẻ nhất.",
    "Pilot Light: hạ tầng lõi chạy tối thiểu, database đã replicate sẵn, RTO vài chục phút.",
    "Warm Standby: một bản thu nhỏ chạy đầy đủ, RTO vài phút.",
    "Multi-site Active/Active: RTO gần bằng không, đắt nhất.",
    "Chọn theo đúng RTO/RPO mà business chấp nhận trả tiền — không có lựa chọn 'tốt nhất' chung chung."
  ]
},
{
  id: "B3", nhom: "core", chuDe: "Backup & DR", uu: "gap",
  ch: "Làm sao bạn biết backup của mình thật sự dùng được?",
  tk: ["restore drill có lịch", "đo RTO thực tế", "giám sát job backup", "bản immutable chống ransomware", "runbook restore"],
  dy: [
    "Restore drill định kỳ có lịch: khôi phục vào môi trường tách biệt, chạy smoke test, đo thời gian thật và ghi lại làm RTO thực tế.",
    "Kiểm tra checksum và tính toàn vẹn.",
    "Giám sát chính job backup — backup fail im lặng là rủi ro lớn nhất, vì bạn chỉ phát hiện đúng lúc cần dùng.",
    "Giữ bản offsite/immutable để chống ransomware, và viết runbook restore để người khác cũng làm được chứ không chỉ mình bạn.",
    "Trung thực nếu bạn chưa chạy DR drill toàn hệ thống, nhưng phải nói rõ vì sao nó bắt buộc."
  ]
},

/* ===================== SECURITY ===================== */
{
  id: "S1", nhom: "core", chuDe: "Security", uu: "high",
  ch: "Hardening một Linux server mới dựng — checklist của bạn?",
  tk: ["tắt password auth + root login", "fail2ban", "firewall deny mặc định", "least privilege", "log ra ngoài host", "audit SUID"],
  dy: [
    "SSH: tắt password authentication và root login, chỉ dùng key, giới hạn IP, thêm fail2ban.",
    "Firewall mặc định deny inbound, chỉ mở port thật sự cần.",
    "Cập nhật bản vá có quy trình (unattended-upgrades) và tắt service không dùng.",
    "Least privilege: user riêng cho từng service, sudo có audit, không chạy service bằng root. Audit SUID định kỳ.",
    "Log tập trung ra ngoài host để kẻ tấn công không xoá được dấu vết; giám sát thay đổi file quan trọng.",
    "Bằng chứng từ CV: CI user least-privilege và pin SSH host key thay vì trust-on-first-use."
  ]
},
{
  id: "S2", nhom: "core", chuDe: "Security", uu: "strong",
  ch: "Quản lý secret trong toàn bộ pipeline — nguyên tắc của bạn?",
  tk: ["không bao giờ trong Git", "lỡ rồi thì phải XOAY secret", "secret manager", "credential ngắn hạn qua OIDC", "gitleaks / trufflehog"],
  dy: [
    "Không bao giờ để trong Git — kể cả history; nếu lỡ thì phải XOAY secret chứ không chỉ xoá commit.",
    "Không để trong image layer hay biến ENV.",
    "Dùng secret manager (Vault, AWS Secrets Manager) với quyền đọc phân theo môi trường.",
    "Ưu tiên credential ngắn hạn qua OIDC hoặc IAM role thay vì key vĩnh viễn.",
    "Mask trong log CI, xoay định kỳ, scan secret ở pre-commit và trong CI bằng gitleaks hoặc trufflehog.",
    "Bạn đã dùng AWS Secrets Manager và IAM — nêu ra."
  ]
},
{
  id: "S3", nhom: "core", chuDe: "Security", uu: "strong",
  ch: "Kể một lỗ hổng bạn đã tự phát hiện và vá.",
  tk: ["SSRF ở crawler", "chặn dải private IP", "chặn cả SAU REDIRECT", "unit test cho từng dải bị chặn"],
  dy: [
    "Bạn có sẵn ví dụ xuất sắc — SSRF ở crawler của Kotae. Kể theo cấu trúc:",
    "Bối cảnh: crawler nhận URL từ người dùng để ingest vào RAG → URL có thể trỏ vào private IP hoặc metadata endpoint của cloud.",
    "Cách vá: thêm kiểm tra reachability chặn dải private IP, và quan trọng nhất là chặn CẢ SAU REDIRECT — rất nhiều người quên bước này, kẻ tấn công dùng redirect để vượt qua lớp kiểm tra đầu.",
    "Kèm unit test cho từng dải bị chặn."
  ],
  bay: "Nhấn đúng hai chi tiết 'sau redirect' và 'unit test' — chúng chứng minh bạn hiểu lỗ hổng chứ không phải copy một hàm validate từ đâu đó."
},

/* ===================== WINDOWS SERVER ===================== */
{
  id: "W1", nhom: "core", chuDe: "Windows Server", uu: "gap",
  ch: "Kinh nghiệm Windows Server của bạn thế nào?",
  tk: ["thành thật", "nền tảng chuyển đổi được", "PowerShell ↔ Bash", "Event Viewer ↔ journald", "hỏi ngược tỷ trọng công việc"],
  dy: [
    "Kịch bản trả lời: 'Thẳng thắn là kinh nghiệm production của em là Linux — em vận hành host tự quản, systemd, Nginx, và ảo hoá bằng Proxmox. Windows Server thì em chưa làm production.'",
    "'Nhưng những thứ em nghĩ vị trí này cần ở Windows — quản lý service và log để troubleshoot, tự động hoá bằng script, quản lý user và permission, patch và backup — thì về nguyên lý em đã làm hàng ngày trên Linux, chỉ khác công cụ: PowerShell thay Bash, Event Viewer thay journald, Task Scheduler thay cron, IIS thay Nginx, GPO thay cấu hình tập trung.'",
    "'Em đang chủ động học phần Active Directory và PowerShell vì đó là khác biệt thật sự chứ không chỉ khác cú pháp. Nếu anh/chị cho em biết tỷ trọng Windows trong công việc thực tế, em sẽ tập trung đúng chỗ.'",
    "Ba lợi ích: thành thật (họ sẽ phát hiện nếu bạn bịa), thể hiện tư duy chuyển đổi kiến thức, và khéo léo hỏi ngược để lấy thông tin bạn cần cho quyết định của chính mình."
  ],
  bay: "Tuyệt đối không bịa. Một câu bịa bị bóc trần ở câu hỏi tiếp theo sẽ phá hỏng toàn bộ phần còn lại của buổi phỏng vấn."
},
{
  id: "W2", nhom: "core", chuDe: "Windows Server", uu: "gap",
  ch: "Kiến thức Windows tối thiểu cần nắm trước buổi phỏng vấn?",
  tk: ["Active Directory / OU / GPO", "IIS application pool", "PowerShell trả object", "Event Viewer", "RDP 3389", "WSUS", "Hyper-V"],
  dy: [
    "Active Directory: domain, OU, group. GPO là cấu hình tập trung áp xuống máy — tương đương công cụ config management.",
    "IIS: web server, application pool (mỗi pool là process riêng có identity riêng, gần giống php-fpm pool).",
    "PowerShell: `Get-Service`, `Get-WinEvent`, remoting qua WinRM. Khác biệt tư duy đáng nói ra: PowerShell trả về OBJECT chứ không phải text như Bash.",
    "Event Viewer với ba log Application, System, Security.",
    "RDP cổng 3389 — không bao giờ mở thẳng ra internet. WSUS để quản lý patch. Hyper-V để ảo hoá.",
    "Điểm cộng khéo: GitLab Runner chạy được trên Windows với shell executor PowerShell — nêu ý này cho thấy bạn đã nghĩ tới việc CI/CD phục vụ cả stack Windows."
  ]
},

/* ===================== CV — ERC BOOKING ===================== */
{
  id: "E1", nhom: "cv", chuDe: "ERC Booking", uu: "strong",
  ch: "'151 resource, 22 module' — vẽ cho tôi kiến trúc và giải thích vì sao chia module như vậy.",
  tk: ["VPC 3 tầng subnet", "CloudFront + WAF → ALB → ECS", "Aurora + ElastiCache", "chia theo vòng đời thay đổi"],
  dy: [
    "Chuẩn bị vẽ được trên giấy trong 2 phút: VPC (public / private / isolated subnet) → CloudFront + WAF → ALB → ECS Fargate (API và worker) → Aurora PostgreSQL + ElastiCache → SQS, SES, Backup, Bastion.",
    "Tiêu chí chia module: theo RANH GIỚI TRÁCH NHIỆM VÀ VÒNG ĐỜI THAY ĐỔI — network đổi hiếm, app đổi liên tục nên tách state riêng. Không chia theo 'cho đẹp'.",
    "Chuẩn bị sẵn một câu tự phê: module nào bạn thấy chia chưa hợp lý và sẽ làm khác đi. Điều này gây ấn tượng rất mạnh."
  ]
},
{
  id: "E2", nhom: "cv", chuDe: "ERC Booking", uu: "strong",
  ch: "Mô hình per-tenant isolation: mỗi clinic một môi trường production riêng. Vì sao chọn thế thay vì multi-tenant chung database? Đánh đổi là gì?",
  tk: ["cách ly dữ liệu y tế", "blast radius nhỏ", "chi phí nhân theo tenant", "N môi trường phải patch và migrate"],
  dy: [
    "Ưu: cách ly dữ liệu triệt để — rất quan trọng với dữ liệu y tế; blast radius nhỏ; tính chi phí và tuỳ biến theo khách dễ; đáp ứng yêu cầu tuân thủ.",
    "Nhược: chi phí hạ tầng nhân theo số tenant; vận hành nặng hơn vì N môi trường đều phải patch, migrate, monitor; rollout một thay đổi phải làm nhiều lần.",
    "Chuẩn bị nói bạn kiểm soát nhược điểm bằng gì: cùng một bộ module, pipeline tham số hoá theo tenant.",
    "Và ở quy mô bao nhiêu tenant thì mô hình này bắt đầu không còn hợp lý — nêu được ngưỡng cho thấy bạn nghĩ xa."
  ]
},
{
  id: "E3", nhom: "cv", chuDe: "ERC Booking", uu: "strong",
  ch: "Dựng một tenant mới mất bao lâu, gồm những bước thủ công nào?",
  tk: ["DNS", "certificate", "seed data", "tài khoản admin đầu tiên", "phần muốn tự động hoá tiếp"],
  dy: [
    "Trả lời trung thực về những bước còn thủ công: DNS, certificate, seed data, tạo tài khoản admin đầu tiên.",
    "Không có hệ thống nào tự động 100% — thừa nhận điều đó đáng tin hơn nhiều so với nói 'chỉ cần chạy một lệnh'.",
    "Nói thêm phần bạn muốn tự động hoá tiếp và vì sao chưa làm (ưu tiên, thời gian, rủi ro)."
  ],
  bay: "Nói 'hoàn toàn tự động' là cái bẫy — câu hỏi tiếp theo sẽ là 'thế DNS ai trỏ?' và bạn sẽ lộ."
},
{
  id: "E4", nhom: "cv", chuDe: "ERC Booking", uu: "strong",
  ch: "Pipeline patch ECS task definition — mô tả chính xác các bước. Nếu service không stable sau rollout thì sao?",
  tk: ["register-task-definition", "update-service", "wait services-stable", "dọn revision cũ", "deployment circuit breaker"],
  dy: [
    "Các bước: lấy task definition hiện tại → thay image sang tag mới → `register-task-definition` tạo revision mới → `update-service` → chờ `services-stable` → dọn revision cũ.",
    "Câu chốt quan trọng: ECS rolling update giữ task cũ cho tới khi task mới pass health check, nên khi fail thì service tự giữ nguyên bản cũ. Rollback chủ động là `update-service` về revision trước.",
    "Chuẩn bị nói về deployment circuit breaker của ECS — nếu bạn chưa bật thì nói thật và nói bạn sẽ bật."
  ]
},
{
  id: "E5", nhom: "cv", chuDe: "ERC Booking", uu: "strong",
  ch: "'Branch-gated Liquibase migration chạy như one-off ECS Fargate task' — tại sao tách khỏi service? Migration fail giữa chừng thì sao?",
  tk: ["phải chạy đúng một lần", "race condition nếu nhúng vào app startup", "changelog lock", "DATABASECHANGELOG", "snapshot trước migration"],
  dy: [
    "Tách vì migration phải chạy ĐÚNG MỘT LẦN — nếu nhúng vào app startup thì N task cùng khởi động sẽ chạy song song, gây race condition.",
    "Ngoài ra migration cần quyền database cao hơn app và cần gate riêng.",
    "Liquibase có changelog lock chống chạy song song và ghi bảng `DATABASECHANGELOG` để biết changeset nào đã chạy.",
    "Fail giữa chừng: changeset nào đã commit thì đã commit — cần rollback script hoặc restore từ snapshot.",
    "Chuẩn bị trả lời: bạn có chụp snapshot trước migration production không? Nếu chưa, đó chính là điều bạn sẽ bổ sung."
  ]
},
{
  id: "E6", nhom: "cv", chuDe: "ERC Booking", uu: "strong",
  ch: "'Immutable cache-control trên hashed asset + targeted invalidation' — giải thích cơ chế zero-downtime cho SPA.",
  tk: ["hash trong tên file", "max-age=31536000, immutable", "index.html no-cache", "chỉ invalidate index", "asset trước, index sau"],
  dy: [
    "Asset có hash trong tên (`app.a3f9.js`) → nội dung không bao giờ đổi với cùng tên → đặt `Cache-Control: max-age=31536000, immutable`, không cần invalidate, CDN cache vĩnh viễn.",
    "`index.html` thì `no-cache` hoặc TTL ngắn, và CHỈ invalidate đúng file này.",
    "Kết quả: user tải index mới, index trỏ tới asset mới vốn đã nằm sẵn trên CDN → không có khoảng thời gian index mới trỏ tới asset chưa upload.",
    "Thứ tự upload rất quan trọng: ASSET TRƯỚC, INDEX.HTML SAU."
  ],
  bay: "Nêu được thứ tự upload là dấu hiệu bạn thật sự làm chứ không phải đọc tài liệu."
},

/* ===================== CV — KOTAE ===================== */
{
  id: "KT1", nhom: "cv", chuDe: "Kotae", uu: "high",
  ch: "Kể một sự cố production cụ thể trên Kotae: hiện tượng, cách tìm ra, cách sửa, cách phòng ngừa tái diễn.",
  tk: ["exit code 137", "logs --previous", "memory spike theo kích thước input", "đo p99 memory", "alert trước ngưỡng OOM"],
  dy: [
    "Hiện tượng: pod restart liên tục vào lúc traffic cao, user báo timeout.",
    "Điều tra: `describe` thấy exit code 137 → `logs --previous` → xem memory usage ngay trước khi chết.",
    "Nguyên nhân: workload AI xử lý document lớn, memory spike theo kích thước input, còn limit thì đặt theo mức trung bình chứ không theo mức đỉnh.",
    "Xử lý ngay: nâng limit, restart để khôi phục dịch vụ.",
    "Phòng ngừa: đo lại percentile p99 của memory và đặt requests/limits theo đó, thêm alert trước ngưỡng OOM, giới hạn kích thước input, cân nhắc tách worker riêng cho file lớn."
  ],
  bay: "Gần như chắc chắn sẽ bị hỏi. Kết bằng PHÒNG NGỪA mới là điểm phân biệt senior — đừng dừng ở 'em restart pod là hết'."
},
{
  id: "KT2", nhom: "cv", chuDe: "Kotae", uu: "strong",
  ch: "Quản lý 4 môi trường bằng Helm với chart chung, values riêng. Làm sao tránh thay đổi cho dev vô tình ảnh hưởng production?",
  tk: ["values tách bạch", "prod bắt buộc review", "pin chart version + image digest", "promote theo thứ tự", "helm diff"],
  dy: [
    "Values file tách bạch hoàn toàn, môi trường production bắt buộc có review.",
    "Pin chart version và image digest, không dùng tag động.",
    "Promote lần lượt dev → test → demo → production, không bao giờ deploy thẳng vào production.",
    "`helm diff` trước khi upgrade để thấy đúng cái gì sắp đổi.",
    "Giá trị nhạy cảm không nằm trong values mà lấy từ secret manager.",
    "Nói thêm `--atomic` để tự rollback khi upgrade fail, `helm history` và `helm rollback`."
  ]
},
{
  id: "KT3", nhom: "cv", chuDe: "Kotae", uu: "high",
  ch: "Rollback bằng Helm khi release mới có kèm thay đổi schema database — có rollback được không?",
  tk: ["helm rollback chỉ quay manifest", "KHÔNG quay dữ liệu", "backward-compatible migration", "expand-contract", "tách deploy schema và code"],
  dy: [
    "`helm rollback` chỉ quay ngược MANIFEST, không quay ngược DỮ LIỆU.",
    "Nếu migration đã chạy và phá vỡ tương thích ngược thì code phiên bản cũ sẽ lỗi ngay khi rollback.",
    "Giải pháp: thiết kế migration backward-compatible theo expand-contract để phiên bản N-1 vẫn chạy được với schema mới; tách deploy schema và deploy code thành hai bước; luôn có rollback script cho migration."
  ],
  bay: "Câu bẫy rất hay. Trả lời 'rollback được, dùng helm rollback' là rơi thẳng vào bẫy."
},
{
  id: "KT4", nhom: "cv", chuDe: "Kotae", uu: "strong",
  ch: "Autoscaling cho workload AI — HPA theo metric nào? Vì sao CPU thường không đủ?",
  tk: ["chờ I/O từ API ngoài", "CPU thấp nhưng concurrency cao", "custom metric qua Prometheus adapter", "KEDA scale theo queue", "stabilizationWindowSeconds"],
  dy: [
    "Workload LLM phần lớn thời gian chờ I/O từ API bên ngoài (Bedrock, OpenAI) → CPU thấp nhưng concurrency cao → HPA theo CPU không scale kịp.",
    "Cần custom metric: số request đang xử lý, độ dài queue, hoặc metric từ Prometheus qua adapter. KEDA rất hợp để scale theo queue.",
    "Thêm: cold start của pod lâu nên phải scale sớm, và đặt `stabilizationWindowSeconds` để tránh flapping."
  ]
},

/* ===================== CV — PORTFOLIO ===================== */
{
  id: "P1", nhom: "cv", chuDe: "Portfolio tự quản", uu: "strong",
  ch: "Vì sao tự dựng trên VPS thay vì dùng Vercel hay Netlify cho nhanh?",
  tk: ["tự chịu trách nhiệm toàn chuỗi", "TLS, reverse proxy, container runtime", "platform managed che đi hết", "gần nhất với on-prem"],
  dy: [
    "Trả lời thật: để tự chịu trách nhiệm toàn bộ chuỗi — TLS, reverse proxy, container runtime, CI/CD, rollback, monitoring — những thứ mà platform managed che đi hết.",
    "Và chính vì thế nó là kinh nghiệm gần nhất với môi trường on-premise.",
    "Câu này gắn thẳng vào JD của họ — hãy chủ động đưa dự án này lên sớm trong buổi phỏng vấn dù nó là dự án 'nhỏ' nhất trong CV."
  ]
},
{
  id: "P2", nhom: "cv", chuDe: "Portfolio tự quản", uu: "strong",
  ch: "Mô tả chuỗi ci.yml → cd.yml → deploy.yml. Vì sao tách ba workflow thay vì gộp một?",
  tk: ["ci = kiểm tra chất lượng", "cd = build + push image", "deploy gọi lại độc lập để rollback", "phân quyền secret riêng"],
  dy: [
    "Tách theo trách nhiệm: ci kiểm tra chất lượng và chạy cho mọi PR; cd build và push image, chỉ chạy khi main đã pass; deploy đưa lên host và gọi lại được độc lập để rollback.",
    "Lợi ích: rollback không phải build lại; mỗi phần test và tái sử dụng riêng được; phân quyền secret theo từng workflow.",
    "Nối sang stack của họ: 'Đây chính là nguyên lý của `include:` kết hợp `rules` trong GitLab CI.'"
  ]
},
{
  id: "P3", nhom: "cv", chuDe: "Portfolio tự quản", uu: "strong",
  ch: "Rollback về tag cũ — cụ thể chạy gì, mất bao lâu, và làm sao biết rollback đã thành công?",
  tk: ["image tag theo commit SHA", "lưu version đang chạy trước khi deploy", "compose up --wait", "healthcheck có retry", "báo Telegram"],
  dy: [
    "Vì image tag theo commit SHA và bạn lưu lại version đang chạy trước khi deploy → rollback chính là trigger deploy workflow với tag cũ.",
    "`compose up --wait` kèm healthcheck có retry, kết quả báo về Telegram.",
    "Chuẩn bị con số thời gian thật của bạn.",
    "Nêu giới hạn trung thực: cơ chế rollback này không xử lý thay đổi schema database."
  ]
},
{
  id: "P4", nhom: "cv", chuDe: "Portfolio tự quản", uu: "strong",
  ch: "'Pin host key thay vì trust-on-first-use' — tại sao chi tiết này quan trọng?",
  tk: ["StrictHostKeyChecking=no", "man-in-the-middle", "secret deploy gửi nhầm cho kẻ tấn công", "known_hosts pin sẵn"],
  dy: [
    "`StrictHostKeyChecking=no` — cách đa số người làm — khiến CI chấp nhận BẤT KỲ server nào trả lời ở địa chỉ đó.",
    "Hệ quả: mở đường cho tấn công man-in-the-middle, và secret deploy bị gửi thẳng cho kẻ tấn công.",
    "Pin sẵn `known_hosts` trong workflow đảm bảo chỉ kết nối đúng server mình sở hữu."
  ],
  bay: "Chi tiết nhỏ nhưng cực kỳ ăn điểm với người phỏng vấn có nghề — hãy CHỦ ĐỘNG kể, đừng chờ được hỏi."
},
{
  id: "P5", nhom: "cv", chuDe: "Portfolio tự quản", uu: "high",
  ch: "Nếu VPS này chết hoàn toàn ngay bây giờ, bạn mất bao lâu để dựng lại?",
  tk: ["image trong GHCR", "cấu hình trong Git", "còn thủ công: provision host, Docker, cert, DNS", "Ansible / cloud-init"],
  dy: [
    "Đây là câu hỏi DR trá hình — nhận ra điều đó rồi hãy trả lời.",
    "Những gì đã có: image trong GHCR, cấu hình trong Git, workflow deploy tự động.",
    "Những gì còn thủ công: provision host, cài Docker, certificate, DNS, restore dữ liệu.",
    "Nếu chưa có IaC cho phần host thì nói thật và nói đó là thứ bạn sẽ làm — Ansible hoặc cloud-init."
  ],
  bay: "Nhận ra điểm yếu của chính hệ thống mình là dấu hiệu của kỹ sư vận hành trưởng thành. Đừng phòng thủ."
},

/* ===================== CV — CÔNG TY ===================== */
{
  id: "C1", nhom: "cv", chuDe: "Kinh nghiệm công ty", uu: "high",
  ch: "Bạn làm qua Jenkins, GitLab CI và GitHub Actions. So sánh và nói khi nào chọn cái nào.",
  tk: ["Jenkins: linh hoạt nhưng phải tự vận hành", "GitLab: tích hợp chặt, self-host được", "Actions: hệ sinh thái lớn, phụ thuộc nền tảng", "nguyên lý chung không đổi"],
  dy: [
    "Jenkins: linh hoạt nhất, plugin ecosystem khổng lồ, nhưng BẠN PHẢI VẬN HÀNH CHÍNH NÓ — agent, credential, plugin, nâng cấp, bảo mật. Bạn đã làm việc này nên nói được cái giá thật của nó. Hợp môi trường legacy hoặc on-prem phức tạp.",
    "GitLab CI: tích hợp chặt với SCM, cấu hình khai báo trong repo, có sẵn registry, environment, review app, và self-host được → hợp nhất với môi trường on-prem có yêu cầu kiểm soát dữ liệu.",
    "GitHub Actions: hệ sinh thái action lớn, khởi động nhanh, nhưng phụ thuộc nền tảng và self-host runner phải tự lo.",
    "Chốt: 'Với môi trường của anh/chị, GitLab CI là lựa chọn đúng vì tự host được và gắn liền với repo. Điểm chung của cả ba là nguyên lý: tách stage, artifact bất biến, gate bằng test, secret nằm ngoài repo, rollback bằng cách deploy lại artifact cũ. Em học cú pháp mới nhanh vì phần nguyên lý không đổi.'"
  ],
  bay: "Xác suất bị hỏi rất cao vì CV bạn ghi cả ba. Câu chốt ở cuối chính là câu vá gap GitLab của bạn."
},
{
  id: "C2", nhom: "cv", chuDe: "Kinh nghiệm công ty", uu: "strong",
  ch: "Bạn sửa CI của HR platform từ `workflow_run` sang `workflow_call` vì 'lần chạy đầu của mỗi PR bị bỏ qua âm thầm'. Phát hiện bug đó thế nào và vì sao nó nguy hiểm?",
  tk: ["workflow_run ràng buộc branch mặc định", "PR đầu tiên không kích hoạt", "false confidence", "đối chiếu số lần chạy với số PR"],
  dy: [
    "`workflow_run` trigger dựa trên việc một workflow khác hoàn thành và có ràng buộc về branch mặc định → PR đầu tiên không kích hoạt được.",
    "Nguy hiểm vì check hiển thị xanh hoặc không hiển thị, nhưng thật ra CHƯA HỀ CHẠY — đây là false confidence, còn tệ hơn không có CI, vì cả team tin tưởng vào một cái gate không tồn tại.",
    "`workflow_call` biến nó thành job phụ thuộc thật trong cùng một pipeline.",
    "Cách phát hiện: bạn đối chiếu số lần chạy thực tế với số PR, không phải chờ ai báo."
  ]
},
{
  id: "C3", nhom: "cv", chuDe: "Kinh nghiệm công ty", uu: "strong",
  ch: "Vì sao thay MinIO bằng LocalStack? Nguyên tắc chung rút ra là gì?",
  tk: ["tương thích S3 API nhưng không phải S3", "khác IAM policy, presigned URL, event notification", "môi trường test càng giống prod càng tốt", "LocalStack cũng không phải AWS thật"],
  dy: [
    "MinIO tương thích S3 API nhưng không phải S3 — khác ở IAM policy, presigned URL, event notification và một số edge case → test pass ở local nhưng fail ở production.",
    "LocalStack mô phỏng sát AWS hơn nên thu hẹp khoảng cách đó.",
    "Nguyên tắc: môi trường test càng giống production thì càng phát hiện lỗi sớm; mỗi điểm khác biệt giữa local, CI và production là một chỗ bug có thể ẩn náu.",
    "Trung thực về giới hạn: LocalStack cũng không phải AWS thật, vẫn cần một tầng test chạy trên môi trường thật."
  ]
},
{
  id: "C4", nhom: "cv", chuDe: "Kinh nghiệm công ty", uu: "high",
  ch: "Bạn là first-line support cho dev và release engineer. Mô tả quy trình khi có người báo 'pipeline của tôi fail'.",
  tk: ["thu thập trước khi đoán", "đọc từ ĐIỂM FAIL ĐẦU TIÊN", "phân loại code / cấu hình / hạ tầng / flaky", "unblock trước, root cause sau", "viết runbook"],
  dy: [
    "Thu thập trước khi đoán: link pipeline, commit, môi trường, lần cuối chạy được là khi nào, có gì vừa thay đổi.",
    "Đọc log từ ĐIỂM FAIL ĐẦU TIÊN, không phải lỗi cuối cùng — lỗi cuối thường chỉ là hệ quả.",
    "Phân loại: lỗi code / lỗi cấu hình / lỗi hạ tầng / flaky.",
    "Nếu đang chặn release thì unblock trước (rerun, workaround) rồi mới tìm root cause.",
    "Sau đó: nếu lỗi lặp lại thì sửa hẳn vào pipeline hoặc viết tài liệu để lần sau dev tự xử lý được.",
    "Nhấn điểm cuối: bạn viết runbook để giảm số lần người ta phải hỏi bạn — đó là tư duy scale."
  ]
},
{
  id: "C5", nhom: "cv", chuDe: "Kinh nghiệm công ty", uu: "high",
  ch: "Bạn vừa làm dev vừa làm DevOps trong đội 14–15 người. Làm sao cân bằng và ưu tiên?",
  tk: ["chặn release > chặn nhiều người > tự động hoá > nice-to-have", "viết runbook giảm phụ thuộc cá nhân"],
  dy: [
    "Cách phân loại ưu tiên: việc chặn release > việc chặn nhiều người > việc tự động hoá tiết kiệm dài hạn > việc nice-to-have.",
    "Nêu bạn viết tài liệu và runbook để giảm phụ thuộc vào cá nhân mình.",
    "Đây cũng là câu để thể hiện kỹ năng phối hợp mà JD nhắc tới."
  ]
},

/* ===================== TÌNH HUỐNG ===================== */
{
  id: "TH1", nhom: "tinhhuong", chuDe: "Tình huống", uu: "high",
  ch: "2h sáng, website production down, bạn đang trực. Kể từng bước bạn làm.",
  tk: ["xác nhận thật sự down", "kiểm tra phạm vi", "thay đổi gần nhất", "rollback ngay", "thông báo kênh incident"],
  dy: [
    "Xác nhận thật sự down chứ không phải lỗi mạng phía mình.",
    "Kiểm tra phạm vi: một service hay toàn bộ, một region hay tất cả.",
    "Xem thay đổi gần nhất: có deploy không, migration không, certificate hết hạn không, đĩa đầy không.",
    "Nếu trùng với một lần deploy thì ROLLBACK NGAY, không debug trước.",
    "Thông báo kênh incident, khôi phục dịch vụ, sáng hôm sau viết postmortem.",
    "Câu chốt: 'Mục tiêu lúc 2h sáng là khôi phục dịch vụ, không phải hiểu nguyên nhân. Hiểu nguyên nhân là việc của ban ngày.'"
  ]
},
{
  id: "TH2", nhom: "tinhhuong", chuDe: "Tình huống", uu: "high",
  ch: "Deploy xong 15 phút thì error rate tăng, nhưng sếp nói 'cứ để đó xem nó tự hết không'. Bạn làm gì?",
  tk: ["trình bày bằng dữ liệu", "nêu chi phí rollback thấp", "đề xuất mốc quyết định cụ thể", "tôn trọng quyết định + ghi vào postmortem"],
  dy: [
    "Câu này test CHÍNH KIẾN KỸ THUẬT và KỸ NĂNG GIAO TIẾP, không phải kỹ thuật thuần.",
    "Trình bày bằng dữ liệu chứ không bằng cảm tính: 'hiện 5% request lỗi, tương đương X user mỗi phút'.",
    "Nêu rõ chi phí rollback là thấp và có thể deploy lại sau khi hiểu nguyên nhân.",
    "Đề xuất mốc quyết định cụ thể: 'nếu sau 5 phút nữa không giảm thì em rollback'.",
    "Nếu sếp vẫn giữ quyết định thì tôn trọng, nhưng ghi lại và đưa vào postmortem."
  ],
  bay: "Đừng trả lời kiểu 'em cứ rollback thôi' — nó thể hiện không biết làm việc trong tổ chức."
},
{
  id: "TH3", nhom: "tinhhuong", chuDe: "Tình huống", uu: "high",
  ch: "Disk usage trên server production đạt 95% và đang tăng. Xử lý thế nào?",
  tk: ["du -sh /* | sort -h", "ncdu", "docker system df", "lsof +L1", "logrotate", "alert ở 80% chứ không phải 95%"],
  dy: [
    "Ngay lập tức: tìm thứ chiếm chỗ bằng `du -sh /* | sort -h` hoặc `ncdu`; kiểm tra log không xoay vòng; Docker rác (`docker system df` rồi prune cẩn thận, chú ý đừng xoá volume đang dùng); core dump; backup cũ.",
    "Kiểm tra file bị xoá mà process còn giữ bằng `lsof +L1`.",
    "Dài hạn: cấu hình logrotate, đặt retention policy, alert ở ngưỡng 80% chứ không phải 95% — alert phải cho bạn đủ thời gian hành động.",
    "Cân nhắc tách partition để log đầy không giết cả hệ thống."
  ],
  bay: "Không xoá file đang được process ghi — dung lượng sẽ không được giải phóng."
},
{
  id: "TH4", nhom: "tinhhuong", chuDe: "Tình huống", uu: "high",
  ch: "Ứng dụng chậm dần và crash sau vài ngày chạy, restart lại thì bình thường. Chẩn đoán?",
  tk: ["memory leak", "fd leak", "đồ thị memory tăng đơn điệu", "lsof -p | wc -l", "restart định kỳ chỉ là băng cứu thương"],
  dy: [
    "Dấu hiệu kinh điển của memory leak hoặc connection/file-descriptor leak.",
    "Xác định: vẽ đồ thị memory theo thời gian — tăng đơn điệu không giảm là leak; `lsof -p <pid> | wc -l` xem file descriptor có tăng không; kiểm tra connection pool database có đóng đúng không; heap dump nếu là JVM hoặc Node.",
    "Biện pháp tạm: restart định kỳ kèm memory limit để container tự restart — nhưng phải nói rõ đây là BĂNG CỨU THƯƠNG, không phải chữa trị.",
    "Biện pháp thật: tìm leak trong code cùng đội dev."
  ],
  bay: "Phải phân biệt rõ đâu là giải pháp tạm, đâu là giải pháp thật. Dừng ở 'restart định kỳ' là câu trả lời của người vận hành thụ động."
},
{
  id: "TH5", nhom: "tinhhuong", chuDe: "Tình huống", uu: "high",
  ch: "Người dùng báo 'hệ thống chậm' nhưng dashboard của bạn toàn màu xanh. Làm sao?",
  tk: ["đang đo sai thứ", "trung bình vs p95/p99", "đo server-side hay client-side", "synthetic monitoring", "RUM"],
  dy: [
    "Dashboard xanh nghĩa là BẠN ĐANG ĐO SAI THỨ — nói thẳng ý này trước.",
    "Bạn đo trung bình hay percentile? p50 đẹp nhưng p99 thảm là chuyện rất thường — phải xem p95/p99.",
    "Bạn đo ở đâu? Server-side nhanh nhưng client-side chậm do CDN, DNS, mạng hoặc frontend.",
    "Chậm ở chức năng nào, user nào, khu vực nào? Hỏi user cụ thể về thời điểm và thao tác.",
    "Bổ sung synthetic monitoring từ bên ngoài (blackbox exporter) và Real User Monitoring.",
    "Bài học: THÊM CHỈ SỐ ĐO ĐÚNG LÀ MỘT PHẦN CỦA VIỆC KHẮC PHỤC."
  ]
},
{
  id: "TH6", nhom: "tinhhuong", chuDe: "Tình huống", uu: "high",
  ch: "Pipeline chạy tốt suốt, hôm nay tự nhiên fail hàng loạt dù không ai sửa code. Nguyên nhân có thể là gì?",
  tk: ["tag latest bị cập nhật", "package mới phát hành", "cert/token hết hạn", "rate limit Docker Hub", "so log fail với log xanh gần nhất"],
  dy: [
    "Dependency bên ngoài đổi: image tag `latest` vừa được cập nhật, package mới phát hành, action hoặc plugin tự nâng version → đây chính là lý do phải pin version và digest.",
    "Certificate hoặc token hết hạn; registry hay dịch vụ bên ngoài down; runner hết disk hoặc memory; rate limit của Docker Hub; đồng hồ hệ thống sai làm TLS fail.",
    "Cách tìm: so sánh log của job fail với log lần chạy xanh gần nhất — điểm khác nhau đầu tiên chính là manh mối."
  ]
},
{
  id: "TH7", nhom: "tinhhuong", chuDe: "Tình huống", uu: "high",
  ch: "Database production chậm nghiêm trọng vào giờ cao điểm, và không được phép downtime. Xử lý thế nào?",
  tk: ["đo trước: active connection, long query, lock", "pgbouncer", "read replica", "CREATE INDEX CONCURRENTLY", "pg_stat_statements"],
  dy: [
    "Đo trước: số connection đang active, query nào chạy lâu, có blocking/lock không, CPU và IO của database, cache hit ratio, connection pool có cạn không.",
    "Giảm tải ngay: kill query chạy hoang (cẩn trọng), tăng pool hoặc thêm pgbouncer, đẩy truy vấn đọc sang read replica, bật cache ở tầng ứng dụng.",
    "Trung hạn: thêm index bằng `CREATE INDEX CONCURRENTLY` để không khoá bảng, tối ưu query xấu nhất theo `pg_stat_statements`, phân trang thay vì query toàn bảng."
  ],
  bay: "Chi tiết `CONCURRENTLY` cho thấy bạn thật sự hiểu ràng buộc 'không downtime' — đừng bỏ qua."
},
{
  id: "TH8", nhom: "tinhhuong", chuDe: "Tình huống", uu: "high",
  ch: "Bạn phát hiện credential production bị commit lên Git từ 3 tháng trước. Xử lý theo thứ tự nào?",
  tk: ["XOAY CREDENTIAL TRƯỚC TIÊN", "kiểm tra log truy cập", "git filter-repo / BFG", "ai đã clone thì vẫn còn", "secret scanning"],
  dy: [
    "Bước 1 — XOAY CREDENTIAL NGAY LẬP TỨC. Coi như đã bị lộ. Đây là việc đầu tiên và quan trọng nhất.",
    "Bước 2 — kiểm tra log truy cập xem có dấu hiệu bị dùng trái phép không.",
    "Bước 3 — xoá khỏi lịch sử Git bằng `git filter-repo` hoặc BFG, nhưng hiểu rằng ai đã clone thì vẫn còn, nên bước này KHÔNG THAY THẾ bước 1.",
    "Bước 4 — báo cáo theo quy trình bảo mật của công ty.",
    "Bước 5 — phòng ngừa: secret scanning ở pre-commit và trong CI, chuyển sang secret manager, chuyển sang credential ngắn hạn."
  ],
  bay: "Ứng viên yếu sẽ nói 'xoá commit đi' trước tiên. Đó là câu trả lời SAI và người phỏng vấn dùng đúng câu này để phân loại."
},
{
  id: "TH9", nhom: "tinhhuong", chuDe: "Tình huống", uu: "high",
  ch: "Được giao 'cải thiện độ tin cậy hệ thống' mà không có yêu cầu cụ thể. 90 ngày đầu bạn làm gì?",
  tk: ["Tháng 1: quan sát, không đổi gì lớn", "Tháng 2: vá chỗ chảy máu", "Tháng 3: hệ thống hoá — SLO, runbook, IaC, DR drill", "ưu tiên theo tần suất × ảnh hưởng"],
  dy: [
    "Tháng 1 — Quan sát: lập bản đồ hệ thống và phụ thuộc; xem lại lịch sử sự cố (incident nào lặp lại nhiều nhất); kiểm tra hiện trạng backup, monitoring, alert; nói chuyện với dev và support để biết cái gì đau nhất. KHÔNG đổi gì lớn trong tháng đầu.",
    "Tháng 2 — Vá chỗ chảy máu: bịt các rủi ro rõ ràng — backup chưa từng restore thử, alert thiếu hoặc quá nhiễu, không có đường rollback, secret nằm trong repo. Chuẩn hoá một pipeline mẫu.",
    "Tháng 3 — Hệ thống hoá: đặt SLI/SLO cho dịch vụ quan trọng nhất; viết runbook cho 5 sự cố hay gặp nhất; IaC hoá phần hạ tầng thay đổi nhiều nhất; chạy DR drill đầu tiên.",
    "Chốt: 'Em ưu tiên theo tần suất sự cố nhân với mức ảnh hưởng, và em sẽ hỏi anh/chị điều gì đang gây đau nhất trước khi tự quyết.'"
  ],
  bay: "Rất có thể bị hỏi vì JD ghi rõ 'nâng cao độ tin cậy hệ thống'. Vế 'tháng đầu không đổi gì lớn' là thứ người phỏng vấn muốn nghe."
},
{
  id: "TH10", nhom: "tinhhuong", chuDe: "Tình huống", uu: "high",
  ch: "Bạn từng làm hỏng production chưa? Kể lại.",
  tk: ["chọn sự cố thật, mức độ vừa phải", "nhận trách nhiệm", "trọng tâm ở vế phòng ngừa", "không đổ lỗi"],
  dy: [
    "Chắc chắn sẽ bị hỏi. ĐỪNG nói 'chưa bao giờ' — nghe là biết hoặc chưa đụng production thật, hoặc không trung thực.",
    "Chọn một sự cố thật, mức độ vừa phải, kể theo cấu trúc: bối cảnh → bạn làm gì sai → phát hiện ra sao → khắc phục thế nào.",
    "Và quan trọng nhất: BẠN ĐÃ THAY ĐỔI GÌ TRONG HỆ THỐNG HOẶC QUY TRÌNH để nó không xảy ra lại. Trọng tâm phải nằm ở vế cuối này.",
    "Nhận trách nhiệm, không đổ cho người khác hay cho công cụ."
  ]
},

/* ===================== HỎI NGƯỢC ===================== */
{
  id: "HN1", nhom: "hoinguoc", chuDe: "Hỏi về công việc", uu: "high",
  ch: "Tỷ trọng công việc giữa Linux và Windows Server hiện tại khoảng bao nhiêu ạ?",
  tk: ["bạn CẦN con số này"],
  dy: ["Đây là câu quan trọng nhất trong nhóm hỏi ngược: con số này quyết định bạn có thật sự phù hợp hay không, và nên đầu tư học Windows tới mức nào."]
},
{
  id: "HN2", nhom: "hoinguoc", chuDe: "Hỏi về công việc", uu: "high",
  ch: "Hạ tầng hiện tại là on-premise, cloud hay hybrid? Nếu on-prem thì đang ảo hoá bằng gì?",
  tk: ["nghe xem có Proxmox / VMware / Hyper-V"],
  dy: ["Nếu họ dùng Proxmox thì bạn có lợi thế trực tiếp — hãy nói ngay bạn đã dùng Proxmox cho VM và LXC."]
},
{
  id: "HN3", nhom: "hoinguoc", chuDe: "Hỏi về công việc", uu: "high",
  ch: "GitLab đang self-hosted hay dùng gitlab.com? Runner đang chạy executor nào?",
  tk: ["self-hosted nghĩa là bạn sẽ phải vận hành cả GitLab"],
  dy: ["Câu này vừa lấy thông tin vừa chứng minh bạn hiểu GitLab ở mức kiến trúc chứ không chỉ mức viết file YAML."]
},
{
  id: "HN4", nhom: "hoinguoc", chuDe: "Hỏi về công việc", uu: "high",
  ch: "Hiện monitoring và alerting đang dùng gì? Nếu chưa có thì đây có phải việc anh/chị kỳ vọng người mới xây từ đầu không?",
  tk: ["JD ghi 'xây dựng' — cần làm rõ phạm vi"],
  dy: ["Làm rõ đây là việc vận hành cái có sẵn hay dựng mới từ số không — hai việc này khác nhau rất xa về khối lượng và về kỳ vọng."]
},
{
  id: "HN5", nhom: "hoinguoc", chuDe: "Hỏi về công việc", uu: "high",
  ch: "Hệ thống hiện tại deploy với tần suất thế nào, và quy trình rollback đang ra sao?",
  tk: ["tần suất deploy nói lên độ trưởng thành của quy trình"],
  dy: ["Nếu họ deploy mỗi tháng một lần và rollback bằng tay thì đó vừa là rủi ro vừa là cơ hội để bạn tạo dấu ấn nhanh."]
},
{
  id: "HN6", nhom: "hoinguoc", chuDe: "Hỏi về công việc", uu: "high",
  ch: "Đội DevOps hiện có bao nhiêu người? Em sẽ là người duy nhất hay có team?",
  tk: ["một mình gánh toàn bộ hạ tầng là rủi ro lớn"],
  dy: ["Nếu bạn là người duy nhất thì phải hỏi tiếp về on-call và về việc ai thay khi bạn nghỉ phép."]
},
{
  id: "HN7", nhom: "hoinguoc", chuDe: "Hỏi về điều kiện", uu: "high",
  ch: "Có chế độ trực on-call không ạ? Nếu có thì luân phiên thế nào và có phụ cấp riêng không?",
  tk: ["hỏi thẳng — đây là câu hỏi chuyên nghiệp"],
  dy: ["Rất quan trọng với lịch làm 5,5 ngày/tuần. Hỏi thẳng không hề bất lịch sự — người phỏng vấn có nghề sẽ đánh giá cao vì nó cho thấy bạn đã từng vận hành thật."]
},
{
  id: "HN8", nhom: "hoinguoc", chuDe: "Hỏi về điều kiện", uu: "high",
  ch: "Sự cố production gần đây nhất là gì và team đã xử lý ra sao?",
  tk: ["nghe xem họ có postmortem hay chỉ đổ lỗi"],
  dy: ["Câu này cho bạn biết rất nhiều về VĂN HOÁ KỸ THUẬT THẬT của họ — quan trọng hơn mọi thứ ghi trong JD."]
},
{
  id: "HN9", nhom: "hoinguoc", chuDe: "Hỏi về điều kiện", uu: "high",
  ch: "Trong 6 tháng đầu, anh/chị kỳ vọng người vào vị trí này tạo ra thay đổi rõ rệt nhất là gì?",
  tk: ["làm rõ tiêu chí đánh giá"],
  dy: ["Câu trả lời của họ chính là tiêu chí bạn sẽ bị đánh giá — và nếu kỳ vọng quá xa thực tế thì đó là dấu hiệu cảnh báo."]
},
{
  id: "HN10", nhom: "hoinguoc", chuDe: "Hỏi về lộ trình", uu: "strong",
  ch: "Anh/chị có kế hoạch đưa Kubernetes hoặc IaC vào không? Nếu có thì em có thể đóng góp ngay ở mảng đó.",
  tk: ["biến thế mạnh thành đề xuất giá trị"],
  dy: ["Hỏi ở vòng sau, khi đã qua phần kỹ thuật. Đây là cách biến điểm mạnh lệch so với JD thành lợi thế đàm phán."]
},
{
  id: "HN11", nhom: "hoinguoc", chuDe: "Hỏi về lộ trình", uu: "strong",
  ch: "Quỹ đào tạo hàng năm mà JD nhắc tới cụ thể áp dụng thế nào ạ?",
  tk: ["JD có nêu — hỏi cho thấy bạn đọc kỹ"],
  dy: ["Câu nhẹ nhàng để kết thúc, đồng thời cho thấy bạn đã đọc JD kỹ tới từng dòng phúc lợi."]
}

];
