FROM python:3.12-slim@sha256:2f17fc044b579bab302c2e8054d3a686e2cb9a83de48e70534b94cd8ebbe06a9 AS dependencies

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app
COPY requirements.txt ./requirements.txt
RUN python -m pip install --no-cache-dir -r requirements.txt \
    && useradd --system --uid 10001 --no-create-home app

FROM dependencies AS runtime
COPY app ./app
COPY web ./web

USER app
EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=2).close()"]
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM dependencies AS test
COPY requirements-dev.txt ./requirements-dev.txt
RUN python -m pip install --no-cache-dir -r requirements-dev.txt \
    && chown app:app /app
COPY pyproject.toml ./pyproject.toml
COPY app ./app
COPY web ./web
COPY tests ./tests
USER app
HEALTHCHECK NONE
CMD ["python", "-m", "pytest"]

FROM runtime AS production
