from flask_cors import CORS
from flask import Flask, request, jsonify
import tempfile
import subprocess
import os
import logging
import ffmpeg
import json
import random
import uuid
from typing import List, Dict
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.tag import pos_tag
import re

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Make sure NLTK resources are downloaded
nltk.download('punkt')
nltk.download('averaged_perceptron_tagger')
nltk.download('stopwords')

def check_ffmpeg():
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True)
        return True
    except FileNotFoundError:
        logger.error("FFmpeg not found. Please install FFmpeg.")
        return False

print("Server is running...")

def generate_quiz_questions(transcript: str, quiz_id: str) -> List[Dict]:
    # Tokenize the transcript into sentences
    sentences = sent_tokenize(transcript)
    
    # Remove timestamps from sentences before processing
    sentences = [re.sub(r'\[\d+:\d+\]', '', sentence).strip() for sentence in sentences]
    
    # Extract key information
    words = word_tokenize(transcript)
    pos_tags = pos_tag(words)
    
    # Filter important words (nouns, verbs, etc.)
    important_words = [word for word, tag in pos_tags if tag.startswith(('NN', 'VB', 'JJ'))]
    
    questions = []
    question_types = ['true-false', 'mcq']  # Removed 'msq' from types
    
    # Add logging function
    def log_question(q: Dict):
        logger.info("\n=== New Question Generated ===")
        logger.info(f"Type: {q['type']}")
        logger.info(f"Question: {q['question']}")
        logger.info(f"Options: {q['options']}")
        logger.info(f"Answer: {q['answer']}")
        logger.info(f"Order: {q['order']}")
        logger.info(f"Correct Statement: {q['correct_statement']}")
        logger.info("============================\n")
    
    def create_true_false(sentence: str) -> Dict:
        # Randomly decide to keep sentence true or make it false
        is_true = random.choice([True, False])
        if not is_true:
            # Modify the sentence to make it false
            words = sentence.split()
            # Replace a random word with an incorrect one
            replace_idx = random.randint(0, len(words) - 1)
            words[replace_idx] = random.choice(important_words)
            modified_sentence = ' '.join(words)
            question = modified_sentence
            correct_statement = sentence
        else:
            question = sentence
            correct_statement = sentence
            
        return {
            "quizId": quiz_id,
            "type": "true-false",
            "question": question,
            "options": json.dumps(["True", "False"]),
            "answer": json.dumps("True" if is_true else "False"),
            "order": len(questions) + 1,
            "correct_statement": correct_statement
        }
    
    def create_mcq(sentence: str) -> Dict:
        # Create multiple choice question
        words = word_tokenize(sentence)
        pos = pos_tag(words)
        
        # Find a key term to ask about
        key_terms = [word for word, tag in pos if tag.startswith(('NN', 'VB', 'JJ'))]
        if not key_terms:
            return None
            
        target_word = random.choice(key_terms)
        question = sentence.replace(target_word, "________")
        question = f"What word completes this sentence: {question}"
        
        # Generate options
        options = [target_word]  # Correct answer
        # Add 3 random distractors
        distractors = [w for w in important_words if w != target_word]
        options.extend(random.sample(distractors, min(3, len(distractors))))
        random.shuffle(options)
        
        return {
            "quizId": quiz_id,
            "type": "mcq",
            "question": question,
            "options": json.dumps(options),
            "answer": json.dumps(target_word),
            "order": len(questions) + 1,
            "correct_statement": sentence
        }
    
    # Generate 50 questions
    while len(questions) < 50 and sentences:
        question_type = random.choice(question_types)
        sentence = random.choice(sentences)
        sentences.remove(sentence)  # Don't reuse sentences
        
        if question_type == 'true-false':
            question = create_true_false(sentence)
        else:  # mcq
            question = create_mcq(sentence)
            
        if question:
            questions.append(question)
    
    # Log final summary
    logger.info(f"\n=== Quiz Generation Summary ===")
    logger.info(f"Total questions generated: {len(questions)}")
    logger.info(f"True/False questions: {sum(1 for q in questions if q['type'] == 'true-false')}")
    logger.info(f"MCQ questions: {sum(1 for q in questions if q['type'] == 'mcq')}")
    logger.info("============================\n")
    
    return questions

