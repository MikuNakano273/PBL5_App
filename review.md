# Review muc do hoan thien App va Server API

Pham vi review:
- App Expo/React Native trong repo hien tai.
- Hop dong server trong `API document copy.md`.
- Khong co source backend trong pham vi review, vi vay danh gia server chi xac nhan do day du va tinh logic cua API document, khong xac nhan implementation, database, test hay deployment thuc te.

Nguon chuan cho app mobile la `API document copy.md`. App moi dung `id` tu `/me` va cac endpoint current-user `/dashboard/me`, `/me/devices`, `/me/locations`, `/me/alerts`.

## 1. Tong quan muc do hoan thien

### 1.1. App mobile

Uoc tinh:
- Luong nghiep vu cot loi: khoang 80%.
- Muc san sang production: khoang 55-60%.
- Tong the: khoang 70%.

Da hoan thanh:
- Login mobile dung API that, gui fingerprint/device/platform.
- Luu access token va refresh token bang SecureStore tren mobile.
- Axios interceptor gan bearer token, refresh token rotation khi gap `401`.
- Hydrate phien dang nhap va navigation guard.
- Dashboard, devices, locations, alerts, account va notifications dung API that.
- Da chuyen cac API current-user sang `/dashboard/me` va `/me/*`.
- Notification co danh sach, filter, badge unread va mark-read that.
- Logout goi server va xoa token local.
- Cac man hinh chinh co loading, empty va error state co ban.

Chua dat production-ready:
- Chua co test runner, unit test, integration test hoac E2E test.
- Chua co push token registration thuc te.
- Chua co multi-account UI/flow.
- Chua co UI sua profile va doi mat khau du API da co.
- Settings hien chu yeu la placeholder.
- Chua co realtime contract; app dang polling.
- Con code mock va dependency realtime khong su dung.
- Mot so query/error flow va nut UI chua hoan chinh.

### 1.2. Server API theo document

Uoc tinh:
- API cho luong mobile cot loi: khoang 80%.
- API cho toan bo san pham end-to-end: khoang 65-70%.
- Chat luong document/contract: khoang 70%.

Da co nen tang tot:
- Tach ro Mobile, Admin, Cane va Internal Worker API.
- Mobile auth co access/refresh/logout, refresh rotation va rate limit.
- Co alias current-user de app khong tu truyen `user_id`.
- Co dashboard, devices, locations, alerts, notifications va push token.
- Co cane telemetry, GPS, heartbeat, image request va worker vision result.
- Error nghiep vu co format tuong doi nhat quan.

Con thieu hoac chua logic:
- Chua co API preferences/settings cho cac tuy chon dang hien tren app.
- Chua co contract realtime WebSocket/SSE.
- API list co `page/limit` nhung response chi la array, khong co pagination metadata.
- Installation API chi dua vao fingerprint va khong dung JWT; day la diem security can xem lai.
- Push token chi co upsert/dang ky, chua co unregister/revoke.
- Multi-account switch token flow chua mo ta day du security va session behavior.
- Document co nhieu diem lech voi app Expo va mot so loi format/cau hinh.

## 2. Danh gia va viec can sua o App

### 2.1. Auth va HTTP client

Trang thai: co ban da hoan thanh.

Dang phu hop:
- `src/api/http.ts` doc `EXPO_PUBLIC_API_BASE_URL`.
- Request authenticated tu dong gan bearer token.
- Cac request `401` duoc refresh mot lan; cac request dong thoi dung chung `refreshPromise`.
- Refresh token moi duoc luu sau rotation.
- Token duoc luu bang SecureStore tren mobile va localStorage tren web.
- Login tao fingerprint ben vung va goi `/me` sau khi nhan token.

Thieu sot/can sua:
- Khi refresh fail, interceptor xoa token nhung khong thong bao truc tiep cho `AuthContext` de xoa `user`. UI co the van coi la authenticated cho toi khi reload hoac mot auth flow khac chay.
- Login luu token truoc khi goi `/me`. Neu `/me` fail, `loginMobile` nem loi nhung token da luu co the con ton tai.
- `refreshMobileToken()` va logic refresh trong interceptor dang trung lap.
- Cac auth request dung raw `axios`, moi service tu khai bao timeout/header rieng.
- Chua co test cho concurrent refresh, refresh fail, logout offline va hydrate token het han.

