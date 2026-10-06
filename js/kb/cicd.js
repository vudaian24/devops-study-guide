/* ============================================================
   Trang 2 — CI/CD
   Dòng Skills trong CV: Jenkins, GitLab CI, GitHub Actions, Liquibase
   Cấu trúc dữ liệu: xem chú thích đầu js/kb.js
   ============================================================ */

const TRANG = {
  id: "cicd",
  ten: "CI/CD",
  tomTat: "Ba hệ CI bạn đã dựng pipeline (Jenkins, GitLab CI, GitHub Actions) và Liquibase cho migration. Chiều sâu thật nằm ở **nguyên lý chung** — artifact bất biến, gate bằng test, rollback bằng artifact cũ — và ở **bốn pipeline bạn tự viết** trong CV.",
  cvSkill: ["Jenkins", "GitLab CI", "GitHub Actions", "Liquibase"],

  cv: [
    { nguon: "Tokyo Tech Lab · Jenkins + GitLab CI + GitHub Actions",
      noi: "Built and maintained delivery pipelines across three CI systems — Jenkins (Jenkinsfile pipelines for container build and publication behind test and quality gates, together with administration of the Jenkins server: agents, credentials, and plugins), GitLab CI, and GitHub Actions." },
    { nguon: "Tokyo Tech Lab · HR platform",
      noi: "Restructured an internal HR platform’s GitHub Actions CI into reusable `workflow_call` components gated on lint and type-check, replacing a `workflow_run` setup that silently skipped every pull request’s first run, and pinned the toolchain with `.nvmrc`." },
    { nguon: "Tokyo Tech Lab · Môi trường + quy ước",
      noi: "Closed the gap between local, CI, and production environments — replacing MinIO with LocalStack so tests exercise the same S3 API as the deployed service — and enforced commit and pull-request conventions as an automated gate rather than review-time comments." },
    { nguon: "ERC Booking · Rollout",
      noi: "Built the GitHub Actions rollout pipeline that patches ECS task definitions, registers revisions, and rolls out API/worker services with stability checks, old-revision cleanup, and path-based selective builds." },
    { nguon: "ERC Booking · Migration",
      noi: "Engineered a branch-gated Liquibase migration pipeline that runs as a one-off ECS Fargate task per environment and auto-generates CloudWatch Logs links for failure triage." },
    { nguon: "ERC Booking · Frontend",
      noi: "Authored the S3 + CloudFront release pipeline for the frontend, using immutable cache-control on hashed assets with targeted invalidation for zero-downtime SPA deploys." },
    { nguon: "Self-managed deployment · Chuỗi workflow",
      noi: "Orchestrated CI/CD as chained GitHub Actions workflows on push to main: `ci.yml` (lint, type-check) gates `cd.yml` (Buildx build with layer caching, images tagged by commit SHA into private GHCR), which calls `deploy.yml` — with a manual rollback path redeploying any earlier tag, and outcomes reported to Telegram." },
    { nguon: "Self-managed deployment · Deploy qua SSH",
      noi: "Deployed over SSH as a least-privilege `ci` user with the host key pinned in the workflow rather than trusted on first use, recording the outgoing version for rollback and rolling the new one out with `compose up --wait` behind a retried health check." },
    { nguon: "Tokyo Tech Lab · Hỗ trợ",
      noi: "…served as first-line support for development and release engineers on build and deployment failures, triaging from pipeline and container logs through to root cause." }
  ],

  bank: ["GitLab CI", "Kinh nghiệm công ty", "Portfolio tự quản"],

  muc: [
    /* ---------------------------------------------------------- */
    {
      id: "nguyen-ly", ten: "Nguyên lý chung — thứ không đổi giữa các công cụ",
      y: [
        "**CI** = mỗi thay đổi được build + test tự động và hợp nhất thường xuyên. **Continuous Delivery** = luôn có artifact sẵn sàng phát hành, bấm nút (hoặc duyệt) là lên production. **Continuous Deployment** = tự lên production khi qua hết gate.",
        "**Build một lần, promote artifact bất biến**: image tag theo **commit SHA**, đẩy lên registry rồi triển khai *đúng artifact đó* qua dev → staging → production. Build lại ở từng môi trường nghĩa là thứ chạy production không phải thứ đã được test.",
        "**Gate phải thực sự chặn**: lint, type-check, test, quét chất lượng/bảo mật chạy trước khi build/publish; fail thì dừng. Một gate bị bỏ qua âm thầm còn tệ hơn không có gate vì cả team tin vào thứ không tồn tại (false confidence).",
        "**Rollback = deploy lại artifact cũ** — chỉ làm được khi artifact bất biến và biết phiên bản đang chạy. Không rollback bằng cách build lại từ commit cũ.",
        "**Tách trách nhiệm** kiểm tra (CI) / build-publish (CD) / deploy, để deploy và rollback gọi lại độc lập mà không phải build lại.",
        "**Deploy phải có bước verify** (health check có retry, smoke test) thay vì chỉ ‘lệnh trả về 0’, và chạy lại không làm hỏng gì (idempotent).",
        "**Secret nằm ngoài repo**: biến được mask/protected của hệ CI, secret manager, hoặc credential ngắn hạn qua OIDC. Không `echo` secret, không in toàn bộ biến môi trường khi debug.",
        "**Cache ≠ artifact**: cache để tăng tốc và *có thể không tồn tại*; artifact là đầu ra cần truyền sang job sau. Dùng cache để truyền kết quả build → fail ngẫu nhiên.",
        "**Pin version** (toolchain `.nvmrc`, image, action/plugin). Pipeline ‘hôm qua xanh, hôm nay đỏ dù không ai đổi code’ gần như luôn do thứ không được pin."
      ],
      bang: {
        ten: "So sánh ba hệ CI bạn đã dùng",
        cot: ["", "Jenkins", "GitLab CI", "GitHub Actions"],
        hang: [
          ["Cấu hình", "`Jenkinsfile` (Groovy; declarative hoặc scripted)", "`.gitlab-ci.yml`", "`.github/workflows/*.yml`"],
          ["Chạy ở đâu", "**Agent** do bạn dựng và vận hành", "**Runner** (shared / group / project), tự host hoặc SaaS", "Runner của GitHub hoặc self-hosted"],
          ["Điểm mạnh", "Linh hoạt nhất, plugin khổng lồ; hợp môi trường legacy / on-prem phức tạp", "Tích hợp chặt SCM, registry, environments có sẵn; self-host được", "Hệ sinh thái action lớn, khởi động nhanh, gắn liền GitHub"],
          ["Cái giá", "**Phải vận hành chính Jenkins**: nâng cấp, plugin, bảo mật, backup", "Self-host thì phải vận hành GitLab + runner", "Phụ thuộc nền tảng; self-hosted runner tự lo bảo mật"],
          ["Tái sử dụng", "Shared Library", "`include`, `extends`, template", "Reusable workflow (`workflow_call`), composite action"],
          ["Secret", "Credentials store + `withCredentials`", "Masked / Protected variable, file variable, Vault / OIDC", "Secrets, environment secrets, OIDC"]
        ]
      },
      cv: "Bạn đã làm cả ba nên câu chốt tự nhiên nhất là: ‘Công cụ khác cú pháp nhưng nguyên lý giống nhau — tách stage, artifact bất biến, gate bằng test, secret ngoài repo, rollback bằng deploy lại artifact cũ.’ Chuẩn bị sẵn một ví dụ cho mỗi vế."
    },

    /* ---------------------------------------------------------- */
    {
      id: "jenkins", ten: "Jenkins — pipeline và quản trị server",
      y: [
        "**Kiến trúc**: *controller* (giao diện, lập lịch, lưu cấu hình và lịch sử) + *agent* (nơi build thật chạy), nối bằng SSH hoặc inbound/WebSocket. Đặt số executor của controller = 0 để build **không** chạy trên controller (lộ credential, ăn tài nguyên).",
        "**Declarative Pipeline**: `pipeline { agent … stages { stage … steps … } post { … } }`, có `options` (`timeout`, `disableConcurrentBuilds`, `buildDiscarder`), `environment`, `when`, `parallel`, `input` (duyệt tay). Scripted linh hoạt hơn nhưng khó đọc, khó kiểm soát hơn.",
        "**Agent**: theo label (`agent { label 'docker' }`), mỗi build một container (`agent { docker { image 'node:22' } }`), hoặc mỗi build một pod (plugin Kubernetes). Agent dùng một lần thì sạch hơn agent sống lâu bị bẩn state.",
        "**Credentials**: lưu trong Credentials store, dùng qua `withCredentials([...])` hoặc `credentials('id')`. Jenkins che giá trị trong log nhưng **không đảm bảo tuyệt đối** (secret bị biến đổi base64 hoặc cắt chuỗi vẫn lộ).",
        "**Lỗi kinh điển**: nội suy Groovy bằng dấu nháy kép `sh \"docker login -p $PASS\"` đưa secret thẳng vào command line và log. Dùng nháy đơn để *shell* mới mở rộng biến, kèm `--password-stdin`.",
        "**Quality gate**: publish kết quả test (`junit`), quét chất lượng/bảo mật (vd SonarQube + `waitForQualityGate`), chỉ build và publish image khi gate qua — đúng ý ‘container build and publication behind test and quality gates’.",
        "**Shared Library** (`@Library('x') _`) gom logic dùng chung giữa nhiều Jenkinsfile; **JCasC** (Jenkins Configuration as Code) mô tả cấu hình server bằng YAML để dựng lại được.",
        "**Quản trị server**: nâng cấp Jenkins (LTS) và plugin có kế hoạch — plugin lỗi thời là cửa vào số một, ít plugin thì ít rủi ro. Backup `JENKINS_HOME` (`jobs/`, `config.xml`, `credentials.xml`, `secrets/`); phân quyền (matrix / role-based), bật CSRF protection, hạn chế Script Console.",
        "Sự cố quen thuộc của người quản trị: agent offline, agent hết disk, hết executor, plugin xung đột sau nâng cấp, hàng đợi build kẹt."
      ],
      ma: {
        ten: "Jenkinsfile mẫu — test, build, publish chỉ trên main",
        noi: [
          "pipeline {",
          "  agent { label 'docker' }",
          "  options { timeout(time: 30, unit: 'MINUTES'); disableConcurrentBuilds() }",
          '  environment { IMAGE = "registry.example.com/app:${GIT_COMMIT}" }',
          "  stages {",
          "    stage('Test')  { steps { sh 'npm ci && npm test' } }",
          "    stage('Build') { steps { sh 'docker build -t $IMAGE .' } }",
          "    stage('Publish') {",
          "      when { branch 'main' }",
          "      steps {",
          "        withCredentials([usernamePassword(credentialsId: 'registry', usernameVariable: 'U', passwordVariable: 'P')]) {",
          "          sh 'echo $P | docker login registry.example.com -u $U --password-stdin'   // nháy ĐƠN: shell mở rộng biến",
          "          sh 'docker push $IMAGE'",
          "        }",
          "      }",
          "    }",
          "  }",
          "  post { always { junit allowEmptyResults: true, testResults: 'reports/*.xml' } }",
          "}"
        ]
      },
      lenh: [
        ["Manage Jenkins → Nodes", "Trạng thái agent, executor, lý do offline"],
        ["Manage Jenkins → Plugins → Updates", "Cập nhật plugin có kế hoạch; đọc cảnh báo bảo mật trước khi nâng"],
        ["$JENKINS_HOME (thường /var/lib/jenkins)", "Thư mục cần backup: `jobs/`, `config.xml`, `credentials.xml`, `secrets/`, `plugins/`"],
        ["journalctl -u jenkins -f", "Log của dịch vụ Jenkins khi cài bằng package"],
        ["Pipeline Syntax → Snippet Generator", "Sinh cú pháp step (vd `withCredentials`) cho khỏi viết sai"]
      ],
      bay: [
        "Cho build chạy trên controller: ai sửa được Jenkinsfile là đọc được credential trên controller.",
        "Nội suy secret bằng nháy kép trong `sh \"…\"`: secret vào command line và log dù có mask."
      ],
      cv: "CV ghi ‘administration of the Jenkins server: agents, credentials, and plugins’. Chuẩn bị: có bao nhiêu agent và loại gì, credential nào, plugin nào từng gây sự cố, nâng cấp và backup thế nào — chi tiết này phân biệt ‘đã vận hành Jenkins’ với ‘đã viết Jenkinsfile’."
    },

    /* ---------------------------------------------------------- */
    {
      id: "gitlab-ci", ten: "GitLab CI",
      y: [
        "**Pipeline** gồm các **stage** chạy tuần tự, mỗi stage nhiều **job** chạy song song; job chạy trên **Runner** nhận việc bằng cách *poll* GitLab (GitLab không push xuống runner).",
        "**Executor**: `shell` (nhanh nhưng bẩn state giữa các job), `docker` (mỗi job một container sạch — nên dùng mặc định), `kubernetes` (mỗi job một pod). Phạm vi runner: shared / group / project.",
        "**`rules`** thay `only/except`: `if`, `changes`, `exists` kết hợp `when` (`on_success`, `manual`, `never`); **match đầu tiên thắng**. `rules:changes` là cách làm selective build cho monorepo.",
        "**`needs`** tạo DAG: job chạy ngay khi dependency của riêng nó xong, không đợi cả stage.",
        "**`cache` vs `artifacts`**: cache tăng tốc (`key` theo branch hoặc theo lockfile, `policy: pull` cho job chỉ đọc) và có thể mất; artifacts là output truyền sang stage sau (`expire_in`).",
        "**`include` / `extends` / `!reference`** để tái sử dụng; một repo `ci-templates` dùng chung rồi `include: project:` và override phần riêng. Tương đương `workflow_call` bên GitHub.",
        "**Biến**: *Masked* che trong log; **Protected** chỉ cấp cho branch/tag protected (quên bật thì bất kỳ ai push một branch cũng lấy được secret production); file-type variable cho kubeconfig / chứng chỉ. Biến có sẵn hay dùng: `CI_COMMIT_SHA`, `CI_COMMIT_REF_SLUG`, `CI_REGISTRY_IMAGE`, `CI_PIPELINE_SOURCE`.",
        "**Build image trong CI**: DinD (`docker:dind`, cần `privileged` — rủi ro), mount docker socket (còn rủi ro hơn), hoặc build không cần daemon / rootless (Buildah, BuildKit rootless; Kaniko — repo gốc đã archive từ 2025, kiểm tra bản fork đang được duy trì).",
        "**`environment:`** để GitLab lưu lịch sử deploy và cho redeploy bản cũ ngay trên giao diện; **`resource_group`** để hai deploy cùng môi trường không chạy chồng; `workflow:rules` để tránh pipeline trùng (branch + merge request).",
        "**Tối ưu pipeline chậm**: đo trước, `needs`, cache đúng key, `rules:changes`, layer cache, `parallel:`; `interruptible: true` để tự huỷ pipeline cũ khi có push mới."
      ],
      ma: {
        ten: ".gitlab-ci.yml mẫu — test, build, deploy production thủ công",
        noi: [
          "stages: [test, build, deploy]",
          "",
          "variables:",
          "  IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA        # tag theo SHA, không dùng latest",
          "",
          "workflow:                                          # tránh chạy trùng pipeline branch + MR",
          "  rules:",
          '    - if: $CI_PIPELINE_SOURCE == "merge_request_event"',
          "    - if: $CI_COMMIT_BRANCH && $CI_OPEN_MERGE_REQUESTS",
          "      when: never",
          "    - if: $CI_COMMIT_BRANCH",
          "",
          "test:",
          "  stage: test",
          "  image: node:22-alpine",
          "  cache: { key: { files: [package-lock.json] }, paths: [node_modules/] }",
          "  script: [npm ci, npm test]",
          "  interruptible: true",
          "",
          "build:",
          "  stage: build",
          "  needs: [test]",
          '  script: ./ci/build-and-push.sh "$IMAGE"          # Buildah / BuildKit rootless / DinD',
          "  rules:",
          '    - if: $CI_COMMIT_BRANCH == "main"',
          "",
          "deploy_prod:",
          "  stage: deploy",
          "  needs: [build]",
          "  environment: { name: production }",
          "  resource_group: production",
          '  script: ./ci/deploy.sh "$IMAGE"',
          "  rules:",
          '    - if: $CI_COMMIT_BRANCH == "main"',
          "      when: manual"
        ]
      },
      lenh: [
        ["gitlab-runner verify", "Kiểm tra runner còn kết nối được GitLab"],
        ["gitlab-runner list", "Các runner đã đăng ký trên máy này"],
        ["glab ci status / glab ci trace", "Xem trạng thái pipeline và log từ terminal (CLI `glab`)"],
        ["Pipeline editor → Validate", "Kiểm tra cú pháp `.gitlab-ci.yml` trước khi push"]
      ],
      bay: [
        "Dùng `cache` để truyền kết quả build giữa các job: job sau chạy trên runner khác thì fail **ngẫu nhiên**, rất khó truy vì không lặp lại đều. Thứ cần truyền là `artifacts`.",
        "Quên bật **Protected** cho biến production, hoặc `echo` biến để debug."
      ],
      cv: "Nếu vị trí đòi GitLab CI ‘thành thạo’, đây là phần cần chủ động nối. Ánh xạ từ cái bạn đã làm: `workflow_call` ↔ `include` / `extends`; path-based selective build ↔ `rules:changes`; chuỗi ci → cd → deploy ↔ stages + `needs`; rollback về tag cũ ↔ job `manual` + `environment`. Học thuộc 9 câu GitLab CI trong ngân hàng."
    },

    /* ---------------------------------------------------------- */
    {
      id: "github-actions", ten: "GitHub Actions",
      y: [
        "**Mô hình**: *workflow* (YAML) được kích hoạt bởi *event* → chạy các *job* (mặc định song song, nối bằng `needs`) trên *runner* → mỗi job gồm các *step* (`run` hoặc `uses` một action).",
        "**Trigger hay dùng**: `push`, `pull_request`, `workflow_dispatch` (chạy tay, có `inputs` — hợp cho rollback chọn tag), `schedule`, `workflow_call` (workflow được gọi lại), `workflow_run`.",
        "**`workflow_call` (reusable workflow)**: khai `inputs` / `secrets` / `outputs`; workflow khác gọi bằng `uses: ./.github/workflows/ci.yml`. Job gọi là **một phần của cùng một run** nên `needs` và chặn đúng như job thường. Truyền secret bằng `secrets: inherit` hoặc khai tường minh.",
        "**`workflow_run` dễ gây lỗi**: chỉ kích hoạt khi file workflow có trên **default branch** và chạy theo ngữ cảnh của default branch, không phải của PR → hành vi khó đoán, dễ bị bỏ qua âm thầm. Đây đúng là loại lỗi CV của bạn đã gỡ.",
        "**`permissions:`** đặt tối thiểu cho `GITHUB_TOKEN` (`contents: read`; chỉ thêm `packages: write` hoặc `id-token: write` khi cần).",
        "**OIDC tới AWS**: job có `id-token: write`, assume role bằng `aws-actions/configure-aws-credentials`; trust policy của role giới hạn theo `sub` (vd `repo:org/repo:ref:refs/heads/main`). Không còn access key dài hạn nằm trong secret.",
        "**Cache và build image**: `actions/setup-node` với `node-version-file: .nvmrc`; `docker/build-push-action` với `cache-from` / `cache-to: type=gha` (Buildx layer cache); tag image theo `${{ github.sha }}`; đăng nhập GHCR bằng `GITHUB_TOKEN`.",
        "**`concurrency`**: `cancel-in-progress: false` cho deploy (không huỷ giữa chừng), `true` cho CI của PR.",
        "**`paths:` ở cấp trigger vs lọc ở cấp job**: workflow bị bỏ qua vì `paths` có thể làm required check treo ở ‘Expected’ → PR không merge được. Muốn selective build mà vẫn có required check thì lọc ở cấp job (vd `dorny/paths-filter`).",
        "**Environments** + required reviewers cho bước deploy production; **pin action bên thứ ba theo commit SHA** (tag có thể bị di chuyển — rủi ro chuỗi cung ứng).",
        "Self-hosted runner tiện (mạng nội bộ, cache) nhưng **không dùng cho repo public / PR từ fork**, và phải tự lo vá lỗi, cô lập, dọn dẹp."
      ],
      ma: {
        ten: "Reusable workflow + workflow gọi nó (tách kiểm tra khỏi build)",
        noi: [
          "# .github/workflows/ci.yml — tái sử dụng được",
          "on: workflow_call",
          "jobs:",
          "  verify:",
          "    runs-on: ubuntu-latest",
          "    steps:",
          "      - uses: actions/checkout@v4",
          "      - uses: actions/setup-node@v4",
          "        with:",
          "          node-version-file: .nvmrc",
          "          cache: npm",
          "      - run: npm ci",
          "      - run: npm run lint && npm run typecheck",
          "",
          "# .github/workflows/cd.yml — chỉ build khi ci xanh",
          "on:",
          "  push:",
          "    branches: [main]",
          "jobs:",
          "  ci:",
          "    uses: ./.github/workflows/ci.yml",
          "  build:",
          "    needs: ci",
          "    runs-on: ubuntu-latest",
          "    permissions: { contents: read, packages: write }",
          "    steps:",
          "      - uses: actions/checkout@v4",
          "      - uses: docker/setup-buildx-action@v3",
          "      - uses: docker/login-action@v3",
          "        with:",
          "          registry: ghcr.io",
          "          username: ${{ github.actor }}",
          "          password: ${{ secrets.GITHUB_TOKEN }}",
          "      - uses: docker/build-push-action@v6",
          "        with:",
          "          push: true",
          "          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}",
          "          cache-from: type=gha",
          "          cache-to: type=gha,mode=max"
        ]
      },
      lenh: [
        ["gh run list --workflow cd.yml", "Các lần chạy gần đây của một workflow"],
        ["gh run view <id> --log-failed", "Chỉ in log của các step fail"],
        ["gh run rerun <id> --failed", "Chạy lại riêng các job fail"],
        ["gh workflow run deploy.yml -f tag=<sha>", "Kích hoạt `workflow_dispatch` — vd rollback về một tag cũ"],
        ["actionlint", "Lint file workflow trước khi push"]
      ],
      bay: [
        "Nối CI → CD bằng `workflow_run` rồi tin rằng mọi PR đều được kiểm tra. Đối chiếu số lần chạy với số PR — đó chính là cách phát hiện lỗi này.",
        "Để `permissions` mặc định rộng và dùng action bên thứ ba theo tag trôi nổi."
      ],
      cv: "Bạn có hai bằng chứng mạnh: (1) tái cấu trúc `workflow_run` → `workflow_call` vì bug ‘bỏ qua âm thầm lần chạy đầu của PR’; (2) chuỗi `ci.yml → cd.yml → deploy.yml` có rollback thủ công về tag cũ và báo Telegram. Sẵn sàng giải thích **vì sao tách ba workflow** thay vì gộp một (xem P2 trong ngân hàng)."
    },

    /* ---------------------------------------------------------- */
    {
      id: "bon-pipeline", ten: "Bốn pipeline trong CV — kể lại được từng bước",
      y: [
        "Với **mỗi** pipeline, chuẩn bị trả lời năm câu: **trigger** là gì, **gate** nào chặn, **artifact** là gì, **rollback** ra sao, **làm sao biết đã thành công**.",
        "Cả bốn theo cùng nguyên lý: artifact bất biến (tag SHA, file có hash), deploy có kiểm chứng (`wait`, health check), rollback bằng artifact cũ, và **thứ tự an toàn** (asset trước index; schema tương thích ngược trước code mới).",
        "Phần ‘patch task definition’ dùng `jq` để xoá các trường chỉ-đọc (`taskDefinitionArn`, `revision`, `status`, `requiresAttributes`, `compatibilities`, `registeredAt`, `registeredBy`) mà `register-task-definition` không nhận, rồi thay image."
      ],
      bang: {
        ten: "Bảng tóm tắt bốn pipeline",
        cot: ["Pipeline", "Các bước", "Kiểm chứng / rollback", "Câu hỏi khó hay gặp"],
        hang: [
          ["**ECS rollout** (ERC, GitHub Actions)",
           "`describe-task-definition` → vá image mới → `register-task-definition` → `update-service` → `aws ecs wait services-stable` → dọn revision cũ",
           "ECS rolling giữ task cũ tới khi task mới healthy nên fail thì service giữ nguyên bản cũ; rollback chủ động = `update-service` về revision trước",
           "Role CI cần `iam:PassRole`; đã bật deployment circuit breaker chưa; selective build hoạt động thế nào"],
          ["**Liquibase migration** (ERC)",
           "Gate theo branch → `run-task` one-off chạy Liquibase `update` → đợi task dừng → **đọc exit code** → fail thì in link CloudWatch Logs",
           "Chạy đúng một lần mỗi môi trường; lock chống chạy song song; snapshot trước khi chạy production",
           "`wait tasks-stopped` trả về thành công cả khi task fail → phải kiểm tra `exitCode`; task bị kill giữa chừng để lại lock"],
          ["**Frontend S3 + CloudFront** (ERC)",
           "Build ra file có hash → `s3 sync` asset (`Cache-Control: max-age=31536000, immutable`) → upload `index.html` (`no-cache`) → invalidate **chỉ** `/index.html`",
           "Không có khoảng thời gian index mới trỏ tới asset chưa tồn tại (asset trước, index sau); rollback = upload lại index cũ",
           "Vì sao không invalidate `/*`; thứ tự upload; SPA route trả 403/404 → `/index.html`"],
          ["**Tự quản trên VPS**",
           "`ci.yml` (lint, type-check) → `cd.yml` (Buildx + cache, tag SHA → GHCR private) → `deploy.yml` (SSH user `ci`, host key pin, ghi version đang chạy, `compose up --wait` + retry) → Telegram",
           "Rollback: chạy `deploy.yml` với tag cũ; version cũ đã được ghi lại trước khi deploy",
           "Pin host key vs trust-on-first-use; `ci` có thuộc nhóm `docker` không; rollback không xử lý thay đổi schema"]
        ]
      },
      ma: [
        {
          ten: "Patch task definition rồi rollout (bash + jq)",
          noi: [
            'TD=$(aws ecs describe-task-definition --task-definition "$FAMILY" --query taskDefinition)',
            "NEW=$(echo \"$TD\" | jq --arg img \"$IMAGE\" '",
            "  del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)",
            "  | .containerDefinitions[0].image = $img')",
            'ARN=$(aws ecs register-task-definition --cli-input-json "$NEW" --query taskDefinition.taskDefinitionArn --output text)',
            'aws ecs update-service --cluster "$CLUSTER" --service "$SERVICE" --task-definition "$ARN" > /dev/null',
            'aws ecs wait services-stable --cluster "$CLUSTER" --services "$SERVICE"     # mặc định đợi tối đa ~10 phút'
          ]
        },
        {
          ten: "Chạy migration như one-off task và đọc exit code",
          noi: [
            'TASK=$(aws ecs run-task --cluster "$CLUSTER" --launch-type FARGATE --task-definition "$MIGRATE_TD" \\',
            "  --network-configuration \"awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SG],assignPublicIp=DISABLED}\" \\",
            "  --query 'tasks[0].taskArn' --output text)",
            'aws ecs wait tasks-stopped --cluster "$CLUSTER" --tasks "$TASK"',
            "CODE=$(aws ecs describe-tasks --cluster \"$CLUSTER\" --tasks \"$TASK\" --query 'tasks[0].containers[0].exitCode' --output text)",
            '[ "$CODE" = "0" ] || { echo "Migration thất bại (exit $CODE) — xem CloudWatch Logs của task $TASK"; exit 1; }'
          ]
        }
      ],
      bay: [
        "Coi `aws ecs wait tasks-stopped` thành công là migration thành công. Waiter chỉ nói task đã *dừng*; thành công hay không nằm ở `exitCode` của container.",
        "Upload `index.html` trước asset: trong vài giây người dùng nhận index trỏ tới file hash chưa tồn tại → trang trắng."
      ],
      cv: "Đây là phần CV bạn tự tay làm nên sẽ bị hỏi sâu nhất. Tập kể mỗi pipeline trong 90 giây theo khung ‘trigger → gate → artifact → rollback → verify’, kèm một chi tiết chỉ người làm thật mới biết (vd `iam:PassRole`, `exitCode`, thứ tự upload)."
    },

    /* ---------------------------------------------------------- */
    {
      id: "liquibase", ten: "Liquibase — quản lý thay đổi schema",
      y: [
        "**Changelog** là danh sách có thứ tự các **changeSet** (XML / YAML / JSON hoặc *formatted SQL*). Danh tính của changeSet = **`id` + `author` + đường dẫn file** — đổi tên hoặc di chuyển file changelog làm Liquibase tưởng changeSet mới và chạy lại (dùng `logicalFilePath` để cố định).",
        "Cái đã chạy được ghi vào bảng **`DATABASECHANGELOG`** (kèm checksum MD5); bảng **`DATABASECHANGELOGLOCK`** chống hai tiến trình chạy song song.",
        "**Không sửa changeSet đã chạy**: checksum đổi → lỗi validation. Muốn đổi thì thêm changeSet mới. `runOnChange` / `runAlways` chỉ dành cho thứ idempotent (view, stored procedure).",
        "**Rollback**: một số thay đổi tự rollback được (`createTable`, `addColumn`…), còn `sql` thô hay `dropTable` thì phải tự viết khối `rollback`. Dùng `rollback --tag=…` hoặc `rollback-count N`. Rollback dữ liệu không phải lúc nào cũng khả thi → **snapshot trước khi migrate production**.",
        "**`update-sql`** in SQL sẽ chạy mà không chạm DB; **`status`** cho biết còn changeSet nào chờ — dùng làm bước xem trước trong pipeline.",
        "**Transaction**: mỗi changeSet chạy trong một transaction (PostgreSQL có DDL transactional; MySQL thì DDL tự commit). `CREATE INDEX CONCURRENTLY` **không** chạy được trong transaction → `runInTransaction: false`.",
        "**contexts / labels / preconditions** để chạy có điều kiện theo môi trường hoặc kiểm tra trước khi áp dụng (`onFail: MARK_RAN`).",
        "**Chạy như one-off task, không nhúng vào app startup**: migration phải chạy **đúng một lần** — nhúng vào startup thì N task khởi động song song gây race; ngoài ra migration cần quyền DB cao hơn app. Task bị kill giữa chừng để lại `LOCKED = true` → `release-locks` **sau khi chắc chắn** không còn migration nào đang chạy.",
        "**Expand–contract** cho thay đổi phá vỡ tương thích: thêm cột mới → deploy code ghi/đọc cả hai → backfill → deploy code chỉ dùng cột mới → mới bỏ cột cũ. Tách deploy schema khỏi deploy code để rollback code không bị kẹt."
      ],
      ma: {
        ten: "Changelog YAML mẫu (PostgreSQL)",
        noi: [
          "databaseChangeLog:",
          "  - changeSet:",
          "      id: 2026-03-01-add-booking-status",
          "      author: devops",
          "      changes:",
          "        - addColumn:",
          "            tableName: booking",
          "            columns:",
          "              - column: { name: status, type: varchar(20), defaultValue: PENDING }",
          "      rollback:",
          "        - dropColumn: { tableName: booking, columnName: status }",
          "  - changeSet:",
          "      id: 2026-03-02-idx-booking-start",
          "      author: devops",
          "      runInTransaction: false          # CREATE INDEX CONCURRENTLY không chạy trong transaction",
          "      changes:",
          "        - sql: CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_start ON booking (start_at)",
          "      rollback:",
          "        - sql: DROP INDEX CONCURRENTLY IF EXISTS idx_booking_start"
        ]
      },
      lenh: [
        ["liquibase status --verbose", "Changeset nào còn chờ chạy"],
        ["liquibase update-sql", "In SQL sẽ chạy (dry-run); bản cũ gọi `updateSQL`"],
        ["liquibase update", "Áp dụng các changeset chưa chạy"],
        ["liquibase tag before-release-42", "Đánh dấu mốc để `rollback --tag` về sau"],
        ["liquibase rollback-count 1", "Hoàn tác changeset gần nhất (bản cũ: `rollbackCount`)"],
        ["liquibase validate", "Kiểm tra changelog hợp lệ và checksum"],
        ["liquibase history", "Các changeset đã chạy"],
        ["liquibase release-locks", "Nhả lock bị kẹt — chỉ khi chắc không có tiến trình nào đang chạy"]
      ],
      bay: [
        "Nhúng migration vào startup của app: nhiều replica khởi động cùng lúc → race; migration lỗi thì app crash → CrashLoopBackOff trên production.",
        "Nói ‘rollback được’ khi chưa kiểm tra changeSet có khối rollback và dữ liệu có khôi phục được không."
      ],
      cv: "‘Branch-gated Liquibase migration pipeline that runs as a one-off ECS Fargate task per environment’: sẵn sàng giải thích vì sao tách khỏi service (xem E5 trong ngân hàng), gate theo branch ra sao, và migration fail giữa chừng thì làm gì."
    },

    /* ---------------------------------------------------------- */
    {
      id: "gate-moi-truong", ten: "Gate tự động và đồng nhất môi trường",
      y: [
        "**Gate trước khi merge**: lint + type-check, test, và **kiểm tra quy ước commit / tiêu đề PR** (Conventional Commits) bằng công cụ (vd commitlint, action kiểm tra PR title). Biến ‘nhắc trong review’ thành check bắt buộc, không phụ thuộc người nhớ.",
        "**Required status checks + branch protection**: PR chỉ merge khi check xanh — và phải kiểm tra check đó **thật sự được gắn** (xem lỗi `paths` / `workflow_run` ở trên).",
        "**Pin toolchain**: `.nvmrc` (Node), `.tool-versions`, trường `engines`, tag image cụ thể — local, CI, production cùng một phiên bản. `setup-node` đọc được `node-version-file`.",
        "**Đồng nhất môi trường (MinIO → LocalStack)**: MinIO tương thích S3 API nhưng *không phải S3* — khác ở IAM policy, presigned URL, event notification và vài edge case → test xanh ở local nhưng lỗi ở production. LocalStack mô phỏng AWS sát hơn. Nguyên tắc: mỗi điểm khác biệt giữa local – CI – production là một chỗ bug có thể ẩn náu.",
        "**Giới hạn trung thực**: LocalStack cũng không phải AWS thật — vẫn cần một tầng kiểm thử trên môi trường thật (smoke test sau deploy).",
        "**Pre-commit hook** (husky, lefthook) bắt lỗi sớm nhưng **không thay thế CI**: hook bỏ qua được bằng `--no-verify`, CI thì không.",
        "Các gate tuỳ chọn nên biết: quét secret (gitleaks), dependency (npm audit, Dependabot / Renovate), image (Trivy)."
      ],
      bay: "Dựa vào pre-commit hook làm gate duy nhất, hoặc để check ‘có chạy’ nhưng không bắt buộc — cả hai đều cho cảm giác an toàn giả.",
      cv: "Hai dòng CV: ‘enforced commit and pull-request conventions as an automated gate rather than review-time comments’ và ‘replacing MinIO with LocalStack’. Sẵn sàng trả lời: gate cụ thể là gì, dev thấy thông báo lỗi ra sao, và nguyên tắc chung rút ra (xem C3 trong ngân hàng)."
    },

    /* ---------------------------------------------------------- */
    {
      id: "ho-tro-pipeline", ten: "Hỗ trợ dev khi pipeline hoặc deploy fail",
      y: [
        "**Thu thập trước khi đoán**: link pipeline/job, commit, môi trường, lần cuối chạy xanh, và đã đổi gì từ đó.",
        "**Đọc log từ điểm fail đầu tiên**, không phải dòng lỗi cuối — lỗi cuối thường chỉ là hệ quả. Trong log dài, tìm `error` / `exit code` đầu tiên.",
        "**Phân loại**: lỗi code · lỗi cấu hình / biến · lỗi hạ tầng (runner hết disk, hết quota, registry down) · lỗi hết hạn (token, cert) · flaky (chạy lại có khi qua).",
        "**So với lần xanh gần nhất** (diff commit, diff log). ‘Hôm qua xanh hôm nay đỏ dù không ai đổi code’ → tag `latest` đã đổi, package mới phát hành, action/plugin tự nâng version, token/cert hết hạn, rate limit Docker Hub, runner thiếu disk.",
        "**Tái hiện cục bộ** bằng đúng image và lệnh của job; nếu chỉ lỗi trên CI thì nghĩ tới biến môi trường, quyền, mạng, kiến trúc CPU.",
        "**Unblock trước, root cause sau** nếu đang chặn release (rerun, workaround có ghi chú), rồi sửa hẳn.",
        "**Triage theo ba tầng log**: log pipeline cho biết *bước nào* fail, log container cho biết *vì sao*, CloudWatch / kubectl cho biết *môi trường đang thế nào* — đó là lý do bạn tự sinh link CloudWatch Logs cho migration thất bại.",
        "**Giảm số lần bị hỏi**: lỗi lặp lại thì sửa vào pipeline (thông báo lỗi dễ hiểu, retry có chọn lọc) hoặc viết runbook để dev tự xử lý — đó là tư duy scale."
      ],
      lenh: [
        ["gh run view <id> --log-failed", "Log các step fail trong GitHub Actions"],
        ["docker run --rm -it <image-của-job> sh", "Tái hiện môi trường của job ở máy mình"],
        ["git log --oneline <last-green>..HEAD", "Các thay đổi từ lần xanh gần nhất"],
        ["df -h; docker system df", "Runner có hết disk không"]
      ],
      bay: "Bấm ‘Re-run’ liên tục tới khi xanh rồi coi là xong: che mất test flaky và lỗi hạ tầng thật, lần sau lại gặp.",
      cv: "‘First-line support… triaging from pipeline and container logs through to root cause’ và ‘unblocked developers when builds and rollouts failed on the shared multi-environment pipeline’. Chuẩn bị một ca thật: ai báo, bạn làm gì theo thứ tự, nguyên nhân, và bạn đã ghi runbook / sửa pipeline gì sau đó (xem C4 trong ngân hàng)."
    }
  ]
};
