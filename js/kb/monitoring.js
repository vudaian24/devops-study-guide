/* ============================================================
   Trang 6 — Monitoring & Observability
   Dòng Skills trong CV: CloudWatch Logs, Grafana
   Cấu trúc dữ liệu: xem chú thích đầu js/kb.js
   ============================================================ */

const TRANG = {
  id: "monitoring",
  ten: "Monitoring & Observability",
  tomTat: "Phần CV của bạn nói đúng hai thứ: **CloudWatch Logs** và **Grafana**, cộng thói quen triage từ log pipeline và log container tới root cause. Trang này đi từ tư duy (tín hiệu nào đáng đo, cảnh báo thế nào) tới từng công cụ — và nhắc bạn **trung thực về giới hạn** của những gì mình đã thực sự dựng.",
  cvSkill: ["CloudWatch Logs", "Grafana"],

  cv: [
    { nguon: "Skills",
      noi: "Monitoring & Observability: CloudWatch Logs, Grafana" },
    { nguon: "ERC Booking · Migration",
      noi: "…a branch-gated Liquibase migration pipeline that runs as a one-off ECS Fargate task per environment and auto-generates CloudWatch Logs links for failure triage." },
    { nguon: "Tokyo Tech Lab · Hỗ trợ",
      noi: "…served as first-line support for development and release engineers on build and deployment failures, triaging from pipeline and container logs through to root cause." },
    { nguon: "Kotae · Kubernetes",
      noi: "…diagnosed pod-level incidents with kubectl — OOMKilled containers, CrashLoopBackOff, failing probes — and tuned resource requests, limits, and probe thresholds." },
    { nguon: "Self-managed deployment",
      noi: "…with a manual rollback path redeploying any earlier tag, and outcomes reported to Telegram." }
  ],

  bank: ["Monitoring", "Tình huống"],

  muc: [
    /* ---------------------------------------------------------- */
    {
      id: "nen-tang", ten: "Nền tảng — đo cái gì và vì sao",
      y: [
        "**Monitoring** trả lời ‘hệ thống có ổn không?’ bằng những thứ bạn biết trước cần đo; **observability** là khả năng trả lời câu hỏi *chưa biết trước* (‘vì sao request của tenant X chậm?’) từ dữ liệu hệ thống tự phát ra.",
        "**Ba trụ**: *metrics* (số liệu theo thời gian — rẻ, hợp cảnh báo và xu hướng), *logs* (sự kiện chi tiết — hợp tìm nguyên nhân), *traces* (đường đi của một request qua nhiều service — hợp tìm nút thắt). CV của bạn mạnh ở **logs** (CloudWatch Logs) và phần hiển thị (Grafana).",
        "**Four Golden Signals** (Google SRE): *Latency*, *Traffic*, *Errors*, *Saturation*. **RED** cho service (Rate, Errors, Duration), **USE** cho tài nguyên (Utilization, Saturation, Errors).",
        "**SLI / SLO / error budget**: SLI là chỉ số đo (vd tỷ lệ request thành công), SLO là mục tiêu (99,9% trong 30 ngày), error budget là phần được phép lỗi — dùng để quyết định khi nào dừng ship tính năng để lo độ tin cậy.",
        "**Dùng percentile, đừng dùng trung bình** cho latency: trung bình che mất đuôi chậm. ‘Dashboard xanh mà người dùng kêu chậm’ nghĩa là đang đo sai thứ (đo ở server chứ không phải trải nghiệm người dùng, hoặc đo trung bình).",
        "**Cardinality**: gắn quá nhiều giá trị khác nhau (user id, request id) vào nhãn metric làm chi phí và hiệu năng nổ tung — id chi tiết thuộc về log / trace, không phải nhãn metric.",
        "**Correlation / request ID**: sinh ở rìa hệ thống (Nginx, ALB), truyền xuống mọi service và ghi vào mọi dòng log → lần theo một request xuyên suốt.",
        "**Log có cấu trúc (JSON)** với các trường nhất quán (`level`, `service`, `tenant`, `request_id`, `duration_ms`) giúp lọc, tổng hợp và cảnh báo thay vì grep chuỗi.",
        "**Multi-tenant**: gắn `tenant` vào log / metric (có kiểm soát cardinality) để trả lời ‘tenant nào bị ảnh hưởng’ và tách chi phí, mức dùng."
      ],
      bay: "Liệt kê tên công cụ (Prometheus, Loki, Datadog…) mà không nói được *tín hiệu nào* quan trọng và *vì sao*. Giá trị nằm ở tư duy, không nằm ở tên tool.",
      cv: "‘Triaging from pipeline and container logs through to root cause’ — nền tảng ở đây là thói quen đọc log có phương pháp. Hãy nói rõ bạn đang monitor gì thật sự (CloudWatch Logs, Grafana) và phần chưa làm (metrics / tracing đầy đủ) — trung thực về giới hạn an toàn hơn nói quá."
    },

    /* ---------------------------------------------------------- */
    {
      id: "cloudwatch-logs", ten: "CloudWatch Logs",
      y: [
        "**Cấu trúc**: *log group* (thường mỗi service / môi trường một group — nơi đặt retention, quyền, mã hoá) → *log stream* (một nguồn: một task / pod / instance) → *log event* (một dòng log kèm timestamp).",
        "**Retention mặc định là ‘never expire’** → log tích tụ mãi và tốn phí; đặt retention theo nhu cầu (vd 14 / 30 / 90 ngày) cho từng group, xuất sang S3 nếu cần lưu lâu hơn.",
        "**Nguồn log**: ECS dùng driver `awslogs` (`awslogs-group`, `awslogs-region`, `awslogs-stream-prefix`) → stream tên `prefix/container-name/task-id`; EC2 / host dùng CloudWatch Agent; Lambda tự ghi; EKS dùng Fluent Bit hoặc agent.",
        "**Logs Insights**: ngôn ngữ truy vấn tương tác — `fields`, `filter`, `parse`, `stats … by bin(5m)`, `sort`, `limit`. Với log **JSON**, các trường được tự nhận (không cần `parse`). Mặc định trả tối đa 1.000 dòng (dùng `limit`, tối đa 10.000, hoặc `stats` để tổng hợp). Truy vấn tính phí theo **dữ liệu quét** → thu hẹp khoảng thời gian và số log group.",
        "**Metric filter**: biến log thành metric (đếm dòng `ERROR`, trích một con số) → gắn **alarm** → thông báo qua SNS. Cách nhanh để cảnh báo từ log khi chưa có hệ metric riêng.",
        "**Subscription filter**: đẩy log gần thời gian thực sang Lambda / Kinesis / Firehose / OpenSearch để xử lý, lưu dài hạn hoặc gửi sang hệ khác.",
        "**Chi phí** = *ingest* + *lưu trữ* + *query quét*. Nguồn tốn nhất thường là log debug dư thừa và log của load balancer / WAF. Giảm bằng mức log hợp lý, sampling, retention ngắn, log class *Infrequent Access* cho log ít truy vấn.",
        "**Quyền và bảo mật**: giới hạn ai đọc được log group (log có thể chứa dữ liệu nhạy cảm); mã hoá KMS nếu cần; **không ghi secret / dữ liệu cá nhân** vào log.",
        "**Link tới log để triage** (CV): URL console có dạng `…/cloudwatch/home?region=<r>#logsV2:log-groups/log-group/<group>/log-events/<stream>`, trong đó dấu `/` của tên group / stream được mã hoá đặc biệt (vd `$252F`) — copy một URL mẫu từ console rồi thay phần tử thay vì đoán. Với task ECS one-off, stream là `prefix/container/task-id` nên pipeline có thể **tự ghép link** từ task ARN khi migration fail."
      ],
      ma: {
        ten: "Logs Insights — vài truy vấn dùng hằng ngày",
        noi: [
          "# 50 dòng lỗi mới nhất",
          "fields @timestamp, @message",
          "| filter @message like /ERROR|Exception/",
          "| sort @timestamp desc",
          "| limit 50",
          "",
          "# Số lỗi theo 5 phút (log JSON có trường level)",
          'filter level = "error"',
          "| stats count() as errors by bin(5m)",
          "",
          "# p95 độ trễ theo endpoint (log JSON có duration_ms, path)",
          "stats pct(duration_ms, 95) as p95, count() as n by path",
          "| sort p95 desc",
          "| limit 20",
          "",
          "# Lần theo một request qua nhiều log group",
          "fields @timestamp, @log, @message",
          '| filter request_id = "abc-123"',
          "| sort @timestamp asc"
        ]
      },
      lenh: [
        ["aws logs tail <group> --follow --since 15m --filter-pattern ERROR", "Theo dõi log trực tiếp, lọc theo pattern"],
        ["aws logs describe-log-groups --query 'logGroups[?retentionInDays==null].logGroupName'", "Log group chưa đặt retention (không bao giờ hết hạn)"],
        ["aws logs put-retention-policy --log-group-name <g> --retention-in-days 30", "Đặt retention"],
        ["aws logs start-query --log-group-name <g> --start-time <epoch> --end-time <epoch> --query-string '<query>'", "Chạy Logs Insights từ CLI"],
        ["aws logs get-query-results --query-id <id>", "Lấy kết quả query"],
        ["aws logs put-metric-filter --log-group-name <g> --filter-name errors --filter-pattern ERROR --metric-transformations metricName=Errors,metricNamespace=App,metricValue=1", "Biến dòng log lỗi thành metric"]
      ],
      bay: "Để log group ở ‘never expire’ cùng log debug bật ở production: hoá đơn tăng dần mà không ai để ý. Và đừng log nguyên body request chứa dữ liệu cá nhân.",
      cv: "‘Auto-generates CloudWatch Logs links for failure triage’ cho Liquibase migration. Chuẩn bị giải thích cách ghép link (region, log group, stream từ task ID), vì sao việc đó rút ngắn thời gian triage, và log group này đặt retention bao lâu."
    },

    /* ---------------------------------------------------------- */
    {
      id: "grafana", ten: "Grafana",
      y: [
        "**Grafana là lớp hiển thị và cảnh báo**, không tự lưu dữ liệu: nó truy vấn các **data source** (CloudWatch, Prometheus, Loki, Elasticsearch, SQL…) rồi vẽ lên dashboard. Một dashboard có thể trộn nhiều nguồn.",
        "**Data source CloudWatch**: dùng IAM role / credential để đọc **metrics** và **Logs Insights**; cấp quyền tối thiểu đúng tài nguyên (`cloudwatch:GetMetricData`, `logs:StartQuery`, `logs:GetQueryResults`…). Đây là cách Grafana vẽ được dữ liệu AWS.",
        "**Dashboard** gồm *panel* (time series, stat, gauge, table, logs…), *row*, *time range*, và **biến** (`$env`, `$tenant`, `$service`) để một dashboard dùng cho nhiều môi trường / tenant — đừng nhân bản dashboard cho từng cái.",
        "**Explore** để điều tra tự do (không cần dựng dashboard); **annotations** đánh dấu mốc deploy trên đồ thị để thấy ngay ‘lỗi bắt đầu sau lần deploy nào’.",
        "**Dashboard tốt**: trên cùng là sức khoẻ tổng thể (golden signals / SLO), sau đó đi sâu theo thành phần; mỗi panel trả lời một câu hỏi; đơn vị và ngưỡng rõ ràng; tránh ‘bức tường biểu đồ’ không ai hiểu.",
        "**Grafana Alerting**: *alert rule* (truy vấn + điều kiện + khoảng `for`) → *contact point* (email, Slack, Telegram, webhook…) qua *notification policy* (định tuyến theo nhãn, gom nhóm, mute timing).",
        "**Provisioning**: khai báo data source, dashboard, alert bằng file YAML / JSON (hoặc Terraform provider) và để trong Git → dựng lại được, review được, tránh ‘dashboard ai sửa tay không ai biết’.",
        "**Quản trị**: org / folder / team + role (Viewer, Editor, Admin), tắt anonymous access, bật SSO nếu có; bảo vệ trang quản trị vì Grafana đọc được dữ liệu nhạy cảm.",
        "**Hiệu năng và chi phí**: truy vấn nặng hoặc khoảng thời gian dài làm dashboard chậm và tốn tiền (CloudWatch tính phí theo số lượt gọi API / metric) — dùng `min interval`, giới hạn series, cache."
      ],
      ma: {
        ten: "Provisioning data source CloudWatch (file YAML)",
        noi: [
          "# provisioning/datasources/cloudwatch.yaml",
          "apiVersion: 1",
          "datasources:",
          "  - name: CloudWatch",
          "    type: cloudwatch",
          "    jsonData:",
          "      authType: default              # dùng IAM role của máy / task đang chạy Grafana",
          "      defaultRegion: ap-southeast-1"
        ]
      },
      lenh: [
        ["curl -s http://<grafana>:3000/api/health", "Kiểm tra Grafana đang sống"],
        ["Dashboard → Settings → JSON Model", "Xuất dashboard để lưu vào Git / provisioning"],
        ["Explore → CloudWatch Logs", "Điều tra tự do với Logs Insights ngay trong Grafana"],
        ["Alerting → Alert rules / Contact points / Notification policies", "Ba chỗ cần kiểm tra khi cảnh báo không tới nơi"]
      ],
      bay: "Sửa dashboard tay trực tiếp trên UI ở production rồi mất dấu khi dựng lại Grafana. Hoặc cấu hình cảnh báo xong nhưng contact point sai nên không ai nhận được — hãy **test cảnh báo** định kỳ.",
      cv: "Grafana nằm trong Skills ‘Monitoring & Observability’. Chuẩn bị nói rõ: dashboard bạn dựng cho ai (dev, vận hành, quản lý), nguồn dữ liệu là gì, có cảnh báo qua Grafana không, và một ví dụ dashboard thực sự giúp phát hiện hoặc điều tra sự cố."
    },

    /* ---------------------------------------------------------- */
    {
      id: "dieu-tra-log", ten: "Quy trình điều tra bằng log",
      y: [
        "**Khung điều tra**: (1) *Phạm vi* — ai, chức năng nào, môi trường nào, từ khi nào? (2) *Khung thời gian* — mốc bắt đầu, đối chiếu với deploy / thay đổi. (3) *Lỗi đầu tiên* — tìm dòng lỗi **sớm nhất**, không phải lỗi cuối. (4) *Liên kết* — dùng request / trace ID đi qua các service. (5) *Giả thuyết → kiểm chứng* — mỗi lần chỉ đổi một thứ.",
        "**Ba tầng log của một sự cố triển khai**: log pipeline (bước nào fail) → log container (vì sao) → log nền tảng (ECS events, `kubectl describe`, CloudTrail — môi trường đang ra sao).",
        "**Container**: `docker logs --since 10m --tail 200 -f`; Kubernetes: `kubectl logs -f -l app=api --since=10m --all-containers --prefix`, **`--previous`** cho container đã restart; ECS: `aws logs tail`, hoặc `describe-tasks` để xem `stoppedReason` / exit code.",
        "**Log trống ≠ không có sự cố**: process bị SIGKILL (OOM) không kịp ghi log; app lỗi trước khi logger sẵn sàng; log đẩy sai group; mức log quá cao. Đối chiếu bằng metric hoặc `describe` thay vì chỉ tin log.",
        "**Phân loại lỗi từ mẫu log**: kết nối (timeout, connection refused, DNS), xác thực / quyền (401, 403, AccessDenied), tài nguyên (OOM, disk full, too many open files), logic (exception stack), phụ thuộc ngoài (5xx từ API / Bedrock, throttle).",
        "**Đếm trước khi đọc**: `stats count() by bin(5m)` cho thấy *khi nào* lỗi tăng, rồi mới đọc mẫu. Tìm quy luật: một tenant? một endpoint? một AZ? sau deploy?",
        "**Ghi timeline** (giờ, hành động, kết quả) ngay trong lúc xử lý — làm tư liệu cho postmortem và để người khác tiếp quản được.",
        "**Sau sự cố**: bổ sung log / metric còn thiếu (thứ bạn *ước gì* đã có lúc điều tra), cảnh báo sớm hơn, và runbook. ‘Thêm chỉ số đo đúng’ là một phần của khắc phục."
      ],
      lenh: [
        ["docker logs --since 10m --tail 200 -f <container>", "Log container Docker, thu hẹp theo thời gian"],
        ["kubectl logs -f -l app=api --since=10m --all-containers --prefix", "Log nhiều pod theo label"],
        ["kubectl logs <pod> --previous", "Log của lần chết trước"],
        ["aws logs tail /ecs/<service> --follow --since 30m", "Log ECS gần thời gian thực"],
        ["aws ecs describe-tasks --cluster <c> --tasks <id> --query 'tasks[0].[stoppedReason,containers[].exitCode]'", "Task chết vì sao"],
        ["journalctl -u <svc> --since '30 min ago' -p warning", "Log dịch vụ systemd, từ mức cảnh báo trở lên"],
        ["grep -m1 -n -iE 'error|exception|fatal' build.log", "Dòng lỗi ĐẦU TIÊN trong log pipeline dài"]
      ],
      bay: "Đọc từ cuối log và sửa theo dòng lỗi cuối cùng — thường chỉ là hệ quả của lỗi sớm hơn. Hoặc kết luận ‘không có lỗi’ chỉ vì log rỗng.",
      cv: "Khớp với ‘triaging from pipeline and container logs through to root cause’. Chuẩn bị kể **một ca**: tín hiệu ban đầu → log nào đọc đầu tiên → điều giúp bạn loại trừ giả thuyết → nguyên nhân → bạn bổ sung gì để lần sau phát hiện sớm hơn (xem C4, TH5 trong ngân hàng)."
    },

    /* ---------------------------------------------------------- */
    {
      id: "alert-dashboard", ten: "Thiết kế cảnh báo và thông báo",
      y: [
        "**Cảnh báo theo *triệu chứng người dùng cảm nhận*, không theo nguyên nhân**: tỷ lệ lỗi tăng hay latency p95 vượt ngưỡng đáng gọi người dậy lúc 2h sáng; CPU 90% thì chưa chắc.",
        "**Mọi alert phải dẫn tới hành động**; không ai hành động theo thì xoá hoặc hạ xuống mức thông tin. Phân ba mức: **page** (cần xử lý ngay), **ticket** (trong giờ làm việc), **thông tin** (dashboard).",
        "**Chống nhiễu**: khoảng `for` (điều kiện kéo dài X phút mới báo), gom nhóm (grouping), ức chế (inhibition: node chết thì không báo từng service trên node đó), silence khi bảo trì; ưu tiên ngưỡng theo phần trăm / burn rate thay vì con số tuyệt đối khi có thể.",
        "**Mỗi alert kèm runbook** (link) và **ngữ cảnh** (môi trường, tenant, link dashboard / log) — người nhận biết phải làm gì trong 30 giây đầu.",
        "**Đặt ngưỡng cảnh báo sớm hơn ngưỡng sự cố** (disk báo ở 80% chứ không phải 95%) để còn thời gian hành động.",
        "**Giám sát chính hệ thống cảnh báo**: kiểm tra định kỳ rằng thông báo thật sự tới nơi (test), và giám sát cả job backup / pipeline — *im lặng không có nghĩa là khoẻ*.",
        "**Kênh thông báo**: Telegram / Slack / email / công cụ on-call; tách kênh theo mức độ; **bảo vệ token của bot** (secret, không commit) và giới hạn tần suất để kênh không bị spam. Báo **kết quả deploy** (thành công / thất bại, version, link run) vào kênh vận hành giúp cả đội thấy tình trạng ngay.",
        "**Rà soát hằng tháng**: cảnh báo nào kêu nhiều mà không ai làm gì thì sửa hoặc xoá. 200 cảnh báo mỗi ngày nghĩa là không còn cảnh báo nào."
      ],
      bang: {
        ten: "Ba mức cảnh báo",
        cot: ["Mức", "Khi nào", "Ví dụ", "Kênh"],
        hang: [
          ["**Page**", "Người dùng đang bị ảnh hưởng hoặc sắp bị", "Tỷ lệ 5xx > 2% trong 5 phút; production down", "Gọi / push cho người trực"],
          ["**Ticket**", "Cần xử lý nhưng chưa khẩn", "Disk 80%; certificate hết hạn trong 14 ngày; DLQ có message", "Ticket / kênh vận hành"],
          ["**Thông tin**", "Chỉ để tham khảo, xem xu hướng", "Số lần deploy; CPU trung bình", "Dashboard"]
        ]
      },
      bay: "Cảnh báo CPU / RAM thuần tuý bắn liên tục vào một kênh chung: mọi người dần phớt lờ và bỏ lỡ cảnh báo thật.",
      cv: "Bạn báo kết quả deploy lên Telegram — nối thành câu chuyện ‘thông báo đúng người, đúng lúc, đủ ngữ cảnh’. Và nếu vị trí đòi *xây dựng* monitoring, hãy nói rõ bạn bắt đầu từ triệu chứng người dùng (golden signals) rồi mới tới tài nguyên (xem M1–M5 trong ngân hàng)."
    }
  ]
};
