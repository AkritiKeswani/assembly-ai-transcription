'use client';

import { useState } from 'react';
import { TranscriptionForm } from "@/components/transcription-form"
import MedicalAnalysis from '@/components/MedicalAnalysis';

export default function Home() {
  const [transcriptionText, setTranscriptionText] = useState('');

  const handleTranscriptionComplete = (text: string) => {
    setTranscriptionText(text);
  };

  return (
    <main className="min-h-screen bg-white py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-medium text-gray-900 mb-1">Doctors.fyi Playground</h1>
          <p className="text-sm text-gray-500">Powered by AssemblyAI</p>
        </div>
        
        <TranscriptionForm onTranscriptionComplete={handleTranscriptionComplete} />
        
        {transcriptionText && (
          <div className="mt-8">
            <MedicalAnalysis transcription={transcriptionText} />
          </div>
        )}
      </div>
    </main>
  );
}
