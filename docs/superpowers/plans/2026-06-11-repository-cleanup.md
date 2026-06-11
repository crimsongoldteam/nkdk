# Repository Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** удалить устаревший `packages/extension` и лишние корневые Node.js-зависимости без изменения поведения `@nakidka/core`, `@nakidka/cli` и `@nakidka/graph`.

**Architecture:** Чистка выполняется как изменение границ workspace: пакет `packages/extension` удаляется целиком, а корневой `package.json` возвращается к роли общего управляющего файла для монорепозитория. Lockfile пересчитывается штатным `pnpm install --lockfile-only`, затем весь workspace проверяется через `pnpm test`.

**Tech Stack:** pnpm workspace, TypeScript 5.9, Vitest 4, `@nakidka/core`, `@nakidka/cli`, `@nakidka/graph`.

---

## File Structure

- Delete: `packages/extension/**` — устаревший VS Code extension-пакет, включая локальный `packages/extension/node_modules`.
- Modify: `package.json` — удалить описание старого веб/extension-приложения и лишние корневые зависимости.
- Modify: `pnpm-lock.yaml` — удалить importer `packages/extension` и пакеты, оставшиеся только из-за extension/веб-зависимостей.
- Keep unchanged: `pnpm-workspace.yaml` — шаблон `packages/*` продолжит включать только оставшиеся пакеты.
- Keep unchanged: `packages/core/**`, `packages/cli/**`, `packages/graph/**` — поведение текущих пакетов не меняется.

### Task 1: Зафиксировать исходное использование extension и корневых зависимостей

**Files:**
- Inspect: `package.json`
- Inspect: `packages/extension/package.json`
- Inspect: `packages/core/package.json`
- Inspect: `packages/cli/package.json`
- Inspect: `packages/graph/package.json`

- [ ] **Step 1: Проверить рабочее дерево**

Run: `git status --short`

Expected: либо пустой вывод, либо только уже известные изменения плана. Если есть чужие изменения, не менять их и учитывать при дальнейших командах.

- [ ] **Step 2: Найти все упоминания extension и веб-зависимостей**

Run: `rg -n "@types/vscode|@vscode/vsce|vscode-languageclient|yaml-language-server|request-light|fs-extra|shx|ts-loader|@testing-library|react|react-dom|antd|monaco|vite|@vitejs|vite-plugin-dts|vite-tsconfig-paths|jsdom|pointer-events-polyfill|resize-observer-polyfill|whatwg-fetch|split.js|performance-polyfill|@babel/standalone|baseline-browser-mapping|terser|rollup|organize-imports-cli" package.json pnpm-workspace.yaml packages README.md .agents docs`

Expected: прямые использования вне `packages/extension` и корневого `package.json` отсутствуют. Допустимы исторические упоминания в `docs/superpowers/**` и `.agents/**`, они не требуют сохранения зависимостей.

- [ ] **Step 3: Проверить root-only инструменты**

Run: `rg -n "organize-imports|testing-library|vite|monaco|antd|react|vscode|vsce|ts-loader|rollup|terser" package.json packages README.md .agents docs`

Expected: `organize-imports-cli` не используется в скриптах и коде; найденные веб/extension-упоминания относятся к удаляемому пакету, корневому `package.json` или исторической документации.

### Task 2: Удалить `packages/extension`

**Files:**
- Delete: `packages/extension/**`

- [ ] **Step 1: Удалить пакет extension**

Run: `rm -rf packages/extension`

Expected: каталог `packages/extension` отсутствует.

- [ ] **Step 2: Проверить, что workspace больше не видит package.json extension**

Run: `rg --files -g 'package.json' packages`

Expected: вывод содержит только:

```text
packages/cli/package.json
packages/core/package.json
packages/graph/package.json
```

- [ ] **Step 3: Проверить git-изменения удаления**

Run: `git status --short packages/extension`

Expected: список удалённых файлов из `packages/extension`; локальный `packages/extension/node_modules` может не отображаться, если не отслеживался git.

### Task 3: Очистить корневой `package.json`

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Заменить описание проекта**

Change in `package.json`:

```json
{
  "name": "nakidka-web",
  "version": "1.0.0",
  "description": "Монорепозиторий Nakidka для работы с конфигурациями 1С"
}
```

Expected: поле `description` больше не называет проект веб-приложением для расширения VS Code. Поле `name` не менять без отдельного решения, чтобы не создавать лишнее переименование.

- [ ] **Step 2: Удалить устаревшие корневые devDependencies**

Remove these keys from root `devDependencies`:

