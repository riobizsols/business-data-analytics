# Generic production image for the Next.js frontend (@bdata/ui).
# Used when frontend/ has no Dockerfile of its own; see deploy/VPS.md.
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN if [ -f package-lock.json ]; then npm ci; \
    elif [ -f yarn.lock ]; then corepack enable && yarn install --frozen-lockfile; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install --frozen-lockfile; \
    else npm install; fi

FROM node:20-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* values are baked into the browser bundle at build time.
ARG NEXT_PUBLIC_API_BASE=""
ARG NEXT_PUBLIC_API_BASE_URL=""
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE \
    NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN rm -rf .env.local deploy-package .next && npm run build
# With output: "standalone", ship only the self-contained server; otherwise ship the app for `next start`.
RUN mkdir -p /out && if [ -f .next/standalone/server.js ]; then \
      cp -r .next/standalone/. /out/ && \
      mkdir -p /out/.next && cp -r .next/static /out/.next/static && \
      if [ -d public ]; then cp -r public /out/public; fi; \
    else \
      npm prune --omit=dev && cp -r . /out/; \
    fi

FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 3000
CMD ["sh", "-c", "if [ -f server.js ]; then exec node server.js; else exec npx next start -p 3000 -H 0.0.0.0; fi"]
