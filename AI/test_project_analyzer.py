from project_analyzer import analyze_project


project = {
    "name": "Campus Family Web Application",
    "description": """
    A web application for a campus family where students can
    connect with each other, share information, and collaborate
    on campus activities.
    """
}


team = [
    {
        "name": "Deva",
        "skills": ["Python", "FastAPI", "AI"],
        "workload": 40
    },
    {
        "name": "Paru",
        "skills": ["HTML", "CSS", "JavaScript"],
        "workload": 30
    },
    {
        "name": "Devi",
        "skills": ["React", "UI Design"],
        "workload": 50
    },
    {
        "name": "Ani",
        "skills": ["Python", "Testing", "Database"],
        "workload": 20
    }
]


result = analyze_project(project, team)


print("\n==============================")
print("       PROJECT SUMMARY")
print("==============================")

print(result["project_summary"])


print("\n==============================")
print("          MODULES")
print("==============================")


for module in result["modules"]:

    print(f"\nMODULE: {module['name']}")

    print("Description:")
    print(module["description"])

    print("\nRequired Skills:")
    for skill in module["required_skills"]:
        print("-", skill)

    print("\nRecommended Members:")

    for member in module["recommended_members"]:
        print(
            f"- {member['name']} "
            f"({', '.join(member['matching_skills'])})"
        )

        print(
            f"  Reason: {member['reason']}"
        )

    print("\nTasks:")

    for task in module["tasks"]:
        print("-", task)