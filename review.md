# Review thong nhat logic App va Server API

Pham vi review: doi chieu app Expo/React Native hien tai voi `API document.md` cua server FastAPI. Server API trong document dang la nguon chuan. Huong toi uu la sua app de dung dung hop dong API hien co; chi sua server o cac diem hop dong dang thieu thong tin cho luong mobile hoac dang gay lech nghia nghiep vu.

## 1. Sua app

### Ket luan nhanh

App hien chua tich hop API that. `src/api/http.ts` da co axios client nhung chua gan token, chua refresh token va chua co API service. Cac man hinh login, dashboard, alerts, map, settings, account van dung mock/hard-code. Can thay mock bang mot lop API client + auth state dung theo mobile API.

### 1.1. Auth va base client

Dang phu hop:
- App da co `axios` va `src/api/http.ts` doc `EXPO_PUBLIC_API_BASE_URL`, dung voi yeu cau cau hinh base URL theo moi truong mobile.

Chua phu hop:
- Login dang goi `mockApi.login(email, password)` va chi gui `email/password`, trong khi server yeu cau them `device_fingerprint`, `device_name`, `platform`.
- App dang mo phong tai khoan "nguoi giam ho", nhung mobile login server chi cho role `user`. Admin login la API rieng, khong phu hop voi app mobile hien tai.
- Chua luu `access_token`, `refresh_token`, `device_fingerprint`.
- Chua co request interceptor gan `Authorization: Bearer <access_token>`.
- Chua co response interceptor khi gap `401` de goi refresh token.
- Logout hien chi `router.replace("/login")`, chua goi `/api/mobile/v1/auth/logout`.

Huong sua toi uu:
- Chon mobile user la persona chinh cua app hien tai. Doi copy UI tu "nguoi giam ho" sang "nguoi dung/NavicAid user" hoac chi hien thi ho so nguoi dung dang dang nhap. Khong dung admin API cho app mobile.
- Them auth service:
  - `POST /api/mobile/v1/auth/login`
  - `POST /api/mobile/v1/auth/refresh`
  - `POST /api/mobile/v1/auth/logout`
  - `GET /api/mobile/v1/me`
- Luu token bang secure storage cho mobile. Nen cai `expo-secure-store` va luu `access_token`, `refresh_token`, `device_fingerprint`. Neu chay web thi fallback sang storage phu hop.
- Tao device fingerprint on-device mot lan va tai su dung cho login, notifications, switch account. Khong hard-code `"phone-unique-id-001"` trong production.
- Sua `src/api/http.ts` thanh client co:
  - default base URL fallback ro rang, vi du `http://localhost:8000` cho dev web/iOS simulator neu env thieu.
  - request interceptor gan bearer token.
  - response interceptor refresh token mot lan khi `401`, cap nhat refresh token moi vi server revoke token cu sau refresh thanh cong.
  - chuan hoa error tu `{ error: { code, message, details } }` va FastAPI `422`.

### 1.2. Login screen

Dang phu hop:
- Co validation rong email/password va loading state.
- Co demo account banner, co the giu lai nhung phai doi sang account seed cua server.

Chua phu hop:
- Demo account trong mock la `admin@gmail.com / abcd1234`, khong trung document server. Demo mobile dung `user@example.com / password123`.
- Placeholder/copy dang nghieng ve Gmail/guardian, trong khi mobile endpoint chi nhan email user role `user`.
- Sau login khong lay `/me`, nen app khong biet `user_id` that de goi dashboard/alerts/location.

Huong sua toi uu:
- Bo `mockApi.getAuthSeed()` va gan demo credential tu config/dev constant: `user@example.com / password123`.
- Khi login thanh cong:
  - luu token va fingerprint.
  - goi `GET /api/mobile/v1/me`.
  - luu user `_id`, `email`, `full_name`, `phone`, `role`, `status` trong auth context.
  - dieu huong dashboard.
- Neu API tra `401 invalid_credentials`, hien message tu `error.message`. Neu `422`, hien loi validation ngan gon.

### 1.3. Dashboard screen

Dang phu hop:
- UI hien dung cac khoi chinh ma server co: trang thai an toan, khoang cach gan nhat, so canh bao hom nay, canh bao gan day.

