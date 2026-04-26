// src/components/trades/trade-checklist.tsx
"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const RULES = [
  { key: "followed_plan",  label: "Followed trading plan",    desc: "Traded as per your pre-defined strategy" },
  { key: "respected_sl",   label: "Respected stop loss",      desc: "Did not move or remove stop loss" },
  { key: "no_fomo",        label: "No FOMO entry",            desc: "Entered only when setup was confirmed" },
  { key: "proper_rr",      label: "Proper R:R maintained",    desc: "Risk to reward was within your rules" },
  { key: "no_revenge",     label: "No revenge trading",       desc: "Did not enter out of emotion after a loss" },
  { key: "waited_setup",   label: "Waited for the setup",     desc: "Was patient and did not force a trade" },
] as const;

type RuleKey = typeof RULES[number]["key"];
type ChecklistState = Record<RuleKey, boolean>;

const MISTAKE_TAGS  = ["Early exit","Moved SL","FOMO entry","Wrong session","Oversize position","Chased price"];
const WELL_TAGS     = ["Clean entry","Held position","Right session","Good R:R","Followed plan","Patient entry"];
const REVIEW_TAGS   = ["Review chart","Check news","Backtest setup","Journal pattern"];

type Props = {
  onChange: (data: {
    checklist: ChecklistState;
    score: number;
    mistakes_tags: string[];
    mistakes_notes: string;
    well_tags: string[];
    well_notes: string;
    review_tags: string[];
    review_notes: string;
  }) => void;
};

