import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

type SpinnerProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

function Spinner({
  className,
  size = "md",
}: SpinnerProps) {
  const sizeClass =
    size === "sm"
      ? "h-4 w-4"
      : size === "lg"
      ? "h-8 w-8"
      : "h-6 w-6";

  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("animate-spin", sizeClass, className)}
    />
  );
}

export { Spinner };