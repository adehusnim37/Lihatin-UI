import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SupportCredentialResetActions } from "../components/support/support-credential-reset-actions";
import type { AdminSupportTicketDetailResponse } from "../lib/api/support";

const ticket: AdminSupportTicketDetailResponse = {
  id: "ticket",
  ticket_code: "LHTK-ABC123",
  email: "user@example.com",
  user_id: "user",
  category: "lost_2fa",
  subject: "Lost authenticator",
  description: "Recovery request",
  status: "in_progress",
  priority: "normal",
  created_at: "2026-10-23T00:00:00Z",
  updated_at: "2026-10-23T00:00:00Z",
  requester_verified_at: new Date().toISOString(),
};
function render(patch: Partial<AdminSupportTicketDetailResponse> = {}) {
  const client = new QueryClient();
  try {
    return renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client },
        createElement(SupportCredentialResetActions, { ticket: { ...ticket, ...patch } }),
      ),
    );
  } finally {
    client.clear();
  }
}
test("recovery actions appear only on Lost 2FA tickets and do not approve on render", () => {
  assert.equal(render({ category: "other" }), "");
  const html = render();
  assert.match(html, /Reset Authenticator \(TOTP\)/);
  assert.match(html, /Remove All Passkeys/);
  assert.match(html, /explicit approval/);
  assert.doesNotMatch(html, /disabled=/);
  assert.doesNotMatch(html, /Recovery approved/);
});
for (const [name, patch] of [
  ["unreviewed", { status: "open" }],
  ["closed", { status: "closed" }],
  ["unlinked", { user_id: null }],
  ["unverified requester", { requester_verified_at: null }],
  [
    "stale requester proof",
    { requester_verified_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() },
  ],
  [
    "used approval",
    {
      credential_reset: {
        ticket_id: "ticket",
        ticket_code: "LHTK-ABC123",
        user_id: "user",
        approved_by: "admin",
        method: "totp",
        reason: "Ownership reviewed",
        created_at: "2026-10-23T00:00:00Z",
      },
    },
  ],
] as const) {
  test(`recovery buttons are disabled for ${name}`, () => {
    const html = render(patch);
    assert.equal((html.match(/disabled=""/g) ?? []).length, 2);
  });
}