export function TradeChecklist({ onChange }: Props) {
  const [checklist, setChecklist] = useState<ChecklistState>({
    followed_plan: false, respected_sl: false, no_fomo: false,
    proper_rr: false, no_revenge: false, waited_setup: false,
  });

  const [mistakeTags,  setMistakeTags]  = useState<string[]>([]);
  const [mistakeNotes, setMistakeNotes] = useState("");
  const [wellTags,     setWellTags]     = useState<string[]>([]);
  const [wellNotes,    setWellNotes]    = useState("");
  const [reviewTags,   setReviewTags]   = useState<string[]>([]);
  const [reviewNotes,  setReviewNotes]  = useState("");

  const score = Object.values(checklist).filter(Boolean).length;

  function toggleRule(key: RuleKey) {
    const next = { ...checklist, [key]: !checklist[key] };
    setChecklist(next);
    emit(next, mistakeTags, mistakeNotes, wellTags, wellNotes, reviewTags, reviewNotes);
  }

  function toggleTag(tag: string, list: string[], setList: (v: string[]) => void) {
    const next = list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag];
    setList(next);
    emit(checklist, 
      setList === setMistakeTags ? next : mistakeTags,
      mistakeNotes,
      setList === setWellTags ? next : wellTags,
      wellNotes,
      setList === setReviewTags ? next : reviewTags,
      reviewNotes
    );
  }

  function emit(
    cl: ChecklistState, mTags: string[], mNotes: string,
    wTags: string[], wNotes: string, rTags: string[], rNotes: string
  ) {
    onChange({
      checklist: cl,
      score: Object.values(cl).filter(Boolean).length,
      mistakes_tags: mTags, mistakes_notes: mNotes,
      well_tags: wTags,     well_notes: wNotes,
      review_tags: rTags,   review_notes: rNotes,
    });
  }

  const scoreColor =
    score === 6 ? "text-emerald-400" :
    score >= 4  ? "text-emerald-500" :
    score >= 2  ? "text-amber-400"   : "text-red-400";

  const progressColor =
    score === 6 ? "bg-emerald-500" :
    score >= 4  ? "bg-emerald-600" :
    score >= 2  ? "bg-amber-500"   : "bg-red-500";

  const scoreLabel =
    score === 6 ? "Excellent discipline"  :
    score >= 4  ? "Good discipline"       :
    score >= 2  ? "Needs improvement"     : "Keep improving";

  return (
    <div className="space-y-3">

      {/* ── Checklist card ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-zinc-200">Checklist</p>
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            score === 6 && "bg-emerald-500/15 text-emerald-400",
            score >= 4 && score < 6 && "bg-emerald-500/10 text-emerald-500",
            score >= 2 && score < 4 && "bg-amber-500/10 text-amber-400",
            score < 2  && "bg-red-500/10 text-red-400",
          )}>
            {score} / 6
          </span>
        </div>
        <p className="text-xs text-zinc-500 mb-3">Did you follow your rules on this trade?</p>

        {/* Progress bar */}
        <div className="h-1 bg-zinc-800 rounded-full mb-4 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-300", progressColor)}
            style={{ width: `${(score / 6) * 100}%` }}
          />
        </div>

        <div className="space-y-0.5">
          {RULES.map((rule) => {
            const checked = checklist[rule.key];
            return (
              <button
                key={rule.key}
                type="button"
                onClick={() => toggleRule(rule.key)}
                className="w-full flex items-start gap-3 py-2.5 px-1 rounded-lg
                           hover:bg-zinc-800/40 transition-colors text-left"
              >
                <div className={cn(
                  "h-5 w-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all",
                  checked
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-zinc-600"
                )}>
                  {checked && <Check className="h-3 w-3 text-white" strokeWidth={2.5} />}
                </div>
                <div>
                  <p className={cn(
                    "text-sm transition-colors",
                    checked ? "text-emerald-400" : "text-zinc-300"
                  )}>
                    {rule.label}
                  </p>
                  <p className="text-xs text-zinc-600 mt-0.5">{rule.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
          <span className="text-xs text-zinc-600">{score} / 6 rules followed</span>
          <span className={cn("text-xs font-medium", scoreColor)}>{scoreLabel}</span>
        </div>
      </div>

      {/* ── Trade review card ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-5">
        <p className="text-sm font-medium text-zinc-200">Trade review</p>

        <ReviewField
          label="Mistakes made"
          tags={MISTAKE_TAGS}
          selectedTags={mistakeTags}
          onTagToggle={(t) => toggleTag(t, mistakeTags, setMistakeTags)}
          value={mistakeNotes}
          onChange={(v) => {
            setMistakeNotes(v);
            emit(checklist, mistakeTags, v, wellTags, wellNotes, reviewTags, reviewNotes);
          }}
          placeholder="Describe any mistakes you made..."
          tagVariant="red"
        />

        <ReviewField
          label="What went well"
          tags={WELL_TAGS}
          selectedTags={wellTags}
          onTagToggle={(t) => toggleTag(t, wellTags, setWellTags)}
          value={wellNotes}
          onChange={(v) => {
            setWellNotes(v);
            emit(checklist, mistakeTags, mistakeNotes, wellTags, v, reviewTags, reviewNotes);
          }}
          placeholder="What did you execute well..."
          tagVariant="green"
        />

        <ReviewField
          label="Notes"
          tags={REVIEW_TAGS}
          selectedTags={reviewTags}
          onTagToggle={(t) => toggleTag(t, reviewTags, setReviewTags)}
          value={reviewNotes}
          onChange={(v) => {
            setReviewNotes(v);
            emit(checklist, mistakeTags, mistakeNotes, wellTags, wellNotes, reviewTags, v);
          }}
          placeholder="Any observations or reminders for next time..."
          tagVariant="amber"
        />
      </div>
    </div>
  );
}

// ── Sub-component ──────────────────────────────────────────────────────────

const TAG_STYLES: Record<string, { base: string; selected: string }> = {
  red:   { base: "border-zinc-800 text-zinc-500", selected: "bg-red-500/10 border-red-500/30 text-red-400" },
  green: { base: "border-zinc-800 text-zinc-500", selected: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
  amber: { base: "border-zinc-800 text-zinc-500", selected: "bg-amber-500/10 border-amber-500/30 text-amber-400" },
};

function ReviewField({
  label, tags, selectedTags, onTagToggle,
  value, onChange, placeholder, tagVariant,
}: {
  label: string;
  tags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  tagVariant: "red" | "green" | "amber";
}) {
  const styles = TAG_STYLES[tagVariant];

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
        {label}
      </p>

      {/* Tag pills */}
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => {
          const sel = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onTagToggle(tag)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border transition-all",
                sel ? styles.selected : styles.base,
                !sel && "hover:border-zinc-700 hover:text-zinc-300"
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Textarea */}
      <div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 500))}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-800/40
                     px-3 py-2.5 text-sm text-zinc-300 placeholder:text-zinc-600
                     outline-none focus:border-zinc-600 focus:ring-1
                     focus:ring-zinc-700 resize-none transition-colors leading-relaxed"
        />
        <p className="text-right text-xs text-zinc-700 mt-1">
          {value.length} / 500
        </p>
      </div>
    </div>
  );
}