import { test } from "node:test";
import assert from "node:assert/strict";
import { QueryObserver } from "@tanstack/react-query";
import { createQueryClient } from "../lib/query-client";
import {
  refreshAdminSupportTicket,
  refreshUserSupportTicket,
  supportKeys,
} from "../lib/support/query-cache";

test("one user reply refreshes each list and the current conversation once", async () => {
  const client = createQueryClient();
  const keys = [
    supportKeys.userTicketList({ page: 1, limit: 50 }),
    supportKeys.userTicketList({ page: 2, limit: 50 }),
    supportKeys.userConversation("current"),
    supportKeys.userConversation("other"),
    supportKeys.adminConversation("current"),
  ];
  const counts = keys.map(() => 0);
  const subscriptions = keys.map((queryKey, i) => {
    client.setQueryData(queryKey, { revision: 0 });
    return new QueryObserver(client, {
      queryKey,
      queryFn: async () => ({ revision: ++counts[i] }),
    }).subscribe(() => {});
  });
  try {
    await refreshUserSupportTicket(client, "current");
    assert.deepEqual(counts, [1, 1, 1, 0, 0]);
  } finally {
    subscriptions.forEach((unsubscribe) => unsubscribe());
    client.clear();
  }
});

test("admin reply/update refreshes list, detail and conversation without overlap", async () => {
  const client = createQueryClient();
  const keys = [
    supportKeys.adminTicketList({ page: 1 }),
    supportKeys.adminTicketDetail("current"),
    supportKeys.adminConversation("current"),
    supportKeys.adminTicketDetail("other"),
    supportKeys.adminConversation("other"),
    supportKeys.userConversation("current"),
  ];
  const counts = keys.map(() => 0);
  const subscriptions = keys.map((queryKey, i) => {
    client.setQueryData(queryKey, { revision: 0 });
    return new QueryObserver(client, {
      queryKey,
      queryFn: async () => ({ revision: ++counts[i] }),
    }).subscribe(() => {});
  });
  try {
    await refreshAdminSupportTicket(client, "current");
    assert.deepEqual(counts, [1, 1, 1, 0, 0, 0]);
    await refreshAdminSupportTicket(client, "current");
    assert.deepEqual(counts, [2, 2, 2, 0, 0, 0]);
  } finally {
    subscriptions.forEach((unsubscribe) => unsubscribe());
    client.clear();
  }
});

test("a rejected write is attempted once, including lost responses", async () => {
  const client = createQueryClient();
  try {
    for (const error of [new Error("HTTP 400: meaningful_text"), new TypeError("Response lost")]) {
      let calls = 0;
      const mutation = client.getMutationCache().build(client, {
        mutationFn: async () => {
          calls++;
          throw error;
        },
      });
      await assert.rejects(mutation.execute(undefined), error);
      assert.equal(calls, 1);
    }
  } finally {
    client.clear();
  }
});

test("a failed read waits for explicit retry", async () => {
  const client = createQueryClient();
  let calls = 0;
  try {
    await assert.rejects(
      client.fetchQuery({
        queryKey: ["forbidden"],
        queryFn: async () => {
          calls++;
          throw new Error("HTTP 403");
        },
      }),
    );
    assert.equal(calls, 1);
  } finally {
    client.clear();
  }
});
