"use client";
import { Eye, EyeOff } from "lucide-react";
import { useActionState, useState } from "react";
import { signIn, type LoginState } from "@/app/(auth)/login/actions";
import { ErrorSummary } from "@/components/error-summary";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

type LoginAction = (state: LoginState, formData: FormData) => Promise<LoginState>;
const initialLoginState:LoginState={errors:[]};

export function LoginForm({ action = signIn }: { action?: LoginAction }) { const [show,setShow]=useState(false);const [state,formAction,pending]=useActionState(action,initialLoginState);const errors=state.errors;return <form action={formAction} noValidate className="space-y-5"><ErrorSummary errors={errors} />{state.message&&<Alert title="Sign-in unsuccessful">{state.message}</Alert>}<FormField id="email" label="Email address" required error={errors.find(e=>e.id==="email")?.message}><Input id="email" name="email" type="email" autoComplete="email" aria-invalid={errors.some(e=>e.id==="email")} /></FormField><FormField id="password" label="Password" required error={errors.find(e=>e.id==="password")?.message}><div className="relative"><Input id="password" name="password" type={show?"text":"password"} autoComplete="current-password" className="pr-12" aria-invalid={errors.some(e=>e.id==="password")} /><button type="button" onClick={()=>setShow(v=>!v)} className="absolute right-1 top-1 grid size-10 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--soft)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus)]" aria-label={show?"Hide password":"Show password"}>{show?<EyeOff aria-hidden="true" className="size-4" />:<Eye aria-hidden="true" className="size-4" />}</button></div></FormField><Button className="w-full" type="submit" disabled={pending}>{pending?"Signing in…":"Sign in"}</Button></form>; }
