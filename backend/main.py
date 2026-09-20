from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import read_data, write_data


app = FastAPI(title="CO-ORD API")


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def get_next_id(items):
    """Generate the next numeric ID."""

    if not items:
        return 1

    numeric_ids = []

    for item in items:
        item_id = item.get("id")

        if isinstance(item_id, int):
            numeric_ids.append(item_id)

    return max(numeric_ids, default=0) + 1


def get_next_str_id(items, prefix):
    """Generate IDs such as task-1, proj-1, sprint-1."""

    if not items:
        return f"{prefix}-1"

    nums = []

    for item in items:

        try:
            item_id = str(item.get("id", ""))

            if item_id.startswith(f"{prefix}-"):
                number = int(
                    item_id.replace(
                        f"{prefix}-",
                        ""
                    )
                )

                nums.append(number)

        except (ValueError, AttributeError):
            pass

    return f"{prefix}-{max(nums, default=0) + 1}"


def is_completed(task):
    """Check whether a task is completed."""

    return str(
        task.get("status", "")
    ).lower() in [
        "completed",
        "complete",
        "done"
    ]


def is_in_progress(task):
    """Check whether a task is currently in progress."""

    return str(
        task.get("status", "")
    ).lower() in [
        "in progress",
        "in_progress",
        "in-progress"
    ]


def is_todo(task):
    """Check whether a task is still pending."""

    return str(
        task.get("status", "")
    ).lower() in [
        "todo",
        "to do",
        "pending",
        "not started"
    ]


# ============================================================
# BASIC
# ============================================================

@app.get("/")
def home():

    return {
        "message": "CO-ORD Backend is running!",
        "status": "online"
    }


@app.get("/api/health")
def health_check():

    return {
        "success": True,
        "message": "CO-ORD API is healthy"
    }


# ============================================================
# AUTH
# ============================================================

@app.post("/api/auth/login")
def login(credentials: dict):

    users = read_data("users.json")

    email = (
        credentials.get("email")
        or ""
    ).lower()

    password = (
        credentials.get("password")
        or ""
    )

    # Demo authentication
    for user in users:

        if user.get("email", "").lower() == email:

            return {
                "success": True,
                "user": user
            }

    # Demo fallback
    if users:

        return {
            "success": True,
            "user": users[0]
        }

    raise HTTPException(
        status_code=401,
        detail="Invalid credentials"
    )


@app.post("/api/auth/register")
def register(user_data: dict):

    users = read_data("users.json")

    email = (
        user_data.get("email")
        or ""
    ).lower()

    # Check duplicate email
    for user in users:

        if user.get("email", "").lower() == email:

            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

    new_user = {

        "id": f"user-{get_next_id(users)}",

        "name": user_data.get(
            "name",
            "New Member"
        ),

        "email": email,

        "role": user_data.get(
            "role",
            "Student Builder"
        ),

        "category": user_data.get(
            "category",
            "student"
        ),

        "skills": user_data.get(
            "skills",
            [
                "HTML",
                "JavaScript"
            ]
        ),

        "bio": user_data.get(
            "bio",
            "Excited to collaborate."
        ),

        "workload": "low",

        "avatar": (
            user_data.get("name")
            or "U"
        )[:2].upper()
    }

    users.append(new_user)

    write_data(
        "users.json",
        users
    )

    return {
        "success": True,
        "user": new_user
    }


# ============================================================
# USERS
# ============================================================

@app.get("/users")
def get_users():

    return read_data("users.json")


@app.post("/users")
def create_user(user: dict):

    users = read_data("users.json")

    user["id"] = get_next_id(users)

    users.append(user)

    write_data(
        "users.json",
        users
    )

    return {
        "message": "User created successfully",
        "user": user
    }


# ============================================================
# TEAM
# ============================================================

@app.get("/api/team")
def get_team():

    return read_data("users.json")


# ============================================================
# PROJECTS
# ============================================================

@app.get("/projects")
@app.get("/api/projects")
def get_projects():

    return read_data("projects.json")


