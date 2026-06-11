import { http } from "./http";

export type MobileAlert = {
  id: string;
  user_id: string;
  device_id: string;
  alert_type: string;
  title: string;
  message: string;
  summary_text?: string | null;
  risk_level: string;
  status: string;
  lat: number | null;
  lng: number | null;
  distance_cm: number | null;
  triggered_at: string;
  resolved_at: string | null;
};

export type MobileAlertPage = {
  alerts: MobileAlert[];
  pagination: {
    page: number;
    hasNextPage: boolean;
    nextPage?: number;
  } | null;
};

export async function getMobileAlert(alertId: string): Promise<MobileAlert> {
  const normalizedAlertId = alertId.trim();

  if (!normalizedAlertId) {
    throw Object.assign(new Error("Alert ID is required."), {
      code: "invalid_alert_id",
      status: 400,
    });
  }

  const response = await http.get<MobileAlert>(
    `/api/mobile/v1/alerts/${encodeURIComponent(normalizedAlertId)}`,
  );

  return response.data;
}

export async function getMobileUserAlerts(
  { page = 1, limit = 20 }: { page?: number; limit?: number } = {},
): Promise<MobileAlert[]> {
  const result = await getMobileUserAlertsPage({ page, limit });

  return result.alerts;
}

export async function getMobileUserAlertsPage(
  { page = 1, limit = 20 }: { page?: number; limit?: number } = {},
): Promise<MobileAlertPage> {
  const response = await http.get<unknown>("/api/mobile/v1/me/alerts", {
    params: {
      page,
      limit,
    },
  });

  return normalizeMobileAlertPage(response.data, page, limit);
}

function normalizeMobileAlertPage(
  responseData: unknown,
  requestedPage: number,
  requestedLimit: number,
): MobileAlertPage {
  if (Array.isArray(responseData)) {
    return {
      alerts: responseData as MobileAlert[],
      pagination: null,
    };
  }

  if (!isRecord(responseData)) {
    return {
      alerts: [],
      pagination: null,
    };
  }

  const alerts = getAlertArray(responseData);
  const paginationSource = getPaginationSource(responseData);

  if (!paginationSource) {
    return {
      alerts,
      pagination: null,
    };
  }

  const page =
    getPositiveInteger(paginationSource.page) ??
    getPositiveInteger(paginationSource.current_page) ??
    requestedPage;
  const explicitNextPage =
    getPositiveInteger(paginationSource.next_page) ??
    getPositiveInteger(paginationSource.nextPage);
  const totalPages =
    getPositiveInteger(paginationSource.total_pages) ??
    getPositiveInteger(paginationSource.totalPages);
  const totalItems =
    getNonNegativeInteger(paginationSource.total) ??
    getNonNegativeInteger(paginationSource.total_items) ??
    getNonNegativeInteger(paginationSource.totalItems);
  const pageSize =
    getPositiveInteger(paginationSource.limit) ??
    getPositiveInteger(paginationSource.page_size) ??
    getPositiveInteger(paginationSource.pageSize) ??
    requestedLimit;
  const explicitHasNext =
    getBoolean(paginationSource.has_next) ??
    getBoolean(paginationSource.hasNext) ??
    getBoolean(paginationSource.has_next_page) ??
    getBoolean(paginationSource.hasNextPage);
  const hasNextPage =
    explicitHasNext ??
    Boolean(
      explicitNextPage ||
        (totalPages && page < totalPages) ||
        (totalItems !== undefined && page * pageSize < totalItems),
    );

  return {
    alerts,
    pagination: {
      page,
      hasNextPage,
      nextPage: hasNextPage ? explicitNextPage ?? page + 1 : undefined,
    },
  };
}

function getAlertArray(responseData: Record<string, unknown>): MobileAlert[] {
  for (const key of ["alerts", "items", "data", "results"]) {
    if (Array.isArray(responseData[key])) {
      return responseData[key] as MobileAlert[];
    }
  }

  if (isRecord(responseData.data)) {
    return getAlertArray(responseData.data);
  }

  return [];
}

function getPaginationSource(
  responseData: Record<string, unknown>,
): Record<string, unknown> | null {
  for (const key of ["pagination", "meta"]) {
    if (isRecord(responseData[key])) {
      return responseData[key];
    }
  }

  if (isRecord(responseData.data)) {
    const nestedPagination = getPaginationSource(responseData.data);

    if (nestedPagination) {
      return nestedPagination;
    }
  }

  const paginationKeys = [
    "page",
    "current_page",
    "next_page",
    "nextPage",
    "total_pages",
    "totalPages",
    "has_next",
    "hasNext",
    "has_next_page",
    "hasNextPage",
    "total",
    "total_items",
    "totalItems",
  ];

  return paginationKeys.some((key) => key in responseData) ? responseData : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPositiveInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : undefined;
}

function getNonNegativeInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : undefined;
}

function getBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}
