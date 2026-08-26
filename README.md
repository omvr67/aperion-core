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

# Aperion Frontend Prototype

Aperion's first UI prototype: a fast, dependency-free frontend designed to explore the final macOS application's interaction model before implementing the native SwiftUI version.

## Run

No installation is required.

Open `index.html` in a browser, or serve the folder locally:

```bash
cd Aperion-Frontend
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## What is implemented

The prototype follows the current Aperion specification:

- Five primary destinations: All Tasks, Favorites, Search, Recently Deleted, Settings.
- Project navigation with one level of sub-project support.
- Sections inside projects.
- Tasks with completion, notes, priority, favorites, projects, sections and links.
- One-level subtasks.
- Fast task creation/editing.
- Drag-and-drop task reordering and moving.
- Recently Deleted with restore.
- Undo for destructive task deletion.
- Instant global search and recent searches.
- Light/dark/system appearance.
- Local persistence using `localStorage`.
- No backend, account, cloud service or external dependency.

## Important

This is a **UI/interaction prototype**, not the final Aperion architecture.

The production app should replace the browser persistence layer with the already-validated Aperion Core concepts and then SwiftData. The UI structure is intentionally close to the future SwiftUI component boundaries so the prototype can be used as a design reference during implementation.

## Suggested next step

Once the visual direction is approved, freeze the interaction/design specification and begin the native SwiftUI project in Xcode. The prototype should not become a second production codebase.
