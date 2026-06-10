# Tổng kiểm tra cuối ứng dụng NavicAid

Ngày kiểm tra: 10/06/2026

## 1. Phạm vi và kết luận nhanh

Phạm vi kiểm tra:

- Ứng dụng Expo/React Native trong repo `NavicAid`.
- Luồng đăng nhập, HTTP client, dashboard, bản đồ, cảnh báo, thông báo, tài khoản và Settings.
- Luồng notification/push có đối chiếu trực tiếp với source backend trong repo `PBL5_Server`.
- Chạy typecheck, lint, Android production bundle, kiểm tra secret và rà mã không còn sử dụng.

Kết luận:

- Ứng dụng đã đủ tốt để demo tích hợp và kiểm thử với người dùng nội bộ.
- Các luồng chính đã có: đăng nhập, refresh token, dashboard, vị trí, danh sách/chi tiết cảnh báo, hộp thư thông báo, chỉnh sửa hồ sơ, đổi mật khẩu, logout và dev test alert.
- Ứng dụng chưa production-ready vì notification/push chưa hoàn chỉnh end-to-end, installation API chưa an toàn, chưa có test suite, chưa có pagination và còn nhiều mã starter/placeholder.
- Ước tính mức hoàn thiện:
  - Demo chức năng: khoảng **85%**.
  - Sẵn sàng production: khoảng **60%**.

## 2. Kết quả kiểm tra kỹ thuật

Đã chạy:

- `npm run typecheck`: đạt.
- `npm run lint`: đạt.
- `npx expo export --platform android`: đạt, Android bundle tạo thành công.
- `git diff --check`: đạt.
- Kiểm tra file secret được Git theo dõi: `.env` không được track.

Chưa xác minh được:

- `npm audit` và `expo-doctor` không chạy xong vì môi trường hiện tại không truy cập được `registry.npmjs.org`.
- Repo chưa có script `test`, `test:coverage` hoặc E2E test.

Lưu ý trạng thái worktree:

- Hiện có thay đổi chưa commit ở `README.md`, `app/(tabs)/settings.tsx` và `src/dev/`.

## 3. Các vấn đề cần ưu tiên

### P0 - Notification/push chưa hoạt động end-to-end

Đây là vấn đề lớn nhất của hệ thống hiện tại.

App có ba chế độ:

- `local-polling`: poll alert từ server rồi tạo local notification.
- `push`: đăng ký FCM/APNs token để chờ server gửi push.
- `off`: tắt notification runtime.

Cấu hình `.env` hiện tại đang dùng:

```env
EXPO_PUBLIC_NOTIFICATION_MODE=local-polling
```

Do đó, trên thiết bị hiện tại:

- App poll `GET /api/mobile/v1/me/alerts?page=1&limit=5` mỗi 12 giây.
- Polling chỉ chạy khi app ở foreground.
- Khi phát hiện alert mới, app gọi `showAlertLocalNotification`.
- Khi bấm notification local, app mở `/alerts/{alert_id}`.
- App không đăng ký push token trong mode này.

Trong mode production mặc định `push`:

- App xin quyền notification.
- App lấy native FCM/APNs token.
- App gửi token tới `POST /api/mobile/v1/installations/me/push-token`.
- Tuy nhiên backend `PushNotificationService.send()` hiện chỉ trả về object mô phỏng `sent: true`, chưa gọi FCM hoặc APNs thật.
- `AlertService` chỉ tạo alert và cập nhật live status, không phát push event.
- Backend còn chủ động từ chối lưu `alert_created` vào notification inbox.

Kết luận:

- Alert hiện được nhận đáng tin cậy nhất qua polling khi app đang mở.
- Alert chưa thể đến thiết bị khi app background/offline bằng push thật.
- Notification inbox hiện dành cho system/account/announcement event, không phải alert.

### P0 - Installation API chỉ xác thực bằng fingerprint

Các endpoint sau chỉ dùng `X-Device-Fingerprint`, không dùng mobile JWT:

- Xem notification inbox.
- Mark notification read.
- Đăng ký/thay push token.
- Xem danh sách account trên installation.
- Switch account và nhận access/refresh token mới.

Fingerprint được app tự sinh và lưu trên thiết bị, nhưng không phải credential bí mật đủ mạnh. Nếu fingerprint bị lộ, người khác có thể truy cập inbox, thay push token hoặc nghiêm trọng hơn là switch account.

Khuyến nghị:

- Bắt buộc mobile JWT cho inbox, mark-read và push-token.
- Với switch-account, bắt buộc re-authentication, PIN hoặc installation secret có entropy cao, có rotate/revoke.
- Không dùng fingerprint như bằng chứng xác thực duy nhất.

