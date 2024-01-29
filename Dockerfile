FROM denoland/deno:alpine

WORKDIR /app

# Adding ffmpeg binary for conversion from bot
RUN apk add ffmpeg

ADD . .

CMD ["deno", "task", "start"]
