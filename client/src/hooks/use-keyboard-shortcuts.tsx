import { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface ShortcutAction {
  key: string;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts() {
  const [, setLocation] = useLocation();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const shortcuts: ShortcutAction[] = [
    {
      key: "ctrl+k",
      action: () => setIsCommandPaletteOpen(true),
      description: "Open command palette"
    },
    {
      key: "ctrl+1",
      action: () => setLocation("/dashboard"),
      description: "Go to Dashboard"
    },
    {
      key: "ctrl+2", 
      action: () => setLocation("/contacts"),
      description: "Go to Contacts"
    },
    {
      key: "ctrl+3",
      action: () => setLocation("/deals"),
      description: "Go to Deals"
    },
    {
      key: "ctrl+4",
      action: () => setLocation("/tasks"),
      description: "Go to Tasks"
    },
    {
      key: "ctrl+shift+c",
      action: () => setLocation("/contacts?action=create"),
      description: "Create new contact"
    },
    {
      key: "ctrl+shift+d",
      action: () => setLocation("/deals?action=create"),
      description: "Create new deal"
    },
    {
      key: "ctrl+shift+t",
      action: () => setLocation("/tasks?action=create"),
      description: "Create new task"
    }
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = [
        event.ctrlKey && "ctrl",
        event.shiftKey && "shift", 
        event.altKey && "alt",
        event.key?.toLowerCase()
      ].filter(Boolean).join("+");

      const shortcut = shortcuts.find(s => s.key === key);
      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setLocation]);

  return { 
    shortcuts, 
    isCommandPaletteOpen, 
    setIsCommandPaletteOpen 
  };
}