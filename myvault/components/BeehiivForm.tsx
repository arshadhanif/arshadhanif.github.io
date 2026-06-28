'use client';

import { useEffect, useRef } from 'react';
import { BEEHIIV_FORM_ID } from '@/lib/constants';

/**
 * Renders the Beehiiv subscribe form. The Beehiiv loader script replaces the
 * container with the live form, so emails go straight to the Beehiiv list.
 *
 * A fresh script is injected per mount so the form also renders after
 * client-side navigation between pages.
 */
export default function BeehiivForm({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://subscribe-forms.beehiiv.com/v3/loader.js';
    script.async = true;
    script.setAttribute('data-beehiiv-form', BEEHIIV_FORM_ID);
    el.appendChild(script);
  }, []);

  return <div ref={ref} className={className} />;
}
