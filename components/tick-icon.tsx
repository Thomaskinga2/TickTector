import type { SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & { strokeWidth?: number };

// Line symbols in the same 24-point grid and stroke as lucide, so they sit beside it in bars and headers.
function Symbol({ strokeWidth = 2, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

// A deer tick seen from above: mouthparts, shield edge, body, eight legs.
export function TickIcon(props: IconProps) {
  return (
    <Symbol {...props}>
      <path d="M10.6 6.6h2.8" />
      <ellipse cx="12" cy="13.6" rx="5" ry="6.2" />
      <path d="M7.3 11.6q4.7 3.4 9.4 0" />
      <path d="M7.7 9.4 5 6.6M7.1 11.9 3.6 10.6M7.1 14.6 3.6 15.6M7.8 17.2 5.2 20" />
      <path d="M16.3 9.4 19 6.6M16.9 11.9l3.5-1.3M16.9 14.6l3.5 1M16.2 17.2l2.6 2.8" />
    </Symbol>
  );
}

// Scan: the tick inside a camera viewfinder.
export function ScanTickIcon(props: IconProps) {
  return (
    <Symbol {...props}>
      <path d="M3 7.5V5a2 2 0 0 1 2-2h2.5M16.5 3H19a2 2 0 0 1 2 2v2.5M21 16.5V19a2 2 0 0 1-2 2h-2.5M7.5 21H5a2 2 0 0 1-2-2v-2.5" />
      <ellipse cx="12" cy="12.8" rx="2.9" ry="3.6" />
      <path d="M11 8.4h2" />
      <path d="M9.4 10.8 7.6 9.4M9.1 13 7.2 13M9.4 15.1l-1.6 1.5M14.6 10.8l1.8-1.4M14.9 13h1.9M14.6 15.1l1.6 1.5" />
    </Symbol>
  );
}
