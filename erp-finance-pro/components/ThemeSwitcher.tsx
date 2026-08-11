'use client';

import { useEffect, useRef, useState } from 'react';

interface ThemeOption {
  id: string;
  label: string;
  swatch: string;
  bg: string;
}

export const THEMES: ThemeOption[] = [
  { id: 'paper', label: 'Paper', swatch: '#0F8A72', bg: '#F6F4EE' },
  { id: 'midnight', label: 'Midnight', swatch: '#00D4AA', bg: '#0A0A0A' },
  { id: 'slate', label: 'Slate', swatch: '#38BDF8', bg: '#0F172A' },
  { id: 'royal', label: 'Royal', swatch: '#A78BFA', bg: '#17102B' },
  { id: 'ember', label: 'Ember', swatch: '#F59E0B', bg: '#120E0A' },
  { id: 'daylight', label: 'Daylight', swatch: '#0D9488', bg: '#FFFFFF' },
];

const DEFAULT_THEME = 'paper';

export default function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTheme(
      document.documentElement.getAttribute('data-theme') || DEFAULT_THEME
    );
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  function pick(id: string) {
    document.documentElement.setAttribute('data-theme', id);
    try {
      localStorage.setItem('theme', id);
    } catch {
      /* ignore */
    }
    setTheme(id);
    setOpen(false);
  }

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Change theme"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <span
          className="h-4 w-4 rounded-full ring-2 ring-border"
          style={{ backgroundColor: current.swatch }}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-44 animate-fade-up rounded-lg border border-border bg-surface p-1.5 shadow-xl shadow-black/20"
        >
          <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
            Theme
          </p>
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitemradio"
              aria-checked={t.id === theme}
              onClick={() => pick(t.id)}
              className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-surface-alt ${
                t.id === theme ? 'text-accent' : 'text-foreground'
              }`}
            >
              <span
                className="h-4 w-4 shrink-0 rounded-full ring-1 ring-border"
                style={{
                  background: `linear-gradient(135deg, ${t.swatch} 50%, ${t.bg} 50%)`,
                }}
              />
              <span className="flex-1 text-left">{t.label}</span>
              {t.id === theme && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
