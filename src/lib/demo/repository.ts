import "server-only";
import type { Role } from "@/types/domain";

export type DashboardData =
 | {role:"sme";metrics:{label:string;value:string;note:string}[];application:{id:string;buyer:string;amount:string;status:string;progress:number;next:string}}
 | {role:"buyer";metrics:{label:string;value:string;note:string}[];requests:{id:string;supplier:string;invoice:string;amount:string;age:string;warnings:number}[]}
 | {role:"funder";metrics:{label:string;value:string;note:string}[];applications:{id:string;supplier:string;buyer:string;amount:string;confirmed:string;warnings:number}[]};

export async function getDemoDashboard(role:Role):Promise<DashboardData>{
 if(role==="sme")return{role,metrics:[{label:"Evidence completion",value:"75%",note:"3 of 4 steps complete"},{label:"Verified value",value:"R 48,750",note:"Across 1 buyer-confirmed invoice"},{label:"Buyer confirmations",value:"1",note:"No disputes recorded"}],application:{id:"PF-2048",buyer:"Ubuntu Retail Group",amount:"R 48,750.00",status:"Buyer confirmed",progress:75,next:"Waiting for funder review"}};
 if(role==="buyer")return{role,metrics:[{label:"Needs your action",value:"2",note:"Oldest waiting 18 hours"},{label:"Confirmed this month",value:"7",note:"R 314,200 in invoice value"},{label:"Disputed",value:"1",note:"Reason shared with supplier"}],requests:[{id:"CF-091",supplier:"Ndlovu Office Supply",invoice:"INV-2039",amount:"R 48,750",age:"3 hours",warnings:0},{id:"CF-088",supplier:"Mokoena Catering Demo",invoice:"INV-1184",amount:"R 22,400",age:"18 hours",warnings:1}]};
 return{role,metrics:[{label:"Ready for review",value:"4",note:"All buyer confirmed"},{label:"Requested value",value:"R 286,400",note:"Across current queue"},{label:"Offers awaiting response",value:"2",note:"R 96,000 net advances"}],applications:[{id:"PF-2048",supplier:"Ndlovu Office Supply",buyer:"Ubuntu Retail Group",amount:"R 48,750",confirmed:"12 minutes ago",warnings:0},{id:"PF-2017",supplier:"Siyakhula Print Demo",buyer:"Cape Learning Group",amount:"R 82,300",confirmed:"2 hours ago",warnings:1}]};
}
