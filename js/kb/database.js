/* ============================================================
   Trang 7 — Databases
   Dòng Skills trong CV: PostgreSQL, MySQL, MongoDB, Redis
   Cấu trúc dữ liệu: xem chú thích đầu js/kb.js
   ============================================================ */

const TRANG = {
  id: "database",
  ten: "Databases",
  tomTat: "Bốn hệ trong dòng Skills nhưng **trọng tâm ở PostgreSQL** (Aurora + Liquibase, migration có gate) và Redis (ElastiCache). Kiến thức ở mức *người vận hành*: kết nối, chẩn đoán chậm, migration an toàn, backup / HA — kèm bảng so sánh bốn hệ để trả lời các câu ‘A khác B thế nào’.",
  cvSkill: ["PostgreSQL", "MySQL", "MongoDB", "Redis"],

  cv: [
    { nguon: "Skills",
      noi: "Databases: PostgreSQL, MySQL, MongoDB, Redis" },
    { nguon: "ERC Booking · Hạ tầng",
      noi: "…22 reusable modules (VPC, ECS Fargate, Aurora PostgreSQL, ElastiCache, CloudFront + WAF, SQS, SES, Backup, Bastion)." },
    { nguon: "ERC Booking · Migration",
      noi: "Engineered a branch-gated Liquibase migration pipeline that runs as a one-off ECS Fargate task per environment and auto-generates CloudWatch Logs links for failure triage." },
    { nguon: "Professional Summary",
      noi: "…with zero-downtime container rollouts and gated database migrations…" },
    { nguon: "Software Intern · Gitman",
      noi: "Built Gitman, an internal Git repository management tool, from the first commit through to company-wide release — Vue.js and TypeScript interface over a Nest.js and MongoDB API — owning it end to end as the sole developer." }
  ],

  bank: ["Database", "Backup & DR"],

  muc: [
    /* ---------------------------------------------------------- */
    {
      id: "postgres", ten: "PostgreSQL",
      y: [
        "**Kiến trúc ngắn gọn**: mỗi kết nối là một process (tốn RAM → dùng pool); mọi thay đổi ghi vào **WAL** trước khi vào file dữ liệu; `shared_buffers` là cache của PostgreSQL (cộng với page cache của OS).",
        "**MVCC**: đọc không chặn ghi; bản ghi cũ để lại thành ‘dead tuple’ nên cần **VACUUM / autovacuum** dọn; bảng bị *bloat* khi autovacuum không theo kịp. **Giao dịch treo lâu** (`idle in transaction`) giữ vacuum lại → bloat và về lâu dài nguy hiểm (transaction ID wraparound).",
        "**Index**: B-tree (mặc định), GIN (JSONB, full-text, mảng), partial và covering index; `CREATE INDEX CONCURRENTLY` để không khoá ghi (không chạy được trong transaction). Index làm chậm ghi — đo trước khi thêm.",
        "**`EXPLAIN (ANALYZE, BUFFERS)`** cho **plan thật**: Seq Scan hay Index Scan, số hàng ước lượng so với thực tế (lệch nhiều = thống kê cũ → `ANALYZE`).",
        "**Quan sát**: `pg_stat_activity` (ai đang chạy gì, đang chờ gì), `pg_stat_statements` (query tốn nhất), `pg_blocking_pids()` (ai chặn ai), `pg_stat_user_tables` (dead tuple, lần autovacuum cuối).",
        "**Kết nối**: `max_connections` mặc định 100; mỗi kết nối tốn RAM → dùng **PgBouncer** (hoặc RDS Proxy). *Transaction pooling* hiệu quả nhất nhưng không giữ được trạng thái phiên (`SET` cấp session, advisory lock, một số prepared statement).",
        "**Replication**: *streaming* (vật lý, replica đọc được, lag xem ở `pg_stat_replication`); *logical* (theo bảng, dùng cho nâng cấp phiên bản hoặc đồng bộ chọn lọc). Aurora PostgreSQL thay tầng storage nên replica dùng chung storage — không có WAL shipping như PostgreSQL thường.",
        "**Backup**: *logical* `pg_dump` (portable, chậm, hợp DB nhỏ hoặc migration); *physical* `pg_basebackup` + **WAL archiving** → **PITR**; RDS / Aurora có automated backup + PITR. Backup chưa restore thử chưa phải backup.",
        "**Bảo mật**: `pg_hba.conf` (ai kết nối từ đâu, bằng cách nào), role với quyền tối thiểu (app không dùng superuser), bắt buộc TLS, không mở cổng 5432 ra internet.",
        "**DDL có transaction** (lợi thế so với MySQL): `BEGIN; ALTER …; ROLLBACK;` hoàn tác được — hữu ích khi viết migration; riêng `CREATE INDEX CONCURRENTLY` và `VACUUM` không chạy trong transaction."
      ],
      ma: {
        ten: "Bốn truy vấn chẩn đoán dùng hằng ngày",
        noi: [
          "-- Đang chạy gì, bao lâu, chờ gì",
          "SELECT pid, now() - query_start AS running, state, wait_event_type, wait_event, left(query, 80) AS query",
          "FROM pg_stat_activity WHERE state <> 'idle' ORDER BY running DESC;",
          "",
          "-- Ai đang chặn ai",
          "SELECT blocked.pid AS blocked_pid, blocking.pid AS blocking_pid, left(blocking.query, 60) AS blocking_query",
          "FROM pg_stat_activity blocked",
          "JOIN LATERAL unnest(pg_blocking_pids(blocked.pid)) AS b(pid) ON true",
          "JOIN pg_stat_activity blocking ON blocking.pid = b.pid;",
          "",
          "-- Query tốn nhất (cần extension pg_stat_statements)",
          "SELECT calls, round(total_exec_time) AS total_ms, round(mean_exec_time) AS mean_ms, left(query, 80) AS query",
          "FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;",
          "",
          "-- Bảng nào lớn nhất",
          "SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) AS size",
          "FROM pg_stat_user_tables ORDER BY pg_total_relation_size(relid) DESC LIMIT 10;"
        ]
      },
      lenh: [
        ['psql "host=<h> dbname=<d> user=<u> sslmode=require"', "Kết nối có TLS"],
        ["\\l   \\dt   \\d+ <bảng>   \\x", "Meta-command trong psql: danh sách DB, bảng, mô tả bảng, hiển thị dọc"],
        ["EXPLAIN (ANALYZE, BUFFERS) <query>;", "Plan thật + số block đọc (ANALYZE chạy query thật!)"],
        ["SELECT pg_cancel_backend(<pid>);", "Huỷ query đang chạy (nhẹ nhàng)"],
        ["SELECT pg_terminate_backend(<pid>);", "Ngắt hẳn kết nối (mạnh tay hơn)"],
        ["pg_dump -Fc -d <db> -f db.dump   /   pg_restore -j4 -d <db> db.dump", "Backup / restore logical dạng custom, restore song song"],
        ["VACUUM (ANALYZE, VERBOSE) <bảng>;", "Dọn dead tuple + cập nhật thống kê"]
      ],
      bay: [
        "`EXPLAIN ANALYZE` trên câu `UPDATE` / `DELETE` ở production: nó **chạy thật** câu lệnh đó. Bọc trong `BEGIN … ROLLBACK`.",
        "Chạy `ALTER TABLE` nặng giờ cao điểm mà không đặt `lock_timeout`: nó xếp hàng chờ khoá và chặn mọi truy vấn xếp sau nó."
      ],
      cv: "Aurora PostgreSQL + Liquibase trong ERC. Sẵn sàng nói về những thao tác bạn từng làm thật: kết nối qua đâu (private network), migration, backup / PITR, theo dõi kết nối — và nói thật phần chưa tự tay làm (vd tuning sâu). Xem DB1, DB3, DB4 trong ngân hàng."
    },

    /* ---------------------------------------------------------- */
    {
      id: "mysql", ten: "MySQL",
      y: [
        "**InnoDB** là storage engine mặc định: có transaction, khoá mức hàng, khoá ngoại; dữ liệu nằm trong **clustered index** theo khoá chính (nên khoá chính ngắn và tăng dần).",
        "**`innodb_buffer_pool_size`** là tham số quan trọng nhất (thường 60–75% RAM trên máy chuyên dụng DB); `innodb_flush_log_at_trx_commit` đánh đổi độ bền ↔ tốc độ.",
        "**Mức cô lập mặc định là `REPEATABLE READ`** (PostgreSQL mặc định `READ COMMITTED`) — khác biệt này ảnh hưởng hành vi khoá và deadlock.",
        "**Binary log (binlog)** ghi mọi thay đổi (format `ROW` / `STATEMENT` / `MIXED`), là nền cho **replication** và PITR; replica đọc binlog của nguồn. Dùng **GTID** để quản lý failover dễ hơn. Lag xem bằng `SHOW REPLICA STATUS` (`Seconds_Behind_Source`; bản cũ `SHOW SLAVE STATUS`).",
        "**Chẩn đoán chậm**: `slow_query_log` + `long_query_time`, `EXPLAIN` / `EXPLAIN ANALYZE`, `SHOW FULL PROCESSLIST`, `performance_schema` và `sys` schema; deadlock xem `SHOW ENGINE INNODB STATUS`.",
        "**DDL**: nhiều lệnh `ALTER` có *Online DDL* (`ALGORITHM=INPLACE` / `INSTANT`, `LOCK=NONE`); thay đổi lớn dùng **gh-ost** hoặc **pt-online-schema-change**. **DDL không nằm trong transaction** (tự commit) — migration lỗi giữa chừng không tự rollback như PostgreSQL.",
        "**Backup**: `mysqldump --single-transaction` (logical, nhất quán cho InnoDB mà không khoá), **Percona XtraBackup** (physical, backup nóng), binlog để PITR; RDS / Aurora MySQL có automated backup + PITR.",
        "**Bộ ký tự**: dùng `utf8mb4` (đủ emoji; `utf8` của MySQL chỉ 3 byte) và collation thống nhất để tránh lỗi so sánh và index.",
        "**Kết nối**: `max_connections` (mặc định 151), `wait_timeout`; pool phía ứng dụng, ProxySQL / RDS Proxy khi cần.",
        "**Bảo mật**: user gắn theo host + quyền tối thiểu (`GRANT` cụ thể), không dùng `root` cho ứng dụng, bind địa chỉ nội bộ, bật TLS."
      ],
      lenh: [
        ["SHOW FULL PROCESSLIST;", "Ai đang chạy gì"],
        ["SHOW ENGINE INNODB STATUS\\G", "Deadlock gần nhất, trạng thái InnoDB"],
        ["EXPLAIN ANALYZE <query>;", "Plan thật (MySQL 8.0.18+)"],
        ["SHOW REPLICA STATUS\\G", "Trạng thái replica và độ trễ (bản cũ: `SHOW SLAVE STATUS`)"],
        ["SET GLOBAL slow_query_log = 'ON'; SET GLOBAL long_query_time = 1;", "Bật slow query log (ghi vào file cấu hình để bền)"],
        ["SELECT * FROM sys.statement_analysis ORDER BY total_latency DESC LIMIT 10;", "Query tốn nhất (sys schema)"],
        ["mysqldump --single-transaction --routines --triggers <db> > db.sql", "Backup logical nhất quán cho InnoDB"]
      ],
      bay: "Giả định migration MySQL ‘tự rollback nếu lỗi’ như PostgreSQL. DDL của MySQL tự commit nên lỗi giữa chừng để lại trạng thái dở dang.",
      cv: "MySQL có trong dòng Skills Databases. Chuẩn bị nói thật mức độ: bạn dùng MySQL vào việc gì và ở đâu; sẵn sàng đối chiếu MySQL với PostgreSQL (cô lập mặc định, DDL transactional, replication) — cặp câu hỏi so sánh này rất hay gặp."
    },

    /* ---------------------------------------------------------- */
    {
      id: "mongodb", ten: "MongoDB",
      y: [
        "**Mô hình tài liệu**: document BSON trong *collection*; schema linh hoạt (vẫn cần quy ước và validation); giới hạn 16 MB mỗi document. Thiết kế theo **cách truy vấn** (embed hay reference) thay vì chuẩn hoá như SQL.",
        "**Replica set**: tối thiểu 3 thành viên (hoặc 2 + arbiter); một **primary** nhận ghi, các **secondary** sao chép qua **oplog**; primary chết → **bầu cử** secondary mới. Connection string phải liệt kê cả replica set để driver tự theo primary.",
        "**Write concern / read concern / read preference**: `w: \"majority\"` đảm bảo ghi đã tới đa số thành viên (bền khi failover); đọc từ secondary có thể thấy dữ liệu cũ (lag). Chọn theo yêu cầu nhất quán.",
        "**Index**: single, compound, multikey, TTL (tự xoá theo thời gian), text, partial. **Quy tắc ESR cho compound index**: Equality → Sort → Range.",
        "**`explain('executionStats')`**: so `totalDocsExamined` với `nReturned`; `COLLSCAN` = quét toàn collection (thiếu index), `IXSCAN` = dùng index.",
        "**Quan sát**: `db.currentOp()` / `db.killOp()`, `mongostat`, `mongotop`, profiler (`db.setProfilingLevel`), `rs.status()` (trạng thái replica set, lag), `db.serverStatus()`.",
        "**Storage engine WiredTiger**: cache nội bộ mặc định khoảng 50% (RAM − 1 GB); working set nằm vừa RAM thì nhanh, vượt RAM thì chậm hẳn.",
        "**Backup**: `mongodump` / `mongorestore` (logical; `--oplog` để nhất quán theo thời điểm), snapshot đĩa / volume (physical), Atlas hoặc Ops Manager (PITR bằng oplog).",
        "**Sharding** (mở rộng ngang theo shard key): chọn shard key sai gây *hot shard*; chỉ cần khi một replica set không đủ.",
        "**Bảo mật**: bật authentication + RBAC, TLS, `bindIp` nội bộ, **không bao giờ mở cổng 27017 ra internet** (nhiều vụ mất dữ liệu / tống tiền do MongoDB mở không mật khẩu)."
      ],
      lenh: [
        ['mongosh "mongodb://<user>@<h1>,<h2>,<h3>/<db>?replicaSet=<rs>&tls=true"', "Kết nối replica set"],
        ["rs.status()", "Trạng thái replica set: ai là primary, độ trễ"],
        ["db.collection.find({ ... }).explain('executionStats')", "Plan thật và số document đã quét"],
        ["db.collection.createIndex({ a: 1, b: -1 })", "Tạo index — làm ngoài giờ cao điểm trên collection lớn"],
        ["db.currentOp({ secs_running: { $gt: 5 } })", "Thao tác đang chạy quá 5 giây"],
        ["mongodump --uri=<uri> --oplog --gzip --out <dir>", "Backup logical nhất quán theo thời điểm (replica set)"],
        ["mongostat 2", "Thống kê thao tác mỗi 2 giây"]
      ],
      bay: "Tin rằng ‘MongoDB không cần thiết kế schema’: thiếu quy ước và index thì document phình to, truy vấn quét toàn collection.",
      cv: "CV có **MongoDB** (Gitman: Nest.js + MongoDB API, bạn làm một mình từ commit đầu). Chuẩn bị nói: dữ liệu mô hình thế nào, index nào, chạy ở đâu, backup ra sao — đủ để chứng minh đã dùng thật dù không phải mảng chính của vị trí DevOps."
    },

    /* ---------------------------------------------------------- */
    {
      id: "redis", ten: "Redis (và ElastiCache)",
      y: [
        "**Redis là kho dữ liệu trong RAM**, xử lý lệnh chủ yếu **đơn luồng** → một lệnh chậm (`KEYS *`, đọc nguyên một set khổng lồ) chặn mọi client khác.",
        "**Kiểu dữ liệu**: string, hash, list, set, sorted set, stream, bitmap, HyperLogLog… Chọn đúng kiểu quyết định hiệu năng (bảng xếp hạng = sorted set, hàng đợi nhẹ = list / stream).",
        "**Mẫu dùng hay gặp**: *cache-aside* (đọc cache, miss thì đọc DB rồi ghi cache), session store, rate limiting (`INCR` + `EXPIRE`), khoá phân tán (`SET key val NX PX`), queue / pub-sub.",
        "**Persistence**: **RDB** (snapshot định kỳ — nhỏ, restore nhanh, có thể mất dữ liệu từ lần snapshot cuối) và **AOF** (ghi mọi lệnh, `appendfsync everysec` là cân bằng, mất tối đa ~1 giây); có thể bật cả hai. Chỉ dùng làm cache thì có thể tắt persistence.",
        "**Eviction** khi đầy (`maxmemory` + `maxmemory-policy`): `noeviction` (ghi báo lỗi), `allkeys-lru` / `allkeys-lfu` (cache thuần), `volatile-lru` / `volatile-ttl` (chỉ xoá key có TTL). Sai policy → hoặc lỗi ghi hàng loạt, hoặc mất key quan trọng.",
        "**TTL**: luôn đặt cho dữ liệu cache; thêm *jitter* ngẫu nhiên để tránh hàng loạt key hết hạn cùng lúc gây **cache stampede** (thundering herd) dội vào database.",
        "**Replication** bất đồng bộ nên failover có thể **mất các ghi chưa kịp sao chép**. **Sentinel** (HA cho một primary) hoặc **Cluster** (shard theo 16384 hash slot); trên AWS dùng ElastiCache replication group + Multi-AZ.",
        "**Quan sát**: `INFO memory` / `INFO stats` (hit rate = `keyspace_hits / (hits + misses)`), `SLOWLOG GET`, `--bigkeys`, `LATENCY DOCTOR`, `evicted_keys`.",
        "**Bảo mật**: mật khẩu / ACL, TLS, không mở cổng 6379 ra internet, chặn lệnh nguy hiểm (`FLUSHALL`, `CONFIG`) bằng ACL.",
        "**Bộ nhớ**: cần dư RAM cho `fork` khi snapshot (copy-on-write); theo dõi `mem_fragmentation_ratio`; key khổng lồ gây trễ khi xoá — dùng `UNLINK` (xoá bất đồng bộ)."
      ],
      lenh: [
        ["redis-cli -h <h> --tls PING", "Kiểm tra kết nối (truyền mật khẩu qua biến `REDISCLI_AUTH`, đừng gõ thẳng trên command line)"],
        ["redis-cli INFO memory | grep -E 'used_memory_human|maxmemory_human|mem_fragmentation_ratio'", "RAM đã dùng, trần, độ phân mảnh"],
        ["redis-cli INFO stats | grep -E 'keyspace_(hits|misses)|evicted_keys'", "Hit rate và số key bị evict"],
        ["redis-cli SLOWLOG GET 10", "10 lệnh chậm gần nhất"],
        ["redis-cli --bigkeys", "Tìm key lớn (dùng SCAN, ít chặn hơn KEYS)"],
        ["redis-cli --scan --pattern 'session:*' | head", "Duyệt key theo pattern bằng SCAN (không dùng `KEYS *` ở production)"],
        ["redis-cli TTL <key>", "TTL còn lại (-1: không có TTL, -2: không tồn tại)"],
        ["redis-cli UNLINK <key>", "Xoá key lớn mà không chặn"]
      ],
      bay: [
        "Chạy `KEYS *` hoặc `MONITOR` trên production: chặn hoặc làm chậm Redis nghiêm trọng.",
        "Coi Redis là nơi lưu duy nhất của dữ liệu quan trọng khi chưa cấu hình persistence và backup."
      ],
      cv: "ElastiCache (Redis) nằm trong Terraform của bạn. Sẵn sàng: replication group + Multi-AZ, eviction policy đang dùng, dữ liệu nào đặt trong Redis (cache hay phải bền), và ứng dụng ra sao khi failover."
    },

    /* ---------------------------------------------------------- */
    {
      id: "migration", ten: "Migration schema an toàn (mọi hệ)",
      y: [
        "**Nguyên tắc chung**: migration là *job riêng có gate*, chạy **đúng một lần** (one-off task), thay đổi **versioned** trong Git (Liquibase / Flyway), có **snapshot ngay trước** khi chạy production, và có **kế hoạch rollback** (hoặc kế hoạch ‘roll forward’ rõ ràng).",
        "**Expand–contract** cho thay đổi phá vỡ tương thích: thêm cột / bảng mới (expand) → deploy code ghi + đọc cả hai → backfill dữ liệu cũ → deploy code chỉ dùng cái mới → xoá cái cũ (contract) ở lần phát hành sau. Mỗi bước deploy độc lập và rollback code vẫn an toàn.",
        "**PostgreSQL**: `ADD COLUMN` với default hằng số nhanh (từ PG 11, không viết lại bảng); `SET NOT NULL` quét cả bảng và khoá — dùng `CHECK (…) NOT VALID` rồi `VALIDATE CONSTRAINT`; tạo index bằng `CONCURRENTLY`; **luôn đặt `lock_timeout`** để migration không xếp hàng chờ khoá và chặn mọi truy vấn phía sau.",
        "**MySQL**: dùng Online DDL (`ALGORITHM=INPLACE` / `INSTANT`, `LOCK=NONE`) khi có thể; bảng lớn dùng gh-ost / pt-online-schema-change; DDL không rollback được.",
        "**MongoDB**: ‘migration’ là script cập nhật document (theo lô, idempotent, dừng và chạy lại được); thêm index ngoài giờ cao điểm; vì schema do ứng dụng quản lý nên cần đánh số phiên bản schema trong document khi đổi cấu trúc.",
        "**Backfill dữ liệu lớn**: chia lô nhỏ (vd 1.000–10.000 dòng) có nghỉ giữa các lô, không gói trong một transaction khổng lồ, theo dõi replication lag và tải; script phải **idempotent** để chạy lại được khi bị gián đoạn.",
        "**Thử trước trên bản sao dữ liệu thật**: restore snapshot production sang môi trường tạm, chạy migration, đo thời gian và khoá — con số thật thay cho phỏng đoán.",
        "**Tách deploy schema khỏi deploy code**: schema đi trước (tương thích ngược), code theo sau — nhờ vậy `helm rollback` / rollback ECS về bản cũ vẫn chạy được với schema mới.",
        "**Fail giữa chừng**: PostgreSQL (DDL transactional) tự rollback changeSet đang chạy; MySQL hoặc dữ liệu đã commit thì cần rollback script hay restore từ snapshot. Biết điều này **trước** khi bấm chạy production."
      ],
      bang: {
        ten: "Thay đổi cấu trúc ở bốn hệ",
        cot: ["", "PostgreSQL", "MySQL (InnoDB)", "MongoDB"],
        hang: [
          ["DDL trong transaction", "Có", "Không (tự commit)", "Không có DDL kiểu SQL"],
          ["Thêm cột / trường", "Nhanh nếu default là hằng số; NOT NULL cần cẩn trọng", "Online DDL / INSTANT tuỳ phiên bản", "Không cần — cập nhật dần document"],
          ["Tạo index không chặn ghi", "`CREATE INDEX CONCURRENTLY`", "Online DDL / gh-ost", "Index build (4.2+ ít chặn hơn), nên làm ngoài giờ cao điểm"],
          ["Công cụ phổ biến", "Liquibase, Flyway", "Liquibase, Flyway, gh-ost, pt-osc", "Script riêng (migrate-mongo, Mongock…)"]
        ]
      },
      ma: {
        ten: "Mẫu migration an toàn trên bảng lớn (PostgreSQL)",
        noi: [
          "SET lock_timeout = '3s';          -- chờ khoá quá 3 giây thì fail nhanh, không chặn cả hệ thống",
          "",
          "-- 1) expand: cột mới, cho phép NULL",
          "ALTER TABLE booking ADD COLUMN status varchar(20);",
          "",
          "-- 2) backfill theo lô (chạy lặp tới khi 0 dòng được cập nhật)",
          "UPDATE booking SET status = 'PENDING'",
          "WHERE id IN (SELECT id FROM booking WHERE status IS NULL LIMIT 5000);",
          "",
          "-- 3) ép NOT NULL mà không khoá lâu",
          "ALTER TABLE booking ADD CONSTRAINT booking_status_nn CHECK (status IS NOT NULL) NOT VALID;",
          "ALTER TABLE booking VALIDATE CONSTRAINT booking_status_nn;   -- quét bảng nhưng không chặn ghi",
          "",
          "-- 4) index không chặn ghi — chạy NGOÀI transaction",
          "CREATE INDEX CONCURRENTLY idx_booking_status ON booking (status);"
        ]
      },
      bay: "Nhúng migration vào app startup, hoặc chạy tay trên production mà không snapshot và chưa thử trên dữ liệu thật — rồi giả định ‘rollback được’ khi chưa kiểm tra.",
      cv: "‘Gated database migrations’ là dấu ấn của bạn. Trả lời theo khung: gate → one-off task → snapshot → expand–contract → verify → kế hoạch rollback, kèm một con số thật (migration lớn nhất bạn chạy, mất bao lâu, có downtime không). Xem DB4, E5, KT3 trong ngân hàng."
    },

    /* ---------------------------------------------------------- */
    {
      id: "backup-ha", ten: "Backup, restore và HA",
      y: [
        "**Backup ≠ HA ≠ DR**: HA chịu lỗi *hạ tầng* (mất node / AZ); backup chịu lỗi *dữ liệu* (xoá nhầm, hỏng, ransomware); DR chịu mất *cả site / region*. Cần cả ba tuỳ yêu cầu RTO / RPO.",
        "**RPO** = chấp nhận mất bao nhiêu dữ liệu (quyết định tần suất backup và có cần PITR không); **RTO** = chấp nhận ngừng bao lâu (quyết định kiến trúc HA / DR). Đây là **quyết định kinh doanh** — DevOps đưa ra chi phí của từng mức.",
        "**Quy tắc 3-2-1**: 3 bản sao, 2 loại phương tiện, 1 bản offsite (nên có bản bất biến chống ransomware).",
        "**Restore drill định kỳ** — đo RTO thật, kiểm tra dữ liệu toàn vẹn, viết runbook restore để người khác làm được. Backup chưa restore thử thì chưa phải backup.",
        "**Với multi-tenant**: tự hỏi ‘khôi phục *một* tenant sau khi xoá nhầm thì làm thế nào?’ — môi trường riêng cho từng tenant (như ERC) làm việc này dễ hơn nhiều so với database dùng chung."
      ],
      bang: {
        ten: "Backup và HA theo từng hệ",
        cot: ["", "Backup logical", "Backup physical / PITR", "HA", "Lưu ý"],
        hang: [
          ["PostgreSQL", "`pg_dump -Fc`", "`pg_basebackup` + WAL archiving; Aurora / RDS: automated backup + PITR", "Streaming replica + failover; Aurora: reader + failover", "Aurora restore tạo cluster **mới**"],
          ["MySQL", "`mysqldump --single-transaction`", "XtraBackup + binlog; RDS / Aurora: automated backup + PITR", "Replication nguồn–replica (GTID), Group Replication, Aurora", "Giữ binlog đủ lâu cho PITR"],
          ["MongoDB", "`mongodump --oplog`", "Snapshot đĩa + oplog; Atlas: continuous backup", "Replica set (≥ 3 thành viên)", "Dùng write concern `majority`"],
          ["Redis", "— (xuất RDB)", "RDB snapshot / AOF; ElastiCache: snapshot", "Replication + Sentinel / Cluster; ElastiCache Multi-AZ", "Failover có thể mất ghi chưa kịp sao chép"]
        ]
      },
      bay: "‘Em có Multi-AZ rồi nên không cần backup’: Multi-AZ sao chép luôn cả lỗi xoá nhầm sang bản dự phòng.",
      cv: "‘Backup’ nằm trong 22 module và Aurora có PITR. Chuẩn bị câu chuyện: retention, đã restore thử chưa, mất bao lâu, và khi cần khôi phục một tenant thì quy trình ra sao (xem DB1, B1–B3 trong ngân hàng)."
    },

    /* ---------------------------------------------------------- */
    {
      id: "cham-ket-noi", ten: "Chẩn đoán database chậm và cạn kết nối",
      y: [
        "**Khi ‘chậm đột ngột dù code không đổi’**: (1) *Đo* — tải DB (CPU, IO, số kết nối), query đang chạy lâu, có bị chặn (lock) không; (2) *Thay đổi gần đây* — dữ liệu tăng làm planner đổi plan, thống kê cũ, index thiếu hoặc bloat, lượng truy cập mới; (3) **đọc plan thật** thay vì đoán.",
        "**Cạn kết nối** rất hay gặp khi scale: số task × pool size > `max_connections`. Dấu hiệu: `too many connections` hoặc timeout khi lấy kết nối. Cách xử lý: pool nhỏ hơn cho mỗi task, PgBouncer / RDS Proxy / ProxySQL, bớt giữ kết nối rảnh, sửa rò rỉ kết nối.",
        "**Giao dịch dài / ‘idle in transaction’** giữ khoá và chặn vacuum — đặt `idle_in_transaction_session_timeout` (PostgreSQL), `wait_timeout` (MySQL) và sửa code mở transaction quá lâu.",
        "**N+1 query** và thiếu index là nguyên nhân phổ biến từ phía ứng dụng — bằng chứng là cùng một câu SELECT lặp hàng nghìn lần trong `pg_stat_statements` hoặc slow log.",
        "**Khoá và deadlock**: tìm *ai chặn ai* và từ bao lâu; deadlock thì xem log (MySQL: `SHOW ENGINE INNODB STATUS`; PostgreSQL: dòng `deadlock detected`) và thống nhất thứ tự khoá trong code.",
        "**Giảm tải ngay, không downtime**: kill query chạy hoang (cẩn thận), đẩy truy vấn đọc sang replica, bật cache ở tầng ứng dụng, tạm giới hạn lưu lượng. **Trung hạn**: thêm index (`CONCURRENTLY`), tối ưu query tệ nhất, phân trang thay vì quét toàn bảng.",
        "**Đo cache hit ratio, IO, replica lag** và so với đường cơ sở (baseline) — không có baseline thì không biết ‘chậm’ nghĩa là gì.",
        "**Mạng tới DB**: độ trễ (cùng AZ hay khác AZ), DNS, TLS handshake; đặt app và DB cùng Region / AZ chính; tái sử dụng kết nối."
      ],
      lenh: [
        ["SELECT count(*), state FROM pg_stat_activity GROUP BY state;", "PostgreSQL: số kết nối theo trạng thái"],
        ["SHOW max_connections;", "PostgreSQL: trần kết nối"],
        ["SHOW STATUS LIKE 'Threads_connected';", "MySQL: số kết nối hiện tại"],
        ["SHOW VARIABLES LIKE 'max_connections';", "MySQL: trần kết nối"],
        ["db.serverStatus().connections", "MongoDB: kết nối hiện tại / còn lại"],
        ["redis-cli INFO clients", "Redis: số client đang kết nối"]
      ],
      bay: "Phản xạ ‘tăng cấu hình instance cho mạnh’ trước khi đo: nếu nguyên nhân là lock, thiếu index hay cạn kết nối thì tiền bỏ ra không giải quyết được gì.",
      cv: "Câu tình huống kinh điển: ‘database chậm giờ cao điểm, không được downtime’ (xem TH7 trong ngân hàng). Trả lời theo thứ tự đo → giảm tải ngay → khắc phục trung hạn, và nhắc `CREATE INDEX CONCURRENTLY` để cho thấy bạn hiểu ràng buộc ‘không downtime’."
    }
  ]
};
