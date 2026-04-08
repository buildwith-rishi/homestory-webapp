import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Loader2, Search, User } from "lucide-react";

export type DirectoryUser = {
  id: string;
  name: string;
  email: string;
};

export interface UserEmailComboboxProps {
  value: string;
  onChange: (next: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  /** single = one address (To); comma = comma-separated (Cc) */
  mode: "single" | "comma";
  users: DirectoryUser[];
  loading?: boolean;
  className?: string;
}

function parseCcEmails(cc: string): string[] {
  return cc
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinCcEmails(emails: string[]): string {
  return emails.join(", ");
}

export const UserEmailCombobox: React.FC<UserEmailComboboxProps> = ({
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  mode,
  users,
  loading = false,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const [open, setOpen] = useState(false);
  /** Independent filter inside the dropdown (does not change the main field). */
  const [panelSearch, setPanelSearch] = useState("");

  const filtered = useMemo(() => {
    const q = panelSearch.toLowerCase().trim();
    if (!q) return users.slice(0, 80);
    return users
      .filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q),
      )
      .slice(0, 80);
  }, [users, panelSearch]);

  const ccEmailsNormalized = useMemo(() => {
    if (mode !== "comma") return [];
    return parseCcEmails(value);
  }, [value, mode]);

  const isEmailInCc = useCallback(
    (email: string) => {
      const lower = email.toLowerCase();
      return ccEmailsNormalized.some((e) => e.toLowerCase() === lower);
    },
    [ccEmailsNormalized],
  );

  const toggleCcEmail = useCallback(
    (email: string, checked: boolean) => {
      const trimmed = email.trim();
      if (!trimmed) return;
      const lower = trimmed.toLowerCase();
      let parts = parseCcEmails(value);
      if (checked) {
        if (!parts.some((p) => p.toLowerCase() === lower)) {
          parts = [...parts, trimmed];
        }
      } else {
        parts = parts.filter((p) => p.toLowerCase() !== lower);
      }
      onChange(joinCcEmails(parts));
    },
    [onChange, value],
  );

  const applySingleSelection = useCallback(
    (email: string) => {
      const trimmed = email.trim();
      if (!trimmed) return;
      onChange(trimmed);
      setOpen(false);
      setPanelSearch("");
    },
    [onChange],
  );

  useEffect(() => {
    if (!open) setPanelSearch("");
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

  const stopBlurChain: React.MouseEventHandler = (e) => {
    e.preventDefault();
  };

  return (
    <div ref={containerRef} className={`relative flex-1 min-w-0 ${className}`}>
      <input
        type="text"
        name={mode === "comma" ? "cc" : "to"}
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          onFocus?.();
        }}
        onBlur={() => {
          onBlur?.();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            setPanelSearch("");
          }
        }}
        placeholder={placeholder}
        className="w-full py-3.5 pr-4 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-300"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-haspopup="listbox"
      />

      {open && (
        <div
          role="listbox"
          aria-label={
            mode === "comma"
              ? "Add recipients from directory"
              : "Select recipient from directory"
          }
          className="absolute top-full left-0 right-0 z-[60] mt-1.5 bg-white border border-gray-200/90 rounded-xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col ring-1 ring-black/[0.04]"
        >
          {/* Search — real input, keyboard accessible */}
          <div className="p-2.5 border-b border-gray-100 bg-gray-50/80 shrink-0">
            <label
              htmlFor={`${reactId}-panel-search`}
              className="sr-only"
            >
              Filter users by name or email
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-500/20 transition-shadow">
              <Search
                className="w-4 h-4 text-gray-400 shrink-0"
                aria-hidden
              />
              <input
                id={`${reactId}-panel-search`}
                type="search"
                role="searchbox"
                value={panelSearch}
                onChange={(e) => setPanelSearch(e.target.value)}
                onMouseDown={stopBlurChain}
                placeholder="Search by name or email…"
                autoComplete="off"
                className="flex-1 min-w-0 text-sm bg-transparent text-gray-900 placeholder:text-gray-400 outline-none"
              />
              {loading && (
                <Loader2
                  className="w-4 h-4 animate-spin text-orange-500 shrink-0"
                  aria-label="Loading users"
                />
              )}
            </div>
            <p className="mt-2 px-0.5 text-[11px] text-gray-500 leading-snug">
              {mode === "comma"
                ? "Check users to add to Cc, or type addresses in the field above."
                : "Click a row to set the To address, or type any email above."}
            </p>
          </div>

          <div className="overflow-y-auto max-h-[min(320px,50vh)] py-1.5">
            {!loading && users.length === 0 && (
              <div className="px-4 py-8 text-center">
                <User className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-600 font-medium">
                  No directory users loaded
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-[220px] mx-auto">
                  Type email addresses directly in the field — they will still
                  be sent.
                </p>
              </div>
            )}

            {!loading &&
              users.length > 0 &&
              filtered.length === 0 &&
              panelSearch.trim() && (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  No users match &ldquo;{panelSearch.trim()}&rdquo;
                </div>
              )}

            {mode === "single" &&
              filtered.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  role="option"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applySingleSelection(u.email);
                  }}
                  className="w-full text-left px-3 py-2.5 mx-1 rounded-lg hover:bg-orange-50/90 transition-colors flex items-start gap-3 border border-transparent hover:border-orange-100/80"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 text-xs font-semibold">
                    {(u.name || u.email).charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-900 truncate">
                      {u.name || u.email}
                    </span>
                    <span className="block text-[11px] text-gray-500 truncate mt-0.5">
                      {u.email}
                    </span>
                  </span>
                </button>
              ))}

            {mode === "comma" &&
              filtered.map((u) => {
                const checked = isEmailInCc(u.email);
                const inputId = `${reactId}-cc-${u.id}`;
                return (
                  <div
                    key={`${u.id}-${u.email}`}
                    className="px-2 py-0.5"
                    onMouseDown={stopBlurChain}
                  >
                    <label
                      htmlFor={inputId}
                      className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                    >
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          toggleCcEmail(u.email, e.target.checked);
                        }}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-orange-600 focus:ring-2 focus:ring-orange-500/30 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {u.name || u.email}
                        </span>
                        <span className="text-[11px] text-gray-500 truncate">
                          {u.email}
                        </span>
                      </span>
                    </label>
                  </div>
                );
              })}
          </div>

          {mode === "comma" && ccEmailsNormalized.length > 0 && (
            <div className="border-t border-gray-100 bg-gray-50/90 px-3 py-2 text-[11px] text-gray-600">
              <span className="font-semibold text-gray-700">
                {ccEmailsNormalized.length}
              </span>{" "}
              {ccEmailsNormalized.length === 1 ? "address" : "addresses"} in Cc
            </div>
          )}
        </div>
      )}
    </div>
  );
};
