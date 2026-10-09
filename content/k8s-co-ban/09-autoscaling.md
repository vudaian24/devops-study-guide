---
ten: Autoscaling — HPA, requests và các tầng co giãn
goc: https://devops.vn/posts/kubernetes-autoscaling-toi-uu-hoa-cluster/
thoiGian: 35 phút
chip: metrics-server, HPA, requests/limits, behavior, Karpenter, KEDA, VPA
bank: Kubernetes
---

Autoscaling trên Kubernetes có nhiều tầng: **thêm Pod** khi tải tăng (HPA), **chỉnh cỡ Pod** cho đúng nhu cầu (VPA), và **thêm node** khi không còn chỗ xếp Pod (Cluster Autoscaler / Karpenter). Bài này thực hành tầng đầu tiên — HorizontalPodAutoscaler — trên Minikube, rồi giới thiệu các tầng còn lại.

## Chuẩn bị

```bash
minikube start
kubectl config use-context minikube
kubectl config set-context --current --namespace=hoc-k8s
```

## Bước 1: Bật metrics-server

HPA cần số liệu CPU / RAM hiện tại của Pod, do **metrics-server** cung cấp:

```bash
minikube addons enable metrics-server
kubectl -n kube-system rollout status deployment/metrics-server
kubectl top nodes        # lần đầu có thể báo "metrics not available yet" — đợi khoảng 1 phút
```

## Bước 2: Deployment có requests

Tạo file `nginx-hpa-demo.yaml`:

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
              cpu: 100m          # HPA tính % CPU dựa trên con số này
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
      port: 80
      targetPort: http
```

```bash
kubectl apply -f nginx-hpa-demo.yaml
kubectl rollout status deployment/nginx-deployment
kubectl top pods
```

> [!IMPORTANT]
> Bản gốc có `limits.cpu: 200m`. Bản này bỏ limit CPU (giữ limit RAM) — với limit CPU, Pod bị *throttle* khi tải lên, latency tăng trước khi HPA kịp thêm Pod. Điều **bắt buộc** cho HPA là `requests.cpu`: thiếu nó, HPA không tính được % và cột `TARGETS` hiện `<unknown>` mãi mãi.

## Bước 3: Tạo HPA

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
          averageUtilization: 50     # 50% của requests.cpu = 50m mỗi Pod
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
    scaleDown:
      stabilizationWindowSeconds: 60 # mặc định 300s; rút ngắn cho lab để thấy scale down
```

```bash
kubectl apply -f nginx-hpa.yaml
kubectl get hpa nginx-hpa
```

```text
NAME        REFERENCE                     TARGETS       MINPODS   MAXPODS   REPLICAS
nginx-hpa   Deployment/nginx-deployment   cpu: 0%/50%   1         5         1
```

Trong khoảng một phút đầu, `TARGETS` có thể là `<unknown>` — HPA chưa nhận được số liệu đầu tiên.

> [!IMPORTANT]
> Bản gốc không có phần `behavior` và không giải thích vì sao sau khi ngừng tải, số Pod không giảm ngay. Mặc định HPA đợi **5 phút** ổn định mới scale down — chống việc thêm / bớt Pod liên tục khi tải dao động (*flapping*). Production thường giữ mặc định hoặc lâu hơn; chỉ rút ngắn trong lab.

HPA tính số Pod mong muốn theo công thức:

```text
desiredReplicas = ceil( currentReplicas × currentUtilization / targetUtilization )
ví dụ: 1 Pod đang dùng 180% → ceil(1 × 180 / 50) = 4 Pod
```

## Bước 4: Tạo tải và quan sát

Terminal 1 — theo dõi:

```bash
kubectl get hpa nginx-hpa --watch
```

Terminal 2 — sinh tải (nhấn `Ctrl+C` để dừng, Pod tự xoá):

```bash
kubectl run load-generator --rm -it --restart=Never --image=busybox:1.36 -- \
  /bin/sh -c "while sleep 0.005; do wget -q -O- http://nginx-service > /dev/null; done"
```

