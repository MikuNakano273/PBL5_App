import assert from "node:assert/strict";
import test from "node:test";

import { createApiConfig, normalizeBaseUrl } from "./config.ts";

test("normalizeBaseUrl removes trailing slashes", () => {
  assert.equal(normalizeBaseUrl("http://localhost:8000///"), "http://localhost:8000");
});

test("createApiConfig always uses the fixed PBL5 server URL", () => {
  process.env.EXPO_PUBLIC_API_URL = "http://localhost:8000";

  const config = createApiConfig({
    apiUrl: "http://192.168.1.5:8000/",
    blindUserId: "blind-1",
    deviceFingerprint: "phone-1",
  });

  assert.deepEqual(config, {
    apiUrl: "http://192.168.0.11:8000",
    blindUserId: "blind-1",
    deviceFingerprint: "phone-1",
  });

  delete process.env.EXPO_PUBLIC_API_URL;
});

test("createApiConfig defaults to the server demo blind user id", () => {
  const config = createApiConfig();

  assert.equal(config.blindUserId, "blind-1");
});
