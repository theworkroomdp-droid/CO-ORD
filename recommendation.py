import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=api_key)


def fallback_recommendation(task, team):
    required_skills = set(
        skill.lower() for skill in task.get("required_skills", [])
    )

    best_member = None
    best_score = -1

    for member in team:
        workload = member.get("workload", 100)

        # Don't choose someone who is fully occupied
        if workload >= 100:
            continue

        member_skills = set(
            skill.lower() for skill in member.get("skills", [])
        )

        matching_skills = required_skills.intersection(member_skills)

        # More matching skills + lower workload = better candidate
        score = (len(matching_skills) * 100) + (100 - workload)

        if score > best_score:
            best_score = score
            best_member = member

    if best_member is None:
        return {
            "recommended_member": None,
            "matching_skills": [],
            "workload": None,
            "reason": "No available team member has a suitable skill match."
        }

    matching = [
        skill for skill in best_member.get("skills", [])
        if skill.lower() in required_skills
    ]

    return {
        "recommended_member": best_member["name"],
        "matching_skills": matching,
        "workload": best_member.get("workload", 0),
        "reason": "Fallback recommendation based on skill match and workload."
    }


def recommend_member(task, team):

    prompt = f"""
You are CO-ORD, an AI team cooperation assistant.

Recommend the most suitable team member for the task.

Consider:
1. Required skills
2. Team member skills
3. Current workload
4. Task priority

Never recommend someone whose workload is 100% or more.

If nobody has a meaningful skill match, return null
for recommended_member instead of inventing a person.

Task:
{json.dumps(task)}

Team members:
{json.dumps(team)}

Return ONLY valid JSON in exactly this structure:

{{
    "recommended_member": "name or null",
    "matching_skills": ["skill1", "skill2"],
    "workload": 0,
    "reason": "short explanation"
}}
"""

    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )

        text = response.text.strip()

        # Remove markdown code fences if Gemini adds them
        if text.startswith("```"):
            text = text.replace("```json", "").replace("```", "").strip()

        result = json.loads(text)

        return result

    except Exception as error:
        print("Gemini unavailable. Using fallback recommendation.")
        print("Error:", error)

        return fallback_recommendation(task, team)