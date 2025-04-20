'use client';

import { useState } from 'react';

interface MedicalAnalysisProps {
  transcription: string;
}

export default function MedicalAnalysis({ transcription }: MedicalAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [customPrompt, setCustomPrompt] = useState('Based on the dictation, what key points should the patient be educated about? Include lifestyle modificat');
  const [customContext, setCustomContext] = useState('This is a medical dictation that needs analysis for patient education points');

  const analyzeTranscription = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          transcription,
          prompt: customPrompt,
          context: customContext
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze transcription');
      }

      const result = await response.json();
      setAnalysisResult(result.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Medical Analysis Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold mb-6">Medical Analysis</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium mb-2">Patient Summary</h3>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium mb-2">Risk Factors</h3>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium mb-2">Treatment Plan</h3>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium mb-2">Patient Education</h3>
          </div>
        </div>
      </div>

      {/* Custom Analysis Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold mb-6">Custom Analysis</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Analysis Prompt
            </label>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Context (Optional)
            </label>
            <textarea
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>
          <button
            onClick={analyzeTranscription}
            disabled={isLoading}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Dictation'}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {analysisResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm text-gray-700">
              {analysisResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 