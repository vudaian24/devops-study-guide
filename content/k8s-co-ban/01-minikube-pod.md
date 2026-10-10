---
ten: Cài đặt Minikube và chạy Pod đầu tiên
goc: https://devops.vn/posts/kubernetes-co-ban-cai-dat-minikube/
thoiGian: 25 phút
chip: Kubernetes, Minikube, kubectl, Pod
bank: Kubernetes
---

Kubernetes (K8s) là nền tảng mã nguồn mở dùng để quản lý ứng dụng chạy trong container: tự động triển khai, mở rộng và giữ cho ứng dụng luôn chạy. Bài đầu tiên này hướng dẫn cài **Minikube** — công cụ dựng một cluster Kubernetes ngay trên máy cá nhân — và chạy **Pod** đầu tiên để thấy Kubernetes hoạt động như thế nào.

Sau bài này bạn sẽ:

- Có một cluster Kubernetes chạy trên máy và dùng được lệnh `kubectl`.
- Hiểu Pod là gì, viết được file YAML tạo Pod.
- Biết xem trạng thái, log, chi tiết của Pod và dọn dẹp sau khi thử.

## Kubernetes là gì?

Bạn không ra lệnh "chạy container này trên máy kia". Bạn **khai báo trạng thái mong muốn** — ví dụ "luôn có 3 bản Nginx chạy" — và Kubernetes liên tục so sánh trạng thái thật với mong muốn để tự sửa: container chết thì chạy lại, máy hỏng thì dời sang máy khác.

Một cluster gồm hai phần:

| Thành phần | Vai trò |
|---|---|
| **Control plane** | "Bộ não": API server (nơi `kubectl` gửi lệnh tới), etcd (lưu trạng thái), scheduler (chọn node cho Pod), controller manager (liên tục sửa cho đúng trạng thái mong muốn) |
| **Node** (worker) | Máy chạy ứng dụng: kubelet nhận việc từ control plane và chạy container qua container runtime |

Minikube gói cả hai phần vào **một node** chạy trong Docker trên máy bạn — đủ để học mọi khái niệm cơ bản.

## Chuẩn bị

| Thành phần | Yêu cầu |
|---|---|
| CPU / RAM | Tối thiểu 2 CPU, 2 GB RAM trống. Nên có 4 CPU, 6 GB để làm trọn series (bài 8 cài Prometheus + Grafana) |
| Docker | Docker Engine **đang chạy** |
| Hệ điều hành | Linux |

Kiểm tra Docker đang chạy:

```bash
docker version
```

Thấy cả hai phần `Client` và `Server` là được. Nếu chỉ có `Client` kèm lỗi *Cannot connect to the Docker daemon*, hãy chạy `sudo systemctl start docker` rồi thử lại.

## Bước 1: Cài đặt kubectl và Minikube

- **kubectl**: công cụ dòng lệnh để làm việc với mọi cluster Kubernetes (Minikube, EKS, GKE…).
- **Minikube**: công cụ dựng cluster trên máy cá nhân.

Đoạn lệnh tự nhận kiến trúc máy (amd64 hoặc arm64):

```bash
ARCH=$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/')

# kubectl — bản ổn định mới nhất
curl -LO "https://dl.k8s.io/release/$(curl -Ls https://dl.k8s.io/release/stable.txt)/bin/linux/${ARCH}/kubectl"
sudo install -m 0755 kubectl /usr/local/bin/kubectl

# minikube
curl -LO "https://storage.googleapis.com/minikube/releases/latest/minikube-linux-${ARCH}"
sudo install minikube-linux-${ARCH} /usr/local/bin/minikube
```

Mở terminal mới rồi kiểm tra:

```bash
kubectl version --client
minikube version
```

Kết quả (số phiên bản trên máy bạn có thể khác):

```text
Client Version: v1.xx.x
Kustomize Version: v5.x.x
minikube version: v1.xx.x
```

> [!WARNING]
> Trên Linux, Minikube không cho chạy driver Docker bằng user `root`. Hãy dùng user thường và thêm user vào nhóm `docker`: `sudo usermod -aG docker $USER && newgrp docker`.

## Bước 2: Khởi động cluster Minikube

```bash
minikube start --driver=docker --cpus=4 --memory=6g
```

- `--driver=docker`: chạy node Kubernetes bên trong một container Docker.
- `--cpus`, `--memory`: tài nguyên cấp cho cluster. Máy yếu thì dùng `--cpus=2 --memory=4g` (chỉ bài 8 cần nhiều hơn).

Lần đầu mất vài phút để tải image. Kết quả cuối cùng:

```text
🏄  Done! kubectl is now configured to use "minikube" cluster and "default" namespace by default
```

Dòng `Done!` cho biết cluster đã chạy **và** `kubectl` đã được trỏ sẵn vào cluster này. Kiểm tra:

```bash
minikube status
kubectl get nodes
```

```text
minikube
type: Control Plane
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured

NAME       STATUS   ROLES           AGE   VERSION
minikube   Ready    control-plane   1m    v1.xx.x
```

Node ở trạng thái `Ready` là cluster sẵn sàng. Muốn xem các thành phần hệ thống đang chạy dưới dạng Pod:

```bash
kubectl get pods -n kube-system
```

Bạn sẽ thấy `etcd`, `kube-apiserver`, `kube-scheduler`, `coredns`… — chính là các thành phần của control plane ở bảng phía trên.

> [!TIP]
> Không cần xoá cluster sau mỗi bài. `minikube stop` tạm dừng và giữ nguyên mọi thứ; bài sau chỉ cần `minikube start` là chạy tiếp, nhanh hơn nhiều so với tạo lại từ đầu.

