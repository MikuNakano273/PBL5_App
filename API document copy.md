# PBL5 Server API Document

Tài liệu này dành cho Frontend/Mobile app để kết nối tới PBL5 Server. Backend hiện là FastAPI, chạy mặc định ở port `8000`.

## 1. Chạy server bằng Docker

### Chuẩn bị `.env`

```bash
cp .env.example .env
```

Các biến FE thường cần quan tâm:

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:8080
JWT_ACCESS_EXPIRES_MINUTES=15
JWT_REFRESH_EXPIRES_DAYS=30
```

Nếu FE chạy ở origin khác, ví dụ Vite `http://localhost:5173`, thêm vào `CORS_ORIGINS`:

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:8080,http://localhost:5173
```

### Build và chạy toàn bộ service

```bash
docker compose up -d --build
```

Compose sẽ build và chạy:

- API: container `pbl5-api`, host port `8000`
- Worker: container `pbl5-worker`
- MongoDB: host port `27017`
- Redis: host port `6379`
- MinIO API: host port `9000`
- MinIO console: host port `9001`

Kiểm tra service:

```bash
docker compose ps
curl http://localhost:8000/api/health
```

Swagger/OpenAPI:

```text
http://localhost:8000/docs
```

### Địa chỉ API cho FE

| Môi trường FE | Base URL nên dùng |
|---|---|
| Web FE chạy trên cùng máy | `http://localhost:8000` |
| Android emulator | `http://10.0.2.2:8000` |
| iOS simulator | `http://localhost:8000` |
| Điện thoại thật cùng Wi-Fi | `http://<LAN_IP_CUA_MAY_CHAY_DOCKER>:8000` |
| Container khác trong cùng compose network | `http://api:8000` |

Lấy LAN IP của máy chạy Docker:

```bash
ipconfig getifaddr en0
```

Nếu dùng Windows:

```powershell
ipconfig
```

Tìm IPv4 của Wi-Fi/LAN, ví dụ `192.168.1.20`, rồi cấu hình mobile app:

```text
http://192.168.1.20:8000
```

Lưu ý: một số script cũ trong repo có in URL `http://localhost/api/health`, nhưng `docker-compose.yml` hiện map API là `8000:8000`, nên FE nên dùng `http://localhost:8000`.

## 2. Quy ước chung

### Content type

Tất cả request body dùng JSON:

```http
Content-Type: application/json
```

### Thời gian

Các field thời gian dùng ISO 8601 string, ví dụ:

```json
"2026-04-25T08:01:00+00:00"
```

### Response thành công

API hiện trả trực tiếp object hoặc array, không bọc trong envelope `data`.

Ví dụ:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "bearer"
}
```

### Response lỗi

Lỗi nghiệp vụ có format:

```json
{
  "error": {
    "code": "invalid_credentials",
    "message": "Email or password is invalid.",
    "details": {}
  }
}
```

Lỗi validation của FastAPI thường trả HTTP `422`.

Các HTTP status thường gặp:

| Status | Ý nghĩa |
|---|---|
| `400` | Request thiếu header/body sai nghiệp vụ |
| `401` | Thiếu hoặc sai token/credential |
| `403` | Token đúng nhưng không đủ quyền |
| `404` | Không tìm thấy resource |
| `409` | Trạng thái xung đột |
| `422` | Body/query không đúng schema |
| `429` | Bị rate limit |
| `500` | Lỗi server |

## 3. Auth cho Mobile FE

Mobile API dùng JWT access token:

```http
Authorization: Bearer <access_token>
```

Access token có hạn mặc định `15` phút. Refresh token có hạn mặc định `30` ngày.

### Flow khuyến nghị

1. Gọi `POST /api/mobile/v1/auth/login`.
2. Lưu `access_token`, `refresh_token`, `device_fingerprint`.
3. Với API mobile cần đăng nhập, gửi `Authorization: Bearer <access_token>`.
4. Nếu nhận `401`, gọi `POST /api/mobile/v1/auth/refresh`.
5. Nếu refresh fail, logout local và đưa user về màn login.

### Axios mẫu

```ts
import axios from "axios";

export const API_BASE_URL = "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 4. Demo data

Seed dữ liệu demo:

```bash
python3 scripts/seed_demo_data.py
```

