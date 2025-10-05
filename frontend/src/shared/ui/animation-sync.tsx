import { useEffect } from "react";
import { useAnimationStore } from "@/stores/animation-store";

export function AnimationSyncEffect() {
  const animationsEnabled = useAnimationStore((s) => s.animationsEnabled);

  useEffect(() => {
    const root = document.documentElement;
    if (animationsEnabled) {
      root.removeAttribute("data-reduce-animations");
    } else {
      root.setAttribute("data-reduce-animations", "true");
    }
  }, [animationsEnabled]);

  return null;
}
