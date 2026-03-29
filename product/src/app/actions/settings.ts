"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Update Privacy
 * Toggles the is_private flag on the user's profile.
 */
export async function updatePrivacy(isPrivate: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ is_private: isPrivate })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/profile");
}

/**
 * Update Username
 */
export async function updateUsername(newUsername: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Basic format validation
  const cleanUsername = newUsername.trim().toLowerCase();

  if (cleanUsername.length < 3) return { error: "USERNAME MUST BE AT LEAST 3 CHARACTERS." };
  if (cleanUsername.length > 15) return { error: "USERNAME CANNOT EXCEED 15 CHARACTERS." };
  if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
    return { error: "USERNAME CAN ONLY CONTAIN LETTERS, NUMBERS, AND UNDERSCORES." };
  }

  // Collision Check: Is this username already taken?
  const { data: existingUser } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", cleanUsername)
    .single();

  if (existingUser && existingUser.id !== user.id) {
    return { error: "THIS USERNAME IS ALREADY TAKEN." };
  }

  // Perform the update
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ username: cleanUsername })
    .eq("id", user.id);

  if (updateError) {
    return { error: "DATABASE ERROR: FAILED TO UPDATE USERNAME." };
  }

  // Revalidate so the old profile disappears and new one populates
  revalidatePath("/profile");
  return { success: true, newHandle: cleanUsername };
}
