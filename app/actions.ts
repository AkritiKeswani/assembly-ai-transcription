"use server"

interface TranscriptionResponse {
  transcript?: string
  error?: string
  transcript_id?: string
}

interface AssemblyAIResponse {
  status: string
  error?: string
  text?: string
  id?: string
}

interface LemurResponse {
  request_id: string
  response: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

export async function transcribeAudio(base64Audio: string): Promise<TranscriptionResponse> {
  try {
    // Check if API key is available
    if (!process.env.ASSEMBLY_AI_API_KEY) {
      console.error("AssemblyAI API key is missing")
      return { error: "API key is not configured" }
    }

    // Convert base64 to binary
    const binaryData = Buffer.from(base64Audio, "base64")

    // First, upload the audio file to AssemblyAI
    const uploadResponse = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: {
        Authorization: process.env.ASSEMBLY_AI_API_KEY,
        "Content-Type": "application/octet-stream",
      },
      body: binaryData,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error("Upload error response:", errorText)
      return { error: `Failed to upload audio: ${errorText}` }
    }

    const uploadData = await uploadResponse.json()
    const audioUrl = uploadData.upload_url

    // Then, submit the transcription request
    const transcriptResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        Authorization: process.env.ASSEMBLY_AI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: audioUrl,
      }),
    })

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text()
      console.error("Transcription request error:", errorText)
      return { error: `Failed to request transcription: ${errorText}` }
    }

    const transcriptData = await transcriptResponse.json()
    const transcriptId = transcriptData.id

    // Poll for the transcription result
    let result: AssemblyAIResponse = { status: "processing" }
    while (result.status !== "completed" && result.status !== "error") {
      // Wait for 1 second before polling again
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const pollingResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          Authorization: process.env.ASSEMBLY_AI_API_KEY,
        },
      })

      if (!pollingResponse.ok) {
        const errorText = await pollingResponse.text()
        console.error("Polling error:", errorText)
        return { error: `Failed to get transcription status: ${errorText}` }
      }

      result = await pollingResponse.json()

      if (result.status === "error") {
        console.error("Transcription failed:", result)
        return { error: `Transcription failed: ${result.error || "Unknown error"}` }
      }
    }

    return {
      transcript: result.text,
      transcript_id: transcriptId,
    }
  } catch (error) {
    console.error("Transcription error:", error)
    return { error: `An unexpected error occurred during transcription: ${error instanceof Error ? error.message : "Unknown error"}` }
  }
}

export async function analyzeLemur(
  transcript_id: string,
  prompt: string,
  context?: string
): Promise<LemurResponse> {
  try {
    const response = await fetch("https://api.assemblyai.com/lemur/v3/generate/task", {
      method: "POST",
      headers: {
        Authorization: `${process.env.ASSEMBLY_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        final_model: "anthropic/claude-3-sonnet",
        prompt,
        context,
        transcript_ids: [transcript_id],
        temperature: 0,
        max_output_size: 3000,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`LeMUR analysis failed: ${error.error || "Unknown error"}`)
    }

    return response.json()
  } catch (error) {
    console.error("LeMUR analysis error:", error)
    throw error
  }
}
