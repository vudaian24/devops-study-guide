/* ============================================================
   Trang 9 — Debug sự cố production
   Mỗi mục là một kịch bản sự cố: hiện tượng → giảm thiểu trước → điều tra theo
   thứ tự → nguyên nhân hay gặp → khắc phục dứt điểm → phòng ngừa.
   Bổ sung cho các mục chẩn đoán đã có: Linux (troubleshooting theo tài nguyên),
   Container & K8s (chẩn đoán pod), Monitoring (điều tra bằng log), CI/CD (hỗ trợ dev).
   Cấu trúc dữ liệu: xem chú thích đầu js/kb.js
   ============================================================ */

const TRANG = {
  id: "incident",
  ten: "Debug sự cố production",
  nhan: "Debug sự cố",
  nhanSkill: "Công cụ dùng để điều tra",
  nhanCV: "Các dòng CV mà những kịch bản này bám vào",
  mucLucCV: "CV nào đứng sau các kịch bản",
  tomTat: "Khi production hỏng, thứ được đánh giá là **thứ tự bạn làm việc**: giảm thiệt hại trước, giữ bằng chứng, đặt giả thuyết từ câu hỏi ‘cái gì vừa thay đổi?’, kiểm chứng từng bước rồi mới sửa gốc và phòng ngừa. Trang này đi qua **10 kịch bản sự cố thường gặp** (5xx sau deploy, chậm, database, pod / ECS task không lên, đầy đĩa, mạng và DNS, chứng chỉ hết hạn, hàng đợi ùn, rò rỉ tài nguyên) cùng cách viết postmortem.",
  cvSkill: ["kubectl", "CloudWatch Logs", "Grafana", "ECS Fargate", "EKS", "VPC", "Aurora", "PostgreSQL", "SQS", "Nginx", "systemd", "Linux"],

  cv: [
    { nguon: "Kotae · Debug pod",
      noi: "…diagnosed pod-level incidents with kubectl — OOMKilled containers, CrashLoopBackOff, failing probes — and tuned resource requests, limits, and probe thresholds." },
    { nguon: "Tokyo Tech Lab · Hỗ trợ tuyến đầu",
      noi: "…served as first-line support for development and release engineers on build and deployment failures, triaging from pipeline and container logs through to root cause." },
    { nguon: "Kotae · Hỗ trợ pipeline",
      noi: "…unblocked developers when builds and rollouts failed on the shared multi-environment pipeline." },
    { nguon: "ERC Booking · Triage migration",
      noi: "…auto-generates CloudWatch Logs links for failure triage." },
    { nguon: "Tokyo Tech Lab · Runbook",
      noi: "Wrote the infrastructure documentation and provisioning runbooks that other engineers follow to onboard new client environments." },
    { nguon: "Professional summary",
      noi: "…resolves pod-level incidents directly with kubectl." },
    { nguon: "Skills · Monitoring & Observability",
      noi: "CloudWatch Logs, Grafana" }
  ],

  bank: ["Tình huống", "Monitoring", "Linux", "Networking", "Database", "Kubernetes"],

  muc: [
    /* ---------------------------------------------------------- */
    {
      id: "khung-su-co", ten: "Khung xử lý sự cố — thứ tự quan trọng hơn công cụ",
      y: [
        "**Thứ tự ưu tiên**: **giảm thiệt hại** → hiểu nguyên nhân → sửa gốc. Production đang hỏng thì việc đầu tiên là *khôi phục dịch vụ* (rollback, scale, tắt feature flag, failover), không phải tìm nguyên nhân gốc. Rollback mất 2 phút; đi tìm nguyên nhân có thể mất hai giờ.",
        "**Vòng đời**: phát hiện → xác nhận → phân loại mức độ (SEV) → giao tiếp và phân vai → giảm thiểu → thu thập bằng chứng → giả thuyết → kiểm chứng → khôi phục và xác minh → postmortem.",
        "**Bước 1 — xác nhận và đo phạm vi**: ai bị ảnh hưởng (tất cả, một vùng, một tenant, một endpoint), bắt đầu từ lúc nào, là *lỗi* hay *chậm*, có phải báo động giả không. Đừng chỉ tin dashboard — thử thật bằng `curl` hoặc synthetic check.",
        "**Câu hỏi vàng: ‘cái gì vừa thay đổi?’** — deploy, config / feature flag, migration, lượng traffic (chiến dịch, bot), dependency (DB failover, bên thứ ba), hạ tầng (node bị thay, quota, **chứng chỉ / credential hết hạn**), thời điểm (cron, đầu tháng). Đặt mốc bắt đầu lỗi cạnh nhật ký thay đổi: phần lớn sự cố là do một thay đổi.",
        "**Giữ bằng chứng trước khi restart**: `kubectl describe` và `logs --previous`, `docker inspect`, thread / heap dump, ảnh chụp đồ thị, `dmesg`. Restart xoá trạng thái và log của tiến trình — nếu có thể, rút một instance lỗi khỏi LB để điều tra trong khi các instance còn lại gánh tải.",
        "**Đi theo đường đi của request và chia đôi**: DNS → CDN / WAF → LB → ingress / proxy → ứng dụng → dependency (DB, cache, queue, API ngoài) → hạ tầng (node, mạng, đĩa). Kiểm tra ở giữa để loại một nửa nghi vấn mỗi lần, thay vì đoán lung tung.",
        "**Dùng phương pháp thay vì cảm tính**: **RED** (Rate, Errors, Duration) cho dịch vụ; **USE** (Utilization, Saturation, Errors) cho từng tài nguyên; Four Golden Signals. Chú ý *saturation* (hàng đợi, throttle, chờ) — thứ dashboard hay thiếu.",
        "**Mỗi lần một giả thuyết, mỗi lần một thay đổi**: ghi lại giờ và việc đã làm (timeline). Vừa tránh tự gây thêm sự cố, vừa có sẵn dữ liệu cho postmortem.",
        "**Giao tiếp**: một người điều phối, một người ghi chép; cập nhật định kỳ (15–30 phút) theo mẫu: ảnh hưởng — đã làm gì — hiện trạng — bước tiếp theo. Đừng im lặng và đừng hứa ETA khi chưa biết.",
        "**Hành động nguy hiểm khi đang cháy** (xoá dữ liệu, `rm -rf`, sửa tay DB production, restart đồng loạt, scale-in) cần người thứ hai xem lại — áp lực làm người ta gõ nhầm.",
        "**Khôi phục chưa phải là xong**: xác minh bằng metric (error rate, latency về baseline), theo dõi thêm một khoảng, rồi mới đóng và viết postmortem."
      ],
      bang: {
        ten: "Triệu chứng và việc nhìn đầu tiên",
        cot: ["Triệu chứng", "Nhìn đầu tiên", "Nguyên nhân hay gặp"],
        hang: [
          ["Lỗi 5xx tăng đột ngột", "Mốc bắt đầu so với lần deploy; 5xx của LB và của target; lỗi đầu tiên trong log", "Deploy lỗi, dependency chết, hết connection DB, hết capacity"],
          ["Chậm (p99 tăng)", "Saturation: CPU throttling, pool kết nối, query chậm, GC", "Thiếu index, pool cạn, CPU limit thấp, dependency ngoài chậm"],
          ["Chỉ một số request / người dùng lỗi", "Chia theo instance, AZ, tenant, endpoint, phiên bản", "Một node hỏng, một AZ, một tenant gây tải, một endpoint"],
          ["Service không lên / restart liên tục", "`describe` + exit code + log của lần chạy trước", "Thiếu config hay secret, OOM, probe sai, không kéo được image"],
          ["‘Hôm qua ổn, hôm nay hỏng, không ai đổi gì’", "Những thứ tự đổi hoặc hết hạn: chứng chỉ, token, tag `latest`, quota, đĩa, cron", "Chứng chỉ hết hạn, đầy đĩa, credential hết hạn, image / package tự nâng"],
          ["Dashboard xanh nhưng người dùng kêu", "Đo từ phía người dùng; tìm tầng chưa có metric", "Lỗi ở DNS / CDN / WAF, một nhóm người dùng, lỗi nghiệp vụ không thành 5xx"]
        ]
      },
      ma: {
        ten: "Mẫu cập nhật tình hình sự cố (gửi mỗi 15–30 phút)",
        noi: [
          "[SEV2] Lỗi 5xx trên API đặt lịch — cập nhật 14:30",
          "Ảnh hưởng   : ~30% request đặt lịch lỗi từ 14:05; các dịch vụ khác không ảnh hưởng",
          "Đã làm      : 14:12 xác định tương quan với lần deploy 14:02; 14:20 rollback về bản trước",
          "Hiện trạng  : tỷ lệ lỗi giảm 30% → 4%, đang theo dõi",
          "Tiếp theo   : kiểm tra các request lỗi còn lại; cập nhật tiếp lúc 14:45",
          "Điều phối   : <tên người điều phối>"
        ]
      },
      lenh: [
        ["git log --since='2 hours ago' --oneline", "Commit nào vừa vào trong khoảng thời gian lỗi"],
        ["kubectl get events -A --sort-by=.lastTimestamp | tail -30", "Sự kiện mới nhất trong cluster"],
        ["kubectl rollout history deploy/<name> -n <ns>", "Có rollout nào gần đây không"],
        ["aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=UpdateService --max-results 10", "Ai hoặc cái gì vừa đổi service ECS"]
      ],
      bay: [
        "Lao vào tìm nguyên nhân gốc trong khi dịch vụ đang chết: mất cả giờ trong khi rollback chỉ mất vài phút.",
        "Ngược lại: rollback hoặc restart ngay mà không giữ bằng chứng — sự cố quay lại mà không ai biết vì sao."
      ],
      cv: "‘Resolves pod-level incidents directly with kubectl’ và ‘triaging… through to root cause’: khi kể, nêu rõ thứ tự **giảm thiệt hại → giữ bằng chứng → giả thuyết → kiểm chứng → phòng ngừa**, và nói ra điều bạn đã loại trừ ở mỗi bước. Xem TH1, TH2, TH5 trong ngân hàng."
    },

    /* ---------------------------------------------------------- */
    {
      id: "su-co-5xx", ten: "Kịch bản 1 — Lỗi 5xx tăng đột ngột sau deploy",
      y: [
        "**Hiện tượng**: cảnh báo error rate hoặc người dùng báo lỗi, thường ngay sau hoặc trong vòng vài chục phút sau một lần deploy.",
        "**Giảm thiểu trước**: nếu lỗi bắt đầu đúng lúc deploy thì **rollback ngay** (revision / tag cũ, `helm rollback`) — ‘để đó xem có tự hết không’ là đánh cược với người dùng. Chỉ không rollback được khi schema đã đổi không tương thích (Case 2, trang Case thực tế); khi đó dùng feature flag, scale hoặc fix-forward.",
        "**Xác nhận có liên quan tới deploy**: đặt mốc deploy lên đồ thị error rate (annotation trong Grafana hoặc đối chiếu giờ). Lỗi bắt đầu *trước* deploy thì đừng đổ cho deploy — quay lại câu hỏi ‘cái gì khác vừa đổi?’.",
        "**Tách 5xx theo nguồn**: `HTTPCode_ELB_5XX_Count` (LB sinh ra: 502 / 503 / 504 — kết nối tới target, health, timeout) khác `HTTPCode_Target_5XX_Count` (chính app trả 500 / 503 — xem log và stack trace). Hai trường hợp đi hai hướng điều tra khác hẳn.",
        "**Tách theo chiều**: endpoint, pod / task, AZ, tenant và **phiên bản** — khi rollout đang dở mà lỗi chỉ ở pod mới thì bản mới lỗi. Thu hẹp phạm vi trước khi đọc log.",
        "**Đọc log từ lỗi đầu tiên theo thời gian**, không phải lỗi nhiều nhất — các lỗi sau thường là hệ quả. Đếm theo `@logStream` để biết lỗi ở mọi instance hay chỉ một.",
        "**Nguyên nhân hay gặp sau deploy**: (1) bug ở đường code mới; (2) thiếu hoặc sai biến môi trường / secret ở môi trường này (staging chạy được, production thì không); (3) migration chưa chạy hoặc schema lệch (`column … does not exist`); (4) bản mới dùng nhiều kết nối DB hơn → hết pool; (5) dependency bên thứ ba đổi hành vi; (6) tài nguyên của bản mới (OOM, CPU throttling); (7) health check đổi làm pod flapping; (8) feature flag hoặc config bật nhầm.",
        "**Khắc phục dứt điểm**: revert commit hoặc fix-forward kèm test tái hiện được lỗi; thêm kiểm tra để lần sau bắt được lỗi này trước khi tới production.",
        "**Phòng ngừa**: canary / rollout từng bước; **deployment alarm** gắn error rate để tự rollback (ECS circuit breaker + alarm, Argo Rollouts analysis, `helm --atomic`); smoke test ngay sau deploy; đánh dấu deploy trên dashboard."
      ],
      ma: [
        {
          ten: "CloudWatch Logs Insights: lỗi theo phút — xem lỗi bắt đầu từ lúc nào",
          noi: [
            "fields @timestamp, @message",
            "| filter @message like /ERROR|Exception/",
            "| stats count(*) as so_loi by bin(1m)",
            "| sort @timestamp asc"
          ]
        },
        {
          ten: "CloudWatch Logs Insights: lỗi theo instance — một node hay tất cả",
          noi: [
            "fields @timestamp, @logStream, @message",
            "| filter @message like /ERROR/",
            "| stats count(*) as so_loi by @logStream",
            "| sort so_loi desc",
            "| limit 10"
          ]
        }
      ],
      lenh: [
        ["aws logs tail <log-group> --since 30m --filter-pattern ERROR", "Log lỗi gần nhất của dịch vụ"],
        ["kubectl logs deploy/<name> -n <ns> --since=30m | grep -i error | head -20", "Lỗi gần nhất của deployment (mọi pod)"],
        ["kubectl get pods -n <ns> -o wide --sort-by=.metadata.creationTimestamp", "Pod nào mới (bản mới) và chạy trên node nào"],
        ["kubectl rollout undo deploy/<name> -n <ns>", "Rollback Kubernetes về ReplicaSet trước"],
        ["aws ecs update-service --cluster <c> --service <s> --task-definition <family>:<rev-cũ>", "Rollback ECS về revision cũ"],
        ["aws elbv2 describe-target-health --target-group-arn <arn>", "Target có healthy không và vì sao"]
      ],
      bay: "Nghe lời ‘cứ để đó xem sao’ khi error rate đang tăng sau deploy. Hoặc rollback mà không lưu log của bản lỗi (`kubectl logs --previous`, export CloudWatch) — sau đó không tái hiện được.",
      cv: "Đây là TH2 trong ngân hàng (‘deploy xong 15 phút thì error rate tăng, sếp nói cứ để đó’). Câu trả lời mạnh: rollback trước, có số liệu để thuyết phục, rồi điều tra và phòng ngừa. Gắn với pipeline rollout bạn đã làm (ECS: `wait services-stable`, rollback bằng revision cũ; Helm rollback ở Kotae)."
    },

    /* ---------------------------------------------------------- */
    {
      id: "su-co-cham", ten: "Kịch bản 2 — Hệ thống chậm, nhưng dashboard toàn màu xanh",
      y: [
        "**Hiện tượng**: người dùng báo chậm; tỷ lệ lỗi thấp; CPU và RAM trông bình thường (TH5 trong ngân hàng).",
        "**Đo từ phía người dùng trước**: synthetic check, RUM hoặc tự thử. Dashboard xanh chỉ có nghĩa là *những thứ bạn đã đo* ổn — còn tầng chưa đo (DNS, CDN, hàng đợi, pool) thì không ai thấy.",
        "**Xác định chậm ở đâu bằng cách chia thời gian của request**: DNS → TCP → TLS → TTFB (đo bằng `curl -w`); thời gian ở LB (`TargetResponseTime`) so với thời gian trong app; trong app thì DB, cache, API ngoài. Có tracing (X-Ray / OpenTelemetry) thì nhìn span chậm nhất; chưa có thì log thời gian từng bước.",
        "**Tìm *saturation* chứ không chỉ utilization**: CPU **bị throttle** do limit (usage thấp nhưng bị cắt), worker / thread pool cạn, **pool kết nối DB cạn** (request chờ lấy connection), hàng đợi nhận (`Recv-Q`), I/O wait, GC pause, swap.",
        "**Đọc hình dạng đồ thị**: p50 tốt mà p99 xấu → chỉ một phần request chậm (một endpoint, tenant, instance, cold start, GC, lock); p50 cũng tăng → hệ thống bão hoà hoặc dependency chung chậm; chậm theo chu kỳ → cron, batch, backup, cache hết hạn đồng loạt; chậm tăng dần theo ngày → rò rỉ tài nguyên (Kịch bản 10).",
        "**Nguyên nhân hay gặp**: query chậm hoặc mất index hoặc plan đổi (DB3); N+1 sau thay đổi code; pool kết nối cạn; CPU throttling; dependency ngoài chậm mà không có timeout / circuit breaker; cache hết hạn đồng loạt (thundering herd); DNS chậm trong cluster (`ndots`, CoreDNS); cold start khi scale (Fargate, pod mới); traffic bất thường (bot).",
        "**Xử lý ngay**: scale out *nếu* nút thắt là compute và dependency chịu được; tắt tính năng nặng; rate limit hoặc chặn bot (WAF); tăng TTL cache; kill query chạy dài. **Đừng scale ứng dụng khi nút thắt là DB** — thêm app chỉ làm DB tệ hơn.",
        "**Phòng ngừa**: alarm theo p95 / p99 (không chỉ trung bình); tracing; dashboard saturation (throttling, pool, queue depth); timeout và circuit breaker cho mọi lời gọi ra ngoài; load test trước thay đổi lớn."
      ],
      bang: {
        ten: "Đọc hình dạng đồ thị latency",
        cot: ["Hình dạng", "Gợi ý nguyên nhân", "Hành động đầu tiên"],
        hang: [
          ["p50 và p99 cùng tăng", "Bão hoà (hết capacity) hoặc dependency chung chậm", "Xem saturation và dependency; scale hoặc giảm tải"],
          ["p50 ổn, p99 vọt lên", "Một phần request chậm: endpoint, GC, lock, cold start, một instance xấu", "Chia theo endpoint / instance / tenant"],
          ["Chậm theo chu kỳ", "Cron, batch, backup, cache hết hạn đồng loạt, GC định kỳ", "Đối chiếu lịch job"],
          ["Chậm dần theo ngày, restart thì hết", "Rò rỉ: memory, connection, file descriptor, thread", "Đồ thị tài nguyên theo thời gian (Kịch bản 10)"],
          ["Chậm đột ngột đúng lúc có thay đổi", "Code, config, index hoặc plan truy vấn đổi", "So với nhật ký thay đổi, rollback thử"]
        ]
      },
      ma: [
        {
          ten: "Chia thời gian một request bằng curl",
          noi: [
            "curl -s -o /dev/null \\",
            "  -w 'dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\\n' \\",
            "  https://app.example.com/api/endpoint-cham",
            "",
            "# dns / connect cao → mạng, DNS   |   tls cao → handshake   |   ttfb cao → app hoặc dependency xử lý chậm"
          ]
        },
        {
          ten: "PromQL: CPU bị throttle (usage thấp nhưng limit quá chặt)",
          noi: [
            "sum(rate(container_cpu_cfs_throttled_periods_total{namespace=\"prod\"}[5m])) by (pod)",
            "  /",
            "sum(rate(container_cpu_cfs_periods_total{namespace=\"prod\"}[5m])) by (pod)",
            "",
            "# > 0.25 kéo dài: container thường xuyên bị cắt CPU — cân nhắc nâng limit hoặc bỏ CPU limit"
          ]
        }
      ],
      lenh: [
        ["kubectl top pod -n <ns> --containers --sort-by=cpu", "Container nào đang dùng nhiều CPU"],
        ["aws cloudwatch get-metric-statistics --namespace AWS/ApplicationELB --metric-name TargetResponseTime --dimensions Name=LoadBalancer,Value=<app/lb/id> --start-time <t1> --end-time <t2> --period 60 --statistics Average", "Thời gian phản hồi của target theo phút"],
        ["ss -s", "Tổng kết nối theo trạng thái (nhiều `timewait` hoặc `closed` bất thường?)"],
        ["SELECT state, count(*) FROM pg_stat_activity GROUP BY 1;", "Kết nối DB đang `active` hay `idle in transaction` (xem Kịch bản 3)"]
      ],
      bay: "Thêm CPU / thêm replica khi chưa biết chậm ở đâu: nếu nút thắt là DB hoặc một dependency ngoài, bạn chỉ tăng tải lên đúng chỗ đang nghẽn. Đo trước, hành động sau.",
      cv: "TH5 (‘người dùng báo chậm nhưng dashboard toàn xanh’). Bạn dùng CloudWatch Logs và Grafana: nói bạn sẽ bổ sung gì để thấy cái đang thiếu (p99, saturation, synthetic check) thay vì chỉ ‘xem log’."
    },

    /* ---------------------------------------------------------- */
    {
      id: "su-co-db", ten: "Kịch bản 3 — Database quá tải: hết connection, lock, query chậm",
      y: [
        "**Hiện tượng**: ứng dụng timeout hoặc báo `too many connections`, `remaining connection slots are reserved…`; CPU DB lên 100%; mọi request đều chậm lại cùng lúc.",
        "**Giảm thiểu trước**: *không restart DB* trừ khi bất khả kháng (mất cache, kéo dài downtime). Ưu tiên giảm tải: tắt hoặc tạm dừng job nặng, rate limit, kill truy vấn đang gây hại. Aurora: thêm reader cho đọc; scale up instance thì cần failover / gián đoạn ngắn — cân nhắc kỹ.",
        "**Xem DB đang làm gì** (`pg_stat_activity`): nhiều `idle in transaction` → ứng dụng giữ transaction mở mà không commit; nhiều `active` cùng một câu → query chậm hoặc thiếu index; nhiều kết nối có `wait_event_type = Lock` → đang chờ khoá của nhau.",
        "**Tìm kẻ chặn**: `pg_blocking_pids(pid)` cho biết ai đang chặn ai. Xử lý bằng `pg_cancel_backend(pid)` (huỷ truy vấn, nhẹ) trước, `pg_terminate_backend(pid)` (ngắt kết nối) sau cùng. Hỏi vì sao có transaction dài: migration / DDL lấy khoá `ACCESS EXCLUSIVE`, job batch, quên commit.",
        "**Hết connection**: so `max_connections` (Aurora tính theo RAM của instance) với tổng pool = *số task / pod × pool size*. Lưu ý rollout `maximumPercent=200` làm số kết nối **gấp đôi** tạm thời. Giải pháp: giảm pool mỗi instance, thêm **connection pooler** (PgBouncer, RDS Proxy), đặt `idle_in_transaction_session_timeout` và `statement_timeout`.",
        "**Query chậm đột ngột dù code không đổi** (DB3): thống kê cũ làm planner chọn plan xấu → `ANALYZE`; thiếu index hoặc dữ liệu đã đủ lớn để cần index; bloat do autovacuum không theo kịp; một query mới. Dùng `EXPLAIN (ANALYZE, BUFFERS)` và `pg_stat_statements` (top theo tổng thời gian).",
        "**Aurora có sẵn công cụ**: CloudWatch `DatabaseConnections`, `CPUUtilization`, `FreeableMemory`, `AuroraReplicaLag`; **Performance Insights** cho thấy top SQL và wait event — nhanh hơn nhiều so với đoán.",
        "**Khắc phục dứt điểm**: thêm index (`CREATE INDEX CONCURRENTLY`), sửa query, tách đọc sang reader, cache, pooler, timeout hợp lý; migration phải có `lock_timeout` (Case 2).",
        "**Phòng ngừa**: cảnh báo connection > 80% `max_connections`; bật slow query log và Performance Insights; load test sau thay đổi lớn; review query trong PR; giới hạn pool theo tổng số instance."
      ],
      ma: {
        ten: "PostgreSQL: DB đang làm gì và ai chặn ai",
        noi: [
          "-- 1) Kết nối đang ở trạng thái nào",
          "SELECT state, wait_event_type, count(*)",
          "FROM pg_stat_activity WHERE datname = current_database()",
          "GROUP BY 1, 2 ORDER BY 3 DESC;",
          "",
          "-- 2) Truy vấn chạy lâu nhất",
          "SELECT pid, now() - query_start AS chay_duoc, state, left(query, 80) AS query",
          "FROM pg_stat_activity WHERE state <> 'idle' ORDER BY query_start LIMIT 10;",
          "",
          "-- 3) Ai đang chặn ai",
          "SELECT pid, pg_blocking_pids(pid) AS bi_chan_boi, left(query, 60) AS query",
          "FROM pg_stat_activity WHERE cardinality(pg_blocking_pids(pid)) > 0;",
          "",
          "-- 4) Huỷ truy vấn (nhẹ) trước, ngắt kết nối (mạnh) sau cùng",
          "SELECT pg_cancel_backend(<pid>);",
          "SELECT pg_terminate_backend(<pid>);"
        ]
      },
      lenh: [
        ["SHOW max_connections;", "Giới hạn kết nối của DB hiện tại"],
        ["SELECT query, calls, total_exec_time FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 5;", "Top truy vấn theo tổng thời gian (cần extension `pg_stat_statements`)"],
        ["SELECT * FROM pg_replication_slots;", "Replication slot không hoạt động giữ WAL làm đầy đĩa"],
        ["aws cloudwatch get-metric-statistics --namespace AWS/RDS --metric-name DatabaseConnections --dimensions Name=DBClusterIdentifier,Value=<cluster> --start-time <t1> --end-time <t2> --period 60 --statistics Maximum", "Số kết nối theo phút"],
        ["ANALYZE <bảng>;", "Cập nhật thống kê khi planner chọn plan xấu"]
      ],
      bay: [
        "`EXPLAIN ANALYZE` **chạy thật** câu lệnh: với `UPDATE` / `DELETE` trên production nó thay đổi dữ liệu. Bọc trong transaction rồi `ROLLBACK`, hoặc dùng `EXPLAIN` không `ANALYZE`.",
        "Tăng thêm replica ứng dụng khi nút thắt là DB, hoặc `pg_terminate_backend` hàng loạt không phân biệt: ứng dụng kết nối lại ồ ạt và làm DB quá tải lần nữa."
      ],
      cv: "Skills của bạn có PostgreSQL, Aurora và migration Liquibase chạy bằng one-off task. Chuẩn bị một ví dụ thật về hết connection hoặc lock, và nêu rõ bạn dùng công cụ nào để thấy nguyên nhân. Xem DB3, TH7 trong ngân hàng."
    },

    /* ---------------------------------------------------------- */
    {
      id: "su-co-pod", ten: "Kịch bản 4 — Pod Kubernetes không lên: Pending, ImagePullBackOff, CrashLoopBackOff",
      y: [
        "**Quy trình cố định**: `kubectl get pod` (trạng thái) → `kubectl describe pod` (**Events** ở cuối, `Last State`, `Exit Code`) → `logs` và `logs --previous` → môi trường xung quanh (Secret, ConfigMap, PVC, node). Hầu hết câu trả lời nằm trong phần Events của `describe`.",
        "**Pending** — scheduler chưa gán được node: Events `FailedScheduling` cho biết lý do — `Insufficient cpu / memory` (requests vượt capacity → thêm node, giảm requests, Karpenter), taint không khớp toleration, `nodeSelector` / affinity không thoả, PVC chưa bind (StorageClass, khác AZ), ResourceQuota của namespace, hết IP trong subnet (VPC CNI trên EKS).",
        "**ImagePullBackOff / ErrImagePull**: sai tên hoặc tag; registry cần quyền (`imagePullSecrets`, quyền ECR của node / IRSA); rate limit của Docker Hub; node không ra được registry (NAT / VPC endpoint); image sai kiến trúc (arm64 / amd64 → thường lộ ra là `exec format error`).",
        "**CrashLoopBackOff** — container chạy rồi thoát: dùng `logs --previous` và đọc **exit code**: `1` lỗi ứng dụng / cấu hình; `126` / `127` lệnh không thực thi được / không tìm thấy; `137` bị `SIGKILL` (OOM, hoặc liveness fail giết); `139` segfault; `143` nhận `SIGTERM`. Nguyên nhân: thiếu env / secret, không kết nối được dependency, port đã bị dùng, quyền file với user không phải root, liveness probe quá gắt hoặc `initialDelay` quá ngắn.",
        "**CreateContainerConfigError**: ConfigMap / Secret hoặc key được tham chiếu không tồn tại.",
        "**`Running` nhưng `0/1 Ready`**: readiness probe đang fail — xem Events (`Readiness probe failed: …`) rồi gọi thử `/health` từ *trong* pod (`kubectl exec … curl localhost:8080/health`) để chắc path và port đúng.",
        "**Terminating mãi**: ứng dụng bỏ qua `SIGTERM`, volume không detach, finalizer. `kubectl delete pod --grace-period=0 --force` là biện pháp cuối vì không bảo đảm tiến trình đã dừng.",
        "**Image không có shell**: dùng ephemeral container — `kubectl debug -it <pod> --image=busybox --target=<container>`.",
        "**OOMKilled** (exit `137` kèm `Reason: OOMKilled`): xem Case 7 ở trang Case thực tế và mục chẩn đoán pod ở trang Container & K8s."
      ],
      bang: {
        ten: "Trạng thái pod, nơi cần xem và nguyên nhân hay gặp",
        cot: ["Trạng thái", "Nghĩa", "Xem ở đâu", "Nguyên nhân hay gặp"],
        hang: [
          ["`Pending`", "Chưa được gán node", "`describe pod` → Events (`FailedScheduling`)", "Thiếu CPU / RAM, taint, PVC chưa bind, ResourceQuota, hết IP"],
          ["`ImagePullBackOff`", "Không kéo được image", "`describe pod` → Events", "Sai tag, thiếu quyền registry, rate limit, không có đường ra registry"],
          ["`CrashLoopBackOff`", "Container thoát, kubelet thử lại với thời gian chờ tăng dần", "`logs --previous`, Exit Code", "Thiếu config / secret, không nối được dependency, probe sai, OOM"],
          ["`CreateContainerConfigError`", "Cấu hình container không hợp lệ", "`describe pod`", "ConfigMap / Secret hoặc key không tồn tại"],
          ["`Running` nhưng `0/1 Ready`", "Readiness probe đang fail", "`describe pod`; gọi `/health` trong pod", "Sai path / port, app chưa sẵn sàng, dependency chết"],
          ["`Terminating` mãi", "Pod không thoát được", "`describe pod`, finalizers, volume", "App bỏ qua SIGTERM, volume không detach"],
          ["`Evicted`", "Node thiếu tài nguyên nên đuổi pod", "`describe pod` → Reason", "Node hết memory hoặc đĩa (`DiskPressure`), pod `BestEffort`"]
        ]
      },
      lenh: [
        ["kubectl get pod -n <ns> -o wide", "Trạng thái, số lần restart, node"],
        ["kubectl describe pod <pod> -n <ns>", "Events, `Last State`, `Exit Code`, probe"],
        ["kubectl logs <pod> -n <ns> -c <container> --previous", "Log của lần chạy ngay trước khi crash"],
        ["kubectl get events -n <ns> --sort-by=.lastTimestamp", "Sự kiện mới nhất theo thời gian"],
        ["kubectl get pod <pod> -n <ns> -o jsonpath='{.status.containerStatuses[*].lastState}'", "Trạng thái lần chạy trước (lý do, exit code)"],
        ["kubectl exec -it <pod> -n <ns> -- sh", "Vào trong pod kiểm tra thủ công"],
        ["kubectl debug -it <pod> -n <ns> --image=busybox --target=<container>", "Ephemeral container khi image không có shell"],
        ["kubectl describe node <node> | grep -A8 Conditions", "Node có `DiskPressure` / `MemoryPressure` không"]
      ],
      bay: "Chỉ nhìn `kubectl logs` (log của lần chạy hiện tại, thường trống) mà quên `--previous` và phần Events của `describe`. Hoặc xoá pod cho ‘làm mới’ trước khi lưu bằng chứng — pod mới không còn dấu vết của lỗi cũ.",
      cv: "Đúng dòng CV của bạn: ‘OOMKilled containers, CrashLoopBackOff, failing probes’. Hãy kể bằng một sự cố thật theo thứ tự `get` → `describe` → `logs --previous` → nguyên nhân → sửa. Xem K2, K3, KT1 trong ngân hàng."
    },

    /* ---------------------------------------------------------- */
    {
      id: "su-co-ecs", ten: "Kịch bản 5 — ECS task liên tục bị dừng hoặc rollout kẹt",
      y: [
        "**Hiện tượng**: deployment không hoàn tất; `runningCount` < `desiredCount`; task cứ `PENDING` rồi `STOPPED`; circuit breaker kích hoạt và rollback.",
        "**Điều tra theo thứ tự**: `describe-services` → `events` (thông báo của scheduler) → `list-tasks --desired-status STOPPED` → `describe-tasks` → `stoppedReason`, `stopCode`, `exitCode` và `reason` của container → log CloudWatch của task. **Lấy bằng chứng sớm**: task đã dừng chỉ còn hiển thị một khoảng (khoảng một giờ), sau đó mất.",
        "**Execution role ≠ task role**: *execution role* dành cho ECS agent (kéo image từ ECR, lấy secret, ghi log); *task role* dành cho code trong container (gọi S3, SQS…). Nhầm hai role là lỗi kinh điển: lỗi kéo image hoặc lấy secret là của execution role.",
        "**Không có đường mạng**: task ở private subnet cần NAT hoặc **VPC endpoint** để tới ECR (`ecr.api`, `ecr.dkr` và S3 gateway), CloudWatch Logs, Secrets Manager / SSM. Thiếu một cái thì `CannotPullContainerError` hoặc `ResourceInitializationError`.",
        "**Task vào rồi bị thay do health check**: ECS *thay task* khi target fail health check của ALB — kiểm tra path / port, security group của task có cho ALB vào không, `healthCheckGracePeriodSeconds` có lớn hơn thời gian khởi động không.",
        "**Exit code của container**: `137` thường là OOM — so memory của task với mức dùng thật; `1` lỗi ứng dụng; `126` / `127` lệnh khởi động sai (`entryPoint` / `command`); `essential: true` làm cả task dừng khi một container thoát.",
        "**Vào trong task đang chạy**: ECS Exec (`aws ecs execute-command`) cần bật `enableExecuteCommand` và task role có quyền SSM messages.",
        "**Circuit breaker đã rollback**: xem các task của deployment *thất bại* (đã bị dừng) để tìm lý do — đó là bằng chứng, đừng chỉ thấy service quay về bản cũ rồi coi như xong.",
        "**Phòng ngừa**: smoke test sau rollout; circuit breaker + alarm; Terraform tạo đủ VPC endpoint và quyền cho execution role; cảnh báo `runningCount` thấp hơn `desiredCount` quá lâu."
      ],
      bang: {
        ten: "Thông báo dừng task (`stoppedReason`) và cách xử lý",
        cot: ["Thông báo", "Nghĩa", "Nguyên nhân hay gặp", "Cách xử lý"],
        hang: [
          ["`CannotPullContainerError`", "Không kéo được image", "Sai tag hoặc repo; execution role thiếu quyền ECR; private subnet không có NAT / VPC endpoint tới ECR; image sai kiến trúc CPU", "Kiểm tra tag trong ECR, execution role, endpoint / NAT, `runtimePlatform`"],
          ["`ResourceInitializationError`", "ECS agent không khởi tạo được tài nguyên cho task", "Không lấy được secret (execution role thiếu `secretsmanager:GetSecretValue` hoặc quyền KMS; không có đường mạng tới Secrets Manager); không mount được EFS; hết IP để tạo ENI", "Sửa quyền hoặc đường mạng; kiểm tra số IP còn trống trong subnet"],
          ["`Essential container in task exited`", "Container chính thoát", "Lỗi ứng dụng (exit 1), thiếu config, OOM (exit 137), lệnh khởi động sai (126 / 127)", "Đọc `exitCode`, `reason` và log CloudWatch; so memory đã khai"],
          ["`Task failed ELB health checks`", "ALB đánh dấu target unhealthy nên ECS thay task", "Sai path hoặc port health check; SG của task chặn ALB; app khởi động lâu hơn grace period; endpoint trả khác 200", "Gọi thử `/health` từ trong VPC, kiểm tra SG, tăng `healthCheckGracePeriodSeconds`"],
          ["`Scaling activity initiated by …`", "Task bị thay vì rollout hoặc autoscaling", "Bình thường khi đang deploy hoặc scale-in", "Không phải lỗi; chỉ xem tiếp nếu đồng thời có 5xx"]
        ]
      },
      lenh: [
        ["aws ecs describe-services --cluster <c> --services <s> --query 'services[0].events[:10]'", "Thông báo gần nhất của scheduler"],
        ["aws ecs list-tasks --cluster <c> --service-name <s> --desired-status STOPPED", "Các task đã dừng (còn hiển thị một khoảng)"],
        ["aws ecs describe-tasks --cluster <c> --tasks <arn> --query 'tasks[0].[stopCode,stoppedReason,containers[].[name,exitCode,reason]]'", "Vì sao task dừng, exit code của từng container"],
        ["aws ecs describe-task-definition --task-definition <family> --query 'taskDefinition.[executionRoleArn,taskRoleArn]'", "Hai role của task"],
        ["aws logs tail <log-group> --since 30m --follow", "Log của task theo thời gian thực"],
        ["aws ecs execute-command --cluster <c> --task <id> --container <name> --interactive --command sh", "Vào task đang chạy (cần ECS Exec)"]
      ],
      bay: "Nhầm execution role với task role: thêm quyền S3 / SQS cho task role rồi thắc mắc vì sao vẫn không kéo được image hay không lấy được secret. Hoặc chờ quá lâu mới điều tra và task đã dừng không còn xem được.",
      cv: "Pipeline ECS của bạn ‘auto-generates CloudWatch Logs links for failure triage’ — hãy kể đúng chuỗi: rollout kẹt → events → task STOPPED → `stoppedReason` / exit code → log → sửa. Nêu hai role và VPC endpoint để cho thấy bạn đã gặp thật."
    },

    /* ---------------------------------------------------------- */
    {
      id: "su-co-disk", ten: "Kịch bản 6 — Đầy đĩa (95%) và đang tăng trên server production",
      y: [
        "**Hiện tượng**: cảnh báo đĩa > 90%; ứng dụng không ghi được log hoặc upload; database có thể dừng khi hết chỗ cho WAL / binlog. (TH3 và L1 trong ngân hàng.)",
        "**Giảm thiểu an toàn trước**: giải phóng chỗ bằng thứ an toàn nhất — log đã xoay (`journalctl --vacuum-size=500M`), cache build, file tạm, image Docker không dùng (`docker system prune`, **không** thêm `--volumes` một cách bừa bãi). Hoặc **mở rộng volume** (EBS resize online rồi `growpart` + `resize2fs` / `xfs_growfs`) — thường nhanh và an toàn hơn xoá file. Không xoá file dữ liệu / WAL khi chưa hiểu nó là gì.",
        "**Tìm cái gì ăn đĩa**: `df -h` (phân vùng nào) → `df -i` (hết **inode**?) → `du -xh --max-depth=1 / | sort -rh | head` rồi đi sâu từng cấp (`-x` để không vượt sang filesystem khác); `ncdu` nếu có. Docker: `docker system df -v`. Kubernetes: `DiskPressure` trên node, log pod ở `/var/log/pods`, dữ liệu containerd.",
        "**‘`df` báo đầy nhưng `du` cộng lại thấp hơn nhiều’** (L1): file đã bị xoá nhưng tiến trình vẫn đang mở (`lsof +L1`) → restart tiến trình giữ file hoặc truncate qua `/proc/<pid>/fd/<n>`; hoặc một mount che dữ liệu bên dưới điểm mount; hoặc khối dự trữ của ext4.",
        "**Đang tăng nhanh — ai đang ghi?**: `iotop`, `lsof +D <thư mục>`, chạy `du` hai lần cách nhau vài phút rồi so; theo dõi file lớn tăng.",
        "**Nguyên nhân hay gặp**: log không xoay (thiếu `logrotate`, hoặc Docker `json-file` không giới hạn `max-size`); journald phình; image / layer / volume Docker tích tụ; core dump; backup hoặc dump để lại trên cùng đĩa; file upload tạm; **WAL / binlog tích tụ do replication slot không hoạt động**; cache của CI trên runner.",
        "**Khắc phục dứt điểm**: `logrotate` hoặc `log-opts max-size / max-file` trong `daemon.json`, `SystemMaxUse` cho journald, vòng đời cho backup (xoá sau N ngày, đẩy lên S3), tách volume dữ liệu riêng khỏi hệ thống, dọn image định kỳ.",
        "**Phòng ngừa**: cảnh báo ở 80% **và cảnh báo dự báo** (`predict_linear` — ‘sẽ đầy trong 4 giờ’) thay vì chỉ ngưỡng; dashboard tốc độ tăng; tự động hoá dọn dẹp."
      ],
      ma: [
        {
          ten: "PromQL: cảnh báo dự báo đĩa sẽ đầy",
          noi: [
            "# Dựa trên 6 giờ gần nhất, 4 giờ nữa còn trống bao nhiêu byte? (< 0 nghĩa là sẽ đầy)",
            "predict_linear(node_filesystem_avail_bytes{mountpoint=\"/\"}[6h], 4 * 3600) < 0"
          ]
        },
        {
          ten: "Docker: giới hạn dung lượng log (/etc/docker/daemon.json)",
          noi: [
            "{",
            "  \"log-driver\": \"json-file\",",
            "  \"log-opts\": { \"max-size\": \"10m\", \"max-file\": \"3\" }",
            "}"
          ]
        }
      ],
      lenh: [
        ["df -h; df -i", "Phân vùng nào đầy; hết dung lượng hay hết inode"],
        ["du -xh --max-depth=1 /var | sort -rh | head", "Thư mục nào lớn nhất (không vượt filesystem)"],
        ["lsof +L1", "File đã xoá nhưng tiến trình còn mở (chiếm chỗ)"],
        ["journalctl --disk-usage; journalctl --vacuum-size=500M", "Xem và thu nhỏ journald"],
        ["docker system df -v", "Image, container, volume đang chiếm bao nhiêu"],
        ["growpart /dev/nvme0n1 1 && xfs_growfs -d /", "Sau khi tăng EBS: mở rộng phân vùng và filesystem (ext4 dùng `resize2fs`)"]
      ],
      bay: [
        "`rm` file log đang được ghi: dung lượng không được trả lại vì tiến trình vẫn giữ file descriptor — hãy truncate (`: > file`, `truncate -s 0`) hoặc restart tiến trình.",
        "`docker system prune -a --volumes` xoá luôn volume chứa dữ liệu, và dọn file trong thư mục dữ liệu của database để ‘lấy chỗ’ có thể làm hỏng DB."
      ],
      cv: "Skills Linux và Nginx / systemd của bạn là nơi hay gặp sự cố này (log Nginx, journald, Docker). Chuẩn bị đúng thứ tự: `df -h` → `df -i` → `du` → `lsof +L1`, và nói ra điều bạn **không** xoá. Nêu thêm cách bạn đã chặn nó tái diễn (logrotate, giới hạn log Docker, cảnh báo dự báo)."
    },

    /* ---------------------------------------------------------- */
    {
      id: "su-co-mang", ten: "Kịch bản 7 — Service A không gọi được service B: DNS, mạng, security group",
      y: [
        "**Hiện tượng**: timeout, `connection refused`, `no such host` hoặc 502 giữa hai thành phần (N3 trong ngân hàng).",
        "**Đọc kỹ thông báo lỗi — mỗi loại chỉ về một tầng**: `no such host` / `Temporary failure in name resolution` = **DNS**; `connection timed out` = gói tin bị **chặn hoặc không có route** (SG, NACL, route, firewall); `connection refused` = tới được host nhưng **không có process nghe cổng đó** (sai port, app chưa chạy, bind `127.0.0.1` thay vì `0.0.0.0`); `connection reset` = bên kia hoặc thiết bị giữa đường đóng kết nối (idle timeout, crash); lỗi `x509` / handshake = **TLS**; HTTP 4xx / 5xx = đã tới được ứng dụng.",
        "**Đi từng tầng, từ phía client**: DNS (`dig`, `getent hosts`) → L3 (`ping`, `traceroute`, `mtr`; ICMP bị chặn *không* có nghĩa là hỏng) → L4 (`nc -zv host port`) → L7 (`curl -v`). Dừng ở tầng đầu tiên fail.",
        "**Chia đôi**: thử từ **cùng subnet / pod với client** và từ **chính host đích** (`curl localhost`). Localhost ổn mà từ ngoài thì không → firewall / SG / bind address; localhost cũng hỏng → ứng dụng.",
        "**AWS**: Security Group (cho phép *SG nguồn* và đúng cổng chưa?); **NACL là stateless** (cần cả chiều về qua cổng ephemeral); route table của subnet (có route tới NAT / IGW / peering / TGW?); VPC endpoint (policy, SG, private DNS); private hosted zone đã gắn đúng VPC; **VPC Reachability Analyzer** phân tích đường đi theo cấu hình; **VPC Flow Logs** cho thấy `ACCEPT` / `REJECT` (`REJECT` → SG hoặc NACL chặn).",
        "**Kubernetes**: CoreDNS có chạy không (`kubectl logs -n kube-system -l k8s-app=kube-dns`); **`ndots:5`** làm mỗi tên miền ngoài bị thử nhiều suffix → DNS chậm hoặc lỗi (dùng FQDN có dấu chấm cuối hoặc hạ `ndots`); Service có **endpoints** không (`kubectl get endpoints <svc>` rỗng → selector không khớp pod hoặc pod chưa Ready); `port` / `targetPort` sai; NetworkPolicy chặn; node SG.",
        "**‘Lúc được lúc không’ / bị cắt sau một lúc**: idle timeout — NAT Gateway cắt kết nối rảnh sau 350 giây, ALB sau 60 giây mặc định → client thấy `ECONNRESET`. Dùng keep-alive hoặc tăng timeout phù hợp.",
        "**Bắt gói khi cần**: `tcpdump -nn -i any host <ip> and port <port>` — thấy SYN đi mà không có SYN-ACK → bị chặn; thấy RST → bị từ chối.",
        "**Phòng ngừa**: security group tham chiếu *SG khác* thay vì CIDR cứng; bật VPC Flow Logs; test kết nối trong pipeline sau khi đổi hạ tầng; ghi runbook sơ đồ mạng."
      ],
      bang: {
        ten: "Thông báo lỗi và tầng nghi ngờ",
        cot: ["Thông báo", "Nghĩa", "Kiểm tra"],
        hang: [
          ["`Temporary failure in name resolution`, `no such host`", "DNS không phân giải được", "`dig <host>`; CoreDNS / resolver, private hosted zone, `ndots`"],
          ["`Connection timed out`", "Gói tin bị chặn hoặc không có route", "SG, NACL, route table, firewall; Flow Logs `REJECT`"],
          ["`Connection refused`", "Tới được host nhưng không có process nghe cổng", "Đúng port chưa, app chạy chưa, `ss -tlnp`, bind `0.0.0.0`"],
          ["`Connection reset by peer`, `ECONNRESET`", "Một đầu hoặc thiết bị giữa đường đóng kết nối", "Idle timeout (NAT 350s, ALB 60s), app crash, keep-alive"],
          ["`x509`, `SSL handshake failed`", "TLS: chứng chỉ hết hạn, sai tên, thiếu chain, sai SNI", "`openssl s_client -connect host:443 -servername host`"],
          ["HTTP `502` / `503` / `504`", "Tới được LB nhưng không tới được hoặc không nhận phản hồi từ backend", "Target health, SG của target, timeout (Case 12–13, trang Case thực tế)"]
        ]
      },
      lenh: [
        ["dig +short <host>; dig <host> @<dns-server>", "Phân giải tên; thử với một DNS server cụ thể"],
        ["nc -zv <host> <port>", "Cổng có mở không (L4)"],
        ["curl -v --connect-timeout 5 https://<host>/health", "Chi tiết kết nối, TLS, phản hồi HTTP"],
        ["ss -tlnp", "Process nào đang nghe cổng nào, và bind địa chỉ nào"],
        ["aws ec2 describe-security-groups --group-ids <sg> --query 'SecurityGroups[0].IpPermissions'", "Rule inbound của một security group"],
        ["kubectl get endpoints <svc> -n <ns>", "Service có pod phía sau không"],
        ["kubectl run -it --rm netshoot --image=nicolaka/netshoot -- bash", "Pod tạm đầy đủ công cụ mạng trong cluster (`dig`, `curl`, `tcpdump`…)"],
        ["tcpdump -nn -i any host <ip> and port <port> -c 50", "Thấy SYN / SYN-ACK / RST để biết gói bị chặn hay bị từ chối"]
      ],
      bay: "Kết luận ‘mạng hỏng’ khi chưa phân biệt timeout với refused: timeout là gói bị chặn; refused là *đã tới nơi nhưng không ai nghe*. Hai trường hợp, hai chỗ cần sửa hoàn toàn khác nhau.",
      cv: "Skills của bạn có VPC, security group qua Terraform và Nginx. Trả lời N3 theo thứ tự DNS → L3 → L4 → L7, nói ra thông báo lỗi chỉ về tầng nào, và nêu một lần bạn gặp thật (SG thiếu rule, hay Service không có endpoint)."
    },

    /* ---------------------------------------------------------- */
    {
      id: "su-co-cert", ten: "Kịch bản 8 — Chứng chỉ TLS hết hạn lúc nửa đêm",
      y: [
        "**Hiện tượng**: trình duyệt cảnh báo, client lỗi `certificate has expired`, hoặc API nội bộ gọi nhau lỗi `x509: certificate has expired or is not yet valid`. Lỗi có thể chỉ ở một số client (intermediate hết hạn, thiếu chain, đồng hồ máy sai).",
        "**Xác nhận ngay**: lấy ngày hết hạn của chứng chỉ đang được *phục vụ* (không phải file trên đĩa) bằng `openssl s_client`; xem cả chain (`-showcerts`). Nhiều tầng có chứng chỉ riêng — CloudFront (ACM ở `us-east-1`), ALB (ACM), Nginx (file certbot), ingress K8s (Secret do cert-manager), service mesh / mTLS nội bộ — cần xác định *tầng nào* đang trả chứng chỉ hết hạn.",
        "**Gia hạn khẩn**: ACM — kiểm tra bản ghi **DNS validation** (CNAME) còn không và tên miền còn trỏ đúng không, vì auto-renew thất bại âm thầm khi bản ghi bị xoá; certbot — `certbot renew --dry-run`, kiểm tra timer / cron (`systemctl list-timers`), cổng 80 cho HTTP-01 có bị chặn không; cert-manager — `describe` các đối tượng `Certificate`, `CertificateRequest`, `Order`, `Challenge`; coi chừng rate limit của Let’s Encrypt.",
        "**Cấp mới rồi mà vẫn lỗi**: Nginx đọc file lúc khởi động / reload — file chứng chỉ đã đổi nhưng chưa `nginx -s reload` thì vẫn phục vụ chứng chỉ cũ. Pod mount Secret không tự nạp lại → cần `rollout restart`. Có cache ở CDN / LB cũng làm thấy chứng chỉ cũ.",
        "**Nguyên nhân gốc thường là hai việc cùng lúc**: gia hạn tự động hỏng *âm thầm* (bản ghi validation bị xoá, quyền IAM đổi, cron không chạy, firewall đổi) **và** không có cảnh báo hết hạn. Chứng chỉ nội bộ, mTLS, client cert hay bị quên nhất.",
        "**Phòng ngừa**: cảnh báo `DaysToExpiry` của ACM (namespace `AWS/CertificateManager`); blackbox exporter với `probe_ssl_earliest_cert_expiry`; ngưỡng 30 / 14 / 7 ngày; danh mục mọi chứng chỉ và người phụ trách; ưu tiên ACM cho tài nguyên AWS để tự gia hạn; thử `--dry-run` định kỳ."
      ],
      ma: [
        {
          ten: "Kiểm tra chứng chỉ đang được phục vụ",
          noi: [
            "# Ngày hiệu lực, chủ thể và bên cấp của chứng chỉ mà server đang trả",
            "echo | openssl s_client -connect app.example.com:443 -servername app.example.com 2>/dev/null \\",
            "  | openssl x509 -noout -dates -subject -issuer",
            "",
            "# Xem cả chain (intermediate có thiếu hoặc hết hạn không)",
            "echo | openssl s_client -connect app.example.com:443 -servername app.example.com -showcerts 2>/dev/null | grep -E 's:|i:|Verify'"
          ]
        },
        {
          ten: "PromQL: cảnh báo trước khi hết hạn (blackbox exporter)",
          noi: [
            "# còn dưới 14 ngày",
            "(probe_ssl_earliest_cert_expiry - time()) / 86400 < 14"
          ]
        }
      ],
      lenh: [
        ["aws acm describe-certificate --certificate-arn <arn> --query 'Certificate.[Status,NotAfter,RenewalEligibility]'", "Trạng thái và ngày hết hạn của chứng chỉ ACM"],
        ["aws acm describe-certificate --certificate-arn <arn> --query 'Certificate.DomainValidationOptions'", "Bản ghi DNS validation cần còn tồn tại"],
        ["certbot renew --dry-run", "Thử gia hạn mà không thay đổi gì"],
        ["systemctl list-timers | grep -i certbot", "Timer gia hạn có đang chạy không"],
        ["kubectl get certificate -A", "Trạng thái các chứng chỉ do cert-manager quản"],
        ["nginx -t && nginx -s reload", "Nạp lại chứng chỉ mới (reload êm)"]
      ],
      bay: "Gia hạn xong, kiểm tra file trên đĩa thấy mới rồi báo ‘đã xong’ — trong khi Nginx hoặc pod chưa nạp lại. Luôn kiểm tra chứng chỉ **mà server đang trả** bằng `openssl s_client`, không phải file trên đĩa.",
      cv: "Dịch vụ tự quản của bạn dùng Nginx làm TLS-terminating reverse proxy. Chuẩn bị trả lời: ai gia hạn chứng chỉ, bằng cách nào, đã có cảnh báo hết hạn chưa — và nếu chưa, bạn sẽ thêm gì."
    },

    /* ---------------------------------------------------------- */
    {
      id: "su-co-queue", ten: "Kịch bản 9 — Hàng đợi SQS ùn tồn, worker không xử lý kịp",
      y: [
        "**Hiện tượng**: `ApproximateNumberOfMessagesVisible` và `ApproximateAgeOfOldestMessage` tăng; người dùng thấy email, báo cáo hoặc tác vụ nền chậm; DLQ bắt đầu có message.",
        "**Xác định loại ùn**: (a) *producer tăng* (đột biến traffic); (b) *consumer chậm hoặc ngừng* (worker chết, lỗi dependency); (c) *poison message* — một message luôn lỗi, retry rồi vào DLQ. So `NumberOfMessagesSent` với `NumberOfMessagesDeleted`; `ApproximateNumberOfMessagesNotVisible` (đang xử lý) cao kéo dài nghĩa là xử lý chậm hoặc visibility timeout quá ngắn.",
        "**`ApproximateAgeOfOldestMessage` là chỉ số sát trải nghiệm nhất** — đặt cảnh báo theo SLA (‘không message nào chờ quá N phút’), không chỉ theo độ dài hàng đợi.",
        "**Nguyên nhân phía consumer**: worker crash loop hoặc OOM (Kịch bản 4–5); lỗi khi gọi dependency (DB, API ngoài, **SES bị throttle**) làm message quay lại hàng đợi sau visibility timeout; **visibility timeout ngắn hơn thời gian xử lý** → message bị giao lại khi đang được xử lý (xử lý trùng và tăng tải); số worker không đủ; không có autoscaling theo backlog.",
        "**Giảm thiểu**: scale worker **nếu** dependency chịu được (DB, SES rate limit!), tạm dừng producer không quan trọng, chỉnh visibility timeout cho đúng. **Không `purge` queue** trừ khi chắc chắn mất message là chấp nhận được — purge không phục hồi được.",
        "**DLQ**: `maxReceiveCount` chuyển message lỗi sang DLQ. Xem nội dung message (đọc mà không ‘giấu’ nó) → tìm nguyên nhân → sửa → **redrive** về queue nguồn (`start-message-move-task`). Đừng xoá DLQ khi chưa biết vì sao message lỗi.",
        "**Phòng ngừa**: cảnh báo tuổi message cũ nhất và DLQ có message; autoscaling theo *backlog trên mỗi worker*; xử lý **idempotent** (message có thể giao lại); retry có backoff và giới hạn; tách queue theo mức ưu tiên; ghi log kèm message id để lần theo."
      ],
      bang: {
        ten: "Chỉ số SQS và ý nghĩa",
        cot: ["Chỉ số", "Ý nghĩa", "Đọc thế nào"],
        hang: [
          ["`ApproximateNumberOfMessagesVisible`", "Message đang chờ được lấy", "Tăng liên tục = consumer chậm hơn producer"],
          ["`ApproximateNumberOfMessagesNotVisible`", "Message đang được xử lý (in-flight)", "Cao kéo dài = xử lý chậm hoặc visibility timeout quá ngắn"],
          ["`ApproximateAgeOfOldestMessage`", "Tuổi của message cũ nhất", "Sát trải nghiệm người dùng nhất; cảnh báo theo SLA"],
          ["`NumberOfMessagesSent` so với `NumberOfMessagesDeleted`", "Vào so với ra", "Sent > Deleted kéo dài = ùn"],
          ["DLQ: `ApproximateNumberOfMessagesVisible`", "Message lỗi sau `maxReceiveCount`", "Lớn hơn 0 là phải xem, không để lâu"]
        ]
      },
      lenh: [
        ["aws sqs get-queue-attributes --queue-url <url> --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible ApproximateNumberOfMessagesDelayed", "Độ dài hàng đợi hiện tại"],
        ["aws sqs get-queue-attributes --queue-url <url> --attribute-names VisibilityTimeout RedrivePolicy", "Visibility timeout và cấu hình DLQ"],
        ["aws sqs receive-message --queue-url <dlq-url> --max-number-of-messages 1 --visibility-timeout 0", "Xem thử message ở DLQ mà không ‘giấu’ nó khỏi các consumer khác"],
        ["aws sqs start-message-move-task --source-arn <dlq-arn> --destination-arn <queue-arn>", "Redrive từ DLQ về queue nguồn — chỉ sau khi đã sửa nguyên nhân"],
        ["aws logs tail <worker-log-group> --since 30m --filter-pattern ERROR", "Worker đang lỗi gì"]
      ],
      bay: [
        "`aws sqs purge-queue` để ‘cho sạch’: toàn bộ message bị xoá vĩnh viễn, gồm cả những message nghiệp vụ chưa xử lý.",
        "Scale worker lên gấp đôi khi nút thắt là dependency (DB, SES): bạn chỉ làm dependency quá tải sớm hơn và có thể gây thêm lỗi."
      ],
      cv: "SQS, SES và worker ECS đều có trong CV của bạn. Chuẩn bị mô tả worker xử lý `SIGTERM` thế nào (Case 13), visibility timeout đặt bao nhiêu và vì sao, và bạn xem hàng đợi ùn qua chỉ số nào."
    },

    /* ---------------------------------------------------------- */
    {
      id: "su-co-leak", ten: "Kịch bản 10 — Chạy vài ngày thì chậm dần rồi crash (rò rỉ tài nguyên)",
      y: [
        "**Hiện tượng**: restart thì ổn, vài ngày sau chậm dần rồi crash (TH4 trong ngân hàng). Đồ thị có hình **răng cưa**: tài nguyên tăng đều đến ngưỡng → chết → reset.",
        "**Xác định tài nguyên nào đang rò**: *memory* (RSS tăng đều); *file descriptor* (`ls /proc/<pid>/fd | wc -l` so với `ulimit -n`; lỗi `too many open files`); *kết nối* (pool DB cạn, nhiều `CLOSE_WAIT` — app không đóng socket, nhiều `TIME_WAIT` — cạn cổng ephemeral); *thread* (`ps -o nlwp`); *đĩa* (log tăng); *cache nội bộ không giới hạn*.",
        "**Đọc hình dạng**: tăng tuyến tính theo *thời gian* → rò theo thời gian (timer, connection); tăng theo *số request* → rò theo request (không giải phóng object, không đóng response body); tăng theo *bậc thang* tại giờ cố định → job hoặc cron.",
        "**Phân biệt rò rỉ và cache bình thường**: sau GC memory có xuống không? So heap với RSS (fragmentation). Node.js: heap snapshot / `process.memoryUsage()`; Java: `jcmd <pid> GC.heap_info`, `jmap -histo`; Python: `tracemalloc`.",
        "**`CLOSE_WAIT` nhiều**: phía kia đã đóng kết nối nhưng ứng dụng chưa gọi `close()` — thường là HTTP client không đóng response, hoặc pool không trả connection.",
        "**Giảm thiểu**: restart có kiểm soát (cuốn chiếu, *không* đồng loạt) hoặc theo lịch; đặt limit memory để container tự restart thay vì OOM killer làm chết cả node; tạm nâng `ulimit -n`. Autoscaling có thể *che giấu* rò rỉ — đừng tin ‘đang ổn’ chỉ vì có thêm replica.",
        "**Điều tra dứt điểm**: tái hiện bằng **soak test** (tải đều, chạy dài) ở staging; profiling / heap dump; **bisect theo release** (bản nào bắt đầu rò) hoặc so danh sách thay đổi giữa bản ổn định và bản có rò; kiểm tra bản nâng thư viện.",
        "**Phòng ngừa**: dashboard tài nguyên theo *thời gian dài* và cảnh báo theo **xu hướng** (`predict_linear`); soak test trước release lớn; giới hạn cache (LRU / TTL); đóng tài nguyên trong `finally`; timeout cho mọi HTTP client."
      ],
      ma: {
        ten: "Kiểm tra nhanh một tiến trình nghi rò rỉ",
        noi: [
          "PID=$(pgrep -f myapp | head -1)",
          "ls /proc/$PID/fd | wc -l                          # số file descriptor đang mở",
          "grep 'open files' /proc/$PID/limits               # giới hạn hiện tại",
          "ps -o pid,rss,nlwp,etime -p $PID                  # RSS (KB), số thread, thời gian đã chạy",
          "ss -tan | awk '{print $1}' | sort | uniq -c | sort -rn   # phân bố trạng thái kết nối (CLOSE_WAIT? TIME_WAIT?)"
        ]
      },
      lenh: [
        ["kubectl top pod -n <ns> --containers", "Memory hiện tại của từng container (so với `limits`)"],
        ["kubectl get pod -n <ns> -o custom-columns=NAME:.metadata.name,RESTARTS:.status.containerStatuses[0].restartCount", "Pod nào restart nhiều"],
        ["ss -s", "Tổng kết nối theo trạng thái"],
        ["lsof -p <pid> | awk '{print $5}' | sort | uniq -c | sort -rn", "Loại file / socket đang mở nhiều nhất"],
        ["cat /proc/<pid>/status | grep -E 'VmRSS|Threads'", "RSS và số thread của tiến trình"]
      ],
      bay: "Đặt lịch restart rồi coi như xong: bạn che giấu nguyên nhân, và khi lưu lượng tăng thì chu kỳ rò rút ngắn lại. Hoặc restart đồng loạt toàn bộ replica cùng lúc làm sập dịch vụ.",
      cv: "TH4 (‘chạy vài ngày thì chậm dần, restart thì hết’). Hãy nối với kinh nghiệm Kotae (workload nặng bộ nhớ, OOMKilled): nêu cách bạn phân biệt spike với rò rỉ bằng đồ thị theo thời gian, và điều bạn bổ sung để phát hiện sớm."
    },

    /* ---------------------------------------------------------- */
    {
      id: "postmortem", ten: "Sau sự cố — postmortem không đổ lỗi, và cách kể sự cố do chính bạn gây ra",
      y: [
        "**Mục tiêu**: học và ngăn tái diễn, **không** đi tìm người để đổ lỗi. Câu hỏi đúng là ‘hệ thống hay quy trình nào cho phép lỗi này xảy ra?’, không phải ‘ai làm?’.",
        "**Cấu trúc**: tóm tắt · tác động (ai, bao lâu, bao nhiêu request / tiền) · **timeline** với giờ chính xác (thay đổi → phát hiện → xác nhận → giảm thiểu → khôi phục) · nguyên nhân gốc và yếu tố góp phần · cái gì làm tốt / chưa tốt / may mắn · **hành động khắc phục** · bài học.",
        "**Các chỉ số nên ghi**: *thời gian phát hiện* (TTD), *thời gian giảm thiểu / khôi phục* (TTM / TTR), phạm vi ảnh hưởng, và **ai phát hiện** — nếu là *khách hàng* chứ không phải monitoring thì có lỗ hổng giám sát cần vá.",
        "**Nguyên nhân gốc khác nguyên nhân trực tiếp**: trực tiếp là ‘deploy bản lỗi’; gốc có thể là ‘không có canary’, ‘không có alarm tự rollback’, ‘staging không giống production’. Dùng **5 Whys** và dừng ở thứ có thể sửa trong hệ thống hay quy trình.",
        "**Hành động tốt phải cụ thể, kiểm chứng được, có người và hạn**, và xếp theo bốn hướng: *phát hiện sớm hơn* (alert), *giảm tác động* (canary, giới hạn blast radius), *khôi phục nhanh hơn* (rollback tự động, runbook), *ngăn xảy ra* (test, review, guardrail). Tránh ‘cẩn thận hơn’ hay ‘nhắc team’ — không ai kiểm chứng được.",
        "**Theo dõi hành động đến khi xong**: postmortem không có người theo dõi hành động thì chỉ là một tài liệu. Chia sẻ rộng để các team khác học.",
        "**Trả lời ‘Bạn từng làm hỏng production chưa?’ (TH10)**: chọn một sự cố thật, có tác động vừa đủ để đáng kể; nói rõ **phần của mình** không đổ cho người khác; kể cách phát hiện và khôi phục; và **điều bạn thay đổi trong hệ thống / quy trình** để người sau không mắc lại (guardrail, kiểm tra tự động, quy trình duyệt). Người phỏng vấn muốn thấy bạn học được gì, không phải bạn không bao giờ sai."
      ],
      ma: {
        ten: "Mẫu postmortem",
        noi: [
          "# Postmortem — <tên sự cố> — <ngày>",
          "Mức độ: SEV? | Ảnh hưởng: hh:mm → hh:mm (<n> phút) | Phát hiện bởi: monitoring / người dùng",
          "",
          "## Tóm tắt (2–3 câu)",
          "## Tác động: ai bị ảnh hưởng, bao nhiêu request / người dùng / tiền",
          "## Timeline (giờ chính xác)",
          "  hh:mm  Thay đổi X được triển khai",
          "  hh:mm  Alert Y kích hoạt / người dùng báo",
          "  hh:mm  Xác nhận, phân vai",
          "  hh:mm  Giảm thiểu (rollback / scale / tắt flag)",
          "  hh:mm  Khôi phục, xác minh",
          "## Nguyên nhân gốc (5 Whys) và yếu tố góp phần",
          "## Làm tốt / Chưa tốt / May mắn",
          "## Hành động: [việc] — [người phụ trách] — [hạn] — [ưu tiên]",
          "## Bài học"
        ]
      },
      bay: "Postmortem kết luận ‘lỗi do con người’ và hành động là ‘nhắc nhở mọi người’: không có thay đổi hệ thống nào nên sự cố sẽ lặp lại. Hoặc viết xong rồi không ai theo dõi hành động.",
      cv: "Bạn đã ‘wrote the infrastructure documentation and provisioning runbooks’ — postmortem và runbook là hai mặt của cùng một thói quen: biến sự cố thành tài liệu và guardrail để người khác (và chính bạn) xử lý nhanh hơn lần sau. Xem TH9, TH10 trong ngân hàng."
    }
  ]
};
