FROM denoland/deno: 1.37.2

WORKDIR /app

USER deno

ADD . .

CMD deno task start
