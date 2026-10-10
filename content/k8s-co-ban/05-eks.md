---
ten: EKS — triển khai cluster trên AWS
thoiGian: 45 phút (≈20 phút chờ tạo cluster)
chip: Amazon EKS, eksctl, AWS CLI, managed node group, Network Load Balancer
bank: Kubernetes
---

**Amazon EKS** (Elastic Kubernetes Service) là dịch vụ Kubernetes do AWS quản lý: AWS vận hành control plane (API server, etcd…) — vá lỗi, sao lưu, đảm bảo luôn sẵn sàng — còn bạn quản lý các **node** chạy ứng dụng. Ở các bài trước bạn đã thực hành trên Minikube; bài này tạo một cluster EKS thật bằng **eksctl** và triển khai Nginx ra Internet. Mọi file YAML đã viết đều chạy được trên EKS mà không cần sửa.

Sau bài này bạn sẽ:

- Đăng nhập AWS CLI an toàn và tạo được cluster EKS bằng eksctl.
- Triển khai ứng dụng lên EKS và mở ra Internet qua Network Load Balancer.
- Ước tính được chi phí và xoá sạch tài nguyên sau khi thực hành.

> [!CAUTION]
> Bài này tạo tài nguyên **tính tiền theo giờ**. Làm xong là xoá ngay theo Bước 5, và nên đặt cảnh báo chi phí (AWS Budgets) trước khi bắt đầu.

## Chi phí ước tính

Giá tham khảo vùng Singapore (`ap-southeast-1`), có thể thay đổi — kiểm tra lại trên trang giá của AWS.

| Tài nguyên | Giá xấp xỉ | Ghi chú |
|---|---|---|
| Control plane EKS | 0,10 USD / giờ | 0,60 USD / giờ nếu phiên bản Kubernetes đã hết hạn hỗ trợ chuẩn — nhớ nâng cấp cluster định kỳ |
| 2 node EC2 `t3.medium` | ~0,05 USD / giờ mỗi node | |
| NAT Gateway | ~0,06 USD / giờ + phí dữ liệu | eksctl tạo để node trong subnet private ra được Internet |
| Network Load Balancer | ~0,03 USD / giờ + phí sử dụng | Tạo ra ở Bước 4 |
| **Tổng** | **~0,30 USD / giờ (~7 USD / ngày)** | Quên xoá một tháng ≈ 200 USD |

## Bước 1: Chuẩn bị môi trường AWS và cài công cụ

Cần ba công cụ: **AWS CLI**, **kubectl** (đã cài ở bài 1) và **eksctl**.

**Cài AWS CLI** — xem hướng dẫn cho Linux tại [AWS CLI install](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).

**Đăng nhập AWS CLI.** Cách được khuyến nghị là **IAM Identity Center (SSO)** — thông tin đăng nhập là tạm thời và tự hết hạn:

```bash
aws configure sso                   # làm một lần: nhập SSO start URL, region, chọn account và role
aws sso login --profile hoc-k8s
export AWS_PROFILE=hoc-k8s
```

Kiểm tra đã đăng nhập đúng tài khoản:

```bash
aws sts get-caller-identity
```

```text
{
    "UserId": "AROAXXXXXXXXXXXXXXXXX:ten-ban",
    "Account": "123456789012",
    "Arn": "arn:aws:sts::123456789012:assumed-role/AWSReservedSSO_AdminAccess_xxxx/ten-ban"
}
```

> [!WARNING]
> Tài khoản cá nhân chưa có IAM Identity Center thì có thể dùng `aws configure` với Access Key của một IAM user. Khi đó: bật MFA, chỉ cấp quyền cần thiết, không bao giờ commit file `~/.aws/credentials`, và xoá key khi không dùng nữa.

**Cài eksctl** — công cụ chính thức để tạo và quản lý cluster EKS:

```bash
ARCH=$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/')
PLATFORM=$(uname -s)_$ARCH
curl -sLO "https://github.com/eksctl-io/eksctl/releases/latest/download/eksctl_$PLATFORM.tar.gz"
tar -xzf eksctl_$PLATFORM.tar.gz -C /tmp && rm eksctl_$PLATFORM.tar.gz
sudo install -m 0755 /tmp/eksctl /usr/local/bin/eksctl
```

```bash
eksctl version
```

## Bước 2: Tạo cluster EKS với eksctl

Thay vì một dòng lệnh dài, mô tả cluster trong file `cluster.yaml` — dễ đọc, lưu được vào Git và tạo lại y hệt được:

