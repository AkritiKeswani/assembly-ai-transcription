'use client';

import { useState } from 'react';

interface MedicalAnalysisProps {
  transcription: string;
}

export default function MedicalAnalysis({ transcription }: MedicalAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [icdCode, setIcdCode] = useState('');

  const generateIcdCode = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate-icd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcription }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate ICD-10 code');
      }

      const result = await response.json();
      setIcdCode(result.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col space-y-4">
        <button
          onClick={generateIcdCode}
          disabled={isLoading}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            isLoading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-900 text-white hover:bg-gray-800"
          }`}
        >
          {isLoading ? 'Generating...' : 'Generate ICD-10 Code'}
        </button>

        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {icdCode && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {icdCode}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 