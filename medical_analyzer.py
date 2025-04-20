import spacy
from icd10_analyzer import ICD10Analyzer
from typing import Dict, List, Tuple

class MedicalAnalyzer:
    def __init__(self):
        self.icd10_analyzer = ICD10Analyzer()
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except:
            print("Please install spaCy and the English model: pip install spacy && python -m spacy download en_core_web_sm")
            raise

    def generate_patient_summary(self, transcription: str) -> str:
        """Extract key patient information from transcription"""
        doc = self.nlp(transcription)
        
        # Initialize data containers
        demographics = []
        conditions = []
        symptoms = []
        
        # Simple pattern matching for common medical information
        for sent in doc.sents:
            sent_text = sent.text.lower()
            
            # Look for demographics
            if any(term in sent_text for term in ["year-old", "years old", "yo"]):
                demographics.append(sent.text.strip())
            
            # Look for medical conditions
            if any(term in sent_text for term in ["diagnosed with", "has", "suffers from", "condition", "disease"]):
                conditions.append(sent.text.strip())
                
            # Look for symptoms and observations
            if any(term in sent_text for term in ["symptoms", "presents with", "complains of", "shows", "reveals", "examination"]):
                symptoms.append(sent.text.strip())
        
        # Compile summary
        summary_parts = []
        if demographics:
            summary_parts.append("Demographics: " + demographics[0])
        if conditions:
            summary_parts.append("Conditions: " + "; ".join(conditions))
        if symptoms:
            summary_parts.append("Clinical Findings: " + "; ".join(symptoms))
            
        return "\n".join(summary_parts)

    def analyze_transcription(self, transcription: str) -> Dict:
        """Analyze transcription and return ICD-10 codes and summary"""
        # Load ICD-10 codes
        with open('icd10_codes.txt', 'r') as f:
            self.icd10_analyzer.load_icd10_codes(f.read())
        
        # Get ICD-10 codes
        icd10_results = self.icd10_analyzer.analyze_transcription(transcription)
        
        # Generate patient summary
        summary = self.generate_patient_summary(transcription)
        
        # Format results
        formatted_codes = []
        for code, description, confidence, evidence in icd10_results:
            if confidence > 0.3:  # Only include reasonably confident matches
                formatted_codes.append({
                    "code": code,
                    "description": description,
                    "confidence": f"{confidence:.2%}",
                    "key_terms": evidence['matching_terms']
                })
        
        return {
            "summary": summary,
            "icd10_codes": formatted_codes
        }

def main():
    # Example usage
    analyzer = MedicalAnalyzer()
    
    transcription = """
    Patient is a 52-year-old female with diabetes mellitus due to an underlying autoimmune condition.
    Examination reveals moderate nonproliferative diabetic retinopathy affecting both eyes.
    There is evidence of macular edema in both eyes.
    Patient reports no other complications at this time.
    """
    
    results = analyzer.analyze_transcription(transcription)
    
    print("\nPatient Summary:")
    print("===============")
    print(results["summary"])
    
    print("\nRelevant ICD-10 Codes:")
    print("====================")
    for code_info in results["icd10_codes"]:
        print(f"\nCode: {code_info['code']}")
        print(f"Description: {code_info['description']}")
        print(f"Confidence: {code_info['confidence']}")
        print(f"Key Terms: {', '.join(code_info['key_terms'])}")

if __name__ == "__main__":
    main() 