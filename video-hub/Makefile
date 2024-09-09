create-env:
	@echo "Creating virtual environment..."
	@python -m venv .venv

activate-env:
	@echo "Activating virtual environment..."
	@source .venv/bin/activate

install-dev-tools:
	@echo "Installing dependencies..."
	@python -m pip install --upgrade pip
	@python -m pip install pip-tools

install-deps:
	@echo "Installing dependencies..."
	@python -m pip-sync requirements.txt	

setup: create-env activate-env install-dev-tools install-deps
	@echo "Setup complete."
	
