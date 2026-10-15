# Lihat.in

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Administrators create and schedule product announcements and promotional email,
then inspect the accounts that read an announcement or received an email.
Signed-in users read product notices and revisit them from the header inbox.

## Product Purpose

Lihat.in manages short links and related account services. Its notification
features help administrators communicate product changes and opted-in promotions.
Success for the notification workspace means a clear path from draft to delivery,
with understandable status and access to recipient details.

## Operating Context

The dashboard uses an admin sidebar with separate In-app and Email Campaigns
routes under Notifications. Users access announcements from a bell in the header.
The confirmed redesign scope includes these admin routes and the bell inbox.
Email preferences in the profile are outside this scope.

## Capabilities and Constraints

- In-app announcements have a title, message, optional URL, publication status,
  and optional start/end window.
- Read announcements remain in the inbox. Opening one shows its detail and marks
  it read. Read again reopens the detail while keeping its read status.
- Admin audience data includes user identity, read status, and read timestamps.
  Existing unread audience data only includes accounts with unread records.
- Email campaigns support drafts, templates, optional images and links,
  scheduling, cancellation, retries, and per-recipient delivery outcomes.
- Promotional email is limited to verified, active accounts that opted in.
- Existing backend response contracts and admin authorization must be preserved.

## Brand Commitments

The existing dashboard name is Lihat.in. The application uses English interface
copy, light/dark themes, a cool cyan accent, neutral surfaces, and a sans serif
typeface. The notification redesign should fit the surrounding dashboard.

## Evidence on Hand

The current routes, API clients, backend implementation, and user-provided inbox
screenshot establish existing behavior. User confirmation in this session sets
the scope and prioritizes creation, scheduling, reader/recipient visibility, and
reading announcements again. Do not invent reach, opens, or delivery statistics.

## Product Principles

- Make the next valid action clear for each lifecycle state.
- Keep communication status and recipient outcomes easy to inspect.
- Preserve readable history and explicit recovery when a request fails.
- Label the scope of counts accurately.
