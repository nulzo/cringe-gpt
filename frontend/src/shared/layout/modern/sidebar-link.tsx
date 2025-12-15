import { Link, useLocation } from "react-router-dom";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";

export const sidebarLinkVariants = cva(
  "relative flex font-base items-center overflow-hidden rounded-md text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-hover hover:text-accent-foreground",
        ghost: "hover:bg-primary/10 hover:text-accent-foreground",
      },
      size: {
        default: "h-9",
        sm: "min-h-9",
        lg: "min-h-12",
      },
      active: {
        true: "bg-sidebar-hover/75 text-foreground shadow-sm",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      active: false,
    },
  },
);

interface SidebarLinkProps
  extends
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">,
    VariantProps<typeof sidebarLinkVariants> {
  collapsed?: boolean;
  icon?: any;
  showActiveIndicator?: boolean;
  to: string;
  exact?: boolean;
  trailing?: React.ReactNode;
}

export function SidebarLink({
  className,
  variant,
  size,
  active,
  collapsed = false,
  icon,
  showActiveIndicator = true,
  children,
  to,
  exact = false,
  trailing,
  ...props
}: SidebarLinkProps) {
  const location = useLocation();
  const isActive =
    active ??
    (exact ? location.pathname === to : location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={cn(
        sidebarLinkVariants({ variant, size, active: isActive }),
        className,
      )}
      {...props}
    >
      {/* Icon wrapper */}
      <div className="flex items-center justify-center shrink-0 size-11">
        <HugeiconsIcon
          icon={icon}
          strokeWidth={2}
          className="size-5"
          data-icon="inline-start"
        />
      </div>

      {/* Text content wrapper with fade/slide animation */}
      <div
        className={cn(
          "ml-1 flex-1 text-sm whitespace-nowrap overflow-hidden transition-none",
          !collapsed
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-2.5 pointer-events-none",
        )}
      >
        {children}
      </div>

      {/* Optional trailing content */}
      {trailing && (
        <div
          className={cn(
            "shrink-0 ml-2",
            !collapsed ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          {trailing}
        </div>
      )}
    </Link>
  );
}
