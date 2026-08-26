import sys
from pathlib import Path

import pytest

sys.path.insert(
    0,
    str(Path(__file__).resolve().parent.parent / "src")
)

from store import AperionStore


@pytest.fixture
def store(tmp_path):

    store = AperionStore()

    store.storage.data_directory = tmp_path

    store.tasks = []
    store.projects = []
    store.sections = []

    return store


def test_create_project(store):

    project = store.create_project(
        "University"
    )

    assert project.name == "University"
    assert project.parent_project_id is None


def test_create_subproject(store):

    parent = store.create_project(
        "University"
    )

    child = store.create_subproject(
        parent.id,
        "Algorithms"
    )

    assert child.parent_project_id == parent.id


def test_subproject_cannot_have_subproject(store):

    parent = store.create_project(
        "University"
    )

    child = store.create_subproject(
        parent.id,
        "Algorithms"
    )

    with pytest.raises(ValueError):

        store.create_subproject(
            child.id,
            "Chapter 1"
        )


def test_create_standalone_task(store):

    task = store.create_task(
        "Buy groceries"
    )

    assert task.project_id is None
    assert task.section_id is None


def test_create_project_task(store):

    project = store.create_project(
        "University"
    )

    task = store.create_task(
        "Study",
        project_id=project.id
    )

    assert task.project_id == project.id


def test_create_section_task(store):

    project = store.create_project(
        "Build Aperion"
    )

    section = store.create_section(
        project.id,
        "Development"
    )

    task = store.create_task(
        "Write models",
        project_id=project.id,
        section_id=section.id
    )

    assert task.section_id == section.id
    assert task.id in section.task_ids


def test_complete_task(store):

    task = store.create_task(
        "Test completion"
    )

    store.complete_task(task.id)

    assert task.completed is True


def test_uncomplete_task(store):

    task = store.create_task(
        "Test completion"
    )

    store.complete_task(task.id)
    store.uncomplete_task(task.id)

    assert task.completed is False

def test_data_survives_reload(tmp_path):

    store = AperionStore()

    store.storage.data_directory = tmp_path

    store.tasks = []
    store.projects = []
    store.sections = []

    project = store.create_project(
        "University"
    )

    task = store.create_task(
        "Study",
        project_id=project.id
    )

    new_store = AperionStore()

    new_store.storage.data_directory = tmp_path

    new_store.load()

    loaded_project = new_store.get_project(
        project.id
    )

    loaded_task = new_store.get_task(
        task.id
    )

    assert loaded_project is not None
    assert loaded_task is not None

    assert loaded_project.name == "University"
    assert loaded_task.title == "Study"

def test_task_does_not_require_project(store):

    task = store.create_task(
        "Independent task"
    )

    assert task.project_id is None

def test_task_can_belong_to_project(store):

    project = store.create_project(
        "University"
    )

    task = store.create_task(
        "Study",
        project_id=project.id
    )

    assert task.project_id == project.id

def test_section_requires_valid_project(store):

    with pytest.raises(ValueError):

        store.create_section(
            "fake-project-id",
            "Development"
        )

def test_section_must_belong_to_task_project(store):

    project_a = store.create_project(
        "University"
    )

    project_b = store.create_project(
        "Build Aperion"
    )

    section = store.create_section(
        project_a.id,
        "Development"
    )

    with pytest.raises(ValueError):

        store.create_task(
            "Invalid task",
            project_id=project_b.id,
            section_id=section.id
        )

def test_deleting_project_detaches_tasks(store):

    project = store.create_project(
        "University"
    )

    task = store.create_task(
        "Study",
        project_id=project.id
    )

    store.delete_project(project.id)

    assert store.get_project(project.id) is None

    assert store.get_task(task.id) is not None

    assert task.project_id is None

def test_move_task_between_sections(store):

    project = store.create_project(
        "Build Aperion"
    )

    development = store.create_section(
        project.id,
        "Development"
    )

    testing = store.create_section(
        project.id,
        "Testing"
    )

    task = store.create_task(
        "Write tests",
        project_id=project.id,
        section_id=development.id
    )

    assert task.id in development.task_ids

    store.move_task(
        task.id,
        project_id=project.id,
        section_id=testing.id
    )

    assert task.section_id == testing.id

    assert task.id not in development.task_ids

    assert task.id in testing.task_ids

