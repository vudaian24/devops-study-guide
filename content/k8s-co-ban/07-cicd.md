---
ten: CI/CD — tự động triển khai với GitHub Actions
thoiGian: 45 phút
chip: GitHub Actions, workflow, kind, image tag theo commit, rollout status, OIDC
bank: Kubernetes, GitLab CI
---

**CI/CD** tự động hoá con đường từ code tới cluster: mỗi lần đẩy code lên, pipeline tự build image, kiểm tra nó chạy được trên Kubernetes, rồi triển khai — không ai phải gõ `kubectl` bằng tay, giảm lỗi và tiết kiệm thời gian. **GitHub Actions** là công cụ CI/CD tích hợp sẵn trong GitHub. Bài này xây dựng một pipeline gồm hai phần:

- **CI (kiểm thử)**: dựng một cluster Kubernetes tạm ngay trong máy chạy pipeline, triển khai ứng dụng lên đó và kiểm tra nó hoạt động.
- **CD (triển khai)**: đưa đúng image đã kiểm thử lên cluster thật (EKS ở bài 5) mà không lưu mật khẩu / khoá AWS nào trong GitHub.

## Bước 1: Chuẩn bị GitHub repository

Cần: tài khoản GitHub, Git và Docker trên máy.

1. Trên GitHub, tạo repository mới, ví dụ `k8s-cicd-example`.
2. Trên máy, tạo thư mục dự án:

```bash
mkdir k8s-cicd-example && cd k8s-cicd-example
git init -b main
mkdir -p app k8s .github/workflows
```

Cấu trúc thư mục sẽ hoàn thiện sau Bước 3:

```text
k8s-cicd-example/
├── .github/workflows/ci.yml     # pipeline
├── app/
│   ├── Dockerfile
│   └── index.html               # "ứng dụng"
└── k8s/
    ├── deployment.yaml
    └── service.yaml
```

## Bước 2: Tạo ứng dụng và file Kubernetes manifest

Ứng dụng tối giản: một trang HTML chạy trên Nginx. Pipeline sẽ build nó thành image riêng.

`app/index.html`:

```html
<h1>Hello từ CI/CD</h1>
```

`app/Dockerfile`:

```dockerfile
FROM nginx:1.28-alpine
COPY index.html /usr/share/nginx/html/index.html
```

`k8s/deployment.yaml` — dòng `image` có chữ `IMAGE_TAG` làm chỗ trống, pipeline sẽ thay bằng mã commit:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: web:IMAGE_TAG
          ports:
            - name: http
              containerPort: 80
          readinessProbe:
            httpGet: { path: /, port: http }
            periodSeconds: 5
          resources:
            requests: { cpu: 50m, memory: 32Mi }
            limits:   { memory: 64Mi }
```

`k8s/service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector:
    app: web
  ports:
    - name: http
      port: 80
      targetPort: http
```

Vì sao tag image theo **mã commit** (`github.sha`) thay vì `latest`? Mỗi commit cho một image riêng, không bao giờ trùng — luôn biết chính xác code nào đang chạy và quay lui được về bất kỳ bản nào.

Thử trên máy trước khi đưa vào pipeline (cần Minikube đang chạy):

```bash
docker build -t web:local app/
minikube image load web:local
sed "s|web:IMAGE_TAG|web:local|" k8s/deployment.yaml | kubectl apply -f -
kubectl apply -f k8s/service.yaml
kubectl rollout status deployment/web
kubectl delete -f k8s/
```

## Bước 3: Cấu hình GitHub Actions workflow

Pipeline dùng **kind** (Kubernetes in Docker) để dựng cluster tạm: khởi động trong khoảng một phút, chạy tốt trên máy của GitHub, và cũng là công cụ chính dự án Kubernetes dùng để kiểm thử.

Tạo `.github/workflows/ci.yml`:

```yaml
name: ci

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test-on-kind:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Lấy code
        uses: actions/checkout@v5

      - name: Build image
        run: docker build -t web:${{ github.sha }} app/

      - name: Tạo cluster kind
        uses: helm/kind-action@v1
        with:
          cluster_name: ci

      - name: Nạp image vào cluster
        run: kind load docker-image web:${{ github.sha }} --name ci

      - name: Triển khai
        run: |
          sed -i "s|web:IMAGE_TAG|web:${{ github.sha }}|" k8s/deployment.yaml
          kubectl apply -f k8s/
          kubectl rollout status deployment/web --timeout=120s

      - name: Kiểm tra ứng dụng trả về đúng nội dung
        run: |
          kubectl run smoke --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- \
            curl -fsS http://web/ | grep -q "Hello"

      - name: In thông tin debug khi lỗi
        if: failure()
        run: |
          kubectl get all -o wide
          kubectl describe deployment/web
          kubectl logs deployment/web --all-containers --tail=100 || true
          kubectl get events --sort-by=.lastTimestamp | tail -n 30
