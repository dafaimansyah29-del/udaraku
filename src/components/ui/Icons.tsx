import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function IconArrow(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconPulse(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />
    </svg>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M8 3v4M16 3v4M3.5 10h17M8 14.5h3" />
    </svg>
  );
}

export function IconUserShield(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
      <circle cx="12" cy="10" r="2.2" />
      <path d="M8.5 16c.8-1.6 2-2.3 3.5-2.3s2.7.7 3.5 2.3" />
    </svg>
  );
}

export function IconBell(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 16V11a6 6 0 1112 0v5l1.5 2h-15L6 16z" />
      <path d="M10 21h4" />
    </svg>
  );
}

export function IconBadgeCheck(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l2.4 1.8 3-.2.9 2.9 2.4 1.8-1 2.8 1 2.8-2.4 1.8-.9 2.9-3-.2L12 21l-2.4-1.8-3 .2-.9-2.9L3.3 14.7l1-2.7-1-2.8 2.4-1.8.9-2.9 3 .2L12 3z" />
      <path d="M8.8 12.2l2.2 2.2 4.2-4.4" />
    </svg>
  );
}

export function IconWind(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 9h10a3 3 0 10-3-3" />
      <path d="M3 14h15a3 3 0 11-3 3" />
      <path d="M3 19h6" />
    </svg>
  );
}

export function IconLungs(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v7" />
      <path d="M12 10c-1.5 1-2.5 2-3.5 3" />
      <path d="M12 10c1.5 1 2.5 2 3.5 3" />
      <path d="M8.5 8.5C6 9 4 13 3.5 17c-.2 2 .8 3 2.3 3 1.8 0 2.7-1 2.7-2.8V9.3c0-.6-.4-1-.9-.8z" />
      <path d="M15.5 8.5C18 9 20 13 20.5 17c.2 2-.8 3-2.3 3-1.8 0-2.7-1-2.7-2.8V9.3c0-.6.4-1 .9-.8z" />
    </svg>
  );
}

export function IconDrop(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5c3.2 4 5.5 6.8 5.5 10a5.5 5.5 0 11-11 0c0-3.2 2.3-6 5.5-10z" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </svg>
  );
}

export function IconLocate(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
      <circle cx="12" cy="12" r="7.5" />
    </svg>
  );
}

export function IconRefresh(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 11a8 8 0 10-2.3 5.7" />
      <path d="M20 4.5V11h-6.5" />
    </svg>
  );
}

export function IconAlert(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5l9.5 16.5h-19L12 3.5z" />
      <path d="M12 10v4.5M12 17.4v.1" />
    </svg>
  );
}

export function IconThermo(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10 14.5V5a2 2 0 114 0v9.5a4 4 0 11-4 0z" />
      <path d="M12 9v7" />
    </svg>
  );
}

export function IconPin(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 1113 0c0 5.3-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16M10 7V4.5h4V7M6.5 7l1 13h9l1-13" />
      <path d="M10.5 11v5.5M13.5 11v5.5" />
    </svg>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.6v.1" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function IconChevronLeft(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14.5 5.5L8 12l6.5 6.5" />
    </svg>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9.5 5.5L16 12l-6.5 6.5" />
    </svg>
  );
}

export function IconPlay(props: IconProps) {
  return (
    <svg {...base} fill="currentColor" stroke="none" {...props}>
      <path d="M8 5.5v13a1 1 0 001.5.86l11-6.5a1 1 0 000-1.72l-11-6.5A1 1 0 008 5.5z" />
    </svg>
  );
}

export function IconFlame(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3c.5 3-2 4.5-3.5 6.5C7 11.4 6.5 13 6.5 14.5a5.5 5.5 0 0011 0c0-2-1-3.5-2-4.5-.3 1.2-1 2-2 2 .7-3-.3-6-1.5-9z" />
    </svg>
  );
}

export function IconClock(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}