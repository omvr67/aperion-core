from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
import uuid
from enum import Enum

class Priority(str, Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

def generate_id() -> str:
    return str(uuid.uuid4())


@dataclass
class Subtask:
    id: str = field(default_factory=generate_id)
    title: str = ""
    completed: bool = False


@dataclass
class Task:
    id: str = field(default_factory=generate_id)
    title: str = ""

    completed: bool = False

    notes: Optional[str] = None
    priority: Priority = Priority.NONE

    project_id: Optional[str] = None
    section_id: Optional[str] = None

    created_at: str = field(
        default_factory=lambda: datetime.now().isoformat()
    )

    attachments: list[str] = field(default_factory=list)
    links: list[str] = field(default_factory=list)

    subtasks: list[Subtask] = field(default_factory=list)

    def __post_init__(self):
        # Validate that title is not empty or only whitespace
        if not self.title or not self.title.strip():
            raise ValueError("Task title cannot be empty.")


@dataclass
class Section:
    id: str = field(default_factory=generate_id)
    name: str = ""

    project_id: str = ""

    task_ids: list[str] = field(default_factory=list)

    def __post_init__(self):
        # Validate that section name is not empty or only whitespace
        if not self.name or not self.name.strip():
            raise ValueError("Section name cannot be empty.")


@dataclass
class Project:
    id: str = field(default_factory=generate_id)
    name: str = ""

    description: Optional[str] = None

    color: Optional[str] = None
    icon: Optional[str] = None

    parent_project_id: Optional[str] = None

    section_ids: list[str] = field(default_factory=list)

    def __post_init__(self):
        # Validate that project name is not empty or only whitespace
        if not self.name or not self.name.strip():
            raise ValueError("Project name cannot be empty.")
