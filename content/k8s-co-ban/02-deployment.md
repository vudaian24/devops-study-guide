---
ten: Pod và Deployment — triển khai ứng dụng đầu tiên
thoiGian: 30 phút
chip: Pod, Deployment, ReplicaSet, rolling update, rollback, probe
bank: Kubernetes
---

**Pod** là đơn vị nhỏ nhất trong Kubernetes, chứa một hoặc nhiều container chạy cùng nhau trên một node. **Deployment** quản lý các Pod: đảm bảo luôn có đúng số Pod mong muốn đang chạy, tự tạo lại Pod bị lỗi, và cập nhật ứng dụng lên phiên bản mới mà không gián đoạn. Ở bài 1 bạn đã tạo một Pod đơn lẻ; bài này dùng Deployment để triển khai Nginx với 3 bản chạy song song và truy cập vào nó.

Sau bài này bạn sẽ:

- Viết được Deployment có đủ các phần cần thiết: số bản chạy, tài nguyên, kiểm tra sức khoẻ.
- Thấy tận mắt Kubernetes tự tạo lại Pod bị xoá.
- Cập nhật phiên bản ứng dụng và quay lui (rollback) khi cần.

## Deployment hoạt động thế nào?

```text
Deployment ──quản lý──► ReplicaSet ──quản lý──► Pod, Pod, Pod
```

- Bạn khai báo Deployment: "chạy 3 Pod từ image `nginx:1.27`".
- Deployment tạo một **ReplicaSet** — thành phần chuyên giữ đúng số lượng Pod.
- Khi bạn đổi image, Deployment tạo ReplicaSet mới cho phiên bản mới, rồi lần lượt tăng Pod mới và giảm Pod cũ (**rolling update**). ReplicaSet cũ được giữ lại để có thể quay lui.

## Bước 1: Khởi động cluster Minikube

```bash
minikube start
kubectl get nodes
```

Node ở trạng thái `Ready` là sẵn sàng. (Nếu chưa có cluster, xem bài 1.)

## Bước 2: Tạo Deployment và kiểm tra Pod

Tạo file `nginx-deployment.yaml` (bài 3, 5, 8 sẽ dùng lại file này):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
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
          image: nginx:1.27
          ports:
            - name: http
              containerPort: 80
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              memory: 128Mi
          readinessProbe:
            httpGet:
              path: /
              port: http
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /
              port: http
            initialDelaySeconds: 10
            periodSeconds: 10
```

Giải thích các phần quan trọng:

| Trường | Ý nghĩa |
|---|---|
| `replicas: 3` | Luôn giữ 3 Pod chạy |
| `selector.matchLabels` | Deployment quản lý những Pod có nhãn `app: nginx`. **Phải khớp** với `template.metadata.labels` |
| `template` | "Khuôn" để tạo Pod — giống hệt phần Pod ở bài 1 |
| `ports.name: http` | Đặt tên cho cổng; probe và Service (bài 3) gọi cổng theo tên này |
| `resources.requests` | Lượng CPU / RAM Pod cần. Scheduler dựa vào đây để chọn node còn đủ chỗ. `50m` = 0,05 CPU |
| `resources.limits.memory` | Trần RAM. Vượt trần, container bị dừng với lý do `OOMKilled` — chặn một Pod ăn hết RAM của node |
| `readinessProbe` | Kubernetes gọi `GET /` mỗi 5 giây; chỉ khi thành công Pod mới được nhận traffic |
| `livenessProbe` | Nếu `GET /` thất bại liên tục, kubelet khởi động lại container |

> [!NOTE]
> Không đặt `limits.cpu` là có chủ ý. Vượt giới hạn CPU không làm container dừng mà bị "bóp" (throttle) — ứng dụng chậm lại khó hiểu. Cách làm phổ biến: đặt `requests.cpu` và `limits.memory`.

Triển khai và đợi tới khi xong:

```bash
kubectl apply -f nginx-deployment.yaml
kubectl rollout status deployment/nginx-deployment
```

```text
deployment.apps/nginx-deployment created
Waiting for deployment "nginx-deployment" rollout to finish: 0 of 3 updated replicas are available...
deployment "nginx-deployment" successfully rolled out
```

Xem cả ba tầng Deployment → ReplicaSet → Pod:

```bash
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

Tên Pod = tên Deployment + mã của phiên bản (`6b7f9c8d5c`) + chuỗi ngẫu nhiên. Tên này thay đổi mỗi lần Pod được tạo lại, nên **đừng gõ cứng tên Pod** trong lệnh — hãy trỏ vào `deployment/nginx-deployment`.

## Bước 3: Thử khả năng tự phục hồi

Mở **terminal thứ hai** để theo dõi Pod theo thời gian thực:

```bash
kubectl get pods -l app=nginx --watch
```

Ở terminal đầu, xoá một Pod bất kỳ:

```bash
kubectl delete $(kubectl get pods -l app=nginx -o name | head -n 1)
```

