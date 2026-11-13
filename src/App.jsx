import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "expense-tracker:v1";

const CATEGORIES = [
  { id: "food", label: "Food", color: "#E8A33D" },
  { id: "transport", label: "Transport", color: "#3C7A9B" },
  { id: "bills", label: "Bills", color: "#8A5A9E" },
  { id: "shopping", label: "Shopping", color: "#C9503C" },
  { id: "health", label: "Health", color: "#2F7D5B" },
  { id: "other", label: "Other", color: "#7B8794" },
];
const catById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

const money = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

// Local-time helpers (avoid toISOString, which shifts the date to UTC)
const pad = (n) => String(n).padStart(2, "0");
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthOf = (dateStr) => dateStr.slice(0, 7);
const shiftMonth = (ym, delta) => {
  const [y, m] = ym.split("-").map(Number);
  return monthOf(toDateStr(new Date(y, m - 1 + delta, 1)));
};
const monthLabel = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};
const dayLabel = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  if (dateStr === toDateStr(new Date())) return `Today, ${label}`;
  return label;
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [expenses, setExpenses] = useState(load);
  const [month, setMonth] = useState(monthOf(toDateStr(new Date())));
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch {
      /* storage full or unavailable: keep working in memory */
    }
  }, [expenses]);

  const monthExpenses = useMemo(
    () => expenses.filter((e) => monthOf(e.date) === month),
    [expenses, month]
  );
  const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = useMemo(() => {
    const totals = {};
    monthExpenses.forEach((e) => (totals[e.category] = (totals[e.category] || 0) + e.amount));
    return CATEGORIES.map((c) => ({ ...c, total: totals[c.id] || 0 }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [monthExpenses]);

  const grouped = useMemo(() => {
    const map = {};
    monthExpenses.forEach((e) => (map[e.date] ||= []).push(e));
    return Object.entries(map).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [monthExpenses]);

  const addExpense = (exp) => setExpenses((prev) => [exp, ...prev]);
  const removeExpense = (id) => setExpenses((prev) => prev.filter((e) => e.id !== id));

  return (
    <div className="app">
      <div className="topbar">
        <span className="brand">Expense Tracker</span>
        {!sheetOpen && (
          <button className="add-btn" onClick={() => setSheetOpen(true)}>
            + Add expense
          </button>
        )}
      </div>

      <div className="layout">
        <aside className="summary">
          <div className="month-nav">
            <button aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))}>
              ‹
            </button>
            <span aria-live="polite">{monthLabel(month)}</span>
            <button
              aria-label="Next month"
              disabled={month >= monthOf(toDateStr(new Date()))}
              onClick={() => setMonth(shiftMonth(month, 1))}
            >
              ›
            </button>
          </div>
          <p className="total-label">Spent this month</p>
          <p className="total">{money.format(total)}</p>

          {byCategory.length > 0 ? (
            <>
              <div className="split" role="img" aria-label="Spending by category">
                {byCategory.map((c) => (
                  <span
                    key={c.id}
                    style={{ flex: c.total, background: c.color }}
                    title={`${c.label}: ${money.format(c.total)}`}
                  />
                ))}
              </div>
              <ul className="legend">
                {byCategory.map((c) => (
                  <li key={c.id}>
                    <i style={{ background: c.color }} />
                    {c.label} <b>{money.format(c.total)}</b>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="summary-empty">No spending logged yet.</p>
          )}
        </aside>

        <main className="list">
          {grouped.length === 0 ? (
            <div className="empty">
              <p>No expenses in {monthLabel(month)}.</p>
              <button className="link-btn" onClick={() => setSheetOpen(true)}>
                Add your first expense
              </button>
            </div>
          ) : (
            grouped.map(([date, items]) => (
              <section key={date}>
                <h2>
                  {dayLabel(date)}
                  <span>{money.format(items.reduce((s, e) => s + e.amount, 0))}</span>
                </h2>
                <ul>
                  {items.map((e) => (
                    <li key={e.id}>
                      <i style={{ background: catById[e.category].color }} />
                      <div className="what">
                        <strong>{e.note || catById[e.category].label}</strong>
                        <small>{catById[e.category].label}</small>
                      </div>
                      <span className="amt">{money.format(e.amount)}</span>
                      <button
                        className="del"
                        aria-label={`Delete ${e.note || catById[e.category].label}`}
                        onClick={() => removeExpense(e.id)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </main>
      </div>

      <button className="fab" onClick={() => setSheetOpen(true)}>
        Add expense
      </button>

      {sheetOpen && (
        <AddSheet
          onClose={() => setSheetOpen(false)}
          onSave={(exp) => {
            addExpense(exp);
            setMonth(monthOf(exp.date));
            setSheetOpen(false);
          }}
        />
      )}
    </div>
  );
}

function AddSheet({ onClose, onSave }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(toDateStr(new Date()));
  const [error, setError] = useState("");
  const dialogRef = useRef(null);
  const amountRef = useRef(null);
  const returnFocusRef = useRef(null);

  // Open as a modal dialog on every platform (focus trap, Esc to close)
  useEffect(() => {
    const dialog = dialogRef.current;
    returnFocusRef.current = document.activeElement;
    if (dialog?.showModal && !dialog.open) dialog.showModal();
    amountRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    dialog?.addEventListener("keydown", onKeyDown);
    return () => {
      dialog?.removeEventListener("keydown", onKeyDown);
      returnFocusRef.current?.focus?.();
    };
  }, [onClose]);

  const save = () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }
    onSave({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      amount: value,
      category,
      note: note.trim(),
      date,
    });
  };

  return (
    <dialog
      ref={dialogRef}
      className="sheet"
      aria-labelledby="sheet-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // Click on the backdrop (the dialog's padding area outside the panel)
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="sheet-panel">
        <div className="sheet-handle" aria-hidden="true" />
        <h3 id="sheet-title">Add expense</h3>

        <label>
          Amount (PKR)
          <input
            ref={amountRef}
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            placeholder="0"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
            }}
          />
        </label>
        {error && <p className="error">{error}</p>}

        <div className="chips" role="radiogroup" aria-label="Category">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              role="radio"
              aria-checked={category === c.id}
              className={category === c.id ? "chip on" : "chip"}
              style={{ "--c": c.color }}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <label>
          Note
          <input
            type="text"
            placeholder="What was it for?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <div className="actions">
          <button className="ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" onClick={save}>
            Save expense
          </button>
        </div>
      </div>
    </dialog>
  );
}
