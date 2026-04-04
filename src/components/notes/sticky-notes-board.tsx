"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StickyNoteCard } from "./sticky-note-card";
import { createNote } from "@/lib/actions/notes";
import type { StickyNote } from "@/types";

type StickyNotesBoardProps = {
  initialNotes: StickyNote[];
};

const NOTE_COLORS = [
  "#fef08a", // yellow
  "#bbf7d0", // green
  "#bfdbfe", // blue
  "#fecaca", // red
  "#e9d5ff", // purple
  "#fed7aa", // orange
];

export function StickyNotesBoard({ initialNotes }: StickyNotesBoardProps) {
  const [notes, setNotes] = useState<StickyNote[]>(initialNotes);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    startTransition(async () => {
      const note = await createNote();
      setNotes((prev) => [note, ...prev]);
    });
  }

  function handleDelete(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  function handleColorChange(id: string, color: string) {
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, color } : n));
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" onClick={handleCreate} disabled={isPending}>
        <Plus className="h-4 w-4" />
        New note
      </Button>

      {notes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 py-20 text-center">
          <p className="text-zinc-600 text-sm mb-3">No sticky notes yet</p>
          <Button variant="ghost" size="sm" onClick={handleCreate} disabled={isPending}>
            <Plus className="h-4 w-4" />
            Create your first note
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {notes.map((note) => (
            <StickyNoteCard
              key={note.id}
              note={note}
              colors={NOTE_COLORS}
              onDelete={handleDelete}
              onColorChange={handleColorChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