@app.route('/generate-transcript', methods=['POST'])
def generate_transcript():
    if not check_ffmpeg():
        return jsonify({'error': 'FFmpeg is not installed'}), 500

    try:
        # Check if video file exists in request
        if 'video' not in request.files:
            return jsonify({'error': 'No video file in request'}), 400
        
        file = request.files['video']
        
        # Check if filename is empty
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        # Create temporary directory
        tmp_dir = tempfile.mkdtemp()
        try:
            # Save the uploaded file
            video_path = os.path.join(tmp_dir, "input_video.mp4")
            file.save(video_path)
            
            # Verify file exists and has size
            if not os.path.exists(video_path):
                return jsonify({'error': 'Failed to save uploaded file'}), 500
            
            file_size = os.path.getsize(video_path)
            logger.info(f"File saved successfully. Size: {file_size} bytes")
            
            if file_size == 0:
                return jsonify({'error': 'Uploaded file is empty'}), 400

            # Convert video to audio format that Whisper can handle
            audio_path = os.path.join(tmp_dir, "audio.wav")
            try:
                stream = ffmpeg.input(video_path)
                stream = ffmpeg.output(stream, audio_path, acodec='pcm_s16le', ac=1, ar='16k')
                ffmpeg.run(stream, capture_stdout=True, capture_stderr=True)
                logger.info("Audio conversion completed successfully")
            except ffmpeg.Error as e:
                logger.error(f"FFmpeg error: {str(e)}")
                return jsonify({
                    'error': 'Audio conversion failed',
                    'details': str(e)
                }), 500

            # Run Whisper on the audio file
            try:
                logger.info("Starting Whisper transcription...")
                result = subprocess.run(
                    ['whisper', audio_path, '--model', 'base', '--output_format', 'txt'],
                    capture_output=True,
                    text=True,
                    check=True
                )
                
                logger.info("Whisper transcription completed successfully")
                
                # Try to read the output file
                txt_path = os.path.splitext(audio_path)[0] + '.txt'
                if os.path.exists(txt_path):
                    with open(txt_path, 'r', encoding='utf-8') as f:
                        transcript = f.read().strip()
                else:
                    transcript = result.stdout.strip()

                # Process and clean transcript
                logger.info("Processing transcript...")
                # Remove timestamps using regex
                transcript = re.sub(r'\[\d+:\d+(?:\.\d+)?(?: --> \d+:\d+(?:\.\d+)?)?\]', '', transcript)
                # Remove any extra whitespace created by timestamp removal
                transcript = re.sub(r'\s+', ' ', transcript).strip()
                
                # Format transcript for better readability
                sentences = sent_tokenize(transcript)
                formatted_transcript = '\n\n'.join(sentences)
                
                logger.info(f"Transcript processed. Length: {len(formatted_transcript)} characters")

                if not formatted_transcript:
                    return jsonify({
                        'error': 'No transcript generated',
                        'details': result.stderr
                    }), 500

                # Generate quiz questions
                quiz_id = str(uuid.uuid4())
                questions = generate_quiz_questions(transcript, quiz_id)
                
                # Log the response
                logger.info("\n=== API Response ===")
                logger.info(f"Transcript length: {len(formatted_transcript)} characters")
                logger.info(f"Number of sentences: {len(sentences)}")
                logger.info(f"Number of questions: {len(questions)}")
                logger.info("==================\n")
                
                return jsonify({
                    'transcript': formatted_transcript,
                    'quiz_questions': questions,
                    'quiz_id': quiz_id,
                    'status': 'success'
                })

            except subprocess.CalledProcessError as e:
                logger.error(f"Whisper error: {str(e)}")
                return jsonify({
                    'error': 'Transcription failed',
                    'details': e.stderr
                }), 500

        finally:
            # Cleanup: Remove temporary files
            try:
                import shutil
                shutil.rmtree(tmp_dir)
            except Exception as e:
                logger.error(f"Error cleaning up temporary files: {str(e)}")

    except Exception as e:
        logger.error(f"Server error: {str(e)}")
        return jsonify({
            'error': 'Server error',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    logger.info("Starting Flask server...")
    app.run(host='192.168.138.35', port=5000, debug=True)  # <-- Add debug=True
