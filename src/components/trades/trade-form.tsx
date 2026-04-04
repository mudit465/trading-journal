"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Upload, X, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createTrade, updateTrade } from "@/lib/actions/trades";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Concept, Trade } from "@/types";

const tradeSchema = z.object({
  date: z.string().min(1, "Date is required"),
  instrument: z.string().min(1, "Instrument is required"),
  direction: z.enum(["LONG", "SHORT"]),
  session: z.enum(["LONDON", "NEW_YORK", "ASIAN", "SYDNEY", "OVERLAP", "OTHER"]).optional().nullable(),
  entry_time: z.string().optional(),
  exit_time: z.string().optional(),
  risk_amount: z.preprocess((v) => Number(v), z.number().min(0)),
  rr_ratio: z.preprocess((v) => Number(v), z.number().min(0)),
  sl_pips: z.preprocess((v) => Number(v), z.number().min(0)),
  tp_pips: z.preprocess((v) => Number(v), z.number().min(0)),
  profit_loss: z.preprocess((v) => Number(v), z.number()),
  status: z.enum(["WIN", "LOSS", "BREAKEVEN"]),
  notes: z.string().optional(),
  tp_levels: z.array(
    z.object({
      level: z.preprocess((v) => Number(v), z.number()),
      pips: z.preprocess((v) => Number(v), z.number()),
      price: z.preprocess((v) => (v === "" || v === null || v === undefined ? null : Number(v)), z.number().nullable()),
      hit: z.boolean().default(false),
    })
  ).optional(),
});

type TradeFormValues = {
  date: string;
  instrument: string;
  direction: "LONG" | "SHORT";
  session?: "LONDON" | "NEW_YORK" | "ASIAN" | "SYDNEY" | "OVERLAP" | "OTHER" | null;
  entry_time?: string;
  exit_time?: string;
  risk_amount: number;
  rr_ratio: number;
  sl_pips: number;
  tp_pips: number;
  profit_loss: number;
  status: "WIN" | "LOSS" | "BREAKEVEN";
  notes?: string;
  tp_levels?: { level: number; pips: number; price: number | null; hit: boolean }[];
};

type TradeFormProps = {
  concepts: Concept[];
  defaultDate?: string;
  trade?: Trade;
};