@app.get("/api/projects/{project_id}")
def get_project(project_id: str):

    projects = read_data(
        "projects.json"
    )

    project = next(
        (
            p for p in projects
            if str(p.get("id"))
            == str(project_id)
        ),
        None
    )

    if not project:

        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    return project


@app.post("/projects")
@app.post("/api/projects")
def create_project(project: dict):

    projects = read_data(
        "projects.json"
    )

    project["id"] = get_next_str_id(
        projects,
        "proj"
    )

    project.setdefault(
        "status",
        "active"
    )

    project.setdefault(
        "progress",
        0
    )

    project.setdefault(
        "tasksCount",
        0
    )

    project.setdefault(
        "completedCount",
        0
    )

    project.setdefault(
        "members",
        []
    )

    project.setdefault(
        "archived",
        False
    )

    projects.append(project)

    write_data(
        "projects.json",
        projects
    )

    return {
        "message": "Project created successfully",
        "project": project
    }


@app.patch("/api/projects/{project_id}")
def update_project(
    project_id: str,
    updates: dict
):

    projects = read_data(
        "projects.json"
    )

    for project in projects:

        if str(project.get("id")) == str(project_id):

            project.update(updates)

            write_data(
                "projects.json",
                projects
            )

            return {
                "message": "Project updated",
                "project": project
            }

    raise HTTPException(
        status_code=404,
        detail="Project not found"
    )


@app.post("/api/projects/{project_id}/access")
def validate_access(
    project_id: str,
    body: dict
):

    projects = read_data(
        "projects.json"
    )

    project = next(
        (
            p for p in projects
            if str(p.get("id"))
            == str(project_id)
        ),
        None
    )

    if not project:

        return {
            "success": False,
            "reason": "workspace_not_found"
        }

    if (
        project.get("archived")
        or project.get("status")
        == "archived"
    ):

        return {
            "success": False,
            "reason": "workspace_archived"
        }

    room_code = str(
        body.get("roomCode")
        or ""
    ).strip().upper()

    stored_code = str(
        project.get("roomCode")
        or ""
    ).strip().upper()

    if room_code != stored_code:

        return {
            "success": False,
            "reason": "invalid_code"
        }

    return {
        "success": True,
        "projectId": project_id
    }


# ============================================================
# TASKS
# ============================================================

@app.get("/tasks")
@app.get("/api/tasks")
def get_tasks():

    return read_data("tasks.json")


@app.get("/api/projects/{project_id}/tasks")
def get_project_tasks(project_id: str):

    tasks = read_data(
        "tasks.json"
    )

    return [
        task for task in tasks
        if str(task.get("projectId"))
        == str(project_id)
    ]


@app.post("/tasks")
@app.post("/api/tasks")
def create_task(task: dict):

    tasks = read_data(
        "tasks.json"
    )

    task["id"] = get_next_str_id(
        tasks,
        "task"
    )

    task.setdefault(
        "status",
        "todo"
    )

    task.setdefault(
        "priority",
        "medium"
    )

    task.setdefault(
        "progress",
        0
    )

    # Sprint integration
    task.setdefault(
        "sprintId",
        None
    )

    # Employee integration
    task.setdefault(
        "assigneeId",
        None
    )

    task.setdefault(
        "assigneeName",
        None
    )

    # Deadline
    task.setdefault(
        "dueDate",
        None
    )

    task.setdefault(
        "createdAt",
        datetime.now().isoformat()
    )

    tasks.append(task)

    # Update project statistics
    projects = read_data(
        "projects.json"
    )

    for project in projects:

        if (
            str(project.get("id"))
            == str(task.get("projectId"))
        ):

            project["tasksCount"] = (
                project.get(
                    "tasksCount",
                    0
                ) + 1
            )

    write_data(
        "projects.json",
        projects
    )

    # Update sprint task list
    sprint_id = task.get("sprintId")

    if sprint_id:

        sprints = read_data(
            "sprints.json"
        )

        for sprint in sprints:

            if (
                str(sprint.get("id"))
                == str(sprint_id)
            ):

                task_ids = sprint.setdefault(
                    "taskIds",
                    []
                )

                if task["id"] not in task_ids:

                    task_ids.append(
                        task["id"]
                    )

        write_data(
            "sprints.json",
            sprints
        )

    write_data(
        "tasks.json",
        tasks
    )

    return {
        "message": "Task created successfully",
        "task": task
    }


