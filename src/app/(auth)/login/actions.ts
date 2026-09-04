"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
const roleSchema=z.enum(["sme","buyer","funder"]);
export async function enterDemoWorkspace(formData:FormData) { const parsed=roleSchema.safeParse(formData.get("role")); if(!parsed.success) redirect("/login?error=invalid-role"); (await cookies()).set("proof-demo-role",parsed.data,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:60*60*8}); redirect("/dashboard"); }