De xuat:
- Tao mot auth-expired event/callback de interceptor co the dua app ve login ngay khi refresh fail.
- Neu `/me` fail sau login, clear token truoc khi tra loi.
- Gom refresh logic vao mot ham duy nhat.
- Them test cho token lifecycle truoc khi mo rong tinh nang.

### 2.2. Login screen

Trang thai: hoan thanh cho demo va luong login co ban.

Dang phu hop:
- Goi mobile login API that.
- Co validation rong, loading state va error message.
- Demo credential trung voi seed data trong document.

Thieu sot/can sua:
- Demo email/password dang hard-code trong production UI.
- Chua co forgot-password API/flow.
- Chua co thong bao ro khi tai khoan bi inactive/forbidden.
- Chua co rate-limit UX cho `429`.

De xuat:
- Chi hien demo credential trong dev build.
- Mapping ro `403`, `429`, network timeout.
- Neu san pham can khoi phuc mat khau, server phai bo sung API truoc.

### 2.3. Dashboard

Trang thai: da ket noi API that, hoan thanh phan hien thi cot loi.

Dang phu hop:
- Goi `/api/mobile/v1/dashboard/me` va `/api/mobile/v1/me/devices`.
- Mapping safety status, nearest distance, today alert count, device status va recent alerts.
- Poll dashboard moi 30 giay.

Thieu sot/can sua:
- Nut `Chi tiet` dang co `onPress={() => {}}`, tao cam giac co chuc nang nhung khong lam gi.
- Query devices khong xu ly error rieng; dashboard co the hien trang thai thiet bi sai/le fallback ma khong thong bao.
- Recent alert card khong mo alert detail du server da co `GET /api/mobile/v1/alerts/{alert_id}`.
- Chi lay device dau tien de hien status; logic khong ro khi user co nhieu thiet bi.
- Chua co pull-to-refresh hoac nut retry.

De xuat:
- Noi `Chi tiet` va alert card toi alert detail, hoac bo nut cho toi khi co man hinh.
- Dinh nghia ro primary device hoac hien tong hop nhieu device.
- Them error/retry cho devices.

### 2.4. Alerts

Trang thai: da ket noi API that, hoan thanh danh sach va filter local co ban.

Dang phu hop:
- Goi `/api/mobile/v1/me/alerts?page=1&limit=20`.
- Hien title, message, type, status, distance va triggered time.
- Khong nham alert read-state voi notification read-state.

Thieu sot/can sua:
- App chi tai page 1, limit 20; khong co infinite scroll/load-more.
- Filter chi loc tren 20 item da tai, khong dai dien toan bo lich su.
- Alert card khong mo endpoint detail.
- Chua hien toa do alert du response co `lat/lng`.
- Chua co pull-to-refresh, retry hoac refetch interval.
- UI filter dang tron tieng Anh va tieng Viet.

De xuat:
- Them pagination UI/infinite query.
- Them alert detail va hanh dong xem vi tri alert tren map.
- Chuan hoa ngon ngu UI.

### 2.5. Map

Trang thai: da ket noi API that cho vi tri hien tai va safety summary.

Dang phu hop:
- Goi `/api/mobile/v1/me/locations?limit=1` va `/dashboard/me`.
- Xu ly dung GeoJSON `[lng, lat]`.
- Fallback sang `dashboard.last_location`.
- Poll moi 10 giay.

Thieu sot/can sua:
- Map chi hien vi tri hien tai; khong co lich su duong di.
- Khong co marker/toa do vat can hoac nguy co gan nhat.
- Khong co safe zone.
- Web chi hien fallback, khong co map web.
- Polling 10 giay co the ton pin/data va tao tai server neu nhieu user.
- Khong hien accuracy/speed/heading du location response co san.

Phan bi chan boi server:
- Server chua co endpoint nguy co/vat can co toa do.
- Server chua co safe-zone model/API.
- Server chua co realtime contract.

De xuat:
- App hien them accuracy/speed/heading neu co gia tri.
- Neu can route history, tai nhieu location va ve polyline.
- Server bo sung safe zone va realtime neu day la yeu cau san pham.

