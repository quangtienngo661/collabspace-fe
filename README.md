# CollabSpace — Frontend

Giao diện người dùng cho hệ thống **CollabSpace** — nền tảng quản lý công việc theo mô hình microservice.

---

## ⚠️ Lưu ý quan trọng trước khi bắt đầu

| | Thành phần | Cách chạy |
|---|---|---|
| 🐳 | **Backend** (`collabspace`) | Chạy trong **Docker** — Traefik + 5 NestJS services + DB + Message broker |
| 💻 | **Frontend** (`collabspace-fe`) | Chạy **trực tiếp trên máy** bằng Node.js (`npm run dev`) |

> **Không có Docker Compose cho Frontend.** Frontend là một Vite dev server chạy local và gọi API qua Traefik (port 80).

---

## Tổng quan kiến trúc

```
Trình duyệt
    │
    ├──► http://localhost:5173     ← collabspace-fe  (Vite dev server, chạy local)
    │         │
    │         └── gọi API ──────► http://localhost   ← Traefik API Gateway (Docker)
    │                                     │
    │                          ┌──────────┴──────────┐
    │                     ┌────┴────┐           ┌────┴────────────────┐
    │                auth-service  user-service  workspace-service ...
    │                  (:3000)      (:3000)          (:8080)
```

Frontend **không gọi trực tiếp** vào từng service — tất cả đều đi qua Traefik tại `http://localhost` (port 80).

---

## Yêu cầu hệ thống

| Công cụ | Phiên bản | Ghi chú |
|---|---|---|
| **Node.js** | 20 LTS | Bắt buộc để chạy dev server |
| **npm** | đi kèm Node 20 | Dùng để cài dependencies |
| **Docker Desktop** | mới nhất | Cần để chạy backend |
| **Git** | mới nhất | Clone repo |

Kiểm tra:

```powershell
node -v           # v20.x.x
npm -v            # 10.x.x
docker --version
git --version
```

---

## Bước 1 — Khởi động Backend (Docker)

> 🛑 **Backend phải chạy TRƯỚC. Nếu bỏ qua bước này, mọi API call sẽ thất bại.**

