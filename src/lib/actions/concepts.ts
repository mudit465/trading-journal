"use server";

import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Concept } from "@/types";

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function getConcepts(): Promise<Concept[]> {
  const userId = await getUserId();
  const supabase = await createClient();

  const { data } = await supabase
    .from("concepts")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  return (data ?? []) as Concept[];
}

export async function createConcept(name: string, color: string): Promise<Concept> {
  const userId = await getUserId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("concepts")
    .insert({ user_id: userId, name, color })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/concepts");
  revalidatePath("/trades/new");
  return data as Concept;
}

export async function deleteConcept(id: string): Promise<void> {
  const userId = await getUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("concepts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/concepts");
}

export async function updateConcept(id: string, name: string, color: string): Promise<void> {
  const userId = await getUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("concepts")
    .update({ name, color })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/concepts");
}
