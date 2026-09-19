from fastapi import FastAPI, HTTPException
from database import read_data, write_data

from mongodb import (
    users_collection,
    projects_collection,
    tasks_collection,
    resources_collection
)

app = FastAPI(title="CO-ORD API")


# =========================
# BASIC
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
    users = list(users_collection.find({}, {"_id": 0}))
    return users


# =========================
# PROJECTS
# =========================

@app.get("/projects")
def get_projects():
    projects = list(projects_collection.find({}, {"_id": 0}))
    return projects


@app.post("/projects")
def create_project(project: dict):

    last_project = projects_collection.find_one(
        sort=[("id", -1)]
    )

    if last_project:
        project["id"] = last_project["id"] + 1
    else:
        project["id"] = 1

    projects_collection.insert_one(project)

    return {
        "message": "Project created successfully",
        "project": project
    }


# =========================
# TASKS
# =========================

@app.get("/tasks")
def get_tasks():
    tasks = list(tasks_collection.find({}, {"_id": 0}))
    return tasks


@app.post("/tasks")
def create_task(task: dict):

    last_task = tasks_collection.find_one(
        sort=[("id", -1)]
    )

    if last_task:
        task["id"] = last_task["id"] + 1
    else:
        task["id"] = 1

    tasks_collection.insert_one(task)

    return {
        "message": "Task created successfully",
        "task": task
    }


@app.patch("/tasks/{task_id}")
def update_task(task_id: int, updates: dict):

    result = tasks_collection.update_one(
        {"id": task_id},
        {"$set": updates}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    updated_task = tasks_collection.find_one(
        {"id": task_id},
        {"_id": 0}
    )

    return {
        "message": "Task updated successfully",
        "task": updated_task
    }


# =========================
# RESOURCES
# =========================

@app.get("/resources")
def get_resources():
    resources = list(resources_collection.find({}, {"_id": 0}))
    return resources