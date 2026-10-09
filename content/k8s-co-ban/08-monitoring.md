---
ten: Giám sát với Prometheus và Grafana (kube-prometheus-stack)
goc: https://devops.vn/posts/kubernetes-monitoring-prometheus-grafana/
thoiGian: 40 phút
chip: kube-prometheus-stack, Prometheus Operator, Grafana, PromQL, PrometheusRule
bank: Monitoring, Kubernetes
---

**Prometheus** định kỳ kéo (scrape) số liệu từ các target và lưu thành chuỗi thời gian; **Grafana** vẽ dashboard từ đó; **Alertmanager** gửi cảnh báo. Trên Kubernetes, cách cài phổ biến nhất là chart **kube-prometheus-stack**: cài cả bộ, đã nối dây sẵn với nhau và kèm hàng chục dashboard, luật cảnh báo cho cluster.

```text
node-exporter (node) ─┐
kube-state-metrics ───┼──► Prometheus ──► Grafana (dashboard)
kubelet / cAdvisor ───┤        │
ServiceMonitor (app) ─┘        └──► Alertmanager ──► Slack / email / PagerDuty
```

## Chuẩn bị

Bộ này cần khoảng 2–3 GB RAM. Nếu ở bài 1 bạn đã chạy `minikube start --memory=6g` thì chỉ cần:

```bash
minikube start
kubectl config use-context minikube
kubectl config set-context --current --namespace=hoc-k8s
kubectl apply -f nginx-deployment.yaml          # file từ bài 2 — để có thứ mà giám sát
```

Nếu trước đó chạy với ít RAM hơn, phải tạo lại cluster (dung lượng RAM chỉ đặt được lúc tạo; mọi tài nguyên đang có sẽ mất): `minikube delete && minikube start --driver=docker --cpus=4 --memory=6g`, rồi tạo lại namespace như bài 1.

## Bước 1: Cài kube-prometheus-stack

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm upgrade --install kps prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace --wait --timeout 10m

kubectl -n monitoring get pods
```

```text
NAME                                                READY   STATUS
alertmanager-kps-kube-prometheus-stack-alertmanager-0   2/2     Running
kps-grafana-6d8c9f7b8-k2x9q                         3/3     Running
kps-kube-prometheus-stack-operator-7c9b5f6d4-mx8zt  1/1     Running
kps-kube-state-metrics-5b8f7c6d9-p4r7w              1/1     Running
kps-prometheus-node-exporter-8xk2m                  1/1     Running
prometheus-kps-kube-prometheus-stack-prometheus-0   2/2     Running
```

> [!IMPORTANT]
> Bản gốc cài chart `prometheus-community/prometheus` và chart `grafana/grafana` riêng lẻ, rồi nối Grafana với Prometheus bằng tay. **kube-prometheus-stack** là cách cài chuẩn hiện nay: Prometheus Operator, Grafana đã có sẵn data source Prometheus, dashboard cho node / namespace / Pod, luật cảnh báo mặc định, node-exporter và kube-state-metrics — một lệnh là đủ.

> [!NOTE]
> Prometheus Operator thêm các loại tài nguyên mới (CRD): `ServiceMonitor` / `PodMonitor` (*scrape cái gì*), `PrometheusRule` (*cảnh báo khi nào*). Thay vì sửa file cấu hình của Prometheus, bạn tạo các tài nguyên này cạnh ứng dụng.

## Bước 2: Mở Grafana

```bash
kubectl -n monitoring get secret kps-grafana \
  -o jsonpath='{.data.admin-password}' | base64 -d; echo

kubectl -n monitoring port-forward svc/kps-grafana 3000:80
```

Mở `http://localhost:3000`, đăng nhập `admin` với mật khẩu vừa in ra. Vào **Dashboards** và mở:

- *Kubernetes / Compute Resources / Namespace (Pods)* → chọn namespace `hoc-k8s`: CPU, RAM của từng Pod Nginx.
- *Node Exporter / Nodes*: CPU, RAM, disk, mạng của node Minikube.

> [!IMPORTANT]
> Bản gốc hướng dẫn vào *Configuration → Data Sources* và nhập URL `prometheus-server.monitoring.svc.cluster.local`. Từ Grafana 10, menu đó là *Connections → Data sources*, và với kube-prometheus-stack thì **không cần thêm** — data source đã được cấu hình sẵn. Dashboard 1860 (*Node Exporter Full*) của bản gốc vẫn import được qua *Dashboards → New → Import* nếu bạn muốn.

## Bước 3: Hỏi Prometheus bằng PromQL

```bash
kubectl -n monitoring port-forward svc/prometheus-operated 9090
```

