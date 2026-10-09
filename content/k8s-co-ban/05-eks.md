---
ten: EKS — chạy cluster thật trên AWS
goc: https://devops.vn/posts/kubernetes-eks-aws-trien-khai-cluster/
thoiGian: 45 phút (≈20 phút chờ tạo cluster)
chip: EKS, eksctl, ClusterConfig, managed node group, NLB, access entry
bank: Kubernetes
---

**Amazon EKS** là Kubernetes do AWS quản lý control plane (API server, etcd, scheduler…): AWS lo vá lỗi, sao lưu và độ sẵn sàng của phần đó; bạn lo **node** chạy workload và mọi thứ chạy trên cluster. Manifest bạn viết ở các bài trước chạy được nguyên vẹn trên EKS — khác biệt nằm ở mạng, load balancer, quyền truy cập và **tiền**.

> [!CAUTION]
> Bài này tạo tài nguyên **tính tiền theo giờ** (control plane, EC2, NAT Gateway, load balancer). Làm xong là xoá ngay theo mục *Dọn dẹp*, và đặt AWS Budget cảnh báo trước khi bắt đầu.

## Chi phí ước tính

Giá tham khảo vùng Singapore (`ap-southeast-1`) tại thời điểm rà soát — kiểm tra lại trên trang giá của AWS.

| Tài nguyên | Giá xấp xỉ | Ghi chú |
|---|---|---|
| Control plane EKS | 0,10 USD/giờ | Lên **0,60 USD/giờ** nếu phiên bản Kubernetes đã hết *standard support* |
| 2 × EC2 `t3.medium` | ~0,05 USD/giờ mỗi node | Dùng Spot rẻ hơn nhiều, xem mục Mẹo |
| NAT Gateway | ~0,06 USD/giờ + phí dữ liệu | eksctl tạo mặc định cho subnet private |
| Network Load Balancer | ~0,03 USD/giờ + phí dùng | Sinh ra khi tạo Service `LoadBalancer` |
| **Cộng** | **~0,30 USD/giờ ≈ 7 USD/ngày** | Quên xoá một tháng ≈ 200 USD |

> [!IMPORTANT]
> Bản gốc chỉ tính control plane và node `t3.small`, bỏ sót NAT Gateway và load balancer — hai khoản hay khiến người mới bất ngờ khi nhận hoá đơn. Bản gốc cũng không nhắc phí *extended support*: cluster để quá hạn hỗ trợ của phiên bản Kubernetes sẽ đắt gấp 6 lần.

## Bước 1: Đăng nhập AWS CLI đúng cách

Ưu tiên đăng nhập bằng **IAM Identity Center (SSO)** — thông tin đăng nhập ngắn hạn, tự hết hạn:

```bash
aws configure sso                 # làm một lần: nhập Start URL, region, chọn account / role
aws sso login --profile hoc-k8s
export AWS_PROFILE=hoc-k8s
aws sts get-caller-identity       # xác nhận đang dùng đúng account / role
```

> [!IMPORTANT]
> Bản gốc dùng `aws configure` với Access Key / Secret Key của IAM user — khoá dài hạn, nằm dạng rõ trong `~/.aws/credentials`, là nguồn lộ thông tin phổ biến nhất trên AWS. Chỉ dùng khoá dài hạn khi tài khoản cá nhân không có Identity Center, và khi đó bật MFA, cấp quyền tối thiểu, xoay khoá định kỳ.

## Bước 2: Cài eksctl

```bash
# macOS
brew install eksctl

# Linux
ARCH=$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/')
PLATFORM=$(uname -s)_$ARCH
curl -sLO "https://github.com/eksctl-io/eksctl/releases/latest/download/eksctl_$PLATFORM.tar.gz"
tar -xzf eksctl_$PLATFORM.tar.gz -C /tmp && rm eksctl_$PLATFORM.tar.gz
sudo install -m 0755 /tmp/eksctl /usr/local/bin/eksctl

eksctl version
```

> [!IMPORTANT]
> Bản gốc tải từ `github.com/weaveworks/eksctl` và cố định file `amd64`. Weaveworks đã đóng cửa năm 2024; eksctl giờ do AWS duy trì tại `github.com/eksctl-io/eksctl`. Link cũ có thể vẫn chuyển hướng được, nhưng đừng dựa vào điều đó.

## Bước 3: Mô tả cluster bằng file

Thay vì một dòng lệnh dài, mô tả cluster trong file `cluster.yaml` — đọc lại được, commit được, tạo lại y hệt được:

```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: hoc-k8s
  region: ap-southeast-1
  # version: "1.xx"     # bỏ trống = bản mặc định của eksctl; production nên ghi rõ
managedNodeGroups:
  - name: ng-default
    instanceType: t3.medium
    desiredCapacity: 2
    minSize: 1
    maxSize: 3
    volumeSize: 20
    privateNetworking: true   # node nằm subnet private, ra Internet qua NAT
```

```bash
eksctl create cluster -f cluster.yaml --dry-run    # xem cấu hình đầy đủ eksctl sẽ dùng
eksctl create cluster -f cluster.yaml              # ~15–20 phút
```

eksctl tạo VPC, subnet public/private, NAT Gateway, IAM role, control plane, node group, rồi ghi kubeconfig và chuyển context sang cluster mới:

```bash
kubectl config current-context
kubectl get nodes -o wide
```

