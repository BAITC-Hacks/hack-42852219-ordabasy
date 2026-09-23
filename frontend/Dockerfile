FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so they
# must be the URL the user's browser can reach, not a Docker-internal name.
ARG NEXT_PUBLIC_API_MODE=live
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_MODE=${NEXT_PUBLIC_API_MODE} \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build

FROM node:22-slim AS runtime
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app
RUN useradd --system --uid 10001 --no-create-home app
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts
USER app
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
    CMD ["node", "-e", "require('http').get('http://127.0.0.1:3000/', r => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"]
CMD ["npm", "start"]
