FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Environment variables can be overridden in docker-compose
ENV BACKEND_URL=http://backend:8000

CMD ["python", "generate_metrics.py"]
