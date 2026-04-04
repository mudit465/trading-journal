"use server";

import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { StickyNote } from "@/types";

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function getNotes(): Promise<StickyNote[]> {
  const userId = await getUserId();
  const supabase = await createClient();

  const { data } = await supabase
    .from("sticky_notes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []) as StickyNote[];
}

export async function createNote(): Promise<StickyNote> {
  const userId = await getUserId();
  const supabase = await createClient();

  const colors = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff", "#fed7aa"];
  const color = colors[Math.floor(Math.random() * colors.length)];

  const { data, error } = await supabase
    .from("sticky_notes")
    .insert({ user_id: userId, content: "", color, position_x: 0, position_y: 0 })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/notes");
  return data as StickyNote;
}

export async function updateNote(id: string, updates: Partial<Pick<StickyNote, "content" | "color" | "position_x" | "position_y">>): Promise<void> {
  const userId = await getUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("sticky_notes")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function deleteNote(id: string): Promise<void> {
  const userId = await getUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("sticky_notes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/notes");
}
