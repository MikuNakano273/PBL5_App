import assert from "node:assert/strict";
import test from "node:test";

import {
  mapAlertToUi,
  mapDashboardToUi,
  mapLatestLocationToUi,
} from "./transformers.ts";

test("mapDashboardToUi converts centimeters and safety state for dashboard cards", () => {
  const dashboard = mapDashboardToUi({
    blind_user_id: "blind-1",
    is_safe: false,
    current_safety_status: "danger",
    nearest_distance_cm: 165,
    today_alert_count: 3,
    device_count: 2,
    device_last_seen_at: "2026-04-26T08:00:00Z",
    last_seen_at: "2026-04-26T08:01:00Z",
    last_location: { lat: 16.0544, lng: 108.2022 },
    recent_alerts: [],
  });

  assert.equal(dashboard.nearestDistanceM, 1.65);
  assert.equal(dashboard.safeZone, "Ngoai vung an toan");
  assert.equal(dashboard.status, "ONLINE");
});

test("mapAlertToUi maps risk levels to screen alert types", () => {
  assert.equal(
    mapAlertToUi({
      id: "alert-1",
      title: "Obstacle",
      message: "Near cane",
      risk_level: "high",
      triggered_at: "2026-04-26T08:00:00Z",
    }).type,
    "danger",
  );

  assert.equal(
    mapAlertToUi({
      _id: "alert-2",
      type: "SAFE_ZONE",
      title: "Safe zone",
      message: "Outside",
      created_at: "2026-04-26T09:00:00Z",
    }).type,
    "warning",
  );
});

test("mapLatestLocationToUi picks coordinates from the newest location row", () => {
  const location = mapLatestLocationToUi([
    { lat: 16, lng: 108, created_at: "old" },
    { latitude: 17, longitude: 109, created_at: "new" },
  ]);

  assert.deepEqual(location, {
    lat: 17,
    lng: 109,
    updatedAt: "new",
  });
});