```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: my-cluster
  region: ap-southeast-1
managedNodeGroups:
  - name: my-nodes
    instanceType: t3.medium
    desiredCapacity: 2
    minSize: 1
    maxSize: 3
    volumeSize: 20
    privateNetworking: true
```

| Trường | Ý nghĩa |
|---|---|
| `metadata.name`, `region` | Tên cluster và vùng AWS. `ap-southeast-1` (Singapore) gần Việt Nam nhất |
| `managedNodeGroups` | Nhóm node do AWS quản lý vòng đời (tạo, vá, thay thế) |
| `instanceType: t3.medium` | Loại EC2. Mỗi node `t3.medium` chứa tối đa 17 Pod — đủ chỗ cho Pod hệ thống và ứng dụng của bài |
| `desiredCapacity`, `minSize`, `maxSize` | Số node mong muốn và giới hạn khi co giãn |
| `privateNetworking: true` | Node nằm trong subnet private, không có IP public — an toàn hơn |

Không ghi `version` thì eksctl dùng phiên bản Kubernetes mặc định của nó; cluster thật nên ghi rõ, ví dụ `version: "1.xx"`.

Xem trước cấu hình đầy đủ rồi tạo cluster (mất khoảng 15–20 phút):

```bash
eksctl create cluster -f cluster.yaml --dry-run
eksctl create cluster -f cluster.yaml
```

eksctl tự tạo VPC, subnet public / private, NAT Gateway, IAM role, control plane và node group. Kết thúc:

```text
[✔]  EKS cluster "my-cluster" in "ap-southeast-1" region is ready
```

eksctl cũng tự cấu hình `kubectl` trỏ vào cluster mới. Kiểm tra:

```bash
kubectl config current-context
kubectl get nodes -o wide
```

```text
NAME                                              STATUS   ROLES    AGE   VERSION
ip-192-168-101-23.ap-southeast-1.compute.internal  Ready    <none>   5m    v1.xx.x-eks-xxxxxxx
ip-192-168-142-87.ap-southeast-1.compute.internal  Ready    <none>   5m    v1.xx.x-eks-xxxxxxx
```

Hai node `Ready` là cluster đã sẵn sàng.

> [!TIP]
> Tiết kiệm cho lab: dùng EC2 Spot rẻ hơn khoảng 60–70%. Trong `cluster.yaml`, thay `instanceType: t3.medium` bằng `instanceTypes: ["t3.medium", "t3a.medium"]` và thêm `spot: true`. Node Spot có thể bị AWS thu hồi, khi đó Deployment tự dời Pod sang node khác.

## Bước 3: Cấp quyền truy cập cluster cho người khác

Tài khoản tạo cluster tự có quyền quản trị. Muốn cấp quyền cho đồng nghiệp hoặc cho pipeline CI/CD (bài 7), dùng **access entry**:

```bash
aws eks create-access-entry --cluster-name my-cluster \
  --principal-arn arn:aws:iam::<ACCOUNT_ID>:role/<TEN_ROLE>

aws eks associate-access-policy --cluster-name my-cluster \
  --principal-arn arn:aws:iam::<ACCOUNT_ID>:role/<TEN_ROLE> \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSEditPolicy \
  --access-scope type=namespace,namespaces=default
```

Lệnh trên cho role được sửa tài nguyên trong namespace `default`. Các policy có sẵn khác: `AmazonEKSViewPolicy` (chỉ xem), `AmazonEKSAdminPolicy`, `AmazonEKSClusterAdminPolicy` (toàn quyền). Bỏ qua bước này nếu chỉ một mình bạn dùng cluster.

## Bước 4: Triển khai ứng dụng đơn giản trên EKS

