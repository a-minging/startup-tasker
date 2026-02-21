"use client";

import { useState, useEffect } from "react";

export default function Footer() {
  const [pageUrl, setPageUrl] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPageUrl(window.location.href);
      setCurrentTime(new Date().toLocaleString("zh-CN"));
    }
  }, []);

  const getMailtoLink = () => {
    const email = "1163561479@qq.com";
    const subject = "【用户反馈】来自 StartupTasker 的建议";
    const body = `请在此输入您的反馈内容：

---
页面 URL: ${pageUrl}
反馈时间: ${currentTime}
`;

    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="text-sm text-gray-500">
          © {new Date().getFullYear()} StartupTasker. All rights reserved.
        </div>
        <div className="flex items-center gap-4 text-sm">
          <a
            href="/privacy"
            className="text-gray-500 hover:text-blue-600 transition-colors"
          >
            隐私政策
          </a>
          <a
            href={getMailtoLink()}
            className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
          >
            我要反馈
          </a>
        </div>
      </div>
    </footer>
  );
}
