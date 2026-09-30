"use client";
import { useState, ReactNode } from "react";
import { Plus, X, Check } from "lucide-react";
import { Provider, useStore, Entry, pend, hrs, inr, fmtPhone, TABLES } from "@/lib/store";

const DATE = "30 September 2026";
const card = "rounded-3xl bg-white p-4 shadow-sm ring-1 ring-stone-200/70";
const input = "w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-lg font-medium text-stone-900 outline-none focus:border-stone-900 focus:bg-white";

function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="text-xl font-semibold tracking-tight text-stone-900">{title}</h2>{right}
      </div>
      {children}
    </section>
  );
}

function Status({ e }: { e: Entry }) {
  const p = pend(e);
  if (p === 0) return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700"><Check size={14} />Paid</span>;
  if (e.amountPaid === 0) return <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700">Pending</span>;
  return <div className="text-right text-sm font-semibold"><div className="text-emerald-700">{inr(e.amountPaid)} Paid</div><div className="text-orange-600">{inr(p)} Pending</div></div>;
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/50" onClick={onClose}>
      <div className="sheet max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] bg-white p-5 pb-8" onClick={e => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-stone-900">{title}</h3>
          <button aria-label="Close" onClick={onClose} className="rounded-full bg-stone-100 p-2.5"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="mb-4 block"><span className="mb-1.5 block text-sm font-medium text-stone-500">{label}</span>{children}</label>
);
const Big = ({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) => (
  <button onClick={onClick} disabled={disabled} className="w-full rounded-2xl bg-stone-900 py-4 text-lg font-semibold text-white active:scale-[.99] disabled:bg-stone-300">{children}</button>
);

function NewEntry({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { customers, stats, addEntry } = useStore();
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [dur, setDur] = useState("1");
  const [amt, setAmt] = useState("300");
  const [touched, setTouched] = useState(false);
  const [table, setTable] = useState("");
  const [paid, setPaid] = useState(true);
  const [recv, setRecv] = useState("");
  const cust = customers.find(c => c.phone === phone);
  const busy = stats.active.map(e => e.table);
  const free = TABLES.filter(t => !busy.includes(t));
  const total = Number(amt) || 0;
  const got = paid ? total : Math.min(Number(recv) || 0, total);
  const valid = total > 0 && Number(dur) > 0 && (!!cust || name.trim().length > 0) && (paid || got < total);

  if (step === 0)
    return (
      <Sheet title="New Entry" onClose={onClose}>
        <Field label="Mobile Number">
          <input className={input} inputMode="numeric" autoFocus placeholder="9876543210" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} />
        </Field>
        <Big disabled={phone.length !== 10} onClick={() => setStep(1)}>Continue</Big>
      </Sheet>
    );

  return (
    <Sheet title="New Entry" onClose={onClose}>
      {cust ? (
        <div className="mb-5 rounded-2xl bg-emerald-50 p-4">
          <div className="text-sm font-semibold text-emerald-700">✓ Existing Customer</div>
          <div className="mt-1 text-xl font-bold text-stone-900">{cust.name}</div>
          <div className="text-stone-600">{fmtPhone(cust.phone)} · Previous visits: {cust.visits}</div>
        </div>
      ) : (
        <>
          <div className="mb-3 text-sm font-semibold text-stone-500">New Customer · {fmtPhone(phone)}</div>
          <Field label="Name"><input className={input} placeholder="Rahul Sharma" value={name} onChange={e => setName(e.target.value)} /></Field>
        </>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Duration (hrs)">
          <input className={input} inputMode="decimal" value={dur} onChange={e => { setDur(e.target.value); if (!touched) setAmt(String(Math.round((Number(e.target.value) || 0) * 300))); }} />
        </Field>
        <Field label="Amount (₹)">
          <input className={input} inputMode="numeric" value={amt} onChange={e => { setTouched(true); setAmt(e.target.value.replace(/\D/g, "")); }} />
        </Field>
      </div>
      <Field label="Table">
        <select className={input} value={table} onChange={e => setTable(e.target.value)}>
          <option value="">No table / already finished</option>
          {free.map(t => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1.5">
        {[true, false].map(v => (
          <button key={String(v)} onClick={() => setPaid(v)} className={`rounded-xl py-3.5 text-base font-bold ${paid === v ? (v ? "bg-emerald-600 text-white" : "bg-orange-500 text-white") : "text-stone-500"}`}>
            {v ? "PAID" : "PENDING"}
          </button>
        ))}
      </div>
      {!paid && (
        <>
          <Field label="Amount Received (₹)"><input className={input} inputMode="numeric" placeholder="0" value={recv} onChange={e => setRecv(e.target.value.replace(/\D/g, ""))} /></Field>
          <div className="mb-5 space-y-1 rounded-2xl bg-stone-50 p-4 text-base">
            <div className="flex justify-between"><span>Total</span><b>{inr(total)}</b></div>
            <div className="flex justify-between"><span>Received</span><b className="text-emerald-700">{inr(got)}</b></div>
            <div className="flex justify-between"><span>Remaining</span><b className="text-orange-600">{inr(total - got)}</b></div>
          </div>
        </>
      )}
      <Big disabled={!valid} onClick={() => { addEntry({ phone, name: cust ? cust.name : name.trim(), duration: Number(dur), amount: total, amountPaid: got, table: table || null }); onDone(); }}>
        {cust ? "Save Entry" : "Add Entry"}
      </Big>
    </Sheet>
  );
}

function PaySheet({ e, onClose, onDone }: { e: Entry; onClose: () => void; onDone: () => void }) {
  const { markPaid } = useStore();
  const [m, setM] = useState<"Cash" | "UPI">("Cash");
  return (
    <Sheet title="Mark Paid" onClose={onClose}>
      <div className="mb-5 rounded-2xl bg-stone-50 p-4">
        <div className="text-lg font-bold">{e.name}</div>
        <div className="text-3xl font-bold text-orange-600">{inr(pend(e))}</div>
      </div>
      <div className="mb-2 text-sm font-medium text-stone-500">Payment method</div>
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1.5">
        {(["Cash", "UPI"] as const).map(x => (
          <button key={x} onClick={() => setM(x)} className={`rounded-xl py-3.5 text-base font-bold ${m === x ? "bg-stone-900 text-white" : "text-stone-500"}`}>{x}</button>
        ))}
      </div>
      <Big onClick={() => { markPaid(e.id, m); onDone(); }}>Confirm Payment</Big>
    </Sheet>
  );
}

function PendingBlock({ onPay }: { onPay: (e: Entry) => void }) {
  const { stats } = useStore();
  return (
    <Section title="Pending Payments" right={<span className="text-sm font-semibold text-orange-600">{inr(stats.pending)} · {stats.pendingList.length} customers</span>}>
      <div className="space-y-2.5">
        {stats.pendingList.length === 0 && <div className={`${card} text-center text-stone-500`}>Nothing pending. All clear ✓</div>}
        {stats.pendingList.map(e => (
          <div key={e.id} className={`${card} flex items-center justify-between`}>
            <div><div className="font-semibold text-stone-900">{e.name}</div><div className="font-bold text-orange-600">{inr(pend(e))} pending</div></div>
            <button onClick={() => onPay(e)} className="rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white">Mark Paid</button>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Staff({ onPay }: { onPay: (e: Entry) => void }) {
  const { stats, entries } = useStore();
  const busy = stats.active.map(e => e.table);
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-stone-900">Good Evening 👋</h1>
      <p className="mt-1 text-stone-500">Today&apos;s Activity · {DATE}</p>
      <Section title="Active Tables" right={<span className="text-sm font-semibold"><span className="text-emerald-700">{stats.active.length} Active</span> · <span className="text-stone-500">{stats.available} Available</span></span>}>
        <div className="grid grid-cols-2 gap-3">
          {stats.active.map(e => (
            <div key={e.id} className={`${card} ring-emerald-200`}>
              <div className="text-xs font-bold uppercase text-stone-500">{e.table}</div>
              <div className="mt-1 font-semibold text-stone-900">{e.name}</div>
              <div className="text-sm text-stone-500">{hrs(e.duration)}</div>
              <div className="text-xl font-bold">{inr(e.amount)}</div>
              <div className="mt-1 text-sm font-semibold text-emerald-600">● Active</div>
            </div>
          ))}
          {TABLES.filter(t => !busy.includes(t)).map(t => (
            <div key={t} className="rounded-3xl border-2 border-dashed border-stone-300 p-4">
              <div className="text-xs font-bold uppercase text-stone-400">{t}</div>
              <div className="mt-2 font-medium text-stone-400">Available</div>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Today's Entries" right={<span className="text-sm text-stone-500">{entries.length} entries</span>}>
        <div className="space-y-2.5">
          {entries.map(e => (
            <div key={e.id} className={`${card} flex items-start justify-between gap-3`}>
              <div>
                <div className="font-semibold text-stone-900">{e.name}</div>
                <div className="text-sm text-stone-500">{fmtPhone(e.phone)}</div>
                <div className="mt-2 text-sm text-stone-600">{hrs(e.duration)} · <b className="text-stone-900">{inr(e.amount)}</b></div>
              </div>
              <Status e={e} />
            </div>
          ))}
        </div>
      </Section>
      <PendingBlock onPay={onPay} />
    </>
  );
}

function Owner() {
  const { stats, entries } = useStore();
  const mini = (l: string, v: string | number, c = "text-stone-900") => (
    <div className={card}><div className="text-sm font-medium text-stone-500">{l}</div><div className={`mt-1 text-3xl font-bold ${c}`}>{v}</div></div>
  );
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-stone-900">Good Evening, Owner 👋</h1>
      <p className="mt-1 text-stone-500">Today&apos;s Overview · {DATE}</p>
      <div className="mt-6 rounded-[2rem] bg-stone-900 p-6 text-white shadow-lg">
        <div className="text-sm font-medium text-stone-400">Today&apos;s Collection</div>
        <div className="mt-1 text-6xl font-extrabold tracking-tight">{inr(stats.paid)}</div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-stone-700 pt-4">
          <div><div className="text-sm text-stone-400">Paid</div><div className="text-xl font-bold text-emerald-400">{inr(stats.paid)}</div></div>
          <div><div className="text-sm text-stone-400">Pending</div><div className="text-xl font-bold text-orange-400">{inr(stats.pending)}</div></div>
        </div>
        <div className="mt-3 text-xs text-stone-500">Total billed today: {inr(stats.paid + stats.pending)}</div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {mini("Total Customers", stats.customerCount)}{mini("Total Entries", stats.entryCount)}
        {mini("Paid", inr(stats.paid), "text-emerald-700")}{mini("Pending", inr(stats.pending), "text-orange-600")}
      </div>
      <Section title="Currently Active" right={<span className="text-sm font-semibold text-stone-500">{stats.active.length} Active · {stats.available} Available</span>}>
        <div className="space-y-2.5">
          {stats.active.map(e => (
            <div key={e.id} className={`${card} flex items-center justify-between`}>
              <div><div className="text-xs font-bold uppercase text-emerald-600">● {e.table}</div><div className="font-semibold">{e.name}</div><div className="text-sm text-stone-500">{hrs(e.duration)}</div></div>
              <div className="text-xl font-bold">{inr(e.amount)}</div>
            </div>
          ))}
        </div>
      </Section>
      <Section title="New Customers Today" right={<span className="text-sm font-semibold text-stone-500">{stats.newCustomers.length} New</span>}>
        <div className={`${card} divide-y divide-stone-100 py-1`}>
          {stats.newCustomers.map(c => (
            <div key={c.id} className="flex items-center justify-between py-3"><span className="font-semibold">{c.name}</span><span className="text-sm text-stone-500">Joined today</span></div>
          ))}
        </div>
      </Section>
      <Section title="Recent Entries">
        <div className="space-y-2.5">
          {entries.slice(0, 5).map(e => (
            <div key={e.id} className={`${card} flex items-start justify-between gap-3`}>
              <div><div className="font-semibold">{e.name}</div><div className="text-sm text-stone-500">{hrs(e.duration)}{e.table ? ` · ${e.table}` : ""}</div><div className="mt-1 font-bold">{inr(e.amount)}</div></div>
              <Status e={e} />
            </div>
          ))}
        </div>
      </Section>
      <Section title="Money Pending">
        <div className="rounded-3xl bg-orange-50 p-5 ring-1 ring-orange-200">
          <div className="text-4xl font-bold text-orange-600">{inr(stats.pending)}</div>
          <div className="mt-1 font-medium text-orange-800">{stats.pendingList.length} Customers</div>
        </div>
      </Section>
    </>
  );
}

function App() {
  const [view, setView] = useState<"staff" | "owner">("staff");
  const [sheet, setSheet] = useState<"new" | Entry | null>(null);
  const [toast, setToast] = useState("");
  const done = (msg: string) => { setSheet(null); setToast(msg); setTimeout(() => setToast(""), 2500); };
  return (
    <main className="mx-auto min-h-screen max-w-md bg-stone-50 pb-32 shadow-xl">
      <div className="sticky top-0 z-30 bg-stone-50/95 px-5 pb-3 pt-4 backdrop-blur">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-stone-200 p-1">
          {(["staff", "owner"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} className={`rounded-xl py-2.5 text-sm font-bold capitalize ${view === v ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}>{v}</button>
          ))}
        </div>
      </div>
      <div className="px-5 pt-3">{view === "staff" ? <Staff onPay={setSheet} /> : <Owner />}</div>
      {view === "staff" && (
        <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-40 mx-auto flex max-w-md justify-center">
          <button onClick={() => setSheet("new")} className="pointer-events-auto flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-4 text-lg font-bold text-white shadow-xl active:scale-95"><Plus size={22} />New Entry</button>
        </div>
      )}
      {sheet === "new" && <NewEntry onClose={() => setSheet(null)} onDone={() => done("Entry added successfully")} />}
      {sheet && sheet !== "new" && <PaySheet e={sheet} onClose={() => setSheet(null)} onDone={() => done("Payment recorded")} />}
      {toast && <div className="fixed left-1/2 top-20 z-[60] -translate-x-1/2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white shadow-xl">✓ {toast}</div>}
    </main>
  );
}

export default function Page() {
  return <Provider><App /></Provider>;
}
