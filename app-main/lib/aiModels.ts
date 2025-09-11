export const MODELS = ['gpt-3.5-turbo', 'gpt-4o', 'gpt-4-turbo'] as const
export type Model = typeof MODELS[number]
export const DEFAULT_MODEL: Model = 'gpt-4o'
export const PRICE_LABELS: Record<Model, { label: string; color: string }> = {
  'gpt-3.5-turbo': { label: 'costleast',  color: 'text-green-600'  },
  'gpt-4o':        { label: 'costing',    color: 'text-yellow-600' },
  'gpt-4-turbo':   { label: 'costiest',   color: 'text-red-600'    }, // ⇠ most expensive
}
