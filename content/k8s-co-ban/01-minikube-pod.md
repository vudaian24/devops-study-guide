---
ten: Cài Minikube và chạy Pod đầu tiên
goc: https://devops.vn/posts/kubernetes-co-ban-cai-dat-minikube/
thoiGian: 25 phút
chip: Minikube, kubectl, Pod, Namespace
bank: Kubernetes
---

Kubernetes (K8s) là nền tảng điều phối container. Bạn **khai báo trạng thái mong muốn** (chạy image nào, mấy bản, mở cổng nào), còn Kubernetes liên tục đưa cluster về đúng trạng thái đó. Bài này dựng một cluster chạy ngay trên máy bằng **Minikube** rồi chạy Pod đầu tiên.

Sau bài này bạn sẽ:

- Có cluster Minikube và `kubectl` hoạt động.
- Hiểu Pod là gì, tạo Pod bằng YAML, đọc trạng thái, log và sự kiện của nó.
- Có namespace `hoc-k8s` dùng chung cho cả series.

## Chuẩn bị

| Thành phần | Tối thiểu | Khuyến nghị cho cả series |
|---|---|---|
| CPU | 2 | 4 |
| RAM trống | 2 GB | 4–6 GB |
| Docker | Docker Engine hoặc Docker Desktop đang chạy | |
| Hệ điều hành | Linux, macOS, Windows (WSL2) | |

> [!IMPORTANT]
> Bản gốc chỉ hướng dẫn Ubuntu 22.04. Bản này thêm macOS và Windows, đồng thời nâng mức RAM khuyến nghị vì bài 8 cài `kube-prometheus-stack`, nặng hơn nhiều so với các bài đầu.

## Bước 1: Cài kubectl và Minikube

`kubectl` là CLI nói chuyện với API server của Kubernetes; Minikube là công cụ dựng cluster. Cần cả hai.

macOS (Homebrew):

```bash
brew install kubectl minikube
```

Linux (tự nhận kiến trúc amd64 / arm64):

```bash
ARCH=$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/')

# kubectl — bản stable mới nhất
curl -LO "https://dl.k8s.io/release/$(curl -Ls https://dl.k8s.io/release/stable.txt)/bin/linux/${ARCH}/kubectl"
sudo install -m 0755 kubectl /usr/local/bin/kubectl

# minikube
curl -LO "https://storage.googleapis.com/minikube/releases/latest/minikube-linux-${ARCH}"
sudo install minikube-linux-${ARCH} /usr/local/bin/minikube
```

Windows (PowerShell):

```powershell
winget install Kubernetes.kubectl
winget install Kubernetes.minikube
```

Kiểm tra:

```bash
kubectl version --client
minikube version
```

> [!IMPORTANT]
> Bản gốc chỉ cài Minikube nên `kubectl` ở các bước sau sẽ báo *command not found* trên máy chưa có sẵn. Bản gốc cũng cài cứng file `amd64`, không chạy được trên máy ARM (Apple Silicon, Graviton).

> [!IMPORTANT]
> Bản gốc in sẵn kết quả `minikube v1.33.1` và Kubernetes `v1.29.0` — các phiên bản này đã hết hạn hỗ trợ. Số bạn thấy sẽ khác, và điều đó không sao. Quy tắc cần nhớ: `kubectl` chỉ được lệch cluster **tối đa một minor version** (kubectl 1.N dùng được với cluster 1.N−1 đến 1.N+1).

> [!WARNING]
> Trên Linux, Minikube từ chối chạy driver Docker bằng `root`. Thêm user vào nhóm `docker` rồi đăng nhập lại: `sudo usermod -aG docker $USER && newgrp docker`.

## Bước 2: Khởi động cluster

```bash
minikube start --driver=docker --cpus=4 --memory=6g
```

Máy yếu thì dùng `--cpus=2 --memory=4g`; chỉ bài 8 mới cần nhiều tài nguyên. Kiểm tra:

```bash
minikube status
kubectl get nodes
```

```text
NAME       STATUS   ROLES           AGE   VERSION
minikube   Ready    control-plane   1m    v1.xx.x
```

`minikube start` cũng tự trỏ `kubectl` vào cluster này (context `minikube`). Xem context hiện tại bằng `kubectl config current-context`.

> [!IMPORTANT]
> Bản gốc kết thúc **mỗi bài** bằng `minikube delete` rồi bài sau tạo lại từ đầu — mất vài phút mỗi lần và phải kéo lại toàn bộ image. Bản này giữ một cluster cho cả series: dùng `minikube stop` để tạm dừng (giữ nguyên mọi thứ), `minikube start` để chạy tiếp. Chỉ `minikube delete` khi muốn làm lại từ đầu.

## Bước 3: Tạo namespace cho series

Namespace chia một cluster thành nhiều "phòng" logic. Cả series dùng namespace `hoc-k8s` thay vì `default`, nên dọn dẹp chỉ cần xoá một namespace.

