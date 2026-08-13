"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// --- Schemas ---

/**
 * Username schema.
 * Rules match the pre-ARCH-03B manual checks exactly:
 *   - trim then lowercase (existing behaviour)
 *   - min 3, max 15 (existing product rule)
 *   - only lowercase letters, digits, underscores (existing regex)
 * Classification: PRODUCT RULE (pre-existing manual checks).
 */
const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "USERNAME MUST BE AT LEAST 3 CHARACTERS.")
  .max(15, "USERNAME CANNOT EXCEED 15 CHARACTERS.")
  .regex(/^[a-z0-9_]+$/, "USERNAME CAN ONLY CONTAIN LETTERS, NUMBERS, AND UNDERSCORES.");

/**
 * Bio schema.
 * Rules match the pre-ARCH-03B behaviour:
 *   - string (empty string is valid — profiles can have no bio)
 *   - max 150 characters (existing server check AND UI maxLength={150})
 * Classification: PRODUCT RULE (existing server limit + UI limit).
 * Note: bio is NOT trimmed — whitespace is intentionally preserved per existing UI behaviour.
 */
const bioSchema = z.string().max(150, "BIO CANNOT EXCEED 150 CHARACTERS.");

/**
 * Privacy schema.
 * Strictly boolean — no coercion from strings or numbers.
 * Classification: PRODUCT RULE.
 */
const privacySchema = z.boolean({ error: "Privacy value must be a boolean." });

/**
 * Avatar storage path schema.
 * Validates shape only; the user-prefix ownership check (path starts with user.id)
 * is preserved as explicit business/security logic AFTER authentication.
 * Technical anti-abuse max: 1000 chars (generous ceiling for storage paths).
 * Classification: TECHNICAL ANTI-ABUSE (shape guard only; ownership check remains explicit).
 */
const avatarPathSchema = z.string().trim().min(1, "Invalid path provided.").max(1000);

/**
 * Password schema.
 * Non-empty string only — Supabase auth enforces the real password policy.
 * The client already enforces min 6 chars for new passwords; we mirror that here.
 */
const currentPasswordSchema = z.string().min(1, "Current password is required.");
const newPasswordSchema = z.string().min(6, "New password must be at least 6 characters.");

// --- Helpers ---

/** Safely extract the first human-readable validation error message from a Zod v4 result. */
function firstIssueMessage(error: z.ZodError): string {
  if (error.issues && error.issues.length > 0) {
    return error.issues[0].message;
  }
  return "Invalid input.";
}

/**
 * Safely extract the avatar path from a public URL.
 * Requires the URL to belong to the configured Supabase project and exact public avatars route,
 * and only returns paths that start with the expected user ID namespace.
 */
function extractAvatarPath(url: string, userId: string): string | null {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return null;

    const baseOrigin = new URL(supabaseUrl).origin;
    const parsed = new URL(url);

    if (parsed.origin !== baseOrigin) {
      return null;
    }

    const publicPrefix = "/storage/v1/object/public/avatars/";
    if (!parsed.pathname.startsWith(publicPrefix)) {
      return null;
    }

    const rawPath = parsed.pathname.slice(publicPrefix.length);
    if (!rawPath) return null;

    const path = decodeURIComponent(rawPath);
    if (path.startsWith(`${userId}-`)) {
      return path;
    }
  } catch {
    // Ignore invalid URLs
  }
  return null;
}

// --- Actions ---

/**
 * Server Action: Update Privacy
 * Toggles the is_private flag on the user's profile.
 */
export async function updatePrivacy(isPrivate: unknown) {
  const parsed = privacySchema.safeParse(isPrivate);
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ is_private: parsed.data })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/profile");
}

/**
 * Update Username
 */