Tạo file `nginx-eks.yaml` gồm Deployment (giống bài 2) và Service loại `LoadBalancer`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:1.28
          ports:
            - name: http
              containerPort: 80
          resources:
            requests: { cpu: 50m, memory: 64Mi }
            limits:   { memory: 128Mi }
          readinessProbe:
            httpGet: { path: /, port: http }
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: nlb
spec:
  type: LoadBalancer
  selector:
    app: nginx
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: http
```

- `type: LoadBalancer`: AWS tự tạo một load balancer có địa chỉ public, trỏ về các Pod.
- Annotation `aws-load-balancer-type: nlb`: dùng **Network Load Balancer** — loại load balancer thế hệ mới, hiệu năng cao.

```bash
kubectl apply -f nginx-eks.yaml
kubectl rollout status deployment/nginx-deployment
kubectl get service nginx-service --watch
```

Đợi tới khi cột `EXTERNAL-IP` có tên miền (1–2 phút), nhấn `Ctrl+C`:

```text
NAME            TYPE           CLUSTER-IP      EXTERNAL-IP                                                                  PORT(S)        AGE
nginx-service   LoadBalancer   10.100.87.214   a1b2c3d4e5f6...-0123456789abcdef.elb.ap-southeast-1.amazonaws.com   80:31234/TCP   90s
```

Tên miền của load balancer cần thêm 1–3 phút để có hiệu lực. Sau đó:

```bash
LB=$(kubectl get service nginx-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
curl -s "http://$LB" | head -n 4
```

Hoặc mở `http://<EXTERNAL-IP>` trên trình duyệt — bạn sẽ thấy trang **Welcome to nginx!**, lần này chạy trên AWS và truy cập được từ bất cứ đâu.

## Bước 5: Xoá tài nguyên để dọn dẹp

Làm **đúng thứ tự**: xoá Service `LoadBalancer` trước. Nếu xoá cluster ngay, load balancer do Kubernetes tạo có thể còn sót lại, vừa tiếp tục tính tiền vừa khiến eksctl không xoá được VPC.

```bash
kubectl delete -f nginx-eks.yaml
kubectl get service -A | grep LoadBalancer       # phải không còn dòng nào
eksctl delete cluster -f cluster.yaml --wait     # mất khoảng 10 phút
```

```text
[✔]  all cluster resources were deleted
```

Sau đó vào AWS Console kiểm tra không còn sót: **EC2 → Load Balancers**, **VPC → NAT gateways**, **VPC → Elastic IPs**, **CloudFormation** (các stack `eksctl-my-cluster-*`).

Cuối cùng, trỏ kubectl về Minikube cho các bài sau:

```bash
kubectl config use-context minikube
```

## Xử lý sự cố thường gặp

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| `eksctl create cluster` báo lỗi quyền (`AccessDenied`) | Role / user thiếu quyền tạo VPC, IAM, EKS | Dùng role quản trị cho lab, hoặc bổ sung quyền theo tài liệu eksctl |
| Token SSO hết hạn: `The SSO session has expired` | Phiên SSO có thời hạn | `aws sso login --profile hoc-k8s` |
| `EXTERNAL-IP` mãi `<pending>` | Đang tạo load balancer, hoặc subnet thiếu tag cho load balancer | Đợi 2–3 phút; `kubectl describe service nginx-service` xem Events |
| `curl` tới load balancer không phản hồi | DNS chưa có hiệu lực | Đợi thêm vài phút rồi thử lại |
| Pod mãi `Pending` | Node hết chỗ (CPU / RAM / số Pod) | `kubectl describe pod` xem Events; tăng `desiredCapacity` hoặc dùng loại EC2 lớn hơn |
| `eksctl delete cluster` kẹt ở bước xoá VPC | Còn load balancer / network interface trong VPC | Xoá Service `LoadBalancer` còn sót, xoá load balancer trong Console rồi chạy lại |

## Lưu ý quan trọng

- **Chi phí**: luôn xoá cluster sau khi thử nghiệm và đặt AWS Budgets. Ngoài control plane và node, NAT Gateway và load balancer cũng tính tiền theo giờ.
- **Load balancer trong production**: cài **AWS Load Balancer Controller** (bằng Helm, bài 6). Nó tạo NLB trỏ thẳng IP Pod và ALB cho Ingress / Gateway API, với nhiều tuỳ chọn hơn (TLS, WAF, health check).
- **Quyền cho ứng dụng**: Pod cần gọi dịch vụ AWS (S3, SQS…) thì dùng **EKS Pod Identity** để gắn IAM role riêng cho từng ServiceAccount — không gắn quyền vào role của node, vì mọi Pod trên node sẽ dùng chung.
- **EKS Auto Mode**: lựa chọn ít việc vận hành hơn — AWS quản lý luôn node, autoscaling, load balancer và ổ đĩa. Tạo bằng `eksctl create cluster --name my-cluster --region ap-southeast-1 --enable-auto-mode`; có thêm phí quản lý trên mỗi node.
- Tài liệu: [Amazon EKS User Guide](https://docs.aws.amazon.com/eks/latest/userguide/) · [eksctl](https://eksctl.io/) · [EKS access entries](https://docs.aws.amazon.com/eks/latest/userguide/access-entries.html) · [EKS pricing](https://aws.amazon.com/eks/pricing/)
