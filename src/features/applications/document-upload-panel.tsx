"use client";

import { AlertTriangle, Check, Eye, FileImage, FileText, RefreshCw, RotateCcw, Trash2, UploadCloud, X } from "lucide-react";
import { useReducer, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "tus-js-client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { DOCUMENT_ACCEPT, DOCUMENT_MAX_BYTES, type DocumentKind, validateSelectedDocument } from "@/lib/documents/validation";
import { type CompletedDocument, type PreparedDocument, type UploadState, uploadReducer } from "@/lib/documents/upload-machine";
import { completeDocumentUpload, getDocumentPreviewUrl, prepareDocumentUpload, removeDocumentUpload } from "@/app/(protected)/applications/[applicationId]/document-actions";

type StoredDocument={id:string;kind:DocumentKind;originalFilename:string;storagePath:string;byteSize:number;pageCount:number|null;uploadCompletedAt:string|null};
const slots:Array<{kind:DocumentKind;title:string;purpose:string;examples:string}>=[
  {kind:"purchase_order",title:"Purchase order",purpose:"Shows what the buyer ordered and the agreed value.",examples:"Purchase order or signed contract"},
  {kind:"delivery_evidence",title:"Delivery evidence",purpose:"Shows that goods or services reached the buyer.",examples:"Delivery note or completion certificate"},
  {kind:"invoice",title:"Invoice",purpose:"Shows the amount owed and expected payment date.",examples:"Final tax invoice"},
];

function formatBytes(bytes:number){return bytes<1024*1024?`${Math.max(1,Math.round(bytes/1024))} KB`:`${(bytes/(1024*1024)).toFixed(1)} MB`;}
function completed(document:StoredDocument):CompletedDocument|null{return document.uploadCompletedAt&&document.pageCount?{id:document.id,kind:document.kind,originalFilename:document.originalFilename,byteSize:document.byteSize,pageCount:document.pageCount,uploadCompletedAt:document.uploadCompletedAt}:null;}
function initialState(document?:StoredDocument):UploadState{const ready=document?completed(document):null;if(ready)return{phase:"complete",document:ready};if(document)return{phase:"error",message:"A previous upload did not finish. Choose the file again to retry the slot."};return{phase:"idle"};}

function DocumentSlot({applicationId,slot,stored,readOnly}:{applicationId:string;slot:(typeof slots)[number];stored?:StoredDocument;readOnly:boolean}){
  const [state,dispatch]=useReducer(uploadReducer,stored,initialState);
  const router=useRouter();
  const inputRef=useRef<HTMLInputElement>(null);
  const uploadRef=useRef<Upload|null>(null);
  const runRef=useRef(0);

  async function startTransfer(file:File,prepared:PreparedDocument){
    const run=++runRef.current;
    const {data,error}=await createClient().auth.getSession();
    if(error||!data.session){dispatch({type:"fail",message:"Your secure session expired. Sign in and retry."});return;}
    const projectUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
    if(!projectUrl){dispatch({type:"fail",message:"Hosted storage is unavailable."});return;}
    const projectRef=new URL(projectUrl).hostname.split(".")[0];
    const upload=new Upload(file,{
      endpoint:`https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`,
      retryDelays:[0,1000,3000,5000],
      headers:{authorization:`Bearer ${data.session.access_token}`},
      uploadDataDuringCreation:true,
      removeFingerprintOnSuccess:true,
      chunkSize:6*1024*1024,
      metadata:{bucketName:"application-documents",objectName:prepared.storagePath,contentType:file.type,cacheControl:"no-cache"},
      onProgress:(sent,total)=>{if(run===runRef.current)dispatch({type:"progress",progress:total?sent/total*100:0});},
      onError:()=>{if(run===runRef.current)dispatch({type:"fail",message:"The transfer was interrupted. Check your connection and retry from where it stopped."});},
      onSuccess:()=>{void (async()=>{if(run!==runRef.current)return;const result=await completeDocumentUpload(prepared.documentId);if(!result.ok){if(["INVALID_FILE","INVALID_PDF","DUPLICATE_FILE"].includes(result.code??""))dispatch({type:"reset"});dispatch({type:"fail",message:result.message});return;}dispatch({type:"complete",document:{id:prepared.documentId,kind:slot.kind,originalFilename:file.name,byteSize:file.size,pageCount:result.pageCount??1,uploadCompletedAt:result.uploadCompletedAt??new Date().toISOString()}});router.refresh();})();},
    });
    uploadRef.current=upload;
    const previous=await upload.findPreviousUploads().catch(()=>[]);
    if(previous.length)upload.resumeFromPreviousUpload(previous[0]);
    upload.start();
  }

  async function chooseFile(file?:File){
    if(!file||readOnly)return;
    dispatch({type:"select",file});
    const validation=validateSelectedDocument(file);
    if(validation){dispatch({type:"fail",message:validation});return;}
    const prepared=await prepareDocumentUpload({applicationId,kind:slot.kind,originalFilename:file.name,mimeType:file.type,byteSize:file.size});
    if(!prepared.ok){dispatch({type:"fail",message:prepared.message});return;}
    if(!prepared.documentId||!prepared.storagePath||!prepared.safeFilename){dispatch({type:"fail",message:"The private upload could not be prepared. Please try again."});return;}
    const record={documentId:prepared.documentId,storagePath:prepared.storagePath,safeFilename:prepared.safeFilename};
    dispatch({type:"prepared",prepared:record});
    await startTransfer(file,record);
  }

  async function cancelTransfer(){
    const prepared="prepared" in state?state.prepared:undefined;
    runRef.current++;
    await uploadRef.current?.abort(true).catch(()=>undefined);
    if(prepared)await removeDocumentUpload(prepared.documentId);
    dispatch({type:"reset"});
    if(inputRef.current)inputRef.current.value="";
    router.refresh();
  }

  async function retryTransfer(){if(state.phase!=="error"||!state.file||!state.prepared)return;const {file,prepared}=state;dispatch({type:"retry"});await startTransfer(file,prepared);}
  async function removeCompleted(document:CompletedDocument){dispatch({type:"remove"});const result=await removeDocumentUpload(document.id);if(!result.ok){dispatch({type:"fail",message:result.message});return;}dispatch({type:"reset"});if(inputRef.current)inputRef.current.value="";router.refresh();}
  async function preview(document:CompletedDocument){const previewWindow=window.open("about:blank","_blank");if(previewWindow)previewWindow.opener=null;const result=await getDocumentPreviewUrl(document.id);if(!result.ok){previewWindow?.close();dispatch({type:"fail",message:result.message});return;}if(!result.url){previewWindow?.close();dispatch({type:"fail",message:"A private preview could not be created. Please try again."});return;}if(previewWindow)previewWindow.location.replace(result.url);else window.location.assign(result.url);}

  const currentDocument=state.phase==="complete"||state.phase==="removing"?state.document:state.phase==="error"?state.document:undefined;
  const busy=state.phase==="preparing"||state.phase==="uploading"||state.phase==="removing";
  const Icon=slot.kind==="invoice"?FileText:FileImage;
  return <article data-testid={`document-slot-${slot.kind}`} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5" onDragOver={event=>{if(!readOnly)event.preventDefault();}} onDrop={event=>{event.preventDefault();void chooseFile(event.dataTransfer.files[0]);}}>
    <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--soft)] text-[var(--primary)]"><Icon className="size-5" aria-hidden="true"/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">{slot.title}</h3><span className="text-[10px] font-bold uppercase tracking-[.1em] text-[var(--muted)]">{currentDocument?"Uploaded":"Required"}</span></div><p className="mt-1 text-sm leading-6 text-[var(--muted)]">{slot.purpose}</p><p className="mt-1 text-xs text-[var(--muted)]">{slot.examples} · PDF, JPEG or PNG · max {DOCUMENT_MAX_BYTES/1024/1024} MB</p></div></div>
    <div className="mt-5" aria-live="polite">
      {state.phase==="idle"&&<UploadChoice slot={slot} inputRef={inputRef} chooseFile={chooseFile} disabled={readOnly}/>} 
      {state.phase==="preparing"&&<div className="flex items-center gap-3 rounded-xl bg-[var(--soft)] p-4 text-sm"><RefreshCw className="size-4 animate-spin text-[var(--primary)] motion-reduce:animate-none" aria-hidden="true"/>Preparing a private upload…</div>}
      {state.phase==="uploading"&&<div className="rounded-xl bg-[var(--soft)] p-4"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><b className="block truncate text-sm">{state.file.name}</b><span className="text-xs text-[var(--muted)]">{formatBytes(state.file.size)}</span></div><Button type="button" variant="ghost" size="sm" onClick={()=>void cancelTransfer()}><X className="size-4" aria-hidden="true"/>Cancel</Button></div><Progress className="mt-4" label={`Uploading ${slot.title}`} value={state.progress}/></div>}
      {state.phase==="error"&&<div className="space-y-3"><div role="alert" className="flex gap-3 rounded-xl border border-[#efc6c2] bg-[var(--error-soft)] p-4 text-sm"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--error)]" aria-hidden="true"/><div><b>Upload needs attention</b><p className="mt-1 text-[var(--muted)]">{state.message}</p></div></div>{state.file&&state.prepared?<div className="flex flex-wrap gap-2"><Button type="button" size="sm" onClick={()=>void retryTransfer()}><RotateCcw className="size-4" aria-hidden="true"/>Retry upload</Button><Button type="button" variant="secondary" size="sm" onClick={()=>void cancelTransfer()}>Cancel and remove</Button></div>:state.document?<Button type="button" variant="danger" size="sm" onClick={()=>void removeCompleted(state.document!)}><Trash2 className="size-4" aria-hidden="true"/>Try removal again</Button>:<UploadChoice slot={slot} inputRef={inputRef} chooseFile={chooseFile} disabled={readOnly}/>}</div>}
      {currentDocument&&state.phase!=="error"&&<div className="flex flex-col gap-4 rounded-xl bg-[var(--success-soft)] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--primary)] text-white"><Check className="size-4" aria-hidden="true"/></span><div className="min-w-0"><b className="block truncate text-sm">{currentDocument.originalFilename}</b><span className="text-xs text-[var(--muted)]">{formatBytes(currentDocument.byteSize)} · {currentDocument.pageCount} {currentDocument.pageCount===1?"page":"pages"}</span></div></div><div className="flex gap-2"><Button type="button" variant="secondary" size="sm" onClick={()=>void preview(currentDocument)}><Eye className="size-4" aria-hidden="true"/>Preview</Button>{!readOnly&&<Button type="button" variant="ghost" size="sm" loading={busy} onClick={()=>void removeCompleted(currentDocument)}><Trash2 className="size-4" aria-hidden="true"/>Remove</Button>}</div></div>}
    </div>
  </article>;
}

