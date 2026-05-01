'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#141420] border border-[#2a2a3a] rounded-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">エラーが発生しました</h2>
        <p className="text-gray-400 text-sm mb-6">
          予期せぬエラーが発生しました。問題が解決しない場合は、ブラウザのキャッシュをクリアしてください。
        </p>

        {error.message && (
          <div className="bg-[#0d0d12] border border-[#2a2a3a] rounded-lg p-3 mb-6 text-left">
            <p className="text-xs text-gray-500 mb-1">エラー詳細:</p>
            <p className="text-xs text-red-400 font-mono break-all">{error.message}</p>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors text-sm font-medium"
          >
            再試行
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="px-6 py-2.5 bg-[#2a2a3a] text-gray-300 rounded-lg hover:bg-[#3a3a4a] transition-colors text-sm font-medium"
          >
            キャッシュクリア
          </button>
        </div>

        <p className="text-xs text-gray-600 mt-6">
          問題が続く場合は、シークレットモードでお試しください
        </p>
      </div>
    </div>
  );
}