```

Giải thích:

| Phần | Ý nghĩa |
|---|---|
| `on: push / pull_request` | Chạy khi đẩy code lên `main` và khi mở Pull Request |
| `permissions: contents: read` | Pipeline chỉ được đọc code — cấp quyền tối thiểu |
| `concurrency` | Đẩy commit mới thì huỷ lần chạy cũ đang dở của cùng nhánh |
| `timeout-minutes` | Không để pipeline treo mãi |
| `kind load docker-image` | Đưa image vừa build vào cluster kind, không cần đẩy lên registry |
| `kubectl rollout status` | **Thất bại thật** nếu Pod không lên được trong 120 giây — khác với `kubectl get pods` luôn "thành công" |
| Bước kiểm tra | Gọi ứng dụng qua Service, phải trả về chữ "Hello" |
| `if: failure()` | Chỉ chạy khi có bước lỗi — in đủ thông tin để biết vì sao |

> [!TIP]
> Phiên bản action như `@v5` vẫn có thể bị tác giả thay đổi nội dung. Dự án quan trọng nên ghim theo mã commit: `uses: actions/checkout@<sha-40-ký-tự>  # v5.x.x`, và bật Dependabot để tự đề xuất cập nhật.

## Bước 4: Đẩy mã và kiểm tra pipeline

```bash
git add .
git commit -m "Thêm ứng dụng, manifest Kubernetes và pipeline CI"
git remote add origin https://github.com/<tên-github>/k8s-cicd-example.git
git push -u origin main
```

Trên GitHub, mở repository → tab **Actions** → chọn lần chạy mới nhất. Mỗi bước có dấu ✓ xanh khi thành công. Log bước *Triển khai* sẽ có:

```text
deployment.apps/web created
service/web created
Waiting for deployment "web" rollout to finish: 0 of 2 updated replicas are available...
deployment "web" successfully rolled out
```

**Thử làm hỏng có chủ ý** để thấy pipeline bắt lỗi: sửa readiness probe thành `path: /khong-ton-tai`, commit và push. Bước *Triển khai* sẽ đỏ sau 120 giây, và bước *In thông tin debug* cho thấy lý do: `Readiness probe failed: HTTP probe failed with statuscode: 404`. Sửa lại rồi push để pipeline xanh trở lại.

## Bước 5: Triển khai lên cluster thật bằng OIDC

Cluster kind ở trên chỉ sống trong vài phút của pipeline — nó dùng để **kiểm thử**. Để **triển khai thật** lên EKS (bài 5), pipeline cần quyền vào AWS. Cách an toàn là **OIDC**: GitHub cấp cho mỗi lần chạy một token ngắn hạn, AWS đổi token đó lấy quyền của một IAM role chỉ tin đúng repository và nhánh của bạn. Không có khoá AWS nào được lưu trong GitHub, nên không có gì để lộ.

Chuẩn bị một lần trên AWS (chi tiết trong link cuối bài):

1. IAM → **Identity providers** → thêm OpenID Connect provider `token.actions.githubusercontent.com`, audience `sts.amazonaws.com`.
2. Tạo IAM role `github-deploy` có trust policy chỉ chấp nhận `repo:<tên-github>/k8s-cicd-example:ref:refs/heads/main`, kèm quyền đẩy image lên ECR.
3. Tạo kho image ECR: `aws ecr create-repository --repository-name web --region ap-southeast-1`.
4. Cấp role `github-deploy` quyền vào cluster bằng **access entry** (bài 5, Bước 3).

Thêm job `deploy` vào cuối `ci.yml` (cùng cấp với `test-on-kind`):

