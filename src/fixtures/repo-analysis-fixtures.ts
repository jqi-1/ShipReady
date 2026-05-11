import type { RepoFile } from "@/features/repo-analysis/repo-file";

export const simpleNextAppFiles: RepoFile[] = [
  {
    path: "package.json",
    content: JSON.stringify({
      name: "simple-next-app",
      scripts: {
        build: "next build",
        start: "next start",
        dev: "next dev"
      },
      dependencies: {
        next: "15.0.0",
        react: "19.0.0",
        "react-dom": "19.0.0"
      },
      engines: {
        node: ">=20"
      }
    })
  },
  {
    path: "package-lock.json",
    content: "{}"
  },
  {
    path: "app/page.tsx",
    content: "export default function Page() { return <main>Hello</main>; }"
  },
  {
    path: ".env.example",
    content: "NEXT_PUBLIC_APP_URL=\nAUTH_SECRET=\n"
  }
];

export const viteStaticAppFiles: RepoFile[] = [
  {
    path: "package.json",
    content: JSON.stringify({
      name: "vite-static",
      scripts: {
        build: "vite build",
        preview: "vite preview"
      },
      dependencies: {
        "@vitejs/plugin-react": "latest",
        vite: "latest",
        react: "latest"
      }
    })
  },
  {
    path: "pnpm-lock.yaml",
    content: "lockfileVersion: '9.0'"
  },
  {
    path: "vite.config.ts",
    content: "export default {};"
  }
];

export const expressApiFiles: RepoFile[] = [
  {
    path: "package.json",
    content: JSON.stringify({
      name: "express-api",
      main: "server.js",
      scripts: {
        start: "node server.js"
      },
      dependencies: {
        express: "latest"
      }
    })
  },
  {
    path: "server.js",
    content: "const express = require('express'); process.env.DATABASE_URL;"
  }
];

export const pythonApiFiles: RepoFile[] = [
  {
    path: "requirements.txt",
    content: "fastapi\nuvicorn\nsqlalchemy\n"
  },
  {
    path: "runtime.txt",
    content: "python-3.12"
  },
  {
    path: "main.py",
    content: "import os\nfrom fastapi import FastAPI\nos.environ['DATABASE_URL']\n"
  }
];

export const monorepoAppFiles: RepoFile[] = [
  {
    path: "package.json",
    content: JSON.stringify({
      private: true,
      workspaces: ["apps/*"],
      devDependencies: {
        turbo: "latest"
      }
    })
  },
  {
    path: "pnpm-workspace.yaml",
    content: "packages:\n  - apps/*\n"
  },
  {
    path: "apps/web/package.json",
    content: JSON.stringify({
      name: "web",
      scripts: {
        build: "next build",
        start: "next start"
      },
      dependencies: {
        next: "latest",
        react: "latest",
        "react-dom": "latest"
      }
    })
  },
  {
    path: "apps/api/package.json",
    content: JSON.stringify({
      name: "api",
      scripts: {
        start: "node index.js"
      },
      dependencies: {
        express: "latest"
      }
    })
  }
];

export const dockerNodeAppFiles: RepoFile[] = [
  {
    path: "Dockerfile",
    content: [
      "FROM node:20-alpine AS deps",
      "WORKDIR /app",
      "COPY package.json package-lock.json ./",
      "RUN npm ci",
      "FROM node:20-alpine AS runner",
      "WORKDIR /app",
      "COPY --from=deps /app/node_modules ./node_modules",
      "COPY . .",
      "ENV NODE_ENV=production",
      "USER node",
      "EXPOSE 3000",
      "HEALTHCHECK CMD wget -qO- http://localhost:3000/health || exit 1",
      'CMD ["npm", "start"]'
    ].join("\n")
  },
  {
    path: ".dockerignore",
    content: "node_modules\n.git\n.env\n"
  }
];

export const dockerPythonApiFiles: RepoFile[] = [
  {
    path: "Dockerfile",
    content: [
      "FROM python:3.12-slim",
      "WORKDIR /app",
      "COPY requirements.txt .",
      "RUN pip install -r requirements.txt",
      "COPY . .",
      "EXPOSE 8000",
      'CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]'
    ].join("\n")
  }
];

export const composeWithPostgresFiles: RepoFile[] = [
  {
    path: "docker-compose.yml",
    content: [
      "services:",
      "  web:",
      "    build:",
      "      context: .",
      "      dockerfile: Dockerfile",
      "    ports:",
      '      - "3000:3000"',
      "    depends_on:",
      "      - db",
      "  db:",
      "    image: postgres:16",
      "    volumes:",
      "      - pgdata:/var/lib/postgresql/data",
      "volumes:",
      "  pgdata:"
    ].join("\n")
  }
];

export const composeWithRedisFiles: RepoFile[] = [
  {
    path: "compose.yaml",
    content: [
      "services:",
      "  worker:",
      "    build: .",
      "    depends_on:",
      "      - redis",
      "  redis:",
      "    image: redis:7-alpine"
    ].join("\n")
  }
];
