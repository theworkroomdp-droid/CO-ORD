from pydantic import BaseModel


class User(BaseModel):
    id: int
    name: str
    email: str
    skills: list[str]


class Project(BaseModel):
    id: int
    name: str
    description: str


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