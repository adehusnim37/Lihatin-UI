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

export interface LogsResponse {
  success: boolean;
  data: {
    logs: ActivityLog[];
    total_count: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  message: string;
}

export interface LogFilterParams {
  page?: number;
  limit?: number;
  sort?: string;
  order_by?: "asc" | "desc";
  username?: string;
  action?: string;
  method?: string;
  route?: string;
  level?: string;
  status_code?: number;
  ip_address?: string;
  date_from?: string;
  date_to?: string;
}

export interface LogCountsResponse {
  success: boolean;
  data: {
    GET: number;
    POST: number;
    PUT: number;
    PATCH: number;
    DELETE: number;
  };
  message: string;
}

// Get all logs with pagination
export async function getAllLogs(
  page: number = 1,
  limit: number = 20,
  sort: string = "created_at",
  order_by: "asc" | "desc" = "desc",
): Promise<LogsResponse> {
  const response = await getWithAuth(
    `${API_URL}/logs/all?page=${page}&limit=${limit}&sort=${sort}&order_by=${order_by}`,
  );
  return response.json();
}

// Get logs by username
export async function getLogsByUsername(
  username: string,
  page: number = 1,
  limit: number = 20,
): Promise<LogsResponse> {
  const response = await getWithAuth(
    `${API_URL}/logs/user/${encodeURIComponent(username)}?page=${page}&limit=${limit}&sort=created_at&order_by=desc`,
  );
  return response.json();
}

// Get logs by short link code
export async function getLogsByShortLink(
  code: string,
  page: number = 1,
  limit: number = 10,
): Promise<LogsResponse> {
  const response = await getWithAuth(
    `${API_URL}/logs/short/${code}?page=${page}&limit=${limit}`,
  );
  return response.json();
}

// Get logs with advanced filtering
export async function getLogsWithFilter(
  filters: LogFilterParams,
): Promise<LogsResponse> {
  const params = new URLSearchParams();

  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());
  if (filters.sort) params.append("sort", filters.sort);
  if (filters.order_by) params.append("order_by", filters.order_by);
  if (filters.username) params.append("username", filters.username);
  if (filters.action) params.append("action", filters.action);
  if (filters.method) params.append("method", filters.method);
  if (filters.route) params.append("route", filters.route);
  if (filters.level) params.append("level", filters.level);
  if (filters.status_code)
    params.append("status_code", filters.status_code.toString());
  if (filters.ip_address) params.append("ip_address", filters.ip_address);
  if (filters.date_from) params.append("date_from", filters.date_from);
  if (filters.date_to) params.append("date_to", filters.date_to);

  const response = await getWithAuth(
    `${API_URL}/logs/filter?${params.toString()}`,
  );
  return response.json();
}

// Get counted logs by method type
export async function getLogCounts(): Promise<LogCountsResponse> {
  const response = await getWithAuth(`${API_URL}/logs/all/count`);
  return response.json();
}

// Get single log by ID
export async function getLogById(id: string): Promise<{ success: boolean; data: ActivityLog; message: string }> {
  const response = await getWithAuth(`${API_URL}/logs/${id}`);
  return response.json();
}
