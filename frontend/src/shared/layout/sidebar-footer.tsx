import { useSettings } from "@/features/settings/api/get-settings";
import { NavUser } from "@/shared/layout/nav-user";

interface SidebarFooterProps {
  isOpen: boolean;
}

export function SidebarFooter({ isOpen }: SidebarFooterProps) {
  const { data: settings } = useSettings();

  return (
    <div className="mb-4 p-2 pt-2">
      <NavUser
        user={{
          name: settings?.name || "Guest",
          email: settings?.email || "",
          avatar: settings?.avatar || "",
        }}
        isOpen={isOpen}
      />
    </div>
  );
}
