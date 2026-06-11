# Review hiện trạng ứng dụng NavicAid

Ngày cập nhật: 10/06/2026

## 1. Phạm vi

Tài liệu này chỉ ghi các thiếu sót còn tồn tại trong repo ứng dụng NavicAid tại thời điểm kiểm tra.

Đã đối chiếu trực tiếp:

- Mã nguồn Expo/React Native trong `app/`, `src/`, `components/` và `hooks/`.
- Cấu hình hiện tại trong `.env`, `app.json` và `package.json`.
- Kết quả `npm run typecheck` và `npm run lint`.

Không đánh giá trạng thái triển khai backend vì source backend không nằm trong workspace hiện tại.

## 2. Kết luận hiện tại

App đã có các luồng chính để demo:

- Đăng nhập, hydrate session, refresh token và đăng xuất.
- Dashboard, bản đồ, danh sách và chi tiết cảnh báo.
- Hộp thư thông báo, badge chưa đọc, đánh dấu đã đọc và pull-to-refresh.
- Hồ sơ, chỉnh sửa hồ sơ, đổi mật khẩu và danh sách thiết bị.
- Polling alert khi app đang mở, local notification và mở chi tiết alert khi bấm notification.
- Đăng ký native push token khi chạy ở chế độ `push`.

App chưa production-ready. Các thiếu sót quan trọng nhất hiện tại là cảnh báo chưa hoạt động đầy đủ khi app chạy nền, chưa có thanh cảnh báo trong app, installation API phía app chỉ gửi fingerprint, auth state có thể lệch sau lỗi refresh và chưa có test tự động.

## 3. Thiếu sót còn tồn tại

### P0 - Cấu hình hiện tại chỉ nhận alert bằng polling foreground

`.env` hiện đặt:

```env
EXPO_PUBLIC_NOTIFICATION_MODE=local-polling
```

Trong chế độ này:

- App gọi `GET /api/mobile/v1/me/alerts?page=1&limit=5` mỗi 12 giây.
- Polling dừng khi app không còn ở trạng thái active.
- Alert mới tạo local notification của hệ điều hành.
- App không đăng ký push token.

Rủi ro:

- Không nhận được alert mới khi app background hoặc đã tắt.
- Có thể bỏ sót nếu hơn 5 alert xuất hiện giữa hai lần poll.
- Lần chạy đầu chỉ lưu alert mới nhất làm mốc và không thông báo các alert đã tồn tại.

Thay đổi phù hợp:

- Dùng push làm kênh chính ở production.
- Giữ polling làm fallback với khoảng thời gian chậm hơn.
- Khi polling, phân trang cho tới khi gặp alert đã biết thay vì chỉ lấy 5 bản ghi.
- Xác minh push thật trên Android/iOS ở foreground, background và terminated.

### P0 - Chưa có thanh cảnh báo nằm trên cùng trong app

App đã có banner notification của hệ điều hành qua `expo-notifications`, nhưng chưa có banner/toast toàn cục được render trong `app/_layout.tsx`.

Hệ quả:

- Khi app đang mở, người dùng vẫn phụ thuộc vào cách hệ điều hành hiển thị notification.
- Không có CTA “Xem chi tiết” hoặc nút đóng ngay trong giao diện NavicAid.
- Không thể ưu tiên và giữ cảnh báo nguy hiểm trên màn hình lâu hơn thông báo thường.

Thay đổi phù hợp:

- Tạo provider quản lý hàng đợi banner ở root layout.
- Hiển thị một banner tại một thời điểm, chống trùng theo `alert_id` hoặc event ID.
- Alert nguy hiểm giữ trên màn hình tới khi người dùng xử lý; thông báo thường tự ẩn sau 4-6 giây.
- Bấm “Xem chi tiết” mở `/alerts/[id]`.
- Không hiển thị banner khi chưa đăng nhập.

Các file dự kiến:

- Tạo `src/notifications/InAppNotificationContext.tsx`.
- Tạo `components/InAppNotificationBanner.tsx`.
- Sửa `app/_layout.tsx`.
- Sửa `src/realtime/useAlertPollingWatcher.ts`.

