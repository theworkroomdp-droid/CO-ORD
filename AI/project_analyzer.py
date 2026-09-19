import os
import json
import time
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)


def analyze_project(project, team):

    prompt = f"""
You are CO-ORD, an AI-powered team cooperation assistant.

Analyze the software project and the team members.

Your job is to:

1. Understand the project description.
2. Give a short project summary.
3. Break the project into logical modules.
4. For each module:
   - Explain what the module does.
   - Identify required technical skills.
   - Create practical development tasks.
   - Identify suitable team members based on their skills.
5. Do not invent team members.
6. Do not recommend members with 100% workload.
7. Consider both skills and workload.
8. A member can work on multiple modules if appropriate.

PROJECT:
{json.dumps(project, indent=2)}

TEAM:
{json.dumps(team, indent=2)}

Return ONLY valid JSON in this format:

{{
    "project_summary": "short project summary",
    "modules": [
        {{
            "name": "module name",
            "description": "module description",
            "required_skills": ["skill1", "skill2"],
            "recommended_members": [
                {{
                    "name": "member name",
                    "matching_skills": ["skill1"],
                    "reason": "short reason"
                }}
            ],
            "tasks": [
                "task 1",
                "task 2",
                "task 3"
            ]
        }}
    ]
}}
"""

    # Try Gemini up to 3 times
    for attempt in range(3):

        try:
            print(f"\nProject Analysis - Attempt {attempt + 1}/3")

            response = client.models.generate_content(
                model="gemini-3.6-flash",
                contents=prompt
            )

            text = response.text.strip()

            if text.startswith("```"):
                text = text.replace("```json", "")
                text = text.replace("```", "")
                text = text.strip()

            result = json.loads(text)

            print("Project Analysis successful!")

            return result

        except Exception as error:

            print("Gemini error:", error)

            if attempt < 2:
                print("Retrying in 3 seconds...")
                time.sleep(3)

    # If all attempts fail
    return {
        "project_summary": "Project analysis is temporarily unavailable.",
        "modules": [],
        "error": "Gemini API was unavailable after multiple attempts."
    }