---
ten: Monitoring — giám sát với Prometheus và Grafana
goc: https://devops.vn/posts/kubernetes-monitoring-prometheus-grafana/
thoiGian: 40 phút
chip: Prometheus, Grafana, kube-prometheus-stack, PromQL, dashboard, PrometheusRule
bank: Monitoring, Kubernetes
---

Giám sát giúp bạn biết cluster và ứng dụng đang khoẻ hay yếu, và phát hiện sự cố **trước khi** người dùng phản ánh. **Prometheus** định kỳ thu thập số liệu (metrics) từ các thành phần và lưu theo thời gian; **Grafana** biến số liệu đó thành dashboard trực quan; **Alertmanager** gửi cảnh báo khi có bất thường. Bài này cài cả bộ lên Minikube bằng chart **kube-prometheus-stack** — cách cài phổ biến nhất hiện nay — rồi xem dashboard, viết truy vấn và tạo một cảnh báo.

```text
node-exporter (số liệu máy) ───┐
kube-state-metrics (đối tượng K8s) ─┼──► Prometheus ──► Grafana (dashboard)
kubelet / cAdvisor (container) ─┘          │
                                           └──► Alertmanager ──► Slack, email…
```

Sau bài này bạn sẽ:

- Cài Prometheus, Grafana, Alertmanager bằng một lệnh Helm.
- Xem CPU, RAM của node và Pod trên dashboard Grafana, import thêm dashboard từ cộng đồng.
- Viết truy vấn PromQL cơ bản và tạo một luật cảnh báo.

## Bước 1: Khởi động Minikube và triển khai ứng dụng

Bộ giám sát cần khoảng 2–3 GB RAM. Cluster tạo ở bài 1 với `--memory=6g` là đủ:

```bash
minikube start
kubectl config use-context minikube
kubectl apply -f nginx-deployment.yaml          # Deployment Nginx từ bài 2 — để có thứ mà giám sát
kubectl rollout status deployment/nginx-deployment
```

Nếu cluster đang chạy với ít RAM hơn, phải tạo lại (RAM chỉ đặt được lúc tạo; mọi tài nguyên trong cluster sẽ mất):

```bash
minikube delete
minikube start --driver=docker --cpus=4 --memory=6g
```

Cần có Helm (bài 6).

## Bước 2: Cài đặt Prometheus lên cluster

Thêm Helm repository của cộng đồng Prometheus:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

Cài **kube-prometheus-stack** vào namespace riêng `monitoring`:

```bash
helm upgrade --install kps prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  --wait --timeout 10m
```

Chart này cài cùng lúc: Prometheus, Grafana (đã nối sẵn với Prometheus), Alertmanager, node-exporter, kube-state-metrics, kèm hàng chục dashboard và luật cảnh báo cho cluster. Kiểm tra:

```bash
kubectl -n monitoring get pods
```

```text
NAME                                                    READY   STATUS
alertmanager-kps-kube-prometheus-stack-alertmanager-0   2/2     Running
kps-grafana-6d8c9f7b8-k2x9q                             3/3     Running
kps-kube-prometheus-stack-operator-7c9b5f6d4-mx8zt      1/1     Running
kps-kube-state-metrics-5b8f7c6d9-p4r7w                  1/1     Running
kps-prometheus-node-exporter-8xk2m                      1/1     Running
prometheus-kps-kube-prometheus-stack-prometheus-0       2/2     Running
```

| Thành phần | Vai trò |
|---|---|
| `prometheus-…-0` | Thu thập và lưu metrics |
| `kps-grafana` | Dashboard |
| `alertmanager-…-0` | Gom, lọc và gửi cảnh báo |
| `node-exporter` | Số liệu của máy (node): CPU, RAM, ổ đĩa, mạng |
| `kube-state-metrics` | Trạng thái đối tượng Kubernetes: số Pod, số lần restart, replicas… |
| `operator` | Prometheus Operator: quản lý Prometheus qua các tài nguyên `ServiceMonitor`, `PrometheusRule` |

