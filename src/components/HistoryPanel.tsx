'use client';

import type { HistoryEntry } from '@/types/storyboard';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  historySearch: string;
  onHistorySearchChange: (value: string) => void;
  onLoadEntry: (entry: HistoryEntry) => void;
  onDeleteEntry: (id: string) => void;
  filteredHistory: HistoryEntry[];
}

export function HistoryPanel({
  isOpen,
  onClose,
  history,
  historySearch,
  onHistorySearchChange,
  onLoadEntry,
  onDeleteEntry,
  filteredHistory,
}: HistoryPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#141420] rounded-xl border border-[#2a2a3a] w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a3a]">
          <h2 className="text-lg font-medium text-white">履歴</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#2a2a3a] rounded transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3">
          <input
            type="text"
            value={historySearch}
            onChange={(e) => onHistorySearchChange(e.target.value)}
            placeholder="ID または コンセプトで検索..."
            className="w-full bg-[#0d0d12] border border-[#2a2a3a] rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {history.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              合計 {history.length} 件 / 累計コスト ${history.reduce((sum, e) => sum + (e.cost?.total || 0), 0).toFixed(3)}
            </p>
          )}
        </div>

        {/* History List */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-140px)]">
          {history.length === 0 ? (
            <p className="text-center text-gray-500 py-8">履歴がありません</p>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((entry) => (
                <HistoryEntryCard
                  key={entry.id}
                  entry={entry}
                  onLoad={() => onLoadEntry(entry)}
                  onDelete={() => onDeleteEntry(entry.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface HistoryEntryCardProps {
  entry: HistoryEntry;
  onLoad: () => void;
  onDelete: () => void;
}

function HistoryEntryCard({ entry, onLoad, onDelete }: HistoryEntryCardProps) {
  return (
    <div className="bg-[#0d0d12] border border-[#2a2a3a] rounded-lg p-4 hover:border-indigo-500/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Tags */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono text-gray-500 bg-[#1a1a2a] px-1.5 py-0.5 rounded">
              ID: {entry.id}
            </span>
            {entry.collageResult && (
              <span className="text-[10px] px-1.5 py-0.5 bg-purple-600/20 text-purple-400 rounded">
                コラージュ
              </span>
            )}
            {entry.generatedImages && entry.generatedImages.filter((i) => i.url).length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-indigo-600/20 text-indigo-400 rounded">
                キーフレーム×{entry.generatedImages.filter((i) => i.url).length}
              </span>
            )}
            {entry.generatedVideo && (
              <span className="text-[10px] px-1.5 py-0.5 bg-pink-600/20 text-pink-400 rounded">
                動画
              </span>
            )}
          </div>

          {/* Concept */}
          <p className="text-sm text-white truncate mb-1">
            {(entry.input?.concept || '(コンセプトなし)').slice(0, 50)}...
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
            <span>{new Date(entry.timestamp).toLocaleString('ja-JP')}</span>
            <span>|</span>
            <span>{entry.input?.aspectRatio || '16:9'}</span>
            {entry.cost && (
              <>
                <span>|</span>
                <span
                  className="text-amber-400 font-mono"
                  title={`内訳: コラージュ$${entry.cost.collage.toFixed(3)} / 分析$${entry.cost.collageAnalysis.toFixed(3)} / キーフレーム$${entry.cost.keyframes.toFixed(3)} / SDプロンプト$${entry.cost.seedancePrompt.toFixed(3)} / 動画$${entry.cost.video.toFixed(3)}`}
                >
                  ${entry.cost.total.toFixed(3)}
                </span>
              </>
            )}
            {entry.durations && (entry.durations.totalMs ?? 0) > 0 && (
              <>
                <span>|</span>
                <span
                  className="text-cyan-400 font-mono"
                  title={`コラージュ: ${((entry.durations.collageMs || 0) / 1000).toFixed(1)}s / 分析: ${((entry.durations.analysisMs || 0) / 1000).toFixed(1)}s / 動画: ${((entry.durations.videoMs || 0) / 1000).toFixed(1)}s`}
                >
                  ⏱ {((entry.durations.totalMs || 0) / 1000).toFixed(1)}s
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onLoad}
            className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors"
          >
            読み込み
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1.5 text-xs bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors"
          >
            削除
          </button>
        </div>
      </div>

      {/* Thumbnails */}
      {entry.generatedImages && entry.generatedImages.length > 0 && (
        <div className="flex gap-2 mt-3">
          {entry.generatedImages.slice(0, 3).map((img, idx) => (
            img.url && (
              <img
                key={idx}
                src={img.url}
                alt={`Thumbnail ${idx + 1}`}
                className="w-16 h-16 object-cover rounded border border-[#2a2a3a]"
              />
            )
          ))}
        </div>
      )}
    </div>
  );
}
