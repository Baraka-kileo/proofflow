import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/types/domain";

type Metric = { label: string; value: string; note: string };
export type DashboardData =
  | { role: "sme"; metrics: Metric[]; application: { id: string; buyer: string; amount: string; status: string; progress: number; next: string } | null }
  | { role: "buyer"; metrics: Metric[]; requests: { id: string; supplier: string; invoice: string; amount: string; age: string; warnings: number }[] }
  | { role: "funder"; metrics: Metric[]; applications: { id: string; supplier: string; buyer: string; amount: string; confirmed: string; warnings: number }[] };

const money = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 });
const statuses:Record<string,{label:string;progress:number;next:string}>={
  draft:{label:"Draft",progress:10,next:"Add the application details"},
  documents_uploaded:{label:"Documents uploaded",progress:30,next:"Extract the document fields"},
  fields_extracted:{label:"Fields extracted",progress:45,next:"Review the extracted fields"},
  sme_reviewed:{label:"Evidence reviewed",progress:55,next:"Run the verification checks"},
  checks_complete:{label:"Checks complete",progress:65,next:"Request buyer confirmation"},
  buyer_pending:{label:"Buyer confirmation pending",progress:70,next:"Waiting for buyer confirmation"},
  buyer_confirmed:{label:"Buyer confirmed",progress:75,next:"Waiting for funder review"},
  buyer_disputed:{label:"Buyer disputed",progress:65,next:"Review the buyer's reason"},
  funder_review:{label:"Funder review",progress:82,next:"Waiting for the funder's decision"},
  offer_made:{label:"Offer ready",progress:90,next:"Review the simulated offer"},
  offer_accepted:{label:"Offer accepted",progress:96,next:"Complete simulated funding"},
  offer_declined:{label:"Offer declined",progress:100,next:"Application closed"},
  funded_simulated:{label:"Simulated funded",progress:100,next:"View the Trust Passport"},
};

function formatMoney(minor:number|null){return money.format((minor??0)/100);}
function shortId(prefix:string,id:string){return `${prefix}-${id.slice(-4).toUpperCase()}`;}
function elapsed(iso:string|null){if(!iso)return "recently";const hours=Math.max(0,Math.floor((Date.now()-new Date(iso).getTime())/3_600_000));if(hours<1)return "under 1 hour";return `${hours} ${hours===1?"hour":"hours"}`;}
function assertQuery(error:{message:string}|null,context:string){if(error)throw new Error(`Unable to load ${context}. Please try again.`);}

export async function getDashboard(session:SessionUser):Promise<DashboardData>{
  const supabase=await createClient();
  if(session.role==="sme"){
    const {data,error}=await supabase.from("applications").select("id,status,invoice_total_minor,submitted_at,buyer:organizations!applications_buyer_organization_id_fkey(name)").eq("owner_organization_id",session.organizationId).order("submitted_at",{ascending:false,nullsFirst:false});
    assertQuery(error,"your applications");
    const rows=data??[];const current=rows[0];const confirmed=rows.filter(row=>["buyer_confirmed","funder_review","offer_made","offer_accepted","funded_simulated"].includes(row.status));const state=current?statuses[current.status]:null;
    return{role:"sme",metrics:[{label:"Evidence completion",value:current?`${state?.progress??0}%`:"0%",note:current?state?.next??"Continue the evidence journey":"Start the first application"},{label:"Verified value",value:formatMoney(confirmed.reduce((sum,row)=>sum+(row.invoice_total_minor??0),0)),note:`Across ${confirmed.length} buyer-confirmed ${confirmed.length===1?"invoice":"invoices"}`},{label:"Buyer confirmations",value:String(confirmed.length),note:"RLS-filtered to your organization"}],application:current&&state?{id:shortId("PF",current.id),buyer:current.buyer.name,amount:formatMoney(current.invoice_total_minor),status:state.label,progress:state.progress,next:state.next}:null};
  }
  if(session.role==="buyer"){
    const {data,error}=await supabase.from("confirmations").select("id,requested_at,application:applications!confirmations_application_id_fkey(invoice_number,invoice_total_minor,owner:organizations!applications_owner_organization_id_fkey(name))").eq("buyer_organization_id",session.organizationId).eq("status","pending").order("requested_at",{ascending:true});
    assertQuery(error,"buyer confirmations");const rows=data??[];
    const requests=rows.map(row=>({id:shortId("CF",row.id),supplier:row.application.owner.name,invoice:row.application.invoice_number??"Invoice pending",amount:formatMoney(row.application.invoice_total_minor),age:elapsed(row.requested_at),warnings:0}));
    return{role:"buyer",metrics:[{label:"Needs your action",value:String(rows.length),note:rows[0]?`Oldest waiting ${elapsed(rows[0].requested_at)}`:"Queue is clear"},{label:"Visible invoice value",value:formatMoney(rows.reduce((sum,row)=>sum+(row.application.invoice_total_minor??0),0)),note:"Pending requests addressed to you"},{label:"Cross-tenant access",value:"Blocked",note:"Enforced by database policy"}],requests};
  }
  const {data,error}=await supabase.from("applications").select("id,invoice_total_minor,owner:organizations!applications_owner_organization_id_fkey(name),buyer:organizations!applications_buyer_organization_id_fkey(name)").in("status",["buyer_confirmed","funder_review","offer_made","offer_accepted","offer_declined","funded_simulated"]);
  assertQuery(error,"funder review queue");const rows=data??[];const ids=rows.map(row=>row.id);
  const [{data:checks,error:checksError},{data:confirmations,error:confirmationsError}]=ids.length?await Promise.all([supabase.from("verification_checks").select("application_id,result").in("application_id",ids),supabase.from("confirmations").select("application_id,decided_at").in("application_id",ids).eq("status","confirmed")]):[{data:[],error:null},{data:[],error:null}];
  assertQuery(checksError,"verification summaries");assertQuery(confirmationsError,"confirmation summaries");
  const applications=rows.map(row=>({id:shortId("PF",row.id),supplier:row.owner.name,buyer:row.buyer.name,amount:formatMoney(row.invoice_total_minor),confirmed:elapsed(confirmations?.find(item=>item.application_id===row.id)?.decided_at??null),warnings:(checks??[]).filter(item=>item.application_id===row.id&&item.result!=="pass").length}));
  return{role:"funder",metrics:[{label:"Ready for review",value:String(rows.length),note:"All buyer confirmed"},{label:"Requested value",value:formatMoney(rows.reduce((sum,row)=>sum+(row.invoice_total_minor??0),0)),note:"Across your current queue"},{label:"Review items",value:String(applications.reduce((sum,row)=>sum+row.warnings,0)),note:"Explainable rule results"}],applications};
}