### P0 - Chưa có test suite

Repo chưa có unit test, integration test hoặc E2E test. Typecheck và lint không kiểm chứng được hành vi runtime.

Những luồng cần test trước:

- Login thành công/thất bại, hydrate session, refresh token đồng thời.
- Refresh thất bại phải đưa người dùng về login.
- Logout online/offline.
- Polling phát hiện alert mới, không phát trùng và không bỏ sót.
- Push/local notification mở đúng alert detail.
- Notification mark-read và badge unread.
- Edit profile và change password.

### P1 - Auth lifecycle còn hai lỗ hổng logic

1. `loginMobile()` lưu token trước khi gọi `/me`. Nếu `/me` thất bại, token có thể vẫn còn trong storage dù login UI báo lỗi.
2. Khi Axios interceptor refresh thất bại, token bị xóa nhưng `AuthContext.user` chưa được xóa ngay. UI có thể tạm thời vẫn nghĩ người dùng đang đăng nhập.

Khuyến nghị:

- Clear token nếu `/me` thất bại sau login.
- Tạo auth-expired callback/event dùng chung giữa HTTP client và `AuthContext`.
- Gom logic refresh token đang bị lặp giữa `authService.ts` và `http.ts`.

### P1 - Polling alert có thể bỏ sót dữ liệu

Polling hiện chỉ lấy 5 alert mới nhất mỗi 12 giây.

Rủi ro:

- Nếu có hơn 5 alert mới giữa hai lần poll, app có thể bỏ sót alert cũ hơn.
- Polling chỉ hoạt động khi app foreground.
- Polling 12 giây trên nhiều thiết bị tạo tải server và tiêu thụ pin/data.
- Lần khởi động đầu chỉ lưu baseline, không thông báo alert đã có trước đó.

Polling phù hợp làm fallback/dev mode, không nên là cơ chế production chính.

### P1 - Notification inbox không tự cập nhật khi push đến

Notification inbox dùng React Query nhưng không có:

- `refetchInterval`.
- Listener nhận notification để invalidate query.
- Pagination.

Badge tab và danh sách có thể cũ cho tới khi query được refetch hoặc người dùng pull-to-refresh.

### P1 - Contract notification giữa app, tài liệu và server đang lệch

App và API document vẫn định nghĩa notification event có:

- `alert_id`
- `risk_level`

Nhưng server hiện lọc bỏ mọi event có `alert_id`, `risk_level` hoặc `event_type=alert_created` khỏi inbox.

Server event thực tế thiên về:

- `event_type`
- `category`
- `priority`
- `title`
- `message`

Cần thống nhất lại type và tài liệu để app không hiển thị logic alert cho một inbox chỉ chứa system notification.

## 4. Đánh giá từng khu vực

### Auth và HTTP client

Điểm tốt:

- Token được lưu bằng SecureStore trên Android/iOS.
- Bearer token tự động được gắn vào mobile API.
- Có refresh token rotation và khóa `refreshPromise` để tránh refresh đồng thời.
- Có normalize error chung.
- Logout luôn clear token local.

Cần cải thiện:

- Sửa auth lifecycle như mục P1.
- Không hiển thị demo password trong production.
- Web dùng localStorage cho token, cần cân nhắc nếu web trở thành target production.
- Thêm runtime schema validation cho response quan trọng.

### Dashboard

Điểm tốt:

- Hiển thị safety status, thiết bị, khoảng cách và alert gần đây.
- Alert gần đây mở được màn hình chi tiết.
- Có polling dashboard mỗi 30 giây.

Cần cải thiện:

- Không có pull-to-refresh/retry trực tiếp.
- Device query lỗi nhưng dashboard không báo rõ.
- Chỉ lấy thiết bị đầu tiên làm thiết bị chính mà chưa có quy tắc nghiệp vụ.
- Màn hình còn nhiều khoảng trống và chưa nhấn mạnh hành động khẩn cấp.

### Alerts

Điểm tốt:

- Có danh sách, lọc local và màn hình chi tiết.
- Hiển thị risk, trạng thái, khoảng cách, tọa độ và thời gian.

Cần cải thiện:

- Chỉ tải page đầu tiên, tối đa 20 alert.
- Filter chỉ áp dụng trên 20 alert đã tải.
- Chưa có pull-to-refresh hoặc load-more.
- Filter đang dùng tiếng Anh trong UI tiếng Việt.
- Nên thêm nút “Xem trên bản đồ” khi alert có tọa độ.

### Map

Điểm tốt:

