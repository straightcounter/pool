"use client";
import { createContext, useContext, useState, ReactNode } from "react";

export const TABLES = ["Pool 01","Pool 02","Pool 03","Pool 04","Snooker 01","Snooker 02","Snooker 03","Snooker 04"];
export type Customer = { id: string; name: string; phone: string; visits: number; newToday: boolean };
export type Entry = { id: string; customerId: string; name: string; phone: string; duration: number; amount: number; amountPaid: number; table: string | null; isActive: boolean; createdAt: string; method?: string };

export const pend = (e: Entry) => e.amount - e.amountPaid;
export const hrs = (d: number) => `${d} ${d === 1 ? "hr" : "hrs"}`;
export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
export const fmtPhone = (p: string) => p.slice(0, 5) + " " + p.slice(5);

const C = (id: string, name: string, phone: string, visits: number, newToday = false): Customer => ({ id, name, phone, visits, newToday });
const CUSTOMERS: Customer[] = [
  C("c1","Rahul Sharma","9876543210",8), C("c2","Amit Patil","9823456789",1,true), C("c3","Sameer Shah","9987654321",1,true),
  C("c4","Akash More","9765012345",12), C("c5","Rohit Jadhav","9850123987",6), C("c6","Aditya Kulkarni","9922334455",9),
  C("c7","Pratik Sawant","9890112233",4), C("c8","Omkar Patil","9811223344",3), C("c9","Sahil Khan","9867554433",7),
  C("c10","Neeraj Joshi","9970001122",2), C("c11","Priya Shah","9545678901",1,true), C("c12","Kunal Mehta","9156789012",1,true),
  C("c13","Rahul Kumar","9028374650",1,true), C("c14","Vikram Deshmukh","9607182930",10), C("c15","Yash Bhosale","9730456123",5),
];
const E = (id: string, cid: string, duration: number, amount: number, amountPaid: number, table: string, isActive: boolean, createdAt: string): Entry => {
  const c = CUSTOMERS.find(x => x.id === cid)!;
  return { id, customerId: cid, name: c.name, phone: c.phone, duration, amount, amountPaid, table, isActive, createdAt };
};
// newest first
const ENTRIES: Entry[] = [
  E("e3","c3",3,900,550,"Snooker 01",true,"07:05 PM"), E("e2","c2",1,300,200,"Pool 02",true,"06:40 PM"), E("e1","c1",2,600,600,"Pool 01",true,"06:10 PM"),
  E("e4","c13",1.5,450,250,"Pool 03",false,"05:30 PM"), E("e12","c12",1,300,300,"Pool 04",false,"05:00 PM"), E("e11","c11",1,300,300,"Snooker 02",false,"04:20 PM"),
  E("e8","c8",1,300,300,"Pool 04",false,"03:45 PM"), E("e7","c7",1,200,200,"Pool 03",false,"03:10 PM"), E("e6","c6",1,300,300,"Pool 01",false,"02:30 PM"),
  E("e5","c5",1.5,450,450,"Snooker 03",false,"01:50 PM"), E("e10","c4",2.5,750,750,"Snooker 04",false,"01:00 PM"),
];

type AddInput = { phone: string; name: string; duration: number; amount: number; amountPaid: number; table: string | null };
function computeStats(customers: Customer[], entries: Entry[]) {
  const ids = new Set(entries.map(e => e.customerId));
  const active = entries.filter(e => e.isActive);
  return {
    paid: entries.reduce((s, e) => s + e.amountPaid, 0),
    pending: entries.reduce((s, e) => s + pend(e), 0),
    customerCount: ids.size, entryCount: entries.length,
    active, available: TABLES.length - active.length, pendingList: entries.filter(e => pend(e) > 0),
    newCustomers: customers.filter(c => c.newToday && ids.has(c.id)),
  };
}
type Store = {
  customers: Customer[]; entries: Entry[];
  addEntry: (i: AddInput) => void; markPaid: (id: string, method: "Cash" | "UPI") => void;
  stats: ReturnType<typeof computeStats>;
};
const Ctx = createContext<Store>(null as never);
export const useStore = () => useContext(Ctx);

export function Provider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState(CUSTOMERS);
  const [entries, setEntries] = useState(ENTRIES);
  const addEntry = (i: AddInput) => {
    let c = customers.find(x => x.phone === i.phone);
    if (c) { const id = c.id; setCustomers(cs => cs.map(x => x.id === id ? { ...x, visits: x.visits + 1 } : x)); }
    else { c = C("c" + Date.now(), i.name, i.phone, 1, true); const nc = c; setCustomers(cs => [...cs, nc]); }
    const e: Entry = { id: "e" + Date.now(), customerId: c.id, name: c.name, phone: c.phone, duration: i.duration, amount: i.amount, amountPaid: i.amountPaid, table: i.table, isActive: !!i.table, createdAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) };
    setEntries(es => [e, ...es]);
  };
  const markPaid = (id: string, method: "Cash" | "UPI") =>
    setEntries(es => es.map(e => e.id === id ? { ...e, amountPaid: e.amount, method } : e));
  return <Ctx.Provider value={{ customers, entries, addEntry, markPaid, stats: computeStats(customers, entries) }}>{children}</Ctx.Provider>;
}
