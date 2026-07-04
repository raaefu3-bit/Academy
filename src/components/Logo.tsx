import logoUrl from "@/assets/teachink-logo.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "default" | "light";
  animated?: boolean;
}

export function Logo({ className, animated = false }: LogoProps) {
  return (
    <img
      src={logoUrl}
      alt="TeachINK Academy"
      className={cn(
        "h-10 w-auto object-contain select-none",
        animated && "animate-logo-in",
        className,
      )}
      draggable={false}
    />
  );
}

export function LogoBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-card",
        className,
      )}
    >
      <img src={logoUrl} alt="TeachINK" className="h-7 w-auto" />
    </div>
  );
}
