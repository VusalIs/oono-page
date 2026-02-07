import { createElement, memo, useEffect, useRef } from "react";

interface StoryPlayerOverlayProps {
  storyUrl: string;
  collectionName: string;
  onClose: () => void;
}

/**
 * amp-story-player config per spec:
 * https://github.com/ampproject/amphtml/blob/main/docs/spec/amp-story-player.md
 * - close at start (Example #1)
 * - pageScroll: false for fullscreen/lightbox so background doesn't scroll
 */
const PLAYER_CONFIG = {
  controls: [{ name: "close", position: "start" as const }],
  behavior: {
    autoplay: true,
    pageScroll: false as const,
  },
};

function StoryPlayerOverlayComponent({
  storyUrl,
  collectionName,
  onClose,
}: StoryPlayerOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const player = el.querySelector("amp-story-player");
    if (!player) return;
    player.addEventListener("amp-story-player-close", onClose);
    return () => player.removeEventListener("amp-story-player-close", onClose);
  }, [onClose]);

  // amp-story-player loads the story on user interaction; trigger the anchor click so the request fires immediately
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !storyUrl) return;
    const t = setTimeout(() => {
      const player = el.querySelector("amp-story-player");
      const anchor = player?.querySelector("a[href]");
      if (anchor instanceof HTMLAnchorElement) {
        anchor.click();
      }
    }, 50);
    return () => clearTimeout(t);
  }, [storyUrl]);

  const fullUrl = storyUrl.startsWith("http")
    ? storyUrl
    : `${window.location.origin}${storyUrl}`;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Story player"
    >
      <div className="relative h-full w-full" ref={containerRef}>
        {createElement(
          "amp-story-player",
          { style: { width: "100vw", height: "100vh" } },
          createElement("script", {
            type: "application/json",
            dangerouslySetInnerHTML: { __html: JSON.stringify(PLAYER_CONFIG) },
          }),
          createElement("a", { href: fullUrl }, collectionName),
        )}
      </div>
    </div>
  );
}

export const StoryPlayerOverlay = memo(StoryPlayerOverlayComponent);
