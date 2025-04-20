from flask import Flask, render_template, request, jsonify
from medical_analyzer import MedicalAnalyzer

app = Flask(__name__)
analyzer = MedicalAnalyzer()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    transcription = request.json.get('transcription', '')
    if not transcription:
        return jsonify({'error': 'No transcription provided'}), 400
        
    try:
        results = analyzer.analyze_transcription(transcription)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 