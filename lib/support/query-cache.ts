import type { QueryClient } from "@tanstack/react-query";
import type { listAdminSupportTickets, listUserSupportTickets } from "@/lib/api/support";

type AdminTicketListParams = NonNullable<Parameters<typeof listAdminSupportTickets>[0]>;
type UserTicketListParams = NonNullable<Parameters<typeof listUserSupportTickets>[0]>;

export const supportKeys = {
  all: ["support"] as const,
  public: () => [...supportKeys.all, "public"] as const,
  publicConversation: (ticket: string) =>
    [...supportKeys.public(), "conversation", ticket] as const,
  admin: () => [...supportKeys.all, "admin"] as const,
  adminTickets: () => [...supportKeys.admin(), "tickets"] as const,
  adminTicketLists: () => [...supportKeys.adminTickets(), "list"] as const,
  adminTicketList: (params: AdminTicketListParams) =>
    [...supportKeys.adminTicketLists(), params] as const,
  adminTicketDetail: (id: string) => [...supportKeys.adminTickets(), "detail", id] as const,
  adminConversation: (id: string) => [...supportKeys.adminTickets(), "conversation", id] as const,
  user: () => [...supportKeys.all, "user"] as const,
  userTickets: () => [...supportKeys.user(), "tickets"] as const,
  userTicketLists: () => [...supportKeys.userTickets(), "list"] as const,
  userTicketList: (params: UserTicketListParams) =>
    [...supportKeys.userTicketLists(), params] as const,
  userConversation: (id: string) => [...supportKeys.userTickets(), "conversation", id] as const,
};

// List prefixes intentionally exclude conversation/detail keys. Every active
// query affected by one mutation is invalidated exactly once.
export function refreshUserSupportTicket(client: QueryClient, id: string) {
  return Promise.all([
    client.invalidateQueries({ queryKey: supportKeys.userTicketLists() }),
    client.invalidateQueries({ queryKey: supportKeys.userConversation(id), exact: true }),
  ]);
}

export function refreshAdminSupportTicket(client: QueryClient, id: string) {
  return Promise.all([
    client.invalidateQueries({ queryKey: supportKeys.adminTicketLists() }),
    client.invalidateQueries({ queryKey: supportKeys.adminTicketDetail(id), exact: true }),
    client.invalidateQueries({ queryKey: supportKeys.adminConversation(id), exact: true }),
  ]);
}
