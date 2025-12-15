import { cn } from "@/lib/utils";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps, type Ref } from "react";

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

interface IconProps
  extends
    Omit<ComponentProps<"svg">, "ref" | "icon">,
    VariantProps<typeof iconVariants> {
  icon: IconSvgElement;
  ref?: Ref<SVGSVGElement>;
}

function Icon({
  className,
  icon,
  variant,
  size,
  strokeWidth = 2,
  ref,
  ...props
}: IconProps) {
  return (
    <HugeiconsIcon
      ref={ref}
      icon={icon}
      strokeWidth={strokeWidth as number}
      className={cn(iconVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Icon };
