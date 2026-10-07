/* ============================================================
   Trang 8 — Case thực tế trong DevOps
   Mỗi mục là một case: bối cảnh → lựa chọn → cách làm → kiểm chứng → rủi ro.
   Phần lớn bám vào hệ thống đã nêu trong CV (ERC multi-tenant, Kotae trên
   Kubernetes, dịch vụ tự quản) để mở câu trả lời bằng ‘em đã làm…’.
   Cấu trúc dữ liệu: xem chú thích đầu js/kb.js
   ============================================================ */

const TRANG = {
  id: "cases",
  ten: "Case thực tế trong DevOps",
  nhan: "Case thực tế",
  nhanSkill: "Công nghệ xuất hiện trong các case",
  nhanCV: "Các dòng CV mà những case này bám vào",
  mucLucCV: "CV nào đứng sau các case",
  tomTat: "Những tình huống thật mà một DevOps phải xử lý: **triển khai multi-tenant, migration, truy cập database trong private network, zero-downtime cho FE và BE trên ECS Fargate / EKS / on-prem, rollout / rollback, SSRF, secret, khôi phục dữ liệu, chi phí**. Mỗi case đi theo cùng khung — bối cảnh, lựa chọn và đánh đổi, các bước làm, cách kiểm chứng, rủi ro — để bạn kể được trong 2–3 phút.",
  cvSkill: ["Terraform", "ECS Fargate", "EKS", "Aurora", "SSM", "Liquibase", "Kubernetes", "Helm", "ALB", "CloudFront", "Nginx", "Secrets Manager", "CloudWatch"],

  cv: [
    { nguon: "ERC Booking · Multi-tenant",
      noi: "Designed the per-tenant isolation model so each new clinic gets a dedicated production environment from the same modules, then used it to stand up the first production tenant alongside shared dev/staging." },
    { nguon: "ERC Booking · Migration",
      noi: "Engineered a branch-gated Liquibase migration pipeline that runs as a one-off ECS Fargate task per environment and auto-generates CloudWatch Logs links for failure triage." },
    { nguon: "ERC Booking · Hạ tầng (Bastion, Backup)",
      noi: "…22 reusable modules (VPC, ECS Fargate, Aurora PostgreSQL, ElastiCache, CloudFront + WAF, SQS, SES, Backup, Bastion)." },
    { nguon: "ERC Booking · Rollout + Frontend",
      noi: "Built the GitHub Actions rollout pipeline that patches ECS task definitions, registers revisions, and rolls out API/worker services with stability checks, old-revision cleanup… Authored the S3 + CloudFront release pipeline for the frontend, using immutable cache-control on hashed assets with targeted invalidation for zero-downtime SPA deploys." },
    { nguon: "Kotae · Bộ nhớ",
      noi: "Kept memory-heavy, bursty AI workloads stable under live traffic: diagnosed pod-level incidents with kubectl — OOMKilled containers, CrashLoopBackOff, failing probes — and tuned resource requests, limits, and probe thresholds." },
    { nguon: "Kotae · Bảo mật",
      noi: "Hardened the RAG ingestion path against server-side request forgery, adding private-IP and redirect reachability checks around the crawler, with unit tests covering the blocked ranges." },
    { nguon: "Professional summary",
      noi: "…a multi-tenant AWS platform — 151 Terraform resources across 22 reusable modules — with zero-downtime container rollouts and gated database migrations…" },
    { nguon: "Self-managed deployment",
      noi: "Public production service on a self-managed Linux host rather than a managed platform, delivery path owned end to end." }
  ],

  bank: ["ERC Booking", "Kotae", "Tình huống"],

  muc: [
    /* ---------------------------------------------------------- */
    {
      id: "khung", ten: "Khung kể một case trong 2–3 phút",
      y: [
        "**Tám bước**: (1) **Bối cảnh** và mục tiêu → (2) **Ràng buộc** (downtime, chi phí, tuân thủ, thời gian) → (3) **Các lựa chọn** và đánh đổi → (4) **Quyết định** và lý do → (5) **Các bước thực hiện** → (6) **Kiểm chứng** thành công → (7) **Rủi ro và rollback** → (8) **Bài học / phòng ngừa**.",
        "**Mở bằng bằng chứng từ CV** (‘em đã làm…’) rồi mới khái quát. Nêu **một con số thật** và **một chi tiết chỉ người làm mới biết** (vd `iam:PassRole`, đọc `exitCode`, thứ tự upload asset trước index).",
        "**Nói về đánh đổi** thay vì ‘cách tốt nhất’: mỗi quyết định kiến trúc đều có cái giá. Người phỏng vấn đánh giá khả năng cân nhắc, không phải khả năng thuộc đáp án.",
        "**Thừa nhận phần chưa làm hoặc còn thủ công** và nói bạn sẽ làm gì tiếp — đáng tin hơn nhiều so với nói quá.",
        "**Kết bằng phòng ngừa**: sau khi xử lý xong, hệ thống hay quy trình đã tốt lên thế nào. Dừng ở ‘em restart / rollback là xong’ là câu trả lời của người vận hành thụ động.",
        "**Các case dưới đây** gồm: kiến trúc (1, 3) · dữ liệu và truy cập (2, 4, 10) · triển khai và phát hành (5, 6) · **zero-downtime FE / BE trên ECS, EKS, on-prem (12–16)** · sự cố và bảo mật (7, 8, 9) · chi phí (11)."
      ]
    },

    /* ---------------------------------------------------------- */
    {
      id: "multi-tenant", ten: "Case 1 — Triển khai multi-tenant",
      y: [
        "**Bối cảnh**: một sản phẩm SaaS phục vụ nhiều khách hàng (*tenant*, vd mỗi phòng khám). Bài toán: cô lập dữ liệu, kiểm soát chi phí, và vận hành được khi số tenant tăng.",
        "**Ba mô hình**: *Pool* (mọi tenant dùng chung hạ tầng và database, phân biệt bằng `tenant_id` / Row-Level Security) · *Bridge* (chung hạ tầng, database hoặc schema riêng) · *Silo* (hạ tầng + database riêng cho từng tenant). ERC đi theo hướng silo ở production: mỗi clinic một môi trường riêng từ cùng bộ module.",
        "**Chọn mô hình dựa trên**: yêu cầu cách ly / tuân thủ (dữ liệu y tế → silo), số lượng và quy mô tenant, chi phí cố định mỗi tenant (NAT Gateway, Aurora tối thiểu…), mức tuỳ biến theo khách, và năng lực vận hành N môi trường.",
        "**Danh tính tenant xuyên suốt**: subdomain hoặc header → tenant; mọi log / metric / tag có `tenant`; tên tài nguyên có tiền tố tenant (`<tenant>-api`); ở silo thì IAM role, security group, KMS key riêng cho từng tenant.",
        "**Onboarding tenant mới** (pipeline tham số hoá): (1) thêm tenant vào danh sách / tạo thư mục root + `tfvars`; (2) `terraform plan` → duyệt → `apply` (VPC, ECS, Aurora… từ cùng module, state riêng); (3) DNS + certificate; (4) chạy migration + seed dữ liệu; (5) tạo tài khoản admin đầu tiên; (6) smoke test; (7) bàn giao thông tin và ghi vào danh sách môi trường.",
        "**Vận hành N môi trường**: cùng một version module và image cho mọi tenant; rollout **theo đợt** (tenant nội bộ / canary trước → nhóm nhỏ → toàn bộ); tự động hoá patch, migrate, monitor; dashboard theo biến `$tenant`; cảnh báo gắn tenant.",
        "**Chi phí**: gắn tag `tenant` và bật cost allocation tags; chia sẻ phần không cần cách ly (dev / staging, CI, công cụ) để giảm chi phí cố định.",
        "**Noisy neighbor** (chỉ ở pool): một tenant ngốn tài nguyên làm chậm tenant khác → rate limit / quota theo tenant, hoặc tách tenant lớn ra silo. Ở silo, vấn đề này gần như không có.",
        "**Offboarding**: sao lưu theo yêu cầu, xoá dữ liệu đúng cam kết, huỷ tài nguyên (`terraform destroy` chỉ trong state của tenant đó — kiểm tra kỹ trước), giữ bằng chứng đã xoá.",
        "**Ngưỡng chuyển đổi**: khi số tenant lớn và nhiều tenant nhỏ, silo trở nên đắt và nặng → cân nhắc mô hình hybrid: tenant nhỏ vào pool, tenant lớn / yêu cầu cao giữ silo."
      ],
      bang: {
        ten: "Pool, Bridge, Silo",
        cot: ["", "Pool", "Bridge", "Silo"],
        hang: [
          ["Cách ly dữ liệu", "Logic (`tenant_id`, RLS)", "Database / schema riêng", "Hạ tầng + database riêng"],
          ["Chi phí mỗi tenant", "Thấp nhất", "Trung bình", "Cao nhất (chi phí cố định nhân theo tenant)"],
          ["Blast radius", "Toàn bộ tenant", "Theo database", "Một tenant"],
          ["Vận hành", "Một hệ thống — dễ", "Trung bình", "N môi trường — nhiều việc, bắt buộc tự động hoá"],
          ["Tuân thủ / yêu cầu khách", "Khó chứng minh cách ly", "Khá", "Dễ nhất"],
          ["Hợp khi", "Nhiều tenant nhỏ, ít yêu cầu cách ly", "Cần tách dữ liệu nhưng muốn chia sẻ compute", "Dữ liệu nhạy cảm, tenant lớn, yêu cầu tuân thủ"]
        ]
      },
      ma: {
        ten: "Terraform — mỗi tenant một thư mục root, state riêng, cùng một bộ module",
        noi: [
          "# tenants/clinic-a/main.tf",
          "terraform {",
          '  backend "s3" { key = "erc/tenants/clinic-a.tfstate" }   # bucket, region truyền qua -backend-config',
          "}",
          "",
          'module "platform" {',
          '  source            = "../../modules/platform"            # gọi các module VPC, ECS, Aurora… (đã pin version)',
          '  tenant            = "clinic-a"',
          '  env               = "prod"',
          '  domain            = "clinic-a.example.com"',
          "  api_desired_count = 2",
          "}"
        ]
      },
      lenh: [
        ["terraform -chdir=tenants/clinic-a plan -out=tfplan", "Plan riêng một tenant"],
        ["terraform -chdir=tenants/clinic-a state list | wc -l", "Số resource của một tenant"],
        ["aws resourcegroupstaggingapi get-resources --tag-filters Key=tenant,Values=clinic-a", "Mọi tài nguyên AWS của một tenant (theo tag)"],
        ["aws ce get-cost-and-usage --time-period Start=<d1>,End=<d2> --granularity MONTHLY --metrics UnblendedCost --group-by Type=TAG,Key=tenant", "Chi phí theo tenant (cần bật cost allocation tag)"]
      ],
      bay: "Nói ‘tạo tenant mới hoàn toàn tự động’ (DNS, certificate, seed dữ liệu, admin đầu tiên thường vẫn còn thủ công) hoặc quên tính chi phí cố định nhân theo số tenant.",
      cv: "Đây là case số một của bạn: ‘per-tenant isolation… the first production tenant alongside shared dev/staging’. Kể theo thứ tự: bài toán → vì sao chọn silo → cách tổ chức Terraform → quy trình onboarding → nhược điểm bạn đã thấy (N môi trường) và ngưỡng bạn sẽ cân nhắc đổi mô hình. Xem E2, E3 trong ngân hàng."
    },

    /* ---------------------------------------------------------- */
    {
      id: "migration-schema", ten: "Case 2 — Migration schema database trong pipeline, không downtime",
      y: [
        "**Bối cảnh**: cần đổi schema của hệ thống đang chạy (thêm / đổi cột, thêm index) mà không downtime, đi qua nhiều môi trường, và phải rollback được nếu có sự cố.",
        "**Nguyên tắc**: migration tách khỏi deploy code, chạy **đúng một lần**, có gate; schema đi trước và **tương thích ngược**, code theo sau.",
        "**Quy trình trong pipeline** (case ERC): (1) PR chứa changelog Liquibase → CI chạy `validate` + `update-sql` để xem trước SQL; (2) merge vào nhánh chính → job migrate **gate theo branch** cho từng môi trường; (3) **snapshot** database production ngay trước khi chạy; (4) chạy Liquibase như **one-off ECS Fargate task** (cùng VPC / SG nên chạm được database ở mạng riêng); (5) pipeline **đợi task dừng rồi đọc `exitCode`**; (6) fail → in link CloudWatch Logs và dừng pipeline (**không** deploy code mới); (7) thành công → deploy code mới → verify.",
        "**Vì sao one-off task thay vì nhúng vào app startup**: chỉ chạy đúng một lần (không race giữa các replica), cần quyền DB cao hơn app, fail không làm app crash-loop, log và exit code rõ ràng.",
        "**Thay đổi phá vỡ tương thích** → expand–contract qua nhiều lần phát hành: thêm cột mới → code ghi cả hai → backfill → code dùng cái mới → xoá cột cũ.",
        "**Backfill lớn**: tách thành job riêng, chia lô, idempotent, theo dõi tải và replication lag; đừng nhét vào changeSet chính nếu chạy lâu.",
        "**Khoá**: `lock_timeout` + `CREATE INDEX CONCURRENTLY` (`runInTransaction: false`) để không chặn truy vấn của người dùng.",
        "**Rollback có hai tầng**: rollback *code* (deploy lại tag / revision cũ — an toàn nhờ schema tương thích ngược) và rollback *schema* (khối `rollback` của changeSet, hoặc restore snapshot). Restore snapshot là phương án cuối vì mất dữ liệu ghi sau thời điểm snapshot.",
        "**Fail giữa chừng / lock kẹt**: xem `DATABASECHANGELOG` để biết changeSet nào đã chạy; nếu task bị kill để lại `DATABASECHANGELOGLOCK` → `release-locks` sau khi chắc không còn tiến trình migration nào.",
        "**Thử trước**: restore snapshot production sang môi trường tạm, chạy migration để đo thời gian và khoá — con số thật thay cho phỏng đoán."
      ],
      ma: {
        ten: "Luồng migration trong pipeline",
        noi: [
          "PR      → CI: liquibase validate + update-sql (xem trước SQL)",
          "merge   → [gate theo branch / môi trường]",
          "prod    → snapshot DB (aws rds create-db-cluster-snapshot)",
          "         → run-task one-off ECS Fargate: liquibase update   (trong VPC, chạm được DB private)",
          "         → wait tasks-stopped → đọc exitCode của container",
          "              ├─ ≠ 0 : in link CloudWatch Logs, DỪNG pipeline (không deploy code mới)",
          "              └─ = 0 : deploy code (ECS / Helm) → verify health → xong"
        ]
      },
      lenh: [
        ["liquibase validate && liquibase update-sql", "Bước xem trước trong CI"],
        ["aws rds create-db-cluster-snapshot --db-cluster-identifier <c> --db-cluster-snapshot-identifier pre-migrate-<id>", "Snapshot trước khi migrate production"],
        ["aws ecs describe-tasks --cluster <c> --tasks <arn> --query 'tasks[0].containers[0].exitCode'", "Kết quả thật của migration (xem script đầy đủ ở trang CI/CD)"],
        ["SELECT id, author, filename, dateexecuted FROM databasechangelog ORDER BY orderexecuted DESC LIMIT 5;", "Changeset nào đã chạy gần nhất"],
        ["liquibase release-locks", "Nhả lock bị kẹt — chỉ khi chắc không có migration nào đang chạy"]
      ],
      bay: "Deploy code mới ngay khi job migrate ‘xong’ mà không kiểm tra exit code; hoặc migration xoá cột trong cùng lần phát hành với code mới (rollback code sẽ lỗi vì cột đã mất).",
      cv: "‘Branch-gated Liquibase migration pipeline… one-off ECS Fargate task per environment and auto-generates CloudWatch Logs links’. Kể đúng thứ tự trên và nhấn ba chi tiết: gate theo branch, đọc exit code, link CloudWatch khi fail. Xem E5, DB4, KT3 trong ngân hàng."
    },

    /* ---------------------------------------------------------- */
    {
      id: "chuyen-he-thong", ten: "Case 3 — Di chuyển hệ thống sang hạ tầng mới (cutover)",
      y: [
        "**Bối cảnh**: chuyển một dịch vụ đang chạy (từ VPS / on-prem sang AWS, hoặc từ Compose sang Kubernetes / ECS) với downtime tối thiểu và có đường lui rõ ràng.",
        "**Giai đoạn 1 — Khảo sát**: liệt kê thành phần (ứng dụng, database, file / object, cron, secret, certificate, DNS, tích hợp bên ngoài), dung lượng dữ liệu, lưu lượng, ràng buộc (IP whitelist của đối tác, domain), yêu cầu RTO / RPO. Xác định **cái gì khó chuyển nhất** — thường là database và state.",
        "**Giai đoạn 2 — Dựng môi trường đích** bằng IaC, **song song** với hệ cũ; chạy dịch vụ đích với dữ liệu thử hoặc bản sao; kiểm thử chức năng, hiệu năng, bảo mật.",
        "**Giai đoạn 3 — Đồng bộ dữ liệu**: (a) *dump / restore* kèm khoảng downtime (đơn giản, hợp DB nhỏ); (b) *replication liên tục* (PostgreSQL logical replication, AWS DMS) rồi **cutover** khi đã bắt kịp — downtime chỉ vài phút. File / object dùng `rsync` / `aws s3 sync` / DataSync chạy lặp tới khi chênh lệch nhỏ.",
        "**Giai đoạn 4 — Chuẩn bị cutover**: **hạ TTL của DNS** (vd 60s) từ vài ngày trước; chốt checklist; thông báo cửa sổ bảo trì; kế hoạch rollback đã được thử; xác minh backup của hệ cũ.",
        "**Giai đoạn 5 — Cutover**: đặt hệ cũ ở chế độ bảo trì / chỉ-đọc → đồng bộ lần cuối (dừng ghi, đợi replication lag = 0) → đối chiếu số liệu (đếm bản ghi, checksum) → bật ghi ở hệ mới → đổi DNS / LB → theo dõi sát.",
        "**Giai đoạn 6 — Sau cutover**: giữ hệ cũ sẵn sàng làm **đường lui** trong một khoảng ổn định (vd 1–2 tuần), theo dõi lỗi, latency, chi phí, rồi mới tắt hệ cũ và xoá dữ liệu theo quy trình.",
        "**Chuyển dần thay vì ‘big bang’**: dùng weighted DNS (Route 53) hoặc LB để chuyển 5% → 25% → 100% lưu lượng khi ứng dụng cho phép (hợp dịch vụ stateless).",
        "**Rủi ro hay bị bỏ sót**: cron job / tác vụ ngầm trên máy cũ, file cấu hình sửa tay, kết nối từ đối tác bằng IP cố định, certificate / domain, email (SPF / DKIM), múi giờ / locale, giới hạn upload, giới hạn kết nối.",
        "**Kiểm chứng**: so số lượng bản ghi và checksum mẫu, chạy smoke test và kịch bản nghiệp vụ chính, đối chiếu log lỗi giữa hai hệ."
      ],
      bang: {
        ten: "Chiến lược chuyển dữ liệu",
        cot: ["Cách", "Downtime", "Độ phức tạp", "Hợp khi"],
        hang: [
          ["Dump + restore", "Vài phút tới nhiều giờ (tỷ lệ với dung lượng)", "Thấp", "DB nhỏ, chấp nhận cửa sổ bảo trì"],
          ["Replication liên tục rồi cutover", "Vài phút", "Cao hơn (cấu hình, theo dõi lag)", "DB lớn, yêu cầu downtime thấp"],
          ["Dual-write / chuyển dần theo tính năng", "Gần như không", "Cao nhất (code + dữ liệu)", "Hệ lớn, đội đủ sức, chuyển theo từng module"]
        ]
      },
      ma: {
        ten: "Dòng thời gian cutover mẫu",
        noi: [
          "T-7 ngày : hạ TTL DNS xuống 60s; dựng xong môi trường đích; thử restore backup của hệ cũ",
          "T-1 ngày : đồng bộ dữ liệu lần đầu; smoke test trên hệ đích; chốt checklist + người phụ trách",
          "T-0      : 1) bật chế độ bảo trì / chỉ-đọc ở hệ cũ",
          "           2) đợi replication lag = 0 (hoặc dump + restore lần cuối)",
          "           3) đối chiếu số bản ghi / checksum",
          "           4) trỏ DNS / LB sang hệ mới → smoke test → mở lại cho người dùng",
          "T+1..14  : theo dõi lỗi, latency, chi phí; giữ hệ cũ ở trạng thái chỉ-đọc làm đường lui",
          "T+14     : tắt hệ cũ, xoá dữ liệu theo quy trình (sau khi lưu bản backup cuối)"
        ]
      },
      lenh: [
        ["dig +noall +answer app.example.com", "DNS hiện tại và TTL còn lại"],
        ["pg_dump -Fc -d <db> -f db.dump  →  pg_restore -d <target> -j4 db.dump", "Dump / restore PostgreSQL (restore song song)"],
        ["rsync -aHAX --info=progress2 <src>/ <dst>/", "Đồng bộ file, chạy lặp tới khi chênh lệch nhỏ"],
        ["aws s3 sync <src> s3://<bucket>", "Đồng bộ lên S3"],
        ["curl -s -o /dev/null -w '%{time_total} %{http_code}\\n' https://<new>/health", "So thời gian phản hồi của hệ mới"]
      ],
      bay: "Quên hạ TTL DNS trước cutover: một phần người dùng vẫn bị trỏ về hệ cũ hàng giờ → ghi dữ liệu vào hai nơi (split-brain). Và tắt hệ cũ ngay sau cutover khiến không còn đường lui.",
      cv: "Dịch vụ tự quản của bạn (Linux host + Docker Compose + Nginx) là điểm xuất phát điển hình của một cuộc di chuyển; câu ‘nếu host này chết hoàn toàn, bao lâu dựng lại?’ (P5 trong ngân hàng) chính là bản thu nhỏ của case này. Chuẩn bị nói thật phần đã tự động hoá và phần còn thủ công."
    },

    /* ---------------------------------------------------------- */
    {
      id: "truy-cap-db-private", ten: "Case 4 — Truy cập database trong private network",
      y: [
        "**Bối cảnh**: Aurora nằm ở **isolated subnet** (không route ra internet, không public) — đúng thiết kế an toàn. Nhưng dev / DevOps vẫn cần truy cập để debug, chạy truy vấn, xử lý sự cố. Làm sao vào được mà không phá cách ly?",
        "**Nguyên tắc**: không bao giờ mở database ra internet; truy cập phải có **danh tính, thời hạn, audit và quyền tối thiểu**; ưu tiên cách *không mở cổng vào* (SSM, one-off task) hơn cách mở cổng (SSH bastion).",
        "**Cách 1 — SSM Session Manager port forwarding** (khuyến nghị): một instance nhỏ (bastion) trong VPC chạy SSM agent, **không cần public IP, không mở cổng 22**; người dùng đăng nhập bằng IAM; session có audit (CloudTrail, tuỳ chọn ghi session vào S3 / CloudWatch). `aws ssm start-session` với document `AWS-StartPortForwardingSessionToRemoteHost` mở một cổng local dẫn tới endpoint của DB.",
        "**Cách 2 — Bastion SSH + tunnel**: bastion ở public subnet, security group chỉ cho IP tin cậy, `ssh -L 15432:<db-endpoint>:5432`. Đơn giản, quen thuộc nhưng phải quản lý khoá SSH, vá bastion và mở cổng 22.",
        "**Cách 3 — One-off ECS task / Kubernetes pod tạm** chạy `psql` (hoặc job migration) *bên trong* VPC: không cần mở đường từ máy cá nhân, hợp cho tác vụ lặp lại có kịch bản. `ECS Exec` để vào task có sẵn; với Kubernetes dùng `kubectl run … --rm -it` hoặc `kubectl debug`.",
        "**Cách 4 — VPN / Client VPN / Tailscale**: truy cập mạng riêng nói chung (nhiều dịch vụ), hợp đội lớn; quản lý chính sách theo nhóm.",
        "**Guardrails**: SG của DB chỉ nhận từ SG của app và SG của bastion / VPN; người dùng phân quyền theo vai trò (ưu tiên **read-only** khi debug); **không dùng tài khoản master** — dùng user riêng hoặc IAM auth, mật khẩu lấy từ Secrets Manager; session có thời hạn; bật audit (CloudTrail, log kết nối, `pgaudit`); có quy trình *break-glass* ghi lại lý do.",
        "**Tắt khi không dùng**: bastion có thể dừng ngoài giờ (hoặc tạo theo yêu cầu) để giảm bề mặt tấn công và chi phí.",
        "**Sửa dữ liệu thủ công trên production**: cần người thứ hai xem xét, chạy trong transaction, `SELECT` trước `UPDATE`, có snapshot / backup, ghi lại câu lệnh đã chạy."
      ],
      bang: {
        ten: "Các cách vào database trong mạng riêng",
        cot: ["Cách", "Mở cổng vào?", "Danh tính / audit", "Độ phức tạp", "Hợp khi"],
        hang: [
          ["SSM port forwarding", "Không", "IAM + CloudTrail (+ session log)", "Thấp–vừa", "Mặc định cho người cần truy cập DB"],
          ["Bastion SSH tunnel", "Có (22, giới hạn IP)", "Khoá SSH, log SSH", "Vừa", "Chưa có SSM; quản khoá tốt"],
          ["One-off task / pod tạm", "Không", "IAM / RBAC, log của task", "Vừa", "Tác vụ có kịch bản (migration, script)"],
          ["VPN", "Có (VPN endpoint)", "Theo IdP / VPN", "Cao hơn", "Nhiều dịch vụ riêng, đội lớn"]
        ]
      },
      ma: {
        ten: "Tunnel SSM tới Aurora rồi kết nối bằng psql",
        noi: [
          "# 1) Mở tunnel qua SSM — không SSH, không public IP",
          "aws ssm start-session --target i-0abc123456789 \\",
          "  --document-name AWS-StartPortForwardingSessionToRemoteHost \\",
          "  --parameters '{\"host\":[\"<aurora-cluster-endpoint>\"],\"portNumber\":[\"5432\"],\"localPortNumber\":[\"15432\"]}'",
          "",
          "# 2) Ở terminal khác: kết nối qua cổng local (mật khẩu lấy từ Secrets Manager, không gõ vào lịch sử shell)",
          'psql "host=127.0.0.1 port=15432 dbname=app user=readonly sslmode=require"'
        ]
      },
      lenh: [
        ["aws ssm describe-instance-information --query 'InstanceInformationList[].[InstanceId,PingStatus]'", "Instance nào đang online trên SSM"],
        ["aws ssm start-session --target <instance-id>", "Mở shell qua SSM (không cần SSH)"],
        ["ssh -N -L 15432:<db-endpoint>:5432 <user>@<bastion>", "Tunnel SSH tới DB qua bastion"],
        ["aws ecs execute-command --cluster <c> --task <id> --container app --interactive --command sh", "Vào task đang chạy (ECS Exec)"],
        ["kubectl run psql --rm -it --image=postgres:16 -- psql \"host=<db> user=<u> dbname=<d>\"", "Pod tạm trong cluster để kết nối DB"],
        ["aws secretsmanager get-secret-value --secret-id <id> --query SecretString --output text", "Lấy mật khẩu (đừng dán ra chat hay log)"]
      ],
      bay: [
        "Mở SG của DB cho `0.0.0.0/0` hoặc IP nhà ‘tạm thời một chút’ rồi quên đóng — nhiều vụ lộ database bắt đầu đúng như vậy.",
        "Dùng tài khoản master, hoặc dùng chung một tài khoản cho cả đội: không biết ai đã làm gì. Lưu ý thêm: qua tunnel, `sslmode=verify-full` sẽ lỗi vì hostname không khớp chứng chỉ — dùng `require` hoặc `verify-ca`."
      ],
      cv: "Terraform của bạn có module **Bastion** và Aurora ở subnet cách ly, nên câu ‘làm sao vào DB production để debug?’ gần như chắc chắn xuất hiện. Trả lời: không mở DB ra ngoài; bạn vào qua Bastion (nêu đúng cách bạn dùng) kèm kiểm soát (tài khoản riêng, audit, thời hạn). Đừng nói quá nếu thực tế bạn dùng cách khác."
    },

    /* ---------------------------------------------------------- */
    {
      id: "rollout-ecs", ten: "Case 5 — Rollout và rollback không downtime trên ECS",
      y: [
        "**Bối cảnh**: deploy API / worker lên ECS Fargate mà không rớt request, và quay lại nhanh nếu bản mới lỗi.",
        "**Quy trình (ERC)**: build image tag theo SHA → lấy task definition hiện tại → vá image mới (`jq`) → `register-task-definition` → `update-service` → `wait services-stable` → kiểm tra → dọn revision cũ.",
        "**Điều gì tạo ra ‘không downtime’**: rolling update với `minimumHealthyPercent=100`, `maximumPercent=200` (chạy task mới trước), health check ALB chính xác, `healthCheckGracePeriodSeconds` cho app khởi động chậm, drain kết nối (`deregistration_delay`, SIGTERM + `stopTimeout`), và app xử lý SIGTERM.",
        "**Khi bản mới lỗi lúc khởi động**: task mới không qua health check thì ECS giữ task cũ (service không sập); **circuit breaker** dừng rollout và tự rollback về revision ổn định. Trong pipeline, `wait services-stable` fail → job fail → báo.",
        "**Rollback chủ động** khi bản mới *chạy được nhưng sai* (lỗi nghiệp vụ, 5xx tăng): `update-service --task-definition <family>:<revision cũ>` (revision cũ còn nguyên) rồi `wait services-stable`. Với tag theo SHA, rollback = deploy lại tag cũ.",
        "**Điều kiện để rollback an toàn**: schema DB tương thích ngược (xem Case 2), không có thay đổi dữ liệu không đảo ngược, và biết revision / tag đang chạy trước khi deploy (ghi lại).",
        "**Selective build (monorepo)**: chỉ build / deploy service có thay đổi (lọc `paths` ở cấp job) mà vẫn giữ required check — xem trang CI/CD.",
        "**Quan sát trong lúc rollout**: tỷ lệ 5xx và latency của target group, số task healthy / unhealthy, events của service; đặt cảnh báo khi rollout kẹt.",
        "**Cẩn trọng hơn nữa**: canary hoặc blue/green (CodeDeploy hoặc tính năng blue/green tích hợp của ECS). Đánh đổi: phức tạp hơn, tốn gấp đôi tài nguyên trong lúc chuyển.",
        "**Đi sâu hơn**: cơ chế drain, `stopTimeout`, `deregistration_delay` và so sánh với EKS / on-prem nằm ở Case 12–15."
      ],
      lenh: [
        ["aws ecs describe-services --cluster <c> --services <s> --query 'services[0].deployments'", "Deployment hiện tại: PRIMARY / ACTIVE, số task running / desired"],
        ["aws ecs describe-services --cluster <c> --services <s> --query 'services[0].events[:10]'", "Sự kiện mới nhất — vì sao task bị thay"],
        ["aws elbv2 describe-target-health --target-group-arn <arn>", "Target healthy / unhealthy và lý do"],
        ["aws ecs update-service --cluster <c> --service <s> --task-definition <family>:<rev-cũ>", "Rollback về revision cũ"],
        ["aws ecs list-task-definitions --family-prefix <family> --sort DESC --max-items 5", "Các revision gần nhất"]
      ],
      bay: "Health check quá lỏng (chỉ kiểm tra cổng mở): task ‘healthy’ nhưng app chưa sẵn sàng → rớt request lúc rollout. Hoặc rollback code khi schema đã đổi theo hướng không tương thích.",
      cv: "‘Rolls out API/worker services with stability checks, old-revision cleanup’. Chuẩn bị mô tả đủ chuỗi: tag SHA → vá task definition → rollout → `wait stable` → rollback bằng revision cũ, và điều bạn kiểm tra để chắc rollback an toàn (xem E4 trong ngân hàng)."
    },

    /* ---------------------------------------------------------- */
    {
      id: "phat-hanh-spa", ten: "Case 6 — Phát hành SPA không bị trang trắng (S3 + CloudFront)",
      y: [
        "**Bối cảnh**: sau mỗi lần deploy frontend, một số người dùng thấy trang trắng hoặc lỗi tải file JS (404 / ChunkLoadError), hoặc vẫn thấy bản cũ.",
        "**Nguyên nhân gốc**: `index.html` (cũ hoặc mới) trỏ tới file JS có hash không còn / chưa có; cache (CloudFront hoặc trình duyệt) giữ `index.html` cũ trong khi asset cũ đã bị xoá; hoặc upload sai thứ tự.",
        "**Cách làm đúng (CV)**: asset có hash trong tên + `Cache-Control: max-age=31536000, immutable`; `index.html` thì `no-cache`; upload **asset trước, `index.html` sau**; invalidate **chỉ `/index.html`**; **giữ asset của phiên bản trước** một thời gian cho người dùng đang mở bản cũ.",
        "**SPA routing**: custom error response 403 / 404 → `/index.html` (mã 200).",
        "**Kiểm chứng sau deploy**: `curl -I` xem `x-cache`, `cache-control` của `index.html`; mở bản mới trong cửa sổ ẩn danh; console không có lỗi 404 asset.",
        "**Rollback**: upload lại `index.html` của bản trước (asset cũ vẫn còn) + invalidate `/index.html` — vài chục giây, không cần build lại.",
        "**Service worker / PWA** (nếu có) có thể giữ bản cũ — cần chiến lược cập nhật, nếu không người dùng kẹt ở bản cũ dù đã deploy. FE trong container (ECS / EKS) và on-prem được mở rộng ở Case 16.",
        "**Biến cấu hình lúc build** (API URL…) bị ‘đóng cứng’ vào bundle → mỗi môi trường một bản build, hoặc đọc cấu hình runtime từ `config.json` (không cache) để build một lần dùng cho mọi môi trường.",
        "**Bảo mật**: bucket không public (OAC), security headers, WAF; không đưa secret vào bundle — mọi thứ trong bundle đều là công khai."
      ],
      ma: {
        ten: "Thứ tự phát hành frontend",
        noi: [
          "set -euo pipefail",
          "npm run build                                       # dist/ chứa file có hash",
          "",
          "# 1) asset TRƯỚC",
          "aws s3 sync dist/ \"s3://$BUCKET\" --exclude index.html \\",
          "  --cache-control 'public,max-age=31536000,immutable'",
          "",
          "# 2) index SAU CÙNG",
          "aws s3 cp dist/index.html \"s3://$BUCKET/index.html\" --cache-control 'no-cache'",
          "",
          "# 3) chỉ invalidate index",
          "aws cloudfront create-invalidation --distribution-id \"$DIST\" --paths /index.html"
        ]
      },
      lenh: [
        ["curl -sI https://app.example.com/ | grep -iE 'cache-control|x-cache|age'", "Header cache của index.html"],
        ["curl -s https://app.example.com/ | grep -oE 'assets/[^\"]+\\.js' | head", "index.html đang trỏ tới asset nào"],
        ["aws s3 ls s3://<bucket>/assets/ | head", "Asset đã có trên S3 chưa"],
        ["aws cloudfront get-invalidation --distribution-id <id> --id <inv-id>", "Trạng thái invalidation"]
      ],
      bay: "Xoá sạch bucket rồi upload lại (`sync --delete`) khi người dùng đang dùng: khoảng trống làm trang lỗi. Hoặc invalidate `/*` rồi tin là xong — trình duyệt vẫn có thể giữ asset / `index.html` cũ.",
      cv: "Đúng case CV của bạn (E6 trong ngân hàng): nhấn ba chi tiết — thứ tự upload (asset trước, index sau), `no-cache` cho index + immutable cho asset, và chỉ invalidate index. Thêm vế rollback nhanh bằng index cũ để cho thấy bạn nghĩ tới đường lui."
    },

    /* ---------------------------------------------------------- */
    {
      id: "oom-ai", ten: "Case 7 — Workload AI bị OOMKilled trên Kubernetes",
      y: [
        "**Hiện tượng**: pod của dịch vụ AI restart liên tục lúc traffic cao, người dùng báo timeout; `kubectl get pod` thấy `RESTARTS` tăng, trạng thái `OOMKilled` / `CrashLoopBackOff`.",
        "**Điều tra theo thứ tự**: (1) `describe pod` → `Last State: Terminated · Reason: OOMKilled · Exit Code: 137`; (2) `logs --previous` (thường không có lỗi vì process bị SIGKILL); (3) đồ thị memory của container trước lúc chết (Grafana / `kubectl top`) → thấy **spike** hay **tăng dần** (leak); (4) đối chiếu với loại request (tài liệu lớn? nhiều request đồng thời?) và thay đổi gần nhất (deploy, đổi model, đổi cấu hình chunking).",
        "**Nguyên nhân thường gặp ở workload AI / RAG**: ingest tài liệu lớn đọc cả file vào RAM; nhiều request đồng thời, mỗi cái giữ context / embedding lớn; thư viện xử lý (PDF parser, numpy…) cấp phát nhiều; limit đặt theo mức trung bình thay vì mức đỉnh; leak do cache nội bộ không giới hạn.",
        "**Xử lý ngay**: nâng tạm `limits.memory` (và request) để khôi phục dịch vụ, xác nhận ổn định, ghi lại thay đổi.",
        "**Khắc phục dứt điểm**: đo **p99 memory** theo tải thật rồi đặt requests / limits theo đó (memory request ≈ limit); giới hạn kích thước input và số request đồng thời mỗi pod; xử lý theo luồng / lô thay vì nạp cả file; tách worker riêng cho tác vụ nặng (queue + KEDA).",
        "**Phòng ngừa tái diễn**: cảnh báo khi memory vượt ~80% limit (trước khi OOM) và khi restart count tăng; test tải với tài liệu lớn trước khi release; kiểm thử lại sau mỗi thay đổi model / chunking; đưa vào runbook.",
        "**Đừng để probe làm bệnh nặng thêm**: liveness quá gắt giết app đang xử lý nặng (xem trang Container & K8s).",
        "**Autoscale**: HPA theo CPU không thấy áp lực memory / I/O → dùng metric đồng thời hoặc độ dài queue (KEDA).",
        "**Kết bằng phòng ngừa** khi kể: hiện tượng → điều tra (lệnh nào, thấy gì) → nguyên nhân → xử lý ngay → khắc phục → phòng ngừa."
      ],
      lenh: [
        ["kubectl get pod -n <ns> -w", "Theo dõi RESTARTS và trạng thái"],
        ["kubectl describe pod <pod> -n <ns> | grep -A8 'Last State'", "Lý do và exit code của lần chết trước"],
        ["kubectl top pod -n <ns> --containers --sort-by=memory", "Container nào đang ngốn RAM"],
        ["kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.containers[*].resources}'", "requests / limits đang đặt"],
        ["kubectl set resources deploy/<name> -n <ns> --limits=memory=2Gi --requests=memory=2Gi", "Nâng tạm (nhớ cập nhật vào Helm values, tránh bị ghi đè)"],
        ["kubectl get events -n <ns> --sort-by=.lastTimestamp | grep -i oom", "Sự kiện OOM"]
      ],
      bay: "Chỉ nâng limit rồi coi là xong mà không biết memory tăng do spike hay leak; hoặc sửa tay bằng `kubectl set resources` mà không sửa Helm values — lần deploy sau ghi đè lại và sự cố quay trở lại.",
      cv: "Kotae: ‘Kept memory-heavy, bursty AI workloads stable under live traffic’. Hãy kể bằng **con số của bạn**: limit cũ → p99 đo được → limit mới, và điều bạn bổ sung để phát hiện sớm. Xem KT1, K2, K3 trong ngân hàng."
    },

    /* ---------------------------------------------------------- */
    {
      id: "ssrf", ten: "Case 8 — Chặn SSRF ở crawler của RAG",
      y: [
        "**Bối cảnh**: tính năng ingest cho phép người dùng nhập URL, **crawler của hệ thống** sẽ tải nội dung đó. Kẻ tấn công nhập URL trỏ vào **mạng nội bộ** hoặc **metadata endpoint của cloud** để đọc dữ liệu hay credential — đó là **SSRF** (server-side request forgery).",
        "**Mục tiêu tấn công điển hình**: `169.254.169.254` (metadata AWS — lấy credential của role), `localhost` / `127.0.0.1`, dải private (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local, dịch vụ nội bộ (database admin, Kubernetes API, dashboard), và các dạng IPv6 tương đương.",
        "**Phòng thủ ở tầng code (CV)**: (1) chỉ cho phép `http` / `https`; (2) **phân giải DNS rồi kiểm tra IP đích** — thuộc dải bị chặn thì từ chối; (3) kiểm tra **lại ở mỗi lần redirect** (kẻ tấn công dùng URL công khai trả 302 sang IP nội bộ); (4) **kết nối đúng IP đã kiểm tra** (chống DNS rebinding: lần kiểm tra trả IP công khai, lần kết nối trả IP nội bộ); (5) giới hạn kích thước, timeout, loại nội dung; (6) **unit test cho từng dải bị chặn** và các biến thể.",
        "**Phòng thủ ở tầng hạ tầng** (không phụ thuộc code): **bắt buộc IMDSv2** (cần token, `HttpPutResponseHopLimit=1` để container không với tới); crawler chạy trong **subnet / namespace riêng** với **egress filtering** (security group / NetworkPolicy chỉ cho ra internet, chặn tới dải nội bộ); role của crawler quyền tối thiểu.",
        "**Cái bẫy**: chỉ kiểm tra URL ban đầu mà không kiểm tra sau redirect; chặn theo *chuỗi* hostname (`localhost`) thay vì theo **IP đã phân giải**; bỏ sót IPv6 và các biểu diễn số của IP (`http://2130706433/`, `0x7f000001`, `[::1]`, `0.0.0.0`, URL có userinfo `user@host`).",
        "**Kiểm chứng**: bộ test với các payload SSRF phổ biến; thử từ chính môi trường chạy (container) xem có với tới metadata / nội bộ không; theo dõi log của crawler (URL, IP đích, mã phản hồi) và cảnh báo khi có truy cập bị chặn.",
        "**Cách nói với người phỏng vấn**: phân biệt *lỗ hổng* (crawler tải URL tuỳ ý) → *tác động* (đọc credential / dịch vụ nội bộ) → *biện pháp* (kiểm tra IP sau resolve và sau redirect, có test) → *phòng thủ chiều sâu* (IMDSv2, egress filter)."
      ],
      ma: {
        ten: "Kiểm tra IP đích sau khi phân giải (Python, minh hoạ)",
        noi: [
          "import ipaddress, socket",
          "from urllib.parse import urlparse",
          "",
          "BLOCKED = [ipaddress.ip_network(n) for n in (",
          '    "127.0.0.0/8", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16",',
          '    "169.254.0.0/16", "0.0.0.0/8", "::1/128", "fc00::/7", "fe80::/10")]',
          "",
          "def is_safe(url: str) -> bool:",
          "    u = urlparse(url)",
          '    if u.scheme not in ("http", "https") or not u.hostname:',
          "        return False",
          "    for *_, sockaddr in socket.getaddrinfo(u.hostname, u.port or 443, proto=socket.IPPROTO_TCP):",
          "        ip = ipaddress.ip_address(sockaddr[0])",
          "        if any(ip in net for net in BLOCKED):",
          "            return False",
          "    return True   # + kiểm tra lại ở MỖI redirect, và kết nối thẳng tới IP đã kiểm tra"
        ]
      },
      lenh: [
        ["curl -s -X PUT -H 'X-aws-ec2-metadata-token-ttl-seconds: 21600' http://169.254.169.254/latest/api/token", "Từ máy / container của chính mình: có với tới metadata (IMDSv2) không — để KIỂM TRA phòng thủ"],
        ["aws ec2 modify-instance-metadata-options --instance-id <id> --http-tokens required --http-put-response-hop-limit 1", "Bắt buộc IMDSv2, hop limit 1"],
        ["kubectl get networkpolicy -n <ns>", "NetworkPolicy (egress) đang áp dụng"],
        ["python -m pytest tests/test_ssrf.py -q", "Chạy test các dải bị chặn"]
      ],
      bay: "Chỉ chặn chuỗi `localhost` / `127.0.0.1` trong URL: kẻ tấn công dùng `http://2130706433/`, `http://[::1]/`, hoặc một domain công khai có A record trỏ về `127.0.0.1`. Phải kiểm tra **IP sau khi phân giải** và kiểm tra lại sau mỗi redirect.",
      cv: "Kotae: ‘Hardened the RAG ingestion path against server-side request forgery, adding private-IP and redirect reachability checks around the crawler, with unit tests covering the blocked ranges’. Hai chi tiết ăn điểm: kiểm tra **sau redirect** và **unit test từng dải bị chặn** (xem S3 trong ngân hàng). Chủ động kể thêm lớp hạ tầng (IMDSv2, egress filter)."
    },

    /* ---------------------------------------------------------- */
    {
      id: "secret", ten: "Case 9 — Lộ secret trên Git và xoay secret không downtime",
      y: [
        "**Bối cảnh A — secret bị commit lên Git** (hoặc lộ qua log / CI). Thứ tự xử lý: (1) **xoay hoặc vô hiệu hoá secret NGAY** — coi như đã bị lộ; (2) kiểm tra log truy cập (CloudTrail, log dịch vụ) xem có dùng trái phép không; (3) xoá khỏi lịch sử (`git filter-repo` / BFG) — nhưng ai đã clone hay fork vẫn còn nên **không thay thế bước 1**; (4) báo cáo theo quy trình bảo mật; (5) phòng ngừa.",
        "**Phòng ngừa**: quét secret ở pre-commit và trong CI (gitleaks, trufflehog, GitHub secret scanning + push protection); secret nằm ở secret manager (Secrets Manager, SSM, Vault) thay vì repo hay biến cứng; credential ngắn hạn qua OIDC / IAM role; `.gitignore` cho `.env`.",
        "**Bối cảnh B — xoay secret định kỳ không downtime** (vd mật khẩu database).",
        "**Cách làm**: dùng *hai bộ credential luân phiên* (alternating users): tạo user B cùng quyền với user A → đổi secret trỏ sang B → ứng dụng dần chuyển sang B (chạy lại task / pod hoặc đọc lại secret) → khi chắc không còn ai dùng A thì vô hiệu hoá A. Secrets Manager có rotation Lambda hỗ trợ kiểu này cho RDS.",
        "**ECS**: secret chỉ nạp lúc **task khởi động** → sau khi xoay phải `--force-new-deployment` để task mới lấy secret mới. **Kubernetes**: Secret gắn bằng biến môi trường cần restart pod; gắn bằng volume thì cập nhật sau một lúc (app phải đọc lại); dùng External Secrets / CSI driver để đồng bộ từ secret manager; Helm dùng checksum annotation.",
        "**Ứng dụng nên chịu được việc xoay**: khi lỗi xác thực thì đọc lại secret và kết nối lại (thử một lần với secret mới).",
        "**Phạm vi ảnh hưởng**: liệt kê *mọi nơi* dùng secret đó (app, job migration, CI, bản lưu cục bộ của đồng nghiệp) trước khi xoay; cập nhật theo thứ tự để không có khoảng hở.",
        "**Kiểm chứng**: đăng nhập thử bằng credential mới, theo dõi lỗi xác thực trong log vài phút, giữ credential cũ ở trạng thái *bị vô hiệu* (chưa xoá hẳn) một thời gian để quay lại nếu cần.",
        "**Pipeline CI**: ưu tiên OIDC (không có secret dài hạn để lộ); secret dùng trong job được mask, không `echo`, không nằm trong artifact / log; biến production là *protected*."
      ],
      lenh: [
        ["gitleaks detect --source . --redact", "Quét secret trong repo và lịch sử (che giá trị khi in)"],
        ["git log -S'<chuỗi>' --all --oneline", "Commit nào từng chứa chuỗi đó"],
        ["git filter-repo --replace-text expressions.txt", "Xoá secret khỏi lịch sử (làm trên bản clone mới; sau đó force-push và báo mọi người clone lại)"],
        ["aws secretsmanager rotate-secret --secret-id <id>", "Kích hoạt rotation ngay"],
        ["aws ecs update-service --cluster <c> --service <s> --force-new-deployment", "Cho task mới nạp secret mới"],
        ["aws iam update-access-key --access-key-id <id> --status Inactive --user-name <u>", "Vô hiệu hoá access key bị lộ (rồi mới xoá)"]
      ],
      bay: "Chỉ ‘xoá commit’ rồi coi như xong: secret đã nằm trong lịch sử, bản clone, cache của CI / GitHub — **xoay secret** mới là biện pháp thật. Ngược lại, xoay xong mà quên một nơi vẫn dùng secret cũ thì sập dịch vụ.",
      cv: "Gắn với Secrets Manager và IAM trong Skills (và OIDC / gitleaks nếu bạn đã dùng). Câu tình huống TH8 trong ngân hàng gần như chắc chắn xuất hiện: nhớ **thứ tự — xoay trước, xoá lịch sử sau**."
    },

    /* ---------------------------------------------------------- */
    {
      id: "restore-tenant", ten: "Case 10 — Khôi phục dữ liệu của một tenant",
      y: [
        "**Bối cảnh**: nhân viên của một tenant xoá nhầm dữ liệu quan trọng (hoặc một lần deploy / migration làm hỏng dữ liệu của một tenant). Cần khôi phục mà **không ảnh hưởng tenant khác**.",
        "**Mô hình silo (mỗi tenant một DB)**: dùng **PITR** của Aurora — restore về thời điểm ngay trước sự cố vào một **cluster MỚI** (không ghi đè cluster đang chạy), rồi **trích đúng dữ liệu cần** từ cluster tạm sang cluster chính (truy vấn / `pg_dump` theo bảng hoặc điều kiện), hoặc, nếu hỏng toàn bộ, **chuyển ứng dụng sang cluster mới** (đổi endpoint / secret / DNS).",
        "**Mô hình pool (DB chung)** khó hơn nhiều: không restore cả DB vì sẽ làm mất dữ liệu tenant khác ghi sau thời điểm đó. Phải restore ra DB tạm rồi **chép lại riêng dữ liệu của tenant đó** (`WHERE tenant_id = …`), chú ý khoá ngoại và thứ tự bảng.",
        "**Các bước (silo)**: (1) xác định chính xác **thời điểm** trước sự cố (từ log / audit); (2) nếu cần, **dừng ghi** vào dữ liệu bị ảnh hưởng (chế độ chỉ-đọc cho tenant); (3) `restore-db-cluster-to-point-in-time` vào cluster tạm (cùng VPC / SG / subnet group / parameter group); (4) tạo instance cho cluster tạm; (5) kiểm tra dữ liệu ở cluster tạm; (6) trích xuất rồi đưa vào cluster chính, hoặc cutover sang cluster mới; (7) kiểm chứng cùng tenant; (8) xoá cluster tạm; (9) postmortem + cải thiện phòng ngừa.",
        "**Thời gian**: restore Aurora tạo cluster mới **chưa có instance** — phải tạo instance thêm; thời gian phụ thuộc dung lượng. → đo bằng **diễn tập** để biết RTO thật.",
        "**Điều kiện để làm được**: retention PITR đủ dài (1–35 ngày), snapshot trước thay đổi lớn, runbook đã diễn tập, quyền restore tách biệt và có audit.",
        "**Giảm khả năng xảy ra**: soft delete / thùng rác thay vì xoá cứng, xác nhận thao tác nguy hiểm, quyền theo vai trò, audit log nghiệp vụ.",
        "**AWS Backup** cũng khôi phục theo recovery point; gắn tag `tenant` giúp tìm đúng backup của tenant."
      ],
      lenh: [
        ["aws rds describe-db-clusters --db-cluster-identifier <src> --query 'DBClusters[0].[EarliestRestorableTime,LatestRestorableTime]'", "Khoảng thời gian có thể restore"],
        ["aws rds restore-db-cluster-to-point-in-time --source-db-cluster-identifier <src> --db-cluster-identifier <tmp> --restore-to-time <ISO8601> --vpc-security-group-ids <sg> --db-subnet-group-name <sng>", "PITR vào cluster tạm"],
        ["aws rds create-db-instance --db-cluster-identifier <tmp> --db-instance-identifier <tmp>-1 --db-instance-class <class> --engine aurora-postgresql", "Cluster vừa restore chưa có instance — phải tạo thêm"],
        ["pg_dump -h <tmp-endpoint> -U <u> -t <table> --data-only -Fc <db> -f part.dump", "Trích riêng một bảng từ cluster tạm"],
        ["aws rds delete-db-instance --db-instance-identifier <tmp>-1 && aws rds delete-db-cluster --db-cluster-identifier <tmp> --skip-final-snapshot", "Dọn cluster tạm (xoá instance trước, cluster sau)"]
      ],
      bay: "Restore thẳng đè lên dữ liệu production của tenant mà không thử trước và không chụp snapshot ‘trạng thái hiện tại’: nếu chọn sai thời điểm thì mất luôn dữ liệu đang có.",
      cv: "Dựa trên Aurora PITR + AWS Backup và mô hình per-tenant của bạn: đây là lợi thế cụ thể của silo mà bạn nên chủ động nêu. Trung thực về việc đã diễn tập restore chưa và mất bao lâu (xem B3, DB1 trong ngân hàng)."
    },

    /* ---------------------------------------------------------- */
    {
      id: "chi-phi", ten: "Case 11 — Hoá đơn AWS tăng đột biến",
      y: [
        "**Bối cảnh**: hoá đơn AWS tháng này tăng bất thường (vd +40%). Cần tìm nguyên nhân, xử lý và ngăn lặp lại.",
        "**Bắt đầu bằng dữ liệu**: Cost Explorer — nhóm theo *Service*, rồi *Usage type*, rồi *Tag* (tenant, env); so theo ngày để thấy **ngày bắt đầu tăng** và đối chiếu với thay đổi (deploy, tenant mới, bật tính năng).",
        "**Thủ phạm thường gặp**: *NAT Gateway* (phí giờ + phí xử lý dữ liệu — traffic ra S3 / ECR / Logs đi qua NAT thay vì VPC endpoint); *CloudWatch Logs* (ingest do log debug / spam, retention ‘never expire’); *data transfer* giữa AZ / Region / ra internet; *EC2 / Fargate* chạy thừa (môi trường dev bật 24/7, autoscale không co lại); *Aurora / ElastiCache* quá lớn hoặc thừa reader; *S3* (phiên bản cũ, nhiều request, chưa đặt lifecycle); *snapshot / backup* tích luỹ; *Bedrock / LLM* tính theo token tăng đột biến (một tenant hoặc một vòng lặp lỗi gọi API liên tục).",
        "**Xác minh**: lọc theo usage type (`NatGateway-Bytes`, `DataTransfer-Regional-Bytes`, `CW:DataProcessing-Bytes`…); VPC Flow Logs để biết traffic nào đi qua NAT; Logs Insights tìm nguồn log lớn nhất; theo dõi token usage theo tenant.",
        "**Xử lý theo thứ tự rủi ro thấp trước** (không đụng độ tin cậy): thêm **VPC endpoint** (S3 gateway miễn phí; ECR / Logs / Secrets dạng interface), đặt retention cho log, hạ mức log, tắt / co môi trường dev ngoài giờ, xoá snapshot / volume mồ côi, đặt S3 lifecycle, right-size dựa trên metric thật, Savings Plans / Reserved cho tải ổn định.",
        "**Ngăn lặp lại**: **tag chuẩn** (`tenant`, `env`, `service`) + cost allocation tags; **AWS Budgets / Cost Anomaly Detection** cảnh báo khi vượt ngưỡng hay bất thường; review chi phí định kỳ; ước lượng chi phí ngay trong PR hạ tầng (vd `infracost` cho Terraform).",
        "**Multi-tenant**: tính chi phí theo tenant (tag) để biết tenant nào ‘đắt’ và để thấy rõ chi phí cố định (NAT, Aurora tối thiểu) khi cân nhắc silo hay pool.",
        "**Cân bằng**: không cắt chi phí bằng cách hạ độ tin cậy (bỏ Multi-AZ, rút ngắn backup) nếu chưa có quyết định của business — nêu rõ đánh đổi."
      ],
      lenh: [
        ["aws ce get-cost-and-usage --time-period Start=<d1>,End=<d2> --granularity DAILY --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE", "Chi phí theo ngày và theo dịch vụ"],
        ["aws ce get-cost-and-usage --time-period Start=<d1>,End=<d2> --granularity DAILY --metrics UnblendedCost --group-by Type=DIMENSION,Key=USAGE_TYPE", "Đào xuống usage type"],
        ["aws ec2 describe-nat-gateways --query 'NatGateways[].[NatGatewayId,SubnetId,State]'", "NAT Gateway đang có (mỗi cái tốn tiền theo giờ)"],
        ["aws logs describe-log-groups --query 'logGroups[?retentionInDays==null].[logGroupName,storedBytes]' --output table", "Log group không hết hạn và dung lượng"],
        ["aws ec2 describe-volumes --filters Name=status,Values=available", "EBS volume mồ côi (không gắn vào đâu)"],
        ["aws ec2 describe-snapshots --owner-ids self --query 'length(Snapshots)'", "Số snapshot đang giữ"]
      ],
      bay: "Cắt giảm bằng cách hạ độ tin cậy (tắt Multi-AZ, rút ngắn backup) rồi gặp sự cố; hoặc ‘tối ưu’ khi chưa biết khoản nào đang tốn — phải đo trước (Cost Explorer) rồi mới hành động.",
      cv: "Bạn quản hạ tầng multi-tenant nên chi phí là câu hỏi tự nhiên (NAT Gateway, Aurora, CloudWatch Logs nhân theo tenant). Chuẩn bị hai ví dụ thật: khoản tốn nhất bạn từng thấy và điều bạn đã làm để giảm."
    },

    /* ---------------------------------------------------------- */
    {
      id: "zd-chung", ten: "Case 12 — Zero-downtime: cơ chế chung và các điểm dễ rớt request",
      y: [
        "**Câu hỏi hay gặp**: ‘Bạn deploy không downtime như thế nào — frontend và backend khác nhau ra sao, trên ECS Fargate, EKS và on-prem?’ Trả lời tốt = một **mô hình chung** rồi **chi tiết từng nền tảng** (Case 13–16), không phải liệt kê công cụ.",
        "**Định nghĩa**: zero-downtime = người dùng **không thấy lỗi và không mất request đang chạy** khi deploy, scale-in, thay node hay rollback. Thực tế nghĩa là ‘không có cửa sổ lỗi đo được’ — nên luôn **đo**, đừng chỉ tuyên bố.",
        "**Sáu điều kiện phải đúng cùng lúc**: (1) **luôn đủ capacity** — chạy bản mới *trước*, tắt bản cũ *sau*; (2) **chỉ nhận traffic khi sẵn sàng** — health check phản ánh việc xử lý được request thật; (3) **ngừng nhận traffic trước khi tắt** — gỡ khỏi LB và *đợi* thay đổi lan ra; (4) **tắt êm** — bắt `SIGTERM`, xử lý nốt request dở, đóng pool rồi mới thoát, trong thời hạn trước `SIGKILL`; (5) **hai phiên bản chạy chồng nhau phải tương thích** (schema DB, API, message, cache key — Case 2); (6) **có đường lui nhanh** mà không cần build lại.",
        "**Bản chất của lỗi**: ba việc xảy ra *song song*, không có thứ tự bảo đảm — LB bỏ target, hệ thống gửi `SIGTERM`, request mới vẫn đang trên đường. Mọi cơ chế (drain, `deregistration_delay`, `preStop` sleep) chỉ để *tạo ra thứ tự* cho ba việc này.",
        "**FE khác BE**: BE là *tiến trình giữ kết nối* → vấn đề là drain và tắt êm. FE tĩnh là *file* → vấn đề là thứ tự ghi file, cache và giữ asset cũ (Case 16). FE chạy trong container (SSR) mắc cả hai.",
        "**Ba nền tảng, gói gọn**: ECS gỡ task khỏi LB và đợi drain *rồi mới* SIGTERM; EKS gỡ endpoint và SIGTERM **song song** nên cần `preStop`; on-prem bạn tự dựng LB, drain và health check — đổi lại kiểm soát toàn bộ.",
        "**Không chỉ deploy**: scale-in (autoscaling), thay node (drain, Karpenter, spot interruption), nâng cấp cluster, đổi cấu hình — đều là lần ‘thay instance’ và cần cùng cơ chế tắt êm. Kubernetes bảo vệ các trường hợp này bằng PodDisruptionBudget.",
        "**Kiểm chứng bằng đo**: chạy tải liên tục (k6 / hey / vòng lặp curl) *trong lúc deploy* và đếm mã không phải 2xx; xem `HTTPCode_ELB_5XX_Count`, `HTTPCode_Target_5XX_Count`, `UnHealthyHostCount`, log của LB / Nginx. Đưa thành smoke test sau rollout.",
        "**Đọc mã lỗi khi deploy**: `502` = tiến trình bị tắt lúc đang xử lý, hoặc keep-alive của app ngắn hơn idle timeout của LB (LB tái dùng kết nối vừa bị app đóng) → tắt êm và đặt keep-alive của app *lớn hơn* idle timeout của LB (ALB 60s → app 65s). `503` = không còn target khỏe (rớt capacity, tất cả cùng unhealthy) → giữ capacity, health check đúng, `replicas ≥ 2`. `504` = request vượt idle timeout hoặc app bị tắt giữa lúc xử lý lâu → drain đủ dài, việc dài chuyển sang queue / job. Chậm hoặc timeout ngay sau rollout = bản mới nhận traffic khi chưa ‘ấm’ → `startupProbe`, `slow_start`, warm-up."
      ],
      bang: {
        ten: "Ba nền tảng — cùng mục tiêu, khác cơ chế",
        cot: ["", "ECS Fargate", "EKS (Kubernetes)", "On-prem (VM + Nginx / HAProxy)"],
        hang: [
          ["Giữ đủ capacity", "`minimumHealthyPercent=100`, `maximumPercent=200`", "`maxUnavailable: 0`, `maxSurge: 1` hoặc 25%", "≥ 2 node; cuốn chiếu từng node (`serial: 1`)"],
          ["Cổng ‘sẵn sàng’", "Health check của ALB, `healthCheckGracePeriodSeconds`", "`readinessProbe` + `startupProbe`, pod readiness gate với ALB", "Health check của Nginx / HAProxy (`option httpchk`, `rise`)"],
          ["Ngừng nhận traffic trước khi tắt", "ECS gỡ khỏi target group, đợi drain (`deregistration_delay`) *rồi mới* SIGTERM", "Gỡ khỏi EndpointSlice **song song** với SIGTERM → cần `preStop: sleep`", "Tự đặt node ở trạng thái drain (HAProxy `state drain`, hoặc `down` trong upstream + reload)"],
          ["Thời hạn tắt êm", "`stopTimeout` (tối đa 120s trên Fargate)", "`terminationGracePeriodSeconds`", "`TimeoutStopSec` (systemd), `docker stop -t`, `stop_grace_period`"],
          ["Tự rollback khi lỗi", "Deployment circuit breaker + CloudWatch alarm", "`helm upgrade --atomic`, `progressDeadlineSeconds`, Argo Rollouts analysis", "Health check sau cutover + script rollback; Ansible dừng khi node đầu lỗi"],
          ["Canary / blue-green", "CodeDeploy hoặc blue/green tích hợp của ECS (hai target group)", "Argo Rollouts, Flagger, ingress canary / service mesh", "Hai upstream với `weight` (Nginx / HAProxy), đổi bằng reload"],
          ["Điểm yếu hay gặp", "Task lên chậm (kéo image); `deregistration_delay` mặc định 300s làm rollout lâu", "SIGTERM tới trước khi LB kịp bỏ pod → 502; quên PDB khi drain node", "Mọi thứ thủ công nên dễ sai; LB là điểm lỗi đơn nếu không HA"]
        ]
      },
      ma: {
        ten: "Kiểm chứng: bắn request liên tục trong lúc deploy",
        noi: [
          "# Terminal 1 — bắn request liên tục, chỉ in ra khi KHÔNG phải 200",
          "while true; do",
          "  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 https://app.example.com/health)",
          "  [ \"$code\" != \"200\" ] && echo \"$(date +%T) $code\"",
          "  sleep 0.1",
          "done",
          "",
          "# Terminal 2 — trong lúc đó chạy deploy (ecs update-service / helm upgrade / playbook cuốn chiếu)",
          "# Kết quả mong đợi: Terminal 1 không in dòng nào. Có dòng 502 / 503 / 504 → xem ý ‘Đọc mã lỗi khi deploy’ ở trên."
        ]
      },
      lenh: [
        ["k6 run --vus 20 --duration 3m script.js", "Tải ổn định trong lúc deploy; chỉ số `http_req_failed` là tỷ lệ lỗi"],
        ["aws cloudwatch get-metric-statistics --namespace AWS/ApplicationELB --metric-name HTTPCode_ELB_5XX_Count --dimensions Name=LoadBalancer,Value=<app/lb/id> --start-time <t1> --end-time <t2> --period 60 --statistics Sum", "Số 5xx do ALB sinh ra trong cửa sổ deploy"],
        ["aws elbv2 describe-target-health --target-group-arn <arn>", "Target nào đang `healthy`, `draining`, `unhealthy` và vì sao"],
        ["kubectl get endpointslices -l kubernetes.io/service-name=<svc> -w", "Xem pod được thêm / bớt khỏi endpoint theo thời gian thực khi rollout"]
      ],
      bay: [
        "Tuyên bố ‘zero-downtime’ chỉ vì đã bật rolling update: không đo, không tắt êm, không xử lý keep-alive — vẫn rớt request lẻ mà không ai thấy.",
        "Quên rằng hai phiên bản chạy chồng nhau: đổi tên cột hay đổi định dạng message trong cùng lần phát hành khiến bản cũ lỗi đúng lúc rollout."
      ],
      cv: "CV của bạn có hai cụm người phỏng vấn sẽ đào: ‘zero-downtime container rollouts’ (ECS) và ‘zero-downtime SPA deploys’. Mở bằng sáu điều kiện trên rồi chỉ ra bạn đã làm điều kiện nào ở đâu (circuit breaker và `wait stable`; asset trước, index sau…). Với EKS và on-prem, nói rõ mức bạn trực tiếp làm (Kotae chạy Helm / Kubernetes; dịch vụ tự quản dùng `compose up --wait`) và phần bạn hiểu cơ chế."
    },

    /* ---------------------------------------------------------- */
    {
      id: "zd-ecs", ten: "Case 13 — Backend zero-downtime trên ECS Fargate",
      y: [
        "**Hai lớp phải cùng đúng**: (1) *deployment* của ECS service quyết định thay task thế nào; (2) ALB và ứng dụng quyết định request có rớt hay không. Case 5 là pipeline trong CV; case này đi vào **cơ chế bên trong**.",
        "**Rolling update**: `minimumHealthyPercent=100` (không bao giờ ít hơn desired) và `maximumPercent=200` (cho chạy gấp đôi để bản mới lên trước). Lưu ý `maximumPercent=200` **nhân đôi số kết nối DB** trong lúc rollout — kiểm tra `max_connections` và kích thước pool.",
        "**Vòng đời một task bị thay**: ECS đưa task vào `DEACTIVATING` — gỡ khỏi target group và **đợi drain** (`deregistration_delay`) — *sau đó* mới `STOPPING`: gửi `SIGTERM`, đợi `stopTimeout`, rồi `SIGKILL`. Khác EKS: không cần `preStop` sleep để chờ LB, vì ECS đã tự làm bước đó trước.",
        "**Vậy app còn phải tắt êm để làm gì?** Đóng pool DB, flush log / metric, hoàn tất việc nền — và là cơ chế **duy nhất** với *worker* và mọi kết nối không đi qua ALB.",
        "**Thời gian cần tính**: một task cũ biến mất sau ≈ `deregistration_delay` + tối đa `stopTimeout`. `deregistration_delay` mặc định 300s làm rollout rất chậm nếu còn kết nối mở (keep-alive, WebSocket) → đặt khoảng 30–60s, **≥ request dài nhất**. `stopTimeout` mặc định 30s, tối đa 120s trên Fargate.",
        "**Task mới lên chậm**: Fargate phải kéo image (image nhỏ, ECR cùng region, VPC endpoint cho ECR / S3) rồi qua health check. Thời gian vào service ≈ khởi động + `healthy threshold` × `interval`. Đặt `healthCheckGracePeriodSeconds` **lớn hơn thời gian khởi động** để ECS không giết task đang khởi động; `slow_start` của target group tăng tải dần cho task mới.",
        "**Health check của ALB nên nông**: ECS *thay task* khi target fail health check (khác Kubernetes chỉ rút pod khỏi endpoint). Nếu `/health` gọi sâu vào DB thì DB chớp một nhịp là mọi task cùng unhealthy và bị thay hàng loạt — biến sự cố nhỏ thành sập toàn bộ. Kiểm tra dependency để ở smoke test sau deploy.",
        "**Tự bảo vệ khi bản mới lỗi**: *deployment circuit breaker* (`enable`, `rollback`) dừng rollout và quay về revision ổn định khi task mới không lên được. Thêm *deployment alarms* (CloudWatch alarm cho 5xx / latency) để rollback cả khi task ‘chạy’ nhưng sai.",
        "**Worker (SQS consumer)**: ngừng poll khi nhận `SIGTERM`, xử lý nốt message đang cầm, `stopTimeout` ≥ thời gian xử lý một message; `VisibilityTimeout` > thời gian xử lý; xử lý **idempotent** vì message có thể bị giao lại.",
        "**Canary / blue-green**: CodeDeploy (hai target group + test listener, `Canary10Percent5Minutes`, `Linear10PercentEvery1Minutes`, hook kiểm tra, rollback theo alarm) hoặc blue/green tích hợp sẵn của ECS (xem tài liệu bản hiện hành). Đánh đổi: gấp đôi task trong lúc chuyển, nhiều cấu hình hơn, có thời gian bake.",
        "**Rollback**: `update-service --task-definition <family>:<revision cũ>` rồi `wait services-stable`; revision cũ vẫn còn nên không cần build lại. Điều kiện: schema DB tương thích ngược (Case 2)."
      ],
      ma: [
        {
          ten: "Terraform: service và target group cho rollout êm",
          noi: [
            'resource "aws_ecs_service" "api" {',
            '  name            = "api"',
            "  cluster         = aws_ecs_cluster.main.id",
            "  task_definition = aws_ecs_task_definition.api.arn",
            "  desired_count   = 2",
            "",
            "  deployment_minimum_healthy_percent = 100   # không bao giờ ít hơn desired",
            "  deployment_maximum_percent         = 200   # cho bản mới lên TRƯỚC (nhớ: nhân đôi kết nối DB)",
            "  health_check_grace_period_seconds  = 60    # lớn hơn thời gian khởi động của app",
            "",
            "  deployment_circuit_breaker {",
            "    enable   = true",
            "    rollback = true                          # task mới không lên được → tự về revision cũ",
            "  }",
            "",
            "  load_balancer {",
            "    target_group_arn = aws_lb_target_group.api.arn",
            '    container_name   = "api"',
            "    container_port   = 8080",
            "  }",
            "}",
            "",
            'resource "aws_lb_target_group" "api" {',
            "  # ...",
            "  deregistration_delay = 30                  # >= request dài nhất; mặc định 300s làm rollout rất chậm",
            "  slow_start           = 30                  # tăng tải dần cho task mới (tuỳ chọn)",
            "",
            "  health_check {",
            '    path                = "/health"          # nông: process sống và phục vụ được',
            "    interval            = 15",
            "    healthy_threshold   = 2",
            "    unhealthy_threshold = 3",
            "  }",
            "}"
          ]
        },
        {
          ten: "Task definition: thời hạn tắt và health check của container",
          noi: [
            '"containerDefinitions": [{',
            '  "name": "api",',
            '  "stopTimeout": 60,',
            '  "healthCheck": {',
            '    "command": ["CMD-SHELL", "curl -fs http://localhost:8080/health || exit 1"],',
            '    "interval": 15, "timeout": 5, "retries": 3, "startPeriod": 30',
            "  }",
            "}]"
          ]
        },
        {
          ten: "Ứng dụng Node.js: tắt êm khi nhận SIGTERM",
          noi: [
            "const server = app.listen(8080);",
            "server.keepAliveTimeout = 65_000;   // lớn hơn idle timeout 60s của ALB → tránh 502 rải rác",
            "server.headersTimeout   = 66_000;",
            "",
            "process.on(\"SIGTERM\", () => {",
            "  server.close(async () => {          // ngừng nhận kết nối mới, đợi request đang chạy",
            "    await db.end();                   // đóng pool, flush log / metric",
            "    process.exit(0);",
            "  });",
            "  server.closeIdleConnections?.();    // đóng các kết nối keep-alive đang rảnh",
            "  setTimeout(() => process.exit(1), 25_000).unref();   // chốt chặn, nhỏ hơn stopTimeout",
            "});"
          ]
        }
      ],
      lenh: [
        ["aws ecs describe-services --cluster <c> --services <s> --query 'services[0].deployments[].[status,rolloutState,desiredCount,runningCount]' --output table", "Rollout đang ở đâu: `PRIMARY` / `ACTIVE`, `rolloutState` (`IN_PROGRESS`, `COMPLETED`, `FAILED`)"],
        ["aws ecs wait services-stable --cluster <c> --services <s>", "Chặn pipeline đến khi rollout ổn định (hoặc hết thời gian chờ)"],
        ["aws ecs update-service --cluster <c> --service <s> --task-definition <family>:<rev> --deployment-configuration 'minimumHealthyPercent=100,maximumPercent=200,deploymentCircuitBreaker={enable=true,rollback=true}'", "Đặt cấu hình rollout bằng CLI (thường để Terraform quản lý)"],
        ["aws elbv2 modify-target-group-attributes --target-group-arn <arn> --attributes Key=deregistration_delay.timeout_seconds,Value=30", "Đổi thời gian drain của target group"],
        ["aws elbv2 describe-target-health --target-group-arn <arn> --query 'TargetHealthDescriptions[].[Target.Id,TargetHealth.State]' --output table", "Target nào `healthy` / `draining` / `unhealthy`"],
        ["aws ecs describe-tasks --cluster <c> --tasks <arn> --query 'tasks[0].[lastStatus,stopCode,stoppedReason]'", "Vì sao task bị dừng (rollout, health check fail, OOM…)"]
      ],
      bay: [
        "`deregistration_delay` để mặc định 300s trong khi app giữ kết nối mở (keep-alive, WebSocket): rollout kéo dài rất lâu. Ngược lại đặt quá ngắn (5s) thì cắt cả request đang chạy.",
        "Health check của ALB gọi sâu vào DB: DB chậm một nhịp, ALB đánh dấu mọi task unhealthy và ECS thay hết — biến sự cố nhỏ thành sập toàn bộ."
      ],
      cv: "Đúng pipeline trong CV (‘stability checks, old-revision cleanup’). Bổ sung ba điều bạn có thể nói thêm: circuit breaker, giá trị `deregistration_delay` / `stopTimeout` bạn đã đặt và vì sao, và cách worker xử lý SIGTERM. Nếu chưa đặt các giá trị này, nói thẳng và nêu cách bạn sẽ chọn (đo request dài nhất). Xem Case 5 và E4 trong ngân hàng."
    },

    /* ---------------------------------------------------------- */
    {
      id: "zd-eks", ten: "Case 14 — Backend zero-downtime trên EKS (Kubernetes)",
      y: [
        "**Khác ECS ở một điểm cốt lõi**: khi pod bị xoá, việc *gỡ khỏi Service endpoints* và việc *kubelet chạy `preStop` rồi gửi `SIGTERM`* diễn ra **song song**. Ingress / kube-proxy / ALB cần vài giây để biết → trong khoảng đó vẫn gửi request tới pod đang tắt → `502`. Cách chữa: `preStop` sleep để chờ LB ‘quên’ pod, rồi mới tắt (xem chuỗi sự kiện bên dưới).",
        "**Rolling update**: `maxUnavailable: 0`, `maxSurge: 1` (hoặc 25%) để luôn đủ pod; `minReadySeconds` bắt pod ổn định một lúc mới tính là sẵn sàng; `progressDeadlineSeconds` để rollout kẹt bị đánh dấu thất bại thay vì treo mãi.",
        "**Ba probe đúng vai**: `startupProbe` cho app khởi động chậm (chặn liveness giết sớm); `readinessProbe` quyết định có nhận traffic — có thể kiểm tra dependency vì chỉ *rút pod khỏi endpoint*, không giết pod; `livenessProbe` chỉ phát hiện treo cứng và **không** kiểm tra DB.",
        "**Thời hạn tắt**: `terminationGracePeriodSeconds` ≥ `preStop` + thời gian request dài nhất + đệm (mặc định 30s). Hết hạn là `SIGKILL`. `preStop` chạy **trong** khoảng này chứ không cộng thêm.",
        "**AWS Load Balancer Controller + ALB (`target-type: ip`)**: IP của pod đăng ký thẳng vào target group. Bật **pod readiness gate** (nhãn `elbv2.k8s.aws/pod-readiness-gate-inject=enabled` trên namespace) để pod chỉ ‘Ready’ khi target đã healthy trên ALB — nếu không, rollout có thể gỡ pod cũ trước khi ALB chấp nhận pod mới. Giữ `preStop` sleep và đặt `deregistration_delay` bằng annotation.",
        "**PodDisruptionBudget (PDB)**: bảo vệ khi **drain node** (nâng cấp node group, Karpenter consolidation, spot interruption) — thiếu PDB thì drain có thể đuổi hết pod của một service cùng lúc. Kèm `topologySpreadConstraints` để pod rải theo AZ / node và `replicas ≥ 2`.",
        "**HPA scale-in cũng là một lần thay pod**: cùng cơ chế tắt êm; đặt `behavior.scaleDown.stabilizationWindowSeconds` để không co giãn liên tục.",
        "**Helm**: `helm upgrade --install --atomic --wait --timeout 5m` tự rollback khi rollout không ổn định; `helm rollback <release> <revision>` khi bản mới ‘chạy được nhưng sai’. Đổi ConfigMap / Secret mà không đổi pod spec thì pod không restart → dùng checksum annotation.",
        "**Canary / blue-green**: Argo Rollouts hoặc Flagger (tăng traffic theo bước, phân tích metric, tự abort), hoặc ingress canary (theo weight / header). Đánh đổi: thêm controller và cấu hình — hợp dịch vụ rủi ro cao.",
        "**Kết nối dài** (WebSocket, gRPC stream): tăng `terminationGracePeriodSeconds`, đóng có trật tự (gRPC graceful stop gửi `GOAWAY`), client **tự reconnect có backoff**.",
        "**Lưu ý với `exec: sleep`**: nếu `preStop` dùng `exec: sleep` thì image phải có binary `sleep` (distroless thì không có). Phiên bản Kubernetes mới có `preStop.sleep` native — kiểm tra phiên bản cluster."
      ],
      ma: [
        {
          ten: "Chuỗi sự kiện khi một pod bị thay",
          noi: [
            "t = 0     Pod chuyển sang Terminating",
            "            ├─ (song song) EndpointSlice bỏ pod → ingress / kube-proxy / ALB cập nhật (mất vài giây)",
            "            └─ (song song) kubelet chạy preStop: sleep 10   ← vẫn phục vụ bình thường, chờ LB ‘quên’ pod",
            "t = 10    kubelet gửi SIGTERM → app: ngừng nhận kết nối mới, xử lý nốt request dở, đóng pool, exit 0",
            "t = 45    terminationGracePeriodSeconds hết hạn mà còn chạy → SIGKILL",
            "",
            "Quy tắc: terminationGracePeriodSeconds >= preStop (10) + thời gian drain / request dài nhất (~25) + đệm"
          ]
        },
        {
          ten: "Deployment + PodDisruptionBudget",
          noi: [
            "apiVersion: apps/v1",
            "kind: Deployment",
            "metadata: { name: api }",
            "spec:",
            "  replicas: 3",
            "  minReadySeconds: 10",
            "  progressDeadlineSeconds: 300",
            "  strategy:",
            "    type: RollingUpdate",
            "    rollingUpdate: { maxUnavailable: 0, maxSurge: 1 }   # luôn đủ pod, bản mới lên trước",
            "  selector: { matchLabels: { app: api } }",
            "  template:",
            "    metadata: { labels: { app: api } }",
            "    spec:",
            "      terminationGracePeriodSeconds: 45               # >= preStop + drain + đệm",
            "      topologySpreadConstraints:",
            "        - maxSkew: 1",
            "          topologyKey: topology.kubernetes.io/zone",
            "          whenUnsatisfiable: ScheduleAnyway",
            "          labelSelector: { matchLabels: { app: api } }",
            "      containers:",
            "        - name: api",
            "          image: <registry>/api:<sha>                 # tag theo SHA, không dùng :latest",
            "          ports: [{ containerPort: 8080 }]",
            "          startupProbe:   { httpGet: { path: /health/live,  port: 8080 }, periodSeconds: 5,  failureThreshold: 30 }",
            "          readinessProbe: { httpGet: { path: /health/ready, port: 8080 }, periodSeconds: 5,  failureThreshold: 2 }",
            "          livenessProbe:  { httpGet: { path: /health/live,  port: 8080 }, periodSeconds: 10, failureThreshold: 3 }",
            "          lifecycle:",
            "            preStop:",
            '              exec: { command: ["sleep", "10"] }      # chờ ingress / ALB bỏ pod',
            "---",
            "apiVersion: policy/v1",
            "kind: PodDisruptionBudget",
            "metadata: { name: api }",
            "spec:",
            "  maxUnavailable: 1                                   # drain node không đuổi hết pod cùng lúc",
            "  selector: { matchLabels: { app: api } }"
          ]
        },
        {
          ten: "ALB trên EKS: readiness gate và thời gian drain",
          noi: [
            "# Namespace: pod chỉ Ready khi target đã healthy trên ALB",
            "kubectl label namespace prod elbv2.k8s.aws/pod-readiness-gate-inject=enabled",
            "",
            "# Ingress (AWS Load Balancer Controller)",
            "metadata:",
            "  annotations:",
            "    alb.ingress.kubernetes.io/target-type: ip",
            "    alb.ingress.kubernetes.io/healthcheck-path: /health/ready",
            "    alb.ingress.kubernetes.io/target-group-attributes: deregistration_delay.timeout_seconds=30"
          ]
        }
      ],
      lenh: [
        ["kubectl rollout status deploy/<name> -n <ns> --timeout=300s", "Chặn pipeline đến khi rollout xong (hoặc thất bại)"],
        ["kubectl rollout undo deploy/<name> -n <ns>", "Quay về ReplicaSet trước đó"],
        ["kubectl rollout history deploy/<name> -n <ns>", "Các revision có thể quay về"],
        ["helm upgrade --install <rel> <chart> -n <ns> -f values-prod.yaml --atomic --wait --timeout 5m", "Nâng cấp và tự rollback nếu không ổn định"],
        ["helm rollback <rel> <rev> -n <ns> --wait", "Rollback chủ động khi bản mới chạy được nhưng sai"],
        ["kubectl get pdb -n <ns>", "PDB hiện có và cột `ALLOWED DISRUPTIONS`"],
        ["kubectl drain <node> --ignore-daemonsets --delete-emptydir-data", "Drain node — PDB sẽ chặn nếu vi phạm (chỉ làm khi có kế hoạch hoặc ở môi trường thử)"],
        ["kubectl get endpointslices -l kubernetes.io/service-name=<svc> -w", "Pod nào đang trong endpoint theo thời gian thực"]
      ],
      bay: [
        "Bỏ `preStop` và nghĩ `SIGTERM` là đủ: pod tắt ngay trong khi ingress / ALB vẫn còn gửi request tới IP đó → `502` rải rác đúng lúc rollout.",
        "`terminationGracePeriodSeconds` để mặc định 30s nhưng `preStop` 10s + drain 30s: kubelet `SIGKILL` khi app còn đang tắt êm. Phải cộng đủ các khoản.",
        "`livenessProbe` kiểm tra DB: DB chậm một nhịp thì kubelet restart hàng loạt pod — làm sự cố tệ hơn."
      ],
      cv: "Kotae: ‘release rollouts and rollbacks through Helm against per-environment values, autoscaling, and ingress configuration’ cùng ‘failing probes… probe thresholds’. Gắn probe, Helm rollback và ingress vào câu trả lời. Skills của bạn có EKS, nhưng CV chỉ ghi Kubernetes cho Kotae — nói đúng nền tảng bạn đã chạy. Nếu chưa cấu hình `preStop` / PDB / readiness gate, nói thẳng và nêu sẽ thêm ở đâu. Xem K2, K3, KT1 trong ngân hàng."
    },

    /* ---------------------------------------------------------- */
    {
      id: "zd-onprem", ten: "Case 15 — Backend zero-downtime on-prem (VM, Nginx / HAProxy, Docker Compose)",
      y: [
        "**Khác biệt cốt lõi**: không có ECS hay Kubernetes lo hộ — **bạn tự dựng ba thứ**: bộ cân bằng tải, cơ chế drain và health check. Đổi lại bạn kiểm soát toàn bộ và hiểu rõ bản chất.",
        "**Điều kiện tối thiểu**: ≥ 2 instance ứng dụng (2 VM hoặc 2 container) sau Nginx / HAProxy. Chỉ có **một** instance thì không có zero-downtime thật — chỉ giảm gián đoạn xuống vài giây.",
        "**Mẫu 1 — cuốn chiếu nhiều node**: với từng node: (1) đưa vào *drain* (không nhận kết nối mới); (2) đợi kết nối đang chạy xong hoặc hết thời hạn; (3) deploy + restart; (4) chờ health check qua (`rise`); (5) đưa lại vào pool; (6) sang node kế. **Dừng ngay nếu node đầu lỗi** (Ansible `serial: 1`, `max_fail_percentage: 0`).",
        "**Mẫu 2 — blue/green trên một host (Docker Compose)**: `docker compose up -d` thường *dừng container cũ rồi mới tạo container mới* nên có khoảng gián đoạn. Cách tránh: chạy bản mới **song song** (project / cổng khác), health check, đổi upstream bằng `nginx -s reload` (reload của Nginx là *êm*: worker cũ xử lý nốt kết nối rồi thoát), cuối cùng dừng bản cũ sau khi drain. Công cụ như `docker rollout` tự động hoá việc scale lên 2, chờ healthy, bỏ bản cũ.",
        "**Mẫu 3 — reload tại chỗ của chính tiến trình**: Gunicorn (`kill -HUP` đổi worker; `USR2` nâng cấp binary), `pm2 reload` (cluster mode), Nginx / HAProxy (`reload`), `ExecReload` của systemd; socket activation hoặc `SO_REUSEPORT` cho phép hai tiến trình cùng nghe một cổng khi chuyển. Hợp khi không chạy hai bản song song được.",
        "**Drain**: HAProxy có runtime API (`set server <backend>/<server> state drain` — không nhận kết nối mới nhưng giữ kết nối đang có, sau deploy đặt `state ready`; cần `stats socket … level admin`). Nginx mã nguồn mở không có API tương đương → đánh dấu `down` trong upstream rồi `nginx -s reload`; Nginx Plus có API.",
        "**Health check**: Nginx mã nguồn mở chỉ có *passive* (`max_fails`, `fail_timeout` — chỉ phát hiện khi có request thật); HAProxy có *active* (`option httpchk`, `inter`, `fall`, `rise`) — ưu tiên khi cần chắc chắn node đã sẵn sàng.",
        "**LB cũng phải HA**: một Nginx duy nhất là điểm lỗi đơn. Dùng hai LB + **Keepalived (VRRP)** giữ một VIP; nâng cấp LB bằng cách chuyển VIP sang node kia trước.",
        "**Tắt êm với systemd / Docker**: `docker stop` mặc định chỉ cho **10 giây** trước `SIGKILL` → đặt `stop_grace_period` trong Compose, `TimeoutStopSec` trong systemd. Shell làm PID 1 không chuyển tiếp SIGTERM → dùng `exec` hoặc `init: true` (tini).",
        "**Rollback do bạn viết**: sau khi đưa node vào pool, kiểm tra bằng `curl` thật; thất bại → rút node ra và chạy lại bản cũ (giữ tag / thư mục release cũ), rồi báo qua Telegram / Slack.",
        "**Cẩn trọng với**: session lưu trong bộ nhớ (chuyển sang Redis hoặc sticky có kế hoạch), cron / job chạy trùng khi hai bản cùng sống (dùng lock), kết nối DB tăng gấp đôi khi chạy song song, file upload lưu cục bộ trên từng node (dùng storage chung).",
        "**On-prem Kubernetes** (kubeadm, k3s, RKE2): cơ chế giống Case 14, thay ALB bằng ingress-nginx và MetalLB; `preStop`, probe, PDB không đổi."
      ],
      ma: [
        {
          ten: "Nginx: upstream hai node, reload êm",
          noi: [
            "upstream app {",
            "    server 10.0.0.11:8080 max_fails=2 fail_timeout=10s;",
            "    server 10.0.0.12:8080 max_fails=2 fail_timeout=10s;",
            "    # server 10.0.0.13:8080 down;      # đánh dấu down rồi reload để rút node ra khỏi pool",
            "    keepalive 32;",
            "}",
            "",
            "server {",
            "    listen 443 ssl;",
            "    location / {",
            "        proxy_pass http://app;",
            "        proxy_http_version 1.1;",
            '        proxy_set_header Connection "";                        # cho phép keepalive tới upstream',
            "        proxy_next_upstream error timeout http_502 http_503;   # lỗi ở một node → thử node khác (GET / HEAD)",
            "        proxy_next_upstream_tries 2;",
            "    }",
            "}",
            "# Áp dụng:  nginx -t && nginx -s reload     (worker cũ xử lý nốt kết nối rồi thoát)"
          ]
        },
        {
          ten: "HAProxy: health check chủ động và drain từng node",
          noi: [
            "global",
            "    stats socket /var/run/haproxy.sock mode 660 level admin",
            "",
            "backend be_app",
            "    option httpchk GET /health/ready",
            "    http-check expect status 200",
            "    default-server inter 3s fall 3 rise 2",
            "    server app1 10.0.0.11:8080 check",
            "    server app2 10.0.0.12:8080 check",
            "",
            "# Rút app1 khỏi pool (không nhận kết nối mới, giữ kết nối đang có):",
            'echo "set server be_app/app1 state drain" | socat stdio /var/run/haproxy.sock',
            "# ... đợi hết kết nối, deploy + restart app1, kiểm tra /health/ready ...",
            'echo "set server be_app/app1 state ready" | socat stdio /var/run/haproxy.sock'
          ]
        },
        {
          ten: "Ansible: cuốn chiếu từng node, dừng nếu lỗi",
          noi: [
            "- hosts: app",
            "  serial: 1                          # từng node một",
            "  max_fail_percentage: 0             # node đầu lỗi → dừng toàn bộ",
            "  tasks:",
            "    - name: Rút node khỏi HAProxy (drain)       # tên server trong HAProxy = tên host trong inventory",
            '      shell: echo "set server be_app/{{ inventory_hostname }} state drain" | socat stdio /var/run/haproxy.sock',
            "      delegate_to: lb1",
            "    - name: Đợi kết nối đang chạy xong",
            "      pause: { seconds: 30 }",
            "    - name: Cập nhật bản mới và restart dịch vụ  # (bước copy build / pull image đặt trước bước này)",
            "      systemd: { name: app, state: restarted }",
            "    - name: Chờ health check qua",
            '      uri: { url: "http://{{ inventory_hostname }}:8080/health/ready", status_code: 200 }',
            "      register: r",
            "      until: r.status == 200",
            "      retries: 20",
            "      delay: 3",
            "    - name: Đưa node trở lại pool",
            '      shell: echo "set server be_app/{{ inventory_hostname }} state ready" | socat stdio /var/run/haproxy.sock',
            "      delegate_to: lb1"
          ]
        },
        {
          ten: "Docker Compose một host: chạy bản mới song song rồi đổi upstream",
          noi: [
            "# bản mới chạy ở cổng 8081 cạnh bản cũ (8080) — chờ healthcheck của container",
            "APP_PORT=8081 docker compose -p app-green up -d --wait",
            "curl -fs http://127.0.0.1:8081/health/ready              # kiểm tra thật trước khi chuyển",
            "",
            "echo 'server 127.0.0.1:8081;' > /etc/nginx/conf.d/app-upstream.inc   # upstream { include ...; }",
            "nginx -t && nginx -s reload                              # đổi upstream, reload êm",
            "",
            "sleep 30                                                 # để kết nối cũ xử lý nốt",
            "docker compose -p app-blue down                          # dừng bản cũ (hoặc giữ lại làm đường lui)"
          ]
        }
      ],
      lenh: [
        ["nginx -t && nginx -s reload", "Kiểm tra cấu hình rồi reload êm (không rớt kết nối đang có)"],
        ["echo \"show servers state\" | socat stdio /var/run/haproxy.sock", "Trạng thái từng server trong HAProxy"],
        ["ss -tn state established '( sport = :8080 )' | wc -l", "Còn bao nhiêu kết nối đang mở tới app trước khi restart"],
        ["docker stop -t 60 <container>", "Cho 60s trước `SIGKILL` (mặc định chỉ 10s)"],
        ["docker compose up -d --wait --wait-timeout 120", "Chờ healthcheck của container (cần khai `healthcheck`); lưu ý lệnh này vẫn tạo lại container nên với một instance vẫn có gián đoạn ngắn"],
        ["kill -HUP $(cat /run/gunicorn.pid)", "Gunicorn: đổi worker êm (đường dẫn pid tuỳ cấu hình)"],
        ["systemctl show <svc> -p TimeoutStopUSec", "Thời hạn systemd cho phép tắt trước khi `SIGKILL`"]
      ],
      bay: [
        "Chỉ có một instance mà vẫn nói ‘zero-downtime’: `restart` luôn có khoảng gián đoạn; cần ≥ 2 instance hoặc chạy bản mới song song.",
        "`docker stop` mặc định 10s rồi `SIGKILL`, và shell làm PID 1 không chuyển tiếp `SIGTERM`: app bị giết giữa chừng dù code đã xử lý tín hiệu — kiểm tra bằng một lần `docker stop` thật.",
        "Một LB duy nhất: app đã zero-downtime nhưng nâng cấp hay hỏng LB là sập cả hệ thống."
      ],
      cv: "Dịch vụ tự quản của bạn: Nginx làm reverse proxy, deploy bằng `compose up --wait`, có đường rollback về tag cũ. Nói đúng giới hạn: `--wait` bảo đảm bản mới *khoẻ trước khi coi là xong* và có rollback, nhưng với một instance container vẫn được tạo lại nên có gián đoạn ngắn; nếu cần zero-downtime thật, bạn sẽ chuyển sang Mẫu 2 (chạy song song + `nginx reload`). Thừa nhận giới hạn rồi nêu hướng nâng cấp đáng tin hơn nhiều so với tuyên bố ‘zero-downtime’."
    },

    /* ---------------------------------------------------------- */
    {
      id: "zd-fe", ten: "Case 16 — Frontend zero-downtime: S3 + CloudFront, container (ECS / EKS) và on-prem",
      y: [
        "**FE khác BE**: SPA build ra *file tĩnh* — không có tiến trình để drain. Vấn đề là **thứ tự ghi file, cache, và người dùng đang mở bản cũ**. Kẻ thù chính là **version skew**: trình duyệt đang chạy `index.html` cũ nhưng asset cũ đã bị xoá hoặc ghi đè; hoặc `index.html` mới trỏ tới asset chưa tồn tại.",
        "**Bốn quy tắc (đúng cho mọi nền tảng)**: (1) tên asset có **hash nội dung** và không bao giờ bị ghi đè; (2) **upload asset trước, entry (`index.html`) sau cùng**, nguyên tử; (3) **giữ asset của vài phiên bản gần nhất** — người dùng đang mở bản cũ vẫn tải được chunk cũ; (4) cache: asset `immutable` một năm, `index.html` `no-cache`, chỉ invalidate entry.",
        "**Nền tảng 1 — S3 + CloudFront** (nên chọn cho SPA): không có server để rớt; zero-downtime là chuyện thứ tự upload và cache (Case 6). Rollback = upload lại `index.html` cũ (asset cũ vẫn còn) + invalidate `/index.html`. Rẻ, nhanh và sẵn sàng cao nhất.",
        "**Nền tảng 2 — FE trong container (ECS Fargate / EKS)**: dùng khi SSR (Next.js, Nuxt) hoặc muốn một mô hình triển khai cho cả FE và BE. Drain / readiness / `preStop` **giống BE** (Case 13, 14). Nhưng có bẫy riêng: trong lúc rolling, **hai phiên bản FE chạy chồng nhau** — người dùng nhận HTML từ pod mới, rồi request chunk `/_next/static/abc123.js` lại rơi vào pod **cũ** (không có file đó) → 404 → trang lỗi.",
        "**Chữa skew khi FE ở container**: (a) **đưa asset lên S3 / CDN trước khi rollout** và để container chỉ phục vụ HTML / SSR — asset của mọi phiên bản cùng tồn tại; (b) hoặc image mới chứa **asset của bản trước lẫn bản mới**; (c) hoặc định tuyến theo phiên bản (cookie / header) — phức tạp, ít dùng. Với Next.js, kiểm tra cơ chế skew protection / `deploymentId` trong tài liệu phiên bản bạn dùng.",
        "**Nền tảng 3 — on-prem (Nginx phục vụ file tĩnh)**: cấu trúc `releases/<sha>/` + symlink `current`; chuyển bằng **đổi tên nguyên tử** (`ln -sfn` sang tên tạm rồi `mv -T`). Nginx mở file theo symlink ở mỗi request nên chuyển tức thì, không cần reload. Giữ N release gần nhất để rollback và để asset cũ còn tải được.",
        "**FE ↔ BE tương thích hai chiều**: người dùng đang mở FE cũ vẫn gọi API của BE mới → BE phải hỗ trợ **FE phiên bản N−1**; ngược lại, FE mới có thể chạy với BE cũ trong lúc rollout lệch. Thứ tự an toàn: **BE tương thích ngược lên trước, FE lên sau**; chỉ bỏ API cũ khi log cho thấy không còn FE cũ gọi. Tính năng mới đặt sau **feature flag**.",
        "**Phía client**: bắt lỗi tải chunk (`ChunkLoadError`, `Failed to fetch dynamically imported module`) → báo ‘có phiên bản mới, tải lại’ và `location.reload()` có giới hạn số lần; kiểm tra version định kỳ qua `/version.json` (no-cache). Service worker (PWA) có thể giữ bản cũ — cần chiến lược cập nhật có kiểm soát.",
        "**Cấu hình lúc chạy thay vì đóng cứng lúc build**: đọc `config.json` (no-cache) để một bản build dùng cho mọi môi trường — promote giữa môi trường không phải build lại, đổi API URL không phải deploy lại FE.",
        "**Đổi origin / CDN**: nếu chuyển phục vụ FE từ on-prem sang CloudFront thì hạ TTL DNS, chạy song song, kiểm tra header cache trước khi đổi (xem Case 3)."
      ],
      bang: {
        ten: "FE trên ba nền tảng",
        cot: ["", "S3 + CloudFront", "Container (ECS / EKS)", "On-prem (Nginx)"],
        hang: [
          ["Phục vụ bởi", "S3 (OAC) + CDN", "Nginx / Node trong container", "Nginx trên VM"],
          ["Zero-downtime đến từ", "Thứ tự upload + cache; không có tiến trình để drain", "Rolling + readiness + `preStop` (như BE) **và** chống skew", "Đổi symlink nguyên tử; không cần reload"],
          ["Rủi ro riêng", "Cache `index.html`; thiếu asset cũ", "Skew giữa pod cũ và pod mới", "Quên giữ release cũ; đè file tại chỗ"],
          ["Rollback", "Upload lại `index.html` cũ + invalidate", "`kubectl rollout undo` / `update-service` revision cũ (asset cũ phải còn)", "Trỏ symlink về release trước (vài giây)"],
          ["Chi phí / vận hành", "Thấp nhất", "Tốn tài nguyên nhưng một mô hình cho FE + BE", "Tự lo HA, TLS, cache"]
        ]
      },
      ma: [
        {
          ten: "On-prem: phát hành bằng release dir + symlink nguyên tử",
          noi: [
            "set -euo pipefail",
            "REL=/var/www/app/releases/$(date +%Y%m%d%H%M%S)-$GIT_SHA",
            'mkdir -p "$REL"',
            'tar -xzf dist.tar.gz -C "$REL"                     # giải nén build vào thư mục release MỚI (không đè gì)',
            "",
            'ln -sfn "$REL" /var/www/app/current.tmp            # tạo symlink tạm',
            "mv -T /var/www/app/current.tmp /var/www/app/current   # đổi tên nguyên tử: current chuyển sang release mới",
            "",
            "# giữ 5 release gần nhất (asset cũ còn tải được, rollback tức thì)",
            "ls -1dt /var/www/app/releases/* | tail -n +6 | xargs -r rm -rf",
            "",
            "# Rollback: trỏ lại release trước",
            "#   ln -sfn /var/www/app/releases/<release-cũ> /var/www/app/current.tmp && mv -T /var/www/app/current.tmp /var/www/app/current"
          ]
        },
        {
          ten: "Nginx: cache đúng cho SPA tĩnh",
          noi: [
            "server {",
            "    listen 443 ssl;",
            "    root /var/www/app/current;                       # symlink → release hiện tại",
            "",
            "    location / {",
            "        try_files $uri /index.html;                  # SPA routing",
            "    }",
            "    location = /index.html {",
            '        add_header Cache-Control "no-cache";         # luôn hỏi lại → thấy bản mới ngay',
            "    }",
            "    location = /config.json {",
            '        add_header Cache-Control "no-cache";',
            "    }",
            "    location /assets/ {",
            '        add_header Cache-Control "public, max-age=31536000, immutable";   # file có hash',
            "    }",
            "}"
          ]
        },
        {
          ten: "FE trong container: thứ tự pipeline để không bị skew (ví dụ Next.js)",
          noi: [
            "1) npm run build                          # asset có hash, assetPrefix trỏ về CDN",
            "2) aws s3 sync .next/static s3://$BUCKET/_next/static \\",
            "     --cache-control 'public,max-age=31536000,immutable'     # KHÔNG dùng --delete",
            "3) docker build + push image              # image chỉ chứa server / HTML",
            "4) deploy (ecs update-service / helm upgrade --atomic)",
            "     → pod cũ hay mới đều trỏ asset trên CDN, nên chunk nào cũng tải được",
            "5) sau vài phiên bản: dọn asset quá cũ bằng S3 lifecycle rule"
          ]
        }
      ],
      lenh: [
        ["curl -sI https://app.example.com/ | grep -iE 'cache-control|etag|x-cache'", "Header cache của entry"],
        ["curl -s https://app.example.com/version.json", "Phiên bản đang chạy (nếu build có sinh `version.json`)"],
        ["aws s3 sync dist/ s3://<bucket> --exclude index.html --cache-control 'public,max-age=31536000,immutable'", "Upload asset trước — không dùng `--delete`"],
        ["aws cloudfront create-invalidation --distribution-id <id> --paths /index.html", "Chỉ invalidate entry"],
        ["readlink -f /var/www/app/current", "Release nào đang được phục vụ"],
        ["ls -1dt /var/www/app/releases/* | head", "Các release còn giữ"],
        ["nginx -T 2>/dev/null | grep -n open_file_cache", "Có bật cache file mở không (có thể làm trễ khi đổi symlink)"]
      ],
      bay: [
        "Dùng `s3 sync --delete` hoặc ghi `index.html` trước asset: người đang mở bản cũ gặp 404 chunk, người mới thấy `index.html` trỏ file chưa có.",
        "FE trong container, asset nằm trong image, rolling update: request chunk rơi sai phiên bản → 404 lẻ tẻ mà test thủ công không thấy.",
        "Đổi API theo hướng phá vỡ cùng lúc với FE mới: FE cũ đang mở trong trình duyệt người dùng lỗi hàng loạt cho tới khi họ tải lại."
      ],
      cv: "CV: ‘immutable cache-control on hashed assets with targeted invalidation for zero-downtime SPA deploys’ — bạn đã có đáp án cho S3 + CloudFront (Case 6). Mở rộng bằng: ‘nếu FE chạy trong container thì có thêm bẫy skew, em xử lý bằng…’ và nhắc quy tắc *BE tương thích ngược lên trước, FE sau*. Đó là cách nối FE và BE thành một câu chuyện zero-downtime hoàn chỉnh. Xem E6 trong ngân hàng."
    }
  ]
};