> [!IMPORTANT]
> Bản gốc dùng `t3.small`. Với VPC CNI mặc định, mỗi Pod chiếm một IP của node và `t3.small` chỉ chứa tối đa 11 Pod — khoảng một nửa đã bị các Pod hệ thống (`aws-node`, `kube-proxy`, `coredns`…) dùng, nên dễ gặp Pod `Pending` khó hiểu. `t3.medium` (17 Pod) thoải mái hơn cho lab. Vùng `ap-southeast-1` gần Việt Nam hơn `us-east-1` của bản gốc; hai vùng đều dùng được.

> [!TIP]
> Lab tiết kiệm: thay `instanceType` bằng `instanceTypes: ["t3.medium", "t3a.medium"]` và thêm `spot: true` — node Spot rẻ hơn khoảng 60–70%, đổi lại có thể bị AWS thu hồi (Deployment sẽ tự dời Pod sang node khác).

> [!NOTE]
> **EKS Auto Mode** là lựa chọn khác: `eksctl create cluster --name hoc-k8s --region ap-southeast-1 --enable-auto-mode`. AWS quản lý luôn cả node, autoscaling (Karpenter), load balancer và EBS — ít việc vận hành hơn, có thêm phí quản lý trên mỗi node. Bài này dùng managed node group để bạn còn nhìn thấy node.

## Bước 4: Ai được truy cập cluster

IAM identity tạo cluster được eksctl cấp quyền admin. Để cấp quyền cho người hoặc role khác (ví dụ role CI/CD ở bài 7), dùng **access entry**:

```bash
aws eks create-access-entry --cluster-name hoc-k8s \
  --principal-arn arn:aws:iam::<ACCOUNT_ID>:role/<TÊN_ROLE>

aws eks associate-access-policy --cluster-name hoc-k8s \
  --principal-arn arn:aws:iam::<ACCOUNT_ID>:role/<TÊN_ROLE> \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSEditPolicy \
  --access-scope type=namespace,namespaces=hoc-k8s
```

> [!IMPORTANT]
> Tài liệu cũ (và nhiều bài trên mạng) cấp quyền bằng cách sửa ConfigMap `aws-auth` trong `kube-system` — gõ sai một dòng YAML là khoá chính mình khỏi cluster. Access entry là API của AWS, quản lý được bằng CLI / Terraform và giờ là cách được khuyến nghị; `aws-auth` đã bị deprecate.

## Bước 5: Triển khai ứng dụng và mở ra Internet

Dùng lại `nginx-deployment.yaml` của bài 2, thêm file `nginx-lb.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-lb
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: nlb
spec:
  type: LoadBalancer
  selector:
    app: nginx
  ports:
    - name: http
      port: 80
      targetPort: http
```

```bash
kubectl create namespace hoc-k8s
kubectl config set-context --current --namespace=hoc-k8s
kubectl apply -f nginx-deployment.yaml -f nginx-lb.yaml
kubectl get service nginx-lb --watch       # đợi cột EXTERNAL-IP có tên miền *.elb.amazonaws.com
```

DNS của load balancer mất 1–3 phút mới phân giải được:

```bash
curl -s "http://$(kubectl get svc nginx-lb -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')" | head -n 4
```

> [!IMPORTANT]
> Bản gốc tạo Service `LoadBalancer` không annotation — AWS sẽ tạo **Classic Load Balancer**, thế hệ cũ AWS khuyên không dùng cho hệ thống mới. Annotation trên đổi sang Network Load Balancer. Trong production, cài **AWS Load Balancer Controller** (cần IAM role riêng, cài bằng Helm): nó tạo NLB trỏ thẳng IP Pod và ALB cho Ingress / Gateway API, với nhiều tuỳ chọn hơn.

> [!NOTE]
> Ứng dụng cần gọi API của AWS (S3, SQS…) thì cấp quyền bằng **EKS Pod Identity** (`eksctl create podidentityassociation`) — mỗi ServiceAccount một IAM role. Đừng gắn quyền vào IAM role của node: mọi Pod trên node sẽ dùng chung quyền đó.

## Dọn dẹp — làm ngay khi xong

**Xoá Service `LoadBalancer` trước** — nếu không, load balancer và network interface của nó còn bám trong VPC, khiến bước xoá VPC của eksctl kẹt hoặc thất bại, và NLB tiếp tục tính tiền:

```bash
kubectl delete -f nginx-lb.yaml
kubectl get svc -A | grep LoadBalancer      # phải không còn dòng nào
eksctl delete cluster -f cluster.yaml --wait
```

Sau đó vào AWS Console kiểm tra không còn sót: **EC2 → Load Balancers**, **VPC → NAT gateways**, **VPC → Elastic IPs**, **CloudFormation** (stack `eksctl-hoc-k8s-*`).

Cuối cùng trỏ kubectl về Minikube cho các bài sau: `kubectl config use-context minikube`.

## Tóm tắt

- Mô tả cluster bằng file `ClusterConfig`; đăng nhập AWS bằng SSO, không dùng khoá dài hạn.
- Cấp quyền vào cluster bằng access entry; cấp quyền AWS cho Pod bằng Pod Identity.
- Service `LoadBalancer` nên là NLB; production dùng AWS Load Balancer Controller.
- Chi phí thật gồm cả NAT Gateway và load balancer. Xoá Service `LoadBalancer` trước khi xoá cluster.

Tài liệu: [eksctl](https://eksctl.io/) · [EKS — access entries](https://docs.aws.amazon.com/eks/latest/userguide/access-entries.html) · [EKS pricing](https://aws.amazon.com/eks/pricing/) · [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
