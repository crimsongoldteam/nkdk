---
name: import-profile
description: Use when the user asks to measure XML import speed by NKDK architecture stages.
---

# import-profile

## Что делает скилл

Скилл выполняет benchmark XML-import через настоящий MCP stdio server:

```text
node .agents/tools/mcp/call.mjs nkdk.import_from_xml --input <args.json>
```

Core должен выводить профиль при `NKDK_PROFILE=1`.

## Быстрый запуск

```bash
node .agents/skills/import-profile/import-profile.mjs /path/to/xml /path/to/yaml --runs 1
```

## Параметры runner'а

- `--runs N` — число прогонов, по умолчанию `1`.
- `--json` — вывести только JSON.

## Как отвечать пользователю

В финальном ответе покажи:

```text
Режим: mcp stdio source tsx
XML-каталог: <path>
YAML-каталог: <path>
Воркеры: <N>
Cold: <seconds>
Warm: avg=<seconds> min=<seconds> max=<seconds>
Warnings/Errors: <warnings>/<errors>
Peak RSS: <MiB>
```

Если профиль содержит шаги, добавь краткую таблицу распределения.