Lệnh seed chạy từ máy host và cần Python dependency của API. Nếu máy chưa cài dependency, tạo venv rồi cài `api/requirements.txt` trước.

Thông tin demo trong `scripts/seed_demo_data.py`:

| Loại | Email / Code | Password / Secret |
|---|---|---|
| Mobile user | `user@example.com` | `password123` |
| Admin | `admin@example.com` | `password123` |
| Cane device | `STICK-001` | `device-secret` |

## 5. Health

### `GET /api/health`

Không cần auth.

Response:

```json
{
  "status": "ok"
}
```

Backend cũng expose `GET /health`.

### `GET /health`

Alias health check không cần auth. Response giống `GET /api/health`.

## 6. Mobile Auth API

Base path:

```text
/api/mobile/v1/auth
```

### `POST /api/mobile/v1/auth/login`

Đăng nhập user mobile. Chỉ user có role `user` được login ở endpoint này.

Rate limit: `10` request/phút/IP.

Request:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "device_fingerprint": "phone-unique-id-001",
  "device_name": "iPhone 15",
  "platform": "ios"
}
```

Field rules:

| Field | Rule |
|---|---|
| `email` | Email hợp lệ |
| `password` | 8-128 ký tự |
| `device_fingerprint` | 3-255 ký tự |
| `device_name` | 1-255 ký tự |
| `platform` | 2-50 ký tự, ví dụ `android`, `ios`, `web` |

Response:

```json
{
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "token_type": "bearer"
}
```

### `POST /api/mobile/v1/auth/refresh`

Rate limit: `30` request/phút/IP.

Request:

```json
{
  "refresh_token": "<refresh_token>"
}
```

Response:

```json
{
  "access_token": "<new_access_token>",
  "refresh_token": "<new_refresh_token>",
  "token_type": "bearer"
}
```

Lưu ý: refresh token cũ bị revoke sau khi refresh thành công.

### `POST /api/mobile/v1/auth/logout`

Request:

```json
{
  "refresh_token": "<refresh_token>"
}
```

Response:

```json
{
  "status": "ok"
}
```

## 7. Mobile Me API

Base path:

```text
/api/mobile/v1/me
```

Tất cả endpoint trong nhóm này cần:

```http
Authorization: Bearer <mobile_access_token>
```

### `GET /api/mobile/v1/me`

Response:

```json
{
  "id": "user-1",
  "_id": "user-1",
  "email": "user@example.com",
  "full_name": "Demo User",
  "phone": "0900000001",
  "role": "user",
  "status": "active"
}
```

`id` và `_id` luôn có cùng giá trị. Client mới nên dùng `id`; `_id` được giữ để tương thích với client cũ.

### `PATCH /api/mobile/v1/me`

Request:

```json
{
  "full_name": "Nguyen Van A",
  "phone": "0900000001"
}
```

Các field đều optional. Response giống `GET /me`.

### `POST /api/mobile/v1/me/change-password`

Request:

```json
{
  "current_password": "password123",
  "new_password": "newpassword123"
}
```

Response:

```json
{
  "status": "ok"
}
```

Sau khi đổi mật khẩu, server revoke refresh token hiện có. FE nên logout local hoặc yêu cầu login lại.

## 8. Mobile Dashboard API

Base path:

```text
/api/mobile/v1
```

Tất cả endpoint cần:

```http
Authorization: Bearer <mobile_access_token>
```

Mobile token chỉ được xem dữ liệu của chính `user_id` trong token. Nếu gọi user khác sẽ nhận `403`.

Mobile app mới nên dùng các alias `/me/*` để server tự lấy `user_id` từ JWT:

| Khuyến nghị cho app mới | Endpoint cũ tương thích ngược |
|---|---|
| `GET /api/mobile/v1/dashboard/me` | `GET /api/mobile/v1/dashboard/{user_id}` |
| `GET /api/mobile/v1/me/devices` | `GET /api/mobile/v1/users/{user_id}/devices` |
| `GET /api/mobile/v1/me/locations?limit=20` | `GET /api/mobile/v1/users/{user_id}/locations?limit=20` |
| `GET /api/mobile/v1/me/alerts?page=1&limit=20` | `GET /api/mobile/v1/users/{user_id}/alerts?page=1&limit=20` |

Alias dùng `user_id` trong JWT và tái sử dụng cùng response/validation với endpoint cũ. Endpoint cũ vẫn kiểm tra permission và trả `403` nếu token user A yêu cầu dữ liệu user B.

### `GET /api/mobile/v1/dashboard/me`

Alias được khuyến nghị cho `GET /api/mobile/v1/dashboard/{user_id}`. Response giống endpoint dashboard bên dưới.

### `GET /api/mobile/v1/dashboard/{user_id}`

Response:

```json
{
  "user_id": "user-1",
  "is_safe": true,
  "current_safety_status": "safe",
  "nearest_distance_cm": 120,
  "today_alert_count": 3,
  "device_count": 1,
  "device_last_seen_at": "2026-04-25T07:05:00+00:00",
  "last_seen_at": "2026-04-25T07:06:00+00:00",
  "last_location": {
    "type": "Point",
    "coordinates": [108.2022, 16.0544]
  },
  "recent_alerts": [
    {
      "id": "alert-1",
      "title": "Obstacle",
      "message": "Obstacle ahead",
      "risk_level": "warning",
      "triggered_at": "2026-04-25T07:07:00+00:00"
    }
  ]
}
```

### `GET /api/mobile/v1/users/{user_id}/devices`

Response:

```json
[
  {
    "id": "device-1",
    "device_code": "STICK-001",
    "serial_number": "DEMO-STICK-001",
    "owner_user_id": "user-1",
    "name": "Demo Smart Cane",
    "firmware_version": "demo-1.0.0",
    "status": "online",
    "last_seen_at": "2026-04-25T07:05:00+00:00",
    "last_battery": 78
  }
]
```

### `GET /api/mobile/v1/me/devices`

Alias được khuyến nghị cho `GET /api/mobile/v1/users/{user_id}/devices`. Response giống endpoint devices bên trên.

### `GET /api/mobile/v1/users/{user_id}/locations?limit=20`

Query:

| Param | Default | Rule |
|---|---:|---|
| `limit` | `20` | 1-100 |

Response:

```json
[
  {
    "id": "gps-1",
    "device_id": "device-1",
    "user_id": "user-1",
    "lat": 16.0544,
    "lng": 108.2022,
    "location": {
      "type": "Point",
      "coordinates": [108.2022, 16.0544]
    },
    "accuracy": 4.5,
    "speed": 0.7,
    "heading": 92,
    "recorded_at": "2026-04-25T08:00:00+00:00"
  }
]
```

### `GET /api/mobile/v1/me/locations?limit=20`

Alias được khuyến nghị cho `GET /api/mobile/v1/users/{user_id}/locations`.

Query và response giống endpoint locations bên trên:

| Param | Default | Rule |
|---|---:|---|
| `limit` | `20` | 1-100 |

### `GET /api/mobile/v1/users/{user_id}/alerts/today`

Response:

```json
[
  {
    "id": "alert-1",
    "user_id": "user-1",
    "device_id": "device-1",
    "alert_type": "OBSTACLE",
    "title": "Obstacle",
    "message": "Obstacle ahead",
    "risk_level": "high",
    "status": "open",
    "lat": 16.0544,
    "lng": 108.2022,
    "distance_cm": 85,
    "triggered_at": "2026-04-25T08:01:00+00:00",
    "resolved_at": null
  }
]
```

### `GET /api/mobile/v1/users/{user_id}/alerts?page=1&limit=20`

Query:

| Param | Default | Rule |
|---|---:|---|
| `page` | `1` | >= 1 |
| `limit` | `20` | 1-100 |

Response: array alert giống endpoint alerts/today.

### `GET /api/mobile/v1/me/alerts?page=1&limit=20`

Alias được khuyến nghị cho `GET /api/mobile/v1/users/{user_id}/alerts`.

Query và response giống endpoint alerts bên trên:

| Param | Default | Rule |
|---|---:|---|
| `page` | `1` | >= 1 |
| `limit` | `20` | 1-100 |

### `GET /api/mobile/v1/users/{user_id}/alerts/recent?limit=5`

Query:

| Param | Default | Rule |
|---|---:|---|
| `limit` | `5` | 1-50 |

Response: array alert.

### `GET /api/mobile/v1/alerts/{alert_id}`

Response: một alert object.

## 9. Installation, Notification và Push Token API

Base path:

```text
/api/mobile/v1/installations/me
```

Nhóm endpoint này không dùng JWT trong code hiện tại. Thay vào đó cần header:

```http
X-Device-Fingerprint: <device_fingerprint_da_dung_khi_login>
```

Nếu thiếu header: `400 missing_installation_header`.
Nếu fingerprint chưa từng login/tạo installation: `404 installation_not_found`.

### `GET /api/mobile/v1/installations/me/accounts`

Response:

```json
[
  {
    "_id": "installation-account-1",
    "installation_id": "installation-1",
    "user_id": "user-1",
    "is_active": true,
    "last_switched_at": "2026-04-25T08:00:00+00:00"
  }
]
```

### `POST /api/mobile/v1/installations/me/switch-account`

Request:

```json
{
  "installation_account_id": "installation-account-1"
}
```

Response:

```json
{
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "token_type": "bearer"
}
```

### `GET /api/mobile/v1/installations/me/notifications`

Response:

```json
[
  {
    "id": "notification-1",
    "installation_id": "installation-1",
    "notification_event_id": "event-1",
    "read_at": null,
    "created_at": "2026-04-25T08:00:00+00:00",
    "event": {
      "id": "event-1",
      "user_id": "user-1",
      "alert_id": "alert-1",
      "title": "Obstacle detected",
      "message": "Nearest obstacle 85 cm.",
      "risk_level": "high",
      "created_at": "2026-04-25T08:00:00+00:00"
    }
  }
]
```

### `POST /api/mobile/v1/installations/me/notifications/{notification_id}/read`

Response: notification object đã cập nhật `read_at`.

### `POST /api/mobile/v1/installations/me/push-token`

Request:

```json
{
  "push_token": "<fcm_token>",
  "provider": "fcm",
  "platform": "android"
}
```

Response:

```json
{
  "id": "installation-1",
  "device_fingerprint": "phone-unique-id-001",
  "device_name": "Pixel 8",
  "platform": "android",
  "push_provider": "fcm",
  "push_token": "<fcm_token>",
  "status": "active"
}
```

## 10. Admin API

Base path:

```text
/api/admin/v1
```

Admin login dùng token riêng, chỉ token có `role=admin` và `token_use=admin` được gọi Admin API.

Header cho endpoint admin sau login:

```http
Authorization: Bearer <admin_access_token>
```

### `POST /api/admin/v1/auth/login`

Rate limit: `10` request/phút/IP.

Request:

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "access_token": "<admin_jwt>",
  "token_type": "bearer"
}
```

### `GET /api/admin/v1/users?page=1&limit=20`

Response:

```json
[
  {
    "id": "user-1",
    "email": "user@example.com",
    "full_name": "Demo User",
    "phone": "0900000001",
    "role": "user",
    "status": "active",
    "created_at": "2026-04-25T08:00:00+00:00",
    "updated_at": "2026-04-25T08:00:00+00:00"
  }
]
```

### `GET /api/admin/v1/users/{user_id}`

Response: một user object.

### `PATCH /api/admin/v1/users/{user_id}`

Request:

```json
{
  "full_name": "Updated Name",
  "phone": "0900000002",
  "status": "active"
}
```

Response: user object sau khi cập nhật.

### `GET /api/admin/v1/devices?page=1&limit=20`

Response:

```json
[
  {
    "id": "device-1",
    "device_code": "STICK-001",
    "serial_number": "DEMO-STICK-001",
    "owner_user_id": "user-1",
    "name": "Demo Smart Cane",
    "firmware_version": "demo-1.0.0",
    "status": "online",
    "last_seen_at": "2026-04-25T08:00:00+00:00",
    "last_battery": 78
  }
]
```

### `POST /api/admin/v1/devices/{device_id}/assign`

Request:

```json
{
  "user_id": "user-1"
}
```

Response: device object sau khi assign.

### `GET /api/admin/v1/image-requests?page=1&limit=20`

Response:

```json
[
  {
    "id": "request-1",
    "request_code": "img_xxx",
    "device_id": "device-1",
    "user_id": "user-1",
    "captured_at": "2026-04-25T08:00:00+00:00",
    "distance_cm": 85,
    "gps_snapshot": {
      "lat": 16.0544,
      "lng": 108.2022
    },
    "image_path": "raw/user-1/device-1/request-1.jpg",
    "status": "done",
    "ai_status": "done",
    "error_message": null,
    "metadata": {},
    "created_at": "2026-04-25T08:00:00+00:00",
    "updated_at": "2026-04-25T08:00:10+00:00"
  }
]
```

### `GET /api/admin/v1/alerts?page=1&limit=20`

Response: array alert.

## 11. Cane Device API

Base path:

```text
/api/cane/v1
```

Nhóm này dành cho thiết bị gậy, không dành cho FE thông thường.

Tất cả endpoint cần header:

```http
X-Device-Code: STICK-001
X-Device-Secret: device-secret
```

Rate limit: `120` request/phút/IP.

### `POST /api/cane/v1/gps`

Request:

```json
{
  "lat": 16.0544,
  "lng": 108.2022,
  "accuracy": 4.5,
  "speed": 0.7,
  "heading": 92,
  "recorded_at": "2026-04-25T08:00:00+00:00"
}
```

Response:

```json
{
  "id": "gps-1",
  "location": {
    "type": "Point",
    "coordinates": [108.2022, 16.0544]
  },
  "recorded_at": "2026-04-25T08:00:00+00:00"
}
```

### `POST /api/cane/v1/telemetry/distance`

Request:

```json
{
  "distance_cm": 85,
  "detected": true,
  "sensor_type": "ultrasonic",
  "recorded_at": "2026-04-25T08:00:00+00:00"
}
```

Response:

```json
{
  "id": "distance-1",
  "saved": true,
  "current_safety_status": "danger",
  "nearest_distance_cm": 85,
  "recorded_at": "2026-04-25T08:00:00+00:00"
}
```

Nếu sample bị bỏ qua do sampling rule, `saved=false` và `id=null`.

### `POST /api/cane/v1/heartbeat`

Request:

```json
{
  "battery": 78,
  "firmware_version": "demo-1.0.0",
  "seen_at": "2026-04-25T08:00:00+00:00"
}
```

Response:

```json
{
  "device_id": "device-1",
  "last_seen_at": "2026-04-25T08:00:00+00:00"
}
```

### `GET /api/cane/v1/devices/me/config`

Response:

```json
{
  "device_id": "device-1",
  "device_code": "STICK-001",
  "user_id": "user-1",
  "name": "Demo Smart Cane",
  "firmware_version": "demo-1.0.0",
  "status": "online",
  "minio_bucket": "pbl5-images",
  "image_upload_prefix": "raw/user-1/device-1/",
  "image_upload_url_ttl_seconds": 900,
  "telemetry": {
    "alert_distance_threshold_cm": 100,
    "distance_sampling_min_seconds": 2,
    "distance_sampling_delta_cm": 10
  }
}
```

### `POST /api/cane/v1/requests`

Tạo image request trước khi upload ảnh.

Request:

```json
{
  "captured_at": "2026-04-25T08:00:00+00:00",
  "distance_cm": 85,
  "gps_snapshot": {
    "lat": 16.0544,
    "lng": 108.2022
  },
  "metadata": {
    "camera": "front"
  }
}
```

Response:

```json
{
  "id": "request-1",
  "request_code": "img_xxx",
  "device_id": "device-1",
  "user_id": "user-1",
  "captured_at": "2026-04-25T08:00:00+00:00",
  "distance_cm": 85,
  "gps_snapshot": {
    "lat": 16.0544,
    "lng": 108.2022
  },
  "image_path": null,
  "status": "created",
  "ai_status": "created",
  "error_message": null,
  "metadata": {
    "camera": "front"
  },
  "created_at": "2026-04-25T08:00:00+00:00",
  "updated_at": "2026-04-25T08:00:00+00:00"
}
```

### `POST /api/cane/v1/requests/{request_id}/image`

Gắn ảnh vào image request và queue job xử lý AI.

Nếu thiết bị/server đã upload ảnh sẵn và có path:

```json
{
  "image_path": "raw/user-1/device-1/request-1.jpg"
}
```

Nếu gửi `image_path=null` hoặc bỏ qua field, API tạo `upload_url` presigned tới MinIO:

```json
{}
```

Response có thể gồm `upload_url` và `vision_job`:

```json
{
  "id": "request-1",
  "image_path": "raw/user-1/device-1/request-1.jpg",
  "status": "uploaded",
  "ai_status": "queued",
  "upload_url": "http://localhost:9000/pbl5-images/...",
  "vision_job": {
    "job_id": "rq-job-1",
    "queue": "vision-jobs"
  }
}
```

Lưu ý: Docker compose publish MinIO API ở host port `9000`, nhưng `MINIO_ENDPOINT` bên trong API container là `minio:9000`. Presigned `upload_url` có thể chứa hostname nội bộ `minio`; thiết bị hoặc app bên ngoài Docker cần endpoint/proxy có hostname truy cập được.

## 12. Internal Worker API

Base path:

```text
/api/internal/v1
```

Nhóm này dành cho worker, không dành cho FE.

Header:

```http
Authorization: Bearer <INTERNAL_WORKER_TOKEN>
```

Trong Docker compose, worker gọi API qua:

```text
http://api:8000
```

### `POST /api/internal/v1/vision/results`

Request:

```json
{
  "request_id": "request-1",
  "model_name": "yolov8s",
  "model_version": "1.0",
  "objects": [
    {
      "label": "chair",
      "confidence": 0.92,
      "bbox": [10, 20, 100, 160]
    }
  ],
  "nearest_obstacle_cm": 80,
  "risk_level": "high",
  "summary_text": "Detected chair"
}
```

Response:

```json
{
  "status": "accepted",
  "id": "vision-result-1",
  "request_id": "request-1",
  "risk_level": "high",
  "summary_text": "Detected 1 object(s): chair. Nearest obstacle 80 cm.",
  "processed_at": "2026-04-25T08:00:10+00:00"
}
```

Lưu ý: server tự derive lại `risk_level` và `summary_text` từ `objects`/`nearest_obstacle_cm`.

### `POST /api/internal/v1/vision/retry/{request_id}`

Response:

```json
{
  "status": "queued",
  "request_id": "request-1",
  "job_id": "rq-job-1",
  "queue": "vision-jobs"
}
```


## 13. Gợi ý cấu hình FE theo môi trường

### `.env` cho Vite/React

```env
VITE_API_BASE_URL=http://localhost:8000
```

Android emulator:

```env
VITE_API_BASE_URL=http://10.0.2.2:8000
```

Điện thoại thật cùng Wi-Fi:

```env
VITE_API_BASE_URL=http://192.168.1.20:8000
```

### API client mẫu có refresh token

```ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("access_token");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = localStorage.getItem("refresh_token");

    if (error.response?.status === 401 && refreshToken && !originalRequest._retry) {
      originalRequest._retry = true;

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/mobile/v1/auth/refresh`,
        { refresh_token: refreshToken }
      );

      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("refresh_token", response.data.refresh_token);

      originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default api;
```

### Login mẫu

```ts
const response = await api.post("/api/mobile/v1/auth/login", {
  email: "user@example.com",
  password: "password123",
  device_fingerprint: "phone-unique-id-001",
  device_name: "Pixel 8",
  platform: "android",
});

localStorage.setItem("access_token", response.data.access_token);
localStorage.setItem("refresh_token", response.data.refresh_token);
localStorage.setItem("device_fingerprint", "phone-unique-id-001");
```

### Gọi notification cần fingerprint header

```ts
const fingerprint = localStorage.getItem("device_fingerprint");

const response = await api.get("/api/mobile/v1/installations/me/notifications", {
  headers: {
    "X-Device-Fingerprint": fingerprint,
  },
});
```

## 14. Checklist cho FE trước khi gọi API

- Chạy `docker compose up -d --build`.
- Kiểm tra `http://localhost:8000/api/health` trả `{ "status": "ok" }`.
- Kiểm tra Swagger ở `http://localhost:8000/docs`.
- Cấu hình đúng `VITE_API_BASE_URL` theo web/emulator/điện thoại thật.
- Thêm origin FE vào `CORS_ORIGINS` trong `.env` nếu bị CORS.
- Login mobile bằng `/api/mobile/v1/auth/login`, lưu access/refresh token.
- Dùng `/api/mobile/v1/dashboard/me` và `/api/mobile/v1/me/*` thay cho việc tự truyền `user_id`.
- Với notification/account/push token, gửi thêm `X-Device-Fingerprint`.
- Khi access token hết hạn, gọi `/api/mobile/v1/auth/refresh`.
