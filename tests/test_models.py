import sys
from pathlib import Path

sys.path.insert(
    0,
    str(Path(__file__).resolve().parent.parent / "src")
)

from models import Task, Project, Section

import pytest


def test_task_can_exist_without_project():

    task = Task(
        title="Buy groceries"
    )

    assert task.title == "Buy groceries"
    assert task.project_id is None
    assert task.section_id is None
    assert task.completed is False


def test_project_has_no_parent_by_default():

    project = Project(
        name="University"
    )

    assert project.parent_project_id is None


def test_subproject_has_parent():

    parent = Project(
        name="University"
    )

    child = Project(
        name="Algorithms",
        parent_project_id=parent.id
    )

    assert child.parent_project_id == parent.id


def test_section_belongs_to_project():

    project = Project(
        name="Build Aperion"
    )

    section = Section(
        name="Development",
        project_id=project.id
    )

    assert section.project_id == project.id


def test_task_completion():

    task = Task(
        title="Test task"
    )

    assert task.completed is False

    task.completed = True

    assert task.completed is True

def test_task_cannot_have_empty_title():

    with pytest.raises(ValueError):

        Task(
            title=""
        )


def test_project_cannot_have_empty_name():

    with pytest.raises(ValueError):

        Project(
            name=""
        )


def test_section_cannot_have_empty_name():

    with pytest.raises(ValueError):

        Section(
            name="",
            project_id="project"
        )