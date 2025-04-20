import re
from typing import List, Dict, Tuple
import spacy
from collections import defaultdict

class ICD10Analyzer:
    def __init__(self):
        self.icd10_codes = {}  # Will store ICD-10 codes and their descriptions
        self.keyword_mappings = defaultdict(list)  # Will store keywords associated with each code
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except:
            print("Please install spaCy and the English model: pip install spacy && python -m spacy download en_core_web_sm")
            raise

    def load_icd10_codes(self, codes_text: str):
        """Load ICD-10 codes from text format and create keyword mappings"""
        lines = codes_text.strip().split('\n')
        for line in lines:
            if line.strip():
                # Split on first occurrence of multiple spaces
                parts = re.split(r'\s{2,}', line.strip(), maxsplit=1)
                if len(parts) == 2:
                    code, description = parts
                    code = code.strip()
                    description = description.strip()
                    self.icd10_codes[code] = description
                    
                    # Create keyword mappings
                    # Process the description with spaCy
                    doc = self.nlp(description.lower())
                    
                    # Extract key medical terms and their variations
                    key_terms = set()
                    for token in doc:
                        if not token.is_stop and not token.is_punct:
                            key_terms.add(token.text)
                            # Add lemmatized form
                            key_terms.add(token.lemma_)
                    
                    # Add all terms to keyword mappings
                    for term in key_terms:
                        self.keyword_mappings[term].append(code)

    def analyze_transcription(self, transcription: str) -> List[Tuple[str, str, float, Dict]]:
        """
        Analyze a transcription and return potential ICD-10 codes with confidence scores and evidence
        Returns: List of tuples (code, description, confidence_score, evidence_dict)
        """
        results = []
        doc = self.nlp(transcription.lower())
        
        # Track matches and their context
        matches = defaultdict(lambda: {'count': 0, 'evidence': [], 'context': set()})
        
        # Process each sentence in the transcription
        for sent in doc.sents:
            sent_text = sent.text.lower()
            
            # Look for direct matches of medical terms
            for token in sent:
                if not token.is_stop and not token.is_punct:
                    term = token.text
                    if term in self.keyword_mappings:
                        for code in self.keyword_mappings[term]:
                            matches[code]['count'] += 1
                            matches[code]['evidence'].append(term)
                            matches[code]['context'].add(sent_text)
        
        # Calculate confidence scores and prepare results
        for code, match_info in matches.items():
            description = self.icd10_codes[code]
            
            # Calculate confidence score based on:
            # 1. Number of matching terms
            # 2. Percentage of key terms matched
            # 3. Context relevance
            key_terms_in_desc = len(set(self.nlp(description.lower())))
            matched_terms = len(set(match_info['evidence']))
            
            confidence = min(1.0, (
                (matched_terms / key_terms_in_desc) * 0.7 +  # Term coverage
                (match_info['count'] / 10) * 0.3            # Frequency bonus
            ))
            
            evidence_dict = {
                'matching_terms': list(set(match_info['evidence'])),
                'context': list(match_info['context']),
                'match_count': match_info['count']
            }
            
            results.append((code, description, confidence, evidence_dict))
        
        # Sort by confidence score
        results.sort(key=lambda x: x[2], reverse=True)
        return results

    def get_diabetes_specific_codes(self, type_str: str = None, complication: str = None) -> List[str]:
        """Get diabetes-specific ICD-10 codes based on type and complication"""
        matching_codes = []
        for code, desc in self.icd10_codes.items():
            desc_lower = desc.lower()
            
            # Check if this is a diabetes code
            if not desc_lower.startswith('type') and not 'diabetes' in desc_lower:
                continue
                
            # Match type if specified
            if type_str and type_str.lower() not in desc_lower:
                continue
                
            # Match complication if specified
            if complication and complication.lower() not in desc_lower:
                continue
                
            matching_codes.append(code)
            
        return matching_codes

def main():
    # Example usage
    analyzer = ICD10Analyzer()
    
    # Example transcription
    transcription = """
    Patient is a 45-year-old male with Type 2 diabetes mellitus. 
    Recent examination shows moderate nonproliferative diabetic retinopathy with macular edema in both eyes.
    Patient also reports numbness in feet, suggesting diabetic neuropathy.
    Blood sugar levels have been consistently high, indicating hyperglycemia.
    """
    
    # Example of loading codes (you would load your actual codes here)
    sample_codes = """
    E11311  Type 2 diabetes mellitus with unspecified diabetic retinopathy with macular edema
    E11319  Type 2 diabetes mellitus with unspecified diabetic retinopathy without macular edema
    E1140   Type 2 diabetes mellitus with diabetic neuropathy, unspecified
    E1165   Type 2 diabetes mellitus with hyperglycemia
    """
    
    analyzer.load_icd10_codes(sample_codes)
    
    # Analyze transcription
    results = analyzer.analyze_transcription(transcription)
    
    # Print results
    for code, description, confidence, evidence in results:
        print(f"\nCode: {code}")
        print(f"Description: {description}")
        print(f"Confidence: {confidence:.2f}")
        print("Evidence:")
        print(f"  Matching terms: {', '.join(evidence['matching_terms'])}")
        print(f"  Context: {evidence['context'][0]}")
        print("---")

if __name__ == "__main__":
    main() 