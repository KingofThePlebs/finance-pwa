interface IconProps {
  size?: number;
  className?: string;
}

function base(size: number, children: React.ReactNode) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconPlus({ size = 20 }: IconProps) {
  return base(size, (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ));
}

export function IconEdit({ size = 16 }: IconProps) {
  return base(size, (
    <>
      <path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </>
  ));
}

export function IconTrash({ size = 16 }: IconProps) {
  return base(size, (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </>
  ));
}

export function IconSearch({ size = 18 }: IconProps) {
  return base(size, (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>
  ));
}

export function IconSun({ size = 20 }: IconProps) {
  return base(size, (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ));
}

export function IconMoon({ size = 20 }: IconProps) {
  return base(size, <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />);
}

export function IconX({ size = 18 }: IconProps) {
  return base(size, (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ));
}

export function IconDownload({ size = 16 }: IconProps) {
  return base(size, (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </>
  ));
}

export function IconUpload({ size = 16 }: IconProps) {
  return base(size, (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5" />
      <path d="M12 3v12" />
    </>
  ));
}

export function IconRepeat({ size = 16 }: IconProps) {
  return base(size, (
    <>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </>
  ));
}

export function IconTag({ size = 16 }: IconProps) {
  return base(size, (
    <>
      <path d="M12.6 2H2v10.6l9.4 9.4 10.6-10.6Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </>
  ));
}

export function IconWallet({ size = 18 }: IconProps) {
  return base(size, (
    <>
      <path d="M20 7V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7Z" />
      <path d="M16 12h6" />
      <path d="M16 12v3h6v-3" />
    </>
  ));
}

export function IconTrend({ size = 16, up = true }: IconProps & { up?: boolean }) {
  return base(size, up ? (
    <>
      <path d="M22 7 13.5 15.5 8.5 10.5 2 17" />
      <path d="M16 7h6v6" />
    </>
  ) : (
    <>
      <path d="M22 17 13.5 8.5 8.5 13.5 2 7" />
      <path d="M16 17h6v-6" />
    </>
  ));
}

export function IconCalendar({ size = 16 }: IconProps) {
  return base(size, (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ));
}

export function IconCheck({ size = 16 }: IconProps) {
  return base(size, <path d="M20 6 9 17l-5-5" />);
}

export function IconChart({ size = 18 }: IconProps) {
  return base(size, (
    <>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M7 15v-4" />
      <path d="M12 15V7" />
      <path d="M17 15v-7" />
    </>
  ));
}

export function IconInvest({ size = 18 }: IconProps) {
  return base(size, (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 15l4-5 3 3 5-7" />
      <path d="M14 6h5v5" />
    </>
  ));
}

export function IconList({ size = 18 }: IconProps) {
  return base(size, (
    <>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </>
  ));
}

export function IconTarget({ size = 18 }: IconProps) {
  return base(size, (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ));
}

export function IconSettings({ size = 18 }: IconProps) {
  return base(size, (
    <>
      <path d="M12.2 2h-.4a2 2 0 0 0-2 2v.18a10 10 0 0 0-1.66.96L8 4.5a2 2 0 0 0-2.73.73l-.2.34a2 2 0 0 0 .73 2.73l.16.1a10 10 0 0 0 0 1.9l-.16.1a2 2 0 0 0-.73 2.73l.2.34a2 2 0 0 0 2.73.73l.14-.09a10 10 0 0 0 1.66.96v.18a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.18a10 10 0 0 0 1.66-.96l.14.09a2 2 0 0 0 2.73-.73l.2-.34a2 2 0 0 0-.73-2.73l-.16-.1a10 10 0 0 0 0-1.9l.16-.1a2 2 0 0 0 .73-2.73l-.2-.34a2 2 0 0 0-2.73-.73l-.14.09a10 10 0 0 0-1.66-.96V4a2 2 0 0 0-2-2Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ));
}

export function IconPiggy({ size = 18 }: IconProps) {
  return base(size, (
    <>
      <path d="M19 5c-1.5 0-2.8 1-3.5 2.5H5.6a3 3 0 0 0-2.7 1.7L1.5 11.4a1 1 0 0 0 .9 1.4H4a6 6 0 0 0 5 5v2h4v-2.5c.7.1 1.3.1 2 .1 2.5 0 4.5-.8 6-2.1 1.2-1 1.2-2.9.3-4.2l.6-1.2a1.2 1.2 0 0 0-1.9-1.3L19 10V5Z" />
      <circle cx="15" cy="11" r="1.5" />
    </>
  ));
}

export function IconChevronLeft({ size = 20 }: IconProps) {
  return base(size, (
    <path d="M14 4l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ));
}

export function IconChevronRight({ size = 20 }: IconProps) {
  return base(size, (
    <path d="M10 4l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ));
}
