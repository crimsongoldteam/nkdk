# NKDK prerelease repository design

## Цель

Подготовить отдельный приватный репозиторий `crimsongoldteam/nkdk-prerelease` для ранней поставки NKDK конечным пользователям и AI-агентам без внутренних материалов разработки.

## Формат поставки

Первый prerelease поставляется отдельным GitHub-репозиторием. Он содержит исходники runtime-части CLI и core, поставочные skills и минимальные файлы установки. Пакет npm пока не публикуется, но структура должна оставаться совместимой с будущим переходом к `@nakidka/core` и `@nakidka/cli`.

## Входит в поставку

- `README.md`
- `LICENSE`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `tsconfig.json`
- `packages/core` runtime-исходники
- `packages/cli` runtime-исходники
- `skills/**`
- `install.sh`, `doctor.sh` и runtime `tsconfig`, когда они будут добавлены

## Не входит в поставку

- `.agents/**`
- `.codex/**`
- `.vscode/**`
- `docs/**`
- `node_modules/**`
- `vitest.config.ts`
- `*.test.ts`
- `__fixtures__/**`
- `tests/**`
- внутренние `scripts/**`
- временные каталоги вроде `tempTest/**`
- рабочие пакеты, не нужные для CLI runtime, например `packages/extension`, `packages/graph`, `enterprise`

## Первичная сборка

До появления постоянного `build-release` скрипта первый prerelease собирается во временный каталог allowlist-подходом. После сборки обязательно проверяется, что запрещённые пути отсутствуют.

## Ограничения

Первый prerelease не обязан быть минимальным npm-пакетом. Главная цель этапа — чистый GitHub-репозиторий без dev-материалов, пригодный для установки и дальнейшей стабилизации install/doctor сценария.
