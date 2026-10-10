---
ten: ConfigMap và Secret — quản lý cấu hình ứng dụng
thoiGian: 35 phút
chip: ConfigMap, Secret, env, envFrom, volume, rollout restart
bank: Kubernetes, Security
---

**ConfigMap** lưu cấu hình thông thường của ứng dụng (biến môi trường, file cấu hình), còn **Secret** lưu thông tin nhạy cảm (mật khẩu, API key, chứng chỉ). Tách cấu hình ra khỏi image giúp **một image chạy được ở mọi môi trường** — dev, staging, production chỉ khác nhau ở ConfigMap / Secret. Bài này hướng dẫn tạo ConfigMap và Secret rồi đưa chúng vào Pod theo hai cách: biến môi trường và file.

Sau bài này bạn sẽ:

- Tạo ConfigMap, Secret bằng YAML và bằng lệnh.
- Đưa cấu hình vào Pod dưới dạng biến môi trường và dạng file.
- Biết khi nào sửa cấu hình thì Pod tự nhận, khi nào phải khởi động lại.

## Bước 1: Khởi động cluster và tạo Deployment

```bash
minikube start
```

Tạo file `app-deployment.yaml` — tạm thời chưa dùng ConfigMap / Secret:

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
          resources:
            requests: { cpu: 50m, memory: 64Mi }
            limits:   { memory: 128Mi }
```

```bash
kubectl apply -f app-deployment.yaml
kubectl rollout status deployment/app-deployment
kubectl get pods -l app=my-app
```

```text
NAME                              READY   STATUS    RESTARTS   AGE
app-deployment-7c8d9f5b6c-x2k9z   1/1     Running   0          10s
```

## Bước 2: Tạo ConfigMap để lưu cấu hình

Tạo file `app-configmap.yaml` gồm hai ConfigMap: một chứa các biến môi trường, một chứa nguyên nội dung một file HTML:

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

- Phần `data` là các cặp `key: value`. Giá trị luôn là **chuỗi**.
- Dấu `|` trong YAML cho phép viết giá trị nhiều dòng — dùng để chứa cả một file cấu hình.
- Dấu `---` ngăn cách nhiều tài nguyên trong cùng một file.

```bash
kubectl apply -f app-configmap.yaml
kubectl get configmaps
kubectl describe configmap app-config
```

```text
configmap/app-config created
configmap/app-html created

NAME               DATA   AGE
app-config         2      5s
app-html           1      5s
kube-root-ca.crt   1      10m
```

`kube-root-ca.crt` là ConfigMap Kubernetes tự tạo trong mọi namespace (chứa chứng chỉ của cluster) — không cần quan tâm.

> [!TIP]
> Tạo ConfigMap nhanh bằng lệnh: `kubectl create configmap app-config --from-literal=APP_ENV=production --from-literal=LOG_LEVEL=info`, hoặc từ file có sẵn: `kubectl create configmap app-html --from-file=index.html`.

## Bước 3: Tạo Secret để lưu thông tin nhạy cảm

Cách khuyến nghị là tạo bằng lệnh — kubectl tự mã hoá base64 và giá trị không nằm trong file nào để lỡ commit lên Git:

```bash
kubectl create secret generic app-secret \
  --from-literal=API_KEY=admin \
  --from-literal=DB_PASSWORD='p@ssw0rd'
```

```text
secret/app-secret created
```

Nếu cần viết bằng YAML (ví dụ để tạo tự động), dùng trường `stringData` và ghi giá trị dạng thường — API server tự mã hoá base64:

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

Kiểm tra:

```bash
kubectl get secrets
kubectl describe secret app-secret
```

```text
NAME         TYPE     DATA   AGE
app-secret   Opaque   2      5s

Data
====
API_KEY:      5 bytes
DB_PASSWORD:  8 bytes
```

`describe` chỉ hiện độ dài, không hiện giá trị. Nhưng hãy thử lệnh này:

```bash
kubectl get secret app-secret -o jsonpath='{.data.API_KEY}' | base64 -d; echo
```

Nó in ra `admin`. Secret chỉ được **mã hoá base64, không phải mã hoá bảo mật** — ai có quyền đọc Secret là đọc được giá trị.

> [!CAUTION]
> Không commit file Secret (dù ở dạng base64) lên Git. Hạn chế quyền đọc Secret bằng RBAC. Cách quản lý Secret an toàn trong production xem ở cuối bài.

## Bước 4: Sử dụng ConfigMap và Secret trong Pod

Cập nhật `app-deployment.yaml`, thêm phần `envFrom`, `env`, `volumeMounts` và `volumes`:

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
          # Cách 1 — biến môi trường
          envFrom:
            - configMapRef:
                name: app-config          # mọi key của app-config thành biến môi trường
          env:
            - name: API_KEY               # chỉ lấy đúng một key từ Secret
              valueFrom:
                secretKeyRef:
                  name: app-secret
                  key: API_KEY
          # Cách 2 — file
          volumeMounts:
            - name: html
              mountPath: /usr/share/nginx/html
              readOnly: true
            - name: secrets
              mountPath: /etc/app/secrets
              readOnly: true
          resources:
            requests: { cpu: 50m, memory: 64Mi }
            limits:   { memory: 128Mi }
      volumes:
        - name: html
          configMap:
            name: app-html                # mỗi key thành một file: index.html
        - name: secrets
          secret:
            secretName: app-secret        # API_KEY và DB_PASSWORD thành hai file
            defaultMode: 0400             # chỉ chủ sở hữu được đọc
```

