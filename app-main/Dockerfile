FROM node:22.23.4-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_GA_ID
ENV NEXT_TELEMETRY_DISABLED=1
RUN OPENAI_API_KEY=build-only-placeholder npm run build && npm prune --omit=dev

FROM node:22.23.4-bookworm-slim
ENV NODE_ENV=production PORT=3000 NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --chown=node:node public ./public
COPY --chown=node:node next.config.js ./next.config.js
USER node
EXPOSE 3000
CMD ["npm", "start"]
