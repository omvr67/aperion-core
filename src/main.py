from store import AperionStore


def main():

    store = AperionStore()

    # Start with a fresh in-memory state for demo runs so repeated executions
    # don't append duplicates to the persisted JSON files.
    store.tasks.clear()
    store.projects.clear()
    store.sections.clear()
    store.save()

    # ---------------------------------------------------------
    # Projects
    # ---------------------------------------------------------

    university = store.create_project(
        name="University",
        description="University work",
        color="blue",
        icon="graduationcap",
    )

    aperion = store.create_project(
        name="Build Aperion",
        description="Development of Aperion",
        color="purple",
        icon="hammer",
    )

    # ---------------------------------------------------------
    # Sub-project
    # ---------------------------------------------------------

    algorithms = store.create_subproject(
        parent_project_id=university.id,
        name="Algorithms",
    )

    # ---------------------------------------------------------
    # Sections
    # ---------------------------------------------------------

    development = store.create_section(
        project_id=aperion.id,
        name="Development",
    )

    testing = store.create_section(
        project_id=aperion.id,
        name="Testing",
    )

    # ---------------------------------------------------------
    # Tasks
    # ---------------------------------------------------------

    standalone = store.create_task(
        title="Buy groceries"
    )

    university_task = store.create_task(
        title="Study algorithms",
        project_id=university.id,
    )

    aperion_task = store.create_task(
        title="Implement data model",
        project_id=aperion.id,
        section_id=development.id,
        priority="high",
    )

    testing_task = store.create_task(
        title="Test project hierarchy",
        project_id=aperion.id,
        section_id=testing.id,
    )

    # ---------------------------------------------------------
    # Complete a task
    # ---------------------------------------------------------

    store.complete_task(testing_task.id)

    # ---------------------------------------------------------
    # Print results
    # ---------------------------------------------------------

    print()
    print("APERION CORE")
    print("=" * 40)

    print()
    print("PROJECTS")

    for project in store.projects:

        project_type = (
            "Sub-project"
            if project.parent_project_id
            else "Project"
        )

        print(
            f"- {project.name} "
            f"({project_type})"
        )

    print()
    print("TASKS")

    for task in store.tasks:

        status = "✓" if task.completed else "○"

        print(
            f"{status} {task.title}"
        )

    print()
    print("STANDALONE TASKS")

    for task in store.get_standalone_tasks():

        print(f"- {task.title}")

    print()
    print("ACTIVE TASKS")

    for task in store.get_active_tasks():

        print(f"- {task.title}")

    print()
    print("COMPLETED TASKS")

    for task in store.get_completed_tasks():

        print(f"- {task.title}")


if __name__ == "__main__":
    main()