/* ============================================================
   Trang 4 — Linux, Virtualization & On-Premises
   Dòng Skills trong CV: Linux, systemd, Nginx, Proxmox (VM/LXC)
   Cấu trúc dữ liệu: xem chú thích đầu js/kb.js
   ============================================================ */

const TRANG = {
  id: "linux",
  ten: "Linux, Virtualization & On-Premises",
  tomTat: "Phần ‘gần nhất với on-premise’ trong CV của bạn: dịch vụ production chạy trên **host Linux tự quản** (systemd + Nginx + Docker) và ảo hoá bằng **Proxmox**. Người phỏng vấn sẽ hỏi cả kiến thức nền (đĩa, load, quyền, mạng) lẫn cách bạn **tự bảo vệ và vận hành** cái host đó.",
  cvSkill: ["Linux", "systemd", "Nginx", "Proxmox (VM/LXC)"],

  cv: [
    { nguon: "Self-managed deployment",
      noi: "Public production service on a self-managed Linux host rather than a managed platform, delivery path owned end to end." },
    { nguon: "Self-managed deployment · Nginx",
      noi: "…served behind Nginx as a TLS-terminating reverse proxy and pinned to an explicit image version rather than auto-updated." },
    { nguon: "Self-managed deployment · SSH",
      noi: "Deployed over SSH as a least-privilege `ci` user with the host key pinned in the workflow rather than trusted on first use, recording the outgoing version for rollback…" },
    { nguon: "Skills",
      noi: "Linux, Virtualization & On-Premises: Linux, systemd, Nginx, Proxmox (VM/LXC)" },
    { nguon: "Professional Summary",
      noi: "DevOps Engineer with 2+ years delivering and operating containerized workloads across managed cloud and self-managed Linux." }
  ],

  bank: ["Linux", "Networking", "Security", "Portfolio tự quản"],

  muc: [
    /* ---------------------------------------------------------- */
    {
      id: "linux-nen-tang", ten: "Linux vận hành — những thứ nền tảng",
      y: [
        "**Process và tín hiệu**: `SIGTERM` (15) xin dừng êm, `SIGKILL` (9) giết cứng và không thể bắt, `SIGHUP` (1) thường là ‘nạp lại cấu hình’, `SIGINT` (2) là Ctrl+C. Process *zombie* = đã chết nhưng tiến trình cha chưa `wait()`; trạng thái `D` = uninterruptible sleep (thường chờ I/O).",
        "**Phân quyền**: `rwx` cho user / group / other; `chmod 750`, `chown user:group`; `umask` quyết định quyền mặc định của file mới. **SUID** (`4755`) chạy bằng quyền owner nên là đường leo thang đặc quyền — audit bằng `find / -perm -4000`. **Sticky bit** (`/tmp`) chỉ cho owner xoá file của mình.",
        "**User và sudo**: mỗi dịch vụ một user riêng, không chạy bằng root; cấp `sudo` theo lệnh cụ thể trong `/etc/sudoers.d/` (sửa bằng `visudo`); đăng nhập bằng SSH key.",
        "**Đĩa**: `df` (dung lượng filesystem) khác `du` (tổng file nhìn thấy). Chênh lệch nghĩa là có file đã xoá nhưng process còn giữ (`lsof +L1`). Cũng kiểm tra hết **inode** (`df -i`) và log phải được xoay vòng (`logrotate`, giới hạn journald).",
        "**Bộ nhớ**: nhìn cột `available` của `free -h` chứ không phải `free` (cache / buffer được thu hồi). **OOM killer** của kernel giết process khi hết RAM — dấu vết nằm trong `dmesg` / `journalctl -k`. Swap giúp chịu đỉnh nhưng swap nặng khiến máy chậm thảm hoạ.",
        "**Gói và bản vá**: `apt` (Debian / Ubuntu) hoặc `dnf` (RHEL); cập nhật bảo mật tự động (`unattended-upgrades`) nhưng kernel cần reboot mới có hiệu lực; pin phiên bản các gói quan trọng.",
        "**Lập lịch**: `cron` (5 trường, `crontab -e`) hoặc **systemd timer** (log nằm trong journal, `Persistent=true` chạy bù khi máy tắt).",
        "**Đồng bộ thời gian** (`chrony` / `systemd-timesyncd`): giờ lệch làm TLS, token, log và cron hỏng theo cách rất khó đoán.",
        "**Giới hạn file descriptor**: `ulimit -n` mặc định thấp là nguyên nhân kinh điển của lỗi ‘too many open files’ ở service mạng; trong systemd đặt `LimitNOFILE=`."
      ],
      lenh: [
        ["ls -l / stat <file> / namei -l <path>", "Quyền + chủ sở hữu, và quyền của từng thư mục trên đường dẫn"],
        ["id <user>; groups <user>", "UID / GID và nhóm của user"],
        ["sudo -l -U <user>", "User được sudo những gì"],
        ["df -hT; df -i", "Dung lượng, kiểu filesystem, inode"],
        ["lsblk -f", "Ổ đĩa, filesystem, điểm mount"],
        ["du -xh --max-depth=1 / 2>/dev/null | sort -h", "Thư mục nào chiếm đĩa (`-x` không đi qua mount khác)"],
        ["lsof +L1", "File đã xoá nhưng process còn giữ"],
        ["free -h; vmstat 1 5", "RAM `available`, swap in/out"],
        ["journalctl -k | grep -i 'out of memory'", "Dấu vết OOM killer"],
        ["timedatectl status", "Giờ hệ thống và trạng thái đồng bộ"]
      ],
      bay: "Xoá file log đang bị process ghi thay vì truncate / logrotate: đĩa không được giải phóng cho tới khi process đóng file → ‘`df` đầy mà `du` thấp’.",
      cv: "Dịch vụ tự quản của bạn chạy thẳng trên host Linux — hãy sẵn sàng nói về chính host đó: distro nào, ai vá và khi nào, đĩa và log xoay vòng ra sao, và **điều gì xảy ra nếu host chết** (xem P5 trong ngân hàng)."
    },

    /* ---------------------------------------------------------- */
    {
      id: "linux-troubleshoot", ten: "Troubleshooting theo từng loại tài nguyên",
      y: [
        "**Phương pháp USE** cho mỗi tài nguyên (CPU, memory, disk, network): *Utilization* (bận bao nhiêu), *Saturation* (hàng đợi / chờ), *Errors*. Đi theo thứ tự cố định thay vì đoán.",
        "**Load average** trên Linux tính cả process ở trạng thái **D** (chờ I/O) nên load cao *không* đồng nghĩa CPU cao. Phân biệt bằng `top`: `%us` (user), `%sy` (kernel), `%wa` (I/O wait).",
        "**CPU cao**: `top` / `htop`, `pidstat 1`, `ps aux --sort=-%cpu`. **I/O wait cao**: `iostat -xz 1` (cột `%util`, `await`), `iotop`. **RAM**: `free -h`, `vmstat 1`, `ps aux --sort=-%mem`, kiểm tra OOM trong `dmesg`.",
        "**Mạng**: `ss -tulpn` (cổng nào đang listen, process nào), `ss -s`, `ip -s link` (lỗi / drop), `ping` / `mtr` (mất gói, độ trễ), `dig` (DNS), `curl -v` (HTTP), `tcpdump -nn -i any port 443` khi cần bắt gói.",
        "**‘Service A không gọi được service B’**: đi từ dưới lên và xác định packet dừng ở đâu — DNS (`dig`) → L3 (`ping`, `traceroute`) → L4 (`nc -zv host port`) → L7 (`curl -v`); song song kiểm tra firewall (`iptables -L -n` hoặc `nft list ruleset`, security group).",
        "**Log**: `journalctl -u <svc> -b --since '1 hour ago'`, `-p err`, `-f`; log ứng dụng trong `/var/log/…`; luôn đối chiếu **mốc thời gian** với lần deploy / thay đổi gần nhất.",
        "**Process treo**: `strace -p <pid>` (đang gọi syscall gì), `lsof -p <pid>` (đang mở gì), `cat /proc/<pid>/limits`; dùng `kill -TERM` trước, `-KILL` sau cùng.",
        "**‘Chạy tay thì được, khởi động bằng systemd thì lỗi’**: khác biến môi trường, `WorkingDirectory`, user chạy, và thứ tự khởi động (`After=network-online.target`)."
      ],
      lenh: [
        ["uptime; top -bn1 | head -15", "Load average + các process đứng đầu"],
        ["pidstat 1 5", "CPU theo từng process"],
        ["iostat -xz 1 5", "I/O từng thiết bị: `%util`, `await`"],
        ["ss -tulpn", "Cổng đang listen và process sở hữu"],
        ["ss -tan state established | wc -l", "Số kết nối đang mở"],
        ["mtr -rwc 20 <host>", "Đường đi, mất gói và độ trễ từng chặng"],
        ["nc -zv <host> <port>", "Cổng có mở không (L4)"],
        ["tcpdump -nn -i any port 8080 -c 50", "Bắt gói để xác định có traffic hay không"],
        ["strace -f -p <pid> -e trace=network", "Syscall mạng của process đang treo"],
        ["lsof -i :80", "Ai đang giữ cổng 80"]
      ],
      bay: "Kết luận ‘load cao = CPU cao’ rồi thêm core, trong khi nút thắt thật là I/O. Luôn tách `%us`, `%sy`, `%wa` trước khi hành động.",
      cv: "‘Triaging… through to root cause’: người phỏng vấn hay đưa một tình huống (đầy đĩa, load cao, service không lên). Luyện nói to quy trình theo thứ tự lệnh và nói ra **điều bạn loại trừ** ở mỗi bước. Xem L1, L2, L5, N3 trong ngân hàng."
    },

    /* ---------------------------------------------------------- */
    {
      id: "systemd", ten: "systemd",
      y: [
        "**systemd là init system và bộ quản lý dịch vụ cấp OS**: quản lý dependency (`After=`, `Requires=`, `Wants=`), cgroup (giới hạn tài nguyên), log (journald), socket activation, timer. Khác process manager tầng ứng dụng (PM2, supervisor) vốn chỉ lo vòng đời process.",
        "**Unit file** có ba khối: `[Unit]` (mô tả, thứ tự / phụ thuộc), `[Service]` (cách chạy: `ExecStart`, `User`, `WorkingDirectory`, `EnvironmentFile`, `Restart`), `[Install]` (`WantedBy=multi-user.target` để `enable`). Sửa xong phải `systemctl daemon-reload`.",
        "**`After=` chỉ quy định *thứ tự*, `Requires=` / `Wants=` quy định *phụ thuộc*** — thường cần cả hai. Cần có IP thật thì dùng `After=network-online.target` (kèm `Wants=network-online.target`), không phải `network.target`.",
        "**`Restart=`**: `on-failure` (thoát lỗi hoặc bị kill) hoặc `always`; kèm `RestartSec=` và giới hạn `StartLimitBurst` / `StartLimitIntervalSec` để tránh vòng restart vô hạn.",
        "**`Type=`**: `simple` (mặc định, process chính chạy foreground), `forking` (daemon tự fork), `oneshot` (chạy xong là hết, hợp script), `notify` (app báo ‘sẵn sàng’ qua `sd_notify`).",
        "**Biến môi trường**: shell của bạn có sẵn nhưng systemd thì không → khai `Environment=` hoặc `EnvironmentFile=` (file quyền 600). Đây là nguyên nhân số một của ‘chạy tay được, qua systemd thì lỗi’.",
        "**Giới hạn và hardening qua cgroup / sandbox**: `MemoryMax=`, `CPUQuota=`, `LimitNOFILE=`, `NoNewPrivileges=yes`, `ProtectSystem=strict`, `PrivateTmp=yes`, `ReadWritePaths=` — thêm một lớp bảo vệ gần như miễn phí.",
        "**Graceful stop**: systemd gửi SIGTERM rồi đợi `TimeoutStopSec=` (mặc định ~90s) trước khi SIGKILL; app cần xử lý SIGTERM.",
        "**Timer** thay cron: `OnCalendar=`, `Persistent=true` (chạy bù khi máy tắt), log trong journal, xem bằng `systemctl list-timers`.",
        "**journald**: log nhị phân, lọc theo unit / thời gian / mức độ. Mặc định có thể chỉ lưu trong RAM — bật lưu bền (`/var/log/journal`) và giới hạn dung lượng (`SystemMaxUse=`).",
        "**Container**: Docker là unit `docker.service`; còn container trong Compose / Kubernetes thì restart policy do Docker / orchestrator quản — không chồng supervisor bên trong container (một container một process)."
      ],
      ma: {
        ten: "Unit file mẫu cho một dịch vụ",
        noi: [
          "# /etc/systemd/system/app.service",
          "[Unit]",
          "Description=Example app",
          "After=network-online.target",
          "Wants=network-online.target",
          "",
          "[Service]",
          "User=app",
          "WorkingDirectory=/opt/app",
          "EnvironmentFile=/etc/app/app.env",
          "ExecStart=/opt/app/bin/server",
          "Restart=on-failure",
          "RestartSec=3",
          "LimitNOFILE=65536",
          "NoNewPrivileges=yes",
          "ProtectSystem=strict",
          "ReadWritePaths=/var/lib/app",
          "PrivateTmp=yes",
          "",
          "[Install]",
          "WantedBy=multi-user.target"
        ]
      },
      lenh: [
        ["systemctl status app", "Trạng thái, vài dòng log cuối, lý do lần chết gần nhất"],
        ["systemctl enable --now app", "Bật khi boot và chạy luôn"],
        ["systemctl daemon-reload", "Nạp lại sau khi sửa unit"],
        ["systemctl edit app", "Ghi đè cấu hình bằng drop-in, không sửa file gốc"],
        ["systemctl cat app", "Xem unit cuối cùng sau khi gộp drop-in"],
        ["systemctl list-units --failed", "Dịch vụ nào đang lỗi"],
        ["journalctl -u app -b -f", "Log của dịch vụ từ lần boot này, theo dõi trực tiếp"],
        ["journalctl -u app --since '1 hour ago' -p err", "Chỉ lỗi trong 1 giờ qua"],
        ["systemd-analyze blame", "Khởi động chậm vì unit nào"],
        ["journalctl --disk-usage; journalctl --vacuum-time=7d", "Xem và dọn dung lượng journal"]
      ],
      bay: "Khi ‘start tay được nhưng fail lúc boot’, nguyên nhân hay bị bỏ sót là biến môi trường, `WorkingDirectory` và `After=network-online.target`. Đọc `journalctl -u <svc> -b` trước khi đoán.",
      cv: "CV ghi **systemd** trong Skills. Mang theo một unit file thật bạn từng viết hoặc quản lý, và nói được: `Restart=` chọn gì và vì sao, khác gì PM2 / supervisor (xem L3 trong ngân hàng)."
    },

    /* ---------------------------------------------------------- */
    {
      id: "nginx", ten: "Nginx — reverse proxy, TLS termination",
      y: [
        "**Vai trò trong CV**: *TLS-terminating reverse proxy* — Nginx giữ chứng chỉ và giải mã HTTPS, rồi `proxy_pass` HTTP thường vào container ở `127.0.0.1:<cổng>`. Lợi ích: một chỗ quản lý TLS, ẩn topology bên trong, thêm header, giới hạn tốc độ, nén, cache.",
        "**Header proxy cần truyền**: `Host $host`, `X-Forwarded-For $proxy_add_x_forwarded_for`, `X-Forwarded-Proto $scheme`, `X-Real-IP $remote_addr`. Ứng dụng phía sau phải **tin proxy** (vd Express `trust proxy`) thì mới thấy IP và scheme thật.",
        "**`proxy_pass` có hay không dấu `/` cuối** cho kết quả khác nhau: `proxy_pass http://app;` giữ nguyên URI gốc, còn `proxy_pass http://app/;` thay phần khớp của `location` bằng `/`. Lỗi hay gặp khi route theo tiền tố.",
        "**Thứ tự chọn `location`**: khớp chính xác `=` → tiền tố `^~` → regex `~` / `~*` (khớp đầu tiên theo thứ tự trong file) → tiền tố dài nhất.",
        "**TLS**: `listen 443 ssl;`, `ssl_protocols TLSv1.2 TLSv1.3`, HSTS (`Strict-Transport-Security`), chuyển hướng 80 → 443. Chứng chỉ Let’s Encrypt cấp bằng `certbot` (timer tự gia hạn; **reload Nginx sau khi gia hạn**), kiểm tra bằng `certbot renew --dry-run`.",
        "**WebSocket / SSE**: WebSocket cần `proxy_http_version 1.1` + header `Upgrade` / `Connection`; stream (SSE, LLM trả lời dần) cần `proxy_buffering off` và `proxy_read_timeout` đủ dài.",
        "**Mã lỗi hay gặp**: **502** (upstream từ chối hoặc chết — app chưa lên, sai cổng), **504** (upstream chậm quá `proxy_read_timeout`), **413** (body vượt `client_max_body_size`), **499** (client đóng kết nối trước).",
        "**Vận hành**: `nginx -t` **trước khi** `systemctl reload nginx` (reload êm: worker mới nhận kết nối mới, worker cũ xong việc mới thoát; `restart` thì cắt kết nối). Thêm `$request_time`, `$upstream_response_time` vào `log_format` để biết chậm ở đâu.",
        "**Giới hạn và bảo vệ**: `limit_req` / `limit_conn` chống spam, `server_tokens off`, chặn truy cập trực tiếp bằng IP, `client_max_body_size` hợp lý.",
        "**Sau Nginx là Docker**: publish cổng container ở `127.0.0.1` để **chỉ Nginx** gọi được; bind `0.0.0.0` thì ai cũng vượt qua Nginx (và cả firewall) để gọi thẳng container."
      ],
      ma: {
        ten: "Nginx reverse proxy + TLS cho một container",
        noi: [
          "server {",
          "  listen 80;",
          "  server_name app.example.com;",
          "  return 301 https://$host$request_uri;",
          "}",
          "",
          "server {",
          "  listen 443 ssl;",
          "  http2 on;",
          "  server_name app.example.com;",
          "",
          "  ssl_certificate     /etc/letsencrypt/live/app.example.com/fullchain.pem;",
          "  ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;",
          "  ssl_protocols TLSv1.2 TLSv1.3;",
          '  add_header Strict-Transport-Security "max-age=31536000" always;',
          "  client_max_body_size 10m;",
          "  server_tokens off;",
          "",
          "  location / {",
          "    proxy_pass http://127.0.0.1:8080;",
          "    proxy_set_header Host              $host;",
          "    proxy_set_header X-Real-IP         $remote_addr;",
          "    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;",
          "    proxy_set_header X-Forwarded-Proto $scheme;",
          "    proxy_read_timeout 60s;",
          "  }",
          "}"
        ]
      },
      lenh: [
        ["nginx -t", "Kiểm tra cú pháp cấu hình"],
        ["nginx -T | less", "In toàn bộ cấu hình sau khi gộp include"],
        ["systemctl reload nginx", "Nạp lại êm — không cắt kết nối đang chạy"],
        ["curl -I https://app.example.com", "Header phản hồi; kiểm tra redirect, HSTS"],
        ["curl -vk --resolve app.example.com:443:127.0.0.1 https://app.example.com/", "Thử vhost cục bộ với SNI / Host đúng"],
        ["openssl s_client -connect app.example.com:443 -servername app.example.com", "Xem chuỗi chứng chỉ và hạn dùng"],
        ["certbot renew --dry-run", "Thử gia hạn mà không áp dụng"],
        ["tail -f /var/log/nginx/error.log", "Lỗi upstream, quyền, cấu hình"]
      ],
      bay: "Sửa cấu hình rồi `reload` mà không `nginx -t` trước: cấu hình lỗi làm reload thất bại (Nginx cũ vẫn chạy) hoặc, nếu `restart`, làm cả site sập.",
      cv: "‘Served behind Nginx as a TLS-terminating reverse proxy’: sẵn sàng vẽ đường đi của request (client → Nginx → container) và nói: chứng chỉ cấp / gia hạn thế nào, header nào truyền xuống, cổng container bind ở đâu, và 502 / 504 báo hiệu điều gì."
    },

    /* ---------------------------------------------------------- */
    {
      id: "ssh-host", ten: "Bảo mật host và deploy qua SSH",
      y: [
        "**Ba lớp danh tính khi deploy qua SSH**: *người dùng* trên host (user `ci` quyền tối thiểu), *khoá* (SSH key riêng cho CI, không dùng chung với người), và *host* (xác thực server bằng host key).",
        "**Pin host key thay vì trust-on-first-use**: `StrictHostKeyChecking=no` (hoặc chạy `ssh-keyscan` ngay trong job rồi tin luôn) khiến CI chấp nhận **bất kỳ** máy nào trả lời ở địa chỉ đó → mở đường cho man-in-the-middle và gửi secret deploy cho kẻ tấn công. Lấy host key **một lần, xác minh vân tay ngoài băng tần**, lưu dòng `known_hosts` vào biến của repo, ghi vào `~/.ssh/known_hosts` trong job, đặt `StrictHostKeyChecking=yes`.",
        "**User `ci` least-privilege**: không có sudo toàn quyền; nếu cần quyền thì `sudoers` chỉ cho **đúng một script**; có thể giới hạn thêm trong `authorized_keys` bằng `restrict`, `command=\"…\"`, `from=\"<IP>\"`.",
        "**Cẩn thận nhóm `docker`**: user thuộc nhóm `docker` **tương đương root** (chỉ cần mount `/` vào container). ‘Least privilege’ mà cho vào nhóm docker thì chỉ còn là cái tên — giảm rủi ro bằng forced command, sudo wrapper, hoặc Docker rootless.",
        "**`sshd_config`**: `PasswordAuthentication no`, `PermitRootLogin no`, `PubkeyAuthentication yes`, `AllowUsers` / `AllowGroups`, `MaxAuthTries`; đổi cổng chỉ giảm nhiễu chứ không phải bảo mật. Thêm `fail2ban`.",
        "**Firewall**: mặc định chặn inbound, chỉ mở 22 (giới hạn IP nếu được), 80, 443 (`ufw` / `nftables`). **Docker publish cổng sẽ vượt qua `ufw`** → bind `127.0.0.1` hoặc dùng chain `DOCKER-USER`.",
        "**Vá lỗi và giám sát**: `unattended-upgrades`, cảnh báo khi cần reboot, log đăng nhập (`/var/log/auth.log`, `journalctl -u ssh`), đẩy log ra ngoài host để kẻ tấn công không xoá được dấu vết.",
        "**Deploy như một giao dịch có kết thúc rõ**: ghi lại version đang chạy → `compose up --wait` + health check retry → xanh thì xong, đỏ thì rollback về version đã ghi."
      ],
      ma: [
        {
          ten: "Trong job CI: ghi host key đã xác minh rồi kết nối nghiêm ngặt",
          noi: [
            "mkdir -p ~/.ssh && chmod 700 ~/.ssh",
            "printf '%s\\n' \"$SSH_KNOWN_HOSTS\" > ~/.ssh/known_hosts      # biến chứa dòng known_hosts ĐÃ xác minh vân tay",
            "ssh -o StrictHostKeyChecking=yes -o BatchMode=yes -i \"$KEY_FILE\" ci@app.example.com '/usr/local/bin/deploy.sh v1.4.2'"
          ]
        },
        {
          ten: "Trên server: user ci chỉ được chạy đúng một script",
          noi: [
            "# /etc/sudoers.d/ci   (sửa bằng: visudo -f /etc/sudoers.d/ci)",
            "ci ALL=(root) NOPASSWD: /usr/local/bin/deploy.sh"
          ]
        }
      ],
      lenh: [
        ["ssh-keyscan -t ed25519 <host>", "Lấy host key công khai (rồi PHẢI đối chiếu vân tay trước khi tin)"],
        ["ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub", "Vân tay host key — chạy trên server để so"],
        ["sshd -T | grep -Ei 'passwordauth|permitroot'", "Cấu hình sshd đang hiệu lực"],
        ["last -a | head; journalctl -u ssh --since today", "Ai đã đăng nhập gần đây"],
        ["ufw status verbose", "Firewall đang mở gì"],
        ["getent group docker", "Ai thuộc nhóm docker (= quyền root)"],
        ["visudo -f /etc/sudoers.d/ci", "Sửa sudoers an toàn, có kiểm tra cú pháp"]
      ],
      bay: "`StrictHostKeyChecking=no`, hoặc `ssh-keyscan` rồi tin ngay trong pipeline: đó chính là trust-on-first-use lặp lại ở **mỗi lần chạy**.",
      cv: "‘Least-privilege `ci` user with the host key pinned in the workflow rather than trusted on first use’ — hãy **chủ động kể** chi tiết này (xem P4 trong ngân hàng). Chuẩn bị luôn câu phản biện: `ci` có thuộc nhóm docker không, và bạn đánh giá rủi ro đó thế nào."
    },

    /* ---------------------------------------------------------- */
    {
      id: "proxmox", ten: "Proxmox VE — VM và LXC",
      y: [
        "**Proxmox VE** là nền tảng ảo hoá mã nguồn mở trên Debian, gom **KVM (VM)** và **LXC (container)** dưới một giao diện web + API, kèm lưu trữ, mạng, backup và cluster.",
        "**VM (KVM / QEMU)**: kernel riêng, cách ly mạnh, chạy được mọi hệ điều hành. **LXC**: dùng chung kernel của host, rất nhẹ và khởi động trong vài giây, chỉ Linux, cách ly yếu hơn (nên dùng *unprivileged container*).",
        "**Chọn thế nào**: cần kernel / OS riêng, chạy Docker hoặc Kubernetes, yêu cầu cách ly cao → **VM**; dịch vụ Linux đơn giản, cần tiết kiệm tài nguyên → **LXC**. Tài liệu Proxmox khuyến nghị chạy **Docker trong VM** (Docker trong LXC cần bật `nesting` và đánh đổi về bảo mật).",
        "**Lưu trữ**: `local` (thư mục), `LVM-thin`, **ZFS** (snapshot, checksum, replication), **Ceph** (phân tán, cần ≥ 3 node), NFS. Chọn theo nhu cầu snapshot và HA.",
        "**Mạng**: Linux bridge (`vmbr0`) nối VM / LXC ra mạng vật lý; bridge VLAN-aware để tách VLAN; NAT hoặc routed cho môi trường lab; firewall ở cấp datacenter / node / VM.",
        "**Snapshot ≠ backup**: snapshot nằm chung kho với đĩa, mất đĩa là mất cả hai. **Backup** dùng `vzdump` (chế độ snapshot / suspend / stop) ra kho khác; **Proxmox Backup Server (PBS)** cho backup incremental, dedup, mã hoá; phải **restore thử** định kỳ.",
        "**Template + clone + cloud-init** để dựng VM nhất quán và nhanh (kết hợp IaC hoặc script).",
        "**Cluster**: nhiều node quản lý chung (corosync), cần **quorum** (đa số node; cụm 2 node cần QDevice). **HA** tự khởi động lại VM trên node khác khi node chết — cần lưu trữ dùng chung hoặc replication. **Live migration** chuyển VM đang chạy giữa các node.",
        "**Overcommit**: cấp tổng vCPU / RAM vượt mức vật lý — CPU thường chấp nhận được, RAM thì nguy hiểm (ballooning, swap, OOM trên host). Theo dõi tài nguyên của host chứ không chỉ trong guest.",
        "**Vận hành**: nâng cấp Proxmox theo quy trình (từng node, di chuyển VM trước), backup cấu hình `/etc/pve`, giám sát ổ đĩa (SMART), nhiệt độ, nguồn."
      ],
      bang: {
        ten: "VM và LXC",
        cot: ["", "VM (KVM)", "Container (LXC)"],
        hang: [
          ["Kernel", "Riêng của mỗi VM", "Dùng chung kernel host"],
          ["Hệ điều hành", "Mọi hệ điều hành", "Chỉ Linux"],
          ["Cách ly", "Mạnh", "Yếu hơn (nên dùng unprivileged)"],
          ["Tài nguyên", "Nặng hơn — RAM cấp cho guest OS", "Rất nhẹ, khởi động vài giây"],
          ["Docker / Kubernetes bên trong", "Phù hợp, được khuyến nghị", "Làm được nhưng cần `nesting`, đánh đổi bảo mật"],
          ["Live migration", "Có (cần lưu trữ dùng chung)", "Không — chỉ migrate kiểu restart"]
        ]
      },
      lenh: [
        ["qm list; qm status <vmid>", "Liệt kê VM / xem trạng thái"],
        ["qm start | shutdown | stop <vmid>", "Bật / tắt êm / tắt cứng VM"],
        ["qm snapshot <vmid> <tên>", "Snapshot VM"],
        ["pct list; pct enter <ctid>", "Liệt kê LXC / vào trong container"],
        ["vzdump <vmid> --mode snapshot --storage <kho>", "Backup một VM hoặc container"],
        ["pvecm status", "Trạng thái cluster và quorum"],
        ["pvesm status", "Các kho lưu trữ và dung lượng"],
        ["pveversion -v", "Phiên bản Proxmox đang chạy"]
      ],
      bay: "Coi snapshot là backup, hoặc có backup nhưng chưa bao giờ thử restore. Backup chưa restore thử thì chưa phải backup.",
      cv: "**Proxmox (VM/LXC)** nằm trong dòng Skills ‘Linux, Virtualization & On-Premises’. Chuẩn bị nói thật: bạn dùng Proxmox vào việc gì, bao nhiêu node, lưu trữ gì, backup thế nào — và đừng nói quá phần cluster / HA nếu bạn chưa từng vận hành."
    }
  ]
};
