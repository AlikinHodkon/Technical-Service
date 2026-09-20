FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts && pnpm rebuild esbuild

COPY . .

EXPOSE 3000

CMD ["pnpm", "exec", "tsx", "src/server.ts"]
