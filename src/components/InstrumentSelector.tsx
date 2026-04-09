"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Instrument {
  symbol: string;
  name: string;
  flag?: string;
}

interface InstrumentGroup {
  label: string;
  icon: string;
  color: string;
  items: Instrument[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const INSTRUMENT_GROUPS: InstrumentGroup[] = [
  {
    label: "Metals",
    icon: "⬡",
    color: "#f59e0b",
    items: [
      { symbol: "XAUUSD", name: "Gold / US Dollar", flag: "🥇" },
    ],
  },
  {
    label: "Forex",
    icon: "◈",
    color: "#22d3ee",
    items: [
      { symbol: "EURUSD", name: "Euro / US Dollar", flag: "🇪🇺" },
      { symbol: "GBPJPY", name: "Pound / Japanese Yen", flag: "🇬🇧" },
    ],
  },
  {
    label: "Crypto",
    icon: "◆",
    color: "#a78bfa",
    items: [
      { symbol: "BTCUSD", name: "Bitcoin / US Dollar", flag: "₿" },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface InstrumentSelectorProps {
  value?: string;
  onChange?: (symbol: string) => void;
  placeholder?: string;
}

export default function InstrumentSelector({
  value = "",
  onChange,
  placeholder = "Select instrument...",
}: InstrumentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(value);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Animate in / out
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => setVisible(true));
      setTimeout(() => searchRef.current?.focus(), 150);
    } else {
      setVisible(false);
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const closePanel = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setIsOpen(false);
      setSearch("");
    }, 320);
  }, []);

  const handleSelect = useCallback(
    (symbol: string) => {
      setSelected(symbol);
      onChange?.(symbol);
      closePanel();
    },
    [onChange, closePanel]
  );

