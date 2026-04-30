// ===========================================
// ジャンル別プロンプトプリセット
// ===========================================
// 各ジャンルに最適化されたプロンプト設定

import type { Genre, LightingStyle } from '@/types/storyboard';

export interface GenrePreset {
  // ジャンル名
  name: string;
  // 説明
  description: string;
  // 照明スタイル（優先順）
  lighting: LightingStyle[];
  // カメラスタイル説明
  cameraStyle: string;
  // カラートーン（Hex）
  colorTones: string[];
  // プロンプトキーワード
  keywords: string[];
  // 推奨BGMスタイル
  musicStyle: string;
  // 追加のスタイル修飾子
  styleModifiers: string[];
  // ネガティブプロンプト追加要素
  negativeAdditions: string[];
}

// ===========================================
// ジャンルプリセット定義
// ===========================================
export const genrePresets: Record<Genre, GenrePreset> = {
  // -----------------------------------------
  // シネマティック
  // -----------------------------------------
  cinematic: {
    name: 'Cinematic',
    description: '映画的な美学、ドラマチックな照明と構図',
    lighting: ['dramatic', 'natural', 'golden-hour'],
    cameraStyle: 'anamorphic lens, shallow depth of field, cinematic framing',
    colorTones: ['#1a1a2e', '#16213e', '#0f4c75', '#bbe1fa'],
    keywords: [
      'cinematic',
      '35mm film',
      'movie quality',
      'professional lighting',
      'theatrical',
    ],
    musicStyle: 'オーケストラ、アンビエント、映画音楽',
    styleModifiers: [
      'film grain',
      'lens flare',
      'volumetric lighting',
      'color graded',
    ],
    negativeAdditions: ['amateur', 'home video', 'low budget'],
  },

  // -----------------------------------------
  // ドキュメンタリー
  // -----------------------------------------
  documentary: {
    name: 'Documentary',
    description: '自然でリアルな映像、観察的なアプローチ',
    lighting: ['natural', 'soft', 'high-key'],
    cameraStyle: 'handheld, observational, intimate framing',
    colorTones: ['#2d3436', '#636e72', '#b2bec3', '#dfe6e9'],
    keywords: [
      'documentary style',
      'authentic',
      'natural light',
      'candid',
      'real',
    ],
    musicStyle: 'ミニマル、アコースティック、環境音',
    styleModifiers: [
      'realistic',
      'unstaged',
      'genuine moments',
      'available light',
    ],
    negativeAdditions: ['staged', 'artificial', 'over-produced'],
  },

  // -----------------------------------------
  // コマーシャル
  // -----------------------------------------
  commercial: {
    name: 'Commercial',
    description: 'プロフェッショナルで洗練された広告映像',
    lighting: ['high-key', 'soft', 'natural'],
    cameraStyle: 'clean compositions, product-focused, polished',
    colorTones: ['#ffffff', '#f5f5f5', '#00b894', '#0984e3'],
    keywords: [
      'commercial',
      'clean',
      'professional',
      'polished',
      'premium',
    ],
    musicStyle: 'アップビート、モダン、ブランド向け',
    styleModifiers: [
      'high production value',
      'crisp',
      'vibrant colors',
      'perfect lighting',
    ],
    negativeAdditions: ['dirty', 'grungy', 'dark', 'moody'],
  },

  // -----------------------------------------
  // ミュージックビデオ
  // -----------------------------------------
  'music-video': {
    name: 'Music Video',
    description: 'スタイリッシュでダイナミックな映像表現',
    lighting: ['neon', 'dramatic', 'low-key'],
    cameraStyle: 'dynamic movements, stylized, rhythmic editing',
    colorTones: ['#6c5ce7', '#fd79a8', '#00cec9', '#fdcb6e'],
    keywords: [
      'music video',
      'stylized',
      'vibrant',
      'dynamic',
      'artistic',
    ],
    musicStyle: 'アーティストのジャンルに合わせる',
    styleModifiers: [
      'high contrast',
      'saturated colors',
      'creative lighting',
      'visual effects',
    ],
    negativeAdditions: ['boring', 'static', 'plain'],
  },

  // -----------------------------------------
  // ホラー
  // -----------------------------------------
  horror: {
    name: 'Horror',
    description: '不安感を煽る暗い雰囲気と緊張感',
    lighting: ['low-key', 'silhouette', 'harsh'],
    cameraStyle: 'unsettling angles, slow movements, confined framing',
    colorTones: ['#0a0a0a', '#1a1a1a', '#2d3436', '#b71540'],
    keywords: [
      'horror',
      'dark',
      'atmospheric',
      'unsettling',
      'ominous',
    ],
    musicStyle: 'ドローン、不協和音、静寂の活用',
    styleModifiers: [
      'deep shadows',
      'desaturated',
      'film noir',
      'gritty',
    ],
    negativeAdditions: ['bright', 'cheerful', 'colorful', 'happy'],
  },

  // -----------------------------------------
  // SF
  // -----------------------------------------
  'sci-fi': {
    name: 'Sci-Fi',
    description: '未来的なビジュアルとハイテクな雰囲気',
    lighting: ['neon', 'dramatic', 'blue-hour'],
    cameraStyle: 'futuristic, clean lines, technological aesthetic',
    colorTones: ['#0c0c1e', '#1a1a3e', '#00d4ff', '#7c3aed'],
    keywords: [
      'sci-fi',
      'futuristic',
      'high-tech',
      'sleek',
      'cyberpunk',
    ],
    musicStyle: 'エレクトロニック、シンセウェーブ、アンビエント',
    styleModifiers: [
      'holographic',
      'chrome',
      'LED lighting',
      'digital effects',
    ],
    negativeAdditions: ['old-fashioned', 'rustic', 'natural', 'organic'],
  },

  // -----------------------------------------
  // ドラマ
  // -----------------------------------------
  drama: {
    name: 'Drama',
    description: '感情的で親密なキャラクター中心の映像',
    lighting: ['natural', 'golden-hour', 'soft'],
    cameraStyle: 'intimate, character-focused, emotional framing',
    colorTones: ['#2c3e50', '#34495e', '#e74c3c', '#f39c12'],
    keywords: [
      'dramatic',
      'emotional',
      'intimate',
      'character-driven',
      'heartfelt',
    ],
    musicStyle: 'ピアノ、ストリングス、感情的なスコア',
    styleModifiers: [
      'warm tones',
      'soft focus',
      'natural skin tones',
      'expressive',
    ],
    negativeAdditions: ['cold', 'detached', 'impersonal'],
  },

  // -----------------------------------------
  // アクション
  // -----------------------------------------
  action: {
    name: 'Action',
    description: 'ダイナミックで高エネルギーな映像',
    lighting: ['dramatic', 'harsh', 'high-key'],
    cameraStyle: 'dynamic, fast cuts, impact-focused',
    colorTones: ['#2c3e50', '#e74c3c', '#f39c12', '#1abc9c'],
    keywords: [
      'action',
      'dynamic',
      'intense',
      'high energy',
      'powerful',
    ],
    musicStyle: 'パーカッシブ、エピック、ハイテンポ',
    styleModifiers: [
      'motion blur',
      'high contrast',
      'sharp',
      'explosive',
    ],
    negativeAdditions: ['slow', 'calm', 'peaceful', 'static'],
  },

  // -----------------------------------------
  // ロマンス
  // -----------------------------------------
  romance: {
    name: 'Romance',
    description: '柔らかく温かみのあるロマンチックな映像',
    lighting: ['golden-hour', 'soft', 'natural'],
    cameraStyle: 'dreamy, soft focus, intimate distance',
    colorTones: ['#fdcb6e', '#e17055', '#fab1a0', '#ffeaa7'],
    keywords: [
      'romantic',
      'soft',
      'warm',
      'dreamy',
      'tender',
    ],
    musicStyle: 'アコースティック、ソフトポップ、ピアノ',
    styleModifiers: [
      'soft glow',
      'warm tones',
      'bokeh',
      'gentle lighting',
    ],
    negativeAdditions: ['harsh', 'cold', 'aggressive', 'dark'],
  },

  // -----------------------------------------
  // コメディ
  // -----------------------------------------
  comedy: {
    name: 'Comedy',
    description: '明るく開放的な楽しい映像',
    lighting: ['high-key', 'natural', 'soft'],
    cameraStyle: 'bright, open compositions, comedic timing',
    colorTones: ['#ffeaa7', '#74b9ff', '#55efc4', '#fd79a8'],
    keywords: [
      'bright',
      'cheerful',
      'vibrant',
      'fun',
      'lively',
    ],
    musicStyle: '軽快、アップビート、コミカル',
    styleModifiers: [
      'saturated colors',
      'clear',
      'bright exposure',
      'playful',
    ],
    negativeAdditions: ['dark', 'moody', 'serious', 'gloomy'],
  },

  // -----------------------------------------
  // 実験的
  // -----------------------------------------
  experimental: {
    name: 'Experimental',
    description: '従来の枠を超えた実験的な映像表現',
    lighting: ['neon', 'silhouette', 'dramatic'],
    cameraStyle: 'unconventional, abstract, rule-breaking',
    colorTones: ['#6c5ce7', '#00cec9', '#fd79a8', '#ffeaa7'],
    keywords: [
      'experimental',
      'artistic',
      'abstract',
      'unconventional',
      'avant-garde',
    ],
    musicStyle: '実験的、アンビエント、ノイズ',
    styleModifiers: [
      'distorted',
      'surreal',
      'mixed media',
      'unique perspective',
    ],
    negativeAdditions: ['conventional', 'traditional', 'predictable'],
  },
};

// ===========================================
// プリセット取得関数
// ===========================================
export function getGenrePreset(genre: Genre): GenrePreset {
  return genrePresets[genre] || genrePresets.cinematic;
}

// ===========================================
// プリセットからプロンプトキーワードを生成
// ===========================================
export function buildStyleKeywords(genre: Genre): string {
  const preset = getGenrePreset(genre);
  return [...preset.keywords, ...preset.styleModifiers].join(', ');
}

// ===========================================
// ネガティブプロンプトを生成
// ===========================================
export function buildNegativePrompt(genre: Genre, base: string): string {
  const preset = getGenrePreset(genre);
  const additions = preset.negativeAdditions.join(', ');
  return `${base}, ${additions}`;
}
