import { useEffect, useRef } from "react";

/**
 * Registers a global single-key shortcut (no modifiers), e.g. "n" to open the
 * page's create dialog. Ignored while the user is typing in a form field or
 * when a modal/dialog is open, so it never hijacks normal input.
 */
export function useShortcut(key: string, handler: () => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== key.toLowerCase()) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) return;
      if (document.querySelector(".modal-overlay")) return;
      e.preventDefault();
      handlerRef.current();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [key]);
}
