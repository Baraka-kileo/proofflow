"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/login";

export type LoginState = {
  errors: Array<{ id: string; message: string }>;
  message?: string;
};

export async function signIn(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
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
