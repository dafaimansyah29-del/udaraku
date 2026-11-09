import { memo } from "react";
import { IconWind } from "./Icons";

function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan to-biru text-white shadow-[0_6px_16px_-4px_rgba(34,211,238,0.7)]">
        <IconWind className="h-5 w-5" />
      </span>
      <span className="font-heading text-lg font-extrabold tracking-tight text-white">
        Udara<span className="text-cyan">Ku</span>
      </span>
    </span>
  );
}

export default memo(Logo);
