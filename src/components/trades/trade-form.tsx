"use client";

import InstrumentSelector from "@/components/InstrumentSelector";
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
import { createTrade, updateTrade, uploadTradeAttachments } from "@/lib/actions/trades";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Concept, Trade } from "@/types";

// ── Checklist config ───────────────────────────────────────────
const CHECKLIST_ITEMS = [
  { key: "followed_plan",    label: "Followed trading plan",    description: "Traded as per your pre-defined strategy" },
  { key: "respected_sl",     label: "Respected stop loss",      description: "Did not move or remove stop loss" },
  { key: "no_fomo",          label: "No FOMO entry",            description: "Entered only when setup was confirmed" },
  { key: "proper_rr",        label: "Proper R:R maintained",    description: "Risk to reward was within your rules" },
  { key: "no_revenge_trade", label: "No revenge trading",       description: "Did not enter out of emotion after a loss" },
  { key: "waited_for_setup", label: "Waited for the setup",     description: "Was patient and did not force a trade" },
] as const;

// ── Zod schema ─────────────────────────────────────────────────
const tradeSchema = z.object({
  date:         z.string().min(1, "Date is required"),
  instrument:   z.string().min(1, "Instrument is required"),
  direction:    z.enum(["LONG", "SHORT"]),
  session:      z.enum(["LONDON", "NEW_YORK", "ASIAN", "SYDNEY", "OVERLAP", "OTHER"]).optional().nullable(),
  entry_time:   z.string().optional(),
  exit_time:    z.string().optional(),
  risk_amount:  z.preprocess((v) => Number(v), z.number().min(0)),
  rr_ratio:     z.preprocess((v) => Number(v), z.number().min(0)),
  sl_pips:      z.preprocess((v) => Number(v), z.number().min(0)),
  tp_pips:      z.preprocess((v) => Number(v), z.number().min(0)),
  profit_loss:  z.preprocess((v) => Number(v), z.number()),
  status:       z.enum(["WIN", "LOSS", "BREAKEVEN"]),
  mistakes:     z.string().trim().optional(),
  good_things:  z.string().trim().optional(),
  notes:        z.string().optional(),
  checklist: z.object({
    followed_plan:    z.boolean().default(false),
    respected_sl:     z.boolean().default(false),
    no_fomo:          z.boolean().default(false),
    proper_rr:        z.boolean().default(false),
    no_revenge_trade: z.boolean().default(false),
    waited_for_setup: z.boolean().default(false),
  }).default({}),
  tp_levels: z.array(
    z.object({
      level: z.preprocess((v) => Number(v), z.number()),
      pips:  z.preprocess((v) => Number(v), z.number()),
      price: z.preprocess((v) => (v === "" || v === null || v === undefined ? null : Number(v)), z.number().nullable()),
      hit:   z.boolean().default(false),
    })
  ).optional(),
});

type TradeFormValues = {
  date:         string;
  instrument:   string;
  direction:    "LONG" | "SHORT";
  session?:     "LONDON" | "NEW_YORK" | "ASIAN" | "SYDNEY" | "OVERLAP" | "OTHER" | null;
  entry_time?:  string;
  exit_time?:   string;
  risk_amount:  number;
  rr_ratio:     number;
  sl_pips:      number;
  tp_pips:      number;
  profit_loss:  number;
  status:       "WIN" | "LOSS" | "BREAKEVEN";
  notes?:       string;
  mistakes?:    string;
  good_things?: string;
  checklist: {
    followed_plan:    boolean;
    respected_sl:     boolean;
    no_fomo:          boolean;
    proper_rr:        boolean;
    no_revenge_trade: boolean;
    waited_for_setup: boolean;
  };
  tp_levels?: { level: number; pips: number; price: number | null; hit: boolean }[];
};

type TradeFormProps = {
  concepts:     Concept[];
  defaultDate?: string;
  trade?:       Trade;
};

const DEFAULT_CHECKLIST = {
  followed_plan:    false,
  respected_sl:     false,
  no_fomo:          false,
  proper_rr:        false,
  no_revenge_trade: false,
  waited_for_setup: false,
};

