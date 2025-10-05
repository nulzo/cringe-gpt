import { type ElementType } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const SIDEBAR_TRANSITION_DURATION = 300;

interface SidebarNavItemProps {
  item: {
    id: string;
    name: string;
    icon: ElementType;
    path?: string;
    shortcut?: string;
  };
  isOpen: boolean;
  onClick?: () => void;
}

export function SidebarNavItem({ item, isOpen, onClick }: SidebarNavItemProps) {
  const { icon: Icon, name, path, shortcut } = item;
  const location = useLocation();

  // More robust active detection for root vs temp chat vs nested paths
  const isActive = (() => {
    if (!path) return false;
    if (path === "/") {
      return (
        location.pathname === "/" && !location.search.includes("temp=true")
      );
    }
    if (path === "/?temp=true") {
      return location.pathname === "/" && location.search.includes("temp=true");
    }
    return location.pathname.startsWith(path);
  })();

  const content = (
    <>
      <div
        className={cn(
          "absolute left-0 top-0 h-full rounded-md",
          isActive ? "bg-sidebar-hover" : "group-hover:bg-sidebar-hover"
        )}
        style={{
          left: isOpen ? "0px" : "8px",
          width: isOpen ? "100%" : "40px",
          transitionProperty: "width, left, background-color",
          transitionTimingFunction: "ease-out",
          transitionDuration: `${SIDEBAR_TRANSITION_DURATION}ms`,
        }}
      />
      <div
        className={cn(
          "w-[56px] h-full flex-shrink-0 flex items-center justify-center z-10",
          isActive
            ? "text-accent-foreground"
            : "text-muted-foreground group-hover:text-foreground"
        )}
      >
        <Icon size={18} />
      </div>
      <div
        className={cn(
          "flex-1 flex items-center justify-between whitespace-nowrap overflow-hidden z-10",
          "transition-[opacity,transform] duration-200 ease-out",
          isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1.5"
        )}
        style={{
          transitionDelay: isOpen ? "100ms" : "0ms",
        }}
      >
        <span
          className={cn(
            isActive ? "text-accent-foreground" : "group-hover:text-foreground"
          )}
        >
          {name}
        </span>
        {shortcut && (
          <kbd className="pointer-events-none mr-2 h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 flex">
            <span className="text-xs">⌘</span>
            {shortcut}
          </kbd>
        )}
      </div>
    </>
  );

  const commonClasses = `flex items-center w-full h-9 rounded text-sm font-base text-muted-foreground transition-colors group relative overflow-hidden`;

  const useLink = Boolean(path) && !onClick && isOpen;
  const Element = useLink ? Link : "button";
  const elementProps = useLink
    ? { to: path as string }
    : { onClick, type: "button" };

  return (
    <Tooltip key={item.id} disableHoverableContent={isOpen}>
      <TooltipTrigger asChild>
        <Element
          {...elementProps}
          className={commonClasses}
          aria-disabled={!useLink}
          tabIndex={useLink ? 0 : -1}
        >
          {content}
        </Element>
      </TooltipTrigger>
      {!isOpen && (
        <TooltipContent side="right" sideOffset={4}>
          <p>{name}</p>
        </TooltipContent>
      )}
    </Tooltip>
  );
}
