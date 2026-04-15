"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";

export function useAuth() {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
    }
  }, [router]);
}

export function useAdminAuth() {
  const router = useRouter();
  const { isAdmin, isLoggedIn } = require("@/lib/auth");
  const toast = require("react-hot-toast").default;

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
    } else if (!isAdmin()) {
      toast.error("Access denied. Admin only.");
      router.replace("/dashboard");
    }
  }, [router]);
}