export function TradeForm({ concepts, defaultDate, trade }: TradeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>(trade?.concepts ?? []);
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
      date:        trade?.date        ?? defaultDate ?? new Date().toISOString().split("T")[0],
      instrument:  trade?.instrument  ?? "",
      direction:   trade?.direction   ?? "LONG",
      session:     trade?.session     ?? null,
      entry_time:  trade?.entry_time  ?? "",
      exit_time:   trade?.exit_time   ?? "",
      risk_amount: trade?.risk_amount ?? 0,
      rr_ratio:    trade?.rr_ratio    ?? 0,
      sl_pips:     trade?.sl_pips     ?? 0,
      tp_pips:     trade?.tp_pips     ?? 0,
      profit_loss: trade?.profit_loss ?? 0,
      status:      trade?.status      ?? "WIN",
      notes:       trade?.notes       ?? "",
      mistakes:    trade?.mistakes    ?? "",
      good_things: trade?.good_things ?? "",
      checklist:   { ...DEFAULT_CHECKLIST, ...(trade?.checklist ?? {}) },
      tp_levels:   trade?.tp_levels?.map((tp) => ({
        level: tp.level,
        pips:  tp.pips,
        price: tp.price ?? null,
        hit:   tp.hit,
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
  }

  // ✅ Bug fix 1: was "sync function" — now correctly "async function"
  // ✅ Bug fix 2: closing } was missing — onSubmit is now properly closed
  async function onSubmit(data: TradeFormValues) {
    startTransition(async () => {
      try {
        const payload = { ...data, concepts: selectedConcepts };
        let tradeId: string;

        if (trade) {
          await updateTrade(trade.id, payload);
          tradeId = trade.id;
          toast({ title: "Trade updated", variant: "default" });
        } else {
          const created = await createTrade(payload);
          tradeId = created.id;
          toast({ title: "Trade logged!", variant: "default" });
        }

        // Upload files separately after trade is created/updated
        if (files.length > 0) {
          const formData = new FormData();
          files.forEach((file) => formData.append("files", file));
          await uploadTradeAttachments(tradeId, formData);
        }

        router.push(`/trades/${tradeId}`);
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
  const statusValue    = watch("status");
  const checklistValue = watch("checklist");
  const checkedCount   = CHECKLIST_ITEMS.filter((i) => checklistValue?.[i.key]).length;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* ── Trade Details ────────────────────────────────────── */}
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
            <InstrumentSelector
              value={watch("instrument")}
              onChange={(symbol) => setValue("instrument", symbol, { shouldValidate: true })}
              placeholder="XAUUSD, EURUSD, BTC..."
            />
            {errors.instrument && <p className="text-xs text-red-400">{errors.instrument.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Session (optional)</Label>
            <Select
              onValueChange={(v) =>
                setValue("session", v as "LONDON" | "NEW_YORK" | "ASIAN" | "SYDNEY" | "OVERLAP" | "OTHER" | null)
              }
            >
              <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
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

      {/* ── Risk & Numbers ───────────────────────────────────── */}
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
          <Input type="number" step="0.01" placeholder="-150.00 or +220.00" {...register("profit_loss")} />
          {errors.profit_loss && <p className="text-xs text-red-400">{errors.profit_loss.message}</p>}
        </div>
      </section>

      {/* ── TP Levels ────────────────────────────────────────── */}
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

        {tpFields.length === 0 && <p className="text-xs text-zinc-600">No TP levels added yet</p>}

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
                onClick={() => setValue(`tp_levels.${index}.hit`, !watch(`tp_levels.${index}.hit`))}
                className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 h-9 px-2 border border-zinc-800 rounded-lg"
              >
                {watch(`tp_levels.${index}.hit`)
                  ? <CheckSquare className="h-4 w-4 text-emerald-400" />
                  : <Square className="h-4 w-4" />}
              </button>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => removeTp(index)}>
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          </div>
        ))}
      </section>

      {/* ── Concepts ─────────────────────────────────────────── */}
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
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: selected ? concept.color : "#52525b" }} />
                  {concept.name}
                  {selected && <CheckSquare className="h-3 w-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
          {selectedConcepts.length === 0 && <p className="text-xs text-zinc-600">No concepts selected</p>}
        </section>
      )}

      {/* ── Attachments ──────────────────────────────────────── */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
        <div>
          <h2 className="text-sm font-medium text-zinc-300">Attachments</h2>
          <p className="text-xs text-zinc-600 mt-0.5">Upload screenshots or files for this trade</p>
        </div>

        <label className="flex flex-col items-center gap-2 border border-dashed border-zinc-700 rounded-lg p-6 cursor-pointer hover:border-zinc-500 hover:bg-zinc-800/30 transition-colors group">
          <Upload className="h-6 w-6 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          <div className="text-center">
            <p className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">
              Drop files here or <span className="text-indigo-400">click to browse</span>
            </p>
            <p className="text-xs text-zinc-600 mt-0.5">PNG, JPG, PDF, DOC up to 10MB each</p>
          </div>
          <input
            type="file"
            multiple
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={(e) => {
              if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
            }}
          />
        </label>

        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-600 font-medium">Ready to upload ({files.length})</p>
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-3 text-xs bg-zinc-800/50 rounded-lg px-3 py-2.5 border border-zinc-700/50">
                <span className="text-base shrink-0">
                  {file.type.startsWith("image/") ? "🖼️" : file.type === "application/pdf" ? "📄" : "📎"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-300 truncate">{file.name}</p>
                  <p className="text-zinc-600">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="text-zinc-600 hover:text-red-400 transition-colors shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {trade?.attachments && trade.attachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-600 font-medium">Existing attachments</p>
            {trade.attachments.map((att) => (
              <a
                key={att.id}
                href={att.file_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-xs text-indigo-400 hover:text-indigo-300 bg-zinc-800/50 rounded-lg px-3 py-2.5 border border-zinc-700/50 transition-colors"
              >
                <span className="text-base shrink-0">
                  {att.file_type?.startsWith("image/") ? "🖼️" : att.file_type === "application/pdf" ? "📄" : "📎"}
                </span>
                <span className="flex-1 truncate">{att.file_name}</span>
                <span className="text-zinc-600 shrink-0">↗</span>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* ── Checklist ────────────────────────────────────────── */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-medium text-zinc-300">Checklist</h2>
          <p className="text-xs text-zinc-600 mt-0.5">Did you follow your rules on this trade?</p>
        </div>

        <div className="space-y-2">
          {CHECKLIST_ITEMS.map((item) => {
            const checked = checklistValue?.[item.key] ?? false;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setValue(`checklist.${item.key}`, !checked, { shouldValidate: true })}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors",
                  checked
                    ? "border-emerald-500/25 bg-emerald-500/5"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                )}
              >
                <span className="mt-0.5 text-base leading-none shrink-0">
                  {checked ? "✅" : <span className="text-zinc-700">⬜</span>}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className={cn("text-sm font-medium transition-colors", checked ? "text-emerald-400" : "text-zinc-400")}>
                    {item.label}
                  </span>
                  <span className="text-xs text-zinc-600">{item.description}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <span className="text-xs text-zinc-600 shrink-0">
            {checkedCount} / {CHECKLIST_ITEMS.length} rules followed
          </span>
          <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${(checkedCount / CHECKLIST_ITEMS.length) * 100}%` }}
            />
          </div>
        </div>
      </section>

      {/* ── Trade Review ─────────────────────────────────────── */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">Trade review</h2>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-400 inline-block" />
            Mistakes made
          </Label>
          <Textarea
            placeholder="What did you do wrong? Bad entry, ignored SL, FOMO, revenge trade..."
            rows={3}
            {...register("mistakes")}
            className="border-red-500/10 focus:border-red-500/30"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
            What went well
          </Label>
          <Textarea
            placeholder="What did you do right? Good patience, followed plan, proper RR..."
            rows={3}
            {...register("good_things")}
            className="border-emerald-500/10 focus:border-emerald-500/30"
          />
        </div>
      </section>

      {/* ── Notes ────────────────────────────────────────────── */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
        <h2 className="text-sm font-medium text-zinc-300">Notes</h2>
        <Textarea
          placeholder="What did you observe? What was your reasoning? Any emotions?"
          rows={4}
          {...register("notes")}
        />
      </section>

      {/* ── Submit ───────────────────────────────────────────── */}
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
