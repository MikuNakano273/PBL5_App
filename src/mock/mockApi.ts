import { mockDB } from "./db";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const mockApi = {
  async getAuthSeed() {
    await wait(120);
    return mockDB.auth;
  },

  async login(email: string, password: string) {
    await wait(220);
    const account = mockDB.auth.loginAccount;
    const isValid = email === account.email && password === account.password;

    return {
      ok: isValid,
      message: isValid ? "Đăng nhập thành công." : "Sai email hoặc mật khẩu.",
      user: isValid
        ? {
            fullName: account.fullName,
            email: account.email,
            role: account.role,
            linkedDeviceId: account.linkedDeviceId,
            blindUserName: account.blindUserName,
          }
        : null,
    };
  },

  async getDashboard() {
    await wait(300);
    return mockDB.dashboard;
  },

  async getLatestLocation(userId: string) {
    await wait(200);
    return { ...mockDB.location, userId };
  },

  async getDangerObstacles() {
    await wait(250);
    return mockDB.obstacles;
  },

  async getAlerts(userId: string) {
    await wait(250);
    return { ...mockDB.alerts, userId };
  },

  async markAlertRead(alertId: string) {
    await wait(150);
    mockDB.alerts.items = mockDB.alerts.items.map((a) =>
      a.id === alertId ? { ...a, read: true } : a,
    );
    return { ok: true };
  },

  async getSettings(deviceId: string) {
    await wait(250);
    return { ...mockDB.settings, deviceId };
  },

  async updateSettings(
    deviceId: string,
    patch: Partial<typeof mockDB.settings>,
  ) {
    await wait(250);
    mockDB.settings = { ...mockDB.settings, ...patch };
    return { ...mockDB.settings, deviceId };
  },
};
