'use client';

import { StoryboardOutput } from '@/types/storyboard';

interface StoryboardPreviewProps {
  output: StoryboardOutput;
  title: string;
  genre: string;
  tagline?: string;
}

// ストーリーボードプレビュー (shotPlan の枚数に応じて可変)
export function StoryboardPreview({ output, title, genre, tagline }: StoryboardPreviewProps) {
  const panels = output.shotPlan.map((shot, idx) => ({
    number: String(idx + 1).padStart(2, '0'),
    title: shot.beatName.toUpperCase(),
    subtitle: shot.action.slice(0, 60),
    camera: `CAMERA: ${shot.cameraMovement} / ${shot.shotType}. ${shot.description}`,
  }));

  // パネル数に応じてグリッド列数を調整
  const colsClass =
    panels.length <= 2
      ? 'grid-cols-2'
      : panels.length === 3
      ? 'grid-cols-3'
      : panels.length === 4
      ? 'grid-cols-2'
      : panels.length <= 6
      ? 'grid-cols-3'
      : panels.length <= 9
      ? 'grid-cols-3'
      : 'grid-cols-4';

  return (
    <div className="bg-black rounded-lg overflow-hidden shadow-2xl">
      {/* ヘッダー */}
      <div className="text-center py-8 px-6">
        <h2 className="text-2xl font-light tracking-[0.3em] text-white uppercase mb-2">
          {title.toUpperCase()} — TEASER STORYBOARD
        </h2>
        <p className="text-sm text-gray-500 tracking-widest italic">
          Genre: {genre} · {panels.length} shots
        </p>
      </div>

      {/* パネルグリッド */}
      <div className={`grid ${colsClass} gap-1 px-1`}>
        {panels.map((panel, idx) => (
          <div key={idx} className="relative group">
            {/* パネル番号 */}
            <div className="absolute top-3 left-3 z-20">
              <span className="text-lg font-light text-white/80 tracking-wider">
                {panel.number}
              </span>
            </div>

            {/* 画像エリア */}
            <div className="aspect-[16/10] relative overflow-hidden">
              {/* グラデーション背景（シネマティック風） */}
              <div
                className="absolute inset-0"
                style={{
                  background: idx % 2 === 0
                    ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f1a 100%)'
                    : 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
                }}
              >
                {/* 中央のプレースホルダー */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center opacity-40">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full border border-white/20 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-xs text-white/30 tracking-wider">Panel {idx + 1}</p>
                  </div>
                </div>
              </div>
              {/* シネマティックなオーバーレイ */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            </div>

            {/* パネル情報 */}
            <div className="bg-black px-3 py-3">
              <h3 className="text-xs font-medium text-white tracking-wide uppercase leading-tight">
                {panel.title}
              </h3>
              <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">
                {panel.camera}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* タグライン */}
      <div className="text-center py-8 px-6">
        <p className="text-base italic text-gray-400 tracking-wide">
          &ldquo;{tagline || 'Every frame tells a story.'}&rdquo;
        </p>
      </div>

      {/* フッター（オプション） */}
      <div className="flex items-center justify-end px-4 py-2 opacity-40">
        <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
    </div>
  );
}

// シンプルパネル版 (shotPlan の枚数に応じて可変)
export function StoryboardPreview3Panel({ output, title, genre, tagline }: StoryboardPreviewProps) {
  const panels = output.shotPlan.map((shot, idx) => ({
    number: String(idx + 1).padStart(2, '0'),
    timeRange: shot.timeRange,
    title: shot.beatName.toUpperCase(),
    action: shot.action,
    camera: `CAMERA: ${shot.cameraMovement} / ${shot.shotType}. ${shot.description}`,
    lighting: shot.lighting,
  }));

  const colors = [
    { bg: 'from-blue-900/30 to-indigo-900/20', accent: '#3b82f6' },
    { bg: 'from-purple-900/30 to-violet-900/20', accent: '#8b5cf6' },
    { bg: 'from-pink-900/30 to-rose-900/20', accent: '#ec4899' },
    { bg: 'from-amber-900/30 to-orange-900/20', accent: '#f59e0b' },
    { bg: 'from-emerald-900/30 to-teal-900/20', accent: '#10b981' },
    { bg: 'from-cyan-900/30 to-sky-900/20', accent: '#06b6d4' },
  ];
  const getColor = (idx: number) => colors[idx % colors.length];

  const colsClass =
    panels.length <= 2
      ? 'grid-cols-2'
      : panels.length === 3
      ? 'grid-cols-3'
      : panels.length === 4
      ? 'grid-cols-2'
      : panels.length <= 6
      ? 'grid-cols-3'
      : panels.length <= 9
      ? 'grid-cols-3'
      : 'grid-cols-4';

  return (
    <div className="bg-black rounded-lg overflow-hidden shadow-2xl">
      {/* ヘッダー */}
      <div className="text-center py-6 px-6 border-b border-white/5">
        <h2 className="text-xl font-light tracking-[0.25em] text-white uppercase">
          {title.toUpperCase()}
        </h2>
        <p className="text-xs text-gray-500 mt-2 tracking-widest">
          {genre} | 15 SECONDS | {panels.length} SHOTS
        </p>
      </div>

      {/* パネルグリッド */}
      <div className={`grid ${colsClass} gap-[1px] bg-white/5`}>
        {panels.map((panel, idx) => (
          <div key={idx} className="bg-black relative">
            {/* パネル番号とタイムレンジ */}
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between">
              <span className="text-lg font-light text-white/70 tracking-wider">
                {panel.number}
              </span>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded"
                style={{
                  backgroundColor: `${getColor(idx).accent}20`,
                  color: getColor(idx).accent
                }}
              >
                {panel.timeRange}
              </span>
            </div>

            {/* 画像エリア */}
            <div className="aspect-video relative overflow-hidden">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${getColor(idx).bg}`}
              >
                {/* プレースホルダー */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-14 h-14 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${getColor(idx).accent}30` }}
                  >
                    <span
                      className="text-sm font-medium"
                      style={{ color: getColor(idx).accent }}
                    >
                      {idx + 1}
                    </span>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
            </div>

            {/* パネル情報 */}
            <div className="p-4 bg-[#0a0a0a]">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-medium tracking-wider"
                  style={{
                    backgroundColor: `${getColor(idx).accent}20`,
                    color: getColor(idx).accent
                  }}
                >
                  {panel.title}
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed mb-3 line-clamp-2">
                {panel.action}
              </p>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                {panel.camera}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* タグライン */}
      {tagline && (
        <div className="text-center py-6 border-t border-white/5">
          <p className="text-sm italic text-gray-400 tracking-wide">
            &ldquo;{tagline}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
