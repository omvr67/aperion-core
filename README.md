# Aperion Core

A platform-independent Python prototype of **Aperion's core data model and business logic**.

Aperion is intended to become a simple, extremely polished personal to-do application for macOS. This prototype exists to validate the architecture and behavior of the application before implementing the final product in **Swift, SwiftUI, and SwiftData**.

> **Aperion Core is a validation prototype, not the final application.**

## Architecture

The prototype is intentionally divided into three layers.

**Models — `src/models.py`**  
Defines Aperion's core entities: `Task`, `Subtask`, `Project`, `Section`, and `Priority`, along with their basic validation.

**Store — `src/store.py`**  
Contains the application's business logic. It manages tasks, projects, sections, completion, movement, deletion, queries, and the rules governing relationships between entities.

**Storage — `src/storage.py`**  
Handles persistence using JSON files stored in `data/`.

This separation allows the application's rules to be tested independently of any user interface.

## Data Model

A **Task** has a title, completion state, notes, priority, creation date, attachments, links, subtasks, and optional project and section relationships. Tasks can therefore exist independently or belong to a project.

A **Project** has a name, description, color, icon, sections, tasks, and optional sub-projects. Aperion allows exactly one level of sub-projects; a sub-project cannot contain another sub-project.

A **Section** belongs to a project and organizes tasks within it. A task's section must always belong to the same project as the task.

Tasks currently support four priorities: `none`, `low`, `medium`, and `high`.

## Core Rules

The business logic enforces Aperion's fundamental rules rather than relying on the future UI to do so.

Tasks may be standalone or belong to a project. They can be completed, uncompleted, moved between projects or sections, and deleted. Deleting a project does not delete its tasks; those tasks become standalone instead.

Projects cannot be deleted while they contain sub-projects, and invalid project or section relationships are rejected. Titles and names cannot be empty.

## Persistence

The current prototype uses simple JSON storage:

```text
data/
├── tasks.json
├── projects.json
└── sections.json
```

This is intentionally lightweight. The goal is to validate the data model and business logic rather than replicate the production persistence layer.

## Project Structure

```text
aperion-core/
├── data/
├── src/
│   ├── models.py
│   ├── storage.py
│   ├── store.py
│   └── main.py
├── tests/
│   ├── test_models.py
│   └── test_store.py
├── .gitignore
└── README.md
```

## Testing

The test suite validates the models, business rules, relationships, task and project operations, validation, and JSON persistence.

Run the complete suite with:

```bash
pytest
```

Run the prototype with:

```bash
python src/main.py
```

If the virtual environment has not been activated:

```bash
source .venv/bin/activate
```

## Status

**Step 1 — Core Data Prototype**

The core models, business logic, persistence, validation, and test suite are in place. The remaining work is to resolve any serialization issues and ensure the complete test suite passes consistently.

## What's Next

Once the core prototype is fully validated, development will move to the native macOS application using **Swift, SwiftUI, and SwiftData** with local-first persistence.

The Python implementation will serve as a reference for the behavior and rules that the native application must preserve.