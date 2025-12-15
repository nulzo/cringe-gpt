"use client";

import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useUIState } from "./ui-state-provider";
import { useLogout } from "@/features/auth/api/logout";
import { PATHS } from "@/configuration/paths";
import {
  IconBellRinging,
  IconBrandGithub,
  IconLogout,
  IconRosetteDiscountCheck,
  IconUserCircle,
  IconSettings,
  IconLifebuoy,
} from "@tabler/icons-react";

const SIDEBAR_TRANSITION_DURATION = 300;

interface NavUserProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  isOpen: boolean;
}

export function NavUser({ user, isOpen }: NavUserProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { openSettingsModal } = useUIState();
  const navigate = useNavigate();
  const { mutateAsync: logout, isPending: isLoggingOut } = useLogout({
    onSuccess: () => navigate(PATHS.LOGIN.path, { replace: true }),
  });

  const handleLogout = async () => {
    await logout();
  };

  const popoverItemsTop = [
    {
      icon: IconUserCircle,
      label: "Profile",
      onClick: () => {},
    },
    {
      icon: IconRosetteDiscountCheck,
      label: "Account",
      onClick: () => {},
    },
    {
      icon: IconBellRinging,
      label: "Notifications",
      onClick: () => {},
    },
    {
      icon: IconSettings,
      label: "Settings",
      onClick: (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        openSettingsModal();
      },
    },
  ];

  const popoverItemsBottom = [
    {
      icon: IconLifebuoy,
      label: "Help",
      onClick: () => {},
    },
    {
      icon: IconBrandGithub,
      label: "Source Code",
      onClick: () => {},
    },
    {
      icon: IconLogout,
      label: "Log out",
      onClick: handleLogout,
      disabled: isLoggingOut,
    },
  ];

  const userButton = (
    <button
      className="group relative flex items-center rounded w-full h-12 overflow-hidden font-base text-muted-foreground hover:text-foreground text-sm transition-colors hover:cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background hover effect - matches exact pattern */}
      <div
        className={cn(
          "absolute left-0 top-0 h-full rounded-md transition-all ease-out",
          isHovered ? "bg-sidebar-hover" : "bg-transparent",
        )}
        style={{
          left: isOpen ? "0px" : "8px",
          width: isOpen ? "100%" : "40px",
          transitionDuration: `${SIDEBAR_TRANSITION_DURATION}ms`,
        }}
      />

      {/* Avatar area - matches exact icon area sizing */}
      <div className="z-10 flex flex-shrink-0 justify-center items-center w-[56px] h-full text-muted-foreground group-hover:text-foreground">
        <Avatar className="rounded-full w-[18px] h-[18px]">
          {user.avatar ? (
            <AvatarImage src={user.avatar} alt={user.name} />
          ) : null}
          <AvatarFallback className="bg-primary font-medium text-[10px] text-primary-foreground">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* User info area - matches exact text area pattern */}
      <div
        className={cn(
          "flex-1 flex items-center justify-between whitespace-nowrap overflow-hidden z-10",
          "transition-[opacity,transform] duration-200 ease-out",
          isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1.5",
        )}
        style={{
          transitionDelay: isOpen ? "100ms" : "0ms",
        }}
      >
        <div className="flex flex-col flex-1 justify-center items-start min-w-0">
          <span className="font-medium text-foreground group-hover:text-foreground text-sm truncate leading-tight">
            {user.name}
          </span>
          <span className="text-muted-foreground text-xs truncate leading-tight">
            {user.email}
          </span>
        </div>
        <ChevronsUpDown className="flex-shrink-0 ml-2 pr-2 size-5 text-muted-foreground" />
      </div>
    </button>
  );

  const dropdownContent = (
    <DropdownMenuContent
      className="bg-popover shadow-lg backdrop-blur-sm border-border rounded-lg w-[235px]"
      side="top"
      align="start"
      sideOffset={8}
    >
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border">
          <Avatar className="border border-border/40 rounded-full w-8 h-8">
            {user.avatar ? (
              <AvatarImage src={user.avatar} alt={user.name} />
            ) : null}
            <AvatarFallback className="bg-primary font-medium text-primary-foreground text-xs">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-foreground text-sm truncate leading-tight">
              {user.name}
            </div>
            <div className="mt-0.5 text-muted-foreground/70 text-xs truncate leading-tight">
              {user.email}
            </div>
          </div>
        </div>
      </DropdownMenuLabel>
      <div className="py-1">
        {popoverItemsTop.map((item) => (
          <DropdownMenuItem
            key={item.label}
            onSelect={item.onClick}
            className="gap-3 px-2 py-2 text-sm transition-colors cursor-pointer hover:bg-popover-hover"
          >
            <item.icon className="size-5 text-foreground/90" />
            {item.label}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="m-1 bg-border" />

        {popoverItemsBottom.map((item) => (
          <DropdownMenuItem
            key={item.label}
            onSelect={(e) => {
              e.preventDefault();
              item.onClick?.(e as any);
            }}
            disabled={(item as any).disabled}
            className="gap-3 px-2 py-2 text-sm transition-colors cursor-pointer"
          >
            <item.icon className="size-5 text-foreground/90" />
            {item.label}
          </DropdownMenuItem>
        ))}
      </div>
    </DropdownMenuContent>
  );

  const collapsedButton = (
    <button
      className="group relative flex items-center rounded w-full h-10 overflow-hidden font-base text-muted-foreground hover:text-foreground text-sm transition-colors pointer-events-auto"
      style={{
        transitionDuration: `${SIDEBAR_TRANSITION_DURATION}ms`,
      }}
    >
      <div
        className="top-0 left-0 absolute group-hover:bg-sidebar-hover rounded-md h-full transition-all ease-in-out"
        style={{
          left: "8px",
          width: "40px",
          transitionDuration: `${SIDEBAR_TRANSITION_DURATION}ms`,
        }}
      />
      <div className="z-10 flex flex-shrink-0 justify-center items-center w-[56px] h-full text-muted-foreground group-hover:text-foreground">
        <Avatar className="rounded-full w-[18px] h-[18px]">
          {user.avatar ? (
            <AvatarImage src={user.avatar} alt={user.name} />
          ) : null}
          <AvatarFallback className="bg-primary font-medium text-[10px] text-primary-foreground">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      </div>
    </button>
  );

  if (!isOpen) {
    return (
      <Tooltip disableHoverableContent={isOpen}>
        <TooltipTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>{collapsedButton}</DropdownMenuTrigger>
            {dropdownContent}
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={4}>
          <p>{user.name}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{userButton}</DropdownMenuTrigger>
      {dropdownContent}
    </DropdownMenu>
  );
}
