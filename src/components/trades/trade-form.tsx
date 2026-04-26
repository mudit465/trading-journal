// src/components/trades/trade-form.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, Loader2, Upload, X, CheckSquare,
} from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch }   from "@/components/ui/switch";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import InstrumentSelector from "@/components/InstrumentSelector";
import { createTrade, updateTrade, uploadTradeAttachments } from "@/lib/actions/trades";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Concept, Trade } from "@/types";

// ── Checklist config ───────────────────────────────────────────────────────
const CHECKLIST_ITEMS = [
  { key: "followed_plan",    label: "Followed trading plan",  description: "Traded as per your pre-defined strategy" },
  { key: "respected_sl",     label: "Respected stop loss",    description: "Did not move or remove stop loss" },
  { key: "no_fomo",          label: "No FOMO entry",          description: "Entered only when setup was confirmed" },
  { key: "proper_rr",        label: "Proper R:R maintained",  description: "Risk to reward was within your rules" },
  { key: "no_revenge_trade", label: "No revenge trading",     description: "Did not enter out of emotion after a loss" },
  { key: "waited_for_setup", label: "Waited for the setup",   description: "Was patient and did not force a trade" },
] as const;

type ChecklistKey = typeof CHECKLIST_ITEMS[number]["key"];

const DEFAULT_CHECKLIST: Record<ChecklistKey, boolean> = {
  followed_plan:    false,
  respected_sl:     false,
  no_fomo:          false,
  proper_rr:        false,
  no_revenge_trade: false,
  waited_for_setup: false,
};

// ── Zod schema ─────────────────────────────────────────────────────────────
const tradeSchema = z.object({
  instrument:    z.string().min(1, "Instrument is required"),
  direction:     z.enum(["LONG", "SHORT"]),
  session:       z.enum(["LONDON", "NEW_YORK", "ASIAN", "SYDNEY", "OVERLAP", "OTHER"]).optional().nullable(),
  // entry_price / exit_price / position_size are local-only for P&L calc — not stored in DB
  entry_price:   z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().optional()),
  exit_price:    z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().optional()),
  position_size: z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().optional()),
  risk_amount:   z.preprocess((v) => Number(v), z.number().min(0)),
  sl_pips:       z.preprocess((v) => Number(v), z.number().min(0)),
  tp_pips:       z.preprocess((v) => Number(v), z.number().min(0)),
  profit_loss:   z.number(),
  rr_ratio:      z.number(),
  status:        z.enum(["WIN", "LOSS", "BREAKEVEN"]),
  notes:         z.string().optional(),
  // mistakes / good_things are local labels — mapped to mistakes_notes / well_notes in DB
  mistakes:      z.string().optional(),
  good_things:   z.string().optional(),
  tp_levels: z.array(
    z.object({
      level: z.preprocess((v) => Number(v), z.number()),
      pips:  z.preprocess((v) => Number(v), z.number()),
      price: z.preprocess(
        (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
        z.number().nullable()
      ),
      hit: z.boolean().default(false),
    })
  ).optional(),
});

type TradeFormValues = z.infer<typeof tradeSchema>;

// ── P&L helpers ────────────────────────────────────────────────────────────
function calcPnl(
  direction: "LONG" | "SHORT",
  entryPrice?: number,
  exitPrice?: number,
  positionSize?: number,
): { profit_loss: number; status: "WIN" | "LOSS" | "BREAKEVEN" } {
  if (!entryPrice || !exitPrice || !positionSize || positionSize === 0) {
    return { profit_loss: 0, status: "BREAKEVEN" };
  }
  const diff = direction === "LONG" ? exitPrice - entryPrice : entryPrice - exitPrice;
  const pnl  = parseFloat((diff * positionSize).toFixed(2));
  return {
    profit_loss: pnl,
    status: pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BREAKEVEN",
  };
}

function calcRR(pnl: number, risk: number): number {
  if (!risk || risk === 0) return 0;
  return parseFloat((pnl / risk).toFixed(2));
}