  // Filter groups
  const filtered = INSTRUMENT_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) =>
        item.symbol.toLowerCase().includes(search.toLowerCase()) ||
        item.name.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((g) => g.items.length > 0);

  const totalResults = filtered.reduce((acc, g) => acc + g.items.length, 0);

  // Find selected instrument's group color
  const selectedGroup = INSTRUMENT_GROUPS.find((g) =>
    g.items.some((i) => i.symbol === selected)
  );

  return (
    <>
      {/* ── Trigger Input ── */}
      <div
        onClick={() => setIsOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setIsOpen(true)}
        className="instrument-trigger"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        {selected ? (
          <span className="trigger-selected">
            <span
              className="trigger-dot"
              style={{ background: selectedGroup?.color || "#94a3b8" }}
            />
            <span className="trigger-symbol">{selected}</span>
            <span className="trigger-name">
              {INSTRUMENT_GROUPS.flatMap((g) => g.items).find(
                (i) => i.symbol === selected
              )?.name}
            </span>
          </span>
        ) : (
          <span className="trigger-placeholder">{placeholder}</span>
        )}
        <span className="trigger-chevron">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </div>

      {/* ── Overlay + Drawer ── */}
      {isOpen && (
        <div className="drawer-root" aria-modal="true" role="dialog">
          {/* Overlay */}
          <div
            className={`drawer-overlay ${visible ? "overlay-in" : "overlay-out"}`}
            onClick={closePanel}
          />

          {/* Panel */}
          <div
            ref={panelRef}
            className={`drawer-panel ${visible ? "panel-in" : "panel-out"}`}
          >
            {/* Header */}
            <div className="panel-header">
              <div className="panel-title-row">
                <div>
                  <p className="panel-eyebrow">Select</p>
                  <h2 className="panel-title">Instrument</h2>
                </div>
                <button
                  type="button"
                  onClick={closePanel}
                  className="panel-close-btn"
                  aria-label="Close panel"
                >
                  <CloseIcon />
                </button>
              </div>

              {/* Search */}
              <div className="search-wrap">
                <span className="search-icon">
                  <SearchIcon />
                </span>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search symbol or name..."
                  className="search-input"
                  autoComplete="off"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="search-clear"
                    aria-label="Clear search"
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>

              {/* Result count */}
              <p className="result-count">
                {search
                  ? `${totalResults} result${totalResults !== 1 ? "s" : ""} for "${search}"`
                  : `${INSTRUMENT_GROUPS.flatMap((g) => g.items).length} instruments available`}
              </p>
            </div>

            {/* Instrument List */}
            <div className="panel-body">
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">⊘</span>
                  <p className="empty-text">No instruments found</p>
                  <p className="empty-sub">Try a different search term</p>
                </div>
              ) : (
                filtered.map((group) => (
                  <div key={group.label} className="group-wrap">
                    {/* Group Header */}
                    <div className="group-header">
                      <span
                        className="group-icon"
                        style={{ color: group.color }}
                      >
                        {group.icon}
                      </span>
                      <span className="group-label">{group.label}</span>
                      <span
                        className="group-line"
                        style={{ background: group.color + "33" }}
                      />
                      <span
                        className="group-badge"
                        style={{
                          color: group.color,
                          background: group.color + "18",
                          border: `1px solid ${group.color}33`,
                        }}
                      >
                        {group.items.length}
                      </span>
                    </div>

                    {/* Items */}
                    {group.items.map((item) => {
                      const isActive = selected === item.symbol;
                      return (
                        <button
                          type="button"
                          key={item.symbol}
                          onClick={() => handleSelect(item.symbol)}
                          className={`instrument-item ${isActive ? "item-active" : ""}`}
                          style={
                            isActive
                              ? {
                                  borderColor: group.color + "55",
                                  background: group.color + "0d",
                                }
                              : {}
                          }
                        >
                          <span className="item-flag">{item.flag}</span>
                          <span className="item-info">
                            <span
                              className="item-symbol"
                              style={isActive ? { color: group.color } : {}}
                            >
                              {item.symbol}
                            </span>
                            <span className="item-name">{item.name}</span>
                          </span>
                          {isActive && (
                            <span
                              className="item-check"
                              style={{
                                color: group.color,
                                background: group.color + "22",
                              }}
                            >
                              <CheckIcon />
                            </span>
                          )}
                          {!isActive && (
                            <span className="item-arrow">›</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {selected && (
              <div className="panel-footer">
                <span className="footer-label">Selected:</span>
                <span
                  className="footer-symbol"
                  style={{ color: selectedGroup?.color || "#94a3b8" }}
                >
                  {selected}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelected("");
                    onChange?.("");
                  }}
                  className="footer-clear"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Styles ── */}
      <style>{`
        /* Trigger */
        .instrument-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          width: 100%;
          padding: 12px 16px;
          background: #18181b;
          border: 1px solid #3f3f46;
          border-radius: 10px;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          outline: none;
          user-select: none;
        }
        .instrument-trigger:hover {
          border-color: #71717a;
          background: #1c1c1f;
        }
        .instrument-trigger:focus-visible {
          border-color: #22d3ee;
          box-shadow: 0 0 0 3px #22d3ee22;
        }
        .trigger-selected {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }
        .trigger-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .trigger-symbol {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 14px;
          font-weight: 600;
          color: #f4f4f5;
          letter-spacing: 0.04em;
        }
        .trigger-name {
          font-size: 12px;
          color: #71717a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .trigger-placeholder {
          font-size: 14px;
          color: #52525b;
        }
        .trigger-chevron {
          color: #52525b;
          flex-shrink: 0;
          transition: transform 0.2s;
        }

        /* Drawer root */
        .drawer-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          justify-content: flex-end;
        }

        /* Overlay */
        .drawer-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          transition: opacity 0.3s ease;
        }
        .overlay-in { opacity: 1; }
        .overlay-out { opacity: 0; }

        /* Panel */
        .drawer-panel {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 400px;
          height: 100%;
          background: #0f0f11;
          border-left: 1px solid #27272a;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1);
          box-shadow: -24px 0 80px rgba(0,0,0,0.6);
        }
        .panel-in { transform: translateX(0); }
        .panel-out { transform: translateX(100%); }

        /* Panel Header */
        .panel-header {
          padding: 24px 20px 16px;
          border-bottom: 1px solid #1c1c1e;
          background: #0f0f11;
          flex-shrink: 0;
        }
        .panel-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .panel-eyebrow {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #52525b;
          margin: 0 0 2px;
        }
        .panel-title {
          font-size: 22px;
          font-weight: 700;
          color: #fafafa;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .panel-close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid #27272a;
          background: #18181b;
          color: #71717a;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .panel-close-btn:hover {
          background: #27272a;
          color: #fafafa;
          border-color: #3f3f46;
        }

        /* Search */
        .search-wrap {
          position: relative;
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          color: #52525b;
          display: flex;
          align-items: center;
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          padding: 10px 36px 10px 38px;
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 8px;
          color: #f4f4f5;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }
        .search-input::placeholder { color: #3f3f46; }
        .search-input:focus {
          border-color: #22d3ee55;
          box-shadow: 0 0 0 3px #22d3ee11;
        }
        .search-clear {
          position: absolute;
          right: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 4px;
          border: none;
          background: #27272a;
          color: #71717a;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .search-clear:hover { background: #3f3f46; color: #fafafa; }

        .result-count {
          font-size: 11px;
          color: #3f3f46;
          margin: 0;
        }

        /* Panel body */
        .panel-body {
          flex: 1;
          overflow-y: auto;
          padding: 8px 12px 16px;
          scroll-behavior: smooth;
        }
        .panel-body::-webkit-scrollbar { width: 4px; }
        .panel-body::-webkit-scrollbar-track { background: transparent; }
        .panel-body::-webkit-scrollbar-thumb { background: #27272a; border-radius: 99px; }
        .panel-body::-webkit-scrollbar-thumb:hover { background: #3f3f46; }

        /* Group */
        .group-wrap { margin-bottom: 6px; }
        .group-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 8px 8px;
        }
        .group-icon {
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .group-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #52525b;
          flex-shrink: 0;
        }
        .group-line {
          flex: 1;
          height: 1px;
        }
        .group-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 99px;
          flex-shrink: 0;
        }

        /* Instrument item */
        .instrument-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 11px 12px;
          border-radius: 9px;
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s, border-color 0.15s;
          margin-bottom: 2px;
        }
        .instrument-item:hover:not(.item-active) {
          background: #18181b;
          border-color: #27272a;
        }
        .item-active {
          /* dynamic styles via inline */
        }
        .item-flag {
          font-size: 20px;
          line-height: 1;
          flex-shrink: 0;
          width: 28px;
          text-align: center;
        }
        .item-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .item-symbol {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 14px;
          font-weight: 600;
          color: #e4e4e7;
          letter-spacing: 0.04em;
          transition: color 0.15s;
        }
        .item-name {
          font-size: 11px;
          color: #52525b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .item-check {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          flex-shrink: 0;
        }
        .item-arrow {
          color: #3f3f46;
          font-size: 18px;
          flex-shrink: 0;
          line-height: 1;
        }

        /* Empty state */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          gap: 6px;
        }
        .empty-icon {
          font-size: 36px;
          color: #27272a;
          margin-bottom: 8px;
        }
        .empty-text {
          font-size: 15px;
          font-weight: 600;
          color: #52525b;
          margin: 0;
        }
        .empty-sub {
          font-size: 12px;
          color: #3f3f46;
          margin: 0;
        }

        /* Footer */
        .panel-footer {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          border-top: 1px solid #1c1c1e;
          background: #0f0f11;
          flex-shrink: 0;
        }
        .footer-label {
          font-size: 12px;
          color: #52525b;
        }
        .footer-symbol {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.06em;
          flex: 1;
        }
        .footer-clear {
          font-size: 12px;
          color: #52525b;
          background: none;
          border: 1px solid #27272a;
          border-radius: 6px;
          padding: 4px 10px;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }
        .footer-clear:hover {
          color: #ef4444;
          border-color: #ef444433;
        }

        /* Mobile */
        @media (max-width: 480px) {
          .drawer-panel {
            max-width: 100%;
          }
        }
      `}</style>
    </>
  );
}
