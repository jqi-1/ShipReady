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

export const astroStaticFiles: RepoFile[] = [
  {
    path: "package.json",
    content: JSON.stringify({
      name: "astro-site",
      scripts: {
        build: "astro build",
        preview: "astro preview"
      },
      dependencies: {
        astro: "latest",
        react: "latest"
      }
    })
  },
  {
    path: "package-lock.json",
    content: "{}"
  },
  {
    path: "astro.config.mjs",
    content: "export default {};"
  }
];

export const svelteKitAppFiles: RepoFile[] = [
  {
    path: "package.json",
    content: JSON.stringify({
      name: "svelte-kit-app",
      scripts: {
        build: "vite build",
        preview: "vite preview"
      },
      dependencies: {
        "@sveltejs/kit": "latest",
        svelte: "latest"
      }
    })
  },
  {
    path: "package-lock.json",
    content: "{}"
  },
  {
    path: "svelte.config.js",
    content: "export default {};"
  }
];

export const remixAppFiles: RepoFile[] = [
  {
    path: "package.json",
    content: JSON.stringify({
      name: "remix-app",
      scripts: {
        build: "remix build",
        start: "remix-serve build/index.js"
      },
      dependencies: {
        "@remix-run/react": "latest",
        "@remix-run/node": "latest",
        react: "latest"
      }
    })
  },
  {
    path: "package-lock.json",
    content: "{}"
  }
];

export const nuxtAppFiles: RepoFile[] = [
  {
    path: "package.json",
    content: JSON.stringify({
      name: "nuxt-app",
      scripts: {
        build: "nuxt build",
        start: "node .output/server/index.mjs"
      },
      dependencies: {
        nuxt: "latest",
        vue: "latest"
      }
    })
  },
  {
    path: "package-lock.json",
    content: "{}"
  },
  {
    path: "nuxt.config.ts",
    content: "export default {};"
  }
];

export const staticHtmlFiles: RepoFile[] = [
  {
    path: "index.html",
    content: "<html><body><h1>Hello</h1></body></html>"
  }
];

export const fastifyApiFiles: RepoFile[] = [
  {
    path: "package.json",
    content: JSON.stringify({
      name: "fastify-api",
      main: "server.js",
      scripts: {
        start: "node server.js"
      },
      dependencies: {
        fastify: "latest"
      }
    })
  },
  {
    path: "server.js",
    content: "const fastify = require('fastify');"
  }
];

export const nestJsApiFiles: RepoFile[] = [
  {
    path: "package.json",
    content: JSON.stringify({
      name: "nest-api",
      scripts: {
        build: "nest build",
        start: "node dist/main"
      },
      dependencies: {
        "@nestjs/core": "latest",
        "@nestjs/common": "latest"
      }
    })
  },
  {
    path: "package-lock.json",
    content: "{}"
  }
];

export const honoApiFiles: RepoFile[] = [
  {
    path: "package.json",
    content: JSON.stringify({
      name: "hono-api",
      scripts: {
        start: "node index.js"
      },
      dependencies: {
        hono: "latest"
      }
    })
  },
  {
    path: "index.js",
    content: "const hono = require('hono');"
  }
];

export const flaskApiFiles: RepoFile[] = [
  {
    path: "requirements.txt",
    content: "flask\ngunicorn\n"
  },
  {
    path: "app.py",
    content: "from flask import Flask\napp = Flask(__name__)\n"
  }
];

export const djangoApiFiles: RepoFile[] = [
  {
    path: "requirements.txt",
    content: "django\ngunicorn\n"
  },
  {
    path: "manage.py",
    content: "import django\nos.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')\nfrom django.core.management import execute_from_command_line\n"
  }
];

export const railsApiFiles: RepoFile[] = [
  {
    path: "Gemfile",
    content: "source 'https://rubygems.org'\ngem 'rails', '~> 7.0'\n"
  }
];

export const laravelApiFiles: RepoFile[] = [
  {
    path: "composer.json",
    content: JSON.stringify({
      name: "app/laravel",
      require: {
        "laravel/framework": "^10.0"
      }
    })
  }
];

export const goHttpServiceFiles: RepoFile[] = [
  {
    path: "go.mod",
    content: "module github.com/user/go-api\ngo 1.22\n"
  },
  {
    path: "main.go",
    content: "package main\n\nimport (\n\t\"fmt\"\n\t\"net/http\"\n)\n\nfunc main() {\n\thttp.ListenAndServe(\":8080\", nil)\n\tfmt.Println(\"server running\")\n}"
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
