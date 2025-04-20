"use client"

import { useState } from "react"
import { analyzeLemur } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

const PRESET_ANALYSES = [
  {
    name: "Patient Summary",
    prompt: "Extract and summarize the key patient information including age, gender, symptoms, and medical history mentioned in this dictation",
    context: "This is a medical dictation that needs to be analyzed for patient information"
  },
  {
    name: "Risk Factors",
    prompt: "List all risk factors mentioned in this dictation (e.g., smoking, family history, lifestyle factors)",
    context: "This is a medical dictation that needs analysis of patient risk factors"
  },
  {
    name: "Treatment Plan",
    prompt: "Extract and summarize the treatment plan, medications, and follow-up recommendations mentioned in this dictation",
    context: "This is a medical dictation that needs analysis of treatment recommendations"
  },
  {
    name: "Patient Education",
    prompt: "Based on the dictation, what key points should the patient be educated about? Include lifestyle modifications and warning signs to watch for",
    context: "This is a medical dictation that needs analysis for patient education points"
  }
]

interface LemurAnalysisProps {
  transcriptId: string
}

export function LemurAnalysis({ transcriptId }: LemurAnalysisProps) {
  const [prompt, setPrompt] = useState("")
  const [context, setContext] = useState("")
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePresetAnalysis = async (preset: typeof PRESET_ANALYSES[number]) => {
    setPrompt(preset.prompt)
    setContext(preset.context)
    handleAnalysis(null, preset.prompt, preset.context)
  }

  const handleAnalysis = async (
    e: React.FormEvent | null,
    customPrompt?: string,
    customContext?: string
  ) => {
    if (e) e.preventDefault()
    
    const finalPrompt = customPrompt || prompt
    const finalContext = customContext || context

    if (!finalPrompt) {
      setError("Please enter a prompt")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await analyzeLemur(transcriptId, finalPrompt, finalContext)
      setAnalysis(result.response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze dictation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Medical Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PRESET_ANALYSES.map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              onClick={() => handlePresetAnalysis(preset)}
              disabled={loading}
              className="justify-start"
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Custom Analysis</h2>
        <form onSubmit={(e) => handleAnalysis(e)} className="space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium mb-1">
              Analysis Prompt
            </label>
            <Input
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., What are the key symptoms and their severity?"
              className="w-full"
            />
          </div>
          
          <div>
            <label htmlFor="context" className="block text-sm font-medium mb-1">
              Additional Context (Optional)
            </label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Add any specific context for the analysis"
              className="w-full"
            />
          </div>

          <Button type="submit" disabled={loading || !prompt}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Dictation"
            )}
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-4 text-sm text-red-600 bg-red-50 rounded-lg">
            {error}
          </div>
        )}

        {analysis && (
          <div className="mt-6">
            <h3 className="text-md font-medium mb-2">Analysis Result</h3>
            <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
              {analysis}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
} 