### 2.6. Account

Trang thai: da ket noi API that cho profile co ban va devices.

Dang phu hop:
- Goi `/api/mobile/v1/me` va `/api/mobile/v1/me/devices`.
- Hien full name, email, phone, role, status va thong tin thiet bi.

Thieu sot/can sua:
- Chua co UI sua `full_name`/`phone` du server da co `PATCH /me`.
- Chua co UI doi mat khau du server da co `/me/change-password`.
- Chua hien serial number, firmware version hoac owner info du response device co san.
- Chua co primary-device selection neu co nhieu device.
- Khong co profile nghiep vu nhu vision status/emergency contacts; server cung chua co.

De xuat:
- Uu tien lam edit profile va change password vi khong can server API moi.
- Chi bo sung profile mo rong neu co yeu cau san pham va schema server ro rang.

### 2.7. Notifications va installation

Trang thai: notifications va mark-read da hoan thanh co ban.

Dang phu hop:
- Goi installation notification API bang `X-Device-Fingerprint`.
- Co tab badge, filter read/unread, pull-to-refresh va mark-read.

Thieu sot/can sua:
- App chua goi `POST /installations/me/push-token`, nen chua nhan push notification that khi app background/offline.
- App chua co flow `accounts` va `switch-account`.
- Notification query key khong scope theo fingerprint/user. Logout co clear cache, nhung flow switch-account sau nay phai invalidate/cache lai can than.
- Notification service dung raw axios va lap lai header/timeout/error handling.
- Notification card co `alert_id` nhung chua mo alert detail.
- Chua co pagination cho notification list.

De xuat:
- Tich hop Expo Notifications/FCM va push-token registration.
- Them service chung cho installation API.
- Scope query key theo installation/fingerprint va clear cache khi switch account.

### 2.8. Settings va cac vung UI placeholder

Trang thai: chua hoan thanh.

Chua phu hop:
- `Bat canh bao`, `Thong bao real-time`, `Rung khi canh bao` chi hien `Sap ho tro`; server chua co settings API.
- `Thong tin ung dung` la Pressable nhung khong co `onPress`.
- Dashboard `Chi tiet` khong co hanh dong.
- `app/modal.tsx` van la placeholder mac dinh cua Expo.

De xuat app:
- Disable ro rang cac row chua co API, hoac bo khoi ban release.
- Lam trang thong tin ung dung local, khong can server.
- Xoa modal placeholder neu khong su dung.

De xuat server neu settings la yeu cau:
- Them `GET/PATCH /api/mobile/v1/me/settings`.
- Schema toi thieu: `alert_enabled`, `realtime_enabled`, `vibration_enabled`, `notify_types`.

### 2.9. Chat luong code va kiem thu

Trang thai: chua dat yeu cau production.

Thieu sot/can sua:
- `package.json` khong co script `test` hoac `test:coverage`.
- Khong co unit/integration/E2E test.
- `src/mock/` khong con duoc app su dung nhung van ton tai.
- `socket.io-client` dang cai nhung khong duoc su dung.
- Type API phan lon khai bao field optional, co the che mat contract server bi thieu field.
- Chua co schema validation runtime cho response API.
- Chua co monitoring/crash reporting.

De xuat:
- Them Vitest/Jest cho pure mapping va auth/token flow.
- Them integration test cho service voi mocked HTTP.
- Them Playwright/Expo E2E cho login -> dashboard -> logout.
- Xoa mock/dependency khong dung sau khi xac nhan khong can fallback.
- Can nhac Zod cho response quan trong neu backend chua on dinh.

## 3. Danh gia va viec can sua o Server API

### 3.1. Phan nen giu nguyen

- Base path va versioning `/api/mobile/v1`, `/api/admin/v1`, `/api/cane/v1`, `/api/internal/v1`.
- Tach auth theo mobile/admin/cane/worker.
- Refresh token rotation va logout revoke token.
- Alias current-user `/dashboard/me` va `/me/*`.
- Error nghiep vu `{ error: { code, message, details } }`.
- Time theo ISO 8601 va JSON snake_case.
- Cane telemetry/image request tach khoi mobile FE.

