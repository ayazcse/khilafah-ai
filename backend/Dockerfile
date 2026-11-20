# Builds and runs the KHILAFAH AI backend. Build context MUST be the repo
# root (not backend/), because the app imports sibling packages ai_engine,
# knowledge_graph, and simulations as top-level packages. See
# docker-compose.yml, which sets `context: .` and `dockerfile: backend/Dockerfile`.

FROM python:3.11-slim

WORKDIR /app

# System deps needed by psycopg (binary wheel still needs libpq at runtime on slim).
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the whole repo (backend + ai_engine + knowledge_graph + simulations + data).
COPY . .

RUN mkdir -p /app/data/uploads

EXPOSE 8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