```json
{
  "@testing-library/dom": "^10.4.1",
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/react": "^16.3.2",
  "@types/react": "^19.2.14",
  "@types/react-dom": "^19.2.3",
  "@types/vscode": "^1.109.0",
  "@vitejs/plugin-react": "^5.1.4",
  "@vitest/coverage-v8": "^4.0.18",
  "baseline-browser-mapping": "^2.10.0",
  "concurrently": "^9.2.1",
  "jsdom": "^27.4.0",
  "organize-imports-cli": "^0.10.0",
  "pointer-events-polyfill": "0.4.4-pre",
  "resize-observer-polyfill": "^1.5.1",
  "terser": "^5.46.0",
  "ts-loader": "^9.5.4",
  "vite": "^7.3.1",
  "vite-plugin-dts": "^4.5.4",
  "vite-tsconfig-paths": "^5.1.4"
}
```

Expected: root `devDependencies` keeps only tools used by root scripts or package builds:

```json
{
  "@types/node": "^24.12.0",
  "patch-package": "^8.0.1",
  "postinstall-postinstall": "^2.1.0",
  "prettier": "^3.8.1",
  "ts-patch": "^3.3.0",
  "tsc-alias": "^1.8.16",
  "typescript": "~5.9.3",
  "vitest": "^4.0.18"
}
```

- [ ] **Step 3: Удалить устаревшие корневые dependencies**

Remove these keys from root `dependencies`:

```json
{
  "@ant-design/icons": "~6.1.0",
  "@babel/standalone": "^7.29.1",
  "@monaco-editor/react": "^4.7.0",
  "antd": "^6.3.1",
  "monaco-editor-core": "0.55.1",
  "performance-polyfill": "^0.0.3",
  "react": "^19.2.4",
  "react-dom": "^19.2.4",
  "rollup": "^4.59.0",
  "split.js": "^1.6.5",
  "whatwg-fetch": "^3.6.20"
}
```

Expected: root `dependencies` keeps only libraries used by current non-extension packages or root build assumptions:

```json
{
  "change-case": "^5.4.4",
  "chevrotain": "^11.2.0",
  "date-fns": "^4.1.0",
  "fast-xml-parser": "^5.4.2",
  "uuid": "^13.0.0",
  "yaml": "^2.8.3"
}
```

- [ ] **Step 4: Проверить JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8')); console.log('package.json ok')"`

Expected:

```text
package.json ok
```

### Task 4: Обновить lockfile и проверить workspace

**Files:**
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Пересчитать lockfile**

Run: `pnpm install --lockfile-only`

Expected: команда завершается успешно и обновляет `pnpm-lock.yaml`. Если команда падает из-за сетевого доступа, повторить её с разрешением на сеть.

- [ ] **Step 2: Проверить, что importer extension исчез**

Run: `rg -n "packages/extension|vscode-languageclient|yaml-language-server|@vscode/vsce|request-light|@types/vscode|@testing-library|@monaco-editor/react|antd|organize-imports-cli" pnpm-lock.yaml package.json`

Expected: нет совпадений в `pnpm-lock.yaml` и `package.json`. Если остаются совпадения только в исторической документации, это не блокирует задачу.

- [ ] **Step 3: Проверить список пакетов workspace**

Run: `pnpm -r list --depth -1`

Expected: вывод содержит `@nakidka/cli`, `@nakidka/core`, `@nakidka/graph` и не содержит `nkdk` из бывшего `packages/extension`.

### Task 5: Финальная проверка и коммит

**Files:**
- Verify: `package.json`
- Verify: `pnpm-lock.yaml`
- Verify: `packages/**`

- [ ] **Step 1: Запустить полный набор тестов**

Run: `pnpm test`

Expected: все тесты `@nakidka/core`, `@nakidka/cli` и `@nakidka/graph` проходят.

- [ ] **Step 2: Проверить итоговый diff**

Run: `git diff --stat`

Expected: diff состоит из удаления `packages/extension/**`, изменения `package.json` и изменения `pnpm-lock.yaml`.

- [ ] **Step 3: Проверить отсутствие незапланированных metadata-изменений**

Run: `git status --short packages/core/metadata`

Expected: пустой вывод.

- [ ] **Step 4: Закоммитить чистку**

```bash
git add package.json pnpm-lock.yaml packages/extension
git commit -m "chore: :wrench: удалить устаревший extension"
```

Expected: создан один коммит с удалением extension и чисткой зависимостей.

---

## Self-Review

- Spec coverage: план покрывает удаление `packages/extension`, чистку корневых зависимостей, удаление `organize-imports-cli`, обновление lockfile, отсутствие изменений в `packages/core/metadata/**` и полный `pnpm test`.
- Placeholder scan: заглушек и расплывчатых шагов нет; команды и ожидаемые результаты указаны явно.
- Type consistency: кодовых типов и новых API нет; все пути совпадают с текущей структурой workspace.
