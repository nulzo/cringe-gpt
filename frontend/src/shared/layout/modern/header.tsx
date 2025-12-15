import {
  Search,
  Bell,
  Menu,
  Sun,
  Moon,
  MessageSquare,
  Monitor,
} from "lucide-react";
import { useUIState } from "@/shared/layout/ui-state-provider";
import { useTheme } from "@/shared/ui/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function Header() {
  const { toggleMobileMenu, openCommandPalette } = useUIState();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <header className="sticky top-0 z-30 flex justify-between h-[72px] items-center gap-4 bg-background px-6 rounded-xl shadow-sm border border-border/50">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden -ml-2 text-muted-foreground"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          className="pl-10 pr-4 text-sm"
          placeholder="Search"
          onClick={openCommandPalette}
          readOnly
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Button
          size="icon"
          variant="outline"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="relative"
        >
          <Sun
            className={cn(
              "absolute inset-0 m-auto h-5 w-5 transition-all",
              theme === "light" ? "scale-100 rotate-0" : "scale-0 rotate-90",
            )}
          />
          <Moon
            className={cn(
              "absolute inset-0 m-auto h-5 w-5 transition-all",
              theme === "dark" ? "scale-100 rotate-0" : "scale-0 rotate-90",
            )}
          />
          <Monitor
            className={cn(
              "absolute inset-0 m-auto h-5 w-5 transition-all",
              theme === "system" ? "scale-100 rotate-0" : "scale-0 rotate-90",
            )}
          />
        </Button>

        {/* Notifications */}
        <Button
          size="icon"
          variant="outline"
          className="relative inline-flex"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
          </span>
        </Button>

        {/* Messages */}
        <Button
          size="icon"
          variant="outline"
          className="relative inline-flex"
          aria-label="Messages"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
          </span>
        </Button>

        {/* Divider */}
        <div className="h-6 w-px bg-border mx-1"></div>

        <section>
          <Select defaultValue="apple">
            <SelectTrigger className="min-w-[175px]">
              <SelectValue placeholder="Select a workspace" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="orange">Orange</SelectItem>
              <SelectItem value="grape">Grape</SelectItem>
              <SelectItem value="mango" disabled>
                Mango (Disabled)
              </SelectItem>
            </SelectContent>
          </Select>
        </section>
      </div>
    </header>
  );
}
