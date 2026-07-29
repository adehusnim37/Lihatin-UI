import { IconExternalLink } from "@tabler/icons-react";

interface CampaignEmailPreviewProps {
  subject?: string;
  preheader?: string;
  body?: string;
  imageURL?: string;
  imageAlt?: string;
  ctaLabel?: string;
  ctaURL?: string;
}

export function CampaignEmailPreview({
  subject,
  preheader,
  body,
  imageURL,
  imageAlt,
  ctaLabel,
  ctaURL,
}: CampaignEmailPreviewProps) {
  const hasCTA = Boolean(ctaLabel?.trim() && ctaURL?.trim());

  return (
    <div className="overflow-hidden rounded-xl border bg-[#f4f7fb] p-3 sm:p-6">
      <div className="mx-auto max-w-[640px] overflow-hidden rounded-xl border border-[#e5eaf2] bg-white text-[#0f172a] shadow-sm">
        <div className="border-b border-[#edf1f7] px-5 py-6 sm:px-7">
          <span className="inline-flex rounded-full border border-[#d4e6f7] bg-[#e9f2fc] px-2.5 py-1 text-xs font-semibold text-[#2f5f8c]">
            Lihatin
          </span>
          <h2 className="mt-4 text-xl font-bold leading-tight text-[#111827] sm:text-2xl">
            {subject?.trim() || "Your email subject will appear here"}
          </h2>
          <p className="mt-2 text-sm text-[#64748b]">
            {preheader?.trim() || "News and offers from Lihatin."}
          </p>
        </div>

        {imageURL?.trim() ? (
          // Arbitrary campaign URLs cannot be configured as fixed Next.js image hosts.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageURL}
            alt={imageAlt?.trim() || ""}
            className="block h-auto w-full border-b border-[#edf1f7] object-cover"
          />
        ) : null}

        <div className="px-5 py-6 text-[15px] leading-relaxed sm:px-7">
          <p className="font-medium text-[#111827]">Hi Alex,</p>
          <p className="mt-3 whitespace-pre-line text-[#334155]">
            {body?.trim() ||
              "Your campaign message will appear here as you write."}
          </p>

          {hasCTA ? (
            <div className="mt-6">
              <div className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#2563eb] bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white">
                {ctaLabel}
                <IconExternalLink className="size-4" />
              </div>
              <p className="mt-2 break-all text-center text-[11px] text-[#94a3b8]">
                {ctaURL}
              </p>
            </div>
          ) : null}
        </div>

        <div className="border-t border-[#edf1f7] px-5 py-5 text-center text-xs leading-relaxed text-[#64748b] sm:px-7">
          <p>
            Need help?{" "}
            <span className="text-[#2f5f8c]">Support</span> ·{" "}
            <span className="text-[#2f5f8c]">Privacy Policy</span> ·{" "}
            <span className="text-[#2f5f8c]">Terms</span>
          </p>
          <p className="mt-1">
            <span className="text-[#2f5f8c]">Email preferences</span> ·{" "}
            <span className="text-[#2f5f8c]">Unsubscribe</span>
          </p>
          <p className="mt-1">© Lihatin. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
