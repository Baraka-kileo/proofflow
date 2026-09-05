import { describe, expect, it } from "vitest";
import { DOCUMENT_MAX_BYTES, hasExpectedFileSignature, sanitizeDocumentFilename, validateSelectedDocument } from "@/lib/documents/validation";
import { type CompletedDocument, uploadReducer } from "@/lib/documents/upload-machine";

const pdfFile=new File(["%PDF-1.4 demo"],"Invoice 42.pdf",{type:"application/pdf"});
const prepared={documentId:"11111111-1111-4111-8111-111111111111",storagePath:"org/app/doc/invoice.pdf",safeFilename:"Invoice-42.pdf"};
const complete:CompletedDocument={id:prepared.documentId,kind:"invoice",originalFilename:pdfFile.name,byteSize:pdfFile.size,pageCount:1,uploadCompletedAt:"2026-09-05T00:00:00Z"};

describe("document upload validation and state",()=>{
  it("rejects the wrong type, an oversized file, and a mismatched extension",()=>{
    expect(validateSelectedDocument(new File(["plain"],"notes.txt",{type:"text/plain"}))).toMatch(/PDF, JPEG, or PNG/);
    expect(validateSelectedDocument({name:"large.pdf",type:"application/pdf",size:DOCUMENT_MAX_BYTES+1})).toMatch(/10 MB/);
    expect(validateSelectedDocument(new File(["image"],"invoice.png",{type:"application/pdf"}))).toMatch(/extension/);
  });
  it("sanitizes paths while preserving a safe extension",()=>{expect(sanitizeDocumentFilename("../Démo invoice (final).PDF")).toBe("Demo-invoice-final.pdf");});
  it("checks file signatures instead of trusting only the MIME label",()=>{
    expect(hasExpectedFileSignature(new TextEncoder().encode("%PDF-1.4"),"application/pdf")).toBe(true);
    expect(hasExpectedFileSignature(new TextEncoder().encode("not a pdf"),"application/pdf")).toBe(false);
    expect(hasExpectedFileSignature(new Uint8Array([0xff,0xd8,0xff]),"image/jpeg")).toBe(true);
  });
  it("supports interruption, retry, success, removal, and cancellation",()=>{
    let state=uploadReducer({phase:"idle"},{type:"select",file:pdfFile});
    state=uploadReducer(state,{type:"prepared",prepared});
    state=uploadReducer(state,{type:"progress",progress:47.4});
    expect(state).toMatchObject({phase:"uploading",progress:47});
    state=uploadReducer(state,{type:"fail",message:"Interrupted"});
    expect(state).toMatchObject({phase:"error",message:"Interrupted",prepared});
    state=uploadReducer(state,{type:"retry"});
    expect(state).toMatchObject({phase:"uploading",progress:0});
    state=uploadReducer(state,{type:"complete",document:complete});
    expect(state.phase).toBe("complete");
    state=uploadReducer(state,{type:"remove"});
    expect(state.phase).toBe("removing");
    expect(uploadReducer(state,{type:"reset"})).toEqual({phase:"idle"});
  });
});