| Cách | Khai báo | Ứng dụng đọc bằng | Hợp với |
|---|---|---|---|
| Biến môi trường | `envFrom` (cả ConfigMap), `env` + `valueFrom` (từng key) | `process.env`, `os.Getenv`… | Vài giá trị ngắn |
| File qua volume | `volumes` + `volumeMounts` | Đọc file | File cấu hình, chứng chỉ, giá trị dài |

Áp dụng:

```bash
kubectl apply -f app-deployment.yaml
kubectl rollout status deployment/app-deployment
```

Kiểm tra biến môi trường (trỏ vào `deploy/…` để kubectl tự chọn Pod hiện tại — Pod cũ đã được thay bằng Pod mới):

```bash
kubectl exec deploy/app-deployment -- printenv APP_ENV LOG_LEVEL API_KEY
```

```text
production
info
admin
```

Kiểm tra file:

```bash
kubectl exec deploy/app-deployment -- ls -l /etc/app/secrets
kubectl exec deploy/app-deployment -- cat /usr/share/nginx/html/index.html
```

```text
lrwxrwxrwx 1 root root 14 ... API_KEY -> ..data/API_KEY
lrwxrwxrwx 1 root root 18 ... DB_PASSWORD -> ..data/DB_PASSWORD
<h1>Xin chào từ ConfigMap — phiên bản 1</h1>
```

Xem trên trình duyệt: `kubectl port-forward deploy/app-deployment 8080:80` rồi mở `http://localhost:8080` — trang Nginx giờ hiện nội dung từ ConfigMap.

## Bước 5: Cập nhật cấu hình

Biến môi trường và file cư xử **khác nhau** khi bạn sửa cấu hình. Sửa `app-configmap.yaml`: đổi `APP_ENV: staging` và đổi dòng HTML thành `phiên bản 2`, rồi:

```bash
kubectl apply -f app-configmap.yaml
```

Đợi khoảng 1 phút, kiểm tra lại:

```bash
kubectl exec deploy/app-deployment -- printenv APP_ENV
kubectl exec deploy/app-deployment -- cat /usr/share/nginx/html/index.html
```

```text
production
<h1>Xin chào từ ConfigMap — phiên bản 2</h1>
```

File đã đổi, biến môi trường thì chưa. Biến môi trường chỉ được đọc **lúc container khởi động**, nên phải khởi động lại Pod:

```bash
kubectl rollout restart deployment/app-deployment
kubectl rollout status deployment/app-deployment
kubectl exec deploy/app-deployment -- printenv APP_ENV
```

```text
staging
```

| Đưa cấu hình vào bằng | Sửa ConfigMap / Secret thì | Để áp dụng |
|---|---|---|
| Biến môi trường | Pod đang chạy không thấy thay đổi | `kubectl rollout restart deployment/<tên>` |
| File qua volume | File tự cập nhật sau khoảng 1 phút | Ứng dụng tự đọc lại file, hoặc restart |
| File qua volume có `subPath` | Không bao giờ tự cập nhật | Restart |

> [!TIP]
> Cấu hình không bao giờ sửa tại chỗ thì đặt `immutable: true` cho ConfigMap / Secret: tránh sửa nhầm và giảm tải cho cluster. Muốn đổi thì tạo ConfigMap mới (ví dụ `app-config-v2`) rồi trỏ Deployment sang.

## Bước 6: Xoá tài nguyên để dọn dẹp

```bash
kubectl delete -f app-deployment.yaml -f app-configmap.yaml
kubectl delete secret app-secret
minikube stop
```

```text
deployment.apps "app-deployment" deleted
configmap "app-config" deleted
configmap "app-html" deleted
secret "app-secret" deleted
```

## Xử lý sự cố thường gặp

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Pod ở `CreateContainerConfigError` | Tham chiếu ConfigMap / Secret / key không tồn tại | `kubectl describe pod` xem Events; kiểm tra tên và key |
| Biến môi trường vẫn giá trị cũ | Biến môi trường không tự cập nhật | `kubectl rollout restart deployment/<tên>` |
| `exec` báo Pod not found | Dùng tên Pod cũ đã bị thay | Dùng `deploy/<tên>` thay cho tên Pod |
| Mật khẩu sai khi tự viết `data:` base64 | Quên `-n` trong `echo -n … \| base64`, dính ký tự xuống dòng | Dùng `kubectl create secret` hoặc `stringData` |

## Lưu ý quan trọng — Secret trong production

Base64 không bảo vệ gì. Bảo mật Secret thật đến từ các lớp sau:

| Vấn đề | Cách xử lý phổ biến |
|---|---|
| Secret lưu dạng rõ trong etcd | Bật mã hoá at-rest (EncryptionConfiguration, hoặc KMS của cloud như AWS KMS trên EKS) |
| Quá nhiều người / ứng dụng đọc được Secret | RBAC: chỉ cấp quyền `get secrets` cho đúng ServiceAccount cần |
| Muốn lưu Secret trong Git cùng manifest | **Sealed Secrets**: chỉ commit bản đã mã hoá, chỉ cluster giải mã được |
| Secret đã nằm ở Vault / AWS Secrets Manager | **External Secrets Operator** tự đồng bộ thành Secret; hoặc **Secrets Store CSI Driver** gắn thẳng thành file |

Tài liệu: [ConfigMaps](https://kubernetes.io/docs/concepts/configuration/configmap/) · [Secrets](https://kubernetes.io/docs/concepts/configuration/secret/) · [Good practices for Secrets](https://kubernetes.io/docs/concepts/security/secrets-good-practices/)
