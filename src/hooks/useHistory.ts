'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { StoryboardInput, StoryboardOutput, HistoryEntry, GenerationCost, GenerationDurations } from '@/types/storyboard';
import { getBrowserSupabase } from '@/lib/supabase';

// 単価（USD・概算）
const PRICING = {
  gptImageLow: 0.02,
  gpt4oVision: 0.005,
  seedance720p15s: 0.30,
};

export function computeCost(entry: Partial<HistoryEntry>): GenerationCost {
  const collage = entry.collageResult ? PRICING.gptImageLow : 0;
  const themeSuggestion = 0;
  const collageAnalysis = entry.output ? PRICING.gpt4oVision : 0;
  const keyframeCount = (entry.generatedImages || []).filter((i) => !!i.url).length;
  const keyframes = keyframeCount * PRICING.gptImageLow;
  const seedancePrompt = keyframeCount >= 1 && entry.output?.seedancePrompt ? PRICING.gpt4oVision : 0;
  const video = entry.generatedVideo ? PRICING.seedance720p15s : 0;
  const total = collage + themeSuggestion + collageAnalysis + keyframes + seedancePrompt + video;
  return { collage, themeSuggestion, collageAnalysis, keyframes, seedancePrompt, video, total };
}

// 履歴エントリを検証・サニタイズ
function sanitizeHistoryEntry(r: Record<string, unknown>): HistoryEntry | null {
  try {
    if (!r || !r.id) return null;
    const input = r.input as StoryboardInput | null | undefined;
    const output = r.output as StoryboardOutput | null | undefined;
    return {
      id: String(r.id),
      timestamp: r.created_at ? new Date(r.created_at as string).getTime() : (r.timestamp as number) || Date.now(),
      input: {
        concept: input?.concept || '',
        genre: input?.genre || 'cinematic',
        mood: input?.mood || '',
        aspectRatio: input?.aspectRatio || '16:9',
        additionalNotes: input?.additionalNotes || '',
        characters: Array.isArray(input?.characters) ? input.characters : [],
        referenceImages: Array.isArray(input?.referenceImages) ? input.referenceImages : [],
      },
      output: output ? {
        creativeInterpretation: output.creativeInterpretation || '',
        shotPlan: Array.isArray(output.shotPlan) ? output.shotPlan : [],
        keyframePrompts: Array.isArray(output.keyframePrompts) ? output.keyframePrompts : [],
        storyboardSheetPrompt: output.storyboardSheetPrompt || '',
        seedancePrompt: output.seedancePrompt || '',
        identityLock: {
          subject: output.identityLock?.subject || '',
          costume: output.identityLock?.costume || '',
          colorPalette: Array.isArray(output.identityLock?.colorPalette) ? output.identityLock.colorPalette : [],
          environment: output.identityLock?.environment || '',
        },
        positiveConstraints: Array.isArray(output.positiveConstraints) ? output.positiveConstraints : [],
        recommendations: Array.isArray(output.recommendations) ? output.recommendations : [],
      } : {
        creativeInterpretation: '',
        shotPlan: [],
        keyframePrompts: [],
        storyboardSheetPrompt: '',
        seedancePrompt: '',
        identityLock: { subject: '', costume: '', colorPalette: [], environment: '' },
        positiveConstraints: [],
        recommendations: [],
      },
      generatedImages: Array.isArray(r.generated_images || r.generatedImages)
        ? (r.generated_images || r.generatedImages) as { url: string; prompt: string }[]
        : undefined,
      generatedVideo: (r.generated_video || r.generatedVideo) as string | undefined,
      collageResult: (r.collage_result || r.collageResult) as string | undefined,
      cost: (r.cost) as HistoryEntry['cost'] | undefined,
      durations: (r.durations) as HistoryEntry['durations'] | undefined,
    };
  } catch (e) {
    console.error('Failed to sanitize history entry:', e);
    return null;
  }
}

// localStorageへの安全な保存
function safeSetHistory(entries: HistoryEntry[]) {
  const lightweight = entries.map((e) => ({
    ...e,
    generatedImages: e.generatedImages?.map((img) => ({
      ...img,
      url: img.url?.startsWith('data:') ? '' : img.url,
    })),
    collageResult: e.collageResult?.startsWith('data:') ? undefined : e.collageResult,
  }));

  try {
    localStorage.setItem('storyboard-history', JSON.stringify(lightweight));
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, removing old entries...');
      const reduced = lightweight.slice(0, Math.max(5, Math.floor(lightweight.length / 2)));
      try {
        localStorage.setItem('storyboard-history', JSON.stringify(reduced));
      } catch {
        console.warn('Still exceeding quota, clearing localStorage history');
        localStorage.removeItem('storyboard-history');
      }
    } else {
      console.error('Failed to save history to localStorage:', err);
    }
  }
}

