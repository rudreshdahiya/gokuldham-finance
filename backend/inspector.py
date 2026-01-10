import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load Env
load_dotenv()

class InspectorGadget:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            print("⚠️ GEMINI_API_KEY not found. Inspector disabled.")
            self.model = None
        else:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-pro')
            self.chat = self.model.start_chat(history=[])
            print("🕵️ Inspector Gadget (Gemini) is Online.")

    def analyze_case(self, user_context, question):
        """
        user_context: dict containing age, income, persona, prescription, etc.
        question: specific user query
        """
        if not self.model:
            return "Inspector is on leave (No API Key)."

        # System Prompt Engineering
        system_persona = """
        You are Inspector Chalu Pandey (from Gokuldham Society context), a strict but helpful Financial Inspector.
        Your job is to analyze the 'Suspect's' (User's) financial data and answer their questions.
        
        Tone:
        - Use Indian financial context (Lakhs, Crores, FD, SIP).
        - Be authoritative but funny (like a Bollywood cop).
        - Use phrases like "Hamara naam hai Inspector Chalu Pandey", "Jhooth bologe toh padenge dande".
        - BUT give accurate financial advice.
        
        Data Context:
        """
        
        prompt = f"{system_persona}\nUser Data: {user_context}\n\nUser Question: {question}"
        
        try:
            response = self.chat.send_message(prompt)
            return response.text
        except Exception as e:
            return f"Error connecting to HQ: {str(e)}"

# Singleton
inspector = InspectorGadget()