Chua phu hop:
- Man hinh dang hard-code `device`, `alerts`.
- Don vi dang hien `nearestDistanceM`, trong khi server tra `nearest_distance_cm`.
- Status UI dang dung `ONLINE/OFFLINE`, nhung endpoint dashboard tra `current_safety_status`, `is_safe`; device status nam o endpoint devices va la lowercase `online/offline`.
- Recent alerts trong dashboard tra `risk_level` va `triggered_at`, khong co `type`, `detail`, `time` nhu UI mock.

Huong sua toi uu:
- Sau khi co `user._id`, dung React Query goi:
  - `GET /api/mobile/v1/dashboard/{user_id}`
  - neu can pin/status thiet bi chi tiet: `GET /api/mobile/v1/users/{user_id}/devices`
- Mapping:
  - `is_safe/current_safety_status` -> text "An toan", "Can chu y", "Nguy hiem".
  - `nearest_distance_cm / 100` -> hien thi met, lam tron 1 chu so.
  - `today_alert_count` -> so canh bao hom nay.
  - `device_last_seen_at` hoac `last_seen_at` -> "Cap nhat".
  - `recent_alerts[].risk_level` -> UI type: `high/danger` = danger, `warning` = warning, con lai = info.
  - `recent_alerts[].message` -> detail.
  - `recent_alerts[].triggered_at` -> time formatted.
- Xu ly null:
  - `nearest_distance_cm = null` hoac thieu -> hien "Chua co du lieu".
  - `last_location = null` -> khong dieu huong map theo toa do cu.

### 1.4. Alerts screen

Dang phu hop:
- Da co React Query loading/error state va filter UI.

Chua phu hop:
- Dang goi `mockApi.getAlerts("U1")`, hard-code user id.
- App type `ApiAlertItem` dang dung `type`, `createdAt`, `read`; server tra `alert_type`, `triggered_at`, `status`, `risk_level`, `message`, `distance_cm`, `resolved_at`.
- Server endpoint `GET /api/mobile/v1/users/{user_id}/alerts` tra array truc tiep, khong co `{ items }`.
- App co `markAlertRead`, nhung server mobile alert API khong co endpoint mark alert read. Mark read hien chi co cho notification: `/installations/me/notifications/{notification_id}/read`.

Huong sua toi uu:
- Doi query sang `GET /api/mobile/v1/users/{user_id}/alerts?page=1&limit=20`, `user_id` lay tu `/me`.
- Doi type theo server:
  - `alert_type`, `risk_level`, `status`, `triggered_at`, `distance_cm`.
- Mapping UI:
  - filter theo `risk_level` thay vi mock `type`, hoac map `alert_type` + `risk_level` thanh `danger/warning/info`.
  - detail nen la `message` + neu co `distance_cm` thi them `"Khoang cach X cm"`.
  - read state khong nen hien "Da doc/Chua doc" cho alert nua, vi alert response khong co `read`.
- Neu can tinh nang da doc, app phai dung notification list thay vi alert list.

### 1.5. Map screen

Dang phu hop:
- UI map can `lat/lng`, safe status va distance, deu co the suy ra tu dashboard/location API.

Chua phu hop:
- Dang hard-code toa do Da Nang va marker vat can gia lap.
- Server khong co API "danger obstacles" rieng cho FE; vi tri/nguy co gan nhat nam trong dashboard va lich su location.
- Server khong tra safe zone radius trong mobile API hien tai, nen app dang hard-code `safeZoneRadiusM`.

Huong sua toi uu:
- Dung `GET /api/mobile/v1/users/{user_id}/locations?limit=1` lam nguon toa do moi nhat. Neu array rong, fallback sang `dashboard.last_location`.
- Dung `dashboard.nearest_distance_cm` de hien khoang cach nguy co gan nhat; khong ve marker vat can gia neu server khong tra toa do vat can.
- Tam thoi bo safe zone circle hoac hien circle chi khi server tra cau hinh safe zone. Khong hard-code radius 120m/200m vi se sai nghiep vu.
- Convert GeoJSON dung thu tu `coordinates: [lng, lat]`; voi React Native Maps phai gan `latitude = lat`, `longitude = lng`.

