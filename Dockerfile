FROM denoland/deno:alpine

WORKDIR /app

# Adding ffmpeg binary for conversion from bot
RUN apk add ffmpeg
RUN apk add libgcc
RUN apk add libhwy

ADD . .

CMD ["deno", "task", "start"]
