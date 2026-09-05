import { CheckCircle2, LockKeyhole } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ApplicationDetailsReceipt({buyer,purchaseOrder,amount,dueDate,consented}:{buyer:string;purchaseOrder:string|null;amount:string;dueDate:string|null;consented:boolean}){
  const due=dueDate?new Intl.DateTimeFormat("en-ZA",{dateStyle:"medium",timeZone:"UTC"}).format(new Date(`${dueDate}T00:00:00Z`)):"Not provided";
  return <Card><CardContent className="pt-6"><div className="flex items-start justify-between gap-4"><div><span className="text-xs font-bold uppercase tracking-[.12em] text-[var(--primary)]">Saved details</span><h2 className="mt-2 text-xl font-bold tracking-[-.03em]">Application information</h2></div><CheckCircle2 className="size-5 shrink-0 text-[var(--success)]" aria-hidden="true"/></div><dl className="mt-5 grid gap-3 sm:grid-cols-2"><Detail label="Buyer" value={buyer}/><Detail label="Purchase order" value={purchaseOrder??"Not provided"}/><Detail label="Invoice value" value={amount}/><Detail label="Expected payment" value={due}/></dl><p className="mt-5 flex items-center gap-2 border-t border-[var(--border)] pt-4 text-xs text-[var(--muted)]"><LockKeyhole className="size-4" aria-hidden="true"/>{consented?"AI processing consent recorded for these Demo documents.":"AI processing consent has not been recorded."}</p></CardContent></Card>;
}

function Detail({label,value}:{label:string;value:string}){return <div className="rounded-xl bg-[var(--soft)] p-4"><dt className="text-[11px] font-bold uppercase tracking-[.08em] text-[var(--muted)]">{label}</dt><dd className="mt-1 break-words text-sm font-semibold">{value}</dd></div>}
