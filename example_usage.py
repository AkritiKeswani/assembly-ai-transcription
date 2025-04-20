from icd10_analyzer import ICD10Analyzer

def main():
    # Initialize the analyzer
    analyzer = ICD10Analyzer()
    
    # Load ICD-10 codes from file
    with open('icd10_codes.txt', 'r') as f:
        codes_text = f.read()
    analyzer.load_icd10_codes(codes_text)
    
    # Example transcription
    transcription = """
    Patient is a 52-year-old female with diabetes mellitus due to an underlying autoimmune condition.
    Examination reveals moderate nonproliferative diabetic retinopathy affecting both eyes.
    There is evidence of macular edema in both eyes.
    Patient reports no other complications at this time.
    """
    
    # Analyze the transcription
    results = analyzer.analyze_transcription(transcription)
    
    # Print results
    print("\nAnalysis Results:")
    print("================")
    for code, description, confidence, evidence in results:
        print(f"\nICD-10 Code: {code}")
        print(f"Description: {description}")
        print(f"Confidence Score: {confidence:.2f}")
        print("Evidence:")
        print(f"  Matching terms: {', '.join(evidence['matching_terms'])}")
        print(f"  Context: {evidence['context'][0]}")
        print("-" * 80)
    
    # Example of getting specific diabetes codes
    print("\nDiabetes Codes with Retinopathy:")
    retinopathy_codes = analyzer.get_diabetes_specific_codes(complication="retinopathy")
    for code in retinopathy_codes:
        print(f"{code}: {analyzer.icd10_codes[code]}")

if __name__ == "__main__":
    main() 