Mở `http://localhost:9090`. Trang **Status → Targets** cho biết Prometheus đang scrape những gì và target nào lỗi. Thử các truy vấn ở tab **Query**:

```promql
# CPU (core) mỗi Pod trong namespace hoc-k8s, trung bình 5 phút
sum by (pod) (rate(container_cpu_usage_seconds_total{namespace="hoc-k8s", container!=""}[5m]))

# RAM đang dùng thật (working set) — con số mà OOMKilled dựa vào
sum by (pod) (container_memory_working_set_bytes{namespace="hoc-k8s", container!=""})

# Container bị restart trong 1 giờ qua
increase(kube_pod_container_status_restarts_total{namespace="hoc-k8s"}[1h]) > 0
```

> [!NOTE]
> Trên Minikube, vài target như `kube-controller-manager`, `kube-scheduler`, `etcd` báo **down** và sinh cảnh báo — vì các thành phần này chỉ lắng nghe trên `127.0.0.1` của node. Đó là đặc thù của Minikube, không phải lỗi cài đặt; trên EKS các thành phần này do AWS quản lý và không scrape được theo cách này.

## Bước 4: Viết một luật cảnh báo

Tạo file `hoc-k8s-rules.yaml`:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: hoc-k8s-rules
  namespace: monitoring
  labels:
    release: kps          # bắt buộc: Prometheus của chart chỉ nạp rule có label này
spec:
  groups:
    - name: hoc-k8s
      rules:
        - alert: PodRestartQuaNhieu
          expr: increase(kube_pod_container_status_restarts_total{namespace="hoc-k8s"}[15m]) > 3
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Pod {{ $labels.pod }} restart hơn 3 lần trong 15 phút"
```

```bash
kubectl apply -f hoc-k8s-rules.yaml
```

Kiểm tra ở Prometheus → **Alerts** (luật `PodRestartQuaNhieu` xuất hiện). Muốn thấy nó kích hoạt: đặt `limits.memory` của Nginx thật thấp (ví dụ `8Mi`) để Pod bị OOMKilled liên tục, đợi vài phút.

> [!WARNING]
> Quên label `release: kps` là lỗi phổ biến nhất: rule tạo thành công, không báo lỗi gì, nhưng Prometheus không bao giờ nạp. Tương tự với `ServiceMonitor`.

## Production cần thêm gì

> [!IMPORTANT]
> Bản gốc chỉ nhắc "persistent storage" và "đổi mật khẩu". Danh sách đầy đủ hơn:

| Hạng mục | Mặc định của chart | Production |
|---|---|---|
| Lưu trữ Prometheus | Không có — mất dữ liệu khi Pod khởi động lại | `storageSpec` với PVC, đặt `retention` / `retentionSize` |
| Lưu trữ dài hạn | Không | Thanos, Grafana Mimir hoặc dịch vụ managed (Amazon Managed Prometheus) |
| Grafana | Mật khẩu admin trong Secret | SSO (OIDC), quyền theo team, dashboard lưu trong Git |
| Cảnh báo | Alertmanager chưa gửi đi đâu | Cấu hình receiver (Slack, PagerDuty…), runbook cho mỗi cảnh báo |
| Ứng dụng của bạn | Chưa scrape | App phơi `/metrics`, khai báo `ServiceMonitor` |
| Log, trace | Không có | Loki (log), Tempo / OpenTelemetry (trace) |

## Dọn dẹp

```bash
kubectl delete -f hoc-k8s-rules.yaml
helm uninstall kps -n monitoring
kubectl get crd -o name | grep monitoring.coreos.com | xargs kubectl delete
kubectl delete namespace monitoring
```

> [!IMPORTANT]
> Bản gốc dừng ở `helm uninstall`. Helm **không xoá CRD** khi gỡ chart, nên các CRD `monitoring.coreos.com` vẫn còn và có thể xung đột phiên bản khi cài lại. Lệnh thứ ba ở trên xoá chúng — chỉ chạy trên cluster lab, vì nó xoá luôn mọi `ServiceMonitor` / `PrometheusRule` khác.

## Tóm tắt

- Cài cả bộ giám sát bằng kube-prometheus-stack; Grafana đã nối sẵn với Prometheus.
- Mở rộng bằng CRD: `ServiceMonitor` để scrape app, `PrometheusRule` để cảnh báo — nhớ label `release`.
- Ba truy vấn đáng thuộc: CPU theo Pod, RAM working set, số lần restart.

Tài liệu: [kube-prometheus-stack](https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack) · [Prometheus Operator](https://prometheus-operator.dev/) · [PromQL basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