### 1.6. Account screen

Dang phu hop:
- UI co the tai su dung cho ho so nguoi dung va thiet bi lien ket.

Chua phu hop:
- Dang hard-code profile "nguoi khiem thi" voi age/gender/contacts/safeZone, nhung `GET /me` chi tra `_id`, `email`, `full_name`, `phone`, `role`, `status`.
- Device info can lay tu `GET /api/mobile/v1/users/{user_id}/devices`, khong co trong `/me`.

Huong sua toi uu:
- Doi account screen thanh "Thong tin tai khoan":
  - ho ten, email, phone, role, status tu `/me`.
  - thiet bi lien ket tu `/users/{user_id}/devices`, hien `name`, `device_code`, `status`, `last_battery`, `last_seen_at`.
- Bo cac field server chua co: age, gender, visionStatus, healthNotes, contacts, safeZone. Neu san pham bat buoc can cac field nay thi dua vao phan sua server ben duoi.

### 1.7. Settings screen

Dang phu hop:
- UI co logout va cac switch notification/realtime.

Chua phu hop:
- Server mobile API hien tai khong co endpoint update device/user settings nhu `alertEnabled`, `vibration`, `safeZone`.
- Logout khong goi server revoke refresh token.
- Push notification API yeu cau `X-Device-Fingerprint`, nhung app chua gui header nay.

Huong sua toi uu:
- Doi settings thanh cac muc co API that:
  - "Thong tin tai khoan" -> account.
  - "Dang xuat" -> goi `/auth/logout` voi refresh token, sau do clear local token.
  - Push token: khi co FCM token, goi `POST /api/mobile/v1/installations/me/push-token` kem header `X-Device-Fingerprint`.
- Tam thoi disable/bo cac switch `Bật cảnh báo`, `Thông báo real-time`, `Rung khi cảnh báo` cho den khi server co settings API.

### 1.8. Notifications va multi-account

Dang phu hop:
- App co nhu cau notification/realtime, document da co installation notification API.

Chua phu hop:
- App chua co luong `X-Device-Fingerprint`.
- App chua co screen/list notifications; alert screen dang bi dung nhu notification read state.

Huong sua toi uu:
- Neu can "da doc/chua doc", tao notification service rieng:
  - `GET /api/mobile/v1/installations/me/notifications`
  - `POST /api/mobile/v1/installations/me/notifications/{notification_id}/read`
- Moi request installation them header `X-Device-Fingerprint`, khong can bearer theo document hien tai.
- Multi-account chi nen lam sau khi auth co fingerprint on-device on dinh.

## 2. Sua server neu co

### Ket luan nhanh

Khong nen doi response envelope cua server luc nay. Document da noi ro API tra object/array truc tiep, va day la hop dong du de app tich hop. Cac sua server can thiet chu yeu la bo sung endpoint/field cho nhung man hinh app that su can nhung API chua co.

### 2.1. Nen giu nguyen

- Giu base path `/api/mobile/v1`.
- Giu auth mobile bang `access_token` + `refresh_token`, refresh token rotation, va logout revoke token.
- Giu response success dang object/array truc tiep, khong boc `data`, de tranh sua server va FE rong.
- Giu error format `{ error: { code, message, details } }` cho loi nghiep vu.
- Giu role separation: mobile API cho `role=user`, admin API rieng cho `role=admin`.

### 2.2. Can bo sung de app dung duoc tot hon

#### Them endpoint dashboard theo current user

Van de:
- Mobile token chi duoc xem du lieu cua chinh user, nhung FE van phai truyen `user_id`. App phai lay `/me` truoc roi moi goi dashboard, va neu hard-code sai se gap `403`.

Sua toi uu:
- Them alias:
  - `GET /api/mobile/v1/dashboard/me`
  - `GET /api/mobile/v1/me/devices`
  - `GET /api/mobile/v1/me/locations?limit=20`
  - `GET /api/mobile/v1/me/alerts?page=1&limit=20`
- Cac endpoint nay lay `user_id` tu JWT. Giu endpoint `{user_id}` hien co de tuong thich nguoc.

