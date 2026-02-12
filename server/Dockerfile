# Use official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into the container at /app
COPY . .

# Cloud Run defines the PORT environment variable, default to 8080
ENV PORT 8080

# Make port 8080 available to the world outside this container
EXPOSE 8080

# Run app.py when the container launches
# CMD ["python", "run.py"]
# Sử dụng Gunicorn để quản lý process tốt hơn trên Cloud Run
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 run:app
