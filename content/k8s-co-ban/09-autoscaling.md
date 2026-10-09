---
ten: Autoscaling — tối ưu hoá cluster hiệu quả
goc: https://devops.vn/posts/kubernetes-autoscaling-toi-uu-hoa-cluster/
thoiGian: 35 phút
chip: metrics-server, HPA, requests/limits, behavior, Karpenter, KEDA, VPA
bank: Kubernetes
---

**Autoscaling** là tự động điều chỉnh tài nguyên theo tải: tải tăng thì thêm, tải giảm thì bớt — vừa giữ ứng dụng nhanh, vừa không lãng phí tiền. **Horizontal Pod Autoscaler (HPA)** tăng / giảm **số Pod** dựa trên mức dùng CPU, RAM; còn **Cluster Autoscaler** hoặc **Karpenter** tăng / giảm **số node** khi cluster hết chỗ. Bài này thực hành HPA trên Minikube: cài metrics-server, cấu hình tài nguyên cho Pod, tạo HPA, rồi tạo tải để xem Pod tự nhân lên và tự giảm xuống.

Sau bài này bạn sẽ:

- Hiểu vì sao HPA cần `resources.requests` và metrics-server.
- Tạo HPA, quan sát nó tăng / giảm số Pod theo tải.
- Biết các công cụ co giãn khác và khi nào dùng.

## Bước 1: Khởi động Minikube và cài Metrics Server

HPA cần biết mỗi Pod đang dùng bao nhiêu CPU / RAM. **Metrics Server** thu thập số liệu đó từ các node. Minikube có sẵn addon:

```bash
minikube start
kubectl config use-context minikube
minikube addons enable metrics-server
kubectl -n kube-system rollout status deployment/metrics-server
```

```text
🌟  The 'metrics-server' addon is enabled
deployment "metrics-server" successfully rolled out
```

Đợi khoảng 1 phút để có số liệu đầu tiên, rồi kiểm tra:

```bash
kubectl top nodes
```

```text
NAME       CPU(cores)   CPU(%)   MEMORY(bytes)   MEMORY(%)
minikube   312m         7%       1450Mi          24%
```

Nếu thấy `error: metrics not available yet`, đợi thêm một chút rồi chạy lại.

## Bước 2: Triển khai ứng dụng và cấu hình tài nguyên

Tạo file `nginx-deployment.yaml` cho bài này:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 1
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
            requests:
              cpu: 100m
              memory: 64Mi
            limits:
              memory: 128Mi
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: http
```

`requests.cpu: 100m` là **mốc để HPA tính phần trăm**: Pod dùng 50m CPU nghĩa là 50%, dùng 200m là 200%. Thiếu `requests.cpu`, HPA không tính được và không bao giờ co giãn.

Không đặt `limits.cpu` để Pod không bị bóp CPU khi tải tăng — nhờ vậy HPA thấy được mức dùng thật và thêm Pod kịp thời. Vẫn giữ `limits.memory` để chặn Pod dùng quá nhiều RAM.

```bash
kubectl apply -f nginx-deployment.yaml
kubectl rollout status deployment/nginx-deployment
kubectl top pods
```

```text
NAME                                CPU(cores)   MEMORY(bytes)
nginx-deployment-5d9f8b6f5c-x7k2p   0m           3Mi
```

## Bước 3: Cấu hình Horizontal Pod Autoscaler (HPA)

Tạo file `nginx-hpa.yaml`:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nginx-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nginx-deployment
  minReplicas: 1
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 50
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
    scaleDown:
      stabilizationWindowSeconds: 60
```

| Trường | Ý nghĩa |
|---|---|
| `scaleTargetRef` | Đối tượng được co giãn: Deployment `nginx-deployment` |
| `minReplicas`, `maxReplicas` | Luôn có từ 1 đến 5 Pod |
| `averageUtilization: 50` | Mục tiêu: trung bình mỗi Pod dùng 50% `requests.cpu` (tức 50m) |
| `behavior.scaleUp.stabilizationWindowSeconds: 0` | Tải tăng là thêm Pod ngay |
| `behavior.scaleDown.stabilizationWindowSeconds: 60` | Tải phải thấp liên tục 60 giây mới bớt Pod. Mặc định là 300 giây (5 phút) — chống thêm / bớt liên tục khi tải dao động; bài lab rút ngắn để quan sát nhanh |

HPA tính số Pod cần có theo công thức:

```text
số Pod mong muốn = làm tròn lên ( số Pod hiện tại × mức dùng hiện tại / mức mục tiêu )

Ví dụ: 1 Pod đang dùng 180% → 1 × 180 / 50 = 3,6 → 4 Pod
```

Triển khai:

```bash
kubectl apply -f nginx-hpa.yaml
kubectl get hpa
```

```text
NAME        REFERENCE                     TARGETS       MINPODS   MAXPODS   REPLICAS   AGE
nginx-hpa   Deployment/nginx-deployment   cpu: 0%/50%   1         5         1          20s
```

`TARGETS` cho biết mức dùng hiện tại / mục tiêu. Trong khoảng một phút đầu có thể hiện `<unknown>/50%` — HPA chưa nhận được số liệu, đợi thêm là có.

## Bước 4: Tạo tải để kiểm tra autoscaling

Mở **terminal 1** để theo dõi HPA:

```bash
kubectl get hpa nginx-hpa --watch
```

