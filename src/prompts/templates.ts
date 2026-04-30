// ===========================================
// AI Storyboard Director - Prompt Templates
// ===========================================
// このファイルでプロンプトテンプレートをカスタマイズできます

export interface PromptTemplates {
  // GPT Image 2 用テンプレート
  gptImage: {
    keyframe: string;
    storyboardSheet: string;
    styleModifiers: string[];
    negativePrompt: string;
  };
  // Seedance 2.0 用テンプレート
  seedance: {
    videoGeneration: string;
    transitionPhrases: string[];
    styleConsistency: string;
  };
  // クリエイティブ解釈用
  interpretation: {
    template: string;
  };
  // ショットプラン用
  shotPlan: {
    setup: string;
    escalation: string;
    hook: string;
  };
}

// ===========================================
// デフォルトテンプレート
// ===========================================
export const defaultTemplates: PromptTemplates = {
  // -----------------------------------------
  // GPT Image 2 テンプレート
  // -----------------------------------------
  gptImage: {
    // キーフレーム画像生成プロンプト
    // 変数: {shotType}, {action}, {lighting}, {style}, {aspectRatio}
    keyframe: `{shotType} shot, {action}, {lighting} lighting, {style}, aspect ratio {aspectRatio}, photorealistic, cinematic composition, no text, no watermark, no UI elements, 8K resolution`,

    // ストーリーボードシート生成プロンプト
    // 変数: {genre}, {panelDescriptions}
    storyboardSheet: `Professional cinematic storyboard sheet, three horizontal panels arranged in a row, {genre} visual style, {panelDescriptions}, consistent visual style across all panels, no text labels, film production quality, clean composition, professional layout`,

    // スタイル修飾子（自動的に追加される）
    styleModifiers: [
      '35mm film grain',
      'anamorphic lens',
      'shallow depth of field',
      'cinematic color grading',
      'professional lighting',
      'high production value',
    ],

    // ネガティブプロンプト（除外要素）
    negativePrompt: `text, watermark, logo, UI elements, blurry, low quality, amateur, distorted, deformed, ugly, bad anatomy, bad proportions`,
  },

  // -----------------------------------------
  // Seedance 2.0 テンプレート
  // -----------------------------------------
  seedance: {
    // 動画生成メインプロンプト
    // 変数: {shot1}, {shot2}, {shot3}, {styleNote}
    videoGeneration: `{shot1} {shot2} {shot3} {styleNote}`,

    // ショット間のトランジションフレーズ
    transitionPhrases: [
      'Camera slowly',
      'Smoothly transitions to',
      'Seamlessly cuts to',
      'Gracefully moves to',
      'Final shot reveals',
    ],

    // スタイル一貫性の指示
    // 変数: {style}, {cameraStyle}
    styleConsistency: `Maintain consistent {style} aesthetic throughout with {cameraStyle}. Ensure smooth transitions between shots. Keep subject identity locked across all frames.`,
  },

  // -----------------------------------------
  // クリエイティブ解釈テンプレート
  // -----------------------------------------
  interpretation: {
    // 変数: {mood}, {concept}, {genre}
    template: `{mood}{concept}。{genre}な映像美で、視覚的な物語を15秒に凝縮する。各フレームが感情を語り、観る者を引き込む瞬間を創出する。`,
  },

  // -----------------------------------------
  // ショットプランテンプレート
  // -----------------------------------------
  shotPlan: {
    // Setup (0-5s) テンプレート
    // 変数: {environment}, {mood}
    setup: `{environment}のワイドショット。{mood}な雰囲気が画面を支配する。観客を物語の世界に引き込む。`,

    // Escalation (5-10s) テンプレート
    // 変数: {subject}, {action}
    escalation: `{subject}が{action}。動きと存在感が画面に緊張を生む。物語が動き始める。`,

    // Hook (10-15s) テンプレート
    // 変数: {subject}
    hook: `クライマックスの瞬間。{subject}の決定的な表情または動作。観客の記憶に刻まれる瞬間。`,
  },
};

// ===========================================
// テンプレート変数の置換関数
// ===========================================
export function applyTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

// ===========================================
// カスタムテンプレートのマージ
// ===========================================
export function mergeTemplates(
  base: PromptTemplates,
  custom: Partial<PromptTemplates>
): PromptTemplates {
  return {
    gptImage: { ...base.gptImage, ...custom.gptImage },
    seedance: { ...base.seedance, ...custom.seedance },
    interpretation: { ...base.interpretation, ...custom.interpretation },
    shotPlan: { ...base.shotPlan, ...custom.shotPlan },
  };
}
