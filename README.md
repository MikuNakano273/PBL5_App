# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Test alerts

In development, Settings includes a **Developer** section with the **Tạo cảnh báo thử** button. The button calls `POST /api/mobile/v1/dev/test-alert` with the current mobile session. If the server does not expose that endpoint (`404` or `405`), the app shows a local mock alert notification instead.

For a non-development preview build, explicitly enable the button:

```bash
EXPO_PUBLIC_SHOW_DEV_TOOLS=true
```

Do not set `EXPO_PUBLIC_SHOW_DEV_TOOLS=true` in production builds.

## Manual auth session checks

This project does not currently include an automated test runner. Run these
checks after changing authentication or HTTP interceptor behavior:

1. Make `POST /api/mobile/v1/auth/login` succeed, then make
   `GET /api/mobile/v1/me` fail. Confirm the login error is shown and both
   access and refresh tokens are removed from device storage.
2. Log in, expire the access token, and make
   `POST /api/mobile/v1/auth/refresh` fail. Confirm the app clears the current
   user and cached user data, removes both tokens, and navigates to `/login`.
3. Trigger multiple authenticated requests with an expired access token.
   Confirm only one refresh request runs and a failed refresh consistently
   returns the app to `/login`.
4. Log in normally and confirm successful refresh still retries the original
   request without changing the login flow or API request/response contract.

## Manual in-app notification checks

1. While logged in, trigger two normal alerts. Confirm banners appear one at a
   time and each automatically closes after 5 seconds.
2. Trigger a `danger` or `high` risk alert. Confirm its banner remains visible
   until **Đóng thông báo** or **Xem chi tiết** is pressed.
3. Deliver the same alert through polling and push notification. Confirm only
   one banner appears for the shared `alert_id`.
4. Deliver notifications without an `alert_id` but with the same notification
   event ID. Confirm only one banner appears.
5. Press **Xem chi tiết** and confirm the app opens `/alerts/[id]`.
6. Log out while banners are queued. Confirm the visible banner disappears and
   queued banners do not appear on the login screen.

## Manual alert polling checks

1. Return paginated alert data where the previously seen alert is on page 2 or
   later. Confirm polling requests subsequent pages, stops after finding that
   alert, and displays each newer `alert_id` once.
2. Return paginated data without the previously seen alert. Confirm polling
   continues until pagination reports no next page.
3. Return an array or envelope without pagination metadata. Confirm only page 1
   is processed and a development-only warning is logged once.
4. Return duplicate alert IDs across page boundaries. Confirm only one in-app
   banner and one local notification are created for each new alert ID.
5. Set notification mode to `local-polling` and confirm new alerts create local
   notifications. In other modes, confirm polling does not create them.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