## Bước 3: Mở Grafana

Lấy mật khẩu của tài khoản `admin`:

```bash
kubectl -n monitoring get secret kps-grafana \
  -o jsonpath='{.data.admin-password}' | base64 -d; echo
```

Mở Grafana qua port-forward (để terminal này chạy):

```bash
kubectl -n monitoring port-forward svc/kps-grafana 3000:80
```

Mở `http://localhost:3000`, đăng nhập user `admin` và mật khẩu vừa lấy.

Kiểm tra nguồn dữ liệu: vào **Connections → Data sources**. Đã có sẵn nguồn **Prometheus** do chart cấu hình — bấm vào, kéo xuống cuối, bấm **Save & test** sẽ thấy *Successfully queried the Prometheus API*. Không cần tự thêm.

## Bước 4: Xem dashboard giám sát

Vào **Dashboards**, mở thư mục có sẵn và thử:

- **Kubernetes / Compute Resources / Namespace (Pods)** → chọn namespace `default`: CPU, RAM của từng Pod Nginx.
- **Kubernetes / Compute Resources / Cluster**: tổng quan tài nguyên cả cluster.
- **Node Exporter / Nodes**: CPU, RAM, ổ đĩa, mạng của node Minikube.

**Import thêm dashboard từ cộng đồng** — ví dụ *Node Exporter Full* (ID `1860`), rất chi tiết về máy chủ:

1. **Dashboards → New → Import**.
2. Nhập `1860` vào ô *Find and import dashboards…*, bấm **Load**.
3. Ở mục *Prometheus*, chọn nguồn dữ liệu **Prometheus**, bấm **Import**.

