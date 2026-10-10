---
ten: Helm — tự động triển khai ứng dụng dễ dàng
goc: https://devops.vn/posts/kubernetes-helm-tu-dong-trien-khai/
thoiGian: 35 phút
chip: Helm, chart, values.yaml, release, upgrade, rollback, OCI
bank: Kubernetes
---

**Helm** là trình quản lý gói (package manager) cho Kubernetes — giống `apt` cho Ubuntu hay `npm` cho Node.js. Helm đóng gói các file YAML thành một **chart**: các template YAML cộng với file `values.yaml` chứa những giá trị có thể thay đổi (số bản chạy, image, tài nguyên…). Mỗi lần cài chart lên cluster tạo ra một **release** có lịch sử phiên bản, nâng cấp và quay lui được bằng một lệnh. Bài này dùng Helm trên Minikube để triển khai Nginx thay vì viết từng file YAML như các bài trước.

Sau bài này bạn sẽ:

- Tạo chart, hiểu cấu trúc chart và cách template đọc giá trị từ `values.yaml`.
- Cài, nâng cấp, quay lui một release.
- Cài chart có sẵn của cộng đồng.

## Bước 1: Cài đặt Helm và khởi động Minikube

```bash
sudo snap install helm --classic      # Ubuntu
```

Các cách cài khác: [Helm — Installing Helm](https://helm.sh/docs/intro/install/). Kiểm tra:

```bash
helm version
```

```text
version.BuildInfo{Version:"v4.x.x", GitCommit:"...", GitTreeState:"clean", GoVersion:"go1.xx"}
```

Helm 4 là phiên bản hiện tại. Mọi lệnh trong bài đều chạy giống nhau trên Helm 3 nếu máy bạn đang có sẵn bản đó.

Khởi động cluster và đảm bảo kubectl trỏ vào Minikube (sau bài 5 có thể đang trỏ vào EKS):

```bash
minikube start
kubectl config use-context minikube
```

## Bước 2: Tạo Helm chart đơn giản

```bash
helm create my-nginx-chart
```

Lệnh này tạo sẵn một chart hoàn chỉnh chạy Nginx. Cấu trúc:

```text
my-nginx-chart/
├── Chart.yaml          # tên chart, version của chart, appVersion của ứng dụng
├── values.yaml         # giá trị mặc định — phần người dùng chart được phép đổi
├── charts/             # chart phụ thuộc (nếu có)
└── templates/          # template sinh ra các file YAML
    ├── deployment.yaml
    ├── service.yaml
    ├── ingress.yaml, hpa.yaml, serviceaccount.yaml, ...
    ├── _helpers.tpl    # hàm dùng chung, ví dụ quy tắc đặt tên
    └── NOTES.txt       # hướng dẫn in ra sau khi cài
```

Template đọc giá trị từ `values.yaml` qua cú pháp `{{ .Values.<tên> }}`. Ví dụ trong `templates/deployment.yaml`:

```yaml
spec:
  replicas: {{ .Values.replicaCount }}
  ...
      containers:
        - image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
```

Vậy muốn đổi số bản chạy thì sửa `replicaCount`; muốn đổi image thì sửa `image.repository` và `image.tag`. Mở `my-nginx-chart/values.yaml` và sửa hai chỗ:

```yaml
replicaCount: 2

image:
  repository: nginx
  pullPolicy: IfNotPresent
  tag: "1.28"
```

> [!IMPORTANT]
> Tên trong `values.yaml` phải **đúng tên mà template đọc**. Viết `replicas: 2` thay vì `replicaCount: 2` thì Helm không báo lỗi gì, nhưng không template nào dùng tới `replicas` — kết quả vẫn chạy 1 bản. Khi sửa values, luôn đối chiếu với `templates/`.

Nếu không đặt `image.tag`, chart dùng `appVersion` trong `Chart.yaml` làm tag — giá trị mặc định này rất cũ, nên luôn đặt tag rõ ràng.

Kiểm tra chart và xem trước các file YAML sẽ được tạo:

```bash
helm lint ./my-nginx-chart
helm template my-nginx-release ./my-nginx-chart
```

```text
==> Linting ./my-nginx-chart
[INFO] Chart.yaml: icon is recommended
1 chart(s) linted, 0 chart(s) failed
```

`helm template` in ra Deployment, Service, ServiceAccount… với `replicas: 2` và `image: "nginx:1.28"` — đúng như đã sửa. Muốn kiểm tra kỹ hơn với cluster (không tạo gì): `helm template my-nginx-release ./my-nginx-chart | kubectl apply --dry-run=server -f -`.

## Bước 3: Triển khai ứng dụng với Helm

```bash
helm install my-nginx-release ./my-nginx-chart --wait
```

```text
NAME: my-nginx-release
LAST DEPLOYED: ...
NAMESPACE: default
STATUS: deployed
REVISION: 1
NOTES:
1. Get the application URL by running these commands: ...
```

`--wait` đợi tới khi mọi Pod sẵn sàng mới báo xong. Kiểm tra:

```bash
helm list
kubectl get deployments,services -l app.kubernetes.io/instance=my-nginx-release
```

```text
NAME               NAMESPACE   REVISION   STATUS     CHART                  APP VERSION
my-nginx-release   default     1          deployed   my-nginx-chart-0.1.0   1.16.0

NAME                                              READY   UP-TO-DATE   AVAILABLE
deployment.apps/my-nginx-release-my-nginx-chart   2/2     2            2

NAME                                      TYPE        CLUSTER-IP     PORT(S)
service/my-nginx-release-my-nginx-chart   ClusterIP   10.105.12.34   80/TCP
```

Tên tài nguyên theo quy tắc **`<tên release>-<tên chart>`** (định nghĩa trong `_helpers.tpl`). Truy cập ứng dụng:

```bash
kubectl port-forward svc/my-nginx-release-my-nginx-chart 8080:80
```

Mở `http://localhost:8080` sẽ thấy trang **Welcome to nginx!**.

> [!TIP]
> Muốn tên tài nguyên gọn hơn: đặt tên release trùng tên chart (`helm install my-nginx-chart ./my-nginx-chart` → tài nguyên tên `my-nginx-chart`), hoặc đặt `fullnameOverride: web` trong `values.yaml`.

## Bước 4: Nâng cấp và quay lui

Mỗi môi trường thường có một file values riêng, chỉ chứa phần khác với mặc định. Tạo `values-dev.yaml`:

```yaml
replicaCount: 3
resources:
  requests:
    cpu: 50m
    memory: 64Mi
  limits:
    memory: 128Mi
```

Nâng cấp release với file này:

```bash
helm upgrade --install my-nginx-release ./my-nginx-chart -f values-dev.yaml --wait
kubectl get pods -l app.kubernetes.io/instance=my-nginx-release
```

`upgrade --install` cài nếu release chưa có, nâng cấp nếu đã có — đây là lệnh dùng trong CI/CD. Giờ có 3 Pod.

Xem lịch sử và giá trị đang dùng:

```bash
helm history my-nginx-release
helm get values my-nginx-release
```

```text
REVISION   STATUS       CHART                  DESCRIPTION
1          superseded   my-nginx-chart-0.1.0   Install complete
2          deployed     my-nginx-chart-0.1.0   Upgrade complete
```

Quay lui về revision 1 (2 Pod):

```bash
helm rollback my-nginx-release 1 --wait
helm history my-nginx-release
```

Rollback tạo thêm revision 3 có nội dung giống revision 1 — lịch sử không bao giờ bị xoá.

> [!WARNING]
> `--set replicaCount=5` tiện để thử nhanh nhưng không để lại dấu vết trong Git. Trong dự án thật, ghi mọi giá trị vào file values và commit; chỉ dùng `--set` cho giá trị do pipeline sinh ra, như tag image theo commit (bài 7).

## Bước 5: Cài chart có sẵn của cộng đồng

Chart công khai được phát hành theo hai kiểu:

- **Helm repository** (qua HTTP): cần `helm repo add <tên> <url>` trước, rồi `helm install <release> <tên>/<chart>`. Bài 8 cài Prometheus theo cách này.
- **OCI registry** (cùng nơi lưu image Docker): cài thẳng bằng địa chỉ `oci://…`, không cần `repo add`.

Ví dụ cài `podinfo` — ứng dụng web demo phổ biến — từ OCI registry:

```bash
helm show values oci://ghcr.io/stefanprodan/charts/podinfo | head -n 30   # đọc values trước khi cài
helm install demo oci://ghcr.io/stefanprodan/charts/podinfo --set replicaCount=2 --wait
kubectl port-forward svc/demo-podinfo 9898:9898
```

Mở `http://localhost:9898` sẽ thấy giao diện podinfo.

> [!TIP]
> Trước khi cài chart lạ: `helm show values` để biết chart cho phép cấu hình gì; `helm template` để xem nó tạo ra những gì (có xin quyền quá rộng, có chạy privileged không). Khi cài thật, luôn ghim phiên bản bằng `--version`.

## Bước 6: Xoá tài nguyên để dọn dẹp

```bash
helm uninstall my-nginx-release demo
minikube stop
```

```text
release "my-nginx-release" uninstalled
release "demo" uninstalled
```

## Xử lý sự cố thường gặp

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Sửa values nhưng không có tác dụng | Sai tên khoá so với template | `helm template` rồi tìm giá trị; đối chiếu `templates/*.yaml` |
| `cannot re-use a name that is still in use` | Release cùng tên đã tồn tại | Dùng `helm upgrade --install`, hoặc đặt tên khác |
| `port-forward` báo service not found | Gõ sai tên Service | `kubectl get svc` xem tên thật (`<release>-<chart>`) |
| `helm install --wait` hết giờ | Pod không lên (image sai, probe lỗi) | `kubectl get pods`, `kubectl describe pod` xem Events |
| `UPGRADE FAILED: another operation is in progress` | Lần cài trước bị ngắt giữa chừng | `helm history <release>`, rồi `helm rollback` về revision tốt gần nhất |

## Lưu ý quan trọng

- **Tuỳ biến chart**: thêm file vào `templates/` để tạo thêm ConfigMap, Secret… Đặt giá trị cấu hình trong `values.yaml` để người dùng chart thay đổi được.
- **Chọn chart nguồn tin cậy**: ưu tiên chart chính chủ của dự án (ví dụ `prometheus-community`, `grafana`, `jetstack` cho cert-manager). Catalog Bitnami đã thu hẹp bản miễn phí từ 2025 — nhiều image cũ không còn được cập nhật bảo mật, cân nhắc kỹ trước khi dùng.
- **Xem trước thay đổi**: plugin `helm diff` cho xem khác biệt trước mỗi lần `upgrade`.
- Tài liệu: [Helm Docs](https://helm.sh/docs/) · [Chart Template Guide](https://helm.sh/docs/chart_template_guide/) · [Chart Best Practices](https://helm.sh/docs/chart_best_practices/)

## Tóm tắt lệnh

| Lệnh | Dùng để |
|---|---|
| `helm create` / `lint` / `template` | Tạo chart, kiểm tra lỗi, xem YAML sẽ tạo |
| `helm upgrade --install <release> <chart> -f <values> --wait` | Cài hoặc nâng cấp |
| `helm list` / `history` / `get values` | Xem release, lịch sử, values đang dùng |
| `helm rollback <release> <revision>` | Quay lui |
| `helm uninstall <release>` | Gỡ release |
| `helm show values <chart>` | Đọc values của chart trước khi cài |