Clone và khởi động backend từ repo [collabspace](https://github.com/lengocanh2005it/collabspace):

```powershell
# 1. Clone backend (nếu chưa có)
git clone https://github.com/lengocanh2005it/collabspace.git
cd collabspace

# 2. Chuẩn bị file .env cho tất cả service
# Copy tự động các file .env.example sang .env trên Windows PowerShell:
Get-ChildItem -Recurse -Filter .env.example | ForEach-Object { Copy-Item $_.FullName ($_.DirectoryName + "\.env") }

# Mở Docker Desktop (phải chạy sẵn) trước khi chạy lệnh tiếp theo

# 3. Khởi tạo Database tạm để migrate & seed
cd infrastructure/docker
docker compose -f docker-compose.yml -f docker-compose.db.yml up -d
cd ../..
Start-Sleep -Seconds 10 # Chờ DB khởi động

# 4. Chạy script migrate database và tạo dữ liệu giả (Seed)
./scripts/migrate.sh
./scripts/seed.sh
# Hoặc trên PowerShell:
# wsl ./scripts/migrate.sh
# wsl ./scripts/seed.sh

# 5. Build và khởi động toàn bộ stack với API Gateway
cd infrastructure/docker
docker compose `
  -f docker-compose.yml `
  -f docker-compose.db.yml `
  -f docker-compose.traefik.yml `
  -f docker-compose.override.yml `
  up --build -d
```

Chờ 1–2 phút để các NestJS service compile xong, sau đó kiểm tra:

```powershell
# Kiểm tra container đang chạy
docker ps

# Kiểm tra API Gateway (dùng trình duyệt truy cập url này cũng được)
curl http://localhost/api/v1/auth/health/ready
# Kết quả mong muốn: {"status":"ok","..."}
```

Khi tất cả container ở trạng thái `healthy`, backend đã sẵn sàng.

---

## Bước 2 — Cài đặt Frontend

### 2.1. Clone repository

```powershell
git clone https://github.com/quangtienngo661/collabspace-fe.git
cd collabspace-fe
```

### 2.2. Cài dependencies

```powershell
npm install
```

> Dự án dùng `package-lock.json` — hãy dùng `npm install`, không dùng `pnpm` hay `yarn`.

### 2.3. Cấu hình biến môi trường

```powershell
Copy-Item .env.example .env
```

Nội dung file `.env` mặc định:

```env
VITE_API_BASE_URL=/api/v1
VITE_API_PROXY_TARGET=http://localhost
```

> Giữ nguyên giá trị này khi chạy local. Frontend gọi API qua Traefik ở `http://localhost` (port 80).

---

## Bước 3 — Chạy Frontend

```powershell
npm run dev
```

Khi thành công:

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

Mở trình duyệt tại **[http://localhost:5173](http://localhost:5173)**.

---

## Tài khoản demo

| Tài khoản | Email | Mật khẩu | Quyền |
|---|---|---|---|
| Admin | `tho@collabspace.dev` | `collabspace123` | Owner / Admin |
| Member | `ngocanh@collabspace.dev` | `collabspace123` | Member |

> Tài khoản được tạo tự động khi chạy seed script ở backend. Xem README backend để biết cách seed.

---

## Cấu trúc thư mục

```
collabspace-fe/
├── src/
│   ├── app/
│   │   ├── api/             # HTTP client + các module gọi API
│   │   │   ├── httpClient.ts        # Axios instance + token interceptors
│   │   │   ├── authApi.ts           # Đăng nhập, đăng ký, OTP
│   │   │   ├── workspaceApi.ts      # Workspace, project, invite
│   │   │   ├── taskApi.ts           # Task CRUD, kanban
│   │   │   ├── usersApi.ts          # Profile, avatar
│   │   │   └── notificationsApi.ts
│   │   ├── auth/
│   │   │   └── AuthContext.tsx      # Session state toàn cục
│   │   ├── components/
│   │   │   ├── layout/              # AppShell, Sidebar, TopBar, MobileNav
│   │   │   ├── pages/               # Dashboard, Workspace, Project, Task, Profile...
│   │   │   ├── shared/              # UserAvatar, StatusBadge, EmptyState...
│   │   │   └── ui/                  # Shadcn UI components (Button, Table, Dialog...)
│   │   ├── hooks/
│   │   │   └── useAsyncData.ts      # Hook quản lý async data + loading/error state
│   │   └── utils/
│   │       └── format.ts            # timeAgo, format helpers
│   ├── styles/                      # Global CSS, Tailwind config
│   └── main.tsx
├── index.html
├── vite.config.ts
├── package.json
└── .env.example
```

---

## API Routing qua Traefik

Frontend không gọi trực tiếp vào các service. Tất cả request đi qua Traefik ở `http://localhost`:

| Prefix URL | Backend service | Port nội bộ |
|---|---|---|
| `/api/v1/auth/*` | auth-service | 3000 |
| `/api/v1/users/*` | user-service | 3000 |
| `/api/v1/workspaces/*` | workspace-service | 8080 |
| `/api/v1/tasks/*` | task-service | 3000 |
| `/api/v1/notifications/*` | notification-service | 3000 |

---

## Xử lý sự cố thường gặp

### ❌ Lỗi CORS khi gọi API từ `npm run dev` (`localhost:5173`)

**Nguyên nhân phổ biến:** `.env` đặt `VITE_API_BASE_URL` trỏ thẳng sang domain/IP backend (ví dụ `https://collabspace.ngocanh2005it.site/api/v1`). Trình duyệt coi đó là **cross-origin**; các route có `forward-auth` (`/auth/me`, `/users/*`, …) có thể trả `401` trên **OPTIONS preflight** mà không có header CORS.

**Cách đúng (khuyến nghị):** dùng **Vite proxy** — FE gọi same-origin `/api/v1`, Vite forward sang backend:

```env
VITE_API_BASE_URL=/api/v1
VITE_API_PROXY_TARGET=http://localhost
# hoặc prod:
# VITE_API_PROXY_TARGET=https://collabspace.ngocanh2005it.site
```

Sau khi sửa `.env`, **restart** `npm run dev`.

**Backend:** redeploy Helm trên Droplet nếu vẫn gọi cross-origin trực tiếp (đã sửa thứ tự `cors-headers` trước `forward-auth` trong repo `collabspace`).

---

### ❌ `net::ERR_CONNECTION_REFUSED`

**Nguyên nhân**: Traefik hoặc backend chưa chạy (hoặc `VITE_API_PROXY_TARGET` sai).

```powershell
# Xem danh sách container
docker ps

# Xem log Traefik
docker logs traefik --tail=50

# Kiểm tra health
curl http://localhost/api/v1/auth/health/ready
```

Nếu container chưa `healthy`, đợi thêm 1–2 phút rồi thử lại.

---

### ❌ Đăng nhập báo lỗi 401 Unauthorized

**Nguyên nhân**: `auth-service` chưa sẵn sàng hoặc chưa seed dữ liệu.

```powershell
# Kiểm tra auth-service
docker logs auth-service --tail=30
curl http://localhost/api/v1/auth/health/ready
```

---

### ❌ Trang trắng hoặc lỗi JavaScript khi mở app

```powershell
# Xóa cache và cài lại
Remove-Item -Recurse -Force node_modules
npm install
npm run dev
```

---

### ❌ Port 5173 đã bị chiếm

```powershell
# Tìm process đang dùng port
netstat -ano | findstr :5173

# Kill process (thay <PID> bằng số thực)
taskkill /PID <PID> /F
```

---

## Tech stack

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| **React** | 18 | UI framework |
| **TypeScript** | 5.x | Type safety |
| **Vite** | 5.x | Build tool & dev server |
| **React Router** | v6 | Client-side routing |
| **Shadcn UI + Radix** | latest | Component library |
| **Tailwind CSS** | v3 | Utility-first styling |
| **Recharts** | latest | Biểu đồ thống kê |
| **Sonner** | latest | Toast notifications |

---

## Scripts

```powershell
npm run dev       # Chạy dev server (dùng cho local / demo)
npm run build     # Build production bundle (chỉ khi cần kiểm tra)
npm run preview   # Preview bản build
```

> Chỉ cần `npm run dev` để phát triển và demo. **Không cần build.**

---

## Liên quan

- **Backend repo**: [collabspace](https://github.com/lengocanh2005it/collabspace) — NestJS microservices, Docker Compose, Traefik, PostgreSQL, MongoDB, RabbitMQ, Redis
- Hướng dẫn setup backend (migrate, seed, .env, Docker) xem README tại backend repo

---

*Dự án học thuật — demo kiến trúc microservice CollabSpace.*