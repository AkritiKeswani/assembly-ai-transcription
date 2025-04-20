"use server"

interface TranscriptionResponse {
  transcript?: string
  error?: string
  transcript_id?: string
}

export async function transcribeAudio(base64Audio: string): Promise<TranscriptionResponse> {
  try {
    // Convert base64 to binary
    const binaryData = Buffer.from(base64Audio, "base64")

    // First, upload the audio file to AssemblyAI
    const uploadResponse = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: {
        Authorization: `${process.env.ASSEMBLY_AI_API_KEY}`,
        "Content-Type": "application/octet-stream", // Important: use octet-stream for binary data
      },
      body: binaryData, // Send the binary data directly, not as JSON
    })

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json()
      console.error("Upload error:", errorData)
      return { error: `Failed to upload audio: ${errorData.error || "Unknown error"}` }
    }

    const uploadData = await uploadResponse.json()
    const audioUrl = uploadData.upload_url

    // Then, submit the transcription request
    const transcriptResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        Authorization: `${process.env.ASSEMBLY_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: audioUrl,
      }),
    })

    if (!transcriptResponse.ok) {
      const errorData = await transcriptResponse.json()
      console.error("Transcription request error:", errorData)
      return { error: `Failed to request transcription: ${errorData.error || "Unknown error"}` }
    }

    const transcriptData = await transcriptResponse.json()
    const transcriptId = transcriptData.id

    // Poll for the transcription result
    let result = { status: "processing" }
    while (result.status !== "completed" && result.status !== "error") {
      // Wait for 1 second before polling again
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const pollingResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          Authorization: `${process.env.ASSEMBLY_AI_API_KEY}`,
        },
      })

      if (!pollingResponse.ok) {
        const errorData = await pollingResponse.json()
        console.error("Polling error:", errorData)
        return { error: `Failed to get transcription status: ${errorData.error || "Unknown error"}` }
      }

      result = await pollingResponse.json()

      if (result.status === "error") {
        return { error: `Transcription failed: ${result.error || "Unknown error"}` }
      }
    }

    return {
      transcript: result.text,
      transcript_id: transcriptId,
    }
  } catch (error) {
    console.error("Transcription error:", error)
    return { error: "An unexpected error occurred during transcription" }
  }
}