// ── Props ──────────────────────────────────────────────────────────────────
type TradeFormProps = {
  concepts?:    Concept[];
  defaultDate?: string;
  trade?:       Trade;
  onSuccess?:   () => void;
};

// ── Component ──────────────────────────────────────────────────────────────
export function TradeForm({ concepts = [], defaultDate, trade, onSuccess }: TradeFormProps) {
  const router    = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!trade;

  // ── State outside RHF ─────────────────────────────────────────────────
  // DateTimePicker needs separate date + time strings
  const [entryDate, setEntryDate] = useState(
    trade?.entry_time ? trade.entry_time.split("T")[0] : (defaultDate ?? "")
  );
  const [entryTime, setEntryTime] = useState(
    trade?.entry_time ? trade.entry_time.split("T")[1]?.slice(0, 5) ?? "" : ""
  );
  const [exitDate, setExitDate] = useState(
    trade?.exit_time ? trade.exit_time.split("T")[0] : ""
  );
  const [exitTime, setExitTime] = useState(
    trade?.exit_time ? trade.exit_time.split("T")[1]?.slice(0, 5) ?? "" : ""
  );
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>(trade?.concepts ?? []);
  const [files,            setFiles]            = useState<File[]>([]);
  const [checklist,        setChecklist]        = useState<Record<ChecklistKey, boolean>>({
    ...DEFAULT_CHECKLIST,
    ...(trade?.checklist ?? {}),
  });
  const [calcResult, setCalcResult] = useState<{
    profit_loss: number;
    status: "WIN" | "LOSS" | "BREAKEVEN";
    rr: number;
  }>({
    profit_loss: trade?.profit_loss ?? 0,
    status:      trade?.status      ?? "BREAKEVEN",
    rr:          trade?.rr_ratio    ?? 0,
  });

  // ── RHF setup ─────────────────────────────────────────────────────────
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
      instrument:    trade?.instrument   ?? "",
      direction:     trade?.direction    ?? "LONG",
      session:       trade?.session      ?? null,
      entry_price:   (trade as any)?.entry_price    ?? undefined,
      exit_price:    (trade as any)?.exit_price     ?? undefined,
      position_size: (trade as any)?.position_size  ?? undefined,
      risk_amount:   trade?.risk_amount  ?? 0,
      sl_pips:       trade?.sl_pips      ?? 0,
      tp_pips:       trade?.tp_pips      ?? 0,
      profit_loss:   trade?.profit_loss  ?? 0,
      rr_ratio:      trade?.rr_ratio     ?? 0,
      status:        trade?.status       ?? "BREAKEVEN",
      notes:         trade?.notes        ?? "",
      mistakes:      trade?.mistakes     ?? "",
      good_things:   trade?.good_things  ?? "",
      tp_levels: trade?.tp_levels?.map((tp) => ({
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

  // ── Watched values ────────────────────────────────────────────────────
  const directionValue  = watch("direction");
  const entryPriceVal   = watch("entry_price");
  const exitPriceVal    = watch("exit_price");
  const positionSizeVal = watch("position_size");
  const riskAmountVal   = watch("risk_amount");

  // ── Auto-calculate P&L / RR / Status on price change ─────────────────
  useEffect(() => {
    const result = calcPnl(directionValue, entryPriceVal, exitPriceVal, positionSizeVal);
    const rr     = calcRR(result.profit_loss, Number(riskAmountVal) || 0);
    setCalcResult({ ...result, rr });
    setValue("profit_loss", result.profit_loss);
    setValue("status",      result.status);
    setValue("rr_ratio",    rr);
  }, [directionValue, entryPriceVal, exitPriceVal, positionSizeVal, riskAmountVal, setValue]);

  // ── Helpers ───────────────────────────────────────────────────────────
  function toggleConcept(name: string) {
    setSelectedConcepts((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  }

  function toggleChecklist(key: ChecklistKey) {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const checkedCount = CHECKLIST_ITEMS.filter((item) => checklist[item.key]).length;

  // ── Submit ────────────────────────────────────────────────────────────
  async function onSubmit(data: TradeFormValues) {
    startTransition(async () => {
      try {
        // Build payload using ONLY columns that exist in TradeFormData / DB schema.
        // entry_price, exit_price, position_size, mistakes, good_things are
        // local-only calculation helpers — never sent to Supabase.
        const payload: TradeFormData = {
          date:        entryDate || new Date().toISOString().split("T")[0],
          instrument:  data.instrument,
          direction:   data.direction,
          session:     data.session ?? null,
          entry_time:  entryDate && entryTime ? `${entryDate}T${entryTime}:00` : undefined,
          exit_time:   exitDate  && exitTime  ? `${exitDate}T${exitTime}:00`  : undefined,
          risk_amount: data.risk_amount,
          sl_pips:     data.sl_pips,
          tp_pips:     data.tp_pips,
          profit_loss: calcResult.profit_loss,
          rr_ratio:    calcResult.rr,
          status:      calcResult.status,
          notes:       data.notes     || undefined,
          // mistakes / good_things map to mistakes_notes / well_notes in DB
          mistakes_notes: data.mistakes   || undefined,
          well_notes:     data.good_things || undefined,
          concepts:    selectedConcepts.length ? selectedConcepts : undefined,
          checklist,
          tp_levels:   data.tp_levels?.map((tp, i) => ({
            level: i + 1,
            pips:  tp.pips,
            price: tp.price ?? null,
            hit:   tp.hit,
          })),
        };

        let tradeId: string;

        if (isEdit && trade) {
          await updateTrade(trade.id, payload);
          tradeId = trade.id;
          toast({ title: "Trade updated" });
        } else {
          const created = await createTrade(payload);
          tradeId = created.id;
          toast({ title: "Trade logged!" });
        }

        if (files.length > 0) {
          const formData = new FormData();
          files.forEach((f) => formData.append("files", f));
          await uploadTradeAttachments(tradeId, formData);
        }

        onSuccess?.();
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

  const sectionCls      = "rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4";
  const sectionTitleCls = "text-sm font-medium text-zinc-300";

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* ── Trade Details ──────────────────────────────────────────── */}
      <section className={sectionCls}>
        <h2 className={sectionTitleCls}>Trade details</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Instrument</Label>
            <InstrumentSelector
              value={watch("instrument")}
              onChange={(symbol) => setValue("instrument", symbol, { shouldValidate: true })}
              placeholder="XAUUSD, EURUSD, BTC..."
            />
            {errors.instrument && (
              <p className="text-xs text-red-400">{errors.instrument.message}</p>
            )}
          </div>

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
                      : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                  )}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Session — sits on its own row, compact width */}
        <div className="space-y-1.5">
          <Label>Session (optional)</Label>
          <Select
            defaultValue={trade?.session ?? undefined}
            onValueChange={(v) => setValue("session", v as TradeFormValues["session"])}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select session" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LONDON">London</SelectItem>
              <SelectItem value="NEW_YORK">New York</SelectItem>
              <SelectItem value="ASIAN">Asian</SelectItem>
              <SelectItem value="SYDNEY">Sydney</SelectItem>
              <SelectItem value="OVERLAP">London/NY Overlap</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Entry + Exit — each in their own card, side-by-side */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Entry</p>
            <DateTimePicker
              dateValue={entryDate}
              timeValue={entryTime}
              onDateChange={setEntryDate}
              onTimeChange={setEntryTime}
              dateLabel="Date"
              timeLabel="Time"
            />
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Exit</p>
            <DateTimePicker
              dateValue={exitDate}
              timeValue={exitTime}
              onDateChange={setExitDate}
              onTimeChange={setExitTime}
              dateLabel="Date"
              timeLabel="Time"
            />
          </div>
        </div>
      </section>

      {/* ── Prices & Size ──────────────────────────────────────────── */}
      <section className={sectionCls}>
        <h2 className={sectionTitleCls}>Prices & size</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Entry price</Label>
            <Input type="number" step="any" placeholder="0.00000" {...register("entry_price")} />
          </div>
          <div className="space-y-1.5">
            <Label>Exit price</Label>
            <Input type="number" step="any" placeholder="0.00000" {...register("exit_price")} />
          </div>
          <div className="space-y-1.5">
            <Label>Position size</Label>
            <Input type="number" step="any" placeholder="0.01" {...register("position_size")} />
          </div>
        </div>
      </section>

      {/* ── Risk Management ────────────────────────────────────────── */}
      <section className={sectionCls}>
        <h2 className={sectionTitleCls}>Risk management</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Risk ($)</Label>
            <Input type="number" step="0.01" placeholder="0.00" {...register("risk_amount")} />
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
      </section>

      {/* ── Auto-calculated Result Card ────────────────────────────── */}
      <div className={cn(
        "rounded-xl border p-5 transition-all duration-200",
        calcResult.status === "WIN"       && "border-emerald-500/30 bg-emerald-500/5",
        calcResult.status === "LOSS"      && "border-red-500/30 bg-red-500/5",
        calcResult.status === "BREAKEVEN" && "border-zinc-800 bg-zinc-900/50",
      )}>
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-3">
          Calculated result
        </p>
        <div className="flex items-baseline gap-8">
          <div>
            <p className="text-[10px] text-zinc-500 mb-0.5">P&L</p>
            <p className={cn(
              "text-2xl font-semibold tabular-nums",
              calcResult.status === "WIN"       && "text-emerald-400",
              calcResult.status === "LOSS"      && "text-red-400",
              calcResult.status === "BREAKEVEN" && "text-zinc-400",
            )}>
              {calcResult.profit_loss >= 0 ? "+" : ""}${calcResult.profit_loss.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 mb-0.5">RR</p>
            <p className="text-2xl font-semibold text-zinc-200 tabular-nums">{calcResult.rr}R</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 mb-0.5">Status</p>
            <span className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold",
              calcResult.status === "WIN"       && "bg-emerald-500/15 text-emerald-400",
              calcResult.status === "LOSS"      && "bg-red-500/15 text-red-400",
              calcResult.status === "BREAKEVEN" && "bg-zinc-800 text-zinc-400",
            )}>
              {calcResult.status}
            </span>
          </div>
        </div>
        {(!entryPriceVal || !exitPriceVal || !positionSizeVal) && (
          <p className="text-xs text-zinc-600 mt-3">
            Enter entry price, exit price, and position size to calculate
          </p>
        )}
      </div>

      {/* ── TP Levels (WIN only) ───────────────────────────────────── */}
      {calcResult.status === "WIN" && (
        <section className={sectionCls}>
          <div className="flex items-center justify-between">
            <h2 className={sectionTitleCls}>Take profit levels</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => appendTp({ level: tpFields.length + 1, pips: 0, price: null, hit: false })}
            >
              <Plus className="h-4 w-4 mr-1" /> Add TP
            </Button>
          </div>

          {tpFields.length === 0 && (
            <p className="text-xs text-zinc-600">Click "Add TP" to track individual TP levels</p>
          )}

          {tpFields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs">TP{index + 1} pips</Label>
                <Input type="number" step="0.1" placeholder="30" {...register(`tp_levels.${index}.pips`)} />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs">Price (optional)</Label>
                <Input type="number" step="0.00001" placeholder="1.23456" {...register(`tp_levels.${index}.price`)} />
              </div>
              <div className="space-y-1.5 pb-0.5">
                <Label className="text-xs text-zinc-500">Hit?</Label>
                <div className="flex items-center h-9 gap-2">
                  <Switch
                    checked={watch(`tp_levels.${index}.hit`)}
                    onCheckedChange={(checked) => setValue(`tp_levels.${index}.hit`, checked)}
                  />
                  <span className={cn(
                    "text-xs",
                    watch(`tp_levels.${index}.hit`) ? "text-emerald-400" : "text-zinc-600"
                  )}>
                    {watch(`tp_levels.${index}.hit`) ? "Hit" : "No"}
                  </span>
                </div>
              </div>
              <div className="pb-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTp(index)}
                  className="h-9 w-9 text-zinc-600 hover:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── Concepts ───────────────────────────────────────────────── */}
      {concepts.length > 0 && (
        <section className={sectionCls}>
          <h2 className={sectionTitleCls}>Concepts used</h2>
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
                  style={selected
                    ? { borderColor: concept.color + "60", color: concept.color, backgroundColor: concept.color + "15" }
                    : {}}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: selected ? concept.color : "#52525b" }}
                  />
                  {concept.name}
                  {selected && <CheckSquare className="h-3 w-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
          {selectedConcepts.length === 0 && (
            <p className="text-xs text-zinc-600">No concepts selected</p>
          )}
        </section>
      )}

      {/* ── Attachments ────────────────────────────────────────────── */}
      <section className={sectionCls}>
        <div>
          <h2 className={sectionTitleCls}>Attachments</h2>
          <p className="text-xs text-zinc-600 mt-0.5">Upload screenshots or files for this trade</p>
        </div>

        <label className="flex flex-col items-center gap-2 border border-dashed border-zinc-700
                          rounded-lg p-6 cursor-pointer hover:border-zinc-500
                          hover:bg-zinc-800/30 transition-colors group">
          <Upload className="h-6 w-6 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          <div className="text-center">
            <p className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">
              Drop files here or <span className="text-indigo-400">click to browse</span>
            </p>
            <p className="text-xs text-zinc-600 mt-0.5">PNG, JPG, PDF up to 10MB each</p>
          </div>
          <input
            type="file" multiple className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={(e) => {
              if (e.target.files)
                setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
            }}
          />
        </label>

        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-600 font-medium">Ready to upload ({files.length})</p>
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-3 text-xs bg-zinc-800/50 rounded-lg
                                      px-3 py-2.5 border border-zinc-700/50">
                <span className="text-base shrink-0">
                  {file.type.startsWith("image/") ? "🖼️"
                    : file.type === "application/pdf" ? "📄" : "📎"}
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
              <a key={att.id} href={att.file_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 text-xs text-indigo-400 hover:text-indigo-300
                           bg-zinc-800/50 rounded-lg px-3 py-2.5 border border-zinc-700/50 transition-colors">
                <span className="text-base shrink-0">
                  {att.file_type?.startsWith("image/") ? "🖼️"
                    : att.file_type === "application/pdf" ? "📄" : "📎"}
                </span>
                <span className="flex-1 truncate">{att.file_name}</span>
                <span className="text-zinc-600 shrink-0">↗</span>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* ── Checklist ──────────────────────────────────────────────── */}
      <section className={sectionCls}>
        <div>
          <h2 className={sectionTitleCls}>Checklist</h2>
          <p className="text-xs text-zinc-600 mt-0.5">Did you follow your rules on this trade?</p>
        </div>

        <div className="space-y-2">
          {CHECKLIST_ITEMS.map((item) => {
            const checked = checklist[item.key];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleChecklist(item.key)}
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
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    checked ? "text-emerald-400" : "text-zinc-400"
                  )}>
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

      {/* ── Trade Review ───────────────────────────────────────────── */}
      <section className={sectionCls}>
        <h2 className={sectionTitleCls}>Trade review</h2>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-red-400 inline-block" />
            Mistakes made
          </Label>
          <Textarea
            placeholder="What did you do wrong? Bad entry, ignored SL, FOMO, revenge trade..."
            rows={3}
            className="border-red-500/10 focus:border-red-500/30"
            {...register("mistakes")}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
            What went well
          </Label>
          <Textarea
            placeholder="What did you do right? Good patience, followed plan, proper RR..."
            rows={3}
            className="border-emerald-500/10 focus:border-emerald-500/30"
            {...register("good_things")}
          />
        </div>
      </section>

      {/* ── Notes ──────────────────────────────────────────────────── */}
      <section className={sectionCls}>
        <h2 className={sectionTitleCls}>Notes</h2>
        <Textarea
          placeholder="What did you observe? What was your reasoning? Any emotions?"
          rows={4}
          {...register("notes")}
        />
      </section>

      {/* ── Submit ─────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-1">
        <Button type="submit" variant="primary" className="flex-1" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {isEdit ? "Save changes" : "Log trade"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>

    </form>
  );
}
