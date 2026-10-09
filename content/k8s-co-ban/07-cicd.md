---
ten: CI/CD với GitHub Actions — kiểm thử trên kind, triển khai bằng OIDC
goc: https://devops.vn/posts/kubernetes-cicd-tu-dong-trien-khai/
thoiGian: 45 phút
chip: GitHub Actions, kind, image tag theo commit, OIDC, ECR, GitOps
bank: Kubernetes, GitLab CI
---

Mục tiêu của CI/CD với Kubernetes: mỗi commit **build ra một image có tag duy nhất**, **chứng minh nó chạy được trên Kubernetes**, rồi đưa đúng image đó lên cluster thật — không ai phải gõ `kubectl` bằng tay. Bài này làm hai phần: **CI** kiểm thử trên một cluster tạm dựng ngay trong runner, và **CD** triển khai lên EKS mà không lưu khoá AWS nào trong GitHub.

> [!IMPORTANT]
> Bản gốc dựng Minikube *bên trong runner* rồi gọi đó là "tự động triển khai". Cluster đó sống vài phút và bị xoá khi job kết thúc — ứng dụng chưa bao giờ tới cluster nào bạn dùng được. Nó thực chất là **kiểm thử**, rất có ích, nhưng cần gọi đúng tên và tách khỏi bước triển khai thật.

## Chuẩn bị

Tạo repo GitHub mới (ví dụ `k8s-cicd-example`) với cấu trúc:

```text
k8s-cicd-example/
├── .github/workflows/ci.yml
├── app/
│   ├── Dockerfile
│   └── index.html
└── k8s/
    ├── deployment.yaml
    └── service.yaml
```

> [!IMPORTANT]
> Bản gốc không build image nào — pipeline chỉ apply `nginx:latest`. Một pipeline thật phải build artefact của chính repo, nên bản này thêm một "ứng dụng" tối giản.

`app/index.html`:

```html
<h1>Hello từ CI/CD</h1>
```

`app/Dockerfile`:

```dockerfile
FROM nginx:1.28-alpine
COPY index.html /usr/share/nginx/html/index.html
```

`k8s/deployment.yaml` — tag `IMAGE_TAG` sẽ được pipeline thay bằng SHA của commit:

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

## Bước 1: CI — kiểm thử trên cluster kind

`.github/workflows/ci.yml`:

```yaml
name: ci

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read                      # quyền tối thiểu cho GITHUB_TOKEN

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true            # commit mới huỷ lần chạy cũ của cùng nhánh

jobs:
  test-on-kind:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v5

      - name: Build image
        run: docker build -t web:${{ github.sha }} app/

      - name: Tạo cluster kind
        uses: helm/kind-action@v1
        with:
          cluster_name: ci

      - name: Nạp image vào cluster
        run: kind load docker-image web:${{ github.sha }} --name ci

      - name: Deploy
        run: |
          sed -i "s|web:IMAGE_TAG|web:${{ github.sha }}|" k8s/deployment.yaml
          kubectl apply -f k8s/
          kubectl rollout status deployment/web --timeout=120s

      - name: Smoke test
        run: |
          kubectl run smoke --rm -i --restart=Never --image=curlimages/curl:8.10.1 -- \
            curl -fsS http://web/ | grep -q "Hello"

      - name: Thông tin debug khi lỗi
        if: failure()
        run: |
          kubectl get all -o wide
          kubectl describe deployment/web
          kubectl logs deployment/web --all-containers --tail=100 || true
          kubectl get events --sort-by=.lastTimestamp | tail -n 30
```

Push lên GitHub và xem tab **Actions**. Thử làm hỏng có chủ ý (ví dụ đổi readiness probe sang `path: /khong-ton-tai`) để thấy `rollout status` hết giờ, job đỏ và bước debug in ra lý do.

> [!IMPORTANT]
> Những gì đã đổi so với workflow gốc:
>
> - `actions/checkout@v3` → `@v5`: v3 chạy trên Node 16, đã bị GitHub ngừng hỗ trợ.
> - `medyagh/setup-minikube@master` → `helm/kind-action@v1`: tham chiếu `@master` nghĩa là chạy bất kỳ code nào vừa được đẩy lên nhánh đó — rủi ro chuỗi cung ứng. kind (Kubernetes chạy trong Docker) khởi động nhanh hơn Minikube và là thứ dự án Kubernetes dùng cho CI của chính nó.
> - Thêm `permissions`, `concurrency`, `timeout-minutes`, smoke test và bước debug khi lỗi.
> - `kubectl get pods` (luôn "thành công") → `kubectl rollout status` (thất bại thật khi Pod không lên).

