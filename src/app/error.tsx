"use client";
import { RouteError } from "@/components/route-error";
export default function ErrorPage({ reset }: { error:Error & { digest?:string }; reset:()=>void }) { return <main className="p-6"><RouteError reset={reset} /></main>; }
