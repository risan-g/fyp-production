"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ReviewFormProps {
  albumId: string;
}

export default function ReviewForm({ albumId }: ReviewFormProps) {
  return <div className="bg-red-900 rounded-lg p-4"></div>;
}