> [!TIP]
> Tag major như `@v5` vẫn có thể bị đổi nội dung. Repo quan trọng nên ghim action theo **commit SHA** (`uses: actions/checkout@<sha> # v5.x.y`) và để Dependabot cập nhật.

## Bước 2: CD — triển khai lên EKS không cần khoá AWS

> [!IMPORTANT]
> Bản gốc khuyên lưu **kubeconfig** vào GitHub Secrets. Với EKS, kubeconfig không chứa mật khẩu mà gọi AWS CLI — nên thực chất bạn phải lưu **Access Key dài hạn** vào GitHub. Cách đúng là **OIDC**: GitHub cấp cho mỗi lần chạy một token ngắn hạn, AWS đổi token đó lấy quyền của một IAM role chỉ tin đúng repo / nhánh của bạn. Không còn khoá nào để lộ.

Việc cần làm một lần trên AWS (xem link cuối bài):

1. Tạo **OIDC identity provider** `token.actions.githubusercontent.com` trong IAM.
2. Tạo IAM role `github-deploy` có trust policy chỉ chấp nhận `repo:<owner>/k8s-cicd-example:ref:refs/heads/main`, quyền push ECR.
3. Tạo ECR repository `web` (`aws ecr create-repository --repository-name web`).
4. Cấp role đó quyền vào cluster bằng **access entry** (bài 5), giới hạn trong namespace `hoc-k8s`.

Thêm job `deploy` vào cuối `ci.yml`:

```yaml
  deploy:
    needs: test-on-kind
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production            # bật "Required reviewers" để duyệt tay trước khi chạy
    permissions:
      contents: read
      id-token: write                  # cho phép xin OIDC token
    env:
      AWS_REGION: ap-southeast-1
      CLUSTER: hoc-k8s
    steps:
      - uses: actions/checkout@v5

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::<ACCOUNT_ID>:role/github-deploy
          aws-region: ${{ env.AWS_REGION }}

      - id: ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build và push image
        run: |
          IMAGE=${{ steps.ecr.outputs.registry }}/web:${{ github.sha }}
          docker build -t "$IMAGE" app/
          docker push "$IMAGE"
          echo "IMAGE=$IMAGE" >> "$GITHUB_ENV"

      - name: Deploy
        run: |
          aws eks update-kubeconfig --name "$CLUSTER" --region "$AWS_REGION"
          sed -i "s|web:IMAGE_TAG|$IMAGE|" k8s/deployment.yaml
          kubectl -n hoc-k8s apply -f k8s/
          kubectl -n hoc-k8s rollout status deployment/web --timeout=180s
```

Node EKS kéo được image từ ECR cùng account nhờ quyền có sẵn trong IAM role của node, nên không cần `imagePullSecrets`.

> [!NOTE]
> Image được build lại ở job `deploy` cho dễ đọc. Pipeline chặt chẽ hơn build **một lần**, push, rồi kiểm thử và triển khai đúng digest đó — để thứ chạy trên production chính là thứ đã qua kiểm thử.

## Push hay pull? GitOps

| | Push (bài này) | Pull / GitOps (Argo CD, Flux) |
|---|---|---|
| Ai gọi API cluster | Pipeline CI | Agent chạy trong cluster |
| Quyền | CI cần quyền ghi vào cluster | CI chỉ cần quyền ghi vào repo Git |
| Lệch cấu hình (ai đó `kubectl edit`) | Không phát hiện | Agent tự phát hiện và đưa về đúng Git |
| Hợp với | Team nhỏ, ít cluster | Nhiều cluster / môi trường, cần audit |

Với GitOps, bước cuối của pipeline không còn `kubectl apply` mà chỉ là cập nhật tag image trong repo cấu hình; Argo CD / Flux thấy commit mới và tự đồng bộ.

## Dọn dẹp

Cluster kind tự mất khi job kết thúc. Nếu đã làm phần CD: xoá ECR repository, IAM role, access entry, và cluster theo bài 5.

## Tóm tắt

- CI: build image tag theo commit → chạy thật trên kind → `rollout status` + smoke test → in thông tin debug khi lỗi.
- CD: OIDC thay cho khoá AWS dài hạn; quyền vào cluster qua access entry, giới hạn theo namespace.
- Ghim phiên bản action, cấp `permissions` tối thiểu, đặt `environment` có người duyệt cho production.

Tài liệu: [kind](https://kind.sigs.k8s.io/) · [GitHub Actions — OIDC với AWS](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services) · [configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials) · [Argo CD](https://argo-cd.readthedocs.io/)