- Đọc đúng tọa độ thường và GeoJSON.
- Có fallback từ location sang dashboard.
- Có kiểm tra tọa độ hợp lệ.

Cần cải thiện:

- Poll mỗi 10 giây, chưa tối ưu cho production.
- Chưa có lịch sử di chuyển, accuracy, speed, heading hoặc alert marker.
- Web bundle hiện bị chặn bởi `react-native-maps` native-only.
- Controlled `region` có thể làm trải nghiệm pan/zoom bị reset khi query cập nhật.

### Account

Điểm tốt:

- Đã có profile, danh sách device, edit profile và đổi mật khẩu.
- Đổi mật khẩu xong buộc đăng nhập lại.
- Các form có validation và error state tương đối tốt.

Cần cải thiện:

- Cần test validation và auth expiry.
- Cần hiển thị thêm serial/firmware nếu có giá trị sử dụng thực tế.
- Các màn hình account khá dài, nên tách component dùng chung.

### Settings

Điểm tốt:

- Logout thật.
- Có dev-only test alert.
- Nút dev được ẩn mặc định trong production nếu không bật env.

Cần cải thiện:

- “Bật cảnh báo” và “Rung khi cảnh báo” vẫn là placeholder.
- “Thông tin ứng dụng” chỉ là row tĩnh.
- “Thông báo đẩy” trông như setting nhưng không thể thao tác và không phản ánh permission/mode thực tế.
- Backend hiện chưa có route `/api/mobile/v1/dev/test-alert`, nên nút dev sẽ fallback sang alert mock local.

Đề xuất:

- Nếu chưa có settings API, xóa hai placeholder khỏi bản release.
- Hiển thị trạng thái notification thực: mode, permission, push token đã đăng ký/chưa đăng ký.
- Tạo trang “Thông tin ứng dụng” có version, build number, API environment và chính sách quyền riêng tư.

## 5. Phương án notification tốt nhất

### Kiến trúc đề xuất

Giữ alert và notification inbox là hai domain riêng:

- **Alert**: sự kiện an toàn từ gậy, đọc qua Alert API.
- **Notification inbox**: thông báo hệ thống, tài khoản, bảo trì, announcement.

Khi server tạo alert:

1. Lưu alert vào database.
2. Commit transaction hoặc hoàn tất persistence.
3. Đẩy một job `send_alert_push` vào queue.
4. Worker gửi FCM/APNs thật tới các installation của user.
5. Push payload chỉ mang dữ liệu điều hướng tối thiểu:

```json
{
  "type": "alert.created",
  "alert_id": "alert-id",
  "risk_level": "high"
}
```

6. Khi app nhận push:
   - Hiển thị notification hệ điều hành.
   - Invalidate `mobile-dashboard`, `mobile-alerts` và alert detail liên quan.
   - Khi người dùng bấm, mở màn hình chi tiết alert.
7. Giữ polling với khoảng thời gian chậm hơn như 60-120 giây hoặc chỉ chạy khi push không khả dụng, dùng làm cơ chế phục hồi.

### Việc cần bổ sung ở app

- Thêm listener nhận notification foreground để invalidate query ngay.
- Thêm listener theo dõi push token thay đổi và đăng ký lại.
- Thêm unregister/revoke push token khi logout hoặc installation bị thu hồi.
- Hiển thị trạng thái permission và hướng dẫn mở Settings hệ điều hành khi permission bị từ chối.
- Scope query key theo user/installation khi triển khai multi-account.
- Không yêu cầu quyền notification lặp lại trong nhiều service.

### Việc cần bổ sung ở server

- Thay `PushNotificationService` stub bằng FCM Admin SDK/APNs provider thật.
- Gửi push alert từ queue, không gửi đồng bộ trong request tạo alert.
- Retry có exponential backoff và dead-letter handling.
- Xóa/revoke token invalid do FCM/APNs trả về.
- Có idempotency/dedup để không gửi push trùng.
- Có metrics: số push gửi, thành công, thất bại, latency.
- Bảo vệ push-token endpoint bằng JWT/installation credential an toàn.

Đây là phương án tốt hơn polling vì nhận được alert khi app background/offline, giảm tải API và giảm tiêu thụ pin.

## 6. Gợi ý thay đổi giao diện

### Ưu tiên trải nghiệm an toàn

- Dashboard nên có một khối trạng thái lớn, dễ đọc: “An toàn / Cần chú ý / Nguy hiểm”.
- Khi nguy hiểm, dùng màu và CTA rõ: “Xem cảnh báo mới nhất”, “Xem vị trí”.
- Hiển thị “Lần cuối thiết bị kết nối” nổi bật để tránh hiểu nhầm dữ liệu cũ là dữ liệu hiện tại.

