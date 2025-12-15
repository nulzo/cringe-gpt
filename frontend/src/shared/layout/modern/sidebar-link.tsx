import { Link, useLocation } from "react-router-dom";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const sidebarLinkVariants = cva(
  "relative flex font-medium items-center overflow-hidden rounded-xl text-muted-foreground transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group",
  {
    variants: {
      variant: {
        default: "hover:bg-accent/40 hover:text-accent-foreground",
        ghost: "hover:bg-primary/10 hover:text-accent-foreground",
      },
      size: {
        default: "h-10",
        sm: "min-h-9",
        lg: "min-h-12",
      },
      active: {
        true: "bg-accent/40 text-foreground shadow-sm",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      active: false,
    },
  }
);

interface SidebarLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">,
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
  icon: Icon,
  showActiveIndicator = true,
  children,
  to,
  exact = false,
  trailing,
  ...props
}: SidebarLinkProps) {
  const location = useLocation();
  const isActive = active ?? (exact ? location.pathname === to : location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={cn(sidebarLinkVariants({ variant, size, active: isActive }), className)}
      {...props}
    >
      {/* Active indicator stripe */}
      {showActiveIndicator && (
        <div
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r transition-opacity duration-200",
            isActive ? "opacity-100" : "opacity-0"
          )}
        />
      )}

      {/* Icon wrapper */}
      <div className="flex items-center justify-center shrink-0 size-11">
        {Icon && <Icon className="h-5 w-5 transition-colors duration-200" />}
      </div>

      {/* Text content wrapper with fade/slide animation */}
      <div
        className={cn(
          "ml-1 flex-1 text-sm whitespace-nowrap overflow-hidden transition-all duration-200",
          !collapsed ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2.5 pointer-events-none"
        )}
        style={{ transitionDelay: collapsed ? "0ms" : "50ms" }}
      >
        {children}
      </div>

      {/* Optional trailing content */}
      {trailing && (
        <div
          className={cn(
            "shrink-0 ml-2 transition-all duration-200",
            !collapsed ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          {trailing}
        </div>
      )}
    </Link>
  );
}

