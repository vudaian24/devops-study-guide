---
ten: Helm — đóng gói và phát hành ứng dụng
goc: https://devops.vn/posts/kubernetes-helm-tu-dong-trien-khai/
thoiGian: 35 phút
chip: Helm, chart, values, release, upgrade, rollback, OCI
bank: Kubernetes
---

Đến bài 5 bạn đã có một xấp YAML: Deployment, Service, ConfigMap… và mỗi môi trường (dev, staging, prod) chỉ khác vài giá trị. **Helm** gói chúng thành một **chart** — template YAML + file `values.yaml` chứa phần thay đổi được. Mỗi lần cài chart lên cluster tạo ra một **release** có lịch sử phiên bản, nâng cấp và rollback được bằng một lệnh.

## Chuẩn bị

```bash
minikube start
kubectl config use-context minikube
kubectl config set-context --current --namespace=hoc-k8s
```

## Bước 1: Cài Helm

```bash
brew install helm                       # macOS
sudo snap install helm --classic        # Linux (hoặc xem trang cài đặt chính thức)
winget install Helm.Helm                # Windows

helm version
```

> [!IMPORTANT]
> Bản gốc cài Helm 3 bằng script `get-helm-3` và in sẵn `v3.15.0`. **Helm 4** ra mắt tháng 11/2025; Helm 3 chỉ còn nhận bản vá trong một thời gian giới hạn. Các lệnh trong bài này giống nhau ở cả Helm 3 và 4. Helm 4 đổi tên một số cờ ít dùng (ví dụ `--atomic`) — nếu copy lệnh từ tài liệu cũ mà báo lỗi cờ, xem `helm <lệnh> --help`.

## Bước 2: Tạo chart

```bash
helm create my-nginx-chart
tree my-nginx-chart        # hoặc: find my-nginx-chart -type f
```

| File | Vai trò |
|---|---|
| `Chart.yaml` | Tên, `version` của chart, `appVersion` của ứng dụng |
| `values.yaml` | Giá trị mặc định — phần người dùng chart được phép đổi |
| `templates/*.yaml` | Template Go sinh ra manifest (Deployment, Service, Ingress, HPA…) |
| `templates/_helpers.tpl` | Hàm dùng chung, ví dụ cách đặt tên tài nguyên |
| `templates/NOTES.txt` | Lời nhắn in ra sau khi cài |

Mở `my-nginx-chart/values.yaml` và sửa hai chỗ:

```yaml
replicaCount: 2

image:
  repository: nginx
  pullPolicy: IfNotPresent
  tag: "1.28"
```

> [!IMPORTANT]
> Bản gốc thêm dòng `replicas: 2` vào `values.yaml` — nhưng template của `helm create` đọc **`replicaCount`**, không có ai đọc `replicas`, nên thay đổi không có tác dụng (vẫn ra 1 replica). Khi sửa values, luôn đối chiếu với tên biến trong `templates/`.

> [!IMPORTANT]
> Bản gốc để nguyên tag mặc định nên image là `nginx:1.16.0` (lấy từ `appVersion` trong `Chart.yaml`) — một bản nginx từ năm 2019. Luôn đặt `image.tag` rõ ràng, hoặc cập nhật `appVersion`.

## Bước 3: Kiểm tra trước khi cài

```bash
helm lint ./my-nginx-chart
helm template web ./my-nginx-chart | less           # xem manifest sẽ được tạo
helm template web ./my-nginx-chart | kubectl apply --dry-run=server -f -   # API server kiểm tra hộ
```

`helm template` chỉ dựng YAML ở máy bạn; `--dry-run=server` gửi lên API server để bắt lỗi schema mà không tạo gì.

## Bước 4: Cài release

```bash
helm install web ./my-nginx-chart --wait
helm list
kubectl get deploy,svc,pods -l app.kubernetes.io/instance=web
```

```text
NAME                                READY   UP-TO-DATE   AVAILABLE
deployment.apps/web-my-nginx-chart  2/2     2            2
NAME                         TYPE        CLUSTER-IP     PORT(S)
service/web-my-nginx-chart   ClusterIP   10.105.12.34   80/TCP
```

