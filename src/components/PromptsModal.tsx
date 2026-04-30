'use client';

import { useState } from 'react';
import { defaultTemplates } from '@/prompts/templates';
import { genrePresets } from '@/prompts/genrePresets';
import { systemPrompts } from '@/prompts/systemPrompts';
import type { Genre } from '@/types/storyboard';

interface PromptsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'templates' | 'genres' | 'system';

export function PromptsModal({ isOpen, onClose }: PromptsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [selectedGenre, setSelectedGenre] = useState<Genre>('cinematic');

  if (!isOpen) return null;

  const tabs: { id: TabType; label: string }[] = [
    { id: 'templates', label: 'Templates' },
    { id: 'genres', label: 'Genre Presets' },
    { id: 'system', label: 'System Prompts' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#141420] border border-[#2a2a3a] rounded-xl w-full max-w-4xl mx-4 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a3a]">
          <h2 className="text-lg font-semibold text-white">Prompt Configuration</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2a2a3a]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-indigo-400 border-b-2 border-indigo-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'templates' && <TemplatesTab />}
          {activeTab === 'genres' && (
            <GenresTab
              selectedGenre={selectedGenre}
              onSelectGenre={setSelectedGenre}
            />
          )}
          {activeTab === 'system' && <SystemPromptsTab />}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-5 border-t border-[#2a2a3a]">
          <p className="text-xs text-gray-500">
            プロンプトは src/prompts/ ディレクトリで編集できます
          </p>
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

// -----------------------------------------
// Templates Tab
// -----------------------------------------
function TemplatesTab() {
  return (
    <div className="space-y-6">
      {/* GPT Image Templates */}
      <div>
        <h3 className="text-sm font-medium text-indigo-400 mb-3">GPT Image 2 Templates</h3>
        <div className="space-y-3">
          <TemplateBlock
            label="Keyframe Template"
            value={defaultTemplates.gptImage.keyframe}
            variables={['shotType', 'action', 'lighting', 'style', 'aspectRatio']}
          />
          <TemplateBlock
            label="Storyboard Sheet Template"
            value={defaultTemplates.gptImage.storyboardSheet}
            variables={['genre', 'panelDescriptions']}
          />
          <div className="bg-[#0d0d12] rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-2">Style Modifiers</p>
            <div className="flex flex-wrap gap-1">
              {defaultTemplates.gptImage.styleModifiers.map((mod, idx) => (
                <span key={idx} className="px-2 py-1 bg-[#1a1a2a] rounded text-xs text-gray-300">
                  {mod}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Seedance Templates */}
      <div>
        <h3 className="text-sm font-medium text-purple-400 mb-3">Seedance 2.0 Templates</h3>
        <div className="space-y-3">
          <TemplateBlock
            label="Style Consistency Template"
            value={defaultTemplates.seedance.styleConsistency}
            variables={['style', 'cameraStyle']}
          />
          <div className="bg-[#0d0d12] rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-2">Transition Phrases</p>
            <div className="flex flex-wrap gap-1">
              {defaultTemplates.seedance.transitionPhrases.map((phrase, idx) => (
                <span key={idx} className="px-2 py-1 bg-[#1a1a2a] rounded text-xs text-gray-300">
                  {phrase}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Shot Plan Templates */}
      <div>
        <h3 className="text-sm font-medium text-pink-400 mb-3">Shot Plan Templates</h3>
        <div className="space-y-3">
          <TemplateBlock
            label="Setup (0-5s)"
            value={defaultTemplates.shotPlan.setup}
            variables={['environment', 'mood']}
          />
          <TemplateBlock
            label="Escalation (5-10s)"
            value={defaultTemplates.shotPlan.escalation}
            variables={['subject', 'action']}
          />
          <TemplateBlock
            label="Hook (10-15s)"
            value={defaultTemplates.shotPlan.hook}
            variables={['subject']}
          />
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------
// Genres Tab
// -----------------------------------------
function GenresTab({
  selectedGenre,
  onSelectGenre,
}: {
  selectedGenre: Genre;
  onSelectGenre: (genre: Genre) => void;
}) {
  const genres = Object.keys(genrePresets) as Genre[];
  const preset = genrePresets[selectedGenre];

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Genre List */}
      <div className="space-y-1">
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => onSelectGenre(genre)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedGenre === genre
                ? 'bg-indigo-600 text-white'
                : 'bg-[#0d0d12] text-gray-400 hover:bg-[#1a1a2a]'
            }`}
          >
            {genrePresets[genre].name}
          </button>
        ))}
      </div>

      {/* Preset Details */}
      <div className="col-span-2 space-y-4">
        <div className="bg-[#0d0d12] rounded-lg p-4">
          <h4 className="text-white font-medium mb-1">{preset.name}</h4>
          <p className="text-sm text-gray-400">{preset.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0d0d12] rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-2">Color Palette</p>
            <div className="flex gap-1">
              {preset.colorTones.map((color, idx) => (
                <div
                  key={idx}
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="bg-[#0d0d12] rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-2">Lighting</p>
            <div className="flex flex-wrap gap-1">
              {preset.lighting.map((light, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-[#1a1a2a] rounded text-xs text-gray-300">
                  {light}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#0d0d12] rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-2">Camera Style</p>
          <p className="text-sm text-gray-300">{preset.cameraStyle}</p>
        </div>

        <div className="bg-[#0d0d12] rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-2">Keywords</p>
          <div className="flex flex-wrap gap-1">
            {preset.keywords.map((kw, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-xs">
                {kw}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-[#0d0d12] rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-2">Music Style</p>
          <p className="text-sm text-gray-300">{preset.musicStyle}</p>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------
// System Prompts Tab
// -----------------------------------------
function SystemPromptsTab() {
  const prompts = [
    { label: 'GPT Image 2 / Storyboard Director', key: 'gptImage', color: 'emerald' },
    { label: 'Seedance 2.0', key: 'seedance', color: 'purple' },
    { label: 'Keyframe Template', key: 'keyframeTemplate', color: 'blue' },
    { label: 'Seedance Template', key: 'seedanceTemplate', color: 'pink' },
    { label: 'Consistency Lock', key: 'consistencyLock', color: 'cyan' },
    { label: 'Copyright Filter', key: 'copyrightFilter', color: 'amber' },
  ] as const;

  return (
    <div className="space-y-4">
      {prompts.map((prompt) => (
        <div key={prompt.key} className="bg-[#0d0d12] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-2 h-2 rounded-full bg-${prompt.color}-500`} />
            <h4 className="text-sm font-medium text-white">{prompt.label} System Prompt</h4>
          </div>
          <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono bg-[#0a0a0f] p-3 rounded max-h-48 overflow-y-auto">
            {systemPrompts[prompt.key]}
          </pre>
        </div>
      ))}

      <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-lg p-4">
        <h4 className="text-sm font-medium text-indigo-300 mb-2">Prompt Optimization Guide</h4>
        <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
          {systemPrompts.optimizationGuide}
        </pre>
      </div>
    </div>
  );
}

// -----------------------------------------
// Template Block Component
// -----------------------------------------
function TemplateBlock({
  label,
  value,
  variables,
}: {
  label: string;
  value: string;
  variables: string[];
}) {
  return (
    <div className="bg-[#0d0d12] rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500">{label}</p>
        <div className="flex gap-1">
          {variables.map((v) => (
            <span key={v} className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[10px]">
              {`{${v}}`}
            </span>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-300 font-mono leading-relaxed">{value}</p>
    </div>
  );
}
