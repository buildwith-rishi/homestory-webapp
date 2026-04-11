import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

export type MeetingLinkOption = {
  id: string;
  title: string;
  subtitle?: string;
  /** Matched by search but not shown (e.g. lead email on projects) */
  matchText?: string;
};

export interface MeetingLinkEntitySelectProps {
  value: string;
  onChange: (id: string) => void;
  options: MeetingLinkOption[];
  /** Shown when nothing selected and as the first list row */
  emptyLabel: string;
  searchPlaceholder?: string;
  ariaLabel: string;
}

export const MeetingLinkEntitySelect: React.FC<
  MeetingLinkEntitySelectProps
> = ({
  value,
  onChange,
  options,
  emptyLabel,
  searchPlaceholder = "Search…",
  ariaLabel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => options.find((o) => o.id === value) ?? null,
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const t = o.title.toLowerCase();
      const s = (o.subtitle ?? "").toLowerCase();
      const m = (o.matchText ?? "").toLowerCase();
      return t.includes(q) || s.includes(q) || m.includes(q);
    });
  }, [options, query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const displayText = selected
    ? selected.subtitle
      ? `${selected.title} (${selected.subtitle})`
      : selected.title
    : emptyLabel;

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-left focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        <span
          className={`min-w-0 flex-1 truncate text-sm ${
            selected ? "font-medium text-gray-900" : "text-gray-500"
          }`}
        >
          {displayText}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 right-0 top-full z-[120] mt-1.5 flex flex-col overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-xl ring-1 ring-black/5"
        >
          <div className="shrink-0 border-b border-gray-100 bg-gray-50/90 p-2.5">
            <label htmlFor={`${listId}-search`} className="sr-only">
              {searchPlaceholder}
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm transition-shadow focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-500/20">
              <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
              <input
                id={`${listId}-search`}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                onMouseDown={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>
          <ul
            className="min-h-0 max-h-[min(20rem,45vh)] overflow-y-auto overflow-x-hidden overscroll-y-contain py-1 [scrollbar-gutter:stable]"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <li
              role="option"
              aria-selected={value === ""}
              className={`cursor-pointer px-4 py-2.5 text-sm transition-colors ${
                value === ""
                  ? "bg-orange-50 text-orange-900"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              {emptyLabel}
            </li>
            {filtered.map((o) => {
              const isSel = value === o.id;
              return (
                <li
                  key={o.id}
                  role="option"
                  aria-selected={isSel}
                  className={`cursor-pointer border-t border-gray-50 px-4 py-2.5 transition-colors first:border-t-0 ${
                    isSel
                      ? "bg-orange-50"
                      : "hover:bg-orange-50/60"
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                >
                  <div className="text-sm font-medium text-gray-900">
                    {o.title}
                  </div>
                  {o.subtitle ? (
                    <div className="mt-0.5 text-xs text-gray-500">
                      {o.subtitle}
                    </div>
                  ) : null}
                </li>
              );
            })}
            {filtered.length === 0 && query.trim() !== "" && (
              <li className="px-4 py-8 text-center text-sm text-gray-500">
                No matches for &ldquo;{query.trim()}&rdquo;
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
