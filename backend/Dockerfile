FROM ghcr.io/microsoft/playwright/python:v1.56.0-jammy

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY app /app/app
COPY screenshots /app/screenshots

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
