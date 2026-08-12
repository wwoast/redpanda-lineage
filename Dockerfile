FROM denoland/deno:2.9.5 AS build

WORKDIR /build

RUN apt-get update && \
    apt-get install git -y

RUN deno task build

FROM nginx:alpine-slim
COPY --from=build /build/export /usr/share/nginx/html/export
COPY --from=build /build/css /usr/share/nginx/html/css
COPY --from=build /build/js /usr/share/nginx/html/js
COPY --from=build /build/media /usr/share/nginx/html/media
COPY --from=build /build/images /usr/share/nginx/html/images
COPY --from=build /build/fragments /usr/share/nginx/html/fragments
COPY --from=build /build/index.html /usr/share/nginx/html
COPY --from=build /build/privacy.html /usr/share/nginx/html