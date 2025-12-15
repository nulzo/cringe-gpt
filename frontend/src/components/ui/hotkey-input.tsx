import { useState, type KeyboardEvent } from "react";

interface HotkeyInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function HotkeyInput({ value, onChange }: HotkeyInputProps) {
  const [editing, setEditing] = useState(false);

  const handleKeyDown = (e: KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // BUILD A KEYS STRING (you can make this smarter later)
    const keys: string[] = [];
    if (e.metaKey || e.ctrlKey) keys.push("mod");
    if (e.altKey) keys.push("alt");
    if (e.shiftKey) keys.push("shift");
    keys.push(e.key.toLowerCase());

    onChange(keys.join("+"));
    setEditing(false);
  };

  return (
    <button
      type="button"
      className="px-2 py-1 border rounded font-mono text-xs"
      onClick={() => setEditing(true)}
      onKeyDown={editing ? handleKeyDown : undefined}
    >
      {editing ? "Press keys…" : value.toUpperCase()}
    </button>
  );
}
