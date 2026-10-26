# Moretes Architect MCP: imagem para rodar local, sem cota.
#   stdio (clientes MCP):  docker run -i --rm ghcr.io/fernando-moretes/moretes-aws-architect-mcp
#   CLI:                   docker run --rm -v "$PWD:/work" -w /work ghcr.io/fernando-moretes/moretes-aws-architect-mcp cli check terraform_plan_review plan.json
#   HTTP:                  docker run --rm -p 8787:8787 ghcr.io/fernando-moretes/moretes-aws-architect-mcp http
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY src ./src
RUN npx tsc

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY docker-entrypoint.sh /usr/local/bin/moretes
RUN chmod +x /usr/local/bin/moretes
USER node
ENV HOST=0.0.0.0 PORT=8787 ALLOWED_HOSTS=localhost:8787,127.0.0.1:8787
EXPOSE 8787
ENTRYPOINT ["moretes"]
LABEL org.opencontainers.image.source="https://github.com/fernando-moretes/moretes-aws-architect-mcp" \
      org.opencontainers.image.description="Evidence-first architecture workbench MCP: 48 deterministic tools, 10 architect personas" \
      org.opencontainers.image.licenses="MIT" \
      io.modelcontextprotocol.server.name="io.github.fernando-moretes/moretes-aws-architect-mcp"
