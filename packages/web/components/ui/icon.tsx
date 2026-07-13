import type { ReactElement, SVGProps } from 'react';

/**
 * Local inline-SVG icon set (DESIGN.md §0: no external icon kit as a default).
 * Stroke-based, 1.6px, `currentColor` so an icon inherits whatever text color it
 * sits in (accent, secondary, success…). 16px default; set `size` to scale.
 *
 * Usage: <Icon name="lock" /> · <Icon name="check" size={14} className="…" />
 * Icons align to text via a small negative vertical offset.
 */
export type IconName =
  | 'lock'
  | 'unlock'
  | 'check'
  | 'wallet'
  | 'key'
  | 'coins'
  | 'external'
  | 'sparkle'
  | 'users'
  | 'upload'
  | 'download'
  | 'clock'
  | 'info'
  | 'shield'
  | 'arrow-right'
  | 'pen'
  | 'sign-out'
  | 'flag';

const PATHS: Record<IconName, ReactElement> = {
  lock: (
    <>
      <rect x="4.5" y="8" width="11" height="8" rx="1.6" />
      <path d="M7 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  unlock: (
    <>
      <rect x="4.5" y="8" width="11" height="8" rx="1.6" />
      <path d="M7 8V6a3 3 0 0 1 5.8-1" />
    </>
  ),
  check: <path d="M4 10.5l4 4 8-9" />,
  wallet: (
    <>
      <rect x="3" y="5" width="14" height="11" rx="2" />
      <path d="M3 8h14" />
      <circle cx="13.5" cy="11.5" r="1" />
    </>
  ),
  key: (
    <>
      <circle cx="7" cy="7" r="3" />
      <path d="M9.2 9.2 16 16m-2.5-2.5 1.5-1.5m-4-1 1.5-1.5" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="8" cy="6" rx="4.5" ry="2.2" />
      <path d="M3.5 6v4c0 1.2 2 2.2 4.5 2.2s4.5-1 4.5-2.2V6" />
      <path d="M12.5 10.5c2.2.2 4 1.1 4 2.3 0 1.2-2 2.2-4.5 2.2-1 0-1.9-.15-2.6-.4" />
    </>
  ),
  external: (
    <>
      <path d="M11 4h5v5" />
      <path d="M16 4l-7 7" />
      <path d="M14 11.5V15a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 3 15V7a1.5 1.5 0 0 1 1.5-1.5H8" />
    </>
  ),
  sparkle: <path d="M10 3l1.6 4.4L16 9l-4.4 1.6L10 15l-1.6-4.4L4 9l4.4-1.6L10 3z" />,
  users: (
    <>
      <circle cx="7.5" cy="7" r="2.6" />
      <path d="M3 16c0-2.5 2-4.2 4.5-4.2S12 13.5 12 16" />
      <path d="M13 6.2a2.4 2.4 0 0 1 0 4.6M14 16c0-2.2-.8-3.5-2-4.2" />
    </>
  ),
  upload: (
    <>
      <path d="M10 13V4" />
      <path d="M6.5 7.5 10 4l3.5 3.5" />
      <path d="M4 13v2.5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5V13" />
    </>
  ),
  download: (
    <>
      <path d="M10 4v9" />
      <path d="M6.5 9.5 10 13l3.5-3.5" />
      <path d="M4 13v2.5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5V13" />
    </>
  ),
  clock: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l2.5 2" />
    </>
  ),
  info: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 9v4" />
      <path d="M10 6.5h.01" />
    </>
  ),
  shield: (
    <>
      <path d="M10 3l6 2v4c0 4-2.7 6.5-6 8-3.3-1.5-6-4-6-8V5l6-2z" />
      <path d="M7.5 10l1.8 1.8L13 8" />
    </>
  ),
  'arrow-right': (
    <>
      <path d="M4 10h11" />
      <path d="M11 6l4 4-4 4" />
    </>
  ),
  pen: (
    <>
      <path d="M13.5 3.5 16.5 6.5 7 16H4v-3z" />
      <path d="M12 5 15 8" />
    </>
  ),
  'sign-out': (
    <>
      <path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" />
      <path d="M12 13l3-3-3-3" />
      <path d="M15 10H8" />
    </>
  ),
  flag: (
    <>
      <path d="M5 17V3" />
      <path d="M5 4h9l-2 3 2 3H5" />
    </>
  ),
};

export function Icon({
  name,
  size = 16,
  className,
  style,
  ...rest
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ verticalAlign: '-0.15em', flexShrink: 0, ...style }}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
