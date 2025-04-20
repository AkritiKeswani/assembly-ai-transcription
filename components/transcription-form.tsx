"use client"

import type React from "react"
import { useState } from "react"
import { Loader2, Upload, ExternalLink } from "lucide-react"
import { transcribeAudio } from "@/app/actions"

export function TranscriptionForm() {
  const [file, setFile] = useState<File | null>(null)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    setTranscript(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError("Please select an audio file")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        const base64Audio = reader.result?.toString().split(",")[1]

        if (!base64Audio) {
          throw new Error("Failed to convert file to base64")
        }

        const result = await transcribeAudio(base64Audio)

        if (result.error) {
          setError(result.error)
        } else {
          setTranscript(result.transcript || null)
        }

        setLoading(false)
      }

      reader.onerror = () => {
        setError("Failed to read file")
        setLoading(false)
      }
    } catch (err) {
      setError("An unexpected error occurred during transcription")
      setLoading(false)
      console.error(err)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col space-y-1 mb-4">
              <h2 className="text-lg font-medium text-gray-900">Upload Audio</h2>
              <p className="text-sm text-gray-500">Upload an audio file to transcribe using AssemblyAI</p>
            </div>

            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="audio-file"
                className="flex flex-col items-center justify-center w-full h-32 border border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-6 h-6 mb-2 text-gray-400" />
                  <p className="mb-1 text-sm text-gray-500">
                    <span className="font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">MP3, WAV, M4A, MP4, or other audio files</p>
                </div>
                <input
                  id="audio-file"
                  type="file"
                  accept="audio/*,video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {file && (
              <div className="mt-3">
                <p className="text-sm text-gray-500">
                  Selected: <span className="font-medium">{file.name}</span>
                </p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                loading || !file
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
              disabled={!file || loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Transcribing...
                </span>
              ) : (
                "Transcribe Audio"
              )}
            </button>
          </div>
        </div>

        {error && <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">{error}</div>}

        {transcript && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col space-y-1 mb-4">
                <h2 className="text-lg font-medium text-gray-900">Transcript</h2>
                <p className="text-sm text-gray-500">Generated transcript from your audio file</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mb-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{transcript}</p>
              </div>

              <div className="mt-4 text-center">
                <a
                  href="https://www.assemblyai.com/docs/api-reference/lemur/task"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                  Learn more about AssemblyAI's LeMUR for transcript analysis
                  <ExternalLink className="ml-1 w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
