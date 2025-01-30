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

from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# Enable CORS for all routes
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


app = Flask(__name__)

# Supabase credentials
# Get Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")


# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_API_KEY)

@app.route("/chat", methods=["POST"])
@cross_origin(origin='localhost', headers=['Content-Type'])
def chat():
    data = request.json
    user_input = data.get("input")
    chat_id = data.get("id")  # Check if an ID is provided

    if not user_input:
        return jsonify({"error": "No input provided"}), 400

    # Get response from LangChain model
    bot_response = conversation.predict(input=user_input)

    if chat_id:
        # **Existing chat: Append new message**
        response = supabase.table("chats").select("messages").eq("id", chat_id).execute()
        
        if response.data:
            chat_data = response.data[0]
            chat_messages = chat_data["messages"]
            chat_messages.append({"role": "user", "content": user_input})
            chat_messages.append({"role": "assistant", "content": bot_response})

            # Update existing chat
            supabase.table("chats").update({"messages": chat_messages}).eq("id", chat_id).execute()
            return jsonify({"response": bot_response, "id": chat_id})

        else:
            return jsonify({"error": "Chat not found"}), 404

    else:
        # **New chat: Create a new entry**
        chat_name = "Chat " + str(int(os.urandom(2).hex(), 16))  # Generate a random chat name
        new_chat = {
            "name": chat_name,
            "messages": [
                {"role": "user", "content": user_input},
                {"role": "assistant", "content": bot_response}
            ]
        }

        # Insert into Supabase
        response = supabase.table("chats").insert(new_chat).execute()
        chat_id = response.data[0]["id"]  # Get the generated chat ID

        return jsonify({"response": bot_response, "id": chat_id})

# Route to fetch all previous chats
@app.route("/chats", methods=["GET"])
@cross_origin(origin='localhost', headers=['Content-Type'])
def get_chats():
    chats = supabase.table("chats").select("*").execute()
    return jsonify(chats.data)

# Route to fetch a specific chat
@app.route("/chat/<int:chat_id>", methods=["GET"])
@cross_origin(origin='localhost', headers=['Content-Type'])
def get_chat(chat_id):
    try:
        response = supabase.table("chats").select("*").eq("id", chat_id).execute()

        if response and response.data:
            return jsonify(response.data[0]), 200
        else:
            return jsonify({"error": "Chat not found"}), 404

    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)