Tên tài nguyên là `<release>-<chart>`, vì vậy:

```bash
kubectl port-forward svc/web-my-nginx-chart 8080:80      # mở http://localhost:8080
```

> [!IMPORTANT]
> Bản gốc cài với release `my-nginx-release` nhưng lại port-forward `svc/my-nginx-chart` — Service đó không tồn tại. Tên thật là `my-nginx-release-my-nginx-chart`, theo quy tắc `<release>-<chart>` trong `_helpers.tpl` (nếu tên release đã chứa tên chart thì chỉ dùng tên release). Muốn tên gọn, đặt `fullnameOverride` trong values.

## Bước 5: Nâng cấp, values theo môi trường, rollback

Mỗi môi trường một file values chỉ chứa phần khác biệt. Tạo `values-dev.yaml`:

```yaml
replicaCount: 1
resources:
  requests: { cpu: 50m, memory: 64Mi }
  limits:   { memory: 128Mi }
```

```bash
# Lệnh dùng được cho cả lần đầu lẫn các lần sau — đây là lệnh CI/CD hay dùng
helm upgrade --install web ./my-nginx-chart -f values-dev.yaml --wait --timeout 5m

helm history web
helm get values web                  # values thực tế release đang dùng
helm rollback web 1 --wait           # quay về revision 1
```

> [!IMPORTANT]
> Bản gốc chỉ dùng `helm install` một lần. Giá trị thật của Helm nằm ở `upgrade --install`, values theo môi trường, `history` và `rollback` — bài 7 dùng đúng các lệnh này trong pipeline.

> [!WARNING]
> `--set` tiện khi thử nhưng không để lại dấu vết trong Git. Ngoài lab, ghi mọi giá trị vào file values và commit; chỉ dùng `--set` cho giá trị do pipeline sinh ra (như tag image theo commit).

## Bước 6: Dùng chart của người khác

Chart công khai được phát hành theo hai kiểu: **repository HTTP** (cần `helm repo add`) hoặc **registry OCI** (cài thẳng bằng URL `oci://`). Ví dụ với `podinfo`, một ứng dụng demo phổ biến:

```bash
helm show values oci://ghcr.io/stefanprodan/charts/podinfo | less    # đọc values trước khi cài
helm install demo oci://ghcr.io/stefanprodan/charts/podinfo --set replicaCount=2 --wait
kubectl port-forward svc/demo-podinfo 9898:9898                      # mở http://localhost:9898
```

> [!IMPORTANT]
> Bản gốc gợi ý cài chart từ **Bitnami**. Từ 2025, Bitnami (Broadcom) thu hẹp catalog miễn phí: phần lớn image cũ chuyển sang `bitnamilegacy` và không còn được cập nhật bảo mật. Đừng mặc định chọn chart Bitnami cho dự án mới — ưu tiên chart chính chủ của dự án (ví dụ `prometheus-community` ở bài 8) và luôn ghim `--version`.

> [!TIP]
> Trước khi cài chart lạ: `helm show values` để biết chart cho đổi gì, `helm template` để xem nó tạo ra những gì (có ClusterRole quyền rộng không, có chạy privileged không). Plugin `helm diff` cho xem trước khác biệt của một lần `upgrade`.

## Dọn dẹp

```bash
helm uninstall web demo
```

## Tóm tắt lệnh

| Lệnh | Dùng để |
|---|---|
| `helm create` / `lint` / `template` | Tạo chart, kiểm tra, xem manifest sinh ra |
| `helm upgrade --install <release> <chart> -f values.yaml --wait` | Cài hoặc nâng cấp (dùng trong CI/CD) |
| `helm list` / `history` / `get values` | Xem release, lịch sử, values đang dùng |
| `helm rollback <release> <revision>` | Quay lui |
| `helm show values <chart>` | Đọc values của chart người khác trước khi cài |

Tài liệu: [Helm docs](https://helm.sh/docs/) · [Chart best practices](https://helm.sh/docs/chart_best_practices/)