Dashboard hiện các biểu đồ CPU, RAM, disk, network của node. Kho dashboard cộng đồng: [grafana.com/grafana/dashboards](https://grafana.com/grafana/dashboards/).

## Bước 5: Truy vấn Prometheus bằng PromQL

Mở giao diện Prometheus (terminal khác):

```bash
kubectl -n monitoring port-forward svc/prometheus-operated 9090
```

Mở `http://localhost:9090`:

- **Status → Target health**: những gì Prometheus đang thu thập và target nào đang lỗi.
- Tab **Query**: nhập truy vấn, bấm **Execute**, xem dạng bảng hoặc biểu đồ (*Graph*).

Ba truy vấn đáng thuộc lòng:

```promql
# CPU (đơn vị: core) mỗi Pod dùng, trung bình 5 phút
sum by (pod) (rate(container_cpu_usage_seconds_total{namespace="default", container!=""}[5m]))

# RAM đang dùng thật (working set) — con số Kubernetes so với limit để quyết định OOMKilled
sum by (pod) (container_memory_working_set_bytes{namespace="default", container!=""})

# Container bị khởi động lại trong 1 giờ qua
increase(kube_pod_container_status_restarts_total{namespace="default"}[1h]) > 0
```

> [!NOTE]
> Trên Minikube, vài target như `kube-controller-manager`, `kube-scheduler`, `etcd` hiện **down** và sinh cảnh báo. Đây là đặc thù của Minikube (các thành phần này chỉ lắng nghe nội bộ trên node), không phải lỗi cài đặt — bỏ qua được.

## Bước 6: Tạo cảnh báo

Prometheus Operator cho phép khai báo cảnh báo bằng tài nguyên `PrometheusRule`. Tạo file `pod-restart-rule.yaml`:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: pod-restart-rule
  namespace: monitoring
  labels:
    release: kps
spec:
  groups:
    - name: ung-dung
      rules:
        - alert: PodRestartQuaNhieu
          expr: increase(kube_pod_container_status_restarts_total{namespace="default"}[15m]) > 3
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Pod {{ $labels.pod }} khởi động lại hơn 3 lần trong 15 phút"
```

| Trường | Ý nghĩa |
|---|---|
| `labels.release: kps` | **Bắt buộc** — Prometheus của chart chỉ nạp rule có nhãn trùng tên release |
| `expr` | Điều kiện cảnh báo, viết bằng PromQL |
| `for: 5m` | Điều kiện phải đúng liên tục 5 phút mới báo — tránh báo nhầm do dao động ngắn |
| `labels.severity` | Mức độ, dùng để Alertmanager định tuyến (warning → Slack, critical → gọi điện…) |
| `annotations.summary` | Nội dung cảnh báo; `{{ $labels.pod }}` được thay bằng tên Pod |

```bash
kubectl apply -f pod-restart-rule.yaml
```

Trên Prometheus, mở **Alerts** sẽ thấy `PodRestartQuaNhieu` ở trạng thái *Inactive* (chưa có gì bất thường). Muốn thấy nó kích hoạt: đặt `limits.memory` của Nginx thật thấp (ví dụ `8Mi`) rồi apply lại — Pod sẽ bị OOMKilled liên tục, sau vài phút cảnh báo chuyển sang *Pending* rồi *Firing*. Nhớ trả limit về như cũ.

## Bước 7: Xoá tài nguyên để dọn dẹp

```bash
kubectl delete -f pod-restart-rule.yaml
helm uninstall kps -n monitoring
kubectl delete namespace monitoring
kubectl delete -f nginx-deployment.yaml
```

`helm uninstall` **không xoá CRD** (các loại tài nguyên `ServiceMonitor`, `PrometheusRule`… mà chart đã thêm vào cluster). Trên cluster lab, xoá luôn để lần cài sau sạch sẽ:

```bash
kubectl get crd -o name | grep monitoring.coreos.com | xargs kubectl delete
minikube stop
```

## Xử lý sự cố thường gặp

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| `helm install` hết giờ, Pod `Pending` | Cluster thiếu RAM / CPU | `kubectl -n monitoring describe pod <tên>`; tạo lại Minikube với `--memory=6g` |
| Không đăng nhập được Grafana | Sai mật khẩu | Lấy lại bằng lệnh ở Bước 3 |
| Dashboard trống "No data" | Chọn sai namespace / khoảng thời gian, hoặc metrics chưa kịp thu | Đổi namespace, chọn *Last 15 minutes*, đợi 1–2 phút |
| Rule không hiện ở trang Alerts | Thiếu nhãn `release: kps` | Thêm nhãn rồi apply lại |
| `port-forward` báo service not found | Tên release khác `kps` | `kubectl -n monitoring get svc` xem tên thật |

## Lưu ý quan trọng — giám sát trong production

| Hạng mục | Mặc định của chart | Cần làm trong production |
|---|---|---|
| Lưu trữ Prometheus | Không lưu bền — mất dữ liệu khi Pod khởi động lại | Cấu hình `storageSpec` (ổ đĩa bền), đặt thời gian lưu `retention` |
| Lưu trữ dài hạn | Không có | Thanos, Grafana Mimir, hoặc dịch vụ managed (Amazon Managed Prometheus) |
| Bảo mật Grafana | Mật khẩu admin trong Secret | Đổi mật khẩu, đăng nhập SSO, phân quyền theo team, bật HTTPS |
| Gửi cảnh báo | Alertmanager chưa gửi đi đâu | Cấu hình kênh nhận (Slack, email, PagerDuty) và tài liệu xử lý cho từng cảnh báo |
| Metrics của ứng dụng | Chưa thu thập | Ứng dụng mở endpoint `/metrics`, khai báo `ServiceMonitor` |
| Log và trace | Không có | Loki (log), Tempo / OpenTelemetry (trace) |

Tài liệu: [kube-prometheus-stack](https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack) · [Prometheus — Querying basics](https://prometheus.io/docs/prometheus/latest/querying/basics/) · [Grafana Documentation](https://grafana.com/docs/grafana/latest/)
