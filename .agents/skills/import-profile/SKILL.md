---
name: import-profile
description: Use when the user asks to measure XML import speed by NKDK architecture stages.
---

# import-profile

## Что делает скилл

Скилл собирает MCP и выполняет benchmark XML-import через собранный MCP stdio server:

```text
packages/mcp/dist/bin/nkdk-mcp
  -> nkdk.import_from_xml
```

Сборка выполняется до начала измерения и не входит в результат. Core должен выводить профиль при `NKDK_PROFILE=1`.
Один MCP-процесс и его универсальный пул worker используются для всех прогонов: первый прогон холодный,
последующие переиспользуют worker и кэш готовых JSON Schema. Целевой YAML-каталог очищается перед каждым прогоном.

## Быстрый запуск

```bash
node .agents/skills/import-profile/import-profile.mjs /path/to/xml /path/to/yaml --runs 1
```

## Параметры runner'а

- `--runs N` — число прогонов, по умолчанию `1`.
- `--concurrency N` — число worker, по умолчанию `4`.
- `--json` — вывести только JSON.

## Как отвечать пользователю

В финальном ответе покажи:

```text
Режим: compiled MCP stdio
XML-каталог: <path>
YAML-каталог: <path>
Воркеры: <N>
Cold: <seconds>
Warm: avg=<seconds> min=<seconds> max=<seconds>
Warnings/Errors: <warnings>/<errors>
Peak RSS: <MiB>
```

Если профиль содержит шаги, добавь краткую таблицу распределения.

Машинный результат каждого запуска содержит `firstPassMs`, `workingIndexMs`,
`secondPassMs`, `externalFilesMs`, `finalBuildMs`, `dependencyValidationMs`,
`publicationMs`, `saveMs`, времена двоичного кодирования и приёма, подготовки
начала diagnostics и JSONL-отчёта, размеры двоичных данных, отчёта и
`structuredContent`, полное время до ответа `responseMs` и верхнюю оценку неразмеченного внешнего времени
`mcpOverheadMs` в поле `phases`. Оценка может включать неразмеченные промежутки координатора; вложенные worker-этапы
в неё повторно не складываются.
Подробные записи отдельных типов и объектов в JSON не включаются; `profileRows`
содержит только агрегированные строки. При большом результате поле `report`
фиксирует существование, размер и число строк полного отчёта.
