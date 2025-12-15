import { hotkeyActions, type ActionId } from "@/configuration/hotkeys";
import { useHotkey, useHotkeyConfigStore } from "@/stores/hotkey-store";
import { HotkeyInput } from "@/components/ui/hotkey-input";
import { Separator } from "@/components/ui/separator";

export default function HotkeySettingsSection() {
  const setHotkey = useHotkeyConfigStore((s) => s.setHotkey);
  const resetHotkey = useHotkeyConfigStore((s) => s.resetHotkey);

  return (
    <div className="space-y-6">
      <header>
        <h3 className="text-lg font-medium">Keyboard Shortcuts</h3>
        <p className="text-sm text-muted-foreground">
          Click a binding then press your desired keys.
        </p>
      </header>

      {Object.values(hotkeyActions).map(({ id, label }) => {
        const current = useHotkey(id);
        return (
          <div key={id} className="flex items-center justify-between">
            <span>{label}</span>
            <div className="flex items-center gap-2">
              <HotkeyInput value={current} onChange={(v) => setHotkey(id, v)} />
              <button
                className="text-xs text-muted-foreground hover:underline"
                onClick={() => resetHotkey(id)}
              >
                Reset
              </button>
            </div>
          </div>
        );
      })}

      <Separator />
      <button
        className="text-xs text-muted-foreground hover:underline"
        onClick={() => useHotkeyConfigStore.getState().resetAllHotkeys()}
      >
        Reset all to default
      </button>
    </div>
  );
}