function UploadChoice({slot,inputRef,chooseFile,disabled}:{slot:(typeof slots)[number];inputRef:React.RefObject<HTMLInputElement|null>;chooseFile:(file?:File)=>Promise<void>;disabled:boolean}){return <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--canvas)] p-5 text-center"><UploadCloud className="mx-auto size-6 text-[var(--primary)]" aria-hidden="true"/><p className="mt-2 text-sm font-semibold">Drop {slot.title.toLowerCase()} here</p><p className="mt-1 text-xs text-[var(--muted)]">or choose one file from this device</p><label aria-disabled={disabled} className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--primary-pressed)] focus-within:outline-none focus-within:ring-3 focus-within:ring-[var(--focus)] aria-disabled:pointer-events-none aria-disabled:opacity-50">Browse files<input ref={inputRef} type="file" accept={DOCUMENT_ACCEPT} className="sr-only" disabled={disabled} aria-label={`Upload ${slot.title}`} onChange={event=>void chooseFile(event.target.files?.[0])}/></label></div>}

export function DocumentUploadPanel({applicationId,documents,status}:{applicationId:string;documents:StoredDocument[];status:string}){
  const completedCount=documents.filter(document=>document.uploadCompletedAt).length;
  const readOnly=!(["draft","documents_uploaded"] as string[]).includes(status);
  return <section aria-labelledby="documents-title"><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><span className="text-xs font-bold uppercase tracking-[.12em] text-[var(--primary)]">Private evidence</span><h2 id="documents-title" className="mt-2 text-2xl font-bold tracking-[-.035em]">Add three supporting documents</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">Each file has one purpose. It stays private and is used only for this evidence application.</p></div><span className="text-sm font-bold tabular-nums text-[var(--primary)]">{completedCount} / 3 uploaded</span></div><div className="space-y-4">{slots.map(slot=><DocumentSlot key={`${slot.kind}-${documents.find(document=>document.kind===slot.kind)?.id??"empty"}`} applicationId={applicationId} slot={slot} stored={documents.find(document=>document.kind===slot.kind)} readOnly={readOnly}/>)}</div>{readOnly&&<p className="mt-4 text-xs text-[var(--muted)]">Uploads are read-only after document review begins.</p>}</section>;
}
