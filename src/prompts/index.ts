// ===========================================
// AI Storyboard Director - Prompts Module
// ===========================================
// すべてのプロンプト関連機能を統合エクスポート

// テンプレート
export {
  defaultTemplates,
  applyTemplate,
  mergeTemplates,
  type PromptTemplates,
} from './templates';

// ジャンルプリセット
export {
  genrePresets,
  getGenrePreset,
  buildStyleKeywords,
  buildNegativePrompt,
  type GenrePreset,
} from './genrePresets';

// システムプロンプト
export {
  systemPrompts,
  gptImageSystemPrompt,
  seedanceSystemPrompt,
  creativeDirectorPrompt,
  copyrightFilterPrompt,
  promptOptimizationGuide,
} from './systemPrompts';

// ===========================================
// 便利なユーティリティ関数
// ===========================================
import { defaultTemplates, applyTemplate } from './templates';
import { getGenrePreset, buildStyleKeywords } from './genrePresets';
import type { Genre } from '@/types/storyboard';

/**
 * 完全なキーフレームプロンプトを生成
 */
export function generateKeyframePrompt(params: {
  shotType: string;
  action: string;
  lighting: string;
  genre: Genre;
  aspectRatio: string;
}): string {
  const preset = getGenrePreset(params.genre);
  const style = buildStyleKeywords(params.genre);

  return applyTemplate(defaultTemplates.gptImage.keyframe, {
    shotType: params.shotType,
    action: params.action,
    lighting: params.lighting,
    style: style,
    aspectRatio: params.aspectRatio,
  });
}

/**
 * Seedance用の完全なビデオプロンプトを生成
 */
export function generateVideoPrompt(params: {
  shots: Array<{
    action: string;
    cameraMovement: string;
    lighting: string;
  }>;
  genre: Genre;
}): string {
  const preset = getGenrePreset(params.genre);
  const transitionPhrases = defaultTemplates.seedance.transitionPhrases;

  const shotDescriptions = params.shots.map((shot, idx) => {
    const transition = transitionPhrases[idx] || transitionPhrases[0];
    return `@Image${idx + 1} ${transition} ${shot.action.toLowerCase()}. Camera ${shot.cameraMovement} with ${shot.lighting} lighting.`;
  });

  const styleNote = applyTemplate(defaultTemplates.seedance.styleConsistency, {
    style: preset.keywords[0],
    cameraStyle: preset.cameraStyle,
  });

  return `${shotDescriptions.join(' ')} ${styleNote}`;
}

/**
 * ストーリーボードシートプロンプトを生成
 */
export function generateStoryboardSheetPrompt(params: {
  genre: Genre;
  panels: Array<{ shotType: string; description: string }>;
}): string {
  const panelDescriptions = params.panels
    .map((p, idx) => `panel ${idx + 1}: ${p.shotType} ${p.description}`)
    .join(', ');

  return applyTemplate(defaultTemplates.gptImage.storyboardSheet, {
    genre: params.genre,
    panelDescriptions: panelDescriptions,
  });
}
