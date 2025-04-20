'use client';

import { TranscriptionForm } from "@/components/transcription-form"

export default function Home() {
  return (
    <main className="min-h-screen bg-white py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-medium text-gray-900 mb-1">Doctors.fyi Playground</h1>
          <p className="text-sm text-gray-500">Powered by AssemblyAI</p>
        </div>
        
        <TranscriptionForm />
      </div>
    </main>
  );
}
