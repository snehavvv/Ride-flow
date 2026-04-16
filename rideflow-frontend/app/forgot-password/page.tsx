import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] px-6">
      <div className="max-w-md w-full card-white p-10 text-center">
        <div className="w-16 h-16 bg-[#D1FAE5] rounded-2xl flex items-center justify-center text-[#10B981] mx-auto mb-6">
          <span className="text-2xl font-bold">?</span>
        </div>
        <h2 className="text-2xl font-bold text-[#111827]">Reset your password</h2>
        <p className="text-[#6B7280] text-sm mt-2 mb-8">Enter your email and we&apos;ll send you instructions to reset your password.</p>
        
        <form className="space-y-6">
          <input type="email" placeholder="name@example.com" className="input-base" required />
          <button type="submit" className="btn-primary w-full py-3.5">Send Instructions</button>
        </form>

        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[#6B7280] mt-8 hover:text-[#10B981] transition-colors">
          <ArrowLeft size={16} /> Back to Login
        </Link>
      </div>
    </div>
  );
}
