# Project Scan Guide

Tech-stack-specific patterns for codebase analysis during harness init.

## Node.js / TypeScript

```bash
cat package.json | python -m json.tool 2>/dev/null | grep -E '"name"|"scripts"|"dependencies"' | head -20
ls src/ app/ lib/ 2>/dev/null
find . -name "*.ts" -not -path "*/node_modules/*" | head -20
```

Key files to read: `package.json`, `tsconfig.json`, `.eslintrc*`, `src/index.ts`

Framework detection:
- Express/Fastify: check `package.json` dependencies
- React/Next.js: check for `pages/`, `app/`, `src/App.tsx`
- NestJS: look for `@Module`, `@Controller` decorators

## Go

```bash
cat go.mod | head -20
find . -name "*.go" -not -path "*/vendor/*" | head -30
ls cmd/ internal/ pkg/ api/ 2>/dev/null
```

Key files to read: `go.mod`, `Makefile`, main entry in `cmd/`

Patterns to note: module name, Go version, key packages in `internal/`

## Python

```bash
cat pyproject.toml 2>/dev/null || cat requirements.txt 2>/dev/null | head -20
find . -name "*.py" -not -path "*/.venv/*" | head -20
ls src/ app/ api/ tests/ 2>/dev/null
```

Framework detection:
- FastAPI: look for `from fastapi import`
- Django: look for `django` in deps, `manage.py`
- Flask: look for `from flask import`

## Java / Kotlin

```bash
cat pom.xml 2>/dev/null | grep -E '<groupId>|<artifactId>|<version>' | head -20
ls src/main/java src/main/kotlin 2>/dev/null
find . -name "Application.java" -o -name "Application.kt" 2>/dev/null
```

## Monorepo

Look for: `packages/`, `apps/`, `services/`, `lerna.json`, `pnpm-workspace.yaml`, `nx.json`

```bash
ls packages/ apps/ services/ 2>/dev/null
cat pnpm-workspace.yaml 2>/dev/null || cat lerna.json 2>/dev/null
```

List each sub-package and its purpose.

## What to Extract

For any tech stack, extract and record:

| Item | How to find |
|------|-------------|
| Project name | README.md title, package name |
| Primary language | File extensions, manifest |
| Framework | Dependencies, directory structure |
| Entry points | main.*, index.*, cmd/ |
| Test framework | Dev dependencies, test/ dir |
| Build tool | Makefile, scripts in package.json |
| Database | Dependencies (prisma, sqlx, sqlalchemy) |
| External APIs | Env vars in .env.example, README |
| CI/CD | .github/workflows/, .gitlab-ci.yml |
| Containerization | Dockerfile, docker-compose.yml |
| Key modules | Top-level directories with most files |
| Code style config | .eslintrc, .prettierrc, golangci.yml |
| Logging library | Dependencies (winston, zap, structlog) |
