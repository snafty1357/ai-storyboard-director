// AI動画ストーリーボード・ディレクター プロンプト生成エンジン

import type {
  StoryboardInput,
  StoryboardOutput,
  Shot,
  KeyframePrompt,
  IdentityLock,
  Genre,
  CameraMovement,
  ShotType,
  LightingStyle,
} from '@/types/storyboard';

// ジャンル別のスタイルプリセット
const genrePresets: Record<Genre, {
  lighting: LightingStyle[];
  cameraStyle: string;
  colorTones: string[];
  keywords: string[];
}> = {
  cinematic: {
    lighting: ['dramatic', 'natural', 'golden-hour'],
    cameraStyle: 'anamorphic lens, shallow depth of field',
    colorTones: ['#1a1a2e', '#16213e', '#0f4c75', '#bbe1fa'],
    keywords: ['cinematic', '35mm film', 'movie quality', 'professional lighting'],
  },
  documentary: {
    lighting: ['natural', 'soft', 'high-key'],
    cameraStyle: 'handheld, observational',
    colorTones: ['#2d3436', '#636e72', '#b2bec3', '#dfe6e9'],
    keywords: ['documentary style', 'authentic', 'natural light', 'candid'],
  },
  commercial: {
    lighting: ['high-key', 'soft', 'natural'],
    cameraStyle: 'clean compositions, product-focused',
    colorTones: ['#ffffff', '#f5f5f5', '#00b894', '#0984e3'],
    keywords: ['commercial', 'clean', 'professional', 'polished'],
  },
  'music-video': {
    lighting: ['neon', 'dramatic', 'low-key'],
    cameraStyle: 'dynamic movements, stylized',
    colorTones: ['#6c5ce7', '#fd79a8', '#00cec9', '#fdcb6e'],
    keywords: ['music video', 'stylized', 'vibrant', 'dynamic'],
  },
  horror: {
    lighting: ['low-key', 'silhouette', 'harsh'],
    cameraStyle: 'unsettling angles, slow movements',
    colorTones: ['#0a0a0a', '#1a1a1a', '#2d3436', '#b71540'],
    keywords: ['horror', 'dark', 'atmospheric', 'unsettling'],
  },
  'sci-fi': {
    lighting: ['neon', 'dramatic', 'blue-hour'],
    cameraStyle: 'futuristic, clean lines',
    colorTones: ['#0c0c1e', '#1a1a3e', '#00d4ff', '#7c3aed'],
    keywords: ['sci-fi', 'futuristic', 'high-tech', 'sleek'],
  },
  drama: {
    lighting: ['natural', 'golden-hour', 'soft'],
    cameraStyle: 'intimate, character-focused',
    colorTones: ['#2c3e50', '#34495e', '#e74c3c', '#f39c12'],
    keywords: ['dramatic', 'emotional', 'intimate', 'character-driven'],
  },
  action: {
    lighting: ['dramatic', 'harsh', 'high-key'],
    cameraStyle: 'dynamic, fast cuts',
    colorTones: ['#2c3e50', '#e74c3c', '#f39c12', '#1abc9c'],
    keywords: ['action', 'dynamic', 'intense', 'high energy'],
  },
  romance: {
    lighting: ['golden-hour', 'soft', 'natural'],
    cameraStyle: 'dreamy, soft focus',
    colorTones: ['#fdcb6e', '#e17055', '#fab1a0', '#ffeaa7'],
    keywords: ['romantic', 'soft', 'warm', 'dreamy'],
  },
  comedy: {
    lighting: ['high-key', 'natural', 'soft'],
    cameraStyle: 'bright, open compositions',
    colorTones: ['#ffeaa7', '#74b9ff', '#55efc4', '#fd79a8'],
    keywords: ['bright', 'cheerful', 'vibrant', 'fun'],
  },
  experimental: {
    lighting: ['neon', 'silhouette', 'dramatic'],
    cameraStyle: 'unconventional, abstract',
    colorTones: ['#6c5ce7', '#00cec9', '#fd79a8', '#ffeaa7'],
    keywords: ['experimental', 'artistic', 'abstract', 'unconventional'],
  },
};

