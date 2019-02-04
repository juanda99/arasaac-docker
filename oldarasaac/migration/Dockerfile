FROM python:2
WORKDIR /app
COPY ./* /app/
EXPOSE 5000
RUN pip install --no-cache-dir -r requirements.txt ptvsd
#CMD ["python", "/app/pictos.py"]