### 3.2. Security cua Installation API

Van de:
- Document noi installation endpoints khong dung JWT, chi dung `X-Device-Fingerprint`.
- Fingerprint do client tao va gui, khong phai secret manh. Neu bi lo, attacker co the doc notifications, mark-read, xem accounts, switch account hoac thay push token.
- `switch-account` tra access/refresh token chi dua tren installation account id + fingerprint la rui ro cao neu khong co co che proof/reauth khac.

Can sua:
- Bat buoc JWT cho cac installation action nhay cam, toi thieu `accounts`, `switch-account`, `push-token`.
- Hoac phat installation secret/token co entropy cao va rotate/revoke duoc; khong coi fingerprint la credential.
- Switch-account nen yeu cau re-auth, PIN, refresh token hop le, hoac proof ro rang.
- Document ro authorization matrix cho tung endpoint.

### 3.3. Pagination va collection contract

Van de:
- Alerts/admin list co `page/limit` nhung response chi la array.
- Notifications va locations khong co cursor/page metadata.
- FE khong biet con du lieu hay khong, tong so ban ghi, hay cach load trang tiep.

Can sua:
- Chon mot contract pagination nhat quan:
  - `{ items, page, limit, total, has_next }`, hoac
  - cursor-based `{ items, next_cursor }`.
- Neu giu direct array, document ro quy tac `length < limit` va thu tu sort.
- Document default sort cho alerts, locations, notifications, users va devices.

### 3.4. Settings, profile va safe zone

Van de:
- App co nhu cau bat/tat alert, realtime, vibration.
- Map/product co the can safe zone va emergency contacts.
- API hien tai chi co profile co ban.

Can sua neu day la requirement that:
- `GET/PATCH /api/mobile/v1/me/settings`.
- `GET/PATCH /api/mobile/v1/me/profile` hoac mo rong `/me` co kiem soat.
- Safe zone resource ro rang, vi du `/api/mobile/v1/me/safe-zone`.
- Emergency contacts resource rieng neu co nghiep vu.

Khong nen:
- Tra mock field de chieu theo UI khi chua co database/business rule.
- De FE hard-code safe-zone radius hoac preference.

### 3.5. Realtime va push lifecycle

Van de:
- Document khong co WebSocket/SSE contract.
- Push token chi co POST dang ky, khong co unregister.
- Khong mo ta token replacement, multiple token, logout cleanup hay token het han.

Can sua:
- Neu can realtime, document auth handshake, reconnect, event name va payload:
  - `location.updated`
  - `alert.created`
  - `device.status_changed`
  - `notification.created`
- Them unregister/revoke push token.
- Document mot installation co bao nhieu push token va xu ly token invalid.
- Neu chua lam realtime, ghi ro polling interval/rate-limit khuyen nghi.

### 3.6. Alert va dashboard semantics

Van de:
- `is_safe` va `current_safety_status` co the mau thuan; document chua noi field nao la authoritative.
- Risk vocabulary xuat hien `safe`, `warning`, `caution`, `danger`, `high`; chua co enum chuan.
- Alert co `status`, `resolved_at` nhung mobile API khong co action resolve; khong ro ai duoc resolve.
- Dashboard `recent_alerts` la subset cua alert nhung schema ngan hon; document khong noi so luong va sort.
- Alert co `lat/lng`, nhung khong ro nullable khi cane chua co GPS.

Can sua:
- Chuan hoa enum safety/risk/status va document transition.
- Xac dinh authoritative field giua `is_safe` va `current_safety_status`.
- Document ai/endpoint nao resolve alert.
- Document limit/sort cua `recent_alerts`.
- Danh dau nullable field ro rang trong schema/OpenAPI.

### 3.7. Cane image upload va worker

Van de:
- Presigned `upload_url` co the chua hostname noi bo `minio`, thiet bi ngoai Docker khong truy cap duoc.
- Flow upload chua noi ro thiet bi PUT file xong thi server biet luc nao de queue/process.
- Internal Worker API yeu cau `INTERNAL_WORKER_TOKEN`, nhung phan `.env` dau document khong liet ke bien nay.
- Worker request gui `risk_level`/`summary_text`, nhung server derive lai; hai field request de gay hieu nham.

