FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir fastapi uvicorn pydantic motor pymongo python-dotenv httpx websockets python-multipart bcrypt python-jose passlib aiohttp yfinance numpy pandas
COPY . .
RUN mkdir -p ml_models
EXPOSE 8001
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
