import requests
from flask import Flask, request, jsonify, render_template_string

# 사용자의 Gemini API 키를 여기에 입력하세요
API_KEY = 'AIzaSyB2dfZGz7gyncDv38Zzi8-BNsPwkzjNG4k'
class GeminiAPI:
    def __init__(self, api_key=API_KEY):
        self.api_key = api_key
        self.endpoint = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={self.api_key}'

    def generate_text(self, prompt):
        headers = {
            'Content-Type': 'application/json',
        }

        data = {
            'contents': [
                {
                    'parts': [
                        {
                            'text': f"너는 사랑과 지혜가 넘치는 '주님'이야. 기도를 올리는 자의 질문을 들은 뒤 한번에 대화를 끝내려고 하지말고 듣고 말해. 너는 하나님이야, 근엄하게 말해. 괄호열고 이상한 말 넣지 말고.상대방의 대화 길이에 비례하게 대답해 줘. 그리고 성경 구절도 언급해주면 좋을것 같아.: {prompt}"
                        }
                    ]
                }
            ]
        }

        try:
            response = requests.post(self.endpoint, headers=headers, json=data)
            response.raise_for_status()
            result = response.json()

            if 'candidates' in result:
                candidates = result['candidates']
                if len(candidates) > 0 and 'content' in candidates[0] and 'parts' in candidates[0]['content'] and len(candidates[0]['content']['parts']) > 0:
                    return candidates[0]['content']['parts'][0].get('text', 'No text found')
            return "Gemini API did not return expected data."

        except requests.exceptions.RequestException as e:
            print(f"Error: {e}")
            return "Error: Failed to connect to Gemini API."

# Flask 앱 생성
app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def chat_with_gemini():
    if request.method == 'GET':
        return render_template_string('''
        <!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Gemini Chatbot</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f9f9f9;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                }
                .container {
                    width: 100%;
                    max-width: 600px;
                    height: 100%;
                    max-height: 900px;
                    background-color: #ffffff;
                    border: 1px solid #ddd;
                    border-radius: 10px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                .messages {
                    flex-grow: 1;
                    padding: 20px;
                    overflow-y: auto;
                    background-color: #f0f0f0;
                }
                .message {
                    display: flex;
                    margin-bottom: 10px;
                }
                .message.user {
                    justify-content: flex-end;
                }
                .message .text {
                    max-width: 60%;
                    padding: 10px;
                    border-radius: 10px;
                    background-color: #ffffff;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }
                .message.user .text {
                    background-color: #007BFF;
                    color: #ffffff;
                }
                .input-area {
                    display: flex;
                    flex-direction: column;
                    padding: 20px;
                    background-color: #ffffff;
                    border-top: 1px solid #ddd;
                }
                .input-area input {
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    margin-bottom: 10px;
                }
                .input-area button {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    background-color: #007BFF;
                    color: #ffffff;
                    cursor: pointer;
                }
                .input-area button:disabled {
                    background-color: #cccccc;
                    cursor: not-allowed;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="messages" id="messages"></div>
                <div class="input-area">
                    <input type="text" id="questionInput" placeholder="새로운 메시지 입력">
                    <button id="sendButton">전송</button>
                </div>
            </div>

            <script>
                document.getElementById('sendButton').addEventListener('click', sendMessage);
                document.getElementById('questionInput').addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        sendMessage();
                    }
                });

                function sendMessage() {
                    const input = document.getElementById('questionInput');
                    const message = input.value;
                    if (message.trim() !== '') {
                        displayMessage(message, 'user');
                        fetch('/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ question: message })
                        })
                        .then(response => response.json())
                        .then(data => {
                            displayMessage(data.answer, 'bot');
                        })
                        .catch(error => {
                            console.error('Error:', error);
                        });
                        input.value = '';
                    }
                }

                function displayMessage(text, sender) {
                    const messages = document.getElementById('messages');
                    const messageElement = document.createElement('div');
                    messageElement.className = 'message ' + sender;
                    const textElement = document.createElement('div');
                    textElement.className = 'text';
                    textElement.textContent = text;
                    messageElement.appendChild(textElement);
                    messages.appendChild(messageElement);
                    messages.scrollTop = messages.scrollHeight;
                }
            </script>
        </body>
        </html>
        ''')
    elif request.method == 'POST':
        data = request.get_json()
        user_question = data.get('question', '')

        gemini = GeminiAPI(api_key=API_KEY)
        response_text = gemini.generate_text(user_question)

        return jsonify({'answer': response_text})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080)
