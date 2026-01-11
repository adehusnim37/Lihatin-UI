import { getWithAuth } from "./fetch-wrapper";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";

export interface ActivityLog {
  id: string;
  level: "ERROR" | "WARNING" | "INFO" | "SUCCESS";
  message: string;
  username: string;
  user_id?: string;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  browser_info: string;
  action: string;
  route: string;
  method: string;
  status_code: number;
  request_body: string;
  request_headers: string;
  query_params: string;
  route_params: string;
  context_locals?: string;
  response_body: string;
  response_time: number;
  created_at: string;
  updated_at: string;
}

export interface LogsMeta {
  current_page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface LogsResponse {
  success: boolean;
  data: {
    logs: ActivityLog[];
    meta: LogsMeta;
  };
  message: string;
}

export async function getShortLinkLogs(
  code: string,
  page: number = 1,
  limit: number = 10
): Promise<LogsResponse> {
  const response = await getWithAuth(
    `${API_URL}/logs/short/${code}?page=${page}&limit=${limit}`
  );
  return response.json();
}
