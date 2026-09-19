from pydantic import BaseModel


class User(BaseModel):
    id: int
    name: str
    email: str
    skills: list[str]


class Project(BaseModel):
    id: int | None = None
    title: str
    deadline: str
    objective: str
    requiredInfo: str
    activeSprint: str
    bountyPool: int


class Task(BaseModel):
    id: int
    title: str
    description: str
    assigned_to: int
    status: str
    deadline: str


class Resource(BaseModel):
    id: int
    title: str
    url: str
    shared_by: int