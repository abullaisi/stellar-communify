FROM oven/bun:1 AS base
WORKDIR /app

# packages/shared ships raw TypeScript (no build step) and packages/api's own
# build (tsup) externalizes workspace deps, so `node dist/index.js` can't
# resolve @komunify/shared in production. Bun runs .ts directly, so we install
# once and run from source with Bun instead of building to dist/.

COPY package.json bun.lock ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/contract-client/package.json ./packages/contract-client/
COPY packages/web/package.json ./packages/web/
RUN bun install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY packages/contract-client ./packages/contract-client
COPY packages/api ./packages/api

RUN cd packages/api && bunx prisma generate

ENV NODE_ENV=production
WORKDIR /app/packages/api

EXPOSE 3001

CMD ["bun", "run", "src/index.ts"]
