/* ============================================================
   Trang 1 — Containers & Orchestration
   Dòng Skills trong CV: Kubernetes, Helm, kubectl, Docker, Docker Compose
   Cấu trúc dữ liệu: xem chú thích đầu js/kb.js
   ============================================================ */

const TRANG = {
  id: "containers",
  ten: "Containers & Orchestration",
  tomTat: "Docker và Docker Compose cho môi trường tự quản; Kubernetes + Helm cho workload AI chạy 4 môi trường. Hai ý CV của bạn dựa vào nhiều nhất: **chẩn đoán pod bằng kubectl** (OOMKilled, CrashLoopBackOff, probe) và **rollout / rollback bằng Helm**.",
  cvSkill: ["Kubernetes", "Helm", "kubectl", "Docker", "Docker Compose"],

  cv: [
    { nguon: "Kotae · Kubernetes + Helm",
      noi: "Operated the Helm-managed Kubernetes deployment of this LLM-backed service across four isolated environments (development, test, demo, production), performing release rollouts and rollbacks through Helm against per-environment values, autoscaling, and ingress configuration." },
    { nguon: "Kotae · Sự cố pod",
      noi: "Kept memory-heavy, bursty AI workloads stable under live traffic: diagnosed pod-level incidents with kubectl — OOMKilled containers, CrashLoopBackOff, failing probes — and tuned resource requests, limits, and probe thresholds." },
    { nguon: "Self-managed deployment · Docker",
      noi: "Containerized the service with a multi-stage Dockerfile — non-root runtime user, container health check — served behind Nginx as a TLS-terminating reverse proxy and pinned to an explicit image version rather than auto-updated." },
    { nguon: "Self-managed deployment · Compose",
      noi: "…recording the outgoing version for rollback and rolling the new one out with `compose up --wait` behind a retried health check." },
    { nguon: "Professional Summary",
      noi: "Operates the Kubernetes/Helm deployment of a production LLM-backed AI service across four environments and resolves pod-level incidents directly with kubectl." }
  ],

  bank: ["Docker", "Kubernetes", "Kotae"],

  muc: [
    /* ---------------------------------------------------------- */
    {
      id: "docker-image", ten: "Docker — image và Dockerfile",
      y: [
        "**Container là một process bị cô lập**, không phải VM: cô lập bằng *namespace* (pid, net, mnt, uts, ipc, user), giới hạn bằng *cgroup* (CPU, memory, số process). Dùng chung kernel của host — nên không chạy được kernel khác, và lỗ hổng kernel ảnh hưởng mọi container.",
        "**Image là các layer chỉ-đọc xếp chồng** + metadata; container thêm một writable layer mỏng phía trên. Mỗi `RUN` / `COPY` / `ADD` tạo một layer và chỉ được cache khi lệnh cùng đầu vào không đổi → **đặt thứ ít đổi lên trước** (cài dependency trước, `COPY` source sau).",
        "**Multi-stage build**: stage `build` chứa compiler/devDependencies, stage cuối chỉ `COPY --from=build` artifact vào image runtime nhỏ → image nhỏ hơn, ít attack surface (không còn compiler, thường không còn shell), và secret/công cụ của stage build không lọt vào image cuối.",
        "**PID 1 và tín hiệu**: dạng *exec* `CMD [\"node\",\"server.js\"]` để app nhận thẳng SIGTERM; dạng *shell* `CMD node server.js` bị bọc trong `/bin/sh -c` nên SIGTERM không tới app. `docker stop` gửi SIGTERM, đợi 10 giây rồi SIGKILL — app không xử lý SIGTERM thì bị giết cứng, request dở dang mất.",
        "**ENTRYPOINT** là lệnh cố định, **CMD** là tham số mặc định có thể bị ghi đè khi `docker run`. Hay dùng cặp: ENTRYPOINT là chương trình, CMD là tham số mặc định.",
        "**Non-root**: tạo user riêng và `USER app` ở stage cuối, `COPY --chown=app:app` để file đúng quyền. Cổng < 1024 cần capability — dùng cổng cao (8080) và để proxy phía trước lo 80/443.",
        "**HEALTHCHECK** trong Dockerfile chỉ có ý nghĩa với Docker/Compose (trạng thái `healthy`, `depends_on: service_healthy`, `up --wait`). **Kubernetes bỏ qua nó** — ở K8s phải khai báo probe trong manifest.",
        "**Tag đổi được, digest thì không**: `nginx:1.27` hôm nay và tháng sau có thể là hai image khác nhau. Pin theo tag phiên bản cụ thể (như CV) hoặc `@sha256:`; tránh `latest`. Cách phòng 'chạy được ở máy mình, lên server thì fail': **build một lần trong CI rồi promote đúng digest đó** qua các môi trường."
      ],
      ma: {
        ten: "Dockerfile mẫu — multi-stage, non-root, health check",
        noi: [
          "# syntax=docker/dockerfile:1",
          "FROM node:22-alpine AS build            # production: pin version cụ thể hoặc digest",
          "WORKDIR /app",
          "COPY package*.json ./",
          "RUN npm ci                              # lớp dependency chỉ build lại khi package*.json đổi",
          "COPY . .",
          "RUN npm run build",
          "",
          "FROM node:22-alpine AS runtime",
          "ENV NODE_ENV=production",
          "WORKDIR /app",
          "RUN addgroup -S app && adduser -S app -G app",
          "COPY --from=build --chown=app:app /app/dist ./dist",
          "COPY --from=build /app/package*.json ./",
          "RUN npm ci --omit=dev && npm cache clean --force",
          "USER app",
          "EXPOSE 8080",
          "HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 CMD wget -qO- http://127.0.0.1:8080/health || exit 1",
          'CMD ["node", "dist/server.js"]          # dạng exec: app nhận SIGTERM'
        ]
      },
      lenh: [
        ["docker build -t app:1.4.2 .", "Build; luôn đặt tag phiên bản, tránh `latest`"],
        ["docker buildx build --platform linux/amd64 -t app:1.4.2 --push .", "Build đúng kiến trúc server khi dev trên Apple Silicon (arm64)"],
        ["docker history app:1.4.2", "Xem từng layer — tìm layer phình to hoặc lỡ chứa secret"],
        ["docker image inspect app:1.4.2 --format '{{.Config.User}} {{.Config.Entrypoint}}'", "Kiểm tra user chạy và entrypoint thực tế"]
      ],
      bay: [
        "Để secret trong `ENV` / `ARG` / `COPY .env` — nó nằm **vĩnh viễn trong layer**, `docker history` đọc được dù sau đó có xoá. Dùng BuildKit `--mount=type=secret` hoặc truyền lúc chạy.",
        "`.dockerignore` thiếu → `COPY . .` đưa cả `.git`, `node_modules`, `.env` vào build context: build chậm, cache vỡ liên tục, lộ file."
      ],
      cv: "Bạn đã làm đủ bộ: multi-stage, user non-root, health check, pin version, đứng sau Nginx. Chuẩn bị nói **vì sao** từng thứ (ít attack surface, không chạy root, biết khi nào app chết, rollback có đích đến) — câu hỏi kế tiếp sẽ là ‘nếu không pin version thì sao?’."
    },

    /* ---------------------------------------------------------- */
    {
      id: "docker-runtime", ten: "Docker — chạy container: mạng, dữ liệu, tài nguyên, bảo mật",
      y: [
        "**Mạng**: network `bridge` mặc định không có DNS theo tên; **user-defined bridge** (Compose tạo sẵn) có DNS nội bộ nên container gọi nhau bằng tên service. `host` bỏ cô lập mạng; `none` không có mạng.",
        "`-p host:container` được thực hiện bằng DNAT qua iptables và mặc định bind `0.0.0.0`. Docker chèn rule **trước** rule của `ufw`/firewalld → cổng đã publish vẫn mở dù firewall tưởng là chặn.",
        "**Dữ liệu**: ghi vào writable layer sẽ mất khi container bị tạo lại. Dữ liệu cần bền → volume; container nên **stateless**, state đẩy ra volume hoặc dịch vụ ngoài.",
        "**Tài nguyên**: `--memory`, `--cpus`. Vượt memory → kernel OOM kill (exit code **137**, `OOMKilled: true`). Production luôn đặt giới hạn.",
        "**Log**: driver mặc định `json-file` **không tự xoay vòng** — log không giới hạn có thể làm đầy đĩa host. Đặt `max-size` / `max-file` hoặc đổi driver; đây là họ lỗi ‘ổ đầy mà không biết file nào’.",
        "**Bảo mật tối thiểu**: chạy non-root, `--read-only` + tmpfs cho `/tmp`, `--cap-drop=ALL` rồi add lại đúng cái cần, `--security-opt no-new-privileges`, không `--privileged`, **không mount `/var/run/docker.sock`** vào container (= quyền root trên host), scan image bằng Trivy/Grype trong CI.",
        "**Dọn dẹp**: image cũ và build cache phình theo thời gian — `docker system df` để xem, dọn có chọn lọc."
      ],
      bang: {
        ten: "Nơi lưu dữ liệu của container",
        cot: ["Loại", "Dữ liệu nằm ở đâu", "Dùng khi", "Lưu ý"],
        hang: [
          ["Named volume", "Docker quản lý trong `/var/lib/docker/volumes`", "Database, dữ liệu cần bền", "Sống sau `docker rm`; mất khi `volume rm` hoặc `compose down -v`"],
          ["Bind mount", "Thư mục của host map vào container", "Dev, đọc file cấu hình từ host", "Phụ thuộc đường dẫn host, dễ sai quyền (UID/GID)"],
          ["tmpfs", "RAM", "Dữ liệu tạm hoặc nhạy cảm", "Mất khi container dừng"],
          ["Writable layer", "Lớp ghi của chính container", "Không nên dùng cho dữ liệu thật", "Mất khi container bị tạo lại"]
        ]
      },
      lenh: [
        ["docker run -d --name app -p 127.0.0.1:8080:8080 --memory 512m app:1.4.2", "Chỉ publish ra localhost khi đứng sau Nginx"],
        ["docker logs -f --tail 200 --since 10m app", "Xem log, thu hẹp theo thời gian"],
        ["docker exec -it app sh", "Vào container đang chạy (image distroless sẽ không có shell)"],
        ["docker inspect --format '{{.State.ExitCode}} {{.State.OOMKilled}}' app", "Exit code và có bị OOM kill không"],
        ["docker stats --no-stream", "CPU / RAM từng container"],
        ["docker system df", "Image, volume, build cache chiếm bao nhiêu đĩa"],
        ["--log-opt max-size=10m --log-opt max-file=3", "Giới hạn log json-file (hoặc đặt trong `daemon.json` / Compose `logging:`)"]
      ],
      bay: [
        "Publish `-p 8080:8080` rồi tin rằng `ufw` đã chặn. Container đứng sau Nginx thì bind `127.0.0.1:8080:8080` để chỉ Nginx trên host gọi được.",
        "`docker system prune -a --volumes` trên máy production = xoá luôn volume không gắn container nào, tức là dữ liệu. Đọc danh sách sẽ bị xoá trước khi xác nhận."
      ],
      cv: "Dịch vụ tự quản của bạn chạy container sau Nginx TLS-terminating. Nối được các mảnh: Nginx nói chuyện với container qua đâu (localhost + cổng bind), container chạy bằng user nào, dữ liệu nằm ở volume nào, log đi đâu."
    },

    /* ---------------------------------------------------------- */
    {
      id: "compose", ten: "Docker Compose",
      y: [
        "**Compose** mô tả cả stack (service, network, volume) trong một file `compose.yaml` và chạy bằng `docker compose` — hợp **một host**: dev, CI, và production nhỏ tự quản như dịch vụ của bạn. Nó không có lập lịch đa node hay tự phục hồi khi mất node như Kubernetes.",
        "**`depends_on` mặc định chỉ đợi container *khởi động*, không đợi app *sẵn sàng*.** Muốn đợi thật: khai `healthcheck` rồi `depends_on: { db: { condition: service_healthy } }`.",
        "**`up -d --wait`** chờ service tới trạng thái running/healthy rồi mới trả về, exit code ≠ 0 nếu service lỗi hoặc quá `--wait-timeout` → pipeline biết deploy thất bại. Đây là cơ chế ‘rollout + health check’ trong CV.",
        "**`restart: unless-stopped`** để container tự dậy sau khi host hoặc Docker daemon khởi động lại; `on-failure` chỉ restart khi exit ≠ 0; `always` thì kể cả khi bạn đã `stop` tay rồi daemon khởi động lại.",
        "**Image tag lấy từ biến**: `image: ghcr.io/org/app:${IMAGE_TAG}`; deploy = đổi `IMAGE_TAG` rồi `up -d`; rollback = chạy lại với tag cũ → phải **ghi lại tag đang chạy trước khi deploy** (đúng quy trình trong CV).",
        "**Pin version thay vì auto-update** (kiểu Watchtower): biết chính xác phiên bản nào đang chạy, deploy có kiểm soát, rollback có đích đến. Auto-update kéo bản mới về lúc nào không hay và có thể kéo theo breaking change.",
        "**Secret**: không commit `.env`; dùng `env_file` nằm ngoài repo hoặc `secrets:`. `docker compose config` in file đã gộp biến — **đừng dán output vào chat hay ticket** vì nó phơi cả giá trị secret.",
        "**Mạng**: Compose tạo một network riêng cho project, service gọi nhau bằng **tên service**; chỉ khai `ports:` mới mở ra host."
      ],
      ma: {
        ten: "compose.yaml tối thiểu cho một service sau Nginx",
        noi: [
          "services:",
          "  app:",
          "    image: ghcr.io/example/app:${IMAGE_TAG:?cần đặt IMAGE_TAG}",
          "    restart: unless-stopped",
          "    ports:",
          '      - "127.0.0.1:8080:8080"        # chỉ Nginx trên host gọi được',
          "    env_file: /etc/app/app.env       # nằm ngoài repo",
          "    healthcheck:",
          '      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:8080/health"]',
          "      interval: 10s",
          "      timeout: 3s",
          "      retries: 5",
          "      start_period: 15s"
        ]
      },
      lenh: [
        ["docker compose up -d --wait", "Deploy và chờ healthy; exit ≠ 0 nếu service không lên"],
        ["docker compose ps", "Trạng thái và health từng service"],
        ["docker compose logs -f --tail 100 app", "Log một service"],
        ["docker compose config", "Xem file sau khi gộp biến — kiểm tra cú pháp (có thể lộ secret)"],
        ["docker compose pull", "Kéo image theo tag đang khai trong file"],
        ["docker compose down", "Xoá container + network. Thêm `-v` là xoá cả volume = mất dữ liệu"],
        ["docker compose exec app sh", "Vào service đang chạy"]
      ],
      bay: "`docker-compose` (v1, đã ngừng) khác `docker compose` (v2, plugin). Cờ `--wait` chỉ có ở v2 — script cũ còn gọi `docker-compose` sẽ thiếu tính năng hoặc báo lỗi cờ.",
      cv: "‘`compose up --wait` behind a retried health check’: sẵn sàng nói retry bao nhiêu lần, cách nhau bao lâu, và **hết retry thì làm gì** (rollback về tag đã ghi, báo kết quả lên Telegram)."
    },

    /* ---------------------------------------------------------- */
    {
      id: "k8s-core", ten: "Kubernetes — kiến trúc và đối tượng cốt lõi",
      y: [
        "**Control plane**: `kube-apiserver` (cổng duy nhất vào cluster), `etcd` (lưu trạng thái), `kube-scheduler` (chọn node cho pod), `kube-controller-manager` (các vòng lặp đưa trạng thái thực về trạng thái mong muốn). **Mỗi node**: `kubelet` (chạy pod), `kube-proxy` (rule cho Service), container runtime (containerd).",
        "**Declarative + reconcile**: bạn khai trạng thái mong muốn (YAML), controller liên tục so với thực tế rồi sửa. Pod chết thì ReplicaSet tạo cái mới — không ai ‘restart’ tay.",
        "**Deployment → ReplicaSet → Pod.** Đổi pod template thì Deployment tạo ReplicaSet mới và chuyển dần pod sang; ReplicaSet cũ được giữ lại (theo `revisionHistoryLimit`) để `kubectl rollout undo`.",
        "**Service** cho nhóm pod một địa chỉ ổn định: `ClusterIP` (nội bộ), `NodePort`, `LoadBalancer` (LB của cloud). Service chọn pod bằng **label selector** và chỉ gửi traffic tới pod **Ready**. Service không có endpoint = selector sai hoặc không có pod nào Ready.",
        "**ConfigMap / Secret**: Secret chỉ là **base64, không phải mã hoá** — ai đọc được Secret là đọc được giá trị; cần RBAC chặt và (tuỳ mức) mã hoá etcd / external secret store. Gắn bằng biến môi trường thì **không tự cập nhật** khi đổi; gắn bằng volume thì cập nhật sau một lúc.",
        "**Namespace** chia môi trường/nhóm; **RBAC** (Role, RoleBinding, ServiceAccount) quyết định ai làm được gì. Bốn môi trường có thể là bốn namespace hoặc bốn cluster — nêu rõ bạn dùng cách nào và đánh đổi (cluster riêng cách ly hơn nhưng tốn hơn).",
        "**StatefulSet** cho workload cần danh tính và volume ổn định (database); **Job / CronJob** cho việc chạy một lần hoặc định kỳ (migration, batch); **DaemonSet** mỗi node một pod (agent log, metric)."
      ],
      lenh: [
        ["kubectl get deploy,rs,pod,svc,ing -n <ns>", "Nhìn toàn cảnh một namespace"],
        ["kubectl get pod -n <ns> -o wide", "Thêm cột node và IP của pod"],
        ["kubectl explain deployment.spec.strategy", "Tra schema ngay trong terminal"],
        ["kubectl config current-context", "Đang trỏ cluster nào — kiểm tra trước mọi lệnh ghi"],
        ["kubectl auth can-i delete pods -n <ns>", "Kiểm tra quyền RBAC của mình"]
      ],
      bay: "Cầm nhầm context (kubectl đang trỏ production) rồi chạy `delete` / `apply`. Luôn xem `current-context`, tách kubeconfig theo môi trường, hoặc cho prompt hiển thị context.",
      cv: "Bạn vận hành 4 môi trường (development, test, demo, production). Sẵn sàng trả lời: cách ly bằng namespace hay cluster, ai có quyền vào production, và deploy production khác gì 3 môi trường còn lại."
    },

    /* ---------------------------------------------------------- */
    {
      id: "k8s-resources", ten: "Tài nguyên, QoS và autoscaling",
      y: [
        "**`requests`** là lượng scheduler *dành sẵn* khi chọn node và là mức tối thiểu được đảm bảo; **`limits`** là trần cứng. Tổng `requests` của các pod trên node không được vượt phần allocatable của node.",
        "**CPU nén được, memory thì không**: vượt CPU limit → bị **throttle** (chậm, không chết); vượt memory limit → kernel **OOMKill** (exit code **137**, `Reason: OOMKilled`). Workload memory-heavy nên đặt memory request ≈ limit.",
        "**QoS class** suy ra từ requests/limits: **Guaranteed** (mọi container có request = limit cho cả CPU và memory), **Burstable** (có request nhưng không đủ điều kiện trên), **BestEffort** (không đặt gì). Node thiếu tài nguyên thì BestEffort bị evict trước, Guaranteed sau cùng.",
        "**Đặt giá trị bằng số đo, không bằng cảm tính**: lấy p95/p99 memory thực tế (Grafana, `kubectl top`) rồi cộng dư. Workload AI **bursty** (spike theo kích thước input) thì limit theo **đỉnh**, không theo trung bình — đặt theo trung bình là công thức của OOMKilled.",
        "CPU limit gây throttle kể cả khi node còn rảnh; một số team chỉ đặt CPU request và bỏ CPU limit. Nêu được cả hai phía là đủ.",
        "**HPA** (`autoscaling/v2`) scale số replica theo metric. CPU/memory tính theo **% so với `requests`** → *không đặt requests thì HPA không tính được*. Cần `metrics-server`. Công thức: `desired = ceil(current × currentMetric / target)`.",
        "Workload LLM chủ yếu **chờ I/O** (gọi API Bedrock / OpenAI / Gemini): CPU thấp nhưng nhiều request đồng thời → HPA theo CPU không scale kịp. Dùng custom/external metric (số request đang xử lý, độ dài queue) — **KEDA** là cách phổ biến. Pod khởi động chậm nên phải scale sớm.",
        "Chống ‘flapping’: `behavior.scaleDown.stabilizationWindowSeconds`; production `minReplicas ≥ 2` kèm PodDisruptionBudget. **LimitRange / ResourceQuota** đặt mặc định và trần theo namespace để một môi trường không ngốn hết cluster."
      ],
      bang: {
        ten: "Vượt giới hạn thì chuyện gì xảy ra",
        cot: ["Tài nguyên", "Vượt request", "Vượt limit", "Dấu hiệu nhận ra"],
        hang: [
          ["CPU", "Vẫn chạy nếu node còn dư", "Bị throttle — chậm, latency tăng, **không restart**", "Metric throttling cao, pod không chết"],
          ["Memory", "Vẫn chạy, nhưng là ứng viên bị evict khi node thiếu RAM", "**OOMKilled ngay**, container restart", "`Last State: Terminated · Reason: OOMKilled · Exit Code: 137`, log app không có lỗi"]
        ]
      },
      ma: {
        ten: "Resources + HPA (autoscaling/v2)",
        noi: [
          "resources:",
          "  requests: { cpu: 250m, memory: 1Gi }",
          "  limits:   { memory: 1Gi }              # memory request = limit",
          "---",
          "apiVersion: autoscaling/v2",
          "kind: HorizontalPodAutoscaler",
          "metadata: { name: api }",
          "spec:",
          "  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: api }",
          "  minReplicas: 2",
          "  maxReplicas: 10",
          "  metrics:",
          "    - type: Resource",
          "      resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } }",
          "  behavior:",
          "    scaleDown: { stabilizationWindowSeconds: 300 }"
        ]
      },
      lenh: [
        ["kubectl top pod -n <ns> --containers", "CPU / memory hiện tại từng container (cần metrics-server)"],
        ["kubectl describe node <node>", "Allocatable vs đã request, pod nào ngốn, MemoryPressure / DiskPressure"],
        ["kubectl get hpa -w", "HPA đang thấy metric bao nhiêu và scale ra sao"],
        ["kubectl get pod <pod> -o jsonpath='{.status.qosClass}'", "Xem QoS class"],
        ["kubectl describe pod <pod> | grep -A6 'Last State'", "Lý do lần chết trước và exit code"]
      ],
      bay: "Đặt `limits.memory` thấp hơn mức đỉnh thật rồi ‘tăng replica cho đỡ’: OOMKilled lặp lại ở mỗi spike, thêm replica chỉ thêm tiền. Cũng đừng **nâng limit mà không tìm xem vì sao memory tăng** (leak? input lớn?).",
      cv: "CV ghi ‘tuned resource requests, limits, and probe thresholds’. Phải kể được **một ca có con số**: trước đó đặt bao nhiêu, đo được p99 bao nhiêu, đổi thành bao nhiêu, kết quả ra sao."
    },

    /* ---------------------------------------------------------- */
    {
      id: "k8s-probes", ten: "Probe, vòng đời pod và rolling update",
      y: [
        "Loại probe: `httpGet`, `tcpSocket`, `exec`, `grpc`. Tham số: `initialDelaySeconds`, `periodSeconds`, `timeoutSeconds`, `failureThreshold`, `successThreshold`. Thời gian chịu lỗi xấp xỉ `periodSeconds × failureThreshold`.",
        "**Liveness quá gắt = tự giết app đang chậm vì tải** → CrashLoopBackOff, và tạo vòng xoáy (pod restart → tải dồn sang pod còn lại → pod kia cũng fail). Đặt `failureThreshold` rộng, `timeoutSeconds` đủ, và dùng `startupProbe` thay cho `initialDelaySeconds` lớn.",
        "**Readiness phải phản ánh khả năng phục vụ request thật** (đã nối được DB, đã load xong model…). Readiness sai = pod mới nhận traffic khi chưa sẵn sàng → rớt request lúc rollout. Đây là nguyên nhân số một của ‘deploy zero-downtime nhưng vẫn lỗi’.",
        "**Thứ tự khi tắt pod**: pod → `Terminating` → (song song) gỡ khỏi endpoint **và** chạy `preStop` → gửi **SIGTERM** → chờ tối đa `terminationGracePeriodSeconds` (mặc định 30s) → **SIGKILL**. Gỡ endpoint và SIGTERM là bất đồng bộ nên cần `preStop: sleep` vài giây để LB kịp ngừng gửi traffic; app phải xử lý SIGTERM để drain connection.",
        "**Rolling update**: `maxSurge` (được thêm bao nhiêu pod vượt số replica) và `maxUnavailable` (cho phép thiếu bao nhiêu), mặc định 25% / 25%. Zero-downtime = `maxUnavailable: 0` + readiness chuẩn + xử lý SIGTERM. `progressDeadlineSeconds` (mặc định 600s) quyết định khi nào rollout bị coi là kẹt.",
        "**PodDisruptionBudget** (`minAvailable` / `maxUnavailable`) giữ tối thiểu số pod khi **bảo trì chủ động** (drain node, nâng cấp) — không bảo vệ khỏi sự cố bất ngờ."
      ],
      bang: {
        ten: "Ba loại probe",
        cot: ["Probe", "Câu hỏi nó trả lời", "Fail thì", "Dùng cho / lỗi hay gặp"],
        hang: [
          ["Liveness", "Container còn sống không?", "kubelet **restart container**", "Phát hiện treo/deadlock. **Không** kiểm tra dependency ngoài"],
          ["Readiness", "Sẵn sàng nhận traffic chưa?", "Pod bị **gỡ khỏi endpoint** của Service, *không* restart", "Warm-up, phụ thuộc tạm thời, đang tắt"],
          ["Startup", "Đã khởi động xong chưa?", "Quá ngưỡng thì restart; trong lúc đó liveness/readiness bị hoãn", "App khởi động chậm (nạp model, warm cache)"]
        ]
      },
      ma: {
        ten: "Bộ probe + tắt êm cho app khởi động chậm",
        noi: [
          "startupProbe:",
          "  httpGet: { path: /health, port: 8080 }",
          "  periodSeconds: 5",
          "  failureThreshold: 30              # tối đa ~150s để khởi động",
          "readinessProbe:",
          "  httpGet: { path: /ready, port: 8080 }",
          "  periodSeconds: 5",
          "  failureThreshold: 3",
          "livenessProbe:",
          "  httpGet: { path: /health, port: 8080 }   # chỉ kiểm tra bản thân process",
          "  periodSeconds: 10",
          "  timeoutSeconds: 3",
          "  failureThreshold: 6",
          "lifecycle:",
          "  preStop:",
          '    exec: { command: ["sleep", "10"] }',
          "# cấp pod spec: terminationGracePeriodSeconds: 45"
        ]
      },
      bay: [
        "Dùng liveness để kiểm tra database / API ngoài: dependency chập chờn → **toàn bộ pod restart cùng lúc**, biến sự cố nhỏ thành sập hẳn.",
        "`initialDelaySeconds` cố định quá ngắn cho app khởi động chậm → bị giết trước khi kịp lên → CrashLoopBackOff vĩnh viễn."
      ],
      cv: "‘failing probes’ và ‘probe thresholds’ đều nằm trong CV. Chuẩn bị: probe nào bạn đã sửa, **vì sao ngưỡng cũ sai** (quá gắt hay quá lỏng) và bạn kiểm chứng ngưỡng mới bằng cách nào."
    },

    /* ---------------------------------------------------------- */
    {
      id: "k8s-debug", ten: "Chẩn đoán pod bằng kubectl",
      y: [
        "**Quy trình cố định**: (1) `get pod` xem trạng thái + số lần restart → (2) `describe pod` đọc **Events** và **Last State** → (3) `logs` (kèm `--previous` nếu đã restart) → (4) đối chiếu với thay đổi gần nhất (`rollout history`, `helm history`) → (5) cuối cùng mới tới `exec` / `debug`.",
        "**Exit code** nói được nhiều: **137** = SIGKILL (thường là OOMKilled), **143** = SIGTERM, **1** = app tự lỗi, **139** = segfault, **126 / 127** = lệnh không thực thi được / không tìm thấy.",
        "`logs --previous` là log của container **lần chết trước** — nguồn quan trọng nhất cho CrashLoopBackOff và hay bị bỏ qua nhất.",
        "Pod chết vì OOM thường **không có dòng log lỗi nào**, vì process bị SIGKILL — bằng chứng nằm ở `describe` và đồ thị memory chứ không nằm trong log app.",
        "Image distroless / không có shell: dùng `kubectl debug -it <pod> --image=busybox --target=<container>` (ephemeral container) thay cho `exec`."
      ],
      bang: {
        ten: "Triệu chứng → nguyên nhân thường gặp",
        cot: ["Trạng thái", "Thường là", "Kiểm tra bằng"],
        hang: [
          ["`Pending`", "Không node nào đủ `requests`; chưa bind được PVC; taint / affinity không khớp", "`describe pod` → Events: `FailedScheduling`"],
          ["`ImagePullBackOff`", "Sai tên/tag, registry riêng thiếu `imagePullSecret`, hết rate limit", "`describe pod` → Events"],
          ["`CrashLoopBackOff`", "App crash lúc khởi động, thiếu config/secret, liveness quá gắt, **OOMKilled**", "`logs --previous`; `Last State` + exit code"],
          ["`OOMKilled` (exit 137)", "Vượt memory limit", "`describe pod`; đồ thị memory trước lúc chết"],
          ["`Running` nhưng `0/1 READY`", "Readiness probe fail → pod không nhận traffic", "`describe pod` → ‘Readiness probe failed’"],
          ["`CreateContainerConfigError`", "ConfigMap / Secret được tham chiếu không tồn tại", "`describe pod`"],
          ["`Evicted`", "Node thiếu tài nguyên (memory / disk pressure)", "`describe pod`, `describe node`"],
          ["Service gọi không tới", "Selector không khớp label, hoặc không pod nào Ready → **không có endpoint**", "`get endpoints <svc>`"]
        ]
      },
      lenh: [
        ["kubectl get pod -n <ns> -o wide", "Trạng thái, số restart, node"],
        ["kubectl describe pod <pod> -n <ns>", "Events + Last State + exit code + kết quả probe"],
        ["kubectl logs <pod> -c <container> --previous", "Log của lần chết trước"],
        ["kubectl logs -l app=api --since=15m --all-containers --prefix", "Log nhiều pod theo label, có tiền tố tên pod"],
        ["kubectl get events -n <ns> --sort-by=.lastTimestamp", "Sự kiện mới nhất nằm cuối danh sách"],
        ["kubectl rollout status deploy/api --timeout=5m", "Chờ rollout xong; exit ≠ 0 nếu kẹt — dùng trong CI"],
        ["kubectl rollout history deploy/api", "Các revision của Deployment"],
        ["kubectl rollout undo deploy/api", "Quay về revision trước (release do Helm quản lý thì dùng `helm rollback`)"],
        ["kubectl exec -it <pod> -- sh", "Vào trong pod"],
        ["kubectl port-forward svc/api 8080:80", "Gọi thử service từ máy mình"],
        ["kubectl get endpoints <svc>", "Rỗng = selector sai hoặc không pod nào Ready"],
        ["kubectl debug -it <pod> --image=busybox --target=<c>", "Ephemeral container cho image không có shell"]
      ],
      bay: "Chỉ chạy `kubectl logs` (log của container *hiện tại*, vừa restart nên gần như rỗng) rồi kết luận ‘không có lỗi’. Phải xem thêm `--previous` và `describe`.",
      cv: "‘Resolves pod-level incidents directly with kubectl’ là câu CV mạnh nhất của bạn ở mảng này. Chuẩn bị **một ca kể liền mạch**: hiện tượng → các lệnh đã chạy theo thứ tự → nguyên nhân → sửa → phòng ngừa (xem câu KT1 trong ngân hàng)."
    },

    /* ---------------------------------------------------------- */
    {
      id: "helm", ten: "Helm và triển khai nhiều môi trường",
      y: [
        "**Chart** = package gồm `Chart.yaml` (metadata, `version` của chart, `appVersion` của app), `values.yaml` (giá trị mặc định), `templates/` (manifest dạng Go template), `_helpers.tpl`. **Release** = một lần cài chart vào cluster; mỗi lần upgrade hoặc rollback sinh một **revision** mới.",
        "Helm 3 không còn Tiller; trạng thái release lưu thành **Secret** (`helm.sh/release.v1`) trong namespace của release — mất Secret đó là Helm ‘quên’ release.",
        "**Một chart, nhiều môi trường**: `values.yaml` chung + `values-<env>.yaml` riêng. Thứ tự ưu tiên: `-f` đứng sau ghi đè `-f` đứng trước, `--set` ghi đè tất cả. Giá trị nhạy cảm không đặt trong values file nằm trong Git — lấy từ Secret / secret manager.",
        "**`helm upgrade --install --atomic --timeout 10m`**: tạo nếu chưa có, chờ tài nguyên Ready, **tự rollback nếu upgrade thất bại**. `--atomic` đã bao gồm `--wait`.",
        "**`helm rollback` quay lại *manifest*, không quay lại *dữ liệu***: migration database đã chạy thì vẫn nằm đó; code phiên bản cũ gặp schema mới có thể lỗi. Cần migration tương thích ngược (expand–contract) và tách deploy schema khỏi deploy code.",
        "Rollback không xoá lịch sử: nó **tạo revision mới** mang nội dung của revision cũ (`helm history` thấy rõ).",
        "**Đổi ConfigMap / Secret không tự restart pod.** Mẹo chuẩn: gắn annotation `checksum/config` = sha256 của template ConfigMap vào pod template → nội dung đổi thì hash đổi → Deployment rollout.",
        "**Trước khi upgrade**: `helm lint`, `helm template` (render YAML để đọc), `helm diff upgrade` (plugin) để thấy **chính xác cái gì sắp đổi**. Pin version của chart và tag/digest của image.",
        "**Hooks** (`helm.sh/hook: pre-upgrade`) chạy Job migration trước khi rollout, nhớ `hook-delete-policy`. Giới hạn: Helm không nâng cấp CRD trong thư mục `crds/` và không sửa được trường immutable (vd `selector` của Deployment) — phải xoá rồi tạo lại.",
        "Promote **development → test → demo → production** theo thứ tự, cùng một chart version và image tag; không deploy thẳng production, và production nên có bước duyệt."
      ],
      ma: {
        ten: "Gắn checksum ConfigMap vào pod template (templates/deployment.yaml)",
        noi: [
          "spec:",
          "  template:",
          "    metadata:",
          "      annotations:",
          '        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}'
        ]
      },
      lenh: [
        ["helm upgrade --install api ./chart -n prod -f values.yaml -f values-prod.yaml --atomic --timeout 10m", "Deploy chuẩn: ghi đè theo thứ tự, tự rollback khi lỗi"],
        ["helm diff upgrade api ./chart -n prod -f values.yaml -f values-prod.yaml", "Xem thay đổi sắp áp dụng (cần plugin helm-diff)"],
        ["helm template api ./chart -f values-prod.yaml", "Render manifest ra stdout, không chạm cluster"],
        ["helm lint ./chart", "Kiểm tra lỗi cú pháp / cấu trúc chart"],
        ["helm history api -n prod", "Danh sách revision và trạng thái"],
        ["helm rollback api 12 -n prod --wait", "Quay về nội dung revision 12 (sinh revision mới)"],
        ["helm get values api -n prod", "Values đang áp dụng (thêm `--all` để thấy cả mặc định)"],
        ["helm get manifest api -n prod", "Manifest đã render đang chạy trong cluster"]
      ],
      bay: [
        "`--reuse-values` giữ values của lần trước nên values mặc định **mới** của chart không được áp dụng → cấu hình lệch giữa các môi trường mà không ai thấy. Ưu tiên truyền đủ `-f` ở mỗi lần.",
        "Tin rằng `helm rollback` cứu được release có migration phá vỡ tương thích — nó không cứu được dữ liệu (xem câu KT3 trong ngân hàng)."
      ],
      cv: "Bạn rollout / rollback 4 môi trường bằng Helm với values riêng. Sẵn sàng: chart có cấu trúc thế nào, values giữa development và production khác nhau ở đâu, và lần rollback gần nhất xảy ra vì lý do gì."
    },

    /* ---------------------------------------------------------- */
    {
      id: "ingress", ten: "Ingress và đưa dịch vụ ra ngoài",
      y: [
        "**Ingress** là rule L7 (host / path → Service); cần một **Ingress controller** thật sự nhận traffic (nginx, AWS Load Balancer Controller, Traefik…). Tạo object Ingress mà không có controller thì không có chuyện gì xảy ra.",
        "Chọn controller theo hạ tầng: trên AWS có thể dùng **AWS Load Balancer Controller** (ALB cho Ingress, NLB cho Service) hoặc ingress-nginx đứng sau một NLB. **Gateway API** là API kế nhiệm Ingress; ingress-nginx đã được thông báo ngừng bảo trì — kiểm tra hiện trạng trước khi chọn cho hệ mới.",
        "**TLS**: Secret kiểu `kubernetes.io/tls` + khai `tls:` trong Ingress; cấp và gia hạn tự động bằng **cert-manager** (Let’s Encrypt), hoặc dùng chứng chỉ ACM gắn trên ALB.",
        "Dịch vụ LLM trả lời lâu hoặc streaming (SSE): coi chừng **timeout và buffering** của proxy/LB (ALB idle timeout mặc định 60s; `proxy-read-timeout` của ingress-nginx; tắt buffering khi streaming). Lỗi 504 hay ‘đứt giữa chừng’ thường nằm ở đây chứ không ở app.",
        "`pathType: Prefix` vs `Exact`, thứ tự rule, `ingressClassName`. Rate-limit, body-size, CORS thường cấu hình qua annotation **riêng của từng controller** (không portable).",
        "Điều tra theo chiều đi của request: **client → DNS → LB → Ingress controller → Service → Pod**; xác định request dừng ở đâu rồi mới đoán nguyên nhân."
      ],
      lenh: [
        ["kubectl get ingress -A", "Danh sách Ingress và địa chỉ LB"],
        ["kubectl describe ingress <name> -n <ns>", "Rule, backend, Events"],
        ["kubectl logs -n <ingress-ns> deploy/<controller> --since=10m", "Log controller (tên namespace/deployment tuỳ cách cài)"],
        ["curl -vk --resolve app.example.com:443:<LB-IP> https://app.example.com/health", "Gọi thẳng LB với Host/SNI đúng — loại trừ DNS"]
      ],
      bay: "Annotation của ingress-nginx không có tác dụng trên ALB controller (và ngược lại). Copy annotation từ một bài viết mà không biết mình đang dùng controller nào là lỗi rất phổ biến.",
      cv: "CV nhắc ‘autoscaling, and ingress configuration’ trong cấu hình theo từng môi trường. Biết trả lời: controller nào, TLS cấp ở đâu, timeout đặt bao nhiêu cho request LLM dài."
    }
  ]
};
