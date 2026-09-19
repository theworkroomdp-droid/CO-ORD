from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from database import read_data, write_data


app = FastAPI(title="CO-ORD API")


# =========================
# Helper Functions
# =========================

def get_next_id(items):
    """Generate the next numeric ID."""
    if not items:
        return 1

    numeric_ids = [
        item["id"]
        for item in items
        if isinstance(item.get("id"), int)
    ]

    return max(numeric_ids, default=0) + 1


# =========================
# Basic
# =========================

@app.get("/")
def home():
    return {
        "message": "CO-ORD Backend is running!"
    }


# =========================
# USERS
# =========================

@app.get("/users")
def get_users():
    return read_data("users.json")


@app.post("/users")
def create_user(user: dict):
    users = read_data("users.json")

    user["id"] = get_next_id(users)

    users.append(user)

    write_data("users.json", users)

    return {
        "message": "User created successfully",
        "user": user
    }


# =========================
# PROJECTS
# =========================

@app.get("/projects")
def get_projects():
    return read_data("projects.json")


@app.post("/projects")
def create_project(project: dict):
    projects = read_data("projects.json")

    project["id"] = get_next_id(projects)

    projects.append(project)

    write_data("projects.json", projects)

    return {
        "message": "Project created successfully",
        "project": project
    }


# =========================
# TASKS
# =========================

@app.get("/tasks")
def get_tasks():
    return read_data("tasks.json")


@app.post("/tasks")
def create_task(task: dict):
    tasks = read_data("tasks.json")

    task["id"] = get_next_id(tasks)

    tasks.append(task)

    write_data("tasks.json", tasks)

    return {
        "message": "Task created successfully",
        "task": task
    }


@app.patch("/tasks/{task_id}")
def update_task(task_id: int, updates: dict):
    tasks = read_data("tasks.json")

    for task in tasks:
        if task["id"] == task_id:
            task.update(updates)

            write_data("tasks.json", tasks)

            return {
                "message": "Task updated successfully",
                "task": task
            }

    raise HTTPException(
        status_code=404,
        detail="Task not found"
    )


# =========================
# RESOURCES
# =========================

@app.get("/resources")
def get_resources():
    return read_data("resources.json")