// Supabaseへのupsert
async function upsertHistoryToDb(entry: HistoryEntry) {
  const supabase = getBrowserSupabase();
  if (!supabase) return;
  const { error } = await supabase.from('history').upsert({
    id: entry.id,
    created_at: new Date(entry.timestamp).toISOString(),
    input: entry.input,
    output: entry.output,
    generated_images: entry.generatedImages || null,
    generated_video: entry.generatedVideo || null,
    collage_result: entry.collageResult || null,
    cost: entry.cost || null,
    durations: entry.durations || null,
  });
  if (error) console.error('Supabase upsert error:', error);
}

// Supabaseからの削除
async function deleteHistoryFromDb(id: string) {
  const supabase = getBrowserSupabase();
  if (!supabase) return;
  const { error } = await supabase.from('history').delete().eq('id', id);
  if (error) console.error('Supabase delete error:', error);
}

// outputのサニタイズ
function sanitizeOutput(output: StoryboardOutput | null | undefined): StoryboardOutput | null {
  if (!output) return null;
  return {
    creativeInterpretation: output.creativeInterpretation || '',
    shotPlan: Array.isArray(output.shotPlan) ? output.shotPlan : [],
    keyframePrompts: Array.isArray(output.keyframePrompts) ? output.keyframePrompts : [],
    storyboardSheetPrompt: output.storyboardSheetPrompt || '',
    seedancePrompt: output.seedancePrompt || '',
    identityLock: {
      subject: output.identityLock?.subject || '',
      costume: output.identityLock?.costume || '',
      colorPalette: Array.isArray(output.identityLock?.colorPalette) ? output.identityLock.colorPalette : [],
      environment: output.identityLock?.environment || '',
    },
    positiveConstraints: Array.isArray(output.positiveConstraints) ? output.positiveConstraints : [],
    recommendations: Array.isArray(output.recommendations) ? output.recommendations : [],
  };
}

// inputのサニタイズ
function sanitizeInput(input: StoryboardInput | null | undefined): StoryboardInput {
  return {
    concept: input?.concept || '',
    genre: input?.genre || 'cinematic',
    mood: input?.mood || '',
    aspectRatio: input?.aspectRatio || '16:9',
    additionalNotes: input?.additionalNotes || '',
    characters: Array.isArray(input?.characters) ? input.characters : [],
    referenceImages: Array.isArray(input?.referenceImages) ? input.referenceImages : [],
  };
}