Can sua:
- Cau hinh public MinIO endpoint/proxy cho presigned URL.
- Document day du chuoi: create request -> get URL -> upload -> confirm/queue -> result.
- Liet ke `INTERNAL_WORKER_TOKEN` trong phan env bat buoc.
- Bo field worker request bi ignore, hoac ghi ro chi la hint va server khong tin tuong.

### 3.8. API document can sua

Van de cu the:
- Document danh cho Expo/mobile nhung phan env va code mau dung `VITE_API_BASE_URL`/`import.meta.env`; app hien tai dung `EXPO_PUBLIC_API_BASE_URL`.
- Co block code markdown ` ```env ` bi lap trong phan cau hinh dien thoai.
- Phan env dau file khong co `INTERNAL_WORKER_TOKEN` du internal API yeu cau.
- Chua co OpenAPI schema/enum/nullable detail day du trong tai lieu viet tay.
- Chua ghi response status code cho tung endpoint.
- Chua ghi pagination sort/order va idempotency.
- Chua document rate limit cho mobile read APIs, installation API va admin list.

Can sua:
- Them rieng huong dan Expo:
  - `EXPO_PUBLIC_API_BASE_URL=http://...`
- Sua markdown va dong bo vi du voi app hien tai.
- Bo sung bang endpoint gom auth, request, response, status code, rate limit.
- Xem OpenAPI generated la nguon schema chinh; tai lieu viet tay tap trung vao flow va business rule.

## 4. Diem chua logic giua App va Server

1. App co Settings UI nhung server khong co settings API.
2. App co dependency Socket.IO nhung server khong co realtime contract; app thuc te dang polling.
3. App can push notification production nhung chua register push token; server cung chua co unregister lifecycle.
4. Installation API cho phep action nhay cam bang fingerprint, trong khi fingerprint khong phai credential an toan.
5. API co pagination params nhung response khong giup app biet trang tiep.
6. Server co edit profile/change password/alert detail nhung app chua co UI su dung.
7. Map muon mo rong nguy co/safe zone nhung server chua co du lieu toa do nguy co/safe-zone contract.
8. Server risk/safety vocabulary chua chuan hoa, app dang phai map nhieu gia tri dong nghia.

## 5. Thu tu sua de hoan thien

### P0 - Can lam truoc demo tich hop on dinh

1. Test end-to-end voi server that: login, refresh, dashboard, map, alerts, notifications, logout.
2. Sua auth fail flow: clear token khi `/me` fail va dua UI ve login khi refresh fail.
3. Sua security installation API, dac biet switch-account va push-token.
4. Chuan hoa risk/safety/status enum va nullable contract.
5. Sua API document dung `EXPO_PUBLIC_API_BASE_URL`, env worker token va markdown.

### P1 - Hoan thien tinh nang mobile cot loi

1. Them alert detail va navigation tu dashboard/alerts/notifications.
2. Them pagination/load-more cho alerts va notifications.
3. Lam edit profile va change password bang API da co.
4. Dang ky/unregister push token.
5. Them retry/pull-to-refresh/error state dong nhat.
6. Them test runner, unit/integration/E2E test.

### P2 - Mo rong san pham

1. Settings/preferences API va UI.
2. Realtime WebSocket/SSE hoac chuan hoa polling policy.
3. Multi-account flow an toan.
4. Safe zone, emergency contacts va profile mo rong neu co requirement.
5. Location history/polyline va obstacle/geospatial data neu backend co du lieu.

## 6. Tieu chi de coi la hoan thanh

App:
- Tat ca nut visible co hanh dong hoac duoc disable ro rang.
- Khong con mock/dependency khong dung trong production bundle.
- Login/refresh/logout/push/switch-account co test.
- Cac list dai co pagination.
- Error/loading/empty/retry nhat quan.
- Co E2E cho luong mobile chinh.

Server/API:
- Installation actions nhay cam co authorization an toan.
- Enum, nullable, status transition va pagination duoc document ro.
- Push token co day du register/unregister lifecycle.
- Presigned upload URL truy cap duoc tu thiet bi that.
- OpenAPI va tai lieu viet tay dong bo.
- Co integration test cho mobile, cane, worker va admin flow.