```yaml
  deploy:
    needs: test-on-kind
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    permissions:
      contents: read
      id-token: write
    env:
      AWS_REGION: ap-southeast-1
      CLUSTER: my-cluster
    steps:
      - uses: actions/checkout@v5

      - name: Đăng nhập AWS bằng OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::<ACCOUNT_ID>:role/github-deploy
          aws-region: ${{ env.AWS_REGION }}

      - name: Đăng nhập ECR
        id: ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build và đẩy image
        run: |
          IMAGE=${{ steps.ecr.outputs.registry }}/web:${{ github.sha }}
          docker build -t "$IMAGE" app/
          docker push "$IMAGE"
          echo "IMAGE=$IMAGE" >> "$GITHUB_ENV"

      - name: Triển khai lên EKS
        run: |
          aws eks update-kubeconfig --name "$CLUSTER" --region "$AWS_REGION"
          sed -i "s|web:IMAGE_TAG|$IMAGE|" k8s/deployment.yaml
          kubectl apply -f k8s/
          kubectl rollout status deployment/web --timeout=180s
```

| Phần | Ý nghĩa |
|---|---|
| `needs: test-on-kind` | Chỉ triển khai khi kiểm thử đã qua |
| `if: github.ref == 'refs/heads/main'` | Chỉ triển khai từ nhánh `main`, không từ Pull Request |
| `environment: production` | Vào **Settings → Environments → production** bật *Required reviewers* để phải có người duyệt trước khi triển khai |
| `id-token: write` | Cho phép job xin token OIDC |
| ECR | Node EKS kéo được image từ ECR cùng tài khoản mà không cần cấu hình thêm |

## Bước 6: Xoá tài nguyên để dọn dẹp

- Cluster kind tự biến mất khi pipeline chạy xong — không cần dọn.
- Nếu đã làm Bước 5: xoá Deployment / Service trên EKS (`kubectl delete -f k8s/`), xoá kho ECR `web`, IAM role `github-deploy`, rồi xoá cluster theo bài 5.
- Xoá repository trên GitHub (tuỳ chọn): **Settings → General → Danger Zone → Delete this repository**.

## Xử lý sự cố thường gặp

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| `rollout status` hết giờ, Pod `ErrImagePull` | Image chưa được nạp vào kind, hoặc sai tên / tag | Kiểm tra bước `kind load` và lệnh `sed` thay đúng `IMAGE_TAG` |
| Bước kiểm tra lỗi `Could not resolve host: web` | Service chưa tạo hoặc sai tên | `kubectl get svc` trong bước debug |
| `Not authorized to perform sts:AssumeRoleWithWebIdentity` | Trust policy không khớp repository / nhánh, hoặc thiếu `id-token: write` | Đối chiếu chuỗi `repo:<owner>/<repo>:ref:refs/heads/main` |
| `kubectl` trên EKS báo `Unauthorized` | Role chưa có access entry vào cluster | Làm lại bài 5, Bước 3 cho role `github-deploy` |
| Job `deploy` đứng ở *Waiting* | Environment có Required reviewers | Vào tab Actions bấm *Review deployments* để duyệt |

## Lưu ý quan trọng

- **Minikube / kind trong CI** dùng để kiểm thử; triển khai thật luôn lên cluster thật (EKS, GKE, AKS…).
- **Không lưu khoá dài hạn** (AWS Access Key, kubeconfig chứa token) trong GitHub Secrets khi có thể dùng OIDC.
- **Build một lần, triển khai nhiều nơi**: pipeline chặt chẽ hơn build image một lần, đẩy lên registry, rồi kiểm thử và triển khai đúng image đó ở mọi môi trường. Ví dụ trên build lại ở job `deploy` cho dễ đọc.
- **GitOps** (Argo CD, Flux) là mô hình phổ biến cho nhiều cluster / môi trường: pipeline chỉ cập nhật tag image trong một repository cấu hình, còn công cụ chạy trong cluster tự kéo thay đổi về và áp dụng — CI không cần quyền ghi vào cluster.
- Tài liệu: [GitHub Actions](https://docs.github.com/en/actions) · [kind](https://kind.sigs.k8s.io/) · [Cấu hình OIDC với AWS](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services) · [Argo CD](https://argo-cd.readthedocs.io/)
