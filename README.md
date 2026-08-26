# Aperion Core
A platform-independent Python prototype of Aperion's core data model and business logic.
The purpose of this prototype is to validate Aperion's underlying architecture before implementing the application itself in Swift and SwiftUI.
---
## Purpose
Aperion is designed as a simple, extremely polished personal to-do application.
This prototype focuses exclusively on the application's underlying data structure and behavior.
It does not contain a graphical interface and does not attempt to reproduce the final macOS application.
The prototype exists to answer one question:
> Does Aperion's core data model and its rules work correctly before we build the actual application?
---
## Architecture
The prototype is divided into three main layers:
```text
                    Aperion Core
                         │
                         ▼
                  ┌─────────────┐
                  │   Models    │
                  └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
                  │    Store    │
                  └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
                  │   Storage   │
                  └──────┬──────┘
                         │
                         ▼
                       JSON

Models

src/models.py

Contains Aperion’s core entities:

* Task
* Subtask
* Project
* Section
* Priority

The models define the structure of Aperion’s data and basic validation rules.

Store

src/store.py

Contains Aperion’s business logic.

The store is responsible for:

* Creating projects
* Creating sub-projects
* Creating sections
* Creating tasks
* Completing tasks
* Uncompleting tasks
* Moving tasks
* Deleting tasks
* Deleting projects
* Querying tasks and projects

The store also enforces Aperion’s architectural rules.

Storage

src/storage.py

Handles persistence using JSON files.

The current prototype stores data in:

data/
├── tasks.json
├── projects.json
└── sections.json

⸻

Core Data Model

Task

A task contains:

* ID
* Title
* Completion state
* Notes
* Priority
* Project relationship
* Section relationship
* Creation date
* Attachments
* Links
* Subtasks

A task does not require a project.

Therefore, Aperion supports both:

Standalone Task

and:

Project
└── Task

⸻

Project

A project contains:

* ID
* Name
* Description
* Color
* Icon
* Parent project relationship
* Sections

Projects may contain tasks directly.

Projects may also contain one level of sub-projects.

⸻

Sub-projects

Aperion supports:

Project
└── Sub-project

but does not support:

Project
└── Sub-project
    └── Sub-sub-project

Only one level of sub-projects is allowed.

This rule is enforced by the core business logic rather than relying on the user interface.

⸻

Section

A section belongs to a project and contains references to its tasks.

Example:

Build Aperion
├── Ideas
├── Development
└── Testing

Sections cannot exist independently of a project.

⸻

Core Rules

The current prototype enforces the following rules:

1. A task can exist without a project.
2. A task can belong to a project.
3. A task can belong to a section.
4. A section must belong to a valid project.
5. A task’s section must belong to the same project as the task.
6. A project can contain sub-projects.
7. A sub-project cannot contain another sub-project.
8. Only one level of project nesting is allowed.
9. Completing a task changes its completion state.
10. A completed task can be uncompleted.
11. Tasks can be moved between sections.
12. Tasks can be moved between projects.
13. Deleting a task removes it from its section.
14. Deleting a project does not delete its tasks.
15. Tasks belonging to a deleted project become standalone tasks.
16. A project containing sub-projects cannot be deleted.
17. Task titles cannot be empty.
18. Project names cannot be empty.
19. Section names cannot be empty.
20. Invalid project and section relationships are rejected.

⸻

Priorities

Tasks currently support four priority states:

none
low
medium
high

Priority values are represented using the Priority enum.

⸻

Project Structure

aperion-core/
│
├── data/
│   ├── tasks.json
│   ├── projects.json
│   └── sections.json
│
├── src/
│   ├── __init__.py
│   ├── models.py
│   ├── storage.py
│   ├── store.py
│   └── main.py
│
├── tests/
│   ├── test_models.py
│   └── test_store.py
│
├── .gitignore
├── README.md
└── .venv/

⸻

Running the Prototype

Activate the virtual environment:

source .venv/bin/activate

Run the prototype:

python src/main.py

Run the complete test suite:

pytest

⸻

Testing

The test suite verifies both the data models and the business logic.

Tests cover:

* Model creation
* Automatic IDs
* Task completion
* Standalone tasks
* Project tasks
* Sections
* Sub-projects
* Project hierarchy restrictions
* Invalid relationships
* Task movement
* Task deletion
* Project deletion
* Persistence
* Input validation

The goal is for the entire test suite to pass before moving to the next development phase.

⸻

Current Status

Step 1 — Core Data Prototype

* Basic project structure
* JSON persistence
* Task model
* Subtask model
* Project model
* Section model
* Priority model
* Automatic ID generation
* Project creation
* Sub-project creation
* One-level project hierarchy
* Section creation
* Task creation
* Task completion
* Task deletion
* Task movement
* Project deletion
* Task queries
* Validation
* Unit tests
* Persistence tests

⸻

Important Design Principle

This prototype deliberately separates Aperion’s data and business logic from its user interface.

The eventual macOS application should be able to provide a polished SwiftUI interface without changing the fundamental rules of the application.

The prototype is therefore not intended to become the final application.

Its purpose is to validate the architecture before moving into native macOS development.

⸻

Next Phase

After the core prototype is fully tested and the remaining serialization issues are resolved, the project can move toward the native macOS implementation.

The eventual application will use:

Swift
SwiftUI
SwiftData

with local-first persistence.

The Python prototype is a validation layer, not the final production implementation.