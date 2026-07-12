export type HistoryShortcut = "undo" | "redo" | null;

export function isTypingTarget(target: EventTarget | null) {
  return (
    typeof HTMLElement !== "undefined" &&
    target instanceof HTMLElement &&
    (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
      target.isContentEditable)
  );
}

export function hasPrimaryModifier(
  event: Pick<KeyboardEvent, "metaKey" | "ctrlKey">,
) {
  return event.metaKey || event.ctrlKey;
}

export function getHistoryShortcut(
  event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "shiftKey">,
): HistoryShortcut {
  if (!hasPrimaryModifier(event)) return null;
  const key = event.key.toLowerCase();
  if (key === "y") return "redo";
  if (key === "z") return event.shiftKey ? "redo" : "undo";
  return null;
}
