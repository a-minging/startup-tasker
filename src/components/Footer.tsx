"use client";

import { useState, useEffect } from "react";

const FEEDBACK_EMAIL = "1163561479@qq.com";

export default function Footer() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(FEEDBACK_EMAIL);
      setToastMessage("邮箱已复制！");
      setShowToast(true);
    } catch {
      setToastMessage("复制失败，请手动复制");
      setShowToast(true);
    }
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="text-sm text-gray-500">
          © {new Date().getFullYear()} StartupTasker. 不知道写什么反正空着不好看，无聊给我发邮件吧→
        </div>
        <div className="flex items-center gap-4 text-sm relative">
          <button
            onClick={handleCopyEmail}
            className="text-blue-600 hover:text-blue-800 transition-colors font-medium cursor-pointer"
          >
            📧 我要反馈
          </button>
          {showToast && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white px-3 py-1.5 rounded-lg shadow-lg border border-gray-200 text-sm text-gray-700 whitespace-nowrap animate-pulse">
              {toastMessage}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