Sau 1–2 phút, `TARGETS` vượt 50% và `REPLICAS` tăng dần. Xem HPA đã quyết định gì và vì sao:

```bash
kubectl describe hpa nginx-hpa      # phần Events: "New size: 3; reason: cpu resource utilization above target"
kubectl get pods -l app=nginx
```

Dừng tải ở terminal 2; khoảng một phút sau (theo `stabilizationWindowSeconds`), số Pod giảm dần về 1.

> [!TIP]
> Nginx phục vụ file tĩnh rất nhẹ nên có thể khó đẩy CPU vượt 50%. Nếu không thấy scale, chạy thêm một `load-generator` thứ hai (đổi tên Pod), hoặc hạ `requests.cpu` xuống `20m`.

> [!IMPORTANT]
> Bản gốc dùng image `busybox` không tag (tức `latest`) — bản này ghim `busybox:1.36` vì cùng lý do như bài 1.

## Các tầng autoscaling khác

| Công cụ | Co giãn cái gì | Dựa trên | Ghi chú |
|---|---|---|---|
| **HPA** | Số Pod | CPU, RAM, metric tuỳ chỉnh | Bài này. Cần `requests` |
| **KEDA** | Số Pod (về được 0) | Sự kiện: độ dài hàng đợi SQS / Kafka, cron, Prometheus… | Dùng cho worker xử lý hàng đợi |
| **VPA** | `requests` / `limits` của Pod | Lịch sử sử dụng | Hay dùng ở chế độ *chỉ đề xuất*; đừng cùng HPA trên cùng metric CPU |
| **Cluster Autoscaler** | Số node trong node group | Pod `Pending` vì thiếu chỗ | Cách truyền thống, theo node group định sẵn |
| **Karpenter** | Node (chọn loại EC2 phù hợp) | Pod `Pending` | Nhanh và linh hoạt hơn; có sẵn trong EKS Auto Mode |

> [!IMPORTANT]
> Bản gốc chỉ nhắc Cluster Autoscaler cho tầng node. Trên EKS, **Karpenter** (dự án CNCF, bản 1.0 từ 2024) giờ là lựa chọn được khuyến nghị: nó chọn đúng loại và cỡ EC2 cho Pod đang chờ thay vì chỉ tăng số node của một nhóm cố định, và gom Pod để tắt node thừa. Kubernetes cũng đã hỗ trợ **đổi CPU / RAM của Pod tại chỗ** (in-place resize, bật mặc định từ 1.33) — VPA dùng được mà không phải tạo lại Pod.

> [!WARNING]
> HPA và tầng node phải đi cùng nhau: HPA thêm Pod nhưng nếu node hết chỗ, Pod mới nằm `Pending`. Ngược lại, `requests` đặt quá cao khiến autoscaler mua thêm node cho tài nguyên không ai dùng — xem RAM / CPU thực tế ở Grafana (bài 8) trước khi đặt `requests`.

## Dọn dẹp

```bash
kubectl delete -f nginx-hpa.yaml -f nginx-hpa-demo.yaml
minikube stop
```

Hết series: `kubectl delete namespace hoc-k8s` xoá mọi thứ đã tạo, `minikube delete` xoá hẳn cluster.

## Tóm tắt và đi tiếp

- HPA = metrics-server + `requests.cpu` + `autoscaling/v2`. Hiểu `behavior` để giải thích được vì sao scale down chậm.
- Mỗi tầng một công cụ: HPA / KEDA cho Pod, VPA cho cỡ Pod, Cluster Autoscaler / Karpenter cho node.

Đi tiếp sau series này: NetworkPolicy, RBAC, PodDisruptionBudget, StatefulSet và PersistentVolume, Gateway API cho production, GitOps với Argo CD. Muốn thi chứng chỉ, các bài trong series CKAD trên DevOps VietNam đi sâu hơn vào từng tài nguyên.

Tài liệu: [HPA](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) · [HPA walkthrough](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/) · [Karpenter](https://karpenter.sh/) · [KEDA](https://keda.sh/)
