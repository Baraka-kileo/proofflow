import { PDFDocument } from "pdf-lib";
import { describe,expect,it } from "vitest";
import { generateSystemVerificationCertificate } from "@/lib/integrations/system-certificate";

export const certificateFixture={verificationId:"c0ffee00-0000-4000-8000-000000002048",buyer:"Ubuntu Retail Group Demo",supplier:"Mokoena Catering Demo",purchaseOrder:"PO-2048",invoice:"INV-2048",invoiceAmount:"R 82,300.00",outstandingAmount:"R 82,300.00",expectedPaymentDate:"9 October 2026",retrievedAt:"5 September 2026, 14:32 SAST",evidenceHash:"a".repeat(64),checks:Array.from({length:10},(_,index)=>({code:`C${String(index+1).padStart(3,"0")}`,title:["Buyer connection","Supplier mapping","Purchase order","PO supplier","Invoice","Invoice PO reference","Amount and currency","Delivery receipt","Outstanding status","Expected payment date"][index],result:"pass"})),verificationUrl:"https://demo.proofflow.example/applications/demo/system-evidence"};

describe("system verification certificate",()=>{it("creates one PDF page without a human signature",async()=>{const bytes=await generateSystemVerificationCertificate(certificateFixture);const pdf=await PDFDocument.load(bytes);expect(pdf.getPageCount()).toBe(1);expect(pdf.getTitle()).toContain(certificateFixture.verificationId);expect(bytes.byteLength).toBeGreaterThan(3000);});});
