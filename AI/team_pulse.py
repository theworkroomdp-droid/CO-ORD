import os
import json
import time
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)


def analyze_team_activity(activity_data):

    prompt = f"""
You are CO-ORD, an AI-powered team cooperation assistant.

Analyze the recent activity of a software development team.

Your goal is NOT to judge productivity.

Instead, understand what the team members appear to be working on
and identify useful opportunities for cooperation.

For each member, determine:

1. What they are currently working on.
2. Which project module it is related to.
3. Their progress signal.
4. Whether there is a possible blocker.
5. Whether collaboration may be useful.
6. A practical suggested next step.

Also identify:

7. Whether two or more members appear to be working on related areas.
8. Any possible dependency or handoff opportunity.

Do not invent people, files or activities.

ACTIVITY DATA:
{json.dumps(activity_data, indent=2)}

Return ONLY valid JSON.

Use exactly this structure:

{{
    "team_summary": "short summary of the team's current activity",

    "members": [
        {{
            "name": "member name",
            "activity": "what the member appears to be doing",
            "module": "related project module",
            "progress_signal": "short description",
            "possible_blocker": "blocker or null",
            "needs_collaboration": true,
            "suggested_next_step": "short practical suggestion"
        }}
    ],

    "collaboration_opportunities": [
        {{
            "members": ["member1", "member2"],
            "reason": "why collaboration may be useful",
            "suggestion": "what they could do together"
        }}
    ]
}}
"""

    for attempt in range(3):

        try:
            print(f"\nTeam Pulse - Attempt {attempt + 1}/3")

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

            print("Team Pulse analysis successful!")

            return result

        except Exception as error:

            print("Gemini error:", error)

            if attempt < 2:
                print("Retrying in 3 seconds...")
                time.sleep(3)

    return {
        "team_summary": "Team analysis is temporarily unavailable.",
        "members": [],
        "collaboration_opportunities": [],
        "error": "Gemini API was unavailable after multiple attempts."
    }