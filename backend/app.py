import os
from flask import Flask, request, jsonify
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain
from dotenv import load_dotenv
from flask_cors import CORS, cross_origin
from supabase import create_client, Client

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Set up OpenAI API key
openai_api_key = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI ChatGPT model
chat_model = ChatOpenAI(temperature=0.7, openai_api_key=openai_api_key)

# Define a prompt template
prompt = ChatPromptTemplate.from_template(
    "You are a professional fitness coach specializing in workout plans, nutrition, and healthy living."
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

# Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")

# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_API_KEY)

# Authentication Middleware
def authenticate():
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        return None
    return token.split("Bearer ")[1]

@app.route("/chat", methods=["POST"])
@cross_origin(origin='localhost', headers=['Content-Type'])
def chat():
    token = authenticate()
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    user_input = data.get("input")
    chat_id = data.get("id")

    if not user_input:
        return jsonify({"error": "No input provided"}), 400

    bot_response = conversation.predict(input=user_input)

    if chat_id:
        response = supabase.table("chats").select("messages").eq("id", chat_id).execute()
        
        if response.data:
            chat_data = response.data[0]
            chat_messages = chat_data["messages"]
            chat_messages.append({"role": "user", "content": user_input})
            chat_messages.append({"role": "assistant", "content": bot_response})

            supabase.table("chats").update({"messages": chat_messages}).eq("id", chat_id).execute()
            return jsonify({"response": bot_response, "id": chat_id})

        else:
            return jsonify({"error": "Chat not found"}), 404

    else:
        chat_name = "Chat " + str(int(os.urandom(2).hex(), 16))
        new_chat = {
            "name": chat_name,
            "messages": [
                {"role": "user", "content": user_input},
                {"role": "assistant", "content": bot_response}
            ]
        }
        
        response = supabase.table("chats").insert(new_chat).execute()
        chat_id = response.data[0]["id"]

        return jsonify({"response": bot_response, "id": chat_id})

@app.route("/chats", methods=["GET"])
@cross_origin(origin='localhost', headers=['Content-Type'])
def get_chats():
    token = authenticate()
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    chats = supabase.table("chats").select("*").execute()
    return jsonify(chats.data)

@app.route("/chat/<int:chat_id>", methods=["GET"])
@cross_origin(origin='localhost', headers=['Content-Type'])
def get_chat(chat_id):
    token = authenticate()
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        response = supabase.table("chats").select("*").eq("id", chat_id).execute()

        if response and response.data:
            return jsonify(response.data[0]), 200
        else:
            return jsonify({"error": "Chat not found"}), 404
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

@app.route("/chat/<int:chat_id>", methods=["DELETE"])
@cross_origin(origin='localhost', headers=['Content-Type'])
def delete_chat(chat_id):
    token = authenticate()
    if not token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        response = supabase.table("chats").select("*").eq("id", chat_id).execute()
        if not response.data:
            return jsonify({"error": "Chat not found"}), 404
        
        supabase.table("chats").delete().eq("id", chat_id).execute()
        return jsonify({"message": "Chat deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
