import { createTemplate } from '@/lib/sampleVault'

interface TemplateZoneProps {
  onGenerate: (data: any) => void
}

export default function TemplateZone({ onGenerate }: TemplateZoneProps) {
  const handleGenerate = () => {
    const templateData = createTemplate()
    onGenerate(templateData)
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="text-gray-600">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold mb-2">Start with a Template</h3>
          <p className="text-sm text-gray-500 mb-4">
            Generate a sample vault to explore the diagram functionality
          </p>
        </div>
        <button
          onClick={handleGenerate}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Generate Beginner Template
        </button>
      </div>
    </div>
  )
}
