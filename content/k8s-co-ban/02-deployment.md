---
ten: Deployment — triển khai, tự phục hồi và rollout
goc: https://devops.vn/posts/kubernetes-pod-deployment-trien-khai-ung-dung/
thoiGian: 30 phút
chip: Deployment, ReplicaSet, rolling update, probe, resources
bank: Kubernetes
---

Ở bài 1, Pod bị xoá là mất luôn. **Deployment** giải quyết việc đó: bạn khai báo "luôn có 3 bản Nginx", Deployment tạo một **ReplicaSet**, ReplicaSet tạo và canh giữ đủ 3 Pod. Pod chết thì tạo lại; đổi image thì thay dần từng Pod (rolling update) và cho phép quay lui (rollback).

```text
Deployment ──quản lý──► ReplicaSet (mỗi phiên bản một cái) ──quản lý──► Pod × N
```

## Chuẩn bị

```bash
minikube start
kubectl config set-context --current --namespace=hoc-k8s
```

## Bước 1: Viết Deployment

Tạo file `nginx-deployment.yaml` (bài 3 dùng lại file này):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  revisionHistoryLimit: 5          # giữ 5 ReplicaSet cũ để rollback
  selector:
    matchLabels:
      app: nginx                   # phải khớp label trong template
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1                  # được tạo dư tối đa 1 Pod khi cập nhật
      maxUnavailable: 0            # không bao giờ giảm dưới số replicas
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:1.27
          ports:
            - name: http
              containerPort: 80
          resources:
            requests:              # scheduler dựa vào đây để xếp Pod lên node
              cpu: 50m
              memory: 64Mi
            limits:
              memory: 128Mi        # vượt là container bị OOMKilled
          readinessProbe:          # chưa đạt thì Pod chưa nhận traffic
            httpGet:
              path: /
              port: http
            periodSeconds: 5
          livenessProbe:           # trượt liên tục thì kubelet khởi động lại container
            httpGet:
              path: /
              port: http
            initialDelaySeconds: 10
            periodSeconds: 10
```

> [!IMPORTANT]
> Bản gốc chỉ có image và port. Bản này thêm ba thứ mà mọi Deployment thật đều phải có:
>
> - **`resources.requests`**: không có thì scheduler xếp Pod "mù", node dễ quá tải; HPA ở bài 9 cũng không tính được % CPU.
> - **`limits.memory`**: chặn một Pod rò rỉ bộ nhớ ăn hết RAM của node.
> - **`readinessProbe` / `livenessProbe`**: không có thì Kubernetes coi container "đang chạy" là "sẵn sàng", và rolling update có thể chuyển traffic vào Pod chưa khởi động xong.

> [!NOTE]
> Không đặt `limits.cpu` là cố ý. Vượt limit CPU không làm container chết mà bị *throttle* (chạy chậm lại), thường gây tăng latency khó hiểu. Nhiều team chỉ đặt `requests.cpu` và `limits.memory`. Bài 9 quay lại chủ đề này.

## Bước 2: Triển khai và kiểm tra

```bash
kubectl apply -f nginx-deployment.yaml
kubectl rollout status deployment/nginx-deployment
kubectl get deployment,replicaset,pods -l app=nginx
```

```text
NAME                               READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/nginx-deployment   3/3     3            3           25s

NAME                                          DESIRED   CURRENT   READY   AGE
replicaset.apps/nginx-deployment-6b7f9c8d5c   3         3         3       25s

NAME                                    READY   STATUS    RESTARTS   AGE
pod/nginx-deployment-6b7f9c8d5c-2xk8p   1/1     Running   0          25s
pod/nginx-deployment-6b7f9c8d5c-9qv4m   1/1     Running   0          25s
pod/nginx-deployment-6b7f9c8d5c-tz7wn   1/1     Running   0          25s
```

Tên Pod = tên Deployment + hash của template (`6b7f9c8d5c`) + chuỗi ngẫu nhiên. Hash đổi khi template đổi — đó là cách Kubernetes phân biệt phiên bản.

## Bước 3: Thử khả năng tự phục hồi

Mở terminal thứ hai để theo dõi:

```bash
kubectl get pods -l app=nginx --watch
```

Ở terminal đầu, xoá một Pod bất kỳ:

```bash
kubectl delete $(kubectl get pods -l app=nginx -o name | head -n 1)
```

Ở terminal theo dõi, bạn thấy một Pod `Terminating` và gần như ngay lập tức một Pod mới `ContainerCreating` → `Running`. ReplicaSet thấy còn 2/3 nên tạo bù.

## Bước 4: Rolling update và rollback

Nâng image từ `1.27` lên `1.28`:

```bash
kubectl set image deployment/nginx-deployment nginx=nginx:1.28
kubectl annotate deployment/nginx-deployment kubernetes.io/change-cause="nâng nginx lên 1.28" --overwrite
kubectl rollout status deployment/nginx-deployment
kubectl rollout history deployment/nginx-deployment
```

```text
REVISION  CHANGE-CAUSE
1         <none>
2         nâng nginx lên 1.28
```

Giả sử bản mới có lỗi — quay lui:

```bash
kubectl rollout undo deployment/nginx-deployment            # về revision liền trước
kubectl rollout undo deployment/nginx-deployment --to-revision=1
```

> [!IMPORTANT]
> Bản gốc dừng ở việc tạo Deployment, bỏ qua rollout/rollback — trong khi đây là lý do chính để dùng Deployment. Nếu tài liệu khác bảo dùng `kubectl set image … --record`: cờ `--record` đã bị deprecate, thay bằng annotation `kubernetes.io/change-cause` như trên.

> [!WARNING]
> `kubectl set image` và `kubectl scale` là thay đổi **ngoài file YAML**. Lần `kubectl apply -f nginx-deployment.yaml` kế tiếp sẽ đưa image về `1.27`. Ngoài lab, luôn sửa file (hoặc values của Helm) rồi apply, để Git là nguồn sự thật.

## Bước 5: Truy cập ứng dụng bằng port-forward

```bash
kubectl port-forward deployment/nginx-deployment 8080:80
```

Mở `http://localhost:8080`. Nhấn `Ctrl+C` để dừng.

> [!IMPORTANT]
> Bản gốc port-forward vào một **tên Pod gõ cứng** (`nginx-deployment-5d9f8b6f5-abcde`). Tên đó là ngẫu nhiên, khác trên mỗi máy và đổi sau mỗi lần cập nhật, nên lệnh copy về sẽ báo *NotFound*. Trỏ vào `deployment/…` (hoặc `svc/…` ở bài 3) để kubectl tự chọn một Pod đang chạy.

`port-forward` chỉ dùng để thử và debug — nó đi qua API server và chỉ tới **một** Pod. Bài 3 dùng Service và Ingress để truy cập đúng cách.

## Dọn dẹp

Giữ lại Deployment cho bài 3, hoặc xoá:

```bash
kubectl delete -f nginx-deployment.yaml
```

## Tóm tắt lệnh

| Lệnh | Dùng để |
|---|---|
| `kubectl rollout status deploy/<tên>` | Đợi rollout xong (dùng trong CI ở bài 7) |
| `kubectl set image deploy/<tên> <container>=<image>` | Đổi image (nhanh, ngoài Git) |
| `kubectl rollout history` / `undo` | Xem lịch sử / quay lui |
| `kubectl rollout restart deploy/<tên>` | Khởi động lại toàn bộ Pod theo kiểu rolling |
| `kubectl scale deploy/<tên> --replicas=N` | Đổi số bản (ngoài Git) |

Tài liệu: [Kubernetes — Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) · [Liveness, Readiness, Startup Probes](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/)
