import { getNotes } from "@/lib/actions/notes";
import { StickyNotesBoard } from "@/components/notes/sticky-notes-board";

export default async function NotesPage() {
  const notes = await getNotes();

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Notes</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Your sticky thoughts and reminders</p>
      </div>
      <StickyNotesBoard initialNotes={notes} />
    </div>
  );
}
