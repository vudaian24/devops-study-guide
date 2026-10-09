---
ten: Service, Ingress và Gateway API
goc: https://devops.vn/posts/kubernetes-service-ingress-quan-ly-truy-cap/
thoiGian: 35 phút
chip: Service, EndpointSlice, Ingress, Gateway API, minikube tunnel
bank: Kubernetes, Networking
---

Pod sinh ra rồi mất đi liên tục, IP của chúng đổi theo. **Service** cho một nhóm Pod một địa chỉ ổn định (IP ảo + tên DNS) và chia tải giữa chúng. **Ingress** (và người kế nhiệm là **Gateway API**) đưa traffic HTTP từ bên ngoài vào Service theo tên miền và đường dẫn.

```text
Client ──► Ingress / Gateway (theo host, path) ──► Service (IP ảo ổn định) ──► Pod, Pod, Pod
```

## Chuẩn bị

```bash
minikube start
kubectl config set-context --current --namespace=hoc-k8s
kubectl apply -f nginx-deployment.yaml          # file từ bài 2
```

## Bước 1: Tạo Service

Các loại Service:

| Loại | Truy cập từ | Dùng khi |
|---|---|---|
| `ClusterIP` (mặc định) | Chỉ trong cluster | Service nội bộ; đứng sau Ingress / Gateway |
| `NodePort` | `IP-node:30000–32767` | Lab, hoặc có load balancer riêng phía trước |
| `LoadBalancer` | IP / DNS do cloud cấp | Cần một load balancer riêng cho Service (bài 5) |

Tạo file `nginx-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  type: ClusterIP
  selector:
    app: nginx            # chọn mọi Pod có label app=nginx
  ports:
    - name: http
      port: 80            # cổng của Service
      targetPort: http    # tên cổng khai báo trong container (bài 2)
```

> [!IMPORTANT]
> Bản gốc dùng `targetPort: 80`. Trỏ theo **tên cổng** (`http`) thì sau này đổi cổng container (ví dụ sang 8080 khi chạy non-root) chỉ cần sửa Deployment, Service không phải sửa theo.

```bash
kubectl apply -f nginx-service.yaml
kubectl get service nginx-service
kubectl get endpointslices -l kubernetes.io/service-name=nginx-service
```

EndpointSlice liệt kê IP các Pod mà Service đang trỏ tới. Danh sách rỗng gần như luôn có nghĩa là `selector` không khớp label của Pod, hoặc Pod chưa qua readiness probe.

> [!IMPORTANT]
> Tài liệu cũ dùng `kubectl get endpoints`. API `Endpoints` đã bị deprecate từ Kubernetes 1.33 và lệnh này giờ in cảnh báo — dùng `endpointslices` thay thế.

Gọi thử từ một Pod tạm trong cluster:

```bash
kubectl run curl --rm -it --restart=Never --image=curlimages/curl:8.10.1 -- \
  curl -s http://nginx-service
```

Trong cùng namespace gọi bằng `nginx-service` là đủ; từ namespace khác dùng tên đầy đủ `nginx-service.hoc-k8s.svc.cluster.local`.

## Bước 2: Bật Ingress controller

Đối tượng Ingress chỉ là *luật*; cần một **Ingress controller** đọc luật đó và thực sự nhận traffic. Minikube có sẵn addon:

```bash
minikube addons enable ingress
kubectl wait -n ingress-nginx --for=condition=Ready pod \
  -l app.kubernetes.io/component=controller --timeout=180s
```

## Bước 3: Tạo Ingress

Tạo file `nginx-ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nginx-ingress
spec:
  ingressClassName: nginx        # controller nào xử lý Ingress này
  rules:
    - host: nginx.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: nginx-service
                port:
                  name: http
```

```bash
kubectl apply -f nginx-ingress.yaml
kubectl get ingress nginx-ingress
```

> [!IMPORTANT]
> Bản gốc thiếu `ingressClassName`. Cluster chỉ có một controller được đánh dấu *default* thì vẫn chạy, nhưng cluster thật thường có nhiều controller (nội bộ / public) hoặc không có default — khi đó Ingress bị bỏ qua mà không báo lỗi. Annotation cũ `kubernetes.io/ingress.class` đã bị thay bằng trường này.

## Bước 4: Truy cập từ máy của bạn

Cách làm khác nhau theo hệ điều hành, vì với driver Docker trên macOS/Windows, IP của node Minikube nằm trong mạng ảo của Docker Desktop và **máy host không tới được**.

Linux:

```bash
curl -H "Host: nginx.local" http://$(minikube ip)/
```