export async function updateUsername(newUsername: unknown) {
  const parsed = usernameSchema.safeParse(newUsername);
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  // Already trimmed and lowercased by the schema transform
  const cleanUsername = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Collision Check: Is this username already taken? (BUSINESS LOGIC — not a schema concern)
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
export async function deleteAccount(password: unknown) {
  const parsed = currentPasswordSchema.safeParse(password);
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Verify the password
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: parsed.data,
  });

  if (loginError) {
    return { error: "INCORRECT PASSWORD. DELETION CANNOT PROCEED." };
  }

  // Privileged Storage cleanup
  try {
    while (true) {
      const { data: objects, error: listError } = await supabaseAdmin.storage
        .from("avatars")
        .list("", {
          search: `${user.id}-`,
          limit: 100,
          offset: 0,
        });

      if (listError) throw listError;

      if (!objects || objects.length === 0) {
        break;
      }

      // Filter exactly to namespace prefix to prevent search fuzziness
      const pathsToDelete = objects
        .filter((obj) => obj.name.startsWith(`${user.id}-`))
        .map((obj) => obj.name);

      // If search returned objects but none match the exact prefix, break to prevent infinite loop
      if (pathsToDelete.length === 0) {
        break;
      }

      const { error: removeError } = await supabaseAdmin.storage
        .from("avatars")
        .remove(pathsToDelete);

      if (removeError) throw removeError;
    }
  } catch (err) {
    console.error("Failed to clean up avatar storage during account deletion:", err);
    return { error: "SYSTEM FAILURE: FAILED TO CLEAN UP AVATAR FILES." };
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
export async function changePassword(currentPassword: unknown, newPassword: unknown) {
  const parsedCurrent = currentPasswordSchema.safeParse(currentPassword);
  if (!parsedCurrent.success) return { error: firstIssueMessage(parsedCurrent.error) };

  const parsedNew = newPasswordSchema.safeParse(newPassword);
  if (!parsedNew.success) return { error: firstIssueMessage(parsedNew.error) };

  const supabase = await createClient();

  // Verify existence of session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify current password
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: parsedCurrent.data,
  });

  if (loginError) {
    return { error: "CURRENT PASSWORD IS INCORRECT." };
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: parsedNew.data,
  });

  if (updateError) {
    return { error: updateError.message.toUpperCase() };
  }

  return { success: true };
}

/**
 * Update Bio
 */
export async function updateBio(bio: unknown) {
  const parsed = bioSchema.safeParse(bio);
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ bio: parsed.data })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/profile");
}

/**
 * Server Action: Update Avatar Path
 * Validates the storage path prefix and updates the profile's avatar URL.
 */
export async function updateAvatarPath(path: unknown) {
  const parsed = avatarPathSchema.safeParse(path);
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const validPath = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Validate the path starts with the user's ID — security/ownership check, not a schema concern
  if (!validPath.startsWith(`${user.id}-`)) {
    return { error: "Unauthorized path prefix." };
  }

  try {
    // Read current avatar_url to clean it up afterwards
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    // Derive public URL server-side
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(validPath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (updateError) throw updateError;

    // Cleanup old avatar object securely
    if (profile?.avatar_url) {
      const oldPath = extractAvatarPath(profile.avatar_url, user.id);
      if (oldPath && oldPath !== validPath) {
        const { error: removeError } = await supabaseAdmin.storage.from("avatars").remove([oldPath]);
        if (removeError) {
          console.error("Failed to cleanup old avatar:", removeError);
          // Do not fail the request, the new avatar is successfully saved
        }
      }
    }

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
 * Zero external payload — no schema needed.
 */
export async function removeAvatarUrl() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", user.id);

    if (updateError) throw updateError;

    // Cleanup old avatar object securely
    if (profile?.avatar_url) {
      const oldPath = extractAvatarPath(profile.avatar_url, user.id);
      if (oldPath) {
        const { error: removeError } = await supabaseAdmin.storage.from("avatars").remove([oldPath]);
        if (removeError) {
          console.error("Failed to cleanup avatar on removal:", removeError);
        }
      }
    }

    revalidatePath("/settings");
    revalidatePath("/profile");

    return { success: true };
  } catch (err: unknown) {
    console.error("removeAvatarUrl error:", err);
    return { error: err instanceof Error ? err.message : "Failed to remove avatar." };
  }
}
