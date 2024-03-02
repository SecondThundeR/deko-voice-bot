FROM denoland/deno:debian

WORKDIR /app

# Adding ffmpeg binary for conversion from bot
RUN apt update
RUN apt upgrade
RUN apt install ffmpeg

ADD . .

CMD ["deno", "task", "start"]
