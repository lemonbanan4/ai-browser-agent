FROM python:3.11-slim

# Install system deps for Playwright (works on Render)
RUN apt-get update && apt-get install -y \
    wget \
    libnss3 \
    libgconf-2-4 \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxrandr2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libgbm1 \
    libx11-xcb1 \
    libxshmfence1 \
    libpangocairo-1.0-0 \
    libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright + browser binaries
RUN pip install playwright==1.56.0
RUN playwright install chromium

# Copy code
COPY app /app/app
COPY screenshots /app/screenshots

# Expose FastAPI port
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