### P0 - Push mode thiếu listener nhận notification foreground

App đã đăng ký FCM/APNs token trong `usePushNotificationSetup`, nhưng không có `Notifications.addNotificationReceivedListener`.

Hệ quả khi push đến lúc app đang mở:

- Không có logic app-level để hiển thị in-app banner.
- Dashboard, alerts và notification inbox không được invalidate ngay từ push.
- Badge và dữ liệu có thể giữ trạng thái cũ cho tới lần refetch khác.

Thay đổi phù hợp:

- Thêm foreground notification listener ở root.
- Parse payload tại một module dùng chung.
- Invalidate các query liên quan khi nhận push.
- Theo dõi thay đổi push token và đăng ký lại token mới.

### P0 - Installation API phía app chỉ gửi fingerprint

`notificationService.ts` gọi các endpoint notification và push-token bằng `X-Device-Fingerprint`, không dùng HTTP client có Bearer token.

Fingerprint được app tự sinh và lưu trên thiết bị, nhưng không nên được xem là credential xác thực duy nhất.

Thay đổi phù hợp:

- Thống nhất contract với server để yêu cầu JWT hoặc installation secret an toàn.
- Installation secret cần có khả năng rotate và revoke.
- Scope cache notification theo user/installation sau khi contract được thống nhất.

### P0 - Auth state có thể lệch sau lỗi

Hai trường hợp còn tồn tại:

1. `loginMobile()` lưu token trước khi gọi `/me`; nếu `/me` thất bại, token vẫn có thể còn trong storage.
2. Khi Axios interceptor refresh thất bại, token bị xóa nhưng `AuthContext.user` không được xóa ngay.

Thay đổi phù hợp:

- Clear token nếu bước lấy `/me` sau login thất bại.
- Tạo callback/event auth-expired dùng chung giữa HTTP client và `AuthContext`.
- Gom logic refresh token đang lặp ở `authService.ts` và `http.ts`.

### P0 - Chưa có test tự động

Repo chưa có script unit test, integration test, coverage hoặc E2E test. File `src/dev/devAlertService.test-d.ts` chỉ kiểm tra type, không kiểm tra hành vi runtime.

Các luồng cần test trước:

- Login, hydrate session, refresh token đồng thời và refresh thất bại.
- Polling phát hiện alert mới, chống trùng và trường hợp nhiều hơn 5 alert.
- Notification mở đúng alert detail.
- Badge chưa đọc và đánh dấu notification đã đọc.
- Edit profile, đổi mật khẩu và logout offline.

### P0 - Demo credential luôn xuất hiện trên màn hình login

`app/login.tsx` luôn hiển thị:

- `user@example.com`
- `password123`
- Nút điền dữ liệu mẫu.

Thay đổi phù hợp:

- Chỉ render khối demo khi `__DEV__` hoặc một biến môi trường dev rõ ràng được bật.
- Không đóng gói credential mẫu trong production build.

### P1 - Danh sách cảnh báo chưa có pagination và refresh

Màn hình Alerts chỉ tải page đầu tiên với tối đa 20 alert. Bộ lọc chỉ áp dụng trên dữ liệu đã tải.

Thiếu:

- Load-more hoặc infinite query.
- Pull-to-refresh.
- Retry trực tiếp khi lỗi.
- Các chip lọc vẫn dùng tiếng Anh: `All`, `Danger`, `Warn`, `Open`, `Resolved`.

Thay đổi phù hợp:

- Dùng `useInfiniteQuery` hoặc pagination rõ ràng.
- Thêm pull-to-refresh và retry.
- Đổi chip lọc sang tiếng Việt.
- Nếu backend hỗ trợ, gửi filter lên server.

### P1 - Notification inbox chưa tự cập nhật theo vòng đời app

Màn hình notification đã có pull-to-refresh và badge chưa đọc. Tuy nhiên:

- Không có foreground push listener để invalidate query.
- Không refetch rõ ràng khi app trở lại active.
- Không có pagination.
- Query key `["mobile-notifications"]` chưa scope theo user hoặc installation.

Thay đổi phù hợp:

