---
ten: ConfigMap và Secret — đưa cấu hình vào Pod
goc: https://devops.vn/posts/kubernetes-configmap-secret-quan-ly-cau-hinh/
thoiGian: 35 phút
chip: ConfigMap, Secret, envFrom, volume, rollout restart
bank: Kubernetes, Security
---

Image nên giống hệt nhau ở mọi môi trường; thứ khác nhau là **cấu hình**. **ConfigMap** chứa cấu hình thường (biến môi trường, file config), **Secret** chứa thông tin nhạy cảm (mật khẩu, API key, chứng chỉ). Cả hai được đưa vào Pod theo hai cách: **biến môi trường** hoặc **file gắn qua volume** — và hai cách này cư xử rất khác nhau khi bạn sửa cấu hình.

## Chuẩn bị

```bash
minikube start
kubectl config set-context --current --namespace=hoc-k8s
```

## Bước 1: Tạo ConfigMap

Tạo file `app-config.yaml` gồm hai ConfigMap — một cho biến môi trường, một chứa nguyên một file HTML:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  APP_ENV: production
  LOG_LEVEL: info
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-html
data:
  index.html: |
    <h1>Xin chào từ ConfigMap — phiên bản 1</h1>
```

```bash
kubectl apply -f app-config.yaml
kubectl get configmap app-config -o yaml
```

## Bước 2: Tạo Secret

Cách nên dùng: tạo bằng lệnh, để kubectl tự mã hoá base64 và giá trị **không nằm trong file nào**:

```bash
kubectl create secret generic app-secret \
  --from-literal=API_KEY=admin \
  --from-literal=DB_PASSWORD='p@ssw0rd'
kubectl get secret app-secret
```

Nếu buộc phải viết YAML, dùng `stringData` — ghi giá trị thô, API server tự mã hoá:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
type: Opaque
stringData:
  API_KEY: admin
  DB_PASSWORD: p@ssw0rd
```

> [!IMPORTANT]
> Bản gốc viết Secret bằng `data:` và tự chạy `echo -n … | base64` cho từng giá trị — dễ sai (quên `-n` là dính ký tự xuống dòng vào mật khẩu) và khiến file YAML chứa secret trông như "đã mã hoá". `kubectl create secret` hoặc `stringData` tránh được cả hai.

> [!CAUTION]
> **Base64 không phải mã hoá.** Ai đọc được Secret là đọc được giá trị: `kubectl get secret app-secret -o jsonpath='{.data.API_KEY}' | base64 -d`. Không commit file Secret (kể cả dạng base64) vào Git.

> [!IMPORTANT]
> Output của bản gốc có một Secret `default-token-xxxxx` tự sinh. Từ Kubernetes 1.24, token của ServiceAccount không còn được lưu thành Secret nữa (Pod nhận token ngắn hạn, tự xoay vòng), nên bạn sẽ không thấy dòng đó.

## Bước 3: Dùng cả hai trong Deployment

Tạo file `app-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-app
          image: nginx:1.28
          ports:
            - name: http
              containerPort: 80
          envFrom:                       # mọi key của ConfigMap thành biến môi trường
            - configMapRef:
                name: app-config
          env:                           # chỉ lấy đúng key cần từ Secret
            - name: API_KEY
              valueFrom:
                secretKeyRef:
                  name: app-secret
                  key: API_KEY
          volumeMounts:
            - name: html                 # ConfigMap thành file
              mountPath: /usr/share/nginx/html
              readOnly: true
            - name: secrets              # Secret thành file, chỉ chủ sở hữu đọc được
              mountPath: /etc/app/secrets
              readOnly: true
          resources:
            requests: { cpu: 50m, memory: 64Mi }
            limits:   { memory: 128Mi }
      volumes:
        - name: html
          configMap:
            name: app-html
        - name: secrets
          secret:
            secretName: app-secret
            defaultMode: 0400
```

```bash
kubectl apply -f app-deployment.yaml
kubectl rollout status deployment/app-deployment
```

Kiểm tra:

```bash
kubectl exec deploy/app-deployment -- printenv APP_ENV LOG_LEVEL API_KEY
kubectl exec deploy/app-deployment -- ls -l /etc/app/secrets
kubectl port-forward deploy/app-deployment 8080:80     # mở http://localhost:8080
```

