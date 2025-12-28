# ---------- Base image ----------
  FROM python:3.12-slim AS base

  # System deps for psycopg, etc.
  RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential \
      libpq-dev \
   && rm -rf /var/lib/apt/lists/*
  
  WORKDIR /app
  
  # Install Python deps (cache-friendly)
  COPY requirements.txt .
  RUN pip install --no-cache-dir --upgrade pip \
   && pip install --no-cache-dir -r requirements.txt
  
  # ---------- Development image ----------
  FROM base AS dev
  COPY . .
  EXPOSE 8000
  CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
  
  # ---------- Production image ----------
  FROM base AS prod
  COPY . .
  EXPOSE 8000
  # Railway will override this with startCommand, but this is a fallback
  CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
  