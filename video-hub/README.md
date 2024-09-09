# Math video hub 

## Setup
This project uses the following core technologies for development:
- Python: version 3.11 and onwards
- Dependency manager: [pip-tools](https://github.com/jazzband/pip-tools?tab=readme-ov-file#installation)

### Python 
Install a version of Python as you desire, the recommended way is with [Pyenv](https://github.com/pyenv/pyenv?tab=readme-ov-file#installation).
- Install a Python version by running `pyenv install 3.<minor-version>.<patch>`. This downloads the Python version
- Set a local Python version by running `pyenv local 3.<minor-version>.<patch>` in root directory of the project. Pyenv creates a file called `.python-version` in the directory where the command was run. Pyenv uses the file to detect the version of Python to be used in this directory and its subdirectories.

### Dependencies
Run the command `make setup`. It creates and activates the [virtual environment](https://docs.python.org/3/library/venv.html), installs pip-tools and install the development dependencies.

## Development

### Managing dependencies

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `pip-compile`             | Compiles `requirements.in` into `requirements.txt` file                 |
| `pip-sync`             | Installs dependencies based on the `requirements.txt` lock-file      |