> [!IMPORTANT]
> Bản gốc chạy `kubectl exec app-deployment-7c8d9f5b6-xyz12 …` — đó là tên Pod **trước** khi apply bản cập nhật. Apply Deployment mới sinh ra Pod mới với tên khác, nên lệnh luôn báo *NotFound*. Dùng `deploy/app-deployment` để kubectl tự chọn Pod hiện tại.

> [!IMPORTANT]
> Bản gốc khai báo `LOG_LEVEL` nhưng không bao giờ dùng, và chỉ minh hoạ biến môi trường. Bản này thêm `envFrom` (lấy cả ConfigMap một lần) và cách gắn thành file — cách hay dùng hơn cho file cấu hình và chứng chỉ.

## Bước 4: Sửa cấu hình — env và file cư xử khác nhau

Sửa cả hai ConfigMap: đổi `APP_ENV: staging` và đổi dòng HTML thành `phiên bản 2`, rồi:

```bash
kubectl apply -f app-config.yaml
```

Đợi khoảng một phút rồi kiểm tra:

```bash
kubectl exec deploy/app-deployment -- printenv APP_ENV               # vẫn là production
kubectl exec deploy/app-deployment -- cat /usr/share/nginx/html/index.html   # đã là phiên bản 2
```

| Cách đưa vào | Sửa ConfigMap / Secret thì | Muốn áp dụng |
|---|---|---|
| Biến môi trường (`env`, `envFrom`) | Pod đang chạy **không** thấy | `kubectl rollout restart deployment/app-deployment` |
| File qua volume | kubelet cập nhật file sau khoảng 1 phút | App phải tự đọc lại file (hoặc restart) |
| File qua volume có `subPath` | **Không** bao giờ cập nhật | Restart |

```bash
kubectl rollout restart deployment/app-deployment
kubectl rollout status deployment/app-deployment
kubectl exec deploy/app-deployment -- printenv APP_ENV               # giờ là staging
```

> [!TIP]
> Helm (bài 6) hay dùng mẹo gắn annotation `checksum/config` (hash của ConfigMap) vào template Pod: cấu hình đổi → hash đổi → Deployment tự rollout. Với cấu hình không bao giờ sửa tại chỗ, đặt `immutable: true` cho ConfigMap / Secret để chặn sửa nhầm và giảm tải cho API server.

## Secret trong production

> [!IMPORTANT]
> Bản gốc chỉ nhắc chung "dùng HashiCorp Vault". Thực tế cần trả lời hai câu hỏi riêng: *Secret nằm ở đâu khi lưu* và *làm sao nó vào cluster mà không đi qua Git*.

| Vấn đề | Cách xử lý thường gặp |
|---|---|
| Secret nằm dạng rõ trong etcd | Bật mã hoá at-rest (EncryptionConfiguration, hoặc KMS của cloud — EKS có sẵn tuỳ chọn mã hoá bằng AWS KMS) |
| Ai cũng `get secrets` được | RBAC: chỉ cấp quyền đọc Secret cho đúng ServiceAccount cần |
| Muốn lưu secret cùng manifest trong Git | **Sealed Secrets**: chỉ commit bản đã mã hoá bằng public key của cluster |
| Secret đã nằm ở Vault / AWS Secrets Manager | **External Secrets Operator** đồng bộ thành Secret của Kubernetes; hoặc **Secrets Store CSI Driver** gắn thẳng thành file |

## Dọn dẹp

```bash
kubectl delete -f app-deployment.yaml -f app-config.yaml
kubectl delete secret app-secret
```

## Tóm tắt

- ConfigMap cho cấu hình thường, Secret cho thông tin nhạy cảm — nhưng Secret chỉ là base64, bảo mật thật đến từ RBAC, mã hoá at-rest và cách đưa secret vào cluster.
- Biến môi trường không tự cập nhật; file qua volume thì có (trừ `subPath`). Đổi cấu hình dạng env → `rollout restart`.
- Tạo Secret bằng `kubectl create secret` hoặc `stringData`, không tự base64 bằng tay, không commit vào Git.

Tài liệu: [ConfigMaps](https://kubernetes.io/docs/concepts/configuration/configmap/) · [Secrets](https://kubernetes.io/docs/concepts/configuration/secret/) · [Good practices for Secrets](https://kubernetes.io/docs/concepts/security/secrets-good-practices/)
