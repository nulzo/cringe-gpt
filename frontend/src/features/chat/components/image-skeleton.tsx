import { IconPhoto } from "@tabler/icons-react";
import { useAnimationStore } from "@/stores/animation-store";

export function ImageSkeleton() {
  const { animationsEnabled } = useAnimationStore();

  return (
    <div className="w-full max-w-sm rounded-lg overflow-hidden">
      <div className="w-full aspect-[4/3] bg-muted flex items-center justify-center rounded-lg relative overflow-hidden">
        {/* Base skeleton */}
        <div
          className={`absolute inset-0 bg-muted ${
            animationsEnabled ? "animate-pulse" : ""
          }`}
        />

        {/* Always show some noise effect */}
        <div className="absolute inset-0 isolate">
          {animationsEnabled ? (
            <>
              {/* Ultra-chaotic animated noise */}
              <div
                className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] animate-ultra-chaos-1"
                style={{
                  background: `
                    radial-gradient(circle at 20% 20%, hsl(var(--primary)), transparent 40%),
                    radial-gradient(circle at 80% 80%, hsl(var(--chart-1)), transparent 40%),
                    radial-gradient(circle at 60% 40%, hsl(var(--chart-4)), transparent 40%),
                    url("data:image/svg+xml,%3Csvg viewBox='0 0 600 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='ultraNoise1'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='4.5' numOctaves='12' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23ultraNoise1)'/%3E%3C/svg%3E")
                  `,
                  filter: "contrast(450%) brightness(2400%) saturate(350%)",
                  mixBlendMode: "screen",
                }}
              />

              <div
                className="absolute -top-[15%] -left-[15%] w-[130%] h-[130%] animate-ultra-chaos-2"
                style={{
                  background: `
                    linear-gradient(45deg, hsl(var(--chart-2)), transparent 30%),
                    linear-gradient(-45deg, hsl(var(--chart-3)), transparent 30%),
                    linear-gradient(135deg, hsl(var(--destructive)), transparent 30%),
                    url("data:image/svg+xml,%3Csvg viewBox='0 0 600 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='ultraNoise2'%3E%3CfeTurbulence type='turbulence' baseFrequency='6.2' numOctaves='15' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23ultraNoise2)'/%3E%3C/svg%3E")
                  `,
                  filter: "contrast(520%) brightness(2700%) invert(40%)",
                  mixBlendMode: "color-dodge",
                }}
              />

              <div
                className="absolute -top-[10%] -left-[10%] w-[120%] h-[120%] animate-ultra-chaos-3"
                style={{
                  background: `
                    conic-gradient(from 0deg, hsl(var(--chart-1)), hsl(var(--chart-2)), hsl(var(--primary)), hsl(var(--chart-4))),
                    url("data:image/svg+xml,%3Csvg viewBox='0 0 600 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='ultraNoise3'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='7.8' numOctaves='18' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23ultraNoise3)'/%3E%3C/svg%3E")
                  `,
                  filter: "contrast(580%) brightness(3000%) hue-rotate(60deg)",
                  mixBlendMode: "hard-light",
                }}
              />

              <div
                className="absolute -top-[5%] -left-[5%] w-[110%] h-[110%] animate-ultra-chaos-4"
                style={{
                  background: `
                    radial-gradient(ellipse at 10% 90%, hsl(var(--chart-4)), transparent),
                    radial-gradient(ellipse at 90% 10%, hsl(var(--chart-3)), transparent),
                    radial-gradient(ellipse at 50% 50%, hsl(var(--chart-2)), transparent),
                    url("data:image/svg+xml,%3Csvg viewBox='0 0 600 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='ultraNoise4'%3E%3CfeTurbulence type='turbulence' baseFrequency='9.5' numOctaves='20' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23ultraNoise4)'/%3E%3C/svg%3E")
                  `,
                  filter: "contrast(650%) brightness(3500%) saturate(400%)",
                  mixBlendMode: "difference",
                }}
              />
            </>
          ) : (
            <>
              {/* Static noise effect for when animations are disabled */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: `
                    linear-gradient(135deg, hsl(var(--primary) / 0.2), transparent 60%),
                    url("data:image/svg+xml,%3Csvg viewBox='0 0 400 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='staticNoise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3.5' numOctaves='8' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23staticNoise)'/%3E%3C/svg%3E")
                  `,
                  filter: "contrast(200%) brightness(1200%)",
                  mixBlendMode: "soft-light",
                }}
              />

              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background: `
                    linear-gradient(45deg, hsl(var(--chart-1) / 0.15), transparent 50%),
                    url("data:image/svg+xml,%3Csvg viewBox='0 0 400 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='staticNoise2'%3E%3CfeTurbulence type='turbulence' baseFrequency='2.8' numOctaves='6' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23staticNoise2)'/%3E%3C/svg%3E")
                  `,
                  filter: "contrast(180%) brightness(900%)",
                  mixBlendMode: "overlay",
                }}
              />
            </>
          )}
        </div>

        {/* Icon */}
        <div className="relative z-10">
          <IconPhoto className="w-12 h-12 text-muted-foreground/60" />
        </div>

        {/* Debug info - remove this after testing */}
        <div className="absolute top-2 left-2 text-xs text-foreground/70 bg-background/80 px-1 rounded">
          {animationsEnabled ? "Animated" : "Static"}
        </div>
      </div>
    </div>
  );
}
