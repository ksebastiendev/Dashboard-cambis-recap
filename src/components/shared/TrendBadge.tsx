import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatVariation } from "@/lib/formatters";

interface TrendBadgeProps {
  value: number | null; // % variation
  className?: string;
  showIcon?: boolean;
}

export function TrendBadge({
  value,
  className,
  showIcon = true,
}: TrendBadgeProps) {
  if (value === null) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
        {showIcon && <Minus className="h-3 w-3" />}
        <span>—</span>
      </span>
    );
  }

  const isPositive = value > 0;
  const isNeutral = value === 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        isNeutral && "text-muted-foreground",
        !isNeutral && isPositive && "text-success",
        !isNeutral && !isPositive && "text-destructive",
        className
      )}
    >
      {showIcon && (
        <>
          {isNeutral && <Minus className="h-3 w-3" />}
          {!isNeutral && isPositive && <TrendingUp className="h-3 w-3" />}
          {!isNeutral && !isPositive && <TrendingDown className="h-3 w-3" />}
        </>
      )}
      <span>{formatVariation(value)}</span>
    </span>
  );
}
