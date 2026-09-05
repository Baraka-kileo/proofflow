import type { DocumentKind } from "@/lib/documents/validation";

export type PreparedDocument={documentId:string;storagePath:string;safeFilename:string};
export type CompletedDocument={id:string;kind:DocumentKind;originalFilename:string;byteSize:number;pageCount:number;uploadCompletedAt:string};
export type UploadState=
  | {phase:"idle"}
  | {phase:"preparing";file:File}
  | {phase:"uploading";file:File;prepared:PreparedDocument;progress:number}
  | {phase:"error";message:string;file?:File;prepared?:PreparedDocument;document?:CompletedDocument}
  | {phase:"complete";document:CompletedDocument}
  | {phase:"removing";document:CompletedDocument};
export type UploadEvent=
  | {type:"select";file:File}
  | {type:"prepared";prepared:PreparedDocument}
  | {type:"progress";progress:number}
  | {type:"fail";message:string}
  | {type:"retry"}
  | {type:"complete";document:CompletedDocument}
  | {type:"remove"}
  | {type:"reset"};

export function uploadReducer(state:UploadState,event:UploadEvent):UploadState{
  if(event.type==="select")return{phase:"preparing",file:event.file};
  if(event.type==="prepared"&&state.phase==="preparing")return{phase:"uploading",file:state.file,prepared:event.prepared,progress:0};
  if(event.type==="progress"&&state.phase==="uploading")return{...state,progress:Math.min(100,Math.max(0,Math.round(event.progress)))};
  if(event.type==="fail")return{phase:"error",message:event.message,file:"file" in state?state.file:undefined,prepared:"prepared" in state?state.prepared:undefined,document:"document" in state?state.document:undefined};
  if(event.type==="retry"&&state.phase==="error"&&state.file&&state.prepared)return{phase:"uploading",file:state.file,prepared:state.prepared,progress:0};
  if(event.type==="complete")return{phase:"complete",document:event.document};
  if(event.type==="remove"&&state.phase==="complete")return{phase:"removing",document:state.document};
  if(event.type==="reset")return{phase:"idle"};
  return state;
}
