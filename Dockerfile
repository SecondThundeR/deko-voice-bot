FROM denoland/deno:alpine

WORKDIR /app

# Adding ffmpeg binary for conversion from bot
RUN apk install ffmpeg

ADD . .

CMD ["deno", "task", "start"]
