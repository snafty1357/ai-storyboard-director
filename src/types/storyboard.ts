// AI動画ストーリーボード・ディレクター・システム 型定義

export type Genre =
  | 'cinematic'
  | 'documentary'
  | 'commercial'
  | 'music-video'
  | 'horror'
  | 'sci-fi'
  | 'drama'
  | 'action'
  | 'romance'
  | 'comedy'
  | 'experimental';

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '21:9';

export type CameraMovement =
  | 'static'
  | 'pan-left'
  | 'pan-right'
  | 'tilt-up'
  | 'tilt-down'
  | 'dolly-in'
  | 'dolly-out'
  | 'tracking'
  | 'crane-up'
  | 'crane-down'
  | 'handheld'
  | 'orbit';

export type ShotType =
  | 'extreme-wide'
  | 'wide'
  | 'medium-wide'
  | 'medium'
  | 'medium-close'
  | 'close-up'
  | 'extreme-close-up'
  | 'over-shoulder'
  | 'pov';

export type LightingStyle =
  | 'natural'
  | 'golden-hour'
  | 'blue-hour'
  | 'high-key'
  | 'low-key'
  | 'silhouette'
  | 'neon'
  | 'dramatic'
  | 'soft'
  | 'harsh';

// キャラクター設定
export interface Character {
  name: string;              // キャラクター名
  appearance: string;        // 外見の説明
  clothing: string;          // 服装
  age?: string;              // 年齢
  role?: string;             // 役割（主人公、脇役など）
}

// 参照画像
export interface ReferenceImage {
  url: string;               // 画像URL（base64またはURL）
  description?: string;      // 画像の説明
}

// ユーザー入力
export interface StoryboardInput {
  concept: string;           // メインコンセプト（必須）
  genre?: Genre;             // ジャンル
  mood?: string;             // 雰囲気（例: mysterious, uplifting）
  aspectRatio?: AspectRatio; // アスペクト比
  additionalNotes?: string;  // 追加の指示
  characters?: Character[];  // 登場人物
  referenceImages?: ReferenceImage[]; // 参照画像
}

// 5秒ショット
export interface Shot {
  timeRange: string;         // "0-5s" | "5-10s" | "10-15s"
  beatName: string;          // Setup | Escalation | Hook
  action: string;            // アクション説明
  cameraMovement: CameraMovement;
  shotType: ShotType;
  lighting: LightingStyle;
  description: string;       // 詳細説明
}

// GPT Image 2 キーフレームプロンプト
export interface KeyframePrompt {
  shotNumber: number;        // 1, 2, 3
  prompt: string;            // 画像生成プロンプト（英語）
  negativeElements: string[]; // 排除要素
}

// 一貫性ロック
export interface IdentityLock {
  subject: string;           // 被写体の固定記述
  costume: string;           // 衣装/外観の固定
  colorPalette: string[];    // カラーパレット（3-5色）
  environment: string;       // 環境/背景の固定
}

// 8項目の完全な出力
export interface StoryboardOutput {
  // 1. クリエイティブな解釈
  creativeInterpretation: string;

  // 2. 15秒ショットプラン
  shotPlan: Shot[];

  // 3. GPT Image 2 キーフレームプロンプト
  keyframePrompts: KeyframePrompt[];

  // 4. ストーリーボードシートプロンプト（オプション）
  storyboardSheetPrompt: string;

  // 5. SEEDANCE 2.0 最終ビデオプロンプト
  seedancePrompt: string;

  // 6. 一貫性ロック
  identityLock: IdentityLock;

  // 7. 肯定的な制約
  positiveConstraints: string[];

  // 8. アドバイス/推奨事項
  recommendations: string[];
}

// アーキタイプ変換（著作権保護）
export interface ArchetypeConversion {
  original: string;
  converted: string;
  reason: string;
}

// 履歴エントリ
export interface HistoryEntry {
  id: string;
  timestamp: number;
  input: StoryboardInput;
  output: StoryboardOutput;
  generatedImages?: { url: string; prompt: string }[];
  generatedVideo?: string;
}
