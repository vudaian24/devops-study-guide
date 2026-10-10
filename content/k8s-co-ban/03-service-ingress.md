---
ten: Service và Ingress — quản lý truy cập ứng dụng
goc: https://devops.vn/posts/kubernetes-service-ingress-quan-ly-truy-cap/
thoiGian: 35 phút
chip: Service, ClusterIP, DNS, Ingress, ingressClassName, Gateway API
bank: Kubernetes, Networking
---

**Service** cung cấp một địa chỉ cố định (IP ảo + tên DNS) để kết nối tới một nhóm Pod và chia đều request cho chúng — dù Pod có bị tạo lại và đổi IP bao nhiêu lần. **Ingress** đưa traffic HTTP/HTTPS từ bên ngoài cluster vào đúng Service dựa theo tên miền và đường dẫn. Ở bài 2 bạn truy cập bằng port-forward; bài này làm đúng cách: Service để kết nối ổn định, Ingress để truy cập qua tên miền.

```text
Trình duyệt ──► Ingress (nginx.local) ──► Service nginx-service ──► Pod, Pod
```

Sau bài này bạn sẽ:

- Tạo Service và gọi được ứng dụng bằng tên DNS bên trong cluster.
- Bật Ingress controller, tạo Ingress và truy cập ứng dụng qua tên miền `nginx.local`.
- Biết cách debug khi Service / Ingress không trả về gì.

## Bước 1: Khởi động cluster và tạo Deployment

```bash
minikube start
```

Dùng lại file `nginx-deployment.yaml` từ bài 2 (Deployment Nginx có nhãn `app: nginx`, cổng tên `http`), đổi `replicas` thành `2` cho nhẹ:

```bash
kubectl apply -f nginx-deployment.yaml
kubectl rollout status deployment/nginx-deployment
kubectl get pods -l app=nginx -o wide
```

```text
NAME                                READY   STATUS    RESTARTS   AGE   IP
nginx-deployment-6b7f9c8d5c-2xk8p   1/1     Running   0          15s   10.244.0.7
nginx-deployment-6b7f9c8d5c-9qv4m   1/1     Running   0          15s   10.244.0.8
```

Để ý cột `IP`: mỗi Pod một IP và IP này **đổi** mỗi khi Pod được tạo lại. Vì vậy không thể gọi ứng dụng bằng IP Pod — cần Service.

## Bước 2: Tạo Service để kết nối tới Pod

Kubernetes có ba loại Service hay dùng:

| Loại | Truy cập được từ | Dùng khi |
|---|---|---|
| `ClusterIP` (mặc định) | Chỉ bên trong cluster | Kết nối giữa các service nội bộ; đứng sau Ingress |
| `NodePort` | `IP-của-node:30000–32767` | Thử nghiệm, hoặc đã có load balancer riêng phía trước |
| `LoadBalancer` | IP / tên miền do cloud cấp | Mở thẳng một service ra Internet trên cloud (bài 5) |

Tạo file `nginx-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  type: ClusterIP
  selector:
    app: nginx
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: http
```

| Trường | Ý nghĩa |
|---|---|
| `selector: app: nginx` | Service gửi traffic tới mọi Pod có nhãn này — Pod mới sinh ra cũng tự được thêm vào |
| `port: 80` | Cổng của Service (người gọi dùng cổng này) |
| `targetPort: http` | Cổng trên Pod, gọi theo **tên** đã đặt trong Deployment. Sau này đổi số cổng container thì Service không phải sửa |

Triển khai và kiểm tra:

```bash
kubectl apply -f nginx-service.yaml
kubectl get service nginx-service
kubectl get endpointslices -l kubernetes.io/service-name=nginx-service
```

```text
service/nginx-service created

NAME            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
nginx-service   ClusterIP   10.96.142.17    <none>        80/TCP    5s

NAME                  ADDRESSTYPE   PORTS   ENDPOINTS               AGE
nginx-service-x7k2p   IPv4          80      10.244.0.7,10.244.0.8   5s
```

**EndpointSlice** liệt kê IP các Pod mà Service đang trỏ tới — ở đây đúng là 2 IP của 2 Pod. Nếu cột `ENDPOINTS` trống, gần như chắc chắn `selector` không khớp nhãn Pod, hoặc Pod chưa qua readiness probe.

Gọi thử Service từ một Pod tạm bên trong cluster:

```bash
kubectl run curl --rm -it --restart=Never --image=curlimages/curl:8.10.1 -- \
  curl -s http://nginx-service
```

Kết quả là HTML của trang *Welcome to nginx!*, sau đó Pod tạm tự xoá. Trong cùng namespace, gọi bằng tên `nginx-service` là đủ; từ namespace khác dùng tên đầy đủ `nginx-service.default.svc.cluster.local`.

## Bước 3: Cấu hình Ingress để truy cập từ bên ngoài

Ingress gồm hai phần:

- **Ingress controller**: phần mềm (thường là một reverse proxy) thật sự nhận traffic. Không có controller thì Ingress không làm gì cả.
- **Đối tượng Ingress**: các luật định tuyến — host nào, đường dẫn nào đi tới Service nào.

