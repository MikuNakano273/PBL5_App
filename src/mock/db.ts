export const mockDB = {
  dashboard: {
    device: { id: "D1", online: true, batteryPercent: 78 },
    nearestObstacle: { distanceM: 1.6, level: "danger" },
    recentAlerts: [
      {
        id: "A1",
        title: "Vật cản nguy hiểm phía trước",
        type: "OBSTACLE",
        createdAt: "2026-03-04 13:25",
        read: false,
      },
      {
        id: "A2",
        title: "Người dùng ra khỏi vùng an toàn",
        type: "SAFE_ZONE",
        createdAt: "2026-03-04 12:58",
        read: true,
      },
      {
        id: "A3",
        title: "Pin gậy yếu",
        type: "BATTERY",
        createdAt: "2026-03-04 11:10",
        read: false,
      },
    ],
  },

  location: { lat: 16.0544, lng: 108.2022, updatedAt: "2026-03-04 13:25" },

  obstacles: {
    items: [
      { id: "O1", lat: 16.055, lng: 108.201, note: "Hố ga" },
      { id: "O2", lat: 16.0538, lng: 108.2031, note: "Bậc thềm cao" },
    ],
  },

  alerts: {
    items: [
      {
        id: "A1",
        title: "Vật cản nguy hiểm phía trước",
        type: "OBSTACLE",
        createdAt: "2026-03-04 13:25",
        read: false,
      },
      {
        id: "A2",
        title: "Người dùng ra khỏi vùng an toàn",
        type: "SAFE_ZONE",
        createdAt: "2026-03-04 12:58",
        read: true,
      },
      {
        id: "A3",
        title: "Pin gậy yếu",
        type: "BATTERY",
        createdAt: "2026-03-04 11:10",
        read: false,
      },
    ],
  },

  users: {
    items: [
      { id: "U1", name: "Người dùng 1" },
      { id: "U2", name: "Người dùng 2" },
    ],
  },

  settings: {
    alertEnabled: true,
    obstacleDistanceThresholdM: 2.0,
    safeZone: { center: { lat: 16.0544, lng: 108.2022 }, radiusM: 200 },
    notifyTypes: { obstacle: true, outOfSafeZone: true },
  },
};
