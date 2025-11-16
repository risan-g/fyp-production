"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface ReviewListProps {
  albumId: string;
}

export default function ReviewList({ albumId }: ReviewListProps) {
  return <div className="bg-blue-900 rounded-lg p-4"></div>;
}
