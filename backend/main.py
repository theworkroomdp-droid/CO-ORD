from fastapi import FastAPI
from pydantic import BaseModel
from database import read_data, write_data

app = FastAPI(title="CO-ORD API")

# Basic test endpoint
@app.get("/")
def home():
    return {
        "message": "CO-ORD Backend is running!"
    }

# USERS
@app.get("/users")
def get_users():
    return read_data("users.json")


# PROJECTS
@app.get("/projects")
def get_projects():
    return read_data("projects.json")

# TASKS
@app.get("/tasks")
def get_tasks():
    return read_data("tasks.json")

# RESOURCES
@app.get("/resources")
def get_resources():
    return read_data("resources.json")