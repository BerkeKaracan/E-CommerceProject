# ==========================================
# BACKEND: FASTAPI SERVER
# ==========================================

# 1. BASE IMAGE
# Use official Python 3.11 slim image to reduce container size
FROM python:3.11-slim

# 2. WORKING DIRECTORY
# Set the working directory inside the container
WORKDIR /app

# 3. COPY DEPENDENCIES FIRST (For Layer Caching)
# Copy only the requirements file first to leverage Docker cache
# This prevents reinstalling packages if only source code changes
COPY requirements.txt .

# 4. INSTALL DEPENDENCIES
# Install Python packages without storing cache to keep image small
RUN pip install --no-cache-dir -r requirements.txt

# 5. COPY SOURCE CODE
# Copy the rest of the backend source code into the container
COPY . .

# 6. EXPOSE PORT
# Expose the port that FastAPI will run on
EXPOSE 8000

# 7. RUN COMMAND
# Start the Uvicorn ASGI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", $PORT]