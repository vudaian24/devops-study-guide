/* ============================================================
   Trang 5 — Cloud (AWS)
   Dòng Skills trong CV: ECS Fargate, EKS, VPC, Aurora, ElastiCache,
   CloudFront/WAF, SQS, SES, IAM, Secrets Manager
   Cấu trúc dữ liệu: xem chú thích đầu js/kb.js
   ============================================================ */

const TRANG = {
  id: "aws",
  ten: "Cloud (AWS)",
  tomTat: "Nền tảng multi-tenant ERC được bạn dựng gần như một mình trên AWS: **VPC → ALB/CloudFront + WAF → ECS Fargate → Aurora + ElastiCache**, cùng SQS, SES, Backup, Bastion. Mỗi mục dưới đây bám theo đúng các dịch vụ liệt kê trong CV — kèm các chi tiết ‘chỉ người làm thật mới biết’.",
  cvSkill: ["ECS Fargate", "EKS", "VPC", "Aurora", "ElastiCache", "CloudFront/WAF", "SQS", "SES", "IAM", "Secrets Manager"],

  cv: [
    { nguon: "ERC Booking · Tổng quan",
      noi: "Clinic scheduling platform architected for per-tenant isolation; sole owner of its infrastructure and deployment pipelines. Tech: Terraform · AWS (ECS Fargate, Aurora, ElastiCache, CloudFront, WAF, SQS, SES, Backup) · GitHub Actions · Docker · Liquibase." },
    { nguon: "ERC Booking · Terraform",
      noi: "Owned the Terraform codebase end to end: 151 resources across 22 reusable modules (VPC, ECS Fargate, Aurora PostgreSQL, ElastiCache, CloudFront + WAF, SQS, SES, Backup, Bastion)." },
    { nguon: "ERC Booking · Rollout",
      noi: "Built the GitHub Actions rollout pipeline that patches ECS task definitions, registers revisions, and rolls out API/worker services with stability checks, old-revision cleanup, and path-based selective builds." },
    { nguon: "ERC Booking · Frontend",
      noi: "Authored the S3 + CloudFront release pipeline for the frontend, using immutable cache-control on hashed assets with targeted invalidation for zero-downtime SPA deploys." },
    { nguon: "Kotae · AWS",
      noi: "Production AI workload… generation backed by AWS Bedrock, OpenAI, and Gemini… Contributed Terraform for the service’s Cognito and S3 resources." },
    { nguon: "Skills",
      noi: "Cloud (AWS): ECS Fargate, EKS, VPC, Aurora, ElastiCache, CloudFront/WAF, SQS, SES, IAM, Secrets Manager" }
  ],

  bank: ["ERC Booking", "Backup & DR", "Networking"],

  muc: [
    /* ---------------------------------------------------------- */
    {
      id: "vpc", ten: "VPC và mạng",
      y: [
        "**VPC** là mạng ảo riêng trong một Region, chia thành **subnet** theo AZ. Subnet **public** có route `0.0.0.0/0` tới Internet Gateway; **private** đi ra internet qua NAT Gateway (không cho kết nối từ ngoài vào); **isolated** không có route ra internet (hợp cho database).",
        "**Ba lớp subnet** thường dùng: public (ALB, NAT), private (ECS task / EKS node), isolated (Aurora, ElastiCache). Mỗi lớp trải ít nhất 2 AZ để chịu được mất một AZ.",
        "**Route table** quyết định đường đi; mỗi subnet gắn với đúng một route table. **IGW** là cổng hai chiều cho thứ có public IP; **NAT Gateway** chỉ cho đi RA — nên đặt **mỗi AZ một cái** cho HA và nhớ chi phí (theo giờ + theo GB xử lý) — thường là khoản tốn bất ngờ.",
        "**Security Group** là firewall *stateful* gắn vào ENI, chỉ có rule allow, tham chiếu được SG khác (vd DB chỉ nhận từ SG của app). **NACL** là *stateless* ở mức subnet, có cả allow và deny theo thứ tự — ít dùng, chỉ để chặn thô.",
        "**VPC Endpoint**: *Gateway endpoint* (S3, DynamoDB — miễn phí, qua route table) và *Interface endpoint* (PrivateLink — ECR, Secrets Manager, CloudWatch Logs, SSM, Bedrock… — tính phí theo giờ + GB). Giúp task ở private subnet gọi dịch vụ AWS mà không qua NAT hay internet: an toàn hơn và giảm chi phí NAT.",
        "**Vào mạng riêng để thao tác**: Bastion host ở public subnet (SSH, giới hạn IP) hoặc, nên ưu tiên, **SSM Session Manager** (không mở cổng 22, không cần public IP, có audit). Chi tiết ở trang *Case thực tế*.",
        "**ALB (L7)** route theo host / path, tích hợp WAF, terminate TLS bằng ACM; **NLB (L4)** cho TCP / UDP, giữ IP nguồn, độ trễ thấp. Target group + health check quyết định target nào nhận traffic.",
        "**DNS**: Route 53 (alias record trỏ tới ALB / CloudFront); private hosted zone cho tên nội bộ; VPC cần bật DNS resolution / hostnames để dùng endpoint của RDS / Aurora bằng tên.",
        "**Thiết kế CIDR**: chọn dải không chồng lấn với mạng khác (peering, VPN, on-prem) và chừa đủ địa chỉ — đổi CIDR sau này rất đau. Mỗi task Fargate (awsvpc) chiếm một IP trong subnet."
      ],
      bang: {
        ten: "Security Group và Network ACL",
        cot: ["", "Security Group", "Network ACL"],
        hang: [
          ["Phạm vi", "Gắn vào ENI (instance, task, LB)", "Gắn vào subnet"],
          ["Trạng thái", "Stateful — chiều về tự được phép", "Stateless — phải mở cả chiều về (cổng ephemeral)"],
          ["Rule", "Chỉ allow", "Allow và deny, đánh số thứ tự"],
          ["Tham chiếu", "Tham chiếu được SG khác", "Chỉ CIDR"]
        ]
      },
      lenh: [
        ["aws ec2 describe-subnets --filters Name=vpc-id,Values=<vpc> --query 'Subnets[].[SubnetId,AvailabilityZone,CidrBlock,MapPublicIpOnLaunch]' --output table", "Liệt kê subnet theo VPC"],
        ["aws ec2 describe-route-tables --filters Name=association.subnet-id,Values=<subnet>", "Route table của một subnet: có IGW / NAT không"],
        ["aws ec2 describe-security-groups --group-ids <sg>", "Rule của một SG"],
        ["aws ec2 describe-nat-gateways --filter Name=vpc-id,Values=<vpc>", "NAT Gateway trong VPC"],
        ["aws ec2 describe-vpc-endpoints --query 'VpcEndpoints[].[ServiceName,VpcEndpointType]'", "Endpoint đang có"],
        ["aws ec2 describe-network-interfaces --filters Name=group-id,Values=<sg>", "Ai đang dùng SG này (task, LB, DB…)"]
      ],
      bay: "Đặt database ở public subnet ‘cho tiện kết nối’ rồi chỉ dựa vào SG: một sai sót ở SG là database lộ ra internet. Database thuộc isolated subnet, không có route ra ngoài.",
      cv: "Terraform của bạn có module VPC và Bastion. Chuẩn bị vẽ lại: bao nhiêu AZ, subnet nào cho ALB / NAT / ECS / Aurora, ai nói chuyện được với ai (chuỗi SG), và database có route ra internet không (xem N4, N5, E1 trong ngân hàng)."
    },

    /* ---------------------------------------------------------- */
    {
      id: "ecs", ten: "ECS Fargate",
      y: [
        "**Khái niệm**: *cluster* → *service* (giữ số task mong muốn, gắn LB, rolling update) → *task* (một lần chạy của *task definition* — mô tả image, CPU / memory, cổng, biến môi trường, log, role). Mỗi lần `register-task-definition` sinh một **revision** mới.",
        "**Fargate** là serverless cho container: không quản lý EC2; chọn CPU / memory theo các cặp hợp lệ; mạng luôn là **`awsvpc`** (mỗi task một ENI, một IP, và security group riêng). **EC2 launch type** thì tự quản node: rẻ hơn ở quy mô lớn nhưng thêm việc vận hành.",
        "**Hai role dễ nhầm**: **task execution role** do *ECS agent* dùng để kéo image từ ECR, ghi log, lấy secret lúc khởi động; **task role** do *code trong container* dùng để gọi dịch vụ AWS (S3, SQS…). Thiếu quyền kéo secret / ghi log → lỗi ở execution role; app báo AccessDenied → task role.",
        "**Rolling update** theo `deploymentConfiguration`: `minimumHealthyPercent` / `maximumPercent` (mặc định 100 / 200 — chạy task mới trước rồi mới tắt task cũ). Task mới phải qua **health check của ALB target group** (cộng `healthCheckGracePeriodSeconds` cho app khởi động chậm) thì task cũ mới bị dừng.",
        "**Deployment circuit breaker** (`enable` + `rollback`): nếu task mới liên tục fail, ECS dừng deployment và quay về revision ổn định trước đó. Chưa bật thì rollout lỗi có thể kẹt rất lâu — nếu chưa bật hãy nói thật và nói bạn sẽ bật.",
        "**Graceful shutdown**: ECS gửi SIGTERM, đợi `stopTimeout` (mặc định 30s) rồi SIGKILL; phía ALB có `deregistration_delay` (mặc định 300s) để drain kết nối — chỉnh cho khớp thời gian xử lý request.",
        "**Log**: driver `awslogs` đẩy stdout / stderr vào CloudWatch Logs (`awslogs-group`, `awslogs-stream-prefix`); tên stream có dạng `prefix/container-name/task-id`.",
        "**Secret**: khai `secrets: [{ name, valueFrom: <ARN Secrets Manager hoặc SSM> }]` — ECS tiêm vào biến môi trường **lúc task khởi động**, nên đổi secret xong phải **chạy lại task** (deployment mới).",
        "**Autoscaling**: Application Auto Scaling với target tracking (CPU, memory, `ALBRequestCountPerTarget`), hoặc theo độ dài queue SQS cho worker.",
        "**Việc chạy một lần** (migration, script quản trị): `run-task` với task definition riêng hoặc `--overrides` ghi đè command — cùng VPC / subnet / SG nên chạm được database trong mạng riêng. **ECS Exec** (`execute-command`) để vào container đang chạy (cần `enableExecuteCommand` + quyền SSM).",
        "**Rollback**: `update-service --task-definition <family>:<revision cũ>`; revision cũ còn nguyên nên rollback nhanh — miễn là schema database còn tương thích."
      ],
      lenh: [
        ["aws ecs describe-services --cluster <c> --services <s> --query 'services[0].[deployments,events[:5]]'", "Deployment đang chạy và 5 sự kiện mới nhất — chỗ đầu tiên nhìn khi rollout kẹt"],
        ["aws ecs list-tasks --cluster <c> --service-name <s> --desired-status STOPPED", "Các task vừa chết"],
        ["aws ecs describe-tasks --cluster <c> --tasks <arn> --query 'tasks[0].[stoppedReason,containers[].[name,exitCode,reason]]'", "Vì sao task dừng: OOM, health check, lỗi pull image…"],
        ["aws ecs wait services-stable --cluster <c> --services <s>", "Chờ rollout ổn định (mặc định tối đa ~10 phút)"],
        ["aws ecs update-service --cluster <c> --service <s> --task-definition <family>:<rev>", "Rollback / chuyển revision"],
        ["aws ecs update-service --cluster <c> --service <s> --force-new-deployment", "Chạy lại với cùng task definition (kéo lại tag, nạp lại secret)"],
        ["aws ecs execute-command --cluster <c> --task <id> --container <name> --interactive --command sh", "Vào container đang chạy (ECS Exec)"],
        ["aws logs tail <log-group> --follow --since 15m", "Theo dõi log của task"]
      ],
      bay: [
        "Tưởng đổi giá trị trong Secrets Manager là app lấy được ngay: ECS chỉ nạp secret lúc task khởi động. Phải `--force-new-deployment` (hoặc rollout mới).",
        "Không bật circuit breaker: task mới lặp ‘start → fail health check → bị thay thế’ và rollout chạy mãi mà không tự rollback."
      ],
      cv: "‘Patches ECS task definitions, registers revisions, and rolls out API/worker services with stability checks, old-revision cleanup’. Chuẩn bị: min / max percent đang đặt, health check ALB ra sao, circuit breaker đã bật chưa, và bạn dọn revision cũ bằng cách nào (xem E4 trong ngân hàng)."
    },

    /* ---------------------------------------------------------- */
    {
      id: "eks", ten: "EKS và so sánh với ECS",
      y: [
        "**EKS = control plane Kubernetes do AWS quản lý** (API server, etcd, scheduler trải nhiều AZ); bạn lo **node** (managed node group, Fargate profile hoặc Karpenter) và workload.",
        "**AWS ↔ Kubernetes**: cluster nằm trong VPC của bạn; pod nhận IP từ subnet qua **VPC CNI** (nên IP của subnet là tài nguyên phải tính); Service `LoadBalancer` / Ingress tạo ELB nhờ **AWS Load Balancer Controller**.",
        "**Quyền cho pod gọi AWS API**: **IRSA** (IAM Roles for Service Accounts, dựa OIDC) hoặc **EKS Pod Identity** — mỗi ServiceAccount một IAM role, thay vì cấp quyền cho cả node.",
        "**Quyền cho người vào cluster**: *access entries* (cách hiện tại) hoặc ConfigMap `aws-auth` (cách cũ) ánh xạ IAM principal ↔ Kubernetes RBAC; lấy kubeconfig bằng `aws eks update-kubeconfig`.",
        "**Add-on** do EKS quản lý: `vpc-cni`, `coredns`, `kube-proxy`, `aws-ebs-csi-driver` (PersistentVolume trên EBS).",
        "**Nâng cấp**: mỗi lần một minor version (control plane trước, sau đó node và add-on); kiểm tra API bị gỡ (deprecation), PodDisruptionBudget, thử ở môi trường thấp. Phiên bản cũ hết hỗ trợ chuẩn sẽ bị tính phí hỗ trợ mở rộng rồi bị nâng cấp cưỡng bức.",
        "**Autoscaling node**: Cluster Autoscaler hoặc Karpenter; pod `Pending` vì thiếu tài nguyên là tín hiệu để thêm node."
      ],
      bang: {
        ten: "ECS Fargate hay EKS",
        cot: ["", "ECS Fargate", "EKS"],
        hang: [
          ["Độ phức tạp", "Thấp — ít khái niệm, tích hợp sâu AWS", "Cao — Kubernetes đầy đủ"],
          ["Vận hành", "Gần như không có node / control plane để lo", "Phải lo node, add-on, nâng cấp phiên bản"],
          ["Hệ sinh thái", "Riêng của AWS", "Chuẩn Kubernetes: Helm, operator, công cụ đa cloud"],
          ["Tính portable", "Thấp", "Cao"],
          ["Chi phí", "Trả theo vCPU / GB của task; không phí control plane", "Phí control plane + chi phí node"],
          ["Hợp khi", "Ít service, đội nhỏ, muốn đơn giản", "Nhiều service / đội, cần hệ sinh thái K8s, đa cloud hoặc on-prem"]
        ]
      },
      lenh: [
        ["aws eks update-kubeconfig --name <cluster> --region <region>", "Lấy kubeconfig để dùng kubectl"],
        ["aws eks describe-cluster --name <cluster> --query 'cluster.[version,status,endpoint]'", "Phiên bản, trạng thái, endpoint"],
        ["aws eks list-addons --cluster-name <cluster>", "Add-on đang cài"],
        ["kubectl get nodes -o wide", "Node, phiên bản, IP"],
        ["kubectl describe sa <name> -n <ns>", "Annotation IAM role gắn với ServiceAccount (IRSA)"]
      ],
      bay: "Cấp quyền AWS cho cả node (instance profile) thay vì cho từng ServiceAccount: mọi pod trên node thừa hưởng quyền đó.",
      cv: "EKS có trong dòng Skills và Kotae chạy Kubernetes + Helm. Sẵn sàng nói rõ: workload Kotae chạy trên cluster nào, bạn tự tay làm phần nào (deploy, vận hành workload) và phần nào do người khác lo (tạo / nâng cấp cluster) — đừng nhận phần mình chưa làm."
    },

    /* ---------------------------------------------------------- */
    {
      id: "aurora-elasticache", ten: "Aurora PostgreSQL và ElastiCache",
      y: [
        "**Aurora** tách *compute* khỏi *storage*: một **cluster** gồm 1 writer + tối đa 15 reader dùng chung một volume storage tự nhân bản **6 bản trên 3 AZ**, tự mở rộng tới 128 TiB. Reader gần như không có replication lag vì dùng chung storage.",
        "**Endpoint**: *cluster endpoint* (luôn trỏ tới writer), *reader endpoint* (cân bằng giữa các reader), *instance endpoint*. Ghi dùng cluster endpoint, truy vấn đọc nặng dùng reader endpoint.",
        "**Failover**: writer lỗi → Aurora promote một reader (thường dưới ~1 phút); **không có reader** thì phải dựng instance mới → lâu hơn. Ứng dụng cần **retry / reconnect** và DNS TTL thấp.",
        "**Backup**: liên tục và tự động, **PITR** trong khoảng retention 1–35 ngày; snapshot thủ công tồn tại tới khi bạn xoá. **Restore luôn tạo cluster MỚI** (endpoint mới), không ghi đè cluster cũ.",
        "**Bảo mật**: đặt ở **isolated subnet**, SG chỉ nhận từ SG của app; mã hoá at-rest bằng KMS (**phải bật lúc tạo**); `rds.force_ssl`; mật khẩu master do Secrets Manager quản lý (`manage_master_user_password`); IAM database authentication nếu phù hợp; `deletion_protection` + final snapshot.",
        "**Cấu hình**: *cluster parameter group* khác *instance parameter group*; tham số tĩnh cần reboot mới có hiệu lực. **RDS Proxy** gom connection pool — hợp khi nhiều task / Lambda mở nhiều kết nối ngắn.",
        "**Cạn kết nối**: `max_connections` phụ thuộc kích thước instance; số task × pool size có thể vượt giới hạn khi scale ra → pool nhỏ, PgBouncer hoặc RDS Proxy.",
        "**ElastiCache (Redis / Valkey)**: *replication group* (1 primary + replica, **Multi-AZ automatic failover**), *cluster mode* (shard theo hash slot) để mở rộng ghi và dung lượng; mã hoá at-rest và in-transit (TLS) + AUTH / ACL; snapshot để backup.",
        "**Dùng cache an toàn**: coi cache là *có thể mất*; đặt TTL; chọn `maxmemory-policy` hợp lý (ElastiCache mặc định thường là `volatile-lru` — kiểm tra parameter group); đừng để dữ liệu duy nhất chỉ nằm trong Redis nếu chưa cấu hình bền vững.",
        "**Theo dõi**: `CPUUtilization`, `FreeableMemory`, `DatabaseConnections`, `ReplicaLag`, `Evictions`, `CacheHitRate`."
      ],
      lenh: [
        ["aws rds describe-db-clusters --db-cluster-identifier <id> --query 'DBClusters[0].[Status,Endpoint,ReaderEndpoint,BackupRetentionPeriod,DeletionProtection]'", "Trạng thái, endpoint, retention, bảo vệ xoá"],
        ["aws rds describe-db-cluster-snapshots --db-cluster-identifier <id>", "Snapshot của cluster"],
        ["aws rds restore-db-cluster-to-point-in-time --source-db-cluster-identifier <src> --db-cluster-identifier <new> --restore-to-time <ISO8601>", "PITR → tạo cluster MỚI"],
        ["aws rds failover-db-cluster --db-cluster-identifier <id>", "Diễn tập failover (cẩn thận ở production)"],
        ["aws elasticache describe-replication-groups --replication-group-id <id>", "Trạng thái replication group, Multi-AZ"],
        ["psql \"host=<cluster-endpoint> dbname=<db> user=<u> sslmode=require\"", "Kết nối có TLS"]
      ],
      bay: [
        "Tưởng PITR ghi đè lại cluster hiện tại — thực tế nó tạo cluster mới; phải đổi endpoint (hoặc DNS) và xử lý phần dữ liệu ghi trong lúc đó.",
        "Không bật mã hoá at-rest lúc tạo: muốn bật phải snapshot → copy có mã hoá → restore (kèm downtime)."
      ],
      cv: "Aurora PostgreSQL và ElastiCache nằm trong 22 module của bạn. Sẵn sàng: bao nhiêu reader, subnet group, backup retention đặt bao nhiêu, đã restore thử chưa, và ứng dụng xử lý failover / reconnect thế nào."
    },

    /* ---------------------------------------------------------- */
    {
      id: "edge", ten: "CloudFront, WAF và S3",
      y: [
        "**Đường đi**: người dùng → CloudFront (cache ở edge) → origin: *S3* (SPA tĩnh) hoặc *ALB* (API). WAF gắn vào CloudFront (hoặc ALB) để lọc request trước khi tới origin.",
        "**S3 origin an toàn**: bucket **không public**; CloudFront truy cập qua **OAC** (Origin Access Control, thay cho OAI) — bucket policy chỉ cho đúng distribution đó đọc. Bật Block Public Access.",
        "**Cache**: theo *cache behavior* (path pattern) với *cache policy* (cache key gồm header / query / cookie nào) và *origin request policy*. TTL tôn trọng `Cache-Control` của origin trong giới hạn min / default / max.",
        "**Chiến lược cho SPA**: file có hash trong tên → `Cache-Control: max-age=31536000, immutable`; **`index.html` → `no-cache`** (hoặc TTL ngắn). Deploy = upload asset trước → upload index sau → **invalidate chỉ `/index.html`**. Không cần invalidate `/*`.",
        "**SPA routing**: URL kiểu `/booking/123` không có file thật → S3 trả 403 / 404 → cấu hình *custom error response* 403 / 404 trả về `/index.html` với mã 200.",
        "**Invalidation** có hạn mức miễn phí rồi tính phí theo path, và cần vài phút để lan toàn cầu. Cách tốt hơn là *đổi tên file* (versioned URL).",
        "**ACM cho CloudFront phải ở `us-east-1`**; **WAF scope `CLOUDFRONT` cũng tạo ở `us-east-1`** → trong Terraform cần provider alias (`aws.us_east_1`) cho phần này.",
        "**WAF**: *Web ACL* gồm các rule theo thứ tự ưu tiên: AWS Managed Rule Groups (Common, Known Bad Inputs, SQLi…), rate-based rule chống spam / brute force, rule theo IP / geo. Triển khai **Count trước, Block sau** để không chặn nhầm người dùng thật.",
        "**Log WAF** gửi tới CloudWatch Logs / S3 / Firehose (tên log group phải bắt đầu bằng `aws-waf-logs-`). Đây là nguồn chính để điều tra ‘vì sao người dùng bị chặn’ (false positive).",
        "**Bổ sung**: bắt buộc HTTPS, security headers qua response headers policy, và **chặn truy cập thẳng vào ALB origin** (header bí mật do CloudFront thêm vào, hoặc prefix list của CloudFront trong SG)."
      ],
      lenh: [
        ["aws s3 sync dist/ s3://<bucket> --exclude index.html --cache-control 'public,max-age=31536000,immutable'", "Upload asset có hash TRƯỚC, không gồm index.html (không dùng `--delete` ngay)"],
        ["aws s3 cp dist/index.html s3://<bucket>/index.html --cache-control 'no-cache'", "Upload index SAU CÙNG"],
        ["aws cloudfront create-invalidation --distribution-id <id> --paths /index.html", "Chỉ invalidate file cần thiết"],
        ["aws cloudfront get-distribution-config --id <id>", "Xem origin, behavior, error response, WAF"],
        ["aws wafv2 list-web-acls --scope CLOUDFRONT --region us-east-1", "Web ACL của CloudFront (phải gọi ở us-east-1)"],
        ["curl -sI https://app.example.com/ | grep -iE 'x-cache|cache-control|age'", "Hit / Miss ở edge và header cache"]
      ],
      bay: [
        "Invalidate `/*` sau mỗi lần deploy rồi coi đó là ‘zero-downtime’: lãng phí, và không giải quyết chuyện trình duyệt giữ bản cũ. Cái đúng là versioned asset + invalidate `index.html`.",
        "Xoá asset cũ ngay khi deploy: người dùng đang mở bản index cũ sẽ lỗi 404 khi tải chunk cũ — giữ asset của phiên bản trước một thời gian."
      ],
      cv: "‘Immutable cache-control on hashed assets with targeted invalidation for zero-downtime SPA deploys’ và module CloudFront + WAF. Chuẩn bị: thứ tự upload, vì sao không `/*`, WAF đang ở chế độ Count hay Block, và certificate nằm ở region nào (xem E6 trong ngân hàng)."
    },

    /* ---------------------------------------------------------- */
    {
      id: "sqs-ses", ten: "SQS và SES",
      y: [
        "**SQS Standard**: thông lượng gần như không giới hạn, **at-least-once** (có thể giao trùng), thứ tự *best-effort*. **FIFO**: thứ tự theo *message group*, có dedup, thông lượng thấp hơn. Thực tế mặc định là Standard + consumer **idempotent**.",
        "**Visibility timeout**: sau khi consumer nhận, message bị ‘ẩn’ trong khoảng này; xử lý xong phải `DeleteMessage`, nếu không message hiện lại và bị xử lý lần nữa. Đặt dài hơn thời gian xử lý tối đa (hoặc gia hạn khi cần).",
        "**Dead-letter queue (DLQ)** với `maxReceiveCount`: message lỗi nhiều lần được chuyển sang DLQ để điều tra thay vì kẹt vòng lặp. Phải **cảnh báo khi DLQ có message** và có quy trình redrive.",
        "**Long polling** (`WaitTimeSeconds` tới 20s) giảm request rỗng và chi phí. Retention mặc định 4 ngày (tối đa 14).",
        "**Worker scale theo queue**: dùng `ApproximateNumberOfMessagesVisible` (và tuổi message cũ nhất) làm metric cho autoscaling của ECS worker.",
        "**Payload lớn**: message có giới hạn kích thước; dữ liệu lớn lưu S3 và gửi tham chiếu (pointer).",
        "**SES**: gửi email theo *verified identity* (domain hoặc địa chỉ). Domain nên bật **DKIM**, cấu hình **SPF** và **DMARC** (cùng custom MAIL FROM để SPF thẳng hàng) để tránh vào spam.",
        "**Sandbox**: tài khoản SES mới ở sandbox — chỉ gửi tới địa chỉ đã verify, hạn mức thấp; phải **xin production access**.",
        "**Bounce và complaint**: theo dõi tỷ lệ — vượt ngưỡng có thể bị tạm dừng gửi. Dùng *configuration set* đẩy sự kiện (bounce, complaint, delivery) tới SNS / CloudWatch và *suppression list*.",
        "**Hạn mức**: số email mỗi ngày và tốc độ gửi mỗi giây có giới hạn; gửi qua queue (SQS) để làm mượt tải và retry."
      ],
      bay: "Consumer không idempotent + Standard queue → xử lý trùng gây tác dụng phụ kép (gửi email hai lần, trừ tiền hai lần). Hoặc visibility timeout ngắn hơn thời gian xử lý khiến message bị xử lý song song.",
      cv: "SQS và SES nằm trong 22 module của bạn. Chuẩn bị nói: queue nào phục vụ việc gì (nêu đúng thực tế của bạn), DLQ và cảnh báo ra sao, SES đã ra khỏi sandbox chưa, SPF / DKIM / DMARC cấu hình thế nào."
    },

    /* ---------------------------------------------------------- */
    {
      id: "iam-secrets", ten: "IAM, Secrets Manager và Cognito",
      y: [
        "**IAM**: *principal* (user, role, service) + *policy* (JSON: Effect, Action, Resource, Condition). **Cách đánh giá**: mặc định *deny*; có allow thì được; **explicit deny luôn thắng**. Identity-based (gắn vào principal) khác resource-based (gắn vào S3 bucket, SQS queue, KMS key…).",
        "**Role + STS**: role không có mật khẩu hay key dài hạn; được **assume** để lấy credential tạm. **Trust policy** nói *ai* được assume, **permission policy** nói role *làm được gì*. Luôn ưu tiên role và credential ngắn hạn hơn access key.",
        "**Least privilege**: bắt đầu từ quyền tối thiểu rồi mở dần; dùng điều kiện (`aws:SourceVpc`, `aws:RequestedRegion`, theo tag); kiểm tra bằng IAM Access Analyzer / ‘last accessed’; **permission boundary** và **SCP** đặt trần ở cấp tài khoản / tổ chức.",
        "**`iam:PassRole`**: để gán một role cho dịch vụ (task role / execution role của ECS), principal gọi API phải có quyền `PassRole` trên role đó. Role của pipeline deploy thiếu quyền này là lỗi rất hay gặp khi `register-task-definition` — và phải **giới hạn** đúng role cần thiết, không dùng `*`.",
        "**OIDC cho CI**: GitHub Actions assume role qua OIDC provider; trust policy giới hạn `aud = sts.amazonaws.com` và `sub` theo repo / branch / environment.",
        "**Secrets Manager**: secret mã hoá bằng KMS, có **version stage** (`AWSCURRENT`, `AWSPREVIOUS`), **xoay vòng tự động** qua Lambda (RDS có template sẵn), audit qua CloudTrail, resource policy. Ứng dụng đọc qua SDK (nên cache) hoặc được ECS / EKS tiêm vào lúc khởi động.",
        "**Secrets Manager vs SSM Parameter Store**: Parameter Store (SecureString) rẻ hoặc miễn phí ở mức Standard, hợp cấu hình và secret đơn giản; Secrets Manager có xoay vòng, replicate đa region, secret dạng JSON nhiều khoá nhưng tính phí theo secret.",
        "**Xoay secret không downtime**: dùng hai bộ credential luân phiên (*alternating users*), hoặc để app đọc lại secret khi gặp lỗi xác thực; với ECS phải chạy lại task vì secret chỉ được nạp lúc khởi động.",
        "**Cognito** (Kotae): *user pool* xác thực người dùng và phát JWT (ID / access / refresh token); *identity pool* đổi token lấy credential AWS tạm. Hạ tầng thường quản bằng Terraform: user pool, app client, domain, group."
      ],
      lenh: [
        ["aws sts get-caller-identity", "Mình đang là ai (account, role) — chạy đầu tiên khi gặp lỗi quyền"],
        ["aws iam simulate-principal-policy --policy-source-arn <arn> --action-names ecs:UpdateService --resource-arns <arn>", "Mô phỏng quyền"],
        ["aws iam get-role --role-name <r> --query Role.AssumeRolePolicyDocument", "Xem trust policy"],
        ["aws secretsmanager describe-secret --secret-id <id>", "Rotation, version stage, lần xoay gần nhất"],
        ["aws secretsmanager get-secret-value --secret-id <id> --query SecretString --output text", "Đọc secret (cẩn thận: không dán ra chat hay log)"],
        ["aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=GetSecretValue --max-results 20", "Ai đã đọc secret"]
      ],
      bay: [
        "Gán `AdministratorAccess` cho role pipeline ‘cho nhanh’: một lỗ hổng trong pipeline là mất cả tài khoản.",
        "Để access key dài hạn trong secret của CI thay vì OIDC; hoặc commit key lên Git rồi chỉ xoá commit — phải **xoay key**."
      ],
      cv: "IAM và Secrets Manager là hai mục Skills. Sẵn sàng giải thích: role nào cho pipeline (và vì sao không dùng key), task role vs execution role, secret đi từ Secrets Manager vào container ra sao, và khi đổi secret thì làm gì (xem S2, TH8 trong ngân hàng)."
    },

    /* ---------------------------------------------------------- */
    {
      id: "backup", ten: "AWS Backup",
      y: [
        "**AWS Backup** quản lý backup tập trung cho nhiều dịch vụ (Aurora / RDS, EBS, EFS, DynamoDB, S3…) bằng **backup plan** (rule: lịch, lifecycle / retention, vault đích) + **resource assignment** (chọn theo tag hoặc ARN).",
        "**Backup vault**: nơi lưu recovery point, mã hoá KMS; **Vault Lock** (WORM) chống xoá / sửa — phòng ransomware hay xoá nhầm.",
        "**Copy cross-region / cross-account** để chịu được mất cả region hoặc tài khoản bị xâm nhập — chính là phần ‘offsite’ của quy tắc 3-2-1.",
        "**RPO** do tần suất backup (hoặc PITR liên tục nếu dịch vụ hỗ trợ như Aurora); **RTO** do thời gian **restore** thật — phải đo bằng diễn tập, không đoán.",
        "**Restore luôn tạo tài nguyên mới** (cluster, volume…): cần quy trình đổi endpoint / DNS, kiểm tra dữ liệu và dọn tài nguyên cũ. Tính năng **restore testing** của AWS Backup tự thử khôi phục định kỳ.",
        "**Giám sát**: cảnh báo khi backup job thất bại hoặc bỏ lỡ cửa sổ — backup fail âm thầm là rủi ro lớn nhất vì chỉ lộ ra đúng lúc cần dùng.",
        "**Gán theo tag** (vd `backup=daily`) để resource mới tự được bao phủ thay vì liệt kê thủ công; với multi-tenant, tag theo `tenant` để restore và tính phí theo từng tenant.",
        "**Backup ≠ HA**: Multi-AZ bảo vệ khỏi mất AZ nhưng không bảo vệ khỏi xoá nhầm hay ghi sai dữ liệu — chỉ backup / PITR mới bảo vệ được."
      ],
      lenh: [
        ["aws backup list-backup-plans", "Các backup plan"],
        ["aws backup list-backup-jobs --by-state FAILED --max-results 20", "Job backup thất bại gần đây"],
        ["aws backup list-recovery-points-by-backup-vault --backup-vault-name <v>", "Recovery point trong vault"],
        ["aws backup start-restore-job --recovery-point-arn <arn> --metadata <json> --iam-role-arn <role>", "Khôi phục (tạo tài nguyên mới)"]
      ],
      bay: "Có backup plan nhưng chưa bao giờ restore thử, hoặc backup nằm cùng account / region với dữ liệu gốc: bị xâm nhập hay mất region là mất cả hai.",
      cv: "‘Backup’ là một trong 22 module của bạn. Chuẩn bị: lịch và retention ra sao, backup có sang region / account khác không, đã **restore thử** chưa và mất bao lâu — đó là con số RTO thật (xem B1–B3 trong ngân hàng)."
    },

    /* ---------------------------------------------------------- */
    {
      id: "bedrock", ten: "Bedrock và vận hành workload LLM trên AWS",
      y: [
        "**Vai trò trong Kotae**: bước generation của RAG chatbot dựa trên **AWS Bedrock** cùng OpenAI và Gemini. Từ góc nhìn vận hành, đây là một *phụ thuộc bên ngoài, chậm, có hạn mức và tính tiền theo token*.",
        "**Truy cập**: gọi API `bedrock-runtime` (`InvokeModel` / `Converse`, có streaming) bằng IAM role, không dùng key; phải **bật quyền truy cập model** theo Region / tài khoản; policy IAM giới hạn theo ARN của model.",
        "**Hạn mức và throttling**: mỗi model có giới hạn request / phút và token / phút; vượt sẽ nhận `ThrottlingException` (HTTP 429). Xử lý bằng **retry với exponential backoff + jitter**, giới hạn đồng thời, hàng đợi, và có thể **chuyển dự phòng** giữa các nhà cung cấp (Bedrock ↔ OpenAI ↔ Gemini).",
        "**Timeout**: sinh văn bản dài rất chậm — tăng `read_timeout` của client (boto3 mặc định 60s), dùng **streaming** để người dùng thấy phản hồi sớm, và đồng bộ timeout xuyên suốt: client → LB → ingress → app → Bedrock.",
        "**Chi phí**: tính theo token vào / ra; theo dõi token usage theo tenant / tính năng, giới hạn độ dài input / output, cache kết quả khi hợp lý. Chi phí là một chỉ số vận hành thực sự.",
        "**Mạng và bảo mật**: dùng **VPC interface endpoint** cho `bedrock-runtime` để traffic không đi ra internet; không ghi log nội dung nhạy cảm của người dùng; cân nhắc Guardrails và kiểm soát dữ liệu gửi tới model bên ngoài.",
        "**Quan sát**: đo latency (p50 / p95 / p99), tỷ lệ lỗi / throttle, token usage theo model; cảnh báo theo triệu chứng người dùng cảm nhận (lỗi, chậm) chứ không chỉ theo CPU.",
        "**Ảnh hưởng tới hạ tầng**: workload chủ yếu chờ I/O nên CPU thấp nhưng concurrency cao → autoscale theo số request đồng thời / queue (xem HPA, KEDA ở trang Container & K8s)."
      ],
      bay: "Retry ngay lập tức không backoff khi bị throttle: gây retry storm, làm cả hệ thống chậm theo.",
      cv: "‘Generation backed by AWS Bedrock, OpenAI, and Gemini’. Khi bị hỏi ‘vận hành dịch vụ LLM khác dịch vụ web thường ở đâu’, trả lời theo 5 ý: phụ thuộc ngoài + throttle · latency dài + streaming · chi phí theo token · memory-heavy, bursty (OOM) · bảo vệ dữ liệu (SSRF ở crawler, không log nội dung nhạy cảm)."
    }
  ]
};
