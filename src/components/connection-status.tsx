"use client";

import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function ConnectionStatus() {
  const [online,setOnline]=useState(true);
  useEffect(()=>{const update=()=>setOnline(navigator.onLine);update();window.addEventListener("online",update);window.addEventListener("offline",update);return()=>{window.removeEventListener("online",update);window.removeEventListener("offline",update);};},[]);
  if(online)return null;
  return <div className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-xl" aria-live="assertive"><Alert tone="error" title="You are offline"><div className="flex flex-wrap items-center justify-between gap-3"><span>Your latest action may not be saved. Reconnect before continuing.</span><Button size="sm" variant="secondary" onClick={()=>window.location.reload()}>Try again</Button></div></Alert></div>;
}
