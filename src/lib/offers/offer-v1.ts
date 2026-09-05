import { z } from "zod";

export function parsePercentToBps(value:string){
  const normalized=value.trim();if(!/^\d{1,3}(?:\.\d{1,2})?$/.test(normalized))return null;
  const [whole,fraction=""]=normalized.split(".");const bps=Number(whole)*100+Number(fraction.padEnd(2,"0"));return Number.isSafeInteger(bps)?bps:null;
}

export function calculateOffer(invoiceMinor:number,advanceBps:number,feeBps:number){
  if(!Number.isSafeInteger(invoiceMinor)||invoiceMinor<=0||!Number.isInteger(advanceBps)||advanceBps<1||advanceBps>10000||!Number.isInteger(feeBps)||feeBps<0||feeBps>=10000)throw new Error("Invalid offer inputs");
  const round=(amount:number,bps:number)=>Number((BigInt(amount)*BigInt(bps)+BigInt(5000))/BigInt(10000));
  const advanceAmountMinor=round(invoiceMinor,advanceBps);const feeAmountMinor=round(advanceAmountMinor,feeBps);const netDisbursementMinor=advanceAmountMinor-feeAmountMinor;
  if(advanceAmountMinor<=0||advanceAmountMinor>invoiceMinor||feeAmountMinor<0||feeAmountMinor>=advanceAmountMinor)throw new Error("Invalid calculated offer");
  return{invoiceMinor,advanceBps,feeBps,advanceAmountMinor,feeAmountMinor,netDisbursementMinor};
}

export const offerFormSchema=z.object({applicationId:z.uuid(),advancePercent:z.string(),feePercent:z.string(),expiryDate:z.iso.date()}).transform((value,context)=>{
  const advanceBps=parsePercentToBps(value.advancePercent),feeBps=parsePercentToBps(value.feePercent);const today=new Date().toISOString().slice(0,10);
  if(advanceBps===null||advanceBps<1||advanceBps>10000)context.addIssue({code:"custom",path:["advancePercent"],message:"Enter an advance from 0.01% to 100%."});
  if(feeBps===null||feeBps<0||feeBps>=10000)context.addIssue({code:"custom",path:["feePercent"],message:"Enter a fee from 0% to 99.99%."});
  if(value.expiryDate<=today)context.addIssue({code:"custom",path:["expiryDate"],message:"Choose a future expiry date."});
  return{applicationId:value.applicationId,advanceBps:advanceBps??0,feeBps:feeBps??0,expiryDate:value.expiryDate};
});

export const funderDeclineSchema=z.object({applicationId:z.uuid(),reason:z.string().trim().min(3).max(500)});
export const offerResponseSchema=z.object({offerId:z.uuid(),decision:z.enum(["accept","decline"]),reason:z.string().trim().max(500)}).superRefine((value,context)=>{if(value.decision==="decline"&&value.reason.length<3)context.addIssue({code:"custom",path:["reason"],message:"Add a short reason for declining."});});
