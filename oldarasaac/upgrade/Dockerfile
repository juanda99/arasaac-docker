FROM python:3.8

WORKDIR /app

COPY ./requirements.txt /app/

RUN set -ex \
  && BUILD_DEPS=" \
  build-essential \
  libmariadb-dev \
  " \
  && apt-get update \
  && apt-get install -y --no-install-recommends   netcat-openbsd  libmariadb3  $BUILD_DEPS  \
  && pip install --upgrade pip \
  &&  pip install --no-cache-dir -r requirements.txt   \
  # && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false $BUILD_DEPS \
  && rm -rf /var/lib/apt/lists/*

COPY . /app/

ENTRYPOINT ["/app/entrypoint.sh"]