export interface UseHistoryReturn {
  history: HistoryEntry[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
  historySearch: string;
  setHistorySearch: React.Dispatch<React.SetStateAction<string>>;
  showHistory: boolean;
  setShowHistory: React.Dispatch<React.SetStateAction<boolean>>;
  isLoadingFromHistoryRef: React.MutableRefObject<boolean>;
  loadFromHistory: (entry: HistoryEntry) => {
    input: StoryboardInput;
    output: StoryboardOutput | null;
    generatedImages: { url: string; prompt: string }[];
    generatedVideo: string | null;
    collageResult: string | null;
    durations: GenerationDurations;
  };
  deleteFromHistory: (id: string) => void;
  saveToHistory: (data: {
    input: StoryboardInput;
    output: StoryboardOutput;
    generatedImages?: { url: string; prompt: string }[];
    generatedVideo?: string | null;
    collageResult?: string | null;
  }) => void;
  autoSaveToHistory: (data: {
    input: StoryboardInput;
    output: StoryboardOutput | null;
    generatedImages: { url: string; prompt: string }[];
    generatedVideo: string | null;
    collageResult: string | null;
    durations: GenerationDurations;
  }) => void;
  filteredHistory: HistoryEntry[];
}

export function useHistory(): UseHistoryReturn {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const isLoadingFromHistoryRef = useRef(false);

  // 履歴を Supabase / localStorage から読み込み
  useEffect(() => {
    const load = async () => {
      try {
        const supabase = getBrowserSupabase();
        if (supabase) {
          const { data, error } = await supabase
            .from('history')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
          if (!error && data) {
            const entries = data
              .map((r) => sanitizeHistoryEntry(r))
              .filter((e): e is HistoryEntry => e !== null);
            setHistory(entries);
            return;
          }
          if (error) console.error('Supabase history load failed:', error);
        }
        // フォールバック: localStorage
        const saved = localStorage.getItem('storyboard-history');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const entries = parsed
              .map((r: Record<string, unknown>) => sanitizeHistoryEntry(r))
              .filter((e): e is HistoryEntry => e !== null);
            setHistory(entries);
          }
        }
      } catch (e) {
        console.error('Failed to load history:', e);
        setHistory([]);
      }
    };
    load();
  }, []);

  const loadFromHistory = useCallback((entry: HistoryEntry) => {
    isLoadingFromHistoryRef.current = true;
    return {
      input: sanitizeInput(entry.input),
      output: sanitizeOutput(entry.output),
      generatedImages: entry.generatedImages || [],
      generatedVideo: entry.generatedVideo || null,
      collageResult: entry.collageResult || null,
      durations: entry.durations || {},
    };
  }, []);

  const deleteFromHistory = useCallback((id: string) => {
    setHistory((prev) => {
      const newHistory = prev.filter((h) => h.id !== id);
      safeSetHistory(newHistory);
      deleteHistoryFromDb(id);
      return newHistory;
    });
  }, []);

  const saveToHistory = useCallback((data: {
    input: StoryboardInput;
    output: StoryboardOutput;
    generatedImages?: { url: string; prompt: string }[];
    generatedVideo?: string | null;
    collageResult?: string | null;
  }) => {
    const draft: Partial<HistoryEntry> = {
      input: data.input,
      output: data.output,
      generatedImages: data.generatedImages?.length ? data.generatedImages : undefined,
      generatedVideo: data.generatedVideo || undefined,
      collageResult: data.collageResult || undefined,
    };
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      input: data.input,
      output: data.output,
      generatedImages: draft.generatedImages,
      generatedVideo: draft.generatedVideo,
      collageResult: draft.collageResult,
      cost: computeCost(draft),
    };

    setHistory((prev) => {
      const newHistory = [entry, ...prev].slice(0, 30);
      safeSetHistory(newHistory);
      return newHistory;
    });
  }, []);

  const autoSaveToHistory = useCallback((data: {
    input: StoryboardInput;
    output: StoryboardOutput | null;
    generatedImages: { url: string; prompt: string }[];
    generatedVideo: string | null;
    collageResult: string | null;
    durations: GenerationDurations;
  }) => {
    if (!data.output) return;
    if (isLoadingFromHistoryRef.current) {
      isLoadingFromHistoryRef.current = false;
      return;
    }

    const draft: Partial<HistoryEntry> = {
      input: data.input,
      output: data.output,
      generatedImages: data.generatedImages.length > 0 ? data.generatedImages : undefined,
      generatedVideo: data.generatedVideo || undefined,
      collageResult: data.collageResult || undefined,
    };
    const cost = computeCost(draft);
    const totalMs = (data.durations.collageMs || 0) + (data.durations.analysisMs || 0) + (data.durations.videoMs || 0);
    const durationsSnapshot: GenerationDurations = { ...data.durations, totalMs };

    setHistory((prev) => {
      const newest = prev[0];
      const sameSession = newest &&
        newest.output?.creativeInterpretation === data.output?.creativeInterpretation &&
        newest.input?.concept === data.input.concept;

      let next: HistoryEntry[];
      let entryToPersist: HistoryEntry;

      if (sameSession) {
        const updated: HistoryEntry = {
          ...newest,
          input: data.input,
          output: data.output!, // Already checked for null above
          generatedImages: draft.generatedImages,
          generatedVideo: draft.generatedVideo,
          collageResult: draft.collageResult,
          cost,
          durations: durationsSnapshot,
        };
        entryToPersist = updated;
        next = [updated, ...prev.slice(1)];
      } else {
        const created: HistoryEntry = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          input: data.input,
          output: data.output!, // Already checked for null above
          generatedImages: draft.generatedImages,
          generatedVideo: draft.generatedVideo,
          collageResult: draft.collageResult,
          cost,
          durations: durationsSnapshot,
        };
        entryToPersist = created;
        next = [created, ...prev].slice(0, 30);
      }

      safeSetHistory(next);
      upsertHistoryToDb(entryToPersist);
      return next;
    });
  }, []);

  const filteredHistory = history.filter((e) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.trim().toLowerCase();
    return e.id?.toLowerCase().includes(q) || e.input?.concept?.toLowerCase().includes(q);
  });

  return {
    history,
    setHistory,
    historySearch,
    setHistorySearch,
    showHistory,
    setShowHistory,
    isLoadingFromHistoryRef,
    loadFromHistory,
    deleteFromHistory,
    saveToHistory,
    autoSaveToHistory,
    filteredHistory,
  };
}