// カメラムーブメントの選択ロジック
function selectCameraMovements(genre: Genre, beatIndex: number): CameraMovement {
  const movements: Record<number, CameraMovement[]> = {
    0: ['dolly-in', 'crane-down', 'static'], // Setup: 確立ショット
    1: ['tracking', 'pan-left', 'pan-right', 'handheld'], // Escalation: 動き
    2: ['dolly-in', 'static', 'orbit'], // Hook: 集中
  };

  const options = movements[beatIndex] || movements[0];
  return options[Math.floor(Math.random() * options.length)];
}

// ショットタイプの選択ロジック
function selectShotTypes(beatIndex: number): ShotType {
  const types: Record<number, ShotType[]> = {
    0: ['extreme-wide', 'wide', 'medium-wide'], // Setup
    1: ['medium', 'medium-close', 'over-shoulder'], // Escalation
    2: ['close-up', 'extreme-close-up', 'medium-close'], // Hook
  };

  const options = types[beatIndex] || types[0];
  return options[Math.floor(Math.random() * options.length)];
}

// 著作権保護：有名人・キャラクター名をアーキタイプに変換
function convertToArchetype(text: string): string {
  const conversions: Record<string, string> = {
    // 俳優名 → アーキタイプ
    'トム・クルーズ': '鋭い眼光を持つ中年の男性、アクションヒーロー風',
    'ブラッド・ピット': '端正な顔立ちの金髪の男性、カリスマ的な雰囲気',
    'レオナルド・ディカプリオ': '知的な表情の青い目の男性',
    'スカーレット・ヨハンソン': '神秘的な雰囲気を持つ金髪の女性',
    'ジョニー・デップ': '個性的な風貌の男性、ボヘミアンな雰囲気',
    'アンジェリーナ・ジョリー': '力強い美しさを持つ女性、印象的な唇',
    // キャラクター名 → アーキタイプ
    'スパイダーマン': '俊敏な若者、赤と青のコスチューム風の服装',
    'バットマン': '黒いコートを着た謎めいた男性、夜の守護者',
    'アイアンマン': 'ハイテク装備の天才発明家風の男性',
    'ジョーカー': '不気味な笑みを浮かべる男性、緑と紫のカラースキーム',
  };

  let result = text;
  for (const [original, archetype] of Object.entries(conversions)) {
    if (text.includes(original)) {
      result = result.replace(original, archetype);
    }
  }
  return result;
}

// コンセプトからキーワードを抽出
function extractKeywords(concept: string): {
  subject: string;
  environment: string;
  mood: string;
  action: string;
} {
  // 簡易的なキーワード抽出（実際のプロダクションではNLPを使用）
  const subject = concept.match(/(男性|女性|子供|老人|探偵|戦士|科学者|アーティスト|ビジネスマン|主人公)/)?.[0] || '人物';
  const environment = concept.match(/(都市|森|海|山|オフィス|家|路地|ビル|空港|駅|部屋)/)?.[0] || '都市';
  const mood = concept.match(/(緊張|静か|激しい|穏やか|不気味|明るい|暗い|神秘的|ロマンチック)/)?.[0] || '印象的';
  const action = concept.match(/(歩く|走る|見つめる|話す|戦う|探す|待つ|考える|振り返る)/)?.[0] || '存在する';

  return { subject, environment, mood, action };
}

// メインの生成関数
export function generateStoryboard(input: StoryboardInput): StoryboardOutput {
  const genre = input.genre || 'cinematic';
  const preset = genrePresets[genre];
  const safeConcept = convertToArchetype(input.concept);
  const keywords = extractKeywords(safeConcept);

  // 1. クリエイティブな解釈
  const creativeInterpretation = generateCreativeInterpretation(safeConcept, genre, input.mood);

  // 2. 15秒ショットプラン
  const shotPlan = generateShotPlan(safeConcept, genre, preset, keywords);

  // 3. GPT Image 2 キーフレームプロンプト
  const keyframePrompts = generateKeyframePrompts(shotPlan, preset, keywords, input.aspectRatio);

  // 4. ストーリーボードシートプロンプト
  const storyboardSheetPrompt = generateStoryboardSheetPrompt(shotPlan, genre);

  // 5. SEEDANCE 2.0 最終ビデオプロンプト
  const seedancePrompt = generateSeedancePrompt(shotPlan, preset);

  // 6. 一貫性ロック
  const identityLock = generateIdentityLock(keywords, preset);

  // 7. 肯定的な制約
  const positiveConstraints = generatePositiveConstraints(genre);

  // 8. アドバイス/推奨事項
  const recommendations = generateRecommendations(genre, input.aspectRatio);

  return {
    creativeInterpretation,
    shotPlan,
    keyframePrompts,
    storyboardSheetPrompt,
    seedancePrompt,
    identityLock,
    positiveConstraints,
    recommendations,
  };
}

