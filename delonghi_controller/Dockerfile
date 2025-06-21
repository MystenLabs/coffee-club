# Use Python 3.13 with Debian Bookworm slim as the base image
FROM python:3.13-slim-bookworm

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on

# Install system dependencies required for Bluetooth
RUN apt-get update && apt-get install -y --no-install-recommends \
    bluez \
    dbus \
    libdbus-1-dev \
    libglib2.0-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Make the script executable
RUN chmod +x src/delonghi_controller.py

# Set the entrypoint to run the application
ENTRYPOINT ["python", "-m", "src.delonghi_controller"]

# Default command (can be overridden)
CMD ["--help"]