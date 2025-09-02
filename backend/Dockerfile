# Use an official lightweight Python image.
FROM python:3.10-slim

# Set the working directory in the container.
WORKDIR /app

# Copy the requirements file and install dependencies.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy your application code.
COPY . .

# Expose the port Gunicorn will run on.
EXPOSE 8080

# The command to run your app.
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "app:app"]