Ở terminal theo dõi, bạn thấy một Pod chuyển sang `Terminating` và gần như ngay lập tức một Pod mới xuất hiện (`ContainerCreating` → `Running`). ReplicaSet thấy chỉ còn 2/3 nên tạo bù. Nhấn `Ctrl+C` để thoát chế độ theo dõi.

Muốn đổi số bản chạy, sửa `replicas` trong file rồi apply lại:

```bash
# sửa replicas: 3 → 5 trong nginx-deployment.yaml, rồi:
kubectl apply -f nginx-deployment.yaml
kubectl get pods -l app=nginx
```

## Bước 4: Cập nhật phiên bản và quay lui

Nâng Nginx từ `1.27` lên `1.28`: sửa dòng image trong file thành `image: nginx:1.28`, rồi:

```bash
kubectl apply -f nginx-deployment.yaml
kubectl annotate deployment/nginx-deployment kubernetes.io/change-cause="nâng nginx lên 1.28" --overwrite
kubectl rollout status deployment/nginx-deployment
```

Trong lúc chạy, Kubernetes tạo Pod mới bản 1.28, đợi Pod đó qua `readinessProbe`, rồi mới xoá một Pod cũ — lặp lại tới khi xong. Ứng dụng không lúc nào bị gián đoạn.

Xem lịch sử phiên bản:

```bash
kubectl rollout history deployment/nginx-deployment
```

```text
REVISION  CHANGE-CAUSE
1         <none>
2         nâng nginx lên 1.28
```

Giả sử bản mới có lỗi, quay về bản trước bằng một lệnh:

```bash
kubectl rollout undo deployment/nginx-deployment
kubectl rollout status deployment/nginx-deployment
kubectl get deployment nginx-deployment -o jsonpath='{.spec.template.spec.containers[0].image}'; echo
```

Kết quả cuối in ra `nginx:1.27` — đã quay lui thành công.

> [!WARNING]
> `rollout undo` chỉ đổi trạng thái trong cluster, file YAML vẫn ghi `1.28`. Lần `kubectl apply` kế tiếp sẽ đưa bản 1.28 trở lại. Sau khi rollback, nhớ sửa file cho khớp — file YAML (lưu trong Git) phải luôn là "nguồn sự thật".

## Bước 5: Truy cập ứng dụng qua port-forward

```bash
kubectl port-forward deployment/nginx-deployment 8080:80
```

```text
Forwarding from 127.0.0.1:8080 -> 80
Forwarding from [::1]:8080 -> 80
```

Mở `http://localhost:8080` sẽ thấy trang **Welcome to nginx!**. Nhấn `Ctrl+C` để dừng.

`port-forward` trỏ vào `deployment/…` nên kubectl tự chọn một Pod đang chạy. Cách này chỉ dùng để thử và debug — mọi traffic đi qua một Pod duy nhất. Bài 3 dùng **Service** để chia tải đều cho cả 3 Pod.

## Bước 6: Xoá tài nguyên để dọn dẹp

Nếu học tiếp bài 3 ngay, có thể giữ lại Deployment. Muốn xoá:

```bash
kubectl delete -f nginx-deployment.yaml
minikube stop
```

```text
deployment.apps "nginx-deployment" deleted
```

## Xử lý sự cố thường gặp

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| `selector does not match template labels` | `selector.matchLabels` khác `template.metadata.labels` | Sửa cho hai chỗ giống nhau |
| `rollout status` đứng mãi ở "x of 3 updated replicas are available" | Pod mới không qua readiness probe hoặc không kéo được image | `kubectl get pods`, rồi `kubectl describe pod <tên-pod-mới>` xem Events |
| Pod `CrashLoopBackOff` | Container khởi động rồi thoát liên tục | `kubectl logs <pod> --previous` xem log lần chạy trước |
| Pod bị restart với lý do `OOMKilled` | Dùng RAM vượt `limits.memory` | Tăng limit, hoặc kiểm tra ứng dụng rò rỉ bộ nhớ |

## Lưu ý quan trọng

- **Replicas**: số Pod do `replicas` quyết định; Pod bị xoá hay hỏng sẽ được tạo lại tự động.
- **Port-forward**: chỉ để thử nghiệm. Truy cập thật cần Service (bài 3).
- **Luôn có `resources` và probe**: thiếu `requests`, scheduler xếp Pod "mù" và autoscaling (bài 9) không hoạt động; thiếu probe, traffic có thể vào Pod chưa sẵn sàng.
- Tài liệu: [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) · [Liveness, Readiness, Startup Probes](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/)

## Tóm tắt lệnh

| Lệnh | Dùng để |
|---|---|
| `kubectl apply -f <file>` | Tạo / cập nhật theo file |
| `kubectl rollout status deploy/<tên>` | Đợi cập nhật xong |
| `kubectl rollout history deploy/<tên>` | Xem lịch sử phiên bản |
| `kubectl rollout undo deploy/<tên>` | Quay lui bản trước |
| `kubectl rollout restart deploy/<tên>` | Khởi động lại lần lượt toàn bộ Pod |
| `kubectl get pods -l app=<nhãn> --watch` | Theo dõi Pod theo thời gian thực |
