from team_pulse import analyze_team_activity


activity_data = {
    "project": "CO-ORD",
    "members": [
        {
            "name": "Deva",
            "recent_files": [
                "Backend/auth.py",
                "Backend/routes.py"
            ],
            "recent_actions": [
                "edited authentication endpoint",
                "modified login validation"
            ],
            "skills": [
                "Python",
                "FastAPI",
                "Backend"
            ]
        },
        {
            "name": "Paru",
            "recent_files": [
                "Frontend/dashboard.jsx",
                "Frontend/components/TeamCard.jsx"
            ],
            "recent_actions": [
                "created team dashboard",
                "updated member cards"
            ],
            "skills": [
                "React",
                "JavaScript",
                "Frontend"
            ]
        },
        {
            "name": "Ani",
            "recent_files": [
                "Backend/resources.py",
                "Backend/models.py"
            ],
            "recent_actions": [
                "implemented resource API",
                "modified resource model"
            ],
            "skills": [
                "Python",
                "FastAPI",
                "Database"
            ]
        },
        {
            "name": "Devi",
            "recent_files": [
                "chrome-extension/popup.js",
                "chrome-extension/manifest.json"
            ],
            "recent_actions": [
                "implemented resource sharing",
                "tested browser extension"
            ],
            "skills": [
                "JavaScript",
                "Chrome Extensions",
                "Testing"
            ]
        }
    ]
}


result = analyze_team_activity(activity_data)

print("\n================ TEAM PULSE ================\n")

print(result)