"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createConcept, deleteConcept } from "@/lib/actions/concepts";
import { useToast } from "@/hooks/use-toast";
import type { Concept } from "@/types";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#06b6d4", "#a78bfa", "#f43f5e",
];

type ConceptsManagerProps = {
  initialConcepts: Concept[];
};

export function ConceptsManager({ initialConcepts }: ConceptsManagerProps) {
  const { toast } = useToast();
  const [concepts, setConcepts] = useState<Concept[]>(initialConcepts);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!newName.trim()) return;

    startTransition(async () => {
      try {
        const concept = await createConcept(newName.trim(), newColor);
        setConcepts((prev) => [...prev, concept].sort((a, b) => a.name.localeCompare(b.name)));
        setNewName("");
      } catch {
        toast({ title: "Failed to create concept", variant: "destructive" });
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteConcept(id);
        setConcepts((prev) => prev.filter((c) => c.id !== id));
      } catch {
        toast({ title: "Failed to delete concept", variant: "destructive" });
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Create form */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">Add concept</h2>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Smart Money Concept, ICT, Order Block..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="flex-1"
            />
            <Button variant="primary" onClick={handleCreate} disabled={isPending || !newName.trim()}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>

          <div>
            <p className="text-xs text-zinc-500 mb-2">Color</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewColor(color)}
                  className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: newColor === color ? "#fff" : "transparent",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Concepts list */}
      {concepts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 py-12 text-center">
          <p className="text-zinc-600 text-sm">No concepts yet. Add your first one above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {concepts.map((concept) => (
            <div
              key={concept.id}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: concept.color }}
                />
                <span className="text-sm text-zinc-200">{concept.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: concept.color + "20",
                    color: concept.color,
                    border: `1px solid ${concept.color}40`,
                  }}
                >
                  {concept.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-600 hover:text-red-400"
                  onClick={() => handleDelete(concept.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Common concepts suggestions */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
        <p className="text-xs text-zinc-500 mb-3">Suggested concepts</p>
        <div className="flex flex-wrap gap-2">
          {[
            "Order Block", "FVG", "BOS", "CHoCH", "Liquidity Sweep",
            "Inducement", "Premium/Discount", "MSS", "OTE", "Breaker Block",
            "ICT", "SMC", "Supply & Demand", "Support/Resistance", "VWAP",
          ].filter((name) => !concepts.find((c) => c.name === name)).map((name) => (
            <button
              key={name}
              onClick={() => setNewName(name)}
              className="text-xs px-2.5 py-1 rounded-full border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 transition-colors"
            >
              + {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