// 1. クリエイティブな解釈を生成
function generateCreativeInterpretation(concept: string, genre: Genre, mood?: string): string {
  const moodText = mood ? `${mood}の雰囲気の中、` : '';
  const genreText = genrePresets[genre].keywords[0];

  return `${moodText}${concept}。${genreText}な映像美で、視覚的な物語を15秒に凝縮する。各フレームが感情を語り、観る者を引き込む瞬間を創出する。`;
}

// 2. ショットプランを生成
function generateShotPlan(
  concept: string,
  genre: Genre,
  preset: typeof genrePresets[Genre],
  keywords: ReturnType<typeof extractKeywords>
): Shot[] {
  const beats = ['Setup', 'Escalation', 'Hook'];
  const timeRanges = ['0-5s', '5-10s', '10-15s'];

  return beats.map((beat, idx) => {
    const camera = selectCameraMovements(genre, idx);
    const shotType = selectShotTypes(idx);
    const lighting = preset.lighting[idx % preset.lighting.length];

    let action: string;
    let description: string;

    switch (idx) {
      case 0:
        action = `${keywords.environment}のワイドショット。${keywords.mood}な雰囲気が画面を支配する。`;
        description = `Establishing shot: 世界観を確立し、観客を引き込む`;
        break;
      case 1:
        action = `${keywords.subject}が${keywords.action}。動きと存在感が画面に緊張を生む。`;
        description = `Character moment: 主要な被写体にフォーカス`;
        break;
      case 2:
        action = `クライマックスの瞬間。${keywords.subject}の決定的な表情または動作。`;
        description = `Hook: 感情的なインパクトを最大化し、記憶に残る`;
        break;
      default:
        action = concept;
        description = 'Visual beat';
    }

    return {
      timeRange: timeRanges[idx],
      beatName: beat,
      action,
      cameraMovement: camera,
      shotType,
      lighting,
      description,
    };
  });
}

// 3. キーフレームプロンプトを生成
function generateKeyframePrompts(
  shotPlan: Shot[],
  preset: typeof genrePresets[Genre],
  keywords: ReturnType<typeof extractKeywords>,
  aspectRatio?: string
): KeyframePrompt[] {
  const styleKeywords = preset.keywords.join(', ');
  const ratio = aspectRatio || '16:9';

  return shotPlan.map((shot, idx) => {
    const basePrompt = `${shot.shotType} shot, ${shot.action}, ${shot.lighting} lighting, ${styleKeywords}, ${preset.cameraStyle}, aspect ratio ${ratio}, no text, no watermark, no UI elements`;

    return {
      shotNumber: idx + 1,
      prompt: basePrompt,
      negativeElements: ['text', 'watermark', 'logo', 'UI', 'blurry', 'low quality'],
    };
  });
}

// 4. ストーリーボードシートプロンプト
function generateStoryboardSheetPrompt(shotPlan: Shot[], genre: Genre): string {
  const panelDescriptions = shotPlan
    .map((shot, idx) => `panel ${idx + 1}: ${shot.shotType} ${shot.action.slice(0, 30)}`)
    .join(', ');

  return `Professional storyboard sheet, three horizontal panels arranged in a row, ${genre} style, ${panelDescriptions}, consistent visual style across all panels, no text labels, cinematic composition, film production quality`;
}

// 5. Seedanceプロンプトを生成
function generateSeedancePrompt(
  shotPlan: Shot[],
  preset: typeof genrePresets[Genre]
): string {
  const transitions = [
    'Camera slowly',
    'Smoothly transitions to',
    'Final shot reveals',
  ];

  const segments = shotPlan.map((shot, idx) => {
    const imageRef = `@Image${idx + 1}`;
    const transition = transitions[idx];

    return `${imageRef} ${transition} ${shot.action.toLowerCase()}. Camera ${shot.cameraMovement} with ${shot.lighting} lighting.`;
  });

  const styleNote = `Maintain consistent ${preset.keywords[0]} aesthetic throughout with ${preset.cameraStyle}.`;

  return `${segments.join(' ')} ${styleNote}`;
}

// 6. 一貫性ロックを生成
function generateIdentityLock(
  keywords: ReturnType<typeof extractKeywords>,
  preset: typeof genrePresets[Genre]
): IdentityLock {
  return {
    subject: `${keywords.subject}、${keywords.mood}な表情、一貫した外観`,
    costume: '統一された衣装スタイル、変更なし',
    colorPalette: preset.colorTones,
    environment: `${keywords.environment}、一貫した照明と雰囲気`,
  };
}

// 7. 肯定的な制約を生成
function generatePositiveConstraints(genre: Genre): string[] {
  const common = [
    '各ショットで単一の明確なアクションを維持すること',
    'カメラの動きは滑らかで意図的であること',
    '被写体のアイデンティティを全ショットで統一すること',
  ];

  const genreSpecific: Record<Genre, string[]> = {
    cinematic: ['シネマティックなアスペクト比を維持すること', '浅い被写界深度を活用すること'],
    documentary: ['自然な動きとリアクションを捉えること', '過度な演出を避けること'],
    commercial: ['製品/被写体を常に明確に見せること', 'クリーンな構図を維持すること'],
    'music-video': ['リズムに合わせたカット割りを意識すること', 'ダイナミックな視覚効果を取り入れること'],
    horror: ['不安感を煽る構図を使用すること', '暗部の使い方に注意すること'],
    'sci-fi': ['未来的なデザイン要素を一貫させること', 'テクノロジー要素を自然に取り入れること'],
    drama: ['感情的な瞬間を大切にすること', 'キャラクターの表情を重視すること'],
    action: ['動きのブレを効果的に使用すること', 'インパクトのある瞬間を強調すること'],
    romance: ['柔らかい光を活用すること', '親密な距離感を演出すること'],
    comedy: ['明るく開放的な構図を使用すること', 'タイミングを意識した編集を行うこと'],
    experimental: ['視覚的な驚きを取り入れること', '従来の文法に縛られないこと'],
  };

  return [...common, ...(genreSpecific[genre] || [])];
}

// 8. 推奨事項を生成
function generateRecommendations(genre: Genre, aspectRatio?: string): string[] {
  const common = [
    'Seedance 2.0では、@Image参照を時系列順に配置してください',
    'GPT Image 2でキーフレームを生成する際は、同一のスタイルキーワードを全プロンプトに含めてください',
    '最終出力後、モーション強度を調整してください（推奨: 0.6-0.8）',
  ];

  const aspectTip = aspectRatio === '9:16'
    ? '縦型フォーマットでは、被写体を中央に配置することを推奨します'
    : '横型フォーマットでは、ルールオブサーズを活用してください';

  const genreTips: Record<Genre, string> = {
    cinematic: '音楽は映画的なオーケストラやアンビエントが雰囲気に合います',
    documentary: 'ナレーションを追加する場合は、静かな部分を残してください',
    commercial: 'ブランドカラーを意識した色調補正を推奨します',
    'music-video': 'BPMに合わせたカット割りを検討してください',
    horror: '効果音は控えめにし、静寂を活用してください',
    'sci-fi': 'サウンドデザインに電子音を取り入れることを推奨します',
    drama: 'ピアノやストリングスが感情を引き立てます',
    action: 'パーカッシブな音楽がアクションを強調します',
    romance: 'アコースティックやソフトなBGMが適しています',
    comedy: '軽快なBGMがトーンを維持します',
    experimental: '音楽も実験的なアプローチを検討してください',
  };

  return [...common, aspectTip, genreTips[genre]];
}
