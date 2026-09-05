"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDemoAuthEnvironment } from "@/lib/env/server";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/login";

export type LoginState = {
  errors: Array<{ id: string; message: string }>;
  message?: string;
};

export async function signIn(_state: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.issues.map((issue) => ({
        id: String(issue.path[0]),
        message: issue.message,
      })),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { errors: [], message: "Email or password is incorrect." };
  redirect("/dashboard");
}

const roleSchema=z.enum(["sme","buyer","funder"]);
const demoEmails:Record<z.infer<typeof roleSchema>,string>={sme:"sme.demo@proofflow.example",buyer:"buyer.demo@proofflow.example",funder:"funder.demo@proofflow.example"};
export async function enterDemoWorkspace(formData:FormData) { const parsed=roleSchema.safeParse(formData.get("role")); if(!parsed.success) redirect("/login?error=invalid-role");const environment=getDemoAuthEnvironment();const supabase=await createClient();const {error}=await supabase.auth.signInWithPassword({email:demoEmails[parsed.data],password:environment.PROOFFLOW_DEMO_PASSWORD});if(error)redirect("/login?error=demo-unavailable");redirect("/dashboard"); }