export function TradeForm({ concepts, defaultDate, trade }: TradeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>(trade?.concepts ?? []);
  const [checklist, setChecklist] = useState<Record<string, boolean>>(trade?.checklist ?? {});
  const [files, setFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<TradeFormValues>({
    resolver: zodResolver(tradeSchema) as Resolver<TradeFormValues>,
    defaultValues: {
      date: trade?.date ?? defaultDate ?? new Date().toISOString().split("T")[0],
      instrument: trade?.instrument ?? "",
      direction: trade?.direction ?? "LONG",
      session: trade?.session ?? null,
      entry_time: trade?.entry_time ?? "",
      exit_time: trade?.exit_time ?? "",
      risk_amount: trade?.risk_amount ?? 0,
      rr_ratio: trade?.rr_ratio ?? 0,
      sl_pips: trade?.sl_pips ?? 0,
      tp_pips: trade?.tp_pips ?? 0,
      profit_loss: trade?.profit_loss ?? 0,
      status: trade?.status ?? "WIN",
      notes: trade?.notes ?? "",
      tp_levels: trade?.tp_levels?.map((tp) => ({
        level: tp.level,
        pips: tp.pips,
        price: tp.price ?? null,
        hit: tp.hit,
      })) ?? [],
    },
  });

  const { fields: tpFields, append: appendTp, remove: removeTp } = useFieldArray({
    control,
    name: "tp_levels",
  });

  function toggleConcept(name: string) {
    setSelectedConcepts((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
    // Also update checklist
    setChecklist((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  async function onSubmit(data: TradeFormValues) {
    startTransition(async () => {
      try {
        const payload = { ...data, concepts: selectedConcepts, checklist };
        if (trade) {
          await updateTrade(trade.id, payload);
          toast({ title: "Trade updated", variant: "default" });
          router.push(`/trades/${trade.id}`);
        } else {
          const created = await createTrade(payload);
          toast({ title: "Trade logged!", variant: "default" });
          router.push(`/trades/${created.id}`);
        }
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Something went wrong",
          variant: "destructive",
        });
      }
    });
  }

  const directionValue = watch("direction");
  const statusValue = watch("status");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">Trade details</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" {...register("date")} />
            {errors.date && <p className="text-xs text-red-400">{errors.date.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Instrument</Label>
            <Input placeholder="XAUUSD, EURUSD, BTC..." {...register("instrument")} />
            {errors.instrument && <p className="text-xs text-red-400">{errors.instrument.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Direction */}
          <div className="space-y-1.5">
            <Label>Direction</Label>
            <div className="flex gap-2">
              {(["LONG", "SHORT"] as const).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => setValue("direction", dir)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                    directionValue === dir
                      ? dir === "LONG"
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                        : "bg-red-500/15 border-red-500/30 text-red-400"
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  )}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <div className="flex gap-2">
              {(["WIN", "LOSS", "BREAKEVEN"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setValue("status", s)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    statusValue === s
                      ? s === "WIN"
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                        : s === "LOSS"
                        ? "bg-red-500/15 border-red-500/30 text-red-400"
                        : "bg-zinc-700/50 border-zinc-600 text-zinc-300"
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Session */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Session (optional)</Label>
            <Select onValueChange={(v) => setValue("session", v as "LONDON" | "NEW_YORK" | "ASIAN" | "SYDNEY" | "OVERLAP" | "OTHER" | null)}>
              <SelectTrigger>
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LONDON">London</SelectItem>
                <SelectItem value="NEW_YORK">New York</SelectItem>
                <SelectItem value="ASIAN">Asian</SelectItem>
                <SelectItem value="SYDNEY">Sydney</SelectItem>
                <SelectItem value="OVERLAP">Overlap</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Entry time</Label>
            <Input type="time" {...register("entry_time")} />
          </div>
          <div className="space-y-1.5">
            <Label>Exit time</Label>
            <Input type="time" {...register("exit_time")} />
          </div>
        </div>
      </section>

      {/* Risk & Numbers */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">Risk & numbers</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label>Risk amount ($)</Label>
            <Input type="number" step="0.01" placeholder="0.00" {...register("risk_amount")} />
          </div>
          <div className="space-y-1.5">
            <Label>RR ratio</Label>
            <Input type="number" step="0.1" placeholder="1.5" {...register("rr_ratio")} />
          </div>
          <div className="space-y-1.5">
            <Label>SL (pips)</Label>
            <Input type="number" step="0.1" placeholder="20" {...register("sl_pips")} />
          </div>
          <div className="space-y-1.5">
            <Label>TP (pips)</Label>
            <Input type="number" step="0.1" placeholder="30" {...register("tp_pips")} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Profit / Loss ($)</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="-150.00 or +220.00"
            {...register("profit_loss")}
          />
          {errors.profit_loss && <p className="text-xs text-red-400">{errors.profit_loss.message}</p>}
        </div>
      </section>

      {/* TP Levels */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-300">Take profit levels</h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => appendTp({ level: tpFields.length + 1, pips: 0, price: null, hit: false })}
          >
            <Plus className="h-4 w-4" /> Add TP
          </Button>
        </div>

        {tpFields.length === 0 && (
          <p className="text-xs text-zinc-600">No TP levels added yet</p>
        )}

        {tpFields.map((field, index) => (
          <div key={field.id} className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <Label>TP{index + 1} pips</Label>
              <Input type="number" step="0.1" placeholder="30" {...register(`tp_levels.${index}.pips`)} />
            </div>
            <div className="flex-1 space-y-1">
              <Label>Price (optional)</Label>
              <Input type="number" step="0.00001" placeholder="1.23456" {...register(`tp_levels.${index}.price`)} />
            </div>
            <div className="space-y-1">
              <Label>Hit?</Label>
              <button
                type="button"
                onClick={() => {
                  const current = watch(`tp_levels.${index}.hit`);
                  setValue(`tp_levels.${index}.hit`, !current);
                }}
                className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 h-9 px-2 border border-zinc-800 rounded-lg"
              >
                {watch(`tp_levels.${index}.hit`) ? (
                  <CheckSquare className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => removeTp(index)}>
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          </div>
        ))}
      </section>

      {/* Concepts / Labels */}
      {concepts.length > 0 && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
          <h2 className="text-sm font-medium text-zinc-300">Concepts used</h2>
          <div className="flex flex-wrap gap-2">
            {concepts.map((concept) => {
              const selected = selectedConcepts.includes(concept.name);
              return (
                <button
                  key={concept.id}
                  type="button"
                  onClick={() => toggleConcept(concept.name)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all",
                    selected
                      ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300"
                      : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400"
                  )}
                  style={selected ? { borderColor: concept.color + "60", color: concept.color, backgroundColor: concept.color + "15" } : {}}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: selected ? concept.color : "#52525b" }}
                  />
                  {concept.name}
                  {selected && (
                    <CheckSquare className="h-3 w-3 ml-0.5" />
                  )}
                </button>
              );
            })}
          </div>
          {selectedConcepts.length === 0 && (
            <p className="text-xs text-zinc-600">No concepts selected</p>
          )}
        </section>
      )}

      {/* Attachments */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
        <h2 className="text-sm font-medium text-zinc-300">Attachments</h2>
        <label className="flex items-center gap-2 border border-dashed border-zinc-700 rounded-lg p-4 cursor-pointer hover:border-zinc-600 transition-colors">
          <Upload className="h-4 w-4 text-zinc-500" />
          <span className="text-sm text-zinc-500">Drop files or click to upload</span>
          <input
            type="file"
            multiple
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={(e) => {
              if (e.target.files) {
                setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
              }
            }}
          />
        </label>
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-zinc-400 bg-zinc-800/50 rounded-lg px-3 py-2">
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="ml-2 text-zinc-600 hover:text-red-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Existing attachments */}
        {trade?.attachments && trade.attachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-600">Existing</p>
            {trade.attachments.map((att) => (
              <a
                key={att.id}
                href={att.file_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 bg-zinc-800/50 rounded-lg px-3 py-2"
              >
                {att.file_name}
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Notes */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
        <h2 className="text-sm font-medium text-zinc-300">Notes</h2>
        <Textarea
          placeholder="What did you observe? What was your reasoning? Any emotions?"
          rows={4}
          {...register("notes")}
        />
      </section>

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="submit" variant="primary" className="flex-1" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {trade ? "Save changes" : "Log trade"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
