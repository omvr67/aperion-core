import json
from pathlib import Path
from dataclasses import asdict


class JSONStorage:
    def __init__(self, data_directory: str = "data"):
        self.data_directory = Path(data_directory)
        self.data_directory.mkdir(exist_ok=True)

    def save(self, filename: str, objects: list):
        path = self.data_directory / filename

        data = [asdict(obj) for obj in objects]

        with open(path, "w", encoding="utf-8") as file:
            json.dump(data, file, indent=4)

    def load(self, filename: str) -> list:
        path = self.data_directory / filename

        if not path.exists():
            return []

        with open(path, "r", encoding="utf-8") as file:
            return json.load(file)