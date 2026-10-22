import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SupportConversationBubble } from "../components/support/support-conversation-bubble";
import type { SupportMessageResponse } from "../lib/api/support";

test("support attachments offer downloads without loading untrusted previews", () => {
  const message: SupportMessageResponse = {
    id: "message",
    ticket_id: "ticket",
    sender_type: "user",
    body: "Laporan error",
    is_internal: false,
    created_at: "2026-10-23T00:00:00Z",
    updated_at: "2026-10-23T00:00:00Z",
    attachments: [
      {
        id: "pdf",
        file_name: "report.pdf",
        content_type: "application/pdf",
        size_bytes: 100,
        created_at: "2026-10-23T00:00:00Z",
      },
      {
        id: "image",
        file_name: "photo.jpg",
        content_type: "image/jpeg",
        size_bytes: 100,
        created_at: "2026-10-23T00:00:00Z",
      },
    ],
  };
  let urls = 0;
  const html = renderToStaticMarkup(
    createElement(SupportConversationBubble, {
      message,
      getAttachmentUrl: (id) => {
        urls++;
        return `https://api.example.test/attachments/${id}`;
      },
    }),
  );
  assert.doesNotMatch(html, /<iframe|<img|<object|<embed|disposition=inline/);
  assert.match(html, /aria-label="Download report.pdf"/);
  assert.match(html, /aria-label="Download photo.jpg"/);
  assert.equal(urls, 0, "rendering must not request attachment URLs for previews");
});
