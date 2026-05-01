'use client';

import { useState, useEffect, useRef } from 'react';
import type { StoryboardInput, StoryboardOutput, Genre, AspectRatio, Character, ReferenceImage, HistoryEntry } from '@/types/storyboard';
import { StoryboardPreview, StoryboardPreview3Panel } from '@/components/StoryboardPreview';
import { generateStoryboard } from '@/lib/promptEngine';
import { getCopyrightWarnings } from '@/lib/copyrightFilter';
import { SettingsModal } from '@/components/SettingsModal';
import { PromptsModal } from '@/components/PromptsModal';

// ジャンルオプション
const genres: { value: Genre; label: string }[] = [
  { value: 'cinematic', label: 'シネマティック' },
  { value: 'documentary', label: 'ドキュメンタリー' },
  { value: 'commercial', label: 'コマーシャル' },
  { value: 'music-video', label: 'ミュージックビデオ' },
  { value: 'horror', label: 'ホラー' },
  { value: 'sci-fi', label: 'SF' },
  { value: 'drama', label: 'ドラマ' },
  { value: 'action', label: 'アクション' },
  { value: 'romance', label: 'ロマンス' },
  { value: 'comedy', label: 'コメディ' },
  { value: 'experimental', label: '実験的' },
];

// アスペクト比オプション
const aspectRatios: { value: AspectRatio; label: string }[] = [
  { value: '16:9', label: '16:9（横長）' },
  { value: '9:16', label: '9:16（縦長）' },
];