Mở **terminal 2** và chạy một Pod liên tục gửi request tới Nginx:

```bash
kubectl run load-generator --rm -it --restart=Never --image=busybox:1.36 -- \
  /bin/sh -c "while sleep 0.005; do wget -q -O- http://nginx-service > /dev/null; done"
```

Sau 1–2 phút, terminal 1 hiển thị CPU vượt mục tiêu và số Pod tăng dần:

```text
NAME        REFERENCE                     TARGETS         MINPODS   MAXPODS   REPLICAS
nginx-hpa   Deployment/nginx-deployment   cpu: 0%/50%     1         5         1
nginx-hpa   Deployment/nginx-deployment   cpu: 187%/50%   1         5         1
nginx-hpa   Deployment/nginx-deployment   cpu: 187%/50%   1         5         4
nginx-hpa   Deployment/nginx-deployment   cpu: 48%/50%    1         5         4
```

Xem HPA đã quyết định gì và vì sao (terminal 3):

```bash
kubectl describe hpa nginx-hpa
kubectl get pods -l app=nginx
```

```text
Events:
  Normal  SuccessfulRescale  1m  horizontal-pod-autoscaler  New size: 4; reason: cpu resource utilization (percentage of request) above target
```

**Dừng tải**: nhấn `Ctrl+C` ở terminal 2 (Pod `load-generator` tự xoá). Sau khoảng 1 phút (đúng `stabilizationWindowSeconds: 60`), số Pod giảm dần về 1.

> [!TIP]
> Nginx phục vụ trang tĩnh rất nhẹ nên đôi khi khó đẩy CPU vượt 50%. Nếu không thấy tăng Pod: chạy thêm một load-generator nữa với tên khác (`load-generator-2`), hoặc giảm `requests.cpu` xuống `20m` rồi apply lại.

## Bước 5: Xoá tài nguyên để dọn dẹp

```bash
kubectl delete -f nginx-hpa.yaml -f nginx-deployment.yaml
minikube stop
```

```text
horizontalpodautoscaler.autoscaling "nginx-hpa" deleted
deployment.apps "nginx-deployment" deleted
service "nginx-service" deleted
```

Đã hoàn thành series: `minikube delete` để xoá hẳn cluster nếu không dùng nữa.

## Xử lý sự cố thường gặp

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| `TARGETS` mãi `<unknown>` | Thiếu metrics-server, hoặc Pod không có `requests.cpu` | `kubectl top pods` có số liệu chưa; thêm `requests.cpu` |
| `kubectl top` báo `metrics not available yet` | metrics-server mới khởi động | Đợi 1–2 phút |
| Tải tăng nhưng không thêm Pod | CPU chưa vượt mục tiêu | Thêm load-generator, hoặc giảm `requests.cpu` |
| Hết tải nhưng Pod giảm rất chậm | Cửa sổ ổn định khi giảm (mặc định 5 phút) | Bình thường — đó là cơ chế chống dao động |
| Pod mới mãi `Pending` | Node hết CPU / RAM | Cần co giãn node (Cluster Autoscaler / Karpenter) hoặc giảm `requests` |

## Lưu ý quan trọng — các tầng autoscaling

HPA chỉ là một tầng. Hệ thống thật thường kết hợp nhiều công cụ:

| Công cụ | Co giãn cái gì | Dựa trên | Dùng khi |
|---|---|---|---|
| **HPA** | Số Pod | CPU, RAM, metrics tuỳ chỉnh | Ứng dụng web / API — bài này |
| **KEDA** | Số Pod (có thể về 0) | Sự kiện: độ dài hàng đợi SQS / Kafka, lịch cron, truy vấn Prometheus… | Worker xử lý hàng đợi, job theo lịch |
| **VPA** | `requests` / `limits` của Pod | Lịch sử sử dụng | Tìm mức tài nguyên phù hợp; thường bật chế độ chỉ đề xuất. Không dùng cùng HPA trên cùng chỉ số CPU |
| **Cluster Autoscaler** | Số node trong node group | Pod `Pending` vì thiếu chỗ | Cách truyền thống, theo node group định sẵn |
| **Karpenter** | Node (tự chọn loại EC2 phù hợp) | Pod `Pending` | Được khuyến nghị trên EKS: nhanh, linh hoạt, tự gom Pod để tắt node thừa; có sẵn trong EKS Auto Mode |

- **HPA và tầng node phải đi cùng nhau**: HPA thêm Pod, nhưng node hết chỗ thì Pod mới nằm `Pending` — cần Cluster Autoscaler / Karpenter để thêm node.
- **Đặt `requests` sát thực tế**: quá cao thì lãng phí (autoscaler mua thêm node cho tài nguyên không ai dùng), quá thấp thì Pod bị dồn quá nhiều lên một node. Dùng dashboard Grafana ở bài 8 để xem mức dùng thật trước khi đặt.
- Kubernetes đã hỗ trợ **đổi CPU / RAM của Pod mà không cần tạo lại Pod** (in-place resize), giúp VPA điều chỉnh mượt hơn.
- Tài liệu: [Horizontal Pod Autoscaling](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) · [HPA Walkthrough](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/) · [Karpenter](https://karpenter.sh/) · [KEDA](https://keda.sh/)

Học xong series, bước tiếp theo nên tìm hiểu: NetworkPolicy, RBAC, PodDisruptionBudget, StatefulSet và PersistentVolume, Gateway API, GitOps với Argo CD.
