'use client';

import { useState, useEffect } from 'react';

interface APIStatus {
  openai: {
    configured: boolean;
    keyPreview: string | null;
  };
  fal: {
    configured: boolean;
    keyPreview: string | null;
    description: string;
  };
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [status, setStatus] = useState<APIStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch API status:', error);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#141420] border border-[#2a2a3a] rounded-xl w-full max-w-lg mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a3a]">
          <h2 className="text-lg font-semibold text-white">API Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-400 mt-3 text-sm">Loading...</p>
            </div>
          ) : (
            <>
              {/* OpenAI / GPT Image 2 */}
              <div className="bg-[#0d0d12] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <span className="text-emerald-400 font-bold text-sm">GPT</span>
                    </div>
                    <div>
                      <h3 className="text-white font-medium">GPT Image 2 (OpenAI)</h3>
                      <p className="text-xs text-gray-500">キーフレーム画像生成</p>
                    </div>
                  </div>
                  <StatusBadge configured={status?.openai.configured || false} />
                </div>
                {status?.openai.configured ? (
                  <p className="text-xs text-gray-400 font-mono bg-[#1a1a2a] px-3 py-2 rounded">
                    {status.openai.keyPreview}
                  </p>
                ) : (
                  <p className="text-xs text-amber-400">
                    .env.local に OPENAI_API_KEY を設定してください
                  </p>
                )}
              </div>

              {/* fal.ai / Seedance 2.0 */}
              <div className="bg-[#0d0d12] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <span className="text-purple-400 font-bold text-sm">fal</span>
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Seedance 2.0</h3>
                      <p className="text-xs text-gray-500">via fal.ai - AI動画生成</p>
                    </div>
                  </div>
                  <StatusBadge configured={status?.fal.configured || false} />
                </div>
                {status?.fal.configured ? (
                  <p className="text-xs text-gray-400 font-mono bg-[#1a1a2a] px-3 py-2 rounded">
                    {status.fal.keyPreview}
                  </p>
                ) : (
                  <p className="text-xs text-amber-400">
                    .env.local に FAL_KEY を設定してください
                  </p>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-lg p-4">
                <h4 className="text-sm font-medium text-indigo-300 mb-2">設定方法</h4>
                <ol className="text-xs text-gray-400 space-y-1.5 list-decimal list-inside">
                  <li>
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-indigo-300 hover:underline">
                      OpenAI
                    </a> からAPIキーを取得
                  </li>
                  <li>
                    <a href="https://fal.ai/dashboard/keys" target="_blank" rel="noopener noreferrer" className="text-indigo-300 hover:underline">
                      fal.ai
                    </a> からAPIキーを取得
                  </li>
                  <li>プロジェクトルートの <code className="text-indigo-300">.env.local</code> を編集</li>
                  <li>開発サーバーを再起動</li>
                </ol>
                <div className="mt-3 p-2 bg-[#0d0d12] rounded font-mono text-xs text-gray-300">
                  <p>OPENAI_API_KEY=sk-xxx...</p>
                  <p>FAL_KEY=xxx-xxx-xxx...</p>
                </div>
              </div>

              {/* fal.ai Models Info */}
              <div className="bg-[#0d0d12] rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">利用可能なモデル (fal.ai)</h4>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• <span className="text-gray-300">fal-ai/seedance</span> - Seedance 1.0</li>
                  <li>• <span className="text-gray-300">fal-ai/seedance-v2</span> - Seedance 2.0</li>
                  <li>• <span className="text-gray-300">fal-ai/kling-video</span> - Kling AI (代替)</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-5 border-t border-[#2a2a3a]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2a2a3a] hover:bg-[#3a3a4a] text-white rounded-lg transition-colors text-sm"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ configured }: { configured: boolean }) {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        configured
          ? 'bg-green-500/20 text-green-400'
          : 'bg-red-500/20 text-red-400'
      }`}
    >
      {configured ? 'Connected' : 'Not Set'}
    </span>
  );
}
