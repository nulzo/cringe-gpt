import { cn } from "@/lib/utils";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { cva, type VariantProps } from "class-variance-authority";

interface IconType {
  className?: string;
  icon: IconSvgElement;
  stroke?: number;
}

const iconVariants = cva("inline-flex shrink-0 text-foreground", {
  variants: {
    variant: {
      default: "text-foreground",
      muted: "text-muted-foreground hover:text-foreground",
    },
    size: {
      default: "size-5",
      sm: "size-3.5",
      lg: "size-6",
      icon: "size-4 shrink-0",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

function Icon({
  className,
  icon,
  variant,
  size,
  stroke = 2,
  ...props
}: IconType & VariantProps<typeof iconVariants>) {
  return (
    <HugeiconsIcon
      icon={icon}
      strokeWidth={2}
      className={cn(iconVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Icon };
