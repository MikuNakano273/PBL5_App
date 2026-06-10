import type { MobileAlert } from "@/src/api/alertService";
import {
  createDevTestAlert,
  shouldShowDevTools,
  type DevTestAlertResult,
} from "@/src/dev/devAlertService";

const result: Promise<DevTestAlertResult> = createDevTestAlert();
const alert: MobileAlert = {} as DevTestAlertResult["alert"];
const source: "server" | "local" = {} as DevTestAlertResult["source"];
const visible: boolean = shouldShowDevTools;

void result;
void alert;
void source;
void visible;