Bật Ingress controller có sẵn của Minikube và đợi nó sẵn sàng:

```bash
minikube addons enable ingress
kubectl wait -n ingress-nginx --for=condition=Ready pod \
  -l app.kubernetes.io/component=controller --timeout=180s
```

```text
🌟  The 'ingress' addon is enabled
pod/ingress-nginx-controller-xxxxxxxxx-xxxxx condition met
```

Tạo file `nginx-ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nginx-ingress
spec:
  ingressClassName: nginx
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

| Trường | Ý nghĩa |
|---|---|
| `ingressClassName: nginx` | Chỉ định controller nào xử lý Ingress này. Cluster thật thường có nhiều controller nên luôn ghi rõ |
| `host: nginx.local` | Chỉ áp dụng cho request có tên miền này |
| `path: /` + `pathType: Prefix` | Mọi đường dẫn bắt đầu bằng `/` (tức là tất cả) |
| `backend.service` | Gửi tới Service `nginx-service`, cổng tên `http` |

```bash
kubectl apply -f nginx-ingress.yaml
kubectl get ingress nginx-ingress
```

```text
NAME            CLASS   HOSTS         ADDRESS        PORTS   AGE
nginx-ingress   nginx   nginx.local   192.168.49.2   80      30s
```

Đợi tới khi cột `ADDRESS` có giá trị (khoảng 30 giây).

## Bước 4: Truy cập ứng dụng qua tên miền

```bash
curl -H "Host: nginx.local" http://$(minikube ip)/
```

Lệnh trả về HTML của trang Nginx. Tham số `-H "Host: nginx.local"` giả lập việc truy cập bằng tên miền mà không cần sửa file hệ thống.

Muốn mở bằng trình duyệt tại `http://nginx.local`, thêm một dòng vào file `/etc/hosts` (cần `sudo`):

```text
192.168.49.2  nginx.local      # thay bằng kết quả của lệnh minikube ip
```

## Bước 5: Xoá tài nguyên để dọn dẹp

```bash
kubectl delete -f nginx-ingress.yaml -f nginx-service.yaml
kubectl delete -f nginx-deployment.yaml
minikube stop
```

```text
ingress.networking.k8s.io "nginx-ingress" deleted
service "nginx-service" deleted
deployment.apps "nginx-deployment" deleted
```

Nếu đã sửa file hosts, xoá dòng `nginx.local` đi. Giữ lại các file YAML — bài 5 và bài 8 dùng lại `nginx-deployment.yaml`.

## Xử lý sự cố thường gặp

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| `ENDPOINTS` của Service trống | `selector` không khớp nhãn Pod, hoặc Pod chưa Ready | So `kubectl get pods --show-labels` với `selector`; xem readiness probe |
| Ingress không có `ADDRESS` | Controller chưa chạy, hoặc thiếu / sai `ingressClassName` | `kubectl get pods -n ingress-nginx`; `kubectl get ingressclass` để xem tên class đúng |
| Trả về `404 Not Found` của nginx | Request không khớp `host` của Ingress | Thêm `-H "Host: nginx.local"` hoặc sửa file hosts |
| Trả về `503 Service Temporarily Unavailable` | Service không có Pod nào sẵn sàng phía sau | Kiểm tra EndpointSlice và trạng thái Pod |

## Lưu ý quan trọng

- **Ingress controller trong production**: Minikube có sẵn controller; cluster thật phải tự cài (hoặc dùng controller của cloud, ví dụ AWS Load Balancer Controller tạo ALB). Chọn controller còn được phát triển tích cực — dự án **Ingress-NGINX** của Kubernetes đã dừng phát triển từ 3/2026, các controller khác như Traefik, HAProxy, Envoy vẫn hỗ trợ Ingress.
- **Gateway API** là thế hệ kế tiếp của Ingress, đã ổn định và được khuyến nghị cho dự án mới. Nó tách vai rõ ràng: `GatewayClass` (loại hạ tầng), `Gateway` (cổng vào), `HTTPRoute` (luật của từng ứng dụng), và có sẵn các tính năng mà Ingress phải dùng annotation: chia traffic theo tỉ lệ, theo header, chuyển hướng, viết lại URL. Ví dụ `HTTPRoute` tương đương Ingress ở trên:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: nginx
spec:
  parentRefs:
    - name: web-gw            # Gateway do đội hạ tầng tạo sẵn
  hostnames:
    - nginx.local
  rules:
    - matches:
        - path: { type: PathPrefix, value: / }
      backendRefs:
        - name: nginx-service
          port: 80
```

- **Tên miền**: `nginx.local` chỉ dùng được trên máy bạn. Môi trường thật cần bản ghi DNS trỏ về địa chỉ của Ingress / load balancer, và chứng chỉ TLS (thường cấp tự động bằng cert-manager).
- Tài liệu: [Service](https://kubernetes.io/docs/concepts/services-networking/service/) · [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/) · [Gateway API](https://gateway-api.sigs.k8s.io/)
