/**
 * Small inline line-icon set used across the site. Each icon inherits the
 * current text colour, so it themes automatically.
 */
type IconProps = { className?: string };

const base = (className?: string) => ({
  className: className ?? 'h-6 w-6',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export function IconSparkles({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 3l1.8 4.8L18.6 9.6 13.8 11.4 12 16.2 10.2 11.4 5.4 9.6 10.2 7.8z" />
      <path d="M19 14l.7 1.9L21.6 16.6 19.7 17.3 19 19.2 18.3 17.3 16.4 16.6 18.3 15.9z" />
    </svg>
  );
}
export function IconTemplate({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 9v12" />
    </svg>
  );
}
export function IconChart({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M3 3v18h18" />
      <rect x="7" y="11" width="3" height="6" rx="1" />
      <rect x="12" y="7" width="3" height="10" rx="1" />
      <rect x="17" y="13" width="3" height="4" rx="1" />
    </svg>
  );
}
export function IconBook({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
      <path d="M4 19a2 2 0 0 1 2-2h13" />
    </svg>
  );
}
export function IconTool({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L4 16.8 7.2 20l5.3-5.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.1-.5-.5-2.1z" />
    </svg>
  );
}
export function IconPlay({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function IconCheck({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
export function IconArrowRight({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
export function IconBolt({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
    </svg>
  );
}
export function IconCompass({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </svg>
  );
}
export function IconLayers({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 3l9 5-9 5-9-5z" />
      <path d="M3 13l9 5 9-5" />
    </svg>
  );
}
export function IconMail({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