Ly do:
- Giam loi FE hard-code user id.
- Dung hon voi security model "token chi xem chinh user".

#### Chuan hoa id field trong mobile user

Van de:
- `GET /me` tra `_id`, con admin/users va devices tra `id`. FE se phai xu ly ca `_id` va `id`.

Sua toi uu:
- Doi mobile `/me` response them `id` song song voi `_id` trong mot thoi gian:
  - `id: "user-1"`
  - `_id: "user-1"` de backward compatible.
- Sau khi FE da doi het sang `id`, co the bo `_id` neu backend muon chuan hoa.

Ly do:
- Giam mapping dac biet o app.
- Dong nhat voi `devices`, `alerts`, `notifications`.

#### Bo sung profile fields neu san pham van can ho so nguoi khiem thi

Van de:
- App dang hien age, gender, vision status, support need, home area, safe zone, contacts. Mobile `/me` chua co cac field nay.

Sua toi uu:
- Neu day la yeu cau san pham that, them endpoint:
  - `GET /api/mobile/v1/me/profile`
  - `PATCH /api/mobile/v1/me/profile`
- Response nen gom:
  - `full_name`, `phone`, `vision_status`, `support_need`, `home_area`
  - `emergency_contacts`
  - `safe_zone` neu server co quan ly safe zone.
- Neu chua co database cho profile, FE nen bo cac field nay thay vi server tra mock.

#### Bo sung settings API hoac bo settings UI

Van de:
- App co settings alert/realtime/vibration/safe zone, nhung server chua co endpoint tuong ung.

Sua toi uu:
- Neu settings la yeu cau bat buoc, them:
  - `GET /api/mobile/v1/me/settings`
  - `PATCH /api/mobile/v1/me/settings`
- Schema de xuat:
  - `alert_enabled: boolean`
  - `realtime_enabled: boolean`
  - `vibration_enabled: boolean`
  - `notify_types: { obstacle: boolean, safety: boolean, battery: boolean }`
- Khong de FE goi cane config endpoint, vi `/api/cane/v1/devices/me/config` danh cho thiet bi gay va dung device secret.

#### Them safe zone vao mobile API neu map can hien vong tron

Van de:
- Map screen can safe zone radius/center, nhung mobile dashboard/location API khong tra safe zone.

Sua toi uu:
- Neu server co quan ly safe zone, tra trong dashboard:
  - `safe_zone: { center: { lat, lng }, radius_m, is_inside }`
- Hoac tra trong `/me/settings` neu safe zone la setting cua user.

Ly do:
- FE khong nen hard-code radius vi se sai voi tung user.

#### Can nhac API realtime

Van de:
- App co dependency `socket.io-client`, nhung document server chua neu websocket/socket endpoint nao.

Sua toi uu:
- Neu server co realtime, document ro:
  - URL ket noi.
  - auth handshake dung bearer hay fingerprint.
  - event names va payload: location update, alert created, device heartbeat.
- Neu server chua co realtime, FE nen dung React Query polling truoc, vi cac endpoint hien co da du cho dashboard/map/alerts.

### 2.3. Khong nen sua server theo mock hien tai

Khong nen doi server de tra cac field mock nhu:
- `items` wrapper cho alerts.
- `createdAt` camelCase thay cho `triggered_at`.
- `read` tren alert.
- `nearestDistanceM`.
- `safeZoneRadiusM` hard-code.
- role "Người giám hộ" tren mobile login.

Ly do:
- Server document dang nhat quan theo snake_case, ISO time, direct array/object.
- Doi server theo mock se lam API kem ro rang va lech voi FastAPI/Pydantic convention hien tai.

## Thu tu sua de thong nhat nhanh nhat

1. Sua app auth: API service, token storage, interceptor, login/refresh/logout, `/me`.
2. Sua app dashboard/alerts/map/account de dung mobile endpoints va mapping field server.
3. Bo hoac disable UI settings/profile ma server chua co du lieu.
4. Server bo sung cac endpoint `me/*` alias va `id` cho `/me`.
5. Neu san pham can profile/settings/safe zone, server bo sung API ro rang; sau do FE moi bat lai cac UI tuong ung.

