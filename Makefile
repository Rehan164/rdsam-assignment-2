VENV = venv
FLASK_APP = app.py

install:
	python -m venv $(VENV)
	./$(VENV)/Scripts/pip install -r requirements.txt

run:
	./$(VENV)/Scripts/python -m flask run --port 3000

clean:
	rm -rf $(VENV)

reinstall: clean install