export default function Home() {
  const [input, setInput] = useState<StoryboardInput>({
    concept: '',
    genre: 'cinematic',
    mood: '',
    aspectRatio: '16:9',
    additionalNotes: '',
    characters: [],
    referenceImages: [],
  });
  const [output, setOutput] = useState<StoryboardOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'6panel' | '3panel'>('6panel');
  const [copyrightWarnings, setCopyrightWarnings] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{ url: string; prompt: string }[]>([]);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageGenerationProgress, setImageGenerationProgress] = useState(0);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [collageImages, setCollageImages] = useState<string[]>([]);
  const [collageResult, setCollageResult] = useState<string | null>(null);
  const [isGeneratingCollage, setIsGeneratingCollage] = useState(false);
  const [collageMode, setCollageMode] = useState<'upload' | 'prompt'>('upload');
  const [collagePrompt, setCollagePrompt] = useState('');
  const [isGeneratingGPTCollage, setIsGeneratingGPTCollage] = useState(false);
  const [storyboardPrompt, setStoryboardPrompt] = useState('');
  const [isAnalyzingCollage, setIsAnalyzingCollage] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [showReferenceImages, setShowReferenceImages] = useState(false);
  const [viewMode, setViewMode] = useState<'collage' | 'upload'>('collage');
  const [isSuggestingTheme, setIsSuggestingTheme] = useState(false);
  const [hasSuggestedTheme, setHasSuggestedTheme] = useState(false);
  const [showConceptInput, setShowConceptInput] = useState(true);
  const [showStoryboardSidebar, setShowStoryboardSidebar] = useState(true);
  const [storyboardSidebarWidth, setStoryboardSidebarWidth] = useState(480);
  const [showKeyframePrompts, setShowKeyframePrompts] = useState(false);
  const isResizingRef = useRef(false);
  const [apiStatus, setApiStatus] = useState<{ openai: boolean; fal: boolean } | null>(null);

  // 履歴をlocalStorageから読み込み
  useEffect(() => {
    const saved = localStorage.getItem('storyboard-history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    }
  }, []);

  // ストーリーボードサイドバーのリサイズ
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = window.innerWidth - e.clientX;
      const clamped = Math.min(Math.max(newWidth, 320), Math.min(550, window.innerWidth - 200));
      setStoryboardSidebarWidth(clamped);
    };
    const handleUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, []);

  // APIステータスを取得
  useEffect(() => {
    let cancelled = false;
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/status');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setApiStatus({ openai: !!data?.openai?.configured, fal: !!data?.fal?.configured });
        }
      } catch {
        if (!cancelled) setApiStatus({ openai: false, fal: false });
      }
    };
    fetchStatus();
    return () => { cancelled = true; };
  }, []);

  // 画像アップロード時に自動でテーマを提案
  useEffect(() => {
    if (viewMode !== 'upload') return;
    if (collageImages.length === 0) return;
    if (hasSuggestedTheme) return;
    if (input.concept.trim()) return;

    const timer = setTimeout(async () => {
      setIsSuggestingTheme(true);
      try {
        const res = await fetch('/api/suggest-theme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: collageImages.slice(0, 4) }),
        });
        if (!res.ok) throw new Error('suggest failed');
        const data = await res.json();
        if (data.theme) {
          setInput((prev) => prev.concept.trim() ? prev : { ...prev, concept: data.theme });
          setHasSuggestedTheme(true);
        }
      } catch (err) {
        console.error('Theme suggestion failed:', err);
      } finally {
        setIsSuggestingTheme(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [collageImages, viewMode, input.concept, hasSuggestedTheme]);

  // 画像アップロードがクリアされたらフラグをリセット
  useEffect(() => {
    if (collageImages.length === 0) setHasSuggestedTheme(false);
  }, [collageImages.length]);

  // 履歴を保存
  const saveToHistory = () => {
    if (!output) return;

    const entry: HistoryEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      input,
      output,
      generatedImages: generatedImages.length > 0 ? generatedImages : undefined,
      generatedVideo: generatedVideo || undefined,
    };

    const newHistory = [entry, ...history].slice(0, 20); // 最大20件
    setHistory(newHistory);
    localStorage.setItem('storyboard-history', JSON.stringify(newHistory));
  };

  // 履歴から読み込み
  const loadFromHistory = (entry: HistoryEntry) => {
    setInput(entry.input);
    setOutput(entry.output);
    setGeneratedImages(entry.generatedImages || []);
    setGeneratedVideo(entry.generatedVideo || null);
    setShowHistory(false);
  };

  // 履歴を削除
  const deleteFromHistory = (id: string) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('storyboard-history', JSON.stringify(newHistory));
  };

  const handleGenerate = async () => {
    if (!input.concept.trim()) return;

    setIsGenerating(true);
    // 著作権チェック
    const warnings = getCopyrightWarnings(input.concept);
    setCopyrightWarnings(warnings);

    // プロンプトエンジンで生成
    await new Promise(resolve => setTimeout(resolve, 800)); // UI feedback用の短い遅延
    const generated = generateStoryboard(input);
    setOutput(generated);
    setIsGenerating(false);
    setGeneratedImages([]); // 新しいストーリーボード生成時に画像をリセット
  };

  const handleGenerateImages = async () => {
    if (!output) return;

    setIsGeneratingImages(true);
    setImageGenerationProgress(0);
    setGeneratedImages([]);

    const newImages: { url: string; prompt: string }[] = [];

    for (let i = 0; i < output.keyframePrompts.length; i++) {
      const kf = output.keyframePrompts[i];
      setImageGenerationProgress(i + 1);

      try {
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: kf.prompt,
            aspectRatio: input.aspectRatio,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Image generation failed');
        }

        const data = await response.json();
        newImages.push({ url: data.url, prompt: kf.prompt });
        setGeneratedImages([...newImages]);
      } catch (error) {
        console.error(`Failed to generate image ${i + 1}:`, error);
        newImages.push({ url: '', prompt: kf.prompt });
        setGeneratedImages([...newImages]);
      }
    }

    setIsGeneratingImages(false);
  };

  // キャラクター追加（最大2人まで）
  const addCharacter = () => {
    if ((input.characters || []).length >= 2) return;
    const isFirst = (input.characters || []).length === 0;
    const newCharacter: Character = {
      name: '',
      appearance: '',
      clothing: '',
      age: '',
      role: isFirst ? 'メイン' : 'サブ',
    };
    setInput({ ...input, characters: [...(input.characters || []), newCharacter] });
  };

  // キャラクター削除
  const removeCharacter = (index: number) => {
    const updated = [...(input.characters || [])];
    updated.splice(index, 1);
    setInput({ ...input, characters: updated });
  };

  // キャラクター更新
  const updateCharacter = (index: number, field: keyof Character, value: string) => {
    const updated = [...(input.characters || [])];
    updated[index] = { ...updated[index], [field]: value };
    setInput({ ...input, characters: updated });
  };

  // 参照画像アップロード
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const newImage: ReferenceImage = { url, description: file.name };
        setInput((prev) => ({
          ...prev,
          referenceImages: [...(prev.referenceImages || []), newImage],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  // 参照画像削除
  const removeReferenceImage = (index: number) => {
    const updated = [...(input.referenceImages || [])];
    updated.splice(index, 1);
    setInput({ ...input, referenceImages: updated });
  };

  // コラージュ用画像アップロード
  const handleCollageImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (collageImages.length >= 12) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setCollageImages((prev) => [...prev, url].slice(0, 12));
      };
      reader.readAsDataURL(file);
    });
  };

  // コラージュ画像削除
  const removeCollageImage = (index: number) => {
    setCollageImages((prev) => prev.filter((_, i) => i !== index));
  };

  // コラージュ生成
  const handleGenerateCollage = async () => {
    if (collageImages.length === 0) return;

    setIsGeneratingCollage(true);
    setCollageResult(null);

    try {
      const response = await fetch('/api/generate-collage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: collageImages,
          aspectRatio: input.aspectRatio,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Collage generation failed');
      }

      const data = await response.json();
      setCollageResult(data.collageUrl);
      setIsGeneratingCollage(false);
      // コラージュ作成後、自動でストーリーボード作成へ
      await handleAnalyzeCollage(data.collageUrl);
      return;
    } catch (error) {
      console.error('Failed to generate collage:', error);
      alert('コラージュ生成に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsGeneratingCollage(false);
    }
  };

  // 単一コラージュ画像を直接アップロード → ストーリーボード作成
  const handleUploadCollageDirect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const url = event.target?.result as string;
      setCollageResult(url);
      await handleAnalyzeCollage(url);
    };
    reader.readAsDataURL(file);
  };

  // GPT Image 2でコラージュ画像を生成
  const handleGenerateGPTCollage = async () => {
    if (!input.concept.trim()) {
      alert('映像コンセプトを入力してください');
      return;
    }

    setIsGeneratingGPTCollage(true);
    setCollageResult(null);

    try {
      // フォームの入力をプロンプトに反映
      const parts: string[] = [input.concept.trim()];
      if (input.mood?.trim()) {
        parts.push(`Mood: ${input.mood.trim()}`);
      }
      if (input.characters && input.characters.length > 0) {
        const characterDescriptions = input.characters.map((char, idx) => {
          return `Character ${idx + 1} (${char.role}): ${char.name || 'unnamed'}, ${char.appearance}, wearing ${char.clothing}`;
        }).join('. ');
        parts.push(`Characters: ${characterDescriptions}`);
      }
      if (input.additionalNotes?.trim()) {
        parts.push(`Notes: ${input.additionalNotes.trim()}`);
      }
      const fullPrompt = parts.join('. ');

      // 参照画像URLを抽出
      const refs = (input.referenceImages || []).map((r) => r.url).filter((u) => !!u);
      const refNote = refs.length > 0
        ? ' Use the provided reference images as visual style and character/look guides — match the aesthetic, color palette, and subject likeness consistently across all 12 frames.'
        : '';

      // コラージュ風のプロンプトを生成
      const collageImagePrompt = `A cinematic storyboard collage with 12 frames arranged in a 4x3 grid. Each frame shows a different scene from the story: ${fullPrompt}.${refNote} Style: professional cinematography, dramatic lighting, high contrast, film grain. Aspect ratio: ${input.aspectRatio}. High quality, photorealistic.`;

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: collageImagePrompt,
          aspectRatio: input.aspectRatio,
          referenceImages: refs,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Collage generation failed');
      }

      const data = await response.json();
      setCollageResult(data.url);
    } catch (error) {
      console.error('Failed to generate GPT collage:', error);
      alert('コラージュ生成に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsGeneratingGPTCollage(false);
    }
  };

  // コラージュを分析してストーリーボードプロンプトを生成
  const handleAnalyzeCollage = async (urlOverride?: string) => {
    const collageUrl = typeof urlOverride === 'string' ? urlOverride : collageResult;
    if (!collageUrl) return;

    setIsAnalyzingCollage(true);
    setStoryboardPrompt('');
    setOutput(null);
    setGeneratedImages([]);

    try {
      // 1. コラージュ分析
      const response = await fetch('/api/analyze-collage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: collageUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analysis failed');
      }

      const data = await response.json();
      setStoryboardPrompt(data.prompt);

      // 2. ストーリーボード出力を生成（プロンプトエンジン）
      const conceptForGen = input.concept.trim() || data.prompt;
      const generated = generateStoryboard({ ...input, concept: conceptForGen });
      setOutput(generated);

      // 3. キーフレーム画像を生成（コラージュを参照画像として使用）
      const newImages: { url: string; prompt: string }[] = [];
      const tryGenerateKeyframe = async (
        scenePrompt: string,
        attempt: 'full' | 'safer' | 'minimal'
      ): Promise<string> => {
        let prompt: string;
        if (attempt === 'full') {
          prompt = `Extract and render this single scene as a standalone cinematic frame, using the provided collage as the visual reference for character likeness, style, color palette, and aesthetic. Scene: ${scenePrompt}. Match the look and characters from the reference collage. Aspect ratio: ${input.aspectRatio}. High quality, photorealistic, dramatic lighting.`;
        } else if (attempt === 'safer') {
          // セーフティ違反回避: 人物描写を一般化、抽象的な表現に
          prompt = `Cinematic frame inspired by the reference collage. Match the visual style, color palette, and atmosphere. Scene: ${scenePrompt}. Aspect ratio: ${input.aspectRatio}. Professional cinematography, dramatic lighting, painterly style. No identifiable likeness of real people.`;
        } else {
          // 最小限: 環境・雰囲気のみ（キャラクター描写を完全に避ける）
          prompt = `Cinematic environment shot. Match the color palette and lighting from the reference collage. Setting and mood: ${scenePrompt.split(/[.!?]/)[0] || 'cinematic'}. Aspect ratio: ${input.aspectRatio}. No people, focus on environment, atmosphere, lighting, and objects.`;
        }
        const imgRes = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            aspectRatio: input.aspectRatio,
            referenceImages: [collageUrl],
          }),
        });
        if (!imgRes.ok) {
          const err = await imgRes.json().catch(() => ({}));
          throw new Error(err.error || 'Image generation failed');
        }
        const imgData = await imgRes.json();
        return imgData.url as string;
      };

      for (let i = 0; i < generated.keyframePrompts.length; i++) {
        const kf = generated.keyframePrompts[i];
        const attempts: ('full' | 'safer' | 'minimal')[] = ['full', 'safer', 'minimal'];
        let url = '';
        for (const attempt of attempts) {
          try {
            url = await tryGenerateKeyframe(kf.prompt, attempt);
            if (url) break;
          } catch (err) {
            console.warn(`Keyframe ${i + 1} attempt "${attempt}" failed:`, err);
          }
        }
        if (!url) {
          console.error(`Failed to generate keyframe ${i + 1} after all retries.`);
        }
        newImages.push({ url, prompt: kf.prompt });
        setGeneratedImages([...newImages]);
      }

      // 4. キーフレーム画像から Seedance プロンプトを生成して output.seedancePrompt を更新
      const validKeyframes = newImages.map((n) => n.url).filter((u) => !!u);
      if (validKeyframes.length >= 1) {
        try {
          const sdRes = await fetch('/api/generate-seedance-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              keyframeUrls: validKeyframes.slice(0, 3),
              concept: conceptForGen,
              mood: input.mood,
              additionalNotes: input.additionalNotes,
              aspectRatio: input.aspectRatio,
            }),
          });
          if (sdRes.ok) {
            const sdData = await sdRes.json();
            if (sdData.prompt) {
              setOutput((prev) => prev ? { ...prev, seedancePrompt: sdData.prompt } : prev);
            }
          }
        } catch (err) {
          console.error('Failed to generate seedance prompt from keyframes:', err);
        }
      }
    } catch (error) {
      console.error('Failed to analyze collage:', error);
      alert('ストーリーボード作成に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsAnalyzingCollage(false);
    }
  };

  // コラージュから動画生成
  const handleGenerateVideoFromCollage = async () => {
    if (!collageResult) return;

    setIsGeneratingVideo(true);
    setGeneratedVideo(null);

    // ストーリーボード作成時にキーフレームから生成された Seedance プロンプトを使用
    let videoPrompt = output?.seedancePrompt || '';
    const keyframeUrls = generatedImages.map((g) => g.url).filter((u) => !!u);

    // output に Seedance プロンプトが無く、キーフレームがある場合はその場で生成
    if (!videoPrompt && keyframeUrls.length >= 1) {
      try {
        const res = await fetch('/api/generate-seedance-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyframeUrls: keyframeUrls.slice(0, 3),
            concept: input.concept,
            mood: input.mood,
            additionalNotes: input.additionalNotes,
            aspectRatio: input.aspectRatio,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.prompt) {
            videoPrompt = data.prompt as string;
            setOutput((prev) => prev ? { ...prev, seedancePrompt: videoPrompt } : prev);
          }
        }
      } catch (err) {
        console.error('Failed to generate seedance prompt from keyframes:', err);
      }
    }

    // フォールバック: テキストベース構築
    if (!videoPrompt) {
      const subject = (input.concept || 'a single subject').trim();
      const mood = input.mood?.trim();
      const hasOutput = !!output && output.shotPlan && output.shotPlan.length >= 3;
      const shot1 = hasOutput ? output.shotPlan[0] : null;
      const shot2 = hasOutput ? output.shotPlan[1] : null;
      const shot3 = hasOutput ? output.shotPlan[2] : null;
      const opening = shot1
        ? `${shot1.action}. Camera ${shot1.cameraMovement}, ${shot1.lighting}.`
        : `${subject} establishing shot. Slow push-in, ${mood || 'cinematic'} lighting.`;
      const midpoint = shot2
        ? `${shot2.action}. Camera ${shot2.cameraMovement}, ${shot2.lighting}.`
        : `${subject} action escalates. Tracking shot, dynamic mood.`;
      const ending = shot3
        ? `${shot3.action}. Camera ${shot3.cameraMovement}, ${shot3.lighting}. Final beat.`
        : `${subject} final beat. Pull back, resolved composition.`;
      const lock = `Maintain the same ${subject}, face/body/shape, wardrobe, color palette, and lighting style across the full 15 seconds.`;
      const noGrid = 'Generate the video clean, without grid lines, overlays, or checkerboard patterns from the reference image.';
      videoPrompt = `${subject}. 15-second cinematic sequence in 3 beats. @ Image1 (0-5s): ${opening} @ Image2 (5-10s): ${midpoint} @ Image3 (10-15s): ${ending} ${lock} ${noGrid}`;
      const words = videoPrompt.split(/\s+/);
      if (words.length > 130) videoPrompt = words.slice(0, 130).join(' ');
    }

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          imageUrl: collageResult,
          aspectRatio: input.aspectRatio,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Video generation failed');
      }

      const data = await response.json();
      setGeneratedVideo(data.videoUrl);
    } catch (error) {
      console.error('Failed to generate video:', error);
      alert('動画生成に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // 動画生成
  const handleGenerateVideo = async () => {
    if (!output || generatedImages.length === 0) return;

    setIsGeneratingVideo(true);
    setGeneratedVideo(null);

    try {
      // 最初の生成画像を使用
      const imageUrl = generatedImages[0]?.url;

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: output.seedancePrompt,
          imageUrl: imageUrl,
          aspectRatio: input.aspectRatio,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Video generation failed');
      }

      const data = await response.json();
      setGeneratedVideo(data.videoUrl);
    } catch (error) {
      console.error('Failed to generate video:', error);
      alert('動画生成に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const copyToClipboard = async (text: string, section: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const CopyButton = ({ text, section }: { text: string; section: string }) => (
    <button
      onClick={() => copyToClipboard(text, section)}
      className={`px-3 py-1.5 text-xs rounded-md transition-all ${
        copiedSection === section
          ? 'bg-green-600 text-white'
          : 'bg-[#2a2a3a] text-gray-300 hover:bg-[#3a3a4a]'
      }`}
    >
      {copiedSection === section ? 'Copied!' : 'Copy'}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* ヘッダー */}
      <header
        style={{ paddingRight: output && showStoryboardSidebar ? storyboardSidebarWidth + 20 : undefined }}
        className={`border-b border-[#2a2a3a] bg-[#0d0d14] transition-[padding] ${showConceptInput ? 'lg:pl-[400px]' : ''}`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold">SD</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">AI Video Creator</h1>
              <p className="text-xs text-gray-500">コラージュ → Seedance 2.0 動画生成</p>
            </div>
            {/* APIステータス */}
            <div className="flex items-center gap-3 ml-4 px-3 py-1.5 bg-[#0d0d12] border border-[#2a2a3a] rounded-lg">
              <div className="flex items-center gap-1.5" title={apiStatus?.openai ? 'OpenAI API: 接続中' : 'OpenAI API: 未設定/エラー'}>
                <span className={`w-2 h-2 rounded-full ${
                  apiStatus === null ? 'bg-gray-500' : apiStatus.openai ? 'bg-green-500' : 'bg-red-500'
                } ${apiStatus !== null ? 'animate-pulse' : ''}`} />
                <span className="text-xs text-gray-300">OpenAI</span>
              </div>
              <div className="w-px h-4 bg-[#2a2a3a]" />
              <div className="flex items-center gap-1.5" title={apiStatus?.fal ? 'fal.ai: 接続中' : 'fal.ai: 未設定/エラー'}>
                <span className={`w-2 h-2 rounded-full ${
                  apiStatus === null ? 'bg-gray-500' : apiStatus.fal ? 'bg-green-500' : 'bg-red-500'
                } ${apiStatus !== null ? 'animate-pulse' : ''}`} />
                <span className="text-xs text-gray-300">fal.ai</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 mr-2">15sec Video System</span>
            {/* Workflow Button */}
            <button
              onClick={() => setShowWorkflow((v) => !v)}
              className={`px-3 py-2 rounded-lg transition-colors text-xs flex items-center gap-1.5 ${
                showWorkflow
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#1a1a2a] text-gray-400 hover:bg-[#2a2a3a]'
              }`}
              title="ワークフロー"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              ワークフロー
            </button>
            {/* Prompts Button */}
            <button
              onClick={() => setShowPrompts(true)}
              className="p-2 rounded-lg bg-[#1a1a2a] hover:bg-[#2a2a3a] transition-colors"
              title="Prompt Templates"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            {/* History Button */}
            <button
              onClick={() => setShowHistory(true)}
              className="p-2 rounded-lg bg-[#1a1a2a] hover:bg-[#2a2a3a] transition-colors relative"
              title="履歴"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  {history.length}
                </span>
              )}
            </button>
            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg bg-[#1a1a2a] hover:bg-[#2a2a3a] transition-colors"
              title="API Settings"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* モード切替 + ワークフローバー（上部バー直下） */}
      <div
        style={{ paddingRight: output && showStoryboardSidebar ? storyboardSidebarWidth + 20 : undefined }}
        className={`border-b border-[#2a2a3a] bg-[#141420] transition-[padding] ${showConceptInput ? 'lg:pl-[400px]' : ''}`}
      >
        <div className="max-w-[1600px] mx-auto px-4 py-3 space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            {/* ワークフロー */}
          {showWorkflow && (
            <>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 flex-1">
                {[
                  { step: 1, text: '画像アップロード or プロンプト入力', desc: '素材を準備' },
                  { step: 2, text: 'コラージュ画像を生成', desc: '複数シーンを1枚に' },
                  { step: 3, text: 'ストーリーボードを作成', desc: 'AIがシーンを分析' },
                  { step: 4, text: 'Seedance 2.0で動画生成', desc: '高品質映像を出力' },
                ].map((item, idx, arr) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center text-xs font-medium shrink-0">
                      {item.step}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-white whitespace-nowrap">{item.text}</p>
                      <p className="text-[10px] text-gray-500 whitespace-nowrap">{item.desc}</p>
                    </div>
                    {idx < arr.length - 1 && (
                      <svg className="w-4 h-4 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          </div>

          {/* アクションボタン */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGenerateGPTCollage}
              disabled={!input.concept.trim() || isGeneratingGPTCollage}
              className={`px-4 py-2 text-xs rounded-lg transition-all flex items-center gap-2 ${
                !input.concept.trim() || isGeneratingGPTCollage
                  ? 'bg-purple-600/30 text-purple-300/50 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-500'
              }`}
            >
              {isGeneratingGPTCollage ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  GPTでコラージュ生成中...
                </>
              ) : (
                'GPT Image 2でコラージュを作成'
              )}
            </button>

            <button
              onClick={() => handleAnalyzeCollage()}
              disabled={isAnalyzingCollage || !collageResult}
              className={`px-4 py-2 text-xs rounded-lg transition-all flex items-center gap-2 ${
                isAnalyzingCollage || !collageResult
                  ? 'bg-indigo-600/30 text-indigo-300/50 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
              }`}
            >
              {isAnalyzingCollage ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  AI分析中...
                </>
              ) : (
                'ストーリーボードを作成'
              )}
            </button>

            <button
              onClick={handleGenerateVideoFromCollage}
              disabled={isGeneratingVideo || !collageResult}
              className={`px-4 py-2 text-xs rounded-lg transition-all flex items-center gap-2 ${
                isGeneratingVideo || !collageResult
                  ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500'
              }`}
            >
              {isGeneratingVideo ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Seedance 2.0で動画生成中...
                </>
              ) : (
                'Seedance 2.0で動画を生成'
              )}
            </button>

            <div className="w-px h-6 bg-[#2a2a3a] mx-1" />

            <button
              onClick={() => {
                if (!output) return;
                const markdown = generateMarkdown(output);
                copyToClipboard(markdown, 'full-markdown');
              }}
              disabled={!output}
              className={`px-4 py-2 text-xs rounded-lg transition-all flex items-center gap-2 ${
                !output
                  ? 'bg-[#1a1a2a]/50 text-gray-600 cursor-not-allowed'
                  : 'bg-[#1a1a2a] hover:bg-[#2a2a3a] text-gray-300'
              }`}
            >
              {copiedSection === 'full-markdown' ? (
                <>
                  <span className="text-green-500">✓</span>
                  コピー済み
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  全体をMarkdownでコピー
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Prompts Modal */}
      <PromptsModal isOpen={showPrompts} onClose={() => setShowPrompts(false)} />

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#141420] rounded-xl border border-[#2a2a3a] w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a3a]">
              <h2 className="text-lg font-medium text-white">履歴</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 hover:bg-[#2a2a3a] rounded transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
              {history.length === 0 ? (
                <p className="text-center text-gray-500 py-8">履歴がありません</p>
              ) : (
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-[#0d0d12] border border-[#2a2a3a] rounded-lg p-4 hover:border-indigo-500/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate mb-1">
                            {entry.input.concept.slice(0, 50)}...
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{new Date(entry.timestamp).toLocaleString('ja-JP')}</span>
                            <span>|</span>
                            <span>{entry.input.genre}</span>
                            <span>|</span>
                            <span>{entry.input.aspectRatio}</span>
                            {entry.generatedImages && entry.generatedImages.length > 0 && (
                              <>
                                <span>|</span>
                                <span className="text-indigo-400">{entry.generatedImages.length}枚の画像</span>
                              </>
                            )}
                            {entry.generatedVideo && (
                              <>
                                <span>|</span>
                                <span className="text-purple-400">動画あり</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadFromHistory(entry)}
                            className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors"
                          >
                            読み込み
                          </button>
                          <button
                            onClick={() => deleteFromHistory(entry.id)}
                            className="px-3 py-1.5 text-xs bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                      {/* サムネイル表示 */}
                      {entry.generatedImages && entry.generatedImages.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {entry.generatedImages.slice(0, 3).map((img, idx) => (
                            <img
                              key={idx}
                              src={img.url}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-16 h-16 object-cover rounded border border-[#2a2a3a]"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* サイドバー開閉ハンドル（常時表示） */}
      <button
        onClick={() => setShowConceptInput((v) => !v)}
        className={`fixed top-1/2 z-40 -translate-y-1/2 bg-[#2a2a3a] hover:bg-[#3a3a4a] text-gray-300 border border-[#2a2a3a] transition-all duration-300 rounded-r-lg px-1.5 py-3 ${
          showConceptInput ? 'left-[380px]' : 'left-0'
        }`}
        title={showConceptInput ? '入力サイドバーを閉じる' : '入力サイドバーを開く'}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showConceptInput ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
        </svg>
      </button>

      {/* 左サイドバー（コンセプト入力 / 画像アップロード） */}
      <aside
        className={`fixed top-0 left-0 h-screen w-[380px] z-30 bg-[#0a0a0f] border-r border-[#2a2a3a] overflow-y-auto pt-[170px] px-4 pb-6 transition-transform duration-300 ${
          showConceptInput ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-4">
            {/* モード切替（サイドバー内） */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('collage')}
                className={`flex-1 py-2 text-xs rounded-lg transition-all ${
                  viewMode === 'collage'
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#1a1a2a] text-gray-400 hover:bg-[#2a2a3a]'
                }`}
              >
                コラージュ生成
              </button>
              <button
                onClick={() => setViewMode('upload')}
                className={`flex-1 py-2 text-xs rounded-lg transition-all ${
                  viewMode === 'upload'
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#1a1a2a] text-gray-400 hover:bg-[#2a2a3a]'
                }`}
              >
                画像アップロード
              </button>
            </div>

            {viewMode === 'upload' && (
              <div className="bg-[#141420] rounded-xl border border-[#2a2a3a] p-5">
                <h2 className="section-title text-base mb-4">画像アップロード</h2>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">画像をアップロード（最大12枚）</span>
                  <span className="text-xs text-gray-500">{collageImages.length}/12</span>
                </div>

                {/* AIによるテーマ提案 */}
                {(isSuggestingTheme || (collageImages.length > 0 && input.concept.trim())) && (
                  <div className="mb-3 p-3 bg-[#0d0d12] border border-indigo-500/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-indigo-400">AI提案テーマ</span>
                      {isSuggestingTheme && (
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          画像を分析中...
                        </span>
                      )}
                    </div>
                    <textarea
                      value={input.concept}
                      onChange={(e) => setInput({ ...input, concept: e.target.value })}
                      placeholder={isSuggestingTheme ? '画像を分析しています...' : 'テーマ（編集可能）'}
                      className="w-full h-16 bg-[#1a1a2a] border border-[#2a2a3a] rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2 mb-3">
                  {collageImages.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square">
                      <img
                        src={img}
                        alt={`Collage ${idx + 1}`}
                        className="w-full h-full object-cover rounded border border-[#2a2a3a]"
                      />
                      <button
                        onClick={() => removeCollageImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      <span className="absolute bottom-1 left-1 text-[10px] text-white bg-black/50 px-1 rounded">
                        {idx + 1}
                      </span>
                    </div>
                  ))}
                  {collageImages.length < 12 && (
                    <label className="aspect-square bg-[#1a1a2a] border border-dashed border-purple-500/30 rounded flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors">
                      <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs text-purple-400 mt-1">追加</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleCollageImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <button
                  onClick={handleGenerateCollage}
                  disabled={collageImages.length === 0 || isGeneratingCollage || isAnalyzingCollage}
                  className={`w-full py-2 text-sm rounded-lg transition-all flex items-center justify-center gap-2 ${
                    collageImages.length === 0 || isGeneratingCollage || isAnalyzingCollage
                      ? 'bg-purple-600/30 text-purple-300/50 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-500'
                  }`}
                >
                  {isGeneratingCollage ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      コラージュ生成中...
                    </>
                  ) : isAnalyzingCollage ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      ストーリーボード作成中...
                    </>
                  ) : (
                    'コラージュを生成 → ストーリーボード作成'
                  )}
                </button>

                {/* コラージュを直接アップロード */}
                <div className="mt-3 pt-3 border-t border-[#2a2a3a]">
                  <label className={`block w-full py-2 text-sm rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isAnalyzingCollage
                      ? 'bg-indigo-600/30 text-indigo-300/50 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {isAnalyzingCollage ? 'ストーリーボード作成中...' : 'コラージュをアップロード → ストーリーボード作成'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadCollageDirect}
                      disabled={isAnalyzingCollage}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Seedance 2.0で動画化 */}
                <button
                  onClick={handleGenerateVideoFromCollage}
                  disabled={isGeneratingVideo || !collageResult}
                  className={`w-full mt-3 py-2.5 text-sm rounded-lg transition-all flex items-center justify-center gap-2 ${
                    isGeneratingVideo || !collageResult
                      ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white/50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500'
                  }`}
                >
                  {isGeneratingVideo ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Seedance 2.0で動画生成中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Seedance 2.0で動画化
                    </>
                  )}
                </button>
              </div>
            )}

            {viewMode === 'collage' && (
            <div className="bg-[#141420] rounded-xl border border-[#2a2a3a] p-5">
              <h2 className="section-title text-base mb-4">コンセプト入力</h2>

              {/* 参照画像 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-gray-400">参照背景画像</label>
                  <button
                    onClick={() => setShowReferenceImages((v) => !v)}
                    className="px-3 py-1 text-xs bg-[#2a2a3a] text-gray-300 rounded hover:bg-[#3a3a4a] transition-colors flex items-center gap-1"
                  >
                    {showReferenceImages ? '非表示' : '表示'}
                  </button>
                </div>
                {showReferenceImages && (
                <>
                <div className="grid grid-cols-2 gap-3">
                  {/* 参照画像 1 */}
                  <div className="relative">
                    <p className="text-xs text-gray-500 mb-1">画像 1</p>
                    {(input.referenceImages || [])[0] ? (
                      <div className="relative group">
                        <img
                          src={(input.referenceImages || [])[0].url}
                          alt="Reference 1"
                          className="w-full aspect-square object-cover rounded-lg border border-[#2a2a3a]"
                        />
                        <button
                          onClick={() => removeReferenceImage(0)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="w-full aspect-square bg-[#0d0d12] border border-dashed border-[#2a2a3a] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors">
                        <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-xs text-gray-500 mt-1">追加</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const url = event.target?.result as string;
                              const updated = [...(input.referenceImages || [])];
                              updated[0] = { url, description: file.name };
                              setInput({ ...input, referenceImages: updated });
                            };
                            reader.readAsDataURL(file);
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* 参照画像 2 */}
                  <div className="relative">
                    <p className="text-xs text-gray-500 mb-1">画像 2</p>
                    {(input.referenceImages || [])[1] ? (
                      <div className="relative group">
                        <img
                          src={(input.referenceImages || [])[1].url}
                          alt="Reference 2"
                          className="w-full aspect-square object-cover rounded-lg border border-[#2a2a3a]"
                        />
                        <button
                          onClick={() => removeReferenceImage(1)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="w-full aspect-square bg-[#0d0d12] border border-dashed border-[#2a2a3a] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors">
                        <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-xs text-gray-500 mt-1">追加</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const url = event.target?.result as string;
                              const updated = [...(input.referenceImages || [])];
                              // 配列を確保
                              while (updated.length < 2) {
                                updated.push({ url: '', description: '' });
                              }
                              updated[1] = { url, description: file.name };
                              setInput({ ...input, referenceImages: updated.filter(img => img.url) });
                            };
                            reader.readAsDataURL(file);
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">スタイル参照用の画像をアップロード</p>
                </>
                )}
              </div>

              {/* メインコンセプト */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  映像コンセプト <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={input.concept}
                  onChange={(e) => setInput({ ...input, concept: e.target.value })}
                  placeholder="例：雨の都市で真実を追う孤独な探偵。フィルム・ノワールの美学で、静かな緊張感を演出したい。"
                  className="w-full h-28 bg-[#0d0d12] border border-[#2a2a3a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* アスペクト比 */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">アスペクト比</label>
                <select
                  value={input.aspectRatio}
                  onChange={(e) => setInput({ ...input, aspectRatio: e.target.value as AspectRatio })}
                  className="w-full bg-[#0d0d12] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  {aspectRatios.map((ar) => (
                    <option key={ar.value} value={ar.value}>
                      {ar.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ムード */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">ムード / 雰囲気</label>
                <input
                  type="text"
                  value={input.mood}
                  onChange={(e) => setInput({ ...input, mood: e.target.value })}
                  placeholder="例：mysterious, melancholic, tense"
                  className="w-full bg-[#0d0d12] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* 追加指示 */}
              <div className="mb-5">
                <label className="block text-sm text-gray-400 mb-2">追加の指示（オプション）</label>
                <textarea
                  value={input.additionalNotes}
                  onChange={(e) => setInput({ ...input, additionalNotes: e.target.value })}
                  placeholder="特定のカメラワーク、照明スタイル、参照作品など..."
                  className="w-full h-20 bg-[#0d0d12] border border-[#2a2a3a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

            </div>
            )}

        </div>
      </aside>

      <main
        style={{ paddingRight: output && showStoryboardSidebar ? storyboardSidebarWidth + 20 : undefined }}
        className={`max-w-[1600px] mx-auto px-4 py-6 transition-[padding] ${showConceptInput ? 'lg:pl-[400px]' : ''}`}
      >
        <div className={`grid grid-cols-1 gap-6 min-w-0 ${output ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* 中央列：コラージュ / 動画 / プレースホルダー */}
          <div className="space-y-4">
            {/* 生成された動画（ストーリーボードがなくても表示） */}
            {generatedVideo && (
              <div className="bg-[#141420] rounded-xl border border-purple-500/50 p-5 h-[640px] overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="section-title text-sm mb-0 text-purple-400">生成された動画</h3>
                  <a
                    href={generatedVideo}
                    download="generated-video.mp4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-500 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    ダウンロード
                  </a>
                </div>
                <video
                  src={generatedVideo}
                  controls
                  autoPlay
                  loop
                  className="w-full rounded-lg border border-purple-500/30"
                />
              </div>
            )}

            {/* 生成されたコラージュ */}
            {collageResult && (
              <div className="bg-[#141420] rounded-xl border border-purple-500/50 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="section-title text-sm mb-0 text-purple-400">コラージュ</h3>
                  <a
                    href={collageResult}
                    download="generated-collage.png"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-500 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    ダウンロード
                  </a>
                </div>
                <img
                  src={collageResult}
                  alt="Generated collage"
                  className="w-full rounded-lg border border-purple-500/30"
                />
                {storyboardPrompt && (
                  <details className="mt-3 bg-[#1a1a2a] rounded-lg border border-indigo-500/30 group">
                    <summary className="cursor-pointer p-3 select-none flex items-center justify-between">
                      <span className="text-xs text-indigo-400">ストーリーボードプロンプト</span>
                      <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <p className="px-3 pb-3 text-xs text-gray-300 leading-relaxed">{storyboardPrompt}</p>
                  </details>
                )}
              </div>
            )}

            {!generatedVideo && !collageResult && (
              <div className="bg-[#141420] rounded-xl border border-[#2a2a3a] p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1a1a2a] flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500">左側でコラージュを作成してください</p>
                <p className="text-xs text-gray-600 mt-2">画像アップロードまたはプロンプト入力で生成</p>
              </div>
            )}
          </div>

          {/* 右列：解析結果 (output) */}
          {output && (
            <div className="space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
                {/* 著作権警告バナー */}
                {copyrightWarnings.length > 0 && (
                  <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-amber-500 text-lg">⚠</span>
                      <div>
                        <p className="text-sm font-medium text-amber-400 mb-2">著作権保護: 自動変換が適用されました</p>
                        <ul className="space-y-1">
                          {copyrightWarnings.map((warning, idx) => (
                            <li key={idx} className="text-xs text-amber-300/80">{warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. GPT Image 2 キーフレームプロンプト */}
                <details open className="bg-[#141420] rounded-xl border border-[#2a2a3a] group h-[640px] overflow-y-auto">
                  <summary className="cursor-pointer p-5 select-none flex items-center justify-between">
                    <h3 className="section-title text-sm mb-0">キーフレーム</h3>
                    <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-5">
                  <div className="flex items-center justify-end gap-2 mb-3">
                    <button
                      onClick={() => setShowKeyframePrompts((v) => !v)}
                      className="px-3 py-1.5 text-xs bg-[#2a2a3a] hover:bg-[#3a3a4a] text-gray-300 rounded transition-colors"
                    >
                      {showKeyframePrompts ? 'プロンプト非表示' : 'プロンプト表示'}
                    </button>
                    <button
                      onClick={handleGenerateImages}
                      disabled={isGeneratingImages}
                      className={`px-4 py-2 text-xs rounded-lg transition-all flex items-center gap-2 ${
                        isGeneratingImages
                          ? 'bg-indigo-600/50 text-white/70 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-500'
                      }`}
                    >
                      {isGeneratingImages ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          生成中 ({imageGenerationProgress}/{output.keyframePrompts.length})
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          画像を生成
                        </>
                      )}
                    </button>
                  </div>

                  {/* キーフレーム: 画像とプロンプトを横並び */}
                  <div className="space-y-3">
                    {output.keyframePrompts.map((kf, idx) => {
                      const img = generatedImages[idx];
                      return (
                        <div key={idx} className="flex gap-3 items-start">
                          {/* 左: 画像 */}
                          <div className={`${showKeyframePrompts ? 'w-32 shrink-0' : 'flex-1'} relative`}>
                            {img?.url ? (
                              <div className="relative group">
                                <img
                                  src={img.url}
                                  alt={`Generated keyframe ${idx + 1}`}
                                  className="w-full rounded-lg border border-[#2a2a3a]"
                                />
                                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-white">
                                  Image {idx + 1}
                                </div>
                                <a
                                  href={img.url}
                                  download={`keyframe-${idx + 1}.png`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="absolute top-1 right-1 p-1 bg-black/70 rounded hover:bg-black/90 transition-colors opacity-0 group-hover:opacity-100"
                                  title="ダウンロード"
                                >
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                </a>
                              </div>
                            ) : img && img.url === '' ? (
                              <div className="aspect-video bg-red-900/20 border border-red-500/30 rounded-lg flex items-center justify-center">
                                <span className="text-[10px] text-red-400">生成失敗</span>
                              </div>
                            ) : (
                              <div className="aspect-video bg-[#0d0d12] border border-dashed border-[#2a2a3a] rounded-lg flex items-center justify-center">
                                <span className="text-[10px] text-gray-600">Image {idx + 1}</span>
                              </div>
                            )}
                          </div>
                          {/* 右: プロンプト */}
                          {showKeyframePrompts && (
                            <div className="prompt-block p-3 flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-indigo-400">Image {kf.shotNumber}</span>
                                <CopyButton text={kf.prompt} section={`keyframe-${idx}`} />
                              </div>
                              <p className="text-xs text-gray-300 leading-relaxed">{kf.prompt}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  </div>
                </details>

                {/* 1. クリエイティブな解釈 */}
                <details className="bg-[#141420] rounded-xl border border-[#2a2a3a] group">
                  <summary className="cursor-pointer p-5 select-none flex items-center justify-between">
                    <h3 className="section-title text-sm mb-0">1. クリエイティブな解釈</h3>
                    <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-5">
                    <div className="flex items-center justify-end mb-3">
                      <CopyButton text={output.creativeInterpretation} section="interpretation" />
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{output.creativeInterpretation}</p>
                  </div>
                </details>

                {/* 2. 15秒ショットプラン */}
                <details className="bg-[#141420] rounded-xl border border-[#2a2a3a] group">
                  <summary className="cursor-pointer p-5 select-none flex items-center justify-between">
                    <h3 className="section-title text-sm mb-0">2. 15秒ショットプラン</h3>
                    <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-5 space-y-3">
                    {output.shotPlan.map((shot, idx) => (
                      <div key={idx} className={`shot-card-${idx + 1} rounded-lg p-4`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-400">{shot.timeRange}</span>
                            <span className="px-2 py-0.5 bg-white/10 rounded text-xs text-white">{shot.beatName}</span>
                          </div>
                          <div className="flex gap-2 text-xs text-gray-500">
                            <span>{shot.shotType}</span>
                            <span>|</span>
                            <span>{shot.cameraMovement}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-200">{shot.action}</p>
                        <p className="text-xs text-gray-500 mt-1">{shot.description}</p>
                      </div>
                    ))}
                  </div>
                </details>

                {/* 5. SEEDANCE 2.0 最終ビデオプロンプト */}
                <details className="bg-[#141420] rounded-xl border border-indigo-500/30 group">
                  <summary className="cursor-pointer p-5 select-none flex items-center justify-between">
                    <h3 className="section-title text-sm mb-0">3. SEEDANCE 2.0 最終プロンプト</h3>
                    <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-5">
                    <div className="flex items-center justify-end gap-2 mb-3">
                      <CopyButton text={output.seedancePrompt} section="seedance" />
                      <button
                        onClick={handleGenerateVideo}
                        disabled={isGeneratingVideo || generatedImages.length === 0}
                        className={`px-4 py-1.5 text-xs rounded-md transition-all flex items-center gap-2 ${
                          isGeneratingVideo || generatedImages.length === 0
                            ? 'bg-purple-600/50 text-white/70 cursor-not-allowed'
                            : 'bg-purple-600 text-white hover:bg-purple-500'
                        }`}
                      >
                        {isGeneratingVideo ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            生成中...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            動画を生成
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-lg p-4">
                      <p className="text-sm text-gray-200 leading-relaxed font-mono">{output.seedancePrompt}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {generatedImages.length === 0
                        ? '※ 先に「画像を生成」ボタンで画像を生成してください'
                        : '※ 生成した画像を使って動画を生成します'}
                    </p>
                  </div>
                </details>

                {/* 6. 一貫性ロック */}
                <details className="bg-[#141420] rounded-xl border border-[#2a2a3a] group">
                  <summary className="cursor-pointer p-5 select-none flex items-center justify-between">
                    <h3 className="section-title text-sm mb-0">4. 一貫性ロック（Identity Lock）</h3>
                    <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-[#0d0d12] rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">被写体</p>
                      <p className="text-gray-300">{output.identityLock.subject}</p>
                    </div>
                    <div className="bg-[#0d0d12] rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">衣装</p>
                      <p className="text-gray-300">{output.identityLock.costume}</p>
                    </div>
                    <div className="bg-[#0d0d12] rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">環境</p>
                      <p className="text-gray-300">{output.identityLock.environment}</p>
                    </div>
                    <div className="bg-[#0d0d12] rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">カラーパレット</p>
                      <div className="flex gap-1 mt-1">
                        {output.identityLock.colorPalette.map((color, idx) => (
                          <div
                            key={idx}
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </details>

                {/* 7. 肯定的な制約 */}
                <details className="bg-[#141420] rounded-xl border border-[#2a2a3a] group">
                  <summary className="cursor-pointer p-5 select-none flex items-center justify-between">
                    <h3 className="section-title text-sm mb-0">5. 肯定的な制約</h3>
                    <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <ul className="px-5 pb-5 space-y-2">
                    {output.positiveConstraints.map((constraint, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span className="text-gray-300">{constraint}</span>
                      </li>
                    ))}
                  </ul>
                </details>

                {/* 8. アドバイス/推奨事項 */}
                <details className="bg-[#141420] rounded-xl border border-amber-500/30 group">
                  <summary className="cursor-pointer p-5 select-none flex items-center justify-between">
                    <h3 className="section-title text-sm mb-0">6. アドバイス / 推奨事項</h3>
                    <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <ul className="px-5 pb-5 space-y-2">
                    {output.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-amber-500 mt-0.5">💡</span>
                        <span className="text-gray-300">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </details>

              </div>
          )}
        </div>

      </main>

      {/* 右サイドバー: 画像付きストーリーボード */}
      {output && (
        <>
          {/* 開閉ハンドル */}
          <button
            onClick={() => setShowStoryboardSidebar((v) => !v)}
            style={{ right: showStoryboardSidebar ? storyboardSidebarWidth : 0 }}
            className="fixed top-1/2 z-40 -translate-y-1/2 bg-[#2a2a3a] hover:bg-[#3a3a4a] text-gray-300 border border-[#2a2a3a] transition-[background-color] rounded-l-lg px-1.5 py-3"
            title={showStoryboardSidebar ? 'ストーリーボードを閉じる' : 'ストーリーボードを開く'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showStoryboardSidebar ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
            </svg>
          </button>

          {/* リサイズハンドル */}
          {showStoryboardSidebar && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                isResizingRef.current = true;
                document.body.style.cursor = 'ew-resize';
                document.body.style.userSelect = 'none';
              }}
              style={{ right: storyboardSidebarWidth - 2 }}
              className="fixed top-0 h-screen w-1 z-40 cursor-ew-resize bg-transparent hover:bg-purple-500/40 transition-colors"
              title="ドラッグでサイズ変更"
            />
          )}

          <aside
            style={{ width: storyboardSidebarWidth }}
            className={`fixed top-0 right-0 h-screen z-30 bg-[#0a0a0f] border-l border-[#2a2a3a] overflow-y-auto pt-[170px] px-4 pb-6 transition-transform duration-300 ${
              showStoryboardSidebar ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="bg-[#141420] rounded-xl border border-[#2a2a3a] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title text-base mb-0">画像付きストーリーボード</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewMode(previewMode === '6panel' ? '3panel' : '6panel')}
                    className="px-3 py-1.5 text-xs bg-[#2a2a3a] text-gray-300 rounded hover:bg-[#3a3a4a] transition-colors"
                  >
                    {previewMode === '6panel' ? '3パネル' : '6パネル'}
                  </button>
                </div>
              </div>
              {isAnalyzingCollage && (
                <div className="mb-3 px-3 py-1.5 text-xs bg-indigo-600/20 text-indigo-300 rounded flex items-center gap-2">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  画像生成中 ({generatedImages.length}/{output.keyframePrompts.length})
                </div>
              )}
              {previewMode === '6panel' ? (
                <StoryboardPreview
                  output={output}
                  title={input.concept.slice(0, 30) || 'UNTITLED PROJECT'}
                  genre={genres.find(g => g.value === input.genre)?.label || 'Cinematic'}
                  tagline="The story unfolds in 15 seconds."
                  generatedImages={generatedImages}
                />
              ) : (
                <StoryboardPreview3Panel
                  output={output}
                  title={input.concept.slice(0, 30) || 'UNTITLED PROJECT'}
                  genre={genres.find(g => g.value === input.genre)?.label || 'Cinematic'}
                  tagline="The story unfolds in 15 seconds."
                  generatedImages={generatedImages}
                />
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

// Markdown生成関数
function generateMarkdown(output: StoryboardOutput): string {
  return `# AI Storyboard Director Output

## 1. クリエイティブな解釈
${output.creativeInterpretation}

## 2. 15秒ショットプラン

${output.shotPlan.map((shot, idx) => `### Shot ${idx + 1}: ${shot.beatName} (${shot.timeRange})
- **アクション:** ${shot.action}
- **カメラ:** ${shot.cameraMovement} / ${shot.shotType}
- **照明:** ${shot.lighting}
- **説明:** ${shot.description}
`).join('\n')}

## 3. GPT Image 2 キーフレームプロンプト

${output.keyframePrompts.map(kf => `### Image ${kf.shotNumber}
\`\`\`
${kf.prompt}
\`\`\`
`).join('\n')}

## 4. ストーリーボードシートプロンプト
\`\`\`
${output.storyboardSheetPrompt}
\`\`\`

## 5. SEEDANCE 2.0 最終ビデオプロンプト
\`\`\`
${output.seedancePrompt}
\`\`\`

## 6. 一貫性ロック（Identity Lock）
- **被写体:** ${output.identityLock.subject}
- **衣装:** ${output.identityLock.costume}
- **環境:** ${output.identityLock.environment}
- **カラーパレット:** ${output.identityLock.colorPalette.join(', ')}

## 7. 肯定的な制約
${output.positiveConstraints.map(c => `- ${c}`).join('\n')}

## 8. アドバイス / 推奨事項
${output.recommendations.map(r => `- ${r}`).join('\n')}

---
*Generated by AI Storyboard Director*
`;
}
