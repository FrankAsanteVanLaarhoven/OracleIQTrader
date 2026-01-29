FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .

# Install Python dependencies (excluding heavy ML libraries for production)
RUN pip install --no-cache-dir -r requirements.txt || \
    pip install --no-cache-dir \
    fastapi==0.115.12 \
    uvicorn==0.34.1 \
    pydantic==2.11.2 \
    motor==3.7.1 \
    pymongo==4.10.1 \
    python-dotenv==1.1.0 \
    httpx==0.28.1 \
    websockets==14.2 \
    python-multipart==0.0.20 \
    bcrypt==4.3.0 \
    python-jose==3.4.0 \
    passlib==1.7.4 \
    aiohttp==3.11.14 \
    yfinance==0.2.55 \
    numpy==2.2.3 \
    pandas==2.2.3

# Copy application code
COPY . .

# Create ml_models directory
RUN mkdir -p ml_models

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2"]
