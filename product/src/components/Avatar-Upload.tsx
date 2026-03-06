"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface AvatarProps {
  uid: string;
  url: string | null;
  size?: number;
  editable?: boolean;
  username: string;
}

export default function AvatarUpload({
  uid,
  url,
  size = 150,
  editable = false,
  username,
}: AvatarProps) {
  const supabase = createClient();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(url);

  useEffect(() => {
    setAvatarUrl(url);
  }, [url]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${uid}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", uid);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      router.refresh();
    } catch (error: any) {
      alert("Error uploading: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteAvatar = async () => {
    try {
      setUploading(true);
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", uid);

      if (error) throw error;
      setAvatarUrl(null);
      router.refresh();
    } catch (error: any) {
      alert("Error deleting: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="relative group mx-auto select-none z-20"
      style={{ width: size, height: size }}
    >
      {/* 1. Image Container */}
      <div className="w-full h-full rounded-full overflow-hidden bg-neutral-800 border-4 border-black shadow-2xl relative z-10">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className={`w-full h-full object-cover transition-opacity duration-300 ${uploading ? "opacity-50" : "opacity-100"
              }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-neutral-500 bg-neutral-900">
            {username[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <svg
            className="animate-spin h-8 w-8 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      )}

      {/* Action Buttons */}
      {editable && !uploading && (
        <>
          <label
            className={`
              absolute -top-2 -left-2 z-30 w-10 h-10 flex items-center justify-center 
              rounded-full cursor-pointer hover:scale-110 transition-all opacity-0 group-hover:opacity-100 shadow-xl border-2 border-black
              ${avatarUrl ? "bg-white text-black" : "bg-green-600 text-white"} 
            `}
            title={avatarUrl ? "Change Picture" : "Add Picture"}
          >
            {avatarUrl ? (
              // EDIT ICON
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                />
              </svg>
            ) : (
              // ADD IMAGE ICON
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            )}

            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={uploadAvatar}
              disabled={uploading}
            />
          </label>

          {/* DELETE BUTTON that only appears if profile pic exists */}
          {avatarUrl && (
            <button
              onClick={deleteAvatar}
              className="absolute -top-2 -right-2 z-30 w-10 h-10 flex items-center justify-center bg-red-600 text-white rounded-full cursor-pointer hover:bg-red-700 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 shadow-xl border-2 border-black"
              title="Remove Picture"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </button>
          )}
        </>
      )}
    </div>
  );
}
