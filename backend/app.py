import os
from flask import Flask, request, jsonify
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain
from dotenv import load_dotenv
from flask_cors import CORS

# Load environment variables
load_dotenv()

# Set up Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all route

# Set up OpenAI API key
openai_api_key = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI ChatGPT model
chat_model = ChatOpenAI(temperature=0.7, openai_api_key=openai_api_key)

# Define a prompt template
prompt = ChatPromptTemplate.from_template(
    "You are a professional fitness coach specializing in workout plans, nutrition, and healthy living. "
    "Only respond to fitness-related questions. If the input is not fitness-related, politely inform the user that you can only answer fitness-related questions. "
    "{history}\nHuman: {input}\nAI:"
)

# Set up memory for the conversation
memory = ConversationBufferMemory(memory_key="history", return_messages=True)

# Create a conversation chain
conversation = ConversationChain(
    llm=chat_model,
    prompt=prompt,
    memory=memory
)

# Route to handle chat requests
@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.json.get("input")
    if not user_input:
        return jsonify({"error": "No input provided"}), 400
    
    # Get response from LangChain model
    bot_response = conversation.predict(input=user_input)
    
    return jsonify({"response": bot_response})

if __name__ == "__main__":
    app.run(debug=True)