## Bước 3: Tạo Pod đầu tiên và kiểm tra

**Pod** là đơn vị nhỏ nhất mà Kubernetes triển khai. Một Pod chứa một (thường gặp nhất) hoặc vài container dùng chung địa chỉ IP và có thể dùng chung ổ đĩa.

Tạo file `nginx-pod.yaml` với nội dung:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  labels:
    app: nginx
spec:
  containers:
    - name: nginx
      image: nginx:1.28
      ports:
        - containerPort: 80
```

Ý nghĩa từng phần:

| Trường | Ý nghĩa |
|---|---|
| `apiVersion: v1`, `kind: Pod` | Loại tài nguyên muốn tạo. Mọi file YAML của Kubernetes đều bắt đầu bằng hai dòng này |
| `metadata.name` | Tên Pod, không trùng trong cùng namespace |
| `metadata.labels` | Nhãn dạng `key: value`. Bài 2, 3 dùng nhãn để Deployment và Service tìm đúng Pod |
| `spec.containers` | Danh sách container trong Pod |
| `image: nginx:1.28` | Image chạy container. Luôn ghi **phiên bản cụ thể** thay vì `latest`, để lần nào chạy cũng ra đúng một bản |
| `containerPort: 80` | Cổng ứng dụng lắng nghe bên trong container (mang tính mô tả) |

> [!TIP]
> Không muốn gõ YAML từ đầu? Cho kubectl sinh khung rồi sửa lại: `kubectl run nginx-pod --image=nginx:1.28 --port=80 --dry-run=client -o yaml > nginx-pod.yaml`

Triển khai Pod và đợi nó sẵn sàng:

```bash
kubectl apply -f nginx-pod.yaml
kubectl wait --for=condition=Ready pod/nginx-pod --timeout=90s
kubectl get pods -o wide
```

```text
pod/nginx-pod created
pod/nginx-pod condition met

NAME        READY   STATUS    RESTARTS   AGE   IP           NODE
nginx-pod   1/1     Running   0          20s   10.244.0.5   minikube
```

`READY 1/1` và `STATUS Running` nghĩa là container đã chạy. Giờ thử bốn lệnh bạn sẽ dùng hằng ngày:

```bash
kubectl describe pod nginx-pod           # thông tin chi tiết, xem phần Events ở cuối
kubectl logs nginx-pod                   # log của container
kubectl exec -it nginx-pod -- nginx -v   # chạy một lệnh bên trong container
kubectl port-forward pod/nginx-pod 8080:80
```

Lệnh cuối chuyển cổng 8080 trên máy bạn vào cổng 80 của Pod. Mở trình duyệt tới `http://localhost:8080` sẽ thấy trang **Welcome to nginx!**. Nhấn `Ctrl+C` để dừng.

Phần **Events** ở cuối `kubectl describe` kể lại Pod đã trải qua những gì: được xếp lên node (`Scheduled`), kéo image (`Pulling`, `Pulled`), tạo và chạy container (`Created`, `Started`). Khi Pod không chạy, đây là chỗ đầu tiên cần xem.

Cuối cùng, thử xoá Pod:

```bash
kubectl delete pod nginx-pod
kubectl get pods
```

Pod biến mất và **không được tạo lại** — vì không có thành phần nào "trông coi" Pod này. Đó là lý do trong thực tế ta không tạo Pod trực tiếp mà dùng **Deployment** ở bài 2.

## Bước 4: Xoá tài nguyên để dọn dẹp

```bash
kubectl delete -f nginx-pod.yaml --ignore-not-found
minikube stop
```

`minikube stop` tạm dừng cluster, giữ lại dữ liệu cho bài sau. Khi học xong cả series, hoặc muốn làm lại từ đầu:

```bash
minikube delete
```

```text
🔥  Deleting "minikube" in docker ...
💀  Removed all traces of the "minikube" cluster.
```

## Xử lý sự cố thường gặp

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| `minikube start` báo không tìm thấy driver docker | Docker chưa chạy | `sudo systemctl start docker`, rồi chạy lại |
| `The "docker" driver should not be used with root privileges` | Đang dùng user root trên Linux | Dùng user thường, thêm vào nhóm `docker` |
| `kubectl` báo `connection refused` | Cluster đang dừng | `minikube start` |
| Pod ở trạng thái `ImagePullBackOff` | Sai tên / tag image, hoặc mạng không tải được | `kubectl describe pod <tên>` xem Events, sửa image rồi `kubectl apply` lại |
| Pod mãi ở `Pending` | Cluster thiếu CPU / RAM | Xem Events; tạo lại cluster với `--cpus`, `--memory` lớn hơn |

## Lưu ý quan trọng

- **Phiên bản**: `kubectl` chỉ nên lệch cluster tối đa một phiên bản phụ (ví dụ kubectl 1.N dùng với cluster 1.N−1 đến 1.N+1).
- **Tag image**: tránh `latest`. Ghi rõ phiên bản giúp mọi lần chạy cho cùng một kết quả và rollback được.
- **Driver**: bài này dùng Docker. Minikube còn hỗ trợ các driver khác (Podman, VirtualBox, Hyper-V…); đổi bằng `--driver=<tên>`.
- Tài liệu: [Minikube — Get Started](https://minikube.sigs.k8s.io/docs/start/) · [Kubernetes — Pods](https://kubernetes.io/docs/concepts/workloads/pods/) · [kubectl Quick Reference](https://kubernetes.io/docs/reference/kubectl/quick-reference/)
