from typing import Optional

from models import Task, Project, Section
from storage import JSONStorage


class AperionStore:

    def __init__(self):
        self.storage = JSONStorage()

        self.tasks: list[Task] = []
        self.projects: list[Project] = []
        self.sections: list[Section] = []

        self.load()

    def create_project(
        self,
        name: str,
        description: Optional[str] = None,
        color: Optional[str] = None,
        icon: Optional[str] = None,
    ) -> Project:

        project = Project(
            name=name,
            description=description,
            color=color,
            icon=icon,
        )

        self.projects.append(project)
        self.save()

        return project

    # ---------------------------------------------------------
    # Persistence
    # ---------------------------------------------------------

    def load(self):
        self.tasks = [
            Task(**data)
            for data in self.storage.load("tasks.json")
        ]

        self.projects = [
            Project(**data)
            for data in self.storage.load("projects.json")
        ]

        self.sections = [
            Section(**data)
            for data in self.storage.load("sections.json")
        ]

    def save(self):
        self.storage.save("tasks.json", self.tasks)
        self.storage.save("projects.json", self.projects)
        self.storage.save("sections.json", self.sections)

    # ---------------------------------------------------------
    # Find helpers
    # ---------------------------------------------------------

    def get_task(self, task_id: str) -> Optional[Task]:
        return next(
            (task for task in self.tasks if task.id == task_id),
            None
        )

    def get_project(self, project_id: str) -> Optional[Project]:
        return next(
            (
                project
                for project in self.projects
                if project.id == project_id
            ),
            None
        )

    def get_section(self, section_id: str) -> Optional[Section]:
        return next(
            (
                section
                for section in self.sections
                if section.id == section_id
            ),
            None
        )


    def create_subproject(
            self,
            parent_project_id: str,
            name: str,
            description: Optional[str] = None,
            color: Optional[str] = None,
            icon: Optional[str] = None,
    ) -> Project:

        parent = self.get_project(parent_project_id)

        if parent is None:
            raise ValueError("Parent project does not exist.")

        if parent.parent_project_id is not None:
            raise ValueError(
                    "Sub-projects cannot contain other sub-projects."
            )

        project = Project(
            name=name,
            description=description,
            color=color,
            icon=icon,
            parent_project_id=parent.id,
        )

        self.projects.append(project)
        self.save()

        return project


    def create_section(
            self,
            project_id: str,
            name: str,
        ) -> Section:

            project = self.get_project(project_id)

            if project is None:
                raise ValueError("Project does not exist.")

            section = Section(
                name=name,
                project_id=project.id,
            )

            self.sections.append(section)
            project.section_ids.append(section.id)

            self.save()

            return section

    def create_task(
        self,
        title: str,
        notes: Optional[str] = None,
        priority: Optional[str] = None,
        project_id: Optional[str] = None,
        section_id: Optional[str] = None,
    ) -> Task:

        if project_id is not None:
            project = self.get_project(project_id)

            if project is None:
                raise ValueError(
                    "Project does not exist."
                )

        if section_id is not None:
            section = self.get_section(section_id)

            if section is None:
                raise ValueError(
                    "Section does not exist."
                )

            if project_id != section.project_id:
                raise ValueError(
                    "Section does not belong to the specified project."
                )

        task = Task(
            title=title,
            notes=notes,
            priority=priority,
            project_id=project_id,
            section_id=section_id,
        )

        self.tasks.append(task)

        if section_id is not None:
            section.task_ids.append(task.id)

        self.save()

        return task

    def complete_task(self, task_id: str):
        task = self.get_task(task_id)

        if task is None:
            raise ValueError("Task does not exist.")

        task.completed = True

        self.save()   

    def uncomplete_task(self, task_id: str):
        task = self.get_task(task_id)

        if task is None:
            raise ValueError("Task does not exist.")

        task.completed = False

        self.save()
      
    def delete_task(self, task_id: str):

        task = self.get_task(task_id)

        if task is None:
            raise ValueError("Task does not exist.")

        if task.section_id is not None:
            section = self.get_section(task.section_id)

            if section and task.id in section.task_ids:
                section.task_ids.remove(task.id)

        self.tasks.remove(task)

        self.save()

    def move_task(
        self,
        task_id: str,
        project_id: Optional[str] = None,
        section_id: Optional[str] = None,
    ):

        task = self.get_task(task_id)

        if task is None:
            raise ValueError("Task does not exist.")

        if project_id is not None:
            project = self.get_project(project_id)

            if project is None:
                raise ValueError(
                    "Project does not exist."
                )

        new_section = None

        if section_id is not None:
            new_section = self.get_section(section_id)

            if new_section is None:
                raise ValueError(
                    "Section does not exist."
                )

            if new_section.project_id != project_id:
                raise ValueError(
                    "Section does not belong to the project."
                )

        # Remove from old section
        if task.section_id is not None:
            old_section = self.get_section(task.section_id)

            if old_section and task.id in old_section.task_ids:
                old_section.task_ids.remove(task.id)

        # Update task
        task.project_id = project_id
        task.section_id = section_id

        # Add to new section
        if new_section is not None:
            new_section.task_ids.append(task.id)

        self.save()

    def delete_project(self, project_id: str):

        project = self.get_project(project_id)

        if project is None:
            raise ValueError("Project does not exist.")

        # Prevent deleting a project that still has sub-projects
        children = [
            p for p in self.projects
            if p.parent_project_id == project.id
        ]

        if children:
            raise ValueError(
                "Cannot delete a project that has sub-projects."
            )

        # Detach tasks from this project
        for task in self.tasks:
            if task.project_id == project.id:
                task.project_id = None
                task.section_id = None

        # Delete sections belonging to project
        self.sections = [
            section
            for section in self.sections
            if section.project_id != project.id
        ]

        self.projects.remove(project)

        self.save() 

    def get_project_tasks(
        self,
        project_id: str,
    ) -> list[Task]:

        return [
            task
            for task in self.tasks
            if task.project_id == project_id
        ]

    def get_section_tasks(
        self,
        section_id: str,
    ) -> list[Task]:

        return [
            task
            for task in self.tasks
            if task.section_id == section_id
        ] 

    def get_standalone_tasks(self) -> list[Task]:

        return [
            task
            for task in self.tasks
            if task.project_id is None
        ]  

    def get_active_tasks(self) -> list[Task]:

        return [
            task
            for task in self.tasks
            if not task.completed
        ]
    def get_completed_tasks(self) -> list[Task]:

        return [
            task
            for task in self.tasks
            if task.completed
        ]