@app.patch("/tasks/{task_id}")
@app.patch("/api/tasks/{task_id}")
def update_task(
    task_id: str,
    updates: dict
):

    tasks = read_data(
        "tasks.json"
    )

    for task in tasks:

        if str(task.get("id")) == str(task_id):

            old_status = task.get(
                "status"
            )

            task.update(updates)

            # Completed task automatically gets 100%
            if is_completed(task):

                task["progress"] = 100

                task["completedAt"] = (
                    task.get("completedAt")
                    or datetime.now().isoformat()
                )

            elif (
                "progress" not in updates
                and old_status != task.get("status")
            ):

                if is_in_progress(task):

                    task["progress"] = max(
                        task.get("progress", 0),
                        50
                    )

                elif is_todo(task):

                    task["progress"] = 0

            write_data(
                "tasks.json",
                tasks
            )

            # Recalculate project progress
            project_id = task.get(
                "projectId"
            )

            if project_id:

                update_project_statistics(
                    project_id
                )

            # Recalculate sprint progress
            sprint_id = task.get(
                "sprintId"
            )

            if sprint_id:

                update_sprint_statistics(
                    sprint_id
                )

            return {
                "message": "Task updated successfully",
                "task": task
            }

    raise HTTPException(
        status_code=404,
        detail="Task not found"
    )


@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str):

    tasks = read_data(
        "tasks.json"
    )

    deleted_task = next(
        (
            task for task in tasks
            if str(task.get("id"))
            == str(task_id)
        ),
        None
    )

    new_tasks = [
        task for task in tasks
        if str(task.get("id"))
        != str(task_id)
    ]

    if len(new_tasks) == len(tasks):

        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    write_data(
        "tasks.json",
        new_tasks
    )

    # Update project statistics
    if deleted_task:

        project_id = deleted_task.get(
            "projectId"
        )

        if project_id:

            update_project_statistics(
                project_id
            )

        sprint_id = deleted_task.get(
            "sprintId"
        )

        if sprint_id:

            update_sprint_statistics(
                sprint_id
            )

    return {
        "success": True
    }


# ============================================================
# PROJECT STATISTICS
# ============================================================

def update_project_statistics(project_id):

    projects = read_data(
        "projects.json"
    )

    tasks = read_data(
        "tasks.json"
    )

    project_tasks = [
        task for task in tasks
        if str(task.get("projectId"))
        == str(project_id)
    ]

    total = len(project_tasks)

    completed = len([
        task for task in project_tasks
        if is_completed(task)
    ])

    progress = (
        round(
            completed / total * 100
        )
        if total > 0
        else 0
    )

    for project in projects:

        if str(project.get("id")) == str(project_id):

            project["tasksCount"] = total

            project["completedCount"] = completed

            project["progress"] = progress

    write_data(
        "projects.json",
        projects
    )


# ============================================================
# RESOURCES
# ============================================================

@app.get("/resources")
@app.get("/api/resources")
def get_resources(
    project_id: str = None
):

    resources = read_data(
        "resources.json"
    )

    if project_id:

        return [
            resource
            for resource in resources
            if str(
                resource.get("projectId")
            )
            == str(project_id)
        ]

    return resources


@app.get("/api/projects/{project_id}/resources")
def get_project_resources(
    project_id: str
):

    resources = read_data(
        "resources.json"
    )

    return [
        resource
        for resource in resources
        if str(
            resource.get("projectId")
        )
        == str(project_id)
    ]


@app.post("/resources")
@app.post("/api/resources")
def create_resource(resource: dict):

    resources = read_data(
        "resources.json"
    )

    resource["id"] = get_next_str_id(
        resources,
        "res"
    )

    resources.append(resource)

    write_data(
        "resources.json",
        resources
    )

    return {
        "message": "Resource saved successfully",
        "resource": resource
    }


# ============================================================
# NOTIFICATIONS
# ============================================================

@app.get("/api/notifications")
def get_notifications():

    notifications = [

        {
            "id": "notif-1",
            "message": (
                "Anu accepted your help request "
                "for Task Management UI."
            ),
            "type": "success",
            "time": "10m ago",
            "read": False
        },

        {
            "id": "notif-2",
            "message": (
                "AI suggested 2 task reallocations "
                "to balance Arjun's high workload."
            ),
            "type": "info",
            "time": "35m ago",
            "read": False
        },

        {
            "id": "notif-3",
            "message": (
                "Your task 'Build authentication API' "
                "is due tomorrow."
            ),
            "type": "warning",
            "time": "2h ago",
            "read": True
        }
    ]

    return notifications


# ============================================================
# SPRINT PLANNING
# ============================================================

def update_sprint_statistics(sprint_id):

    sprints = read_data(
        "sprints.json"
    )

    tasks = read_data(
        "tasks.json"
    )

    sprint_tasks = [
        task for task in tasks
        if (
            str(task.get("sprintId"))
            == str(sprint_id)
        )
        or (
            str(task.get("sprint_id"))
            == str(sprint_id)
        )
    ]

    total = len(sprint_tasks)

    completed = len([
        task for task in sprint_tasks
        if is_completed(task)
    ])

    in_progress = len([
        task for task in sprint_tasks
        if is_in_progress(task)
    ])

    todo = len([
        task for task in sprint_tasks
        if is_todo(task)
    ])

    progress = (
        round(
            completed / total * 100
        )
        if total > 0
        else 0
    )

    for sprint in sprints:

        if str(sprint.get("id")) == str(sprint_id):

            sprint["plannedCount"] = total

            sprint["completedCount"] = completed

            sprint["inProgressCount"] = in_progress

            sprint["todoCount"] = todo

            sprint["progress"] = progress

            # Velocity = completed tasks
            sprint["velocity"] = completed

            sprint["taskIds"] = [
                task.get("id")
                for task in sprint_tasks
            ]

    write_data(
        "sprints.json",
        sprints
    )


@app.get("/api/sprints")
def get_sprints(
    project_id: str = None
):

    sprints = read_data(
        "sprints.json"
    )

    if project_id:

        sprints = [
            sprint
            for sprint in sprints
            if str(
                sprint.get("projectId")
            )
            == str(project_id)
        ]

    tasks = read_data(
        "tasks.json"
    )

    result = []

    for sprint in sprints:

        sprint_copy = dict(sprint)

        sprint_tasks = [
            task
            for task in tasks
            if (
                str(task.get("sprintId"))
                == str(sprint.get("id"))
            )
            or (
                str(task.get("sprint_id"))
                == str(sprint.get("id"))
            )
        ]

        total = len(sprint_tasks)

        completed = len([
            task for task in sprint_tasks
            if is_completed(task)
        ])

        in_progress = len([
            task for task in sprint_tasks
            if is_in_progress(task)
        ])

        todo = len([
            task for task in sprint_tasks
            if is_todo(task)
        ])

        progress = (
            round(
                completed / total * 100
            )
            if total > 0
            else 0
        )

        sprint_copy["plannedCount"] = total

        sprint_copy["completedCount"] = completed

        sprint_copy["inProgressCount"] = in_progress

        sprint_copy["todoCount"] = todo

        sprint_copy["progress"] = progress

        sprint_copy["velocity"] = completed

        result.append(sprint_copy)

    return result


@app.get("/api/projects/{project_id}/sprints")
def get_project_sprints(
    project_id: str
):

    return get_sprints(project_id)


