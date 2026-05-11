export function installCommandFor(packageManager?: string) {
  if (packageManager === "pnpm") return "pnpm install";
  if (packageManager === "yarn") return "yarn install --frozen-lockfile";
  if (packageManager === "bun") return "bun install";
  if (packageManager === "pip") return "pip install -r requirements.txt";
  if (packageManager === "poetry") return "poetry install";
  if (packageManager === "uv") return "uv sync";
  if (packageManager === "go") return "go mod download";
  if (packageManager === "bundler") return "bundle install";
  if (packageManager === "composer") return "composer install --no-dev";
  return "npm ci";
}

export function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
