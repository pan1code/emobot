FROM python:3.12-slim

WORKDIR /app

COPY ml-service/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY ml-service /app

CMD ["uvicorn", "predict:app", "--host", "0.0.0.0", "--port", "9000"]
