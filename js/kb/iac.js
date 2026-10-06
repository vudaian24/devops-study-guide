/* ============================================================
   Trang 3 — Infrastructure as Code & Scripting
   Dòng Skills trong CV: Terraform, Bash, Python, jq
   Cấu trúc dữ liệu: xem chú thích đầu js/kb.js
   ============================================================ */

const TRANG = {
  id: "iac",
  ten: "Infrastructure as Code & Scripting",
  tomTat: "Terraform là phần bạn sở hữu trọn vẹn (151 resource, 22 module, mô hình per-tenant); Bash / Python / jq là công cụ dán mọi thứ lại với nhau. Câu trả lời mạnh nhất của bạn luôn nên trả lời **bằng chính dự án**, không bằng lý thuyết.",
  cvSkill: ["Terraform", "Bash", "Python", "jq"],

  cv: [
    { nguon: "ERC Booking · Terraform",
      noi: "Owned the Terraform codebase end to end: 151 resources across 22 reusable modules (VPC, ECS Fargate, Aurora PostgreSQL, ElastiCache, CloudFront + WAF, SQS, SES, Backup, Bastion)." },
    { nguon: "ERC Booking · Per-tenant",
      noi: "Designed the per-tenant isolation model so each new clinic gets a dedicated production environment from the same modules, then used it to stand up the first production tenant alongside shared dev/staging." },
    { nguon: "Kotae · Terraform",
      noi: "Contributed Terraform for the service’s Cognito and S3 resources…" },
    { nguon: "Tokyo Tech Lab · Bash",
      noi: "Wrote Bash automation for deployment, migration, and environment-provisioning tasks…" },
    { nguon: "Tokyo Tech Lab · Tài liệu",
      noi: "Wrote the infrastructure documentation and provisioning runbooks that other engineers follow to onboard new client environments." },
    { nguon: "Professional Summary",
      noi: "Primary infrastructure owner for a multi-tenant AWS platform — 151 Terraform resources across 22 reusable modules — with zero-downtime container rollouts and gated database migrations…" }
  ],

  bank: ["Terraform / IaC", "ERC Booking"],

  muc: [
    /* ---------------------------------------------------------- */
    {
      id: "tf-nen-tang", ten: "Terraform — nền tảng: vòng đời, state, backend",
      y: [
        "**Vòng đời**: `init` (tải provider / module, cấu hình backend) → `plan` (so code ↔ state ↔ thực tế, in thay đổi) → `apply` → `destroy`. Luôn `plan -out=tfplan` rồi `apply tfplan` để áp dụng **đúng** thứ đã review.",
        "**State** ánh xạ resource trong code với resource thật (ID, thuộc tính, dependency) và chứa cả **giá trị nhạy cảm dạng plaintext**. Vì vậy backend phải mã hoá, bật versioning và giới hạn quyền đọc.",
        "**Remote backend + locking**: S3 (versioning + mã hoá) với **lock file native** (`use_lockfile = true`, Terraform ≥ 1.10) hoặc bảng DynamoDB (cách cũ, đang bị loại dần). Không để state local: mất máy là mất state, hai người apply cùng lúc làm hỏng hạ tầng.",
        "Lock kẹt (process chết giữa chừng) → `terraform force-unlock <id>` — **chỉ sau khi chắc không còn lần apply nào đang chạy**.",
        "**Biến, output, locals, data source**: `variable` (input, có `type`, `validation`, `sensitive`), `output`, `locals` (tính toán nội bộ), `data` (đọc thứ đã tồn tại, không quản lý).",
        "**Dependency**: Terraform dựng đồ thị từ các tham chiếu (`aws_x.y.id`); `depends_on` chỉ dành cho phụ thuộc *ẩn* (vd IAM policy phải gắn xong trước khi dùng role).",
        "**`count` vs `for_each`**: `count` đánh index theo số nên xoá phần tử ở giữa làm các phần tử sau bị destroy / recreate; `for_each` đánh key theo chuỗi ổn định nên thêm bớt không ảnh hưởng phần còn lại — mô hình multi-tenant gần như bắt buộc dùng `for_each`. Key của `for_each` phải biết được ở thời điểm plan.",
        "**`lifecycle`**: `prevent_destroy` (database, bucket), `create_before_destroy`, `ignore_changes` (trường do hệ thống ngoài thay đổi), `replace_triggered_by`.",
        "**Refactor không destroy**: khối `moved { from, to }` hoặc `terraform state mv`. **Đưa resource có sẵn vào quản lý**: khối `import {}` / `terraform import`.",
        "**Provider và version**: khai `required_version`, `required_providers` (ràng buộc `~>`), và **commit `.terraform.lock.hcl`** để mọi máy và CI dùng cùng phiên bản provider."
      ],
      ma: {
        ten: "Backend S3 + khoá phiên bản",
        noi: [
          "terraform {",
          '  required_version = ">= 1.10"',
          "  required_providers {",
          '    aws = { source = "hashicorp/aws", version = "~> 6.0" }',
          "  }",
          '  backend "s3" {',
          '    bucket       = "example-tfstate"',
          '    key          = "erc/prod/network.tfstate"      # mỗi lớp / môi trường một key',
          '    region       = "ap-southeast-1"',
          "    encrypt      = true",
          "    use_lockfile = true                            # khoá bằng object trong S3, không cần DynamoDB",
          "  }",
          "}"
        ]
      },
      lenh: [
        ["terraform fmt -recursive && terraform validate", "Định dạng + kiểm tra cú pháp (chạy trong CI)"],
        ["terraform init -backend-config=env/prod.backend.hcl", "Chọn backend theo môi trường"],
        ["terraform plan -out=tfplan", "Lưu plan để apply đúng bản đã review"],
        ["terraform apply tfplan", "Áp dụng đúng plan đã lưu"],
        ["terraform plan -refresh-only", "Chỉ xem drift giữa state và thực tế"],
        ["terraform state list", "Danh sách resource trong state (đếm bằng `| wc -l`)"],
        ["terraform state mv <from> <to>", "Đổi địa chỉ resource khi refactor (hoặc dùng khối `moved`)"],
        ["terraform import <addr> <id>", "Đưa resource có sẵn vào state"],
        ["terraform apply -replace=<addr>", "Buộc tạo lại một resource (thay cho `taint`)"],
        ["terraform force-unlock <lock-id>", "Gỡ lock kẹt — cực kỳ cẩn thận"]
      ],
      bay: [
        "Chạy `apply` trực tiếp (không `plan -out`) trên production: giữa lúc review và lúc apply, code hoặc hạ tầng có thể đã đổi.",
        "Tin rằng `sensitive = true` là mã hoá: nó chỉ ẩn khỏi output, giá trị vẫn nằm plaintext trong state.",
        "`-target` tuỳ tiện: bỏ qua đồ thị phụ thuộc và để state lệch khỏi code."
      ],
      cv: "‘151 resources across 22 reusable modules’ chắc chắn bị hỏi: đếm thế nào (`terraform state list | wc -l`), 22 module là những module nào, state nằm đâu và khoá ra sao. Sẵn sàng liệt kê: VPC, ECS Fargate, Aurora PostgreSQL, ElastiCache, CloudFront + WAF, SQS, SES, Backup, Bastion."
    },

    /* ---------------------------------------------------------- */
    {
      id: "tf-module", ten: "Terraform — thiết kế module",
      y: [
        "**Module = thư mục `.tf` có input (`variable`) và output (`output`)**, gọi bằng khối `module \"x\" { source = … }`. Cấu trúc chuẩn: `main.tf`, `variables.tf`, `outputs.tf`, `versions.tf`, `README.md`.",
        "**Mỗi module một trách nhiệm** (VPC, ECS service, Aurora, CloudFront + WAF…), không hardcode tên môi trường hay tài khoản — mọi thứ thay đổi theo môi trường đi qua biến.",
        "**Tiêu chí chia module**: theo ranh giới trách nhiệm **và vòng đời thay đổi** — network ít đổi, app đổi liên tục nên tách state. Không chia ‘cho đẹp’; module mỏng chỉ bọc đúng một resource thường chỉ thêm độ phức tạp.",
        "**Tách state theo blast radius** (network / data / app): lỗi hay `apply` hỏng ở lớp app không kéo theo database. Đánh đổi: phải chia sẻ output giữa các state (`terraform_remote_state`, SSM Parameter, hoặc truyền biến).",
        "**Phiên bản hoá module**: `source` trỏ tag git / registry kèm `version`; nâng version là một thay đổi có review, không để module ‘trôi’.",
        "**Giao diện module nhỏ và có kiểu**: `type`, `description`, `validation`, giá trị mặc định an toàn; chỉ output những gì bên ngoài thực sự cần (id, arn, endpoint).",
        "**Provider trong module**: module con *không* nên tự khai `provider`; nhận qua `providers = { aws = aws.us_east_1 }` khi cần (vd chứng chỉ ACM và WAF cho CloudFront phải nằm ở `us-east-1`).",
        "**Kiểm tra trong CI**: `fmt`, `validate`, `tflint`, quét cấu hình (`checkov` / `trivy config`), `plan` đăng lên PR; `apply` chỉ chạy từ nhánh chính sau review."
      ],
      ma: {
        ten: "Gọi một module (root của một tenant)",
        noi: [
          'module "ecs_service" {',
          '  source = "../../modules/ecs-service"        # hoặc git::https://…?ref=v1.4.0',
          "",
          '  name          = "${var.tenant}-api"',
          "  cluster_arn   = module.ecs_cluster.arn",
          "  image         = var.api_image",
          "  desired_count = var.api_desired_count",
          "  subnet_ids    = module.network.private_subnet_ids",
          "}"
        ]
      },
      bay: "Hai thái cực đều tệ: module ‘khổng lồ’ có hàng chục cờ `enable_x` (khó đọc, khó nâng cấp) và copy-paste cùng một khối cho từng tenant (lệch nhau mà không ai biết).",
      cv: "‘22 reusable modules’: chuẩn bị tiêu chí chia (ranh giới trách nhiệm + vòng đời thay đổi) và **một câu tự phê** — module nào bạn thấy chia chưa hợp lý, sẽ làm khác đi thế nào. Xem T3 và E1 trong ngân hàng."
    },

    /* ---------------------------------------------------------- */
    {
      id: "tf-multi-env", ten: "Terraform — nhiều môi trường và mô hình per-tenant",
      y: [
        "**Ba cách tổ chức nhiều môi trường**: (1) *mỗi môi trường / tenant một thư mục root* gọi chung các module, mỗi root một state; (2) *workspace* — một code, nhiều state cùng backend; (3) *một root `for_each` qua map tenant* — một lần apply đụng mọi tenant.",
        "**Root riêng + state riêng** cho blast radius nhỏ nhất và tách được quyền truy cập theo môi trường; đánh đổi là nhiều thư mục / pipeline hơn, và nâng version module phải đi qua từng tenant.",
        "**Workspace** tiện nhưng *không phải ranh giới cách ly*: cùng backend, cùng credential, dễ apply nhầm workspace. Không dùng để tách production khỏi dev ở mức quyền hạn.",
        "**Một root `for_each` cho mọi tenant**: gọn, nhưng một lần apply động tới tất cả — thêm tenant mới có thể kéo theo thay đổi ngoài ý muốn ở tenant cũ; chỉ hợp khi số tenant nhỏ và đồng nhất.",
        "**Tham số hoá**: `env/dev.tfvars`, `env/prod.tfvars`; backend khác nhau qua `-backend-config`. Đặt tên và tag nhất quán (`tenant`, `env`, `managed-by = terraform`) để tính chi phí và truy vết.",
        "**Mô hình per-tenant isolation** (CV): mỗi clinic một môi trường production riêng từ cùng bộ module → cách ly dữ liệu triệt để (quan trọng với dữ liệu y tế), blast radius nhỏ, tính chi phí theo khách. Cái giá: chi phí hạ tầng nhân theo số tenant và **N môi trường đều phải patch, migrate, monitor**.",
        "**Kiểm soát nhược điểm**: cùng một bộ module và pipeline tham số hoá theo tenant, plan / apply tự động từng tenant, kiểm tra drift định kỳ, quy trình onboarding viết thành runbook.",
        "**Dev / staging dùng chung, production riêng**: tiết kiệm chi phí cho môi trường không cần cách ly — nêu rõ ranh giới nào được chia sẻ.",
        "Nêu được **ngưỡng**: tới bao nhiêu tenant thì per-tenant environment không còn hợp lý (chi phí cố định như NAT Gateway hay Aurora tối thiểu cho mỗi tenant; thời gian rollout một thay đổi qua N môi trường)."
      ],
      bang: {
        ten: "Ba cách tổ chức nhiều môi trường",
        cot: ["Cách", "State", "Blast radius", "Hợp khi", "Rủi ro"],
        hang: [
          ["Mỗi tenant một root", "Riêng", "Nhỏ nhất", "Cần cách ly; module dùng chung ít đổi", "Nhiều thư mục / pipeline; nâng module phải lặp từng tenant"],
          ["Workspace", "Riêng nhưng chung backend", "Trung bình", "Môi trường giống hệt, quyền như nhau", "Apply nhầm workspace; không cách ly quyền"],
          ["Một root `for_each`", "Một state chung", "Lớn nhất", "Ít tenant, đồng nhất", "Một lần apply chạm mọi tenant"]
        ]
      },
      bay: "Nói ‘tạo tenant mới hoàn toàn tự động’. Câu hỏi kế tiếp sẽ là ‘DNS ai trỏ, certificate ai cấp, tài khoản admin đầu tiên ai tạo?’ — hãy thừa nhận phần còn thủ công (xem E3 trong ngân hàng).",
      cv: "‘Each new clinic gets a dedicated production environment from the same modules’: chuẩn bị nói bạn dùng cách nào trong ba cách trên và **vì sao**, dựng một tenant mới mất bao lâu, bước nào còn thủ công (xem E2, E3)."
    },

    /* ---------------------------------------------------------- */
    {
      id: "tf-van-hanh", ten: "Terraform — vận hành an toàn",
      y: [
        "**Drift** (ai đó sửa tay trên console): `plan` hoặc `plan -refresh-only` phát hiện. Ba hướng xử lý: apply kéo về đúng code (mặc định) · `import` và sửa code nếu thay đổi hợp lệ · `ignore_changes` cho trường thật sự do hệ thống ngoài quản lý. **Phòng ngừa quan trọng hơn**: hạn chế quyền ghi trên console ở production, chạy `plan` định kỳ trong pipeline, mọi thay đổi đi qua merge request.",
        "**Luồng PR → plan → duyệt → apply**: CI chạy `fmt` / `validate` / `plan` và đăng plan lên PR; `apply` chạy từ nhánh chính, bằng role quyền tối thiểu, dùng đúng plan đã duyệt.",
        "**Credential cho pipeline**: OIDC → IAM role (không access key dài hạn); tách role cho `plan` (chỉ đọc) và `apply` (ghi).",
        "**Secret và state**: mật khẩu DB… vẫn nằm plaintext trong state dù `sensitive = true`. Ưu tiên để dịch vụ tự sinh và quản lý (vd `manage_master_user_password` của Aurora, lưu ở Secrets Manager) thay vì truyền mật khẩu qua biến.",
        "**Resource nguy hiểm**: `prevent_destroy` + `deletion_protection` cho database / bucket; chú ý thay đổi gây **replace** (plan hiện `-/+` hoặc ‘forces replacement’) — đọc kỹ trước khi apply.",
        "**`apply` fail giữa chừng**: state đã ghi phần tạo xong; sửa nguyên nhân rồi chạy lại `plan` + `apply` (idempotent). Resource tạo dở / hỏng thì dùng `-replace`.",
        "**Nâng cấp provider / Terraform**: đọc changelog, thử ở dev, `plan` phải sạch (không có thay đổi ngoài ý muốn) trước khi lên production.",
        "**Import hạ tầng có sẵn**: khối `import {}` + `plan -generate-config-out` sinh cấu hình khởi đầu, rồi dọn lại cho sạch."
      ],
      bay: "Thấy plan báo ‘must be replaced’ cho Aurora / ElastiCache mà vẫn apply vì ‘chắc không sao’ — có thể xoá luôn database. Luôn đọc kỹ dòng `forces replacement`.",
      cv: "Ở Kotae bạn ‘contributed Terraform for the service’s Cognito and S3 resources’: chuẩn bị nói cách bạn thêm resource vào codebase Terraform đang có (review, plan, ai apply) mà không ảnh hưởng phần của người khác. Xem T1, T2 trong ngân hàng về state và drift."
    },

    /* ---------------------------------------------------------- */
    {
      id: "bash", ten: "Bash cho tự động hoá deploy, migration, provisioning",
      y: [
        "**Đầu script an toàn**: `set -Eeuo pipefail` (thoát khi lệnh lỗi, biến chưa khai báo là lỗi, lỗi trong pipe không bị nuốt). Hiểu giới hạn: `set -e` có ngoại lệ (lệnh trong `if`, vế của `||` và `&&`).",
        "**Luôn quote biến** (`\"$var\"`), dùng `[[ … ]]`, `${var:?thông báo}` để bắt buộc có giá trị, `${var:-mặc định}` để đặt mặc định; không parse output của `ls`; dùng `mktemp` cho file tạm.",
        "**`trap`** để dọn dẹp và báo lỗi: `trap cleanup EXIT`, và `trap 'echo \"lỗi ở dòng $LINENO\" >&2' ERR`.",
        "**Idempotent**: chạy lại không hỏng — kiểm tra trạng thái trước khi làm (`mkdir -p`, `ln -sfn`, `grep -q … || …`) thay vì giả định script chỉ chạy đúng một lần.",
        "**Retry có backoff** cho thao tác mạng / API (`curl --fail --retry 5 --retry-delay 2` hoặc hàm retry tự viết); luôn có **timeout** cho lệnh có thể treo.",
        "**Log ra stderr, kết quả ra stdout, exit code có nghĩa** (0 thành công, ≠ 0 lỗi) để CI và script gọi biết kết quả. Tham số dùng `getopts` hoặc `$1` / `$@` có kiểm tra.",
        "**ShellCheck** bắt phần lớn lỗi quote / biến — chạy trong CI. Script dài hoặc logic phức tạp (cấu trúc dữ liệu, JSON, HTTP) thì chuyển sang Python.",
        "**Ba mảng Bash của bạn** (CV): deploy (SSH, compose, health check, ghi lại version để rollback), migration (chạy Liquibase, đọc exit code), provisioning môi trường (thư mục, user, cấu hình, cài gói) — viết sao cho người khác chạy lại được và biết khi nào lỗi."
      ],
      ma: {
        ten: "Skeleton script deploy: ghi version cũ, deploy có kiểm chứng, tự rollback",
        noi: [
          "#!/usr/bin/env bash",
          "set -Eeuo pipefail",
          "",
          'TAG="${1:?usage: deploy.sh <image-tag>}"',
          "APP_DIR=/opt/app",
          "log() { printf '[%s] %s\\n' \"$(date +%T)\" \"$*\" >&2; }",
          "",
          'cd "$APP_DIR"',
          "PREV=$(grep -oP '^IMAGE_TAG=\\K.*' .env || true)      # ghi lại bản đang chạy để rollback",
          'log "deploy $TAG (trước đó: ${PREV:-chưa có})"',
          "",
          'sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$TAG/" .env',
          "if ! docker compose up -d --wait --wait-timeout 120; then",
          '  log "deploy lỗi — rollback về ${PREV:?không có bản trước để rollback}"',
          '  sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$PREV/" .env',
          "  docker compose up -d --wait --wait-timeout 120",
          "  exit 1",
          "fi",
          'log "OK"'
        ]
      },
      lenh: [
        ["shellcheck deploy.sh", "Lint script — bắt lỗi quote, biến, so sánh"],
        ["bash -x deploy.sh", "Chạy ở chế độ trace để xem từng lệnh (cẩn thận: có thể in secret)"],
        ["set +x … set -x", "Tắt trace quanh đoạn có secret rồi bật lại"],
        ["curl --fail --silent --show-error --retry 5 --retry-delay 2 <url>", "Gọi HTTP có retry; mã HTTP ≠ 2xx thì exit ≠ 0"],
        ["timeout 30 <lệnh>", "Giới hạn thời gian chạy"],
        ["xargs -P4 -I{} <lệnh> {}", "Chạy song song có kiểm soát"]
      ],
      bay: [
        "`rm -rf \"$DIR/\"` khi `$DIR` rỗng thành `rm -rf /`. Luôn `${DIR:?}` và kiểm tra trước khi xoá.",
        "Bật `set -x` rồi để lọt secret vào log CI."
      ],
      cv: "‘Bash automation for deployment, migration, and environment-provisioning tasks’: mang theo một script thật bạn đã viết — cấu trúc, cách xử lý lỗi, cách rollback — và nói được vì sao chọn Bash thay vì Python cho nó."
    },

    /* ---------------------------------------------------------- */
    {
      id: "python-jq", ten: "Python và jq",
      y: [
        "**Khi nào Python thay Bash**: cần cấu trúc dữ liệu, xử lý JSON / YAML phức tạp, gọi API HTTP có retry và phân trang, nhiều nhánh logic, cần test được. Bash hợp với việc ‘dán’ các lệnh CLI lại với nhau.",
        "**Python cho DevOps**: `subprocess.run([...], check=True, capture_output=True, text=True)` (truyền list, không `shell=True` với đầu vào không tin cậy), `argparse`, `requests` **luôn có `timeout`**, `boto3` gọi AWS API, `logging` thay `print`, `venv` + pin dependency.",
        "**jq là ‘sed cho JSON’**: lọc, biến đổi, tổng hợp output của CLI / API. Hay dùng: `.a.b`, `.[]`, `select(...)`, `map(...)`, `-r` (in chuỗi không nháy), `--arg` / `--argjson` (truyền biến vào filter), `//` (giá trị mặc định), `to_entries`, `@csv` / `@tsv`, `del(...)`.",
        "**`aws --query` (JMESPath) vs jq**: `--query` lọc ngay phía AWS CLI, đủ cho việc trích trường đơn giản; biến đổi, ghép, ghi lại cấu trúc thì dùng jq. Nhớ `--output text` khi chỉ cần một giá trị.",
        "**Ví dụ ngay trong CV**: vá task definition — `describe-task-definition` → `jq 'del(<các trường chỉ-đọc>) | .containerDefinitions[0].image = $img'` → `register-task-definition`.",
        "**Truyền giá trị vào jq bằng `--arg`**, không nối chuỗi vào filter (tránh lỗi quote và injection)."
      ],
      ma: {
        ten: "Một vài mẫu jq và Python hay dùng",
        noi: [
          "# Task đang chạy: ARN + trạng thái, dạng bảng",
          "aws ecs describe-tasks --cluster \"$C\" --tasks $T | jq -r '.tasks[] | [.taskArn, .lastStatus] | @tsv'",
          "",
          "# Lọc có tham số",
          "jq --arg env \"prod\" '.items[] | select(.env == $env) | .name' services.json",
          "",
          "# Giá trị mặc định khi thiếu trường",
          "jq -r '.config.timeout // 30' app.json",
          "",
          "# Python: gọi API có timeout, lỗi HTTP thì dừng",
          "python3 - <<'PY'",
          "import requests",
          'r = requests.get("https://example.com/health", timeout=5)',
          "r.raise_for_status()",
          "print(r.json())",
          "PY"
        ]
      },
      lenh: [
        ["jq '.' file.json", "Pretty-print và kiểm tra JSON hợp lệ"],
        ["jq -r '.[] | .name'", "In từng giá trị, không có dấu nháy"],
        ["jq -s 'add' a.json b.json", "Gộp nhiều file JSON"],
        ["aws ec2 describe-instances --query 'Reservations[].Instances[].InstanceId' --output text", "JMESPath phía client"],
        ["python3 -m venv .venv && . .venv/bin/activate", "Môi trường ảo riêng cho script"],
        ["python3 -m json.tool < file.json", "Pretty-print khi máy không có jq"]
      ],
      bay: "`shell=True` với chuỗi ghép từ input ngoài (command injection); gọi `requests` không `timeout` (treo vĩnh viễn); parse JSON bằng `grep` / `sed` / `awk`.",
      cv: "Dòng Skills của bạn có **Python và jq**. Mang theo một ví dụ thật cho mỗi thứ (vd jq vá task definition) — người phỏng vấn hay đưa một đoạn JSON và hỏi lọc hoặc biến đổi thế nào."
    },

    /* ---------------------------------------------------------- */
    {
      id: "runbook", ten: "Runbook và tài liệu hạ tầng",
      y: [
        "**Runbook là tài liệu để người khác thực hiện đúng một việc vận hành** mà không cần hỏi bạn. Tiêu chuẩn tốt: người mới làm theo được **ngay lần đầu** và biết khi nào phải dừng lại hỏi.",
        "**Cấu trúc**: mục đích và khi nào dùng → điều kiện tiên quyết (quyền, công cụ, thông tin cần) → các bước đánh số, mỗi bước có **lệnh cụ thể + kết quả mong đợi** → cách **kiểm tra thành công** → **rollback** → sự cố thường gặp → người chịu trách nhiệm và ngày cập nhật cuối.",
        "**Onboarding một môi trường khách hàng mới** thường gồm: chuẩn bị biến theo tenant → Terraform plan / apply → DNS + certificate → chạy migration / seed → tạo tài khoản admin đầu tiên → smoke test → bàn giao thông tin truy cập qua kênh an toàn → ghi vào danh sách môi trường.",
        "**Đánh dấu rõ bước thủ công** và lý do chưa tự động hoá — trung thực hơn nói ‘một lệnh là xong’, đồng thời là backlog cho lần tự động hoá kế tiếp.",
        "**Runbook sống cùng code** (trong repo, review qua PR) và có ngày xác nhận lần cuối. Runbook chưa ai chạy thử thì rất có thể sai — cho người khác chạy thử và sửa theo phản hồi.",
        "**Không đưa secret vào tài liệu**; chỉ chỉ dẫn nơi lấy (secret manager, đường dẫn).",
        "Giá trị khi phỏng vấn: runbook là bằng chứng bạn **giảm phụ thuộc vào cá nhân** và giúp team scale — tư duy của người vận hành, không chỉ của người dựng."
      ],
      ma: {
        ten: "Khung runbook gọn — dựng môi trường cho khách hàng mới",
        noi: [
          "# Runbook: Dựng môi trường cho khách hàng mới",
          "Khi dùng : có hợp đồng mới cần môi trường production riêng",
          "Cần có   : quyền apply (role …), tenant id, domain, người liên hệ",
          "Bước 1   : tạo env/<tenant>.tfvars → `terraform plan` → duyệt → `terraform apply`",
          "           Mong đợi: plan không có `destroy`; apply xong có output endpoint",
          "Bước 2   : [THỦ CÔNG] trỏ DNS … (chưa tự động vì: …)",
          "Bước 3   : chạy migration, seed dữ liệu, tạo admin đầu tiên",
          "Kiểm tra : GET /health trả 200; đăng nhập admin thành công",
          "Rollback : destroy riêng tenant này (kiểm tra kỹ state key trước!)",
          "Sự cố hay gặp: certificate chưa validate → …",
          "Cập nhật : <ngày> bởi <tên>"
        ]
      },
      cv: "‘Wrote the infrastructure documentation and provisioning runbooks that other engineers follow to onboard new client environments’: mang theo một runbook thật. Sẵn sàng trả lời: ai đã dùng nó, họ vướng ở đâu, và bạn đã sửa gì sau phản hồi."
    }
  ]
};