```bash
kubectl create namespace hoc-k8s
kubectl config set-context --current --namespace=hoc-k8s

# Kiểm tra namespace mặc định của context hiện tại
kubectl config view --minify -o jsonpath='{..namespace}'; echo
```

> [!IMPORTANT]
> Bản gốc tạo mọi thứ trong `default`. Thói quen dùng namespace riêng ngay từ đầu giúp bạn quen với cách cluster thật được tổ chức (mỗi team / môi trường một namespace, phân quyền RBAC theo namespace).

## Bước 4: Tạo Pod đầu tiên

**Pod** là đơn vị nhỏ nhất Kubernetes triển khai: một hoặc vài container dùng chung network (chung IP, gọi nhau qua `localhost`) và có thể dùng chung volume. Thực tế hiếm khi tạo Pod trực tiếp — bài 2 sẽ dùng Deployment — nhưng hiểu Pod trước giúp đọc được mọi thứ còn lại.

Tạo file `nginx-pod.yaml`:

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
      image: nginx:1.28          # pin phiên bản cụ thể, không dùng latest
      ports:
        - containerPort: 80
```

> [!IMPORTANT]
> `nginx:latest` → `nginx:1.28`. Tag `latest` là tag trôi: hôm nay và tháng sau có thể là hai image khác nhau, và với `latest` Kubernetes mặc định `imagePullPolicy: Always` nên mỗi lần Pod khởi động lại có thể chạy một bản khác. Bản này cũng thêm `labels` — từ bài 2 trở đi, Deployment và Service đều chọn Pod bằng label.

> [!TIP]
> Không cần gõ YAML từ đầu. Sinh bộ khung rồi sửa: `kubectl run nginx-pod --image=nginx:1.28 --port=80 --dry-run=client -o yaml > nginx-pod.yaml`

Triển khai và đợi Pod sẵn sàng:

```bash
kubectl apply -f nginx-pod.yaml
kubectl wait --for=condition=Ready pod/nginx-pod --timeout=90s
kubectl get pods -o wide
```

```text
NAME        READY   STATUS    RESTARTS   AGE   IP           NODE
nginx-pod   1/1     Running   0          20s   10.244.0.5   minikube
```

## Bước 5: Quan sát Pod

Bốn lệnh bạn sẽ dùng hằng ngày:

```bash
kubectl describe pod nginx-pod          # cấu hình + phần Events ở cuối
kubectl logs nginx-pod                  # stdout/stderr của container
kubectl exec -it nginx-pod -- nginx -v  # chạy lệnh bên trong container
kubectl port-forward pod/nginx-pod 8080:80
```

Với `port-forward`, mở `http://localhost:8080` sẽ thấy trang *Welcome to nginx!*; nhấn `Ctrl+C` để dừng.

Phần **Events** cuối `kubectl describe` là nơi đầu tiên cần nhìn khi Pod không chạy. Các trạng thái hay gặp:

| Trạng thái | Nghĩa là | Nhìn vào đâu |
|---|---|---|
| `Pending` | Chưa được xếp lên node nào | Events: thiếu CPU/RAM, không node nào khớp |
| `ContainerCreating` | Đang kéo image / gắn volume | Events |
| `ImagePullBackOff` | Kéo image lỗi (sai tên, sai tag, thiếu quyền registry) | Events |
| `CrashLoopBackOff` | Container khởi động rồi chết, lặp lại | `kubectl logs --previous` |
| `Running` | Container đang chạy (chưa chắc đã *sẵn sàng* nhận request) | Cột `READY` |

Thử xoá Pod và xem điều gì xảy ra:

```bash
kubectl delete pod nginx-pod
kubectl get pods
```

Pod biến mất và **không ai tạo lại** — vì không có controller nào quản lý nó. Đó chính là lý do bài 2 dùng Deployment.

## Dọn dẹp

```bash
kubectl delete -f nginx-pod.yaml --ignore-not-found
minikube stop        # tạm dừng; bài sau chỉ cần minikube start
```

## Tóm tắt lệnh

| Lệnh | Dùng để |
|---|---|
| `minikube start` / `stop` / `delete` | Bật, tạm dừng, xoá hẳn cluster |
| `kubectl config set-context --current --namespace=…` | Đổi namespace mặc định |
| `kubectl apply -f file.yaml` | Tạo / cập nhật tài nguyên theo file |
| `kubectl get pods -o wide` | Liệt kê Pod kèm IP, node |
| `kubectl describe pod <tên>` | Chi tiết + Events |
| `kubectl logs <tên>` | Xem log |
| `kubectl exec -it <tên> -- <lệnh>` | Chạy lệnh trong container |

Tài liệu: [Minikube — Get Started](https://minikube.sigs.k8s.io/docs/start/) · [Kubernetes — Pods](https://kubernetes.io/docs/concepts/workloads/pods/)
