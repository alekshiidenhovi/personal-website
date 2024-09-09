create-env:
	@echo "Creating virtual environment..."
	@python -m venv .venv

install-dev-tools:
	@echo "Installing development tools..."
	@.venv/bin/python -m pip install --upgrade pip
	@.venv/bin/python -m pip install pip-tools

compile-deps:
	@echo "Compiling dependencies..."
	@.venv/bin/pip-compile requirements.in

install-deps:
	@echo "Installing dependencies..."
	@.venv/bin/pip-sync requirements.txt	

setup: create-env install-dev-tools install-deps
	@echo "Setup complete."