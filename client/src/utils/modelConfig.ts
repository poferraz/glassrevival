// Minimal model config shim to satisfy imports and provide app defaults.
export type LLMModel = {
  id: string;
  name: string;
  description?: string;
  provider?: string;
  free?: boolean;
};

export const AVAILABLE_MODELS: LLMModel[] = [
  {
    id: 'x-ai/grok-4-fast:free',
    name: 'Grok 4 Fast (Free)',
    description: 'Fast and capable Grok model from xAI',
    provider: 'openrouter',
    free: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast general-purpose model',
    provider: 'openrouter',
    free: true,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Cost-effective conversational model',
    provider: 'openrouter',
    free: true,
  },
];

const SELECTED_KEY = 'selected_model_id';

export function getSelectedModel(): string {
  if (typeof window === 'undefined') return AVAILABLE_MODELS[0].id;
  return localStorage.getItem(SELECTED_KEY) || AVAILABLE_MODELS[0].id;
}

export function setSelectedModel(id: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SELECTED_KEY, id);
}

export default AVAILABLE_MODELS;
