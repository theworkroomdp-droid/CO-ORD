import json
from pathlib import Path


DATA_FOLDER = Path(__file__).parent / "data"


def read_data(filename):
    file_path = DATA_FOLDER / filename

    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)


def write_data(filename, data):
    file_path = DATA_FOLDER / filename

    with open(file_path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4)