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
