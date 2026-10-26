#!/bin/sh
# stdio por padrão; "http" sobe o servidor HTTP; "cli ..." roda o CLI de pipeline.
case "$1" in
  http) exec node /app/dist/http.js ;;
  cli) shift; exec node /app/dist/cli.js "$@" ;;
  *) exec node /app/dist/stdio.js "$@" ;;
esac
