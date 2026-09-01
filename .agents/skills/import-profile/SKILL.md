---
name: import-profile
description: Use when the user asks to measure XML import speed by NKDK architecture stages.
---

# import-profile

## Что делает скилл

Скилл сначала собирает текущую версию MCP и выполняет benchmark XML-import через собранный MCP stdio server:

```text
packages/mcp/dist/bin/nkdk-mcp
  -> nkdk.import_from_xml
```

Сборка выполняется до начала измерения и не входит в результат. Core должен выводить профиль при `NKDK_PROFILE=1`.
Один MCP-процесс и его универсальный пул worker используются для всех прогонов: первый прогон холодный,
последующие переиспользуют worker и кэш готовых JSON Schema. Целевой YAML-каталог очищается перед каждым прогоном.
Для каждого прогона создаётся отдельный временный проект: повторный импорт того же компонента в уже опубликованное
состояние проекта по договору запрещён.
Runner ждёт terminal result фоновой операции; ответ `accepted` не завершает измерение.

## Быстрый запуск

```bash
node .agents/skills/import-profile/import-profile.mjs /path/to/xml /path/to/yaml --runs 1
```

## Параметры runner'а

- `--runs N` — число прогонов, по умолчанию `1`.
- `--concurrency N` — явное число worker; без параметра размер пула выбирает production import.
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
Новый двухпроходный импорт дополнительно публикует `xmlParseMs`, `factsOnlyMs`,
`messagePackMs`, `messageUnpackMs`, `packedBytes`, `toXmlObjectMs`,
`toXmlFinalizeMs`, `directHashMs`, `mismatchDocumentMs` и `anomalyProofMs`.
`controlExport.detailedRereads` должен оставаться равным нулю.
Подробные checkpoints памяти для каждого задания включаются отдельно через
`NKDK_PROFILE_MEMORY=1`; обычный профиль оставляет их выключенными, чтобы не
искажать время и не создавать многомегабайтный stderr.
Подробные записи отдельных типов и объектов в JSON не включаются; `profileRows`
содержит только агрегированные строки. При большом результате поле `report`
фиксирует существование, размер и число строк полного отчёта.
