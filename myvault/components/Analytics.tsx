import Script from 'next/script';
import { ANALYTICS } from '@/lib/constants';

/**
 * Loads analytics only when configured in lib/constants.ts. With no provider
 * set, this renders nothing, so the site ships with zero tracking by default.
 */
export default function Analytics() {
  if (ANALYTICS.provider === 'plausible' && ANALYTICS.domain) {
    return (
      <Script
        defer
        data-domain={ANALYTICS.domain}
        src="https://plausible.io/js/script.js"
        strategy="afterInteractive"
      />
    );
  }

  if (ANALYTICS.provider === 'ga' && ANALYTICS.gaId) {
    return (
      <>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${ANALYTICS.gaId}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${ANALYTICS.gaId}');
          `}
        </Script>
      </>
    );
  }

  return null;
}