macOS / Windows — mở terminal riêng và để chạy suốt (sẽ hỏi mật khẩu sudo để mở cổng 80/443):

```bash
minikube tunnel
```

Rồi ở terminal khác:

```bash
curl -H "Host: nginx.local" http://127.0.0.1/
```

Muốn mở bằng trình duyệt tại `http://nginx.local`, thêm một dòng vào `/etc/hosts` (Windows: `C:\Windows\System32\drivers\etc\hosts`): dùng IP của `minikube ip` trên Linux, `127.0.0.1` trên macOS/Windows.

> [!IMPORTANT]
> Bản gốc dùng `minikube ip` + `/etc/hosts` cho mọi máy — trên macOS/Windows với driver Docker cách này treo vì không tới được IP đó; phải dùng `minikube tunnel`. Bản này cũng ưu tiên `curl -H "Host: …"`, kiểm tra được ngay mà không cần sửa file hệ thống.

## Bước 5: Ingress hay Gateway API?

> [!IMPORTANT]
> Bản gốc khuyên dùng NGINX Ingress cho production. Tháng 11/2025, Kubernetes thông báo **dừng phát triển dự án Ingress-NGINX** (chỉ bảo trì tối thiểu tới 3/2026, sau đó không còn bản vá bảo mật). API `Ingress` vẫn là API ổn định và còn nhiều controller khác hỗ trợ, nhưng hướng đi của cộng đồng là **Gateway API**. Học Ingress để đọc được hệ thống hiện có; dự án mới nên chọn Gateway API.

| | Ingress | Gateway API |
|---|---|---|
| Mô hình | Một đối tượng gộp mọi thứ | Tách vai: `GatewayClass` (hạ tầng), `Gateway` (cổng vào), `HTTPRoute` (luật của từng app) |
| Tính năng nâng cao | Qua annotation, mỗi controller một kiểu | Có sẵn trong spec: chia traffic theo trọng số, header, redirect, rewrite… |
| Ngoài HTTP | Không | TCP, UDP, TLS, gRPC |

### Thử Gateway API (làm sau bài 6)

Phần này cài controller bằng Helm. Nếu chưa học bài 6, quay lại sau.

```bash
minikube addons disable ingress          # tránh tranh cổng 80 với Envoy

# Envoy Gateway — một controller Gateway API; thêm --version vX.Y.Z để pin
helm install eg oci://docker.io/envoyproxy/gateway-helm \
  -n envoy-gateway-system --create-namespace
kubectl wait -n envoy-gateway-system deployment/envoy-gateway \
  --for=condition=Available --timeout=5m
```

Tạo file `nginx-gateway.yaml`:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: eg
spec:
  controllerName: gateway.envoyproxy.io/gatewayclass-controller
---
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: web-gw
spec:
  gatewayClassName: eg
  listeners:
    - name: http
      protocol: HTTP
      port: 80
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: nginx
spec:
  parentRefs:
    - name: web-gw
  hostnames:
    - nginx.local
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: nginx-service
          port: 80
```

```bash
kubectl apply -f nginx-gateway.yaml
kubectl get gateway web-gw            # đợi cột PROGRAMMED = True và có ADDRESS
```

Với `minikube tunnel` đang chạy, gọi tới địa chỉ ở cột `ADDRESS`:

```bash
curl -H "Host: nginx.local" http://$(kubectl get gateway web-gw -o jsonpath='{.status.addresses[0].value}')/
```

## Dọn dẹp

```bash
kubectl delete -f nginx-gateway.yaml --ignore-not-found
kubectl delete -f nginx-ingress.yaml -f nginx-service.yaml --ignore-not-found
helm uninstall eg -n envoy-gateway-system 2>/dev/null || true
```

Giữ lại file `nginx-deployment.yaml` — bài 5 và bài 8 dùng lại.

## Tóm tắt

- Service = IP ảo + DNS ổn định trước một nhóm Pod, chọn bằng label. Không nhận traffic → kiểm tra EndpointSlice trước tiên.
- Ingress / Gateway = luật định tuyến HTTP từ ngoài vào Service; luôn cần một controller chạy thật.
- Dự án mới: Gateway API. Hệ thống cũ: Ingress, nhớ đặt `ingressClassName`.

Tài liệu: [Service](https://kubernetes.io/docs/concepts/services-networking/service/) · [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/) · [Gateway API](https://gateway-api.sigs.k8s.io/) · [Envoy Gateway quickstart](https://gateway.envoyproxy.io/docs/tasks/quickstart/)