@app.get("/api/sprints/{sprint_id}")
def get_sprint(
    sprint_id: str
):

    sprints = read_data(
        "sprints.json"
    )

    tasks = read_data(
        "tasks.json"
    )

    sprint = next(
        (
            sprint
            for sprint in sprints
            if str(sprint.get("id"))
            == str(sprint_id)
        ),
        None
    )

    if not sprint:

        raise HTTPException(
            status_code=404,
            detail="Sprint not found"
        )

    sprint_tasks = [
        task
        for task in tasks
        if (
            str(task.get("sprintId"))
            == str(sprint_id)
        )
        or (
            str(task.get("sprint_id"))
            == str(sprint_id)
        )
    ]

    total = len(sprint_tasks)

    completed = len([
        task
        for task in sprint_tasks
        if is_completed(task)
    ])

    in_progress = len([
        task
        for task in sprint_tasks
        if is_in_progress(task)
    ])

    todo = len([
        task
        for task in sprint_tasks
        if is_todo(task)
    ])

    progress = (
        round(
            completed / total * 100
        )
        if total > 0
        else 0
    )

    return {

        "sprint": sprint,

        "tasks": sprint_tasks,

        "statistics": {

            "totalTasks": total,

            "completedTasks": completed,

            "inProgressTasks": in_progress,

            "todoTasks": todo,

            "remainingTasks": (
                total - completed
            ),

            "progress": progress
        }
    }


@app.post("/api/sprints")
def create_sprint(
    sprint: dict
):

    sprints = read_data(
        "sprints.json"
    )

    sprint["id"] = get_next_str_id(
        sprints,
        "sprint"
    )

    sprint.setdefault(
        "name",
        "New Sprint"
    )

    sprint.setdefault(
        "status",
        "planned"
    )

    sprint.setdefault(
        "taskIds",
        []
    )

    sprint.setdefault(
        "plannedCount",
        0
    )

    sprint.setdefault(
        "completedCount",
        0
    )

    sprint.setdefault(
        "velocity",
        0
    )

    sprint.setdefault(
        "progress",
        0
    )

    sprint.setdefault(
        "goal",
        ""
    )

    sprints.append(sprint)

    write_data(
        "sprints.json",
        sprints
    )

    return {
        "success": True,
        "message": (
            "Sprint created successfully"
        ),
        "sprint": sprint
    }


@app.patch("/api/sprints/{sprint_id}")
def update_sprint(
    sprint_id: str,
    updates: dict
):

    sprints = read_data(
        "sprints.json"
    )

    for sprint in sprints:

        if (
            str(sprint.get("id"))
            == str(sprint_id)
        ):

            sprint.update(updates)

            write_data(
                "sprints.json",
                sprints
            )

            return {
                "success": True,
                "message": "Sprint updated",
                "sprint": sprint
            }

    raise HTTPException(
        status_code=404,
        detail="Sprint not found"
    )


@app.delete("/api/sprints/{sprint_id}")
def delete_sprint(
    sprint_id: str
):

    sprints = read_data(
        "sprints.json"
    )

    new_sprints = [
        sprint
        for sprint in sprints
        if str(sprint.get("id"))
        != str(sprint_id)
    ]

    if len(new_sprints) == len(sprints):

        raise HTTPException(
            status_code=404,
            detail="Sprint not found"
        )

    write_data(
        "sprints.json",
        new_sprints
    )

    return {
        "success": True,
        "message": "Sprint deleted"
    }


# ============================================================
# EMPLOYEE PERFORMANCE ANALYTICS
# ============================================================

def calculate_employee_stats(
    user,
    tasks
):

    user_id = str(
        user.get("id")
    )

    user_name = str(
        user.get("name", "")
    ).lower()

    employee_tasks = []

    for task in tasks:

        assignee_id = str(
            task.get("assigneeId")
            or task.get("assignedToId")
            or ""
        )

        assignee_name = str(
            task.get("assigneeName")
            or task.get("assignedTo")
            or ""
        ).lower()

        if (
            assignee_id == user_id
            or (
                user_name
                and assignee_name == user_name
            )
        ):

            employee_tasks.append(task)

    total = len(employee_tasks)

    completed = len([
        task
        for task in employee_tasks
        if is_completed(task)
    ])

    in_progress = len([
        task
        for task in employee_tasks
        if is_in_progress(task)
    ])

    todo = len([
        task
        for task in employee_tasks
        if is_todo(task)
    ])

    overdue = 0

    today = datetime.now().date()

    for task in employee_tasks:

        due_date = (
            task.get("dueDate")
            or task.get("due_date")
        )

        if not due_date:
            continue

        if is_completed(task):
            continue

        try:

            due = datetime.strptime(
                str(due_date)[:10],
                "%Y-%m-%d"
            ).date()

            if due < today:
                overdue += 1

        except ValueError:
            continue

    completion_rate = (
        round(
            completed / total * 100,
            1
        )
        if total > 0
        else 0
    )

    contribution = (
        completed * 2
        + in_progress
    )

    return {

        "employeeId": user.get("id"),

        "employee": user.get(
            "name",
            "Unknown"
        ),

        "role": user.get(
            "role",
            ""
        ),

        "totalTasks": total,

        "completedTasks": completed,

        "inProgressTasks": in_progress,

        "todoTasks": todo,

        "overdueTasks": overdue,

        "completionRate": completion_rate,

        "contribution": contribution,

        "workload": user.get(
            "workload",
            "unknown"
        )
    }


