import {
  IconChartHistogram,
  IconGhost2,
  IconMessageDots,
  IconSearch,
} from "@tabler/icons-react";
import { SidebarNavItem } from "./sidebar-nav-item";
import { useUIState } from "./ui-state-provider";

const navLinks = [
  {
    id: "chat",
    name: "New Chat",
    icon: IconMessageDots,
    path: "/",
    shortcut: "O",
  },
  {
    id: "temp-chat",
    name: "Private Chat",
    icon: IconGhost2,
    path: "/?temp=true",
  },
  {
    id: "dashboard",
    name: "Dashboard",
    icon: IconChartHistogram,
    path: "/dashboard",
  },
];

const searchLink = {
  id: "search",
  name: "Search",
  icon: IconSearch,
  shortcut: "K",
};

interface SidebarNavProps {
  isOpen: boolean;
}

export function SidebarNav({ isOpen }: SidebarNavProps) {
  const { openCommandPalette } = useUIState();

  return (
    <div className="space-y-1 p-2">
      {navLinks.map((item) => (
        <SidebarNavItem key={item.id} item={item} isOpen={isOpen} />
      ))}
      <SidebarNavItem
        item={searchLink}
        isOpen={isOpen}
        onClick={openCommandPalette}
      />
    </div>
  );
}
