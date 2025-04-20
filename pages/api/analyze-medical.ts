import type { NextApiRequest, NextApiResponse } from 'next';
import { load } from '@tensorflow-models/universal-sentence-encoder';

// Load ICD-10 codes
const icd10Codes = {
  "E083311": "Diabetes mellitus due to underlying condition with moderate nonproliferative diabetic retinopathy with macular edema, right eye",
  "E083312": "Diabetes mellitus due to underlying condition with moderate nonproliferative diabetic retinopathy with macular edema, left eye",
  "E083313": "Diabetes mellitus due to underlying condition with moderate nonproliferative diabetic retinopathy with macular edema, bilateral",
  // ... add more codes as needed
};

interface AnalysisResult {
  summary: string;
  icd10Codes: Array<{
    code: string;
    description: string;
    confidence: string;
    keyTerms: string[];
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalysisResult | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { transcription } = req.body;
  if (!transcription) {
    return res.status(400).json({ error: 'No transcription provided' });
  }

  try {
    // Generate patient summary
    const summary = generatePatientSummary(transcription);

    // Find relevant ICD-10 codes
    const icd10Results = await analyzeForICD10Codes(transcription);

    return res.status(200).json({
      summary,
      icd10Codes: icd10Results,
    });
  } catch (error) {
    console.error('Analysis failed:', error);
    return res.status(500).json({ error: 'Analysis failed' });
  }
}

function generatePatientSummary(transcription: string): string {
  const lines = transcription.split('\n');
  const summary: string[] = [];

  // Extract demographics
  const demographicsMatch = transcription.match(/(\d+)[\s-]year[\s-]old\s+(male|female)/i);
  if (demographicsMatch) {
    summary.push(`Demographics: ${demographicsMatch[0]}`);
  }

  // Extract conditions
  const conditions = lines.filter(line => 
    line.toLowerCase().includes('diagnosed with') ||
    line.toLowerCase().includes('has') ||
    line.toLowerCase().includes('condition')
  );
  if (conditions.length > 0) {
    summary.push('Conditions: ' + conditions.join('; '));
  }

  // Extract findings
  const findings = lines.filter(line =>
    line.toLowerCase().includes('examination') ||
    line.toLowerCase().includes('shows') ||
    line.toLowerCase().includes('reveals')
  );
  if (findings.length > 0) {
    summary.push('Clinical Findings: ' + findings.join('; '));
  }

  return summary.join('\n');
}

async function analyzeForICD10Codes(transcription: string) {
  const results = [];
  
  // For each ICD-10 code, check if its description matches the transcription
  for (const [code, description] of Object.entries(icd10Codes)) {
    const descriptionLower = description.toLowerCase();
    const transcriptionLower = transcription.toLowerCase();
    
    // Simple matching for now - can be enhanced with more sophisticated NLP
    const keyTerms = descriptionLower
      .split(' ')
      .filter(term => term.length > 3 && transcriptionLower.includes(term));
      
    if (keyTerms.length > 0) {
      // Calculate confidence based on number of matching terms
      const confidence = Math.min(keyTerms.length / 5, 1);
      
      if (confidence > 0.3) {  // Only include if reasonable confidence
        results.push({
          code,
          description,
          confidence: confidence.toFixed(2),
          keyTerms,
        });
      }
    }
  }
  
  // Sort by confidence
  return results.sort((a, b) => parseFloat(b.confidence) - parseFloat(a.confidence));
} 