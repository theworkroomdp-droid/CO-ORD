from recommendation import recommend_member

task = {
    "title": "Write automated Python tests",
    "required_skills": ["Python", "Testing"],
    "priority": "Medium"
}

team = [
    {
        "name": "Deva",
        "skills": ["Python", "FastAPI", "Backend"],
        "workload": 40
    },
    {
        "name": "Paru",
        "skills": ["HTML", "CSS", "JavaScript"],
        "workload": 70
    },
    {
        "name": "Ani",
        "skills": ["Python", "Testing"],
        "workload": 30
    }
]

result = recommend_member(task, team)

print(result)