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
  tomTat: "Những tình huống thật mà một DevOps phải xử lý: **triển khai multi-tenant, migration, truy cập database trong private network, rollout / rollback, SSRF, secret, khôi phục dữ liệu, chi phí**. Mỗi case đi theo cùng khung — bối cảnh, lựa chọn và đánh đổi, các bước làm, cách kiểm chứng, rủi ro — để bạn kể được trong 2–3 phút.",
  cvSkill: ["Terraform", "ECS Fargate", "Aurora", "SSM", "Liquibase", "Kubernetes", "Helm", "CloudFront", "Secrets Manager", "CloudWatch"],

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
        "**Các case dưới đây** gồm: kiến trúc (1, 3) · dữ liệu và truy cập (2, 4, 10) · triển khai và phát hành (5, 6) · sự cố và bảo mật (7, 8, 9) · chi phí (11)."
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
        "**Cẩn trọng hơn nữa**: canary hoặc blue/green (CodeDeploy hoặc tính năng blue/green tích hợp của ECS). Đánh đổi: phức tạp hơn, tốn gấp đôi tài nguyên trong lúc chuyển."
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
        "**Service worker / PWA** (nếu có) có thể giữ bản cũ — cần chiến lược cập nhật, nếu không người dùng kẹt ở bản cũ dù đã deploy.",
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
    }
  ]
};
