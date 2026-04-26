"use client";
import { useState } from "react";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DateTimePickerProps = {
  /** Date string in "yyyy-MM-dd" format */
  dateValue: string;
  /** Time string in "HH:mm" format */
  timeValue: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  dateLabel?: string;
  timeLabel?: string;
  disabled?: boolean;
};

export function DateTimePicker({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  dateLabel = "Date",
  timeLabel = "Time",
  disabled,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

  const parsed = dateValue
    ? parse(dateValue, "yyyy-MM-dd", new Date())
    : undefined;
  const selectedDate = parsed && isValid(parsed) ? parsed : undefined;

  function handleDaySelect(day: Date | undefined) {
    if (!day) return;
    onDateChange(format(day, "yyyy-MM-dd"));
    setOpen(false);
  }

  return (
    <div className="flex gap-3">
      {/* ── Date picker ── */}
      <div className="flex-1 space-y-1.5">
        <label className="text-xs text-zinc-500">{dateLabel}</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className={cn(
                "w-full flex items-center gap-2 h-9 px-3 rounded-lg border text-sm transition-colors",
                "border-zinc-800 bg-zinc-900/80 text-zinc-300",
                "hover:border-zinc-700 hover:bg-zinc-800/80",
                "focus:outline-none focus:ring-1 focus:ring-zinc-600",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                !selectedDate && "text-zinc-600"
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              <span>
                {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Pick date"}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDaySelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* ── Time picker ── */}
      {/* w-36 = 144px — enough room for HH:MM + AM/PM on all browsers */}
      <div className="w-36 space-y-1.5">
        <label className="text-xs text-zinc-500">{timeLabel}</label>
        <div className="relative">
          <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
          <input
            type="time"
            value={timeValue}
            onChange={(e) => onTimeChange(e.target.value)}
            disabled={disabled}
            className={cn(
              "w-full h-9 pl-8 pr-2 rounded-lg border text-sm transition-colors",
              "border-zinc-800 bg-zinc-900/80 text-zinc-300",
              "hover:border-zinc-700",
              "focus:outline-none focus:ring-1 focus:ring-zinc-600",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "[color-scheme:dark]"
            )}
          />
        </div>
      </div>
    </div>
  );
}
