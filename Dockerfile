FROM denoland/deno:debian

# Adding ffmpeg binary for conversion from bot
RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get install -y ffmpeg

WORKDIR /app

ADD . .

CMD ["deno", "task", "start"]
