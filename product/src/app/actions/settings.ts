"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

/**
 * Delete User Account
 */
export async function deleteAccount(password: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Verify the password
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password,
  });

  if (loginError) {
    return { error: "INCORRECT PASSWORD. DELETION CANNOT PROCEED." };
  }

  // Perform the deletion
  const { error: deletionError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (deletionError) {
    console.error("Admin deletion error:", deletionError);
    return { error: "SYSTEM FAILURE: FAILED TO CLEAN UP AUTH ACCOUNT." };
  }

  // sign out the current session to clear browser cookies
  await supabase.auth.signOut();

  // hard-redirect
  revalidatePath("/");
  return { success: true };
}

/**
 * Change Password
 */
export async function changePassword(currentPassword: string, newPassword: string) {
  const supabase = await createClient();

  // Verify existence of session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify current password
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });

  if (loginError) {
    return { error: "CURRENT PASSWORD IS INCORRECT." };
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { error: updateError.message.toUpperCase() };
  }

  return { success: true };
}


/**
 * Update Bio
 */
export async function updateBio(bio: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Character limit check 
  if (bio.length > 150) throw new Error("BIO CANNOT EXCEED 150 CHARACTERS.");

  const { error } = await supabase
    .from("profiles")
    .update({ bio: bio })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/profile");
}



/**
 * Server Action: Update Avatar Path
 * Validates the storage path prefix and updates the profile's avatar URL.
 */
export async function updateAvatarPath(path: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  if (!path || typeof path !== "string") {
    return { error: "Invalid path provided." };
  }

  // Validate the path starts with the user's ID
  if (!path.startsWith(`${user.id}-`)) {
    return { error: "Unauthorized path prefix." };
  }

  try {
    // Derive public URL server-side
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (updateError) throw updateError;

    revalidatePath("/settings");
    revalidatePath("/profile");

    return { success: true, url: publicUrl };
  } catch (err: unknown) {
    console.error("updateAvatarPath error:", err);
    return { error: err instanceof Error ? err.message : "Failed to update avatar." };
  }
}

/**
 * Server Action: Remove Avatar
 * Clears the user's avatar_url from the profiles table.
 */
export async function removeAvatarUrl() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  try {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", user.id);

    if (updateError) throw updateError;

    revalidatePath("/settings");
    revalidatePath("/profile");

    return { success: true };
  } catch (err: unknown) {
    console.error("removeAvatarUrl error:", err);
    return { error: err instanceof Error ? err.message : "Failed to remove avatar." };
  }
}
