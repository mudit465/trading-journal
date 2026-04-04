"use client";

import { useState, useRef, useTransition } from "react";
import { X, Palette } from "lucide-react";
import { updateNote, deleteNote } from "@/lib/actions/notes";
import type { StickyNote } from "@/types";
import { cn } from "@/lib/utils";

type StickyNoteCardProps = {
  note: StickyNote;
  colors: string[];
  onDelete: (id: string) => void;
  onColorChange: (id: string, color: string) => void;
};

export function StickyNoteCard({ note, colors, onDelete, onColorChange }: StickyNoteCardProps) {
  const [content, setContent] = useState(note.content);
  const [showColors, setShowColors] = useState(false);
  const [isPending, startTransition] = useTransition();
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleContentChange(value: string) {
    setContent(value);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      startTransition(async () => {
        await updateNote(note.id, { content: value });
      });
    }, 800);
  }

  function handleColorChange(color: string) {
    onColorChange(note.id, color);
    setShowColors(false);
    startTransition(async () => {
      await updateNote(note.id, { color });
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteNote(note.id);
      onDelete(note.id);
    });
  }

  // Determine text color for readability
  const isLight = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 180;
  };

  const textColor = isLight(note.color) ? "#1c1917" : "#fafaf9";
  const mutedColor = isLight(note.color) ? "#78716c" : "#d6d3d1";

  return (
    <div
      className="rounded-xl p-4 flex flex-col min-h-[160px] shadow-sm transition-shadow hover:shadow-md relative group"
      style={{ backgroundColor: note.color }}
    >
      {/* Actions */}
      <div className="flex items-center justify-end gap-1 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            onClick={() => setShowColors((v) => !v)}
            className="p-1 rounded hover:bg-black/10 transition-colors"
            style={{ color: mutedColor }}
          >
            <Palette className="h-3.5 w-3.5" />
          </button>
          {showColors && (
            <div className="absolute right-0 top-7 z-10 flex gap-1 bg-zinc-900 rounded-lg p-2 border border-zinc-700 shadow-xl">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => handleColorChange(c)}
                  className={cn(
                    "h-5 w-5 rounded-full border-2 transition-transform hover:scale-110",
                    c === note.color ? "border-zinc-300" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="p-1 rounded hover:bg-black/10 transition-colors"
          style={{ color: mutedColor }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content */}
      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="Write a note..."
        className="flex-1 w-full bg-transparent resize-none outline-none text-sm leading-relaxed placeholder:opacity-40"
        style={{ color: textColor }}
      />

      {/* Auto-save indicator */}
      {isPending && (
        <div className="absolute bottom-2 right-2 text-[10px] opacity-40" style={{ color: textColor }}>
          saving...
        </div>
      )}
    </div>
  );
}
