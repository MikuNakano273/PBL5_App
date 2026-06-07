import { http } from "./http";

export type HealthResponse = {
  status: string;
};

export async function getApiHealth(): Promise<HealthResponse> {
  const response = await http.get<HealthResponse>("/api/health");

  return response.data;
}
