import { mockDB } from "./db";

let timer: any = null;

export function startFakeRealtime(onNewAlert: (a: any) => void) {
  if (timer) return;

  timer = setInterval(() => {
    const id = "A" + Math.floor(Math.random() * 10000);
    const a = {
      id,
      title: "Realtime: phát hiện vật cản gần",
      type: "OBSTACLE",
      createdAt: new Date().toLocaleString(),
      read: false,
    };

    mockDB.alerts.items.unshift(a);
    mockDB.dashboard.recentAlerts.unshift(a);

    onNewAlert(a);
  }, 8000);
}

export function stopFakeRealtime() {
  if (timer) clearInterval(timer);
  timer = null;
}