### Chuẩn hóa ngôn ngữ

Đổi toàn bộ tab và filter sang tiếng Việt:

- Dashboard → Tổng quan.
- Map → Bản đồ.
- Alerts → Cảnh báo.
- Settings → Cài đặt.
- All/Danger/Warn/Open/Resolved → Tất cả/Nguy hiểm/Cảnh báo/Đang mở/Đã xử lý.

### Giảm số tab

Năm tab hiện hơi dày. Có thể giữ bốn tab:

- Tổng quan.
- Bản đồ.
- Cảnh báo.
- Tài khoản.

Đưa notification inbox và Settings vào màn hình Tài khoản hoặc icon trên header. Nếu notification là chức năng quan trọng, giữ tab notification nhưng đưa Settings vào Account.

### Tăng tính nhất quán

- Tạo component dùng chung cho loading/error/retry.
- Tạo component dùng chung cho alert card và risk badge.
- Dùng skeleton loading thay vì chỉ EmptyState.
- Thêm pull-to-refresh cho dashboard và alerts.
- Chuẩn hóa spacing, title và action giữa các màn hình.
- Kiểm tra font scale lớn và accessibility cho người dùng thị lực yếu.

## 7. Những phần nên xóa hoặc thu gọn

Các file starter Expo hiện không được luồng app thật sử dụng và nên xóa sau khi xác nhận:

- `app/modal.tsx` và route modal trong `app/_layout.tsx`.
- `components/external-link.tsx`
- `components/haptic-tab.tsx`
- `components/hello-wave.tsx`
- `components/parallax-scroll-view.tsx`
- `components/themed-text.tsx`
- `components/themed-view.tsx`
- `components/ui/collapsible.tsx`
- `components/ui/icon-symbol.tsx`
- `components/ui/icon-symbol.ios.tsx`
- `hooks/use-color-scheme.ts`
- `hooks/use-color-scheme.web.ts`
- `hooks/use-theme-color.ts`
- `src/mock/db.ts`
- `src/mock/mockApi.ts`
- `src/api/health.ts` nếu không dùng cho diagnostics.

Dependency có dấu hiệu không còn cần trực tiếp:

- `expo-haptics`
- `expo-symbols`
- `expo-web-browser`
- `react-native-paper`
- `react-native-vector-icons`

Chỉ xóa dependency sau khi chạy lại typecheck, lint và Android/iOS build.

Ngoài ra:

- Hai file `API document.md` và `API document copy.md` bị trùng nội dung. Nên giữ một nguồn chuẩn.
- Các màn hình lớn từ 300-600 dòng nên tách component/helper để dễ test và bảo trì.
- `Dashboard StatCard` đang dùng `icon: any`; nên dùng type icon cụ thể.

## 8. Lộ trình đề xuất

### P0 - Trước khi triển khai production

1. Hoàn thiện push alert end-to-end bằng FCM/APNs thật.
2. Sửa bảo mật installation API và switch-account.
3. Sửa auth lifecycle khi login/refresh thất bại.
4. Thêm test runner và test các luồng auth/alert/notification.
5. Xóa demo credential khỏi production UI.
6. Đồng bộ notification contract giữa app, tài liệu và server.

### P1 - Hoàn thiện trải nghiệm

1. Thêm notification received listener để invalidate query.
2. Thêm pagination cho alerts và notifications.
3. Thêm pull-to-refresh/retry thống nhất.
4. Chuẩn hóa toàn bộ tiếng Việt và navigation.
5. Hiển thị notification permission/push status trong Settings.
6. Xóa starter code, mock code và dependency dư.

### P2 - Phát triển tiếp

1. Lịch sử vị trí và marker alert trên bản đồ.
2. Safe zone và emergency contact nếu đúng yêu cầu sản phẩm.
3. Multi-account flow sau khi có mô hình bảo mật an toàn.
4. Monitoring/crash reporting và analytics kỹ thuật.
5. CI chạy typecheck, lint, test, Android/iOS build và dependency audit.

## 9. Tiêu chí hoàn thành production

Chỉ nên coi app production-ready khi:

- Alert đến được thiết bị qua push thật khi app foreground, background và terminated.
- Push bị lỗi có retry, token invalid được thu hồi và polling fallback hoạt động.
- Installation API không còn dựa duy nhất vào fingerprint.
- Auth expiry luôn đưa UI về login đúng lúc.
- Không còn demo password, mock/starter code và placeholder gây hiểu nhầm.
- Alerts/notifications có pagination.
- Có unit, integration và E2E test cho luồng chính.
- Android/iOS build, security audit và smoke test với server thật đều đạt.
