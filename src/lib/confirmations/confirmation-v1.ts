import { z } from "zod";

export const confirmationKeys = ["poIssued","deliveryAccepted","invoiceRecognized","amountCorrect","invoiceOutstanding","paymentDateCorrect"] as const;
export type ConfirmationKey = (typeof confirmationKeys)[number];
export type ConfirmationAnswers = Record<ConfirmationKey, boolean>;
export type SignaturePoint = { x:number; y:number };
export type SignatureStrokes = SignaturePoint[][];

export const declarationVersion = "buyer-declaration-v1" as const;
export const declarationText = "I confirm that I am authorised to provide this confirmation on behalf of the buyer and that the information above is true and accurate to the best of my knowledge.";

const answersSchema = z.object({
  poIssued:z.boolean(), deliveryAccepted:z.boolean(), invoiceRecognized:z.boolean(), amountCorrect:z.boolean(), invoiceOutstanding:z.boolean(), paymentDateCorrect:z.boolean(),
}).strict();
const explanationsSchema=z.object({
  poIssued:z.string().trim().max(300).optional(), deliveryAccepted:z.string().trim().max(300).optional(), invoiceRecognized:z.string().trim().max(300).optional(), amountCorrect:z.string().trim().max(300).optional(), invoiceOutstanding:z.string().trim().max(300).optional(), paymentDateCorrect:z.string().trim().max(300).optional(),
}).strict();
const signatureSchema=z.array(z.array(z.object({x:z.number().min(0).max(1),y:z.number().min(0).max(1)}).strict()).min(2).max(300)).min(1).max(24);

export const confirmationSubmissionSchema=z.object({
  confirmationId:z.uuid(), answers:answersSchema, explanations:explanationsSchema,
  jobTitle:z.string().trim().min(2).max(100).nullable(), declarationVersion:z.literal(declarationVersion).nullable(), signatureStrokes:signatureSchema.nullable(),
}).strict().superRefine((value,context)=>{
  const hasNo=confirmationKeys.some(key=>!value.answers[key]);
  confirmationKeys.forEach(key=>{if(!value.answers[key]&&(value.explanations[key]?.trim().length??0)<3)context.addIssue({code:"custom",path:["explanations",key],message:"Add a short explanation for this No answer."});});
  if(hasNo){
    if(value.jobTitle!==null||value.declarationVersion!==null||value.signatureStrokes!==null)context.addIssue({code:"custom",message:"A disputed response cannot include a signature."});
  }else{
    if(!value.jobTitle)context.addIssue({code:"custom",path:["jobTitle"],message:"Enter your job title."});
    if(!value.signatureStrokes)context.addIssue({code:"custom",path:["signatureStrokes"],message:"Draw your signature."});
  }
});

export type ConfirmationSubmission=z.infer<typeof confirmationSubmissionSchema>;

export function parseJsonObject(value:FormDataEntryValue|null):unknown{
  if(typeof value!=="string")return null;
  try{return JSON.parse(value);}catch{return null;}
}

export function parseAnswers(value:unknown):ConfirmationAnswers|null{
  const parsed=answersSchema.safeParse(value);return parsed.success?parsed.data:null;
}

export function parseSignature(value:unknown):SignatureStrokes|null{
  const parsed=signatureSchema.safeParse(value);return parsed.success?parsed.data:null;
}