- Invalidate khi nhận push và refetch khi app active.
- Thêm pagination.
- Scope query key theo user/installation.

### P1 - Dashboard chưa có refresh/retry và bỏ qua lỗi device query

Dashboard đã polling mỗi 30 giây và hiển thị thời gian cập nhật. Tuy nhiên:

- Không có pull-to-refresh hoặc nút retry.
- Lỗi `getMobileUserDevices()` không được hiển thị.
- App mặc định dùng `devices[0]` làm thiết bị chính nhưng chưa thể hiện quy tắc nghiệp vụ.

Thay đổi phù hợp:

- Thêm pull-to-refresh/retry.
- Hiển thị trạng thái lỗi thiết bị độc lập với lỗi dashboard.
- Xác định thiết bị chính từ server hoặc cho người dùng chọn.

### P1 - Bản đồ còn giới hạn về trải nghiệm dữ liệu

Map đã có fallback khi location API lỗi, hiển thị thời gian cập nhật và fallback UI trên web. Các thiếu sót còn lại:

- Controlled `region` có thể kéo bản đồ về vị trí server sau mỗi lần refetch.
- Chỉ hiển thị vị trí mới nhất dù API type có `accuracy`, `speed` và `heading`.
- Chưa có lịch sử di chuyển hoặc marker alert.
- Chưa cảnh báo rõ khi tọa độ đã quá cũ.

Thay đổi phù hợp:

- Dùng `initialRegion` hoặc chỉ animate camera khi người dùng yêu cầu.
- Hiển thị độ chính xác và trạng thái dữ liệu cũ.
- Bổ sung lịch sử/marker alert nếu thuộc phạm vi sản phẩm.

### P1 - Settings còn nội dung chưa hoạt động

Settings đã đánh dấu “Bật cảnh báo” và “Rung khi cảnh báo” là “Sắp hỗ trợ”, nhưng vẫn còn:

- “Thông báo đẩy” chỉ là thông tin tĩnh, không phản ánh permission hoặc mode hiện tại.
- “Thông tin ứng dụng” là row tĩnh, không thể mở.

Thay đổi phù hợp:

- Hiển thị notification mode, permission và trạng thái đăng ký push token thực tế.
- Cho phép mở Settings hệ điều hành khi permission bị từ chối.
- Tạo trang thông tin ứng dụng hoặc bỏ row khỏi release.

### P2 - Còn starter code, tài liệu và dependency dư

Các phần chưa được luồng app chính sử dụng:

- `app/modal.tsx` và route modal.
- Nhóm component/hook starter Expo trong `components/themed-*`, `components/ui/`, `hooks/use-*`.
- `src/mock/`.
- `src/api/health.ts`.
- `API document copy.md` trùng gần như toàn bộ với `API document.md`.
- `react-native-paper` và `react-native-vector-icons` không có import trực tiếp trong source hiện tại.

Ngoài ra, `README.md` vẫn chủ yếu là nội dung starter Expo.

Chỉ xóa sau khi chạy lại typecheck, lint và build Android/iOS.

## 4. Thứ tự triển khai đề xuất

1. Sửa auth lifecycle và ẩn demo credential khỏi production.
2. Thêm in-app banner, foreground notification listener và invalidate query.
3. Xác minh push production, giữ polling làm fallback an toàn.
4. Cứng hóa installation authentication.
5. Thêm test cho auth, alert và notification.
6. Thêm pagination/refresh cho alerts và notification inbox.
7. Hoàn thiện Dashboard, Map, Settings và dọn starter code.

## 5. Tiêu chí production-ready

- Alert đến được khi app foreground, background và terminated.
- App foreground hiển thị thanh cảnh báo toàn cục và mở đúng chi tiết.
- Không bỏ sót hoặc hiển thị trùng alert.
- Auth expiry luôn xóa session UI và đưa người dùng về login.
- Installation API không dựa duy nhất vào fingerprint.
- Không còn demo credential trong production.
- Alerts và notifications có pagination.
- Có unit, integration và E2E test cho các luồng chính.
- Typecheck, lint, Android/iOS build và smoke test với server thật đều đạt.