@app.get("/api/analytics/employees")
def get_employee_analytics():

    users = read_data(
        "users.json"
    )

    tasks = read_data(
        "tasks.json"
    )

    analytics = []

    for user in users:

        analytics.append(
            calculate_employee_stats(
                user,
                tasks
            )
        )

    return {
        "success": True,
        "employees": analytics
    }


@app.get("/api/analytics/employees/{employee_id}")
def get_employee_analytics_by_id(
    employee_id: str
):

    users = read_data(
        "users.json"
    )

    tasks = read_data(
        "tasks.json"
    )

    user = next(
        (
            user
            for user in users
            if str(user.get("id"))
            == str(employee_id)
        ),
        None
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    stats = calculate_employee_stats(
        user,
        tasks
    )

    return {
        "success": True,
        "employee": stats
    }


@app.get("/api/analytics/team")
def get_team_analytics():

    users = read_data(
        "users.json"
    )

    tasks = read_data(
        "tasks.json"
    )

    employee_data = []

    for user in users:

        employee_data.append(
            calculate_employee_stats(
                user,
                tasks
            )
        )

    total_tasks = len(tasks)

    completed_tasks = len([
        task
        for task in tasks
        if is_completed(task)
    ])

    overall_completion = (
        round(
            completed_tasks
            / total_tasks
            * 100,
            1
        )
        if total_tasks > 0
        else 0
    )

    return {

        "success": True,

        "summary": {

            "totalEmployees": len(users),

            "totalTasks": total_tasks,

            "completedTasks": completed_tasks,

            "overallCompletionRate":
                overall_completion
        },

        "employees": employee_data
    }


@app.get("/api/analytics/project/{project_id}")
def get_project_analytics(
    project_id: str
):

    users = read_data(
        "users.json"
    )

    tasks = read_data(
        "tasks.json"
    )

    project_tasks = [
        task
        for task in tasks
        if str(
            task.get("projectId")
        )
        == str(project_id)
    ]

    total = len(project_tasks)

    completed = len([
        task
        for task in project_tasks
        if is_completed(task)
    ])

    in_progress = len([
        task
        for task in project_tasks
        if is_in_progress(task)
    ])

    project_completion = (
        round(
            completed / total * 100,
            1
        )
        if total > 0
        else 0
    )

    employee_stats = []

    for user in users:

        user_tasks = []

        for task in project_tasks:

            assignee_id = str(
                task.get("assigneeId")
                or task.get("assignedToId")
                or ""
            )

            assignee_name = str(
                task.get("assigneeName")
                or task.get("assignedTo")
                or ""
            ).lower()

            if (
                assignee_id
                == str(user.get("id"))
                or assignee_name
                == str(
                    user.get(
                        "name",
                        ""
                    )
                ).lower()
            ):

                user_tasks.append(task)

        user_total = len(
            user_tasks
        )

        user_completed = len([
            task
            for task in user_tasks
            if is_completed(task)
        ])

        employee_stats.append({

            "employeeId":
                user.get("id"),

            "employee":
                user.get("name"),

            "tasks":
                user_total,

            "completed":
                user_completed,

            "completionRate": (
                round(
                    user_completed
                    / user_total
                    * 100,
                    1
                )
                if user_total
                else 0
            )
        })

    return {

        "success": True,

        "projectId":
            project_id,

        "summary": {

            "totalTasks":
                total,

            "completedTasks":
                completed,

            "inProgressTasks":
                in_progress,

            "completionRate":
                project_completion
        },

        "employees":
            employee_stats
    }


# ============================================================
# AI ENDPOINTS
# ============================================================

@app.get("/api/ai/suggestions")
def get_ai_suggestions():

    tasks = read_data(
        "tasks.json"
    )

    users = read_data(
        "users.json"
    )

    suggestions = []

    for task in tasks:

        if (
            not task.get("assigneeId")
            or task.get("assigneeId")
            is None
        ):

            required = set(
                task.get(
                    "requiredSkills",
                    []
                )
            )

            best_member = None

            best_score = 0

            for user in users:

                user_skills = set(
                    user.get(
                        "skills",
                        []
                    )
                )

                score = len(
                    required
                    & user_skills
                )

                if score > best_score:

                    best_score = score

                    best_member = user

            if best_member:

                total_skills = (
                    len(required)
                    if required
                    else 1
                )

                match_pct = round(
                    (
                        best_score
                        / total_skills
                    ) * 100
                )

                suggestions.append({

                    "id":
                        f"sugg-{task['id']}",

                    "taskId":
                        task["id"],

                    "taskTitle":
                        task.get(
                            "title",
                            "Untitled Task"
                        ),

                    "requiredSkills":
                        task.get(
                            "requiredSkills",
                            []
                        ),

                    "currentAssignee":
                        task.get(
                            "assigneeName",
                            "Unassigned"
                        ),

                    "suggestedMemberId":
                        best_member["id"],

                    "suggestedMemberName":
                        best_member["name"],

                    "matchScore":
                        max(
                            match_pct,
                            70
                        ),

                    "reason":
                        (
                            f"{best_member['name']} "
                            "has the highest skill "
                            "compatibility "
                            f"({max(match_pct, 70)}%) "
                            "for this task."
                        )
                })

    return suggestions[:3]


@app.post("/api/ai/ask")
def ask_ai(body: dict):

    query = (
        body.get("query")
        or ""
    ).lower()

    tasks = read_data(
        "tasks.json"
    )

    users = read_data(
        "users.json"
    )

    completed = [
        task
        for task in tasks
        if is_completed(task)
    ]

    active = [
        task
        for task in tasks
        if not is_completed(task)
    ]

    progress = (
        round(
            len(completed)
            / len(tasks)
            * 100
        )
        if tasks
        else 0
    )

    low_members = [
        user
        for user in users
        if (
            user.get("workload")
            == "low"
            and user.get(
                "availableToHelp"
            )
        )
    ]

    rec_member = (
        low_members[0]
        if low_members
        else (
            users[0]
            if users
            else None
        )
    )

    # --------------------------------------------------------
    # AUTH / API / BACKEND
    # --------------------------------------------------------

    if any(
        keyword in query
        for keyword in [
            "auth",
            "authentication",
            "api",
            "backend"
        ]
    ):

        return {

            "answer":
                (
                    "Based on team skills and "
                    "current workload, I recommend "
                    "checking with your Backend "
                    "Developer. The authentication "
                    "endpoints are a high-priority "
                    "task and completing them helps "
                    "frontend integration."
                ),

            "recommendation": {

                "collaborator":
                    (
                        rec_member["name"]
                        if rec_member
                        else "Rahul"
                    ),

                "role":
                    (
                        rec_member["role"]
                        if rec_member
                        else "Backend Developer"
                    ),

                "skills":
                    (
                        rec_member.get(
                            "skills",
                            [
                                "Python",
                                "FastAPI"
                            ]
                        )[:3]
                        if rec_member
                        else [
                            "Python",
                            "FastAPI"
                        ]
                    ),

                "workload":
                    (
                        (
                            rec_member.get(
                                "workload"
                            )
                            or "balanced"
                        ).capitalize()
                        + " ("
                        + str(
                            rec_member.get(
                                "activeTasks",
                                2
                            )
                        )
                        + " active tasks)"
                        if rec_member
                        else "Balanced"
                    ),

                "reason":
                    (
                        "Highest skill match "
                        "for authentication "
                        "and API development."
                    ),

                "actionText":
                    (
                        f"Ask "
                        f"{rec_member['name']}"
                        if rec_member
                        else "Ask Rahul"
                    )
            }
        }

    # --------------------------------------------------------
    # HELP / STUCK
    # --------------------------------------------------------

    elif any(
        keyword in query
        for keyword in [
            "help",
            "stuck",
            "assist",
            "who"
        ]
    ):

        return {

            "answer":
                (
                    f"I found "
                    f"{len(low_members)} "
                    "team member(s) with low "
                    "workload and available "
                    "capacity right now."
                ),

            "recommendation": {

                "collaborator":
                    (
                        rec_member["name"]
                        if rec_member
                        else "Meera"
                    ),

                "role":
                    (
                        rec_member["role"]
                        if rec_member
                        else "AI/ML Engineer"
                    ),

                "skills":
                    (
                        rec_member.get(
                            "skills",
                            [
                                "Python",
                                "NLP"
                            ]
                        )[:3]
                        if rec_member
                        else [
                            "Python",
                            "NLP"
                        ]
                    ),

                "workload":
                    (
                        f"Low ("
                        f"{rec_member.get('activeTasks', 1)} "
                        "active task)"
                        if rec_member
                        else "Low (1 active task)"
                    ),

                "reason":
                    (
                        "Has open bandwidth "
                        "and relevant skills "
                        "to help unblock work."
                    ),

                "actionText":
                    (
                        f"Ask "
                        f"{rec_member['name']}"
                        if rec_member
                        else "Ask Meera"
                    )
            }
        }

    # --------------------------------------------------------
    # WORKLOAD
    # --------------------------------------------------------

    elif any(
        keyword in query
        for keyword in [
            "workload",
            "balance",
            "overload",
            "overloaded"
        ]
    ):

        high_members = [
            user
            for user in users
            if user.get("workload")
            == "high"
        ]

        return {

            "answer":
                (
                    f"Workload analysis: "
                    f"{len(high_members)} "
                    "member(s) are at HIGH "
                    "workload. Team overall "
                    f"is at {progress}% "
                    "task completion."
                ),

            "recommendation": {

                "collaborator":
                    (
                        rec_member["name"]
                        if rec_member
                        else "Anu"
                    ),

                "role":
                    (
                        rec_member["role"]
                        if rec_member
                        else "Frontend Developer"
                    ),

                "skills":
                    (
                        rec_member.get(
                            "skills",
                            [
                                "HTML",
                                "CSS"
                            ]
                        )[:3]
                        if rec_member
                        else [
                            "HTML",
                            "CSS"
                        ]
                    ),

                "workload":
                    "Balanced — can take on 1 more task",

                "reason":
                    (
                        "Best candidate to "
                        "absorb reallocated "
                        "tasks without reaching "
                        "high workload."
                    ),

                "actionText":
                    (
                        f"Reallocate to "
                        f"{rec_member['name']}"
                        if rec_member
                        else "Reallocate to Anu"
                    )
            }
        }

    # --------------------------------------------------------
    # DEFAULT
    # --------------------------------------------------------

    else:

        unassigned = [
            task
            for task in tasks
            if not task.get(
                "assigneeId"
            )
        ]

        return {

            "answer":
                (
                    "Project analysis complete. "
                    f"Team task completion is "
                    f"{progress}%. "
                    f"{len(active)} task(s) "
                    "are active and "
                    f"{len(unassigned)} "
                    "task(s) are unassigned."
                ),

            "recommendation": {

                "collaborator":
                    (
                        rec_member["name"]
                        if rec_member
                        else "Rahul"
                    ),

                "role":
                    (
                        rec_member["role"]
                        if rec_member
                        else "Backend Developer"
                    ),

                "skills":
                    (
                        rec_member.get(
                            "skills",
                            ["Python"]
                        )[:3]
                        if rec_member
                        else ["Python"]
                    ),

                "workload":
                    "Balanced",

                "reason":
                    (
                        "Available team member "
                        "who can pick up "
                        "unassigned work."
                    ),

                "actionText":
                    (
                        f"Assign to "
                        f"{rec_member['name']}"
                        if rec_member
                        else "Assign to Rahul"
                    )
            }
        }

