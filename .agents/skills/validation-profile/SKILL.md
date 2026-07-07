---
name: validation-profile
description: Use when the user asks to measure YAML project validation speed or memory through the compiled standalone validation path.
---

# validation-profile

## Что делает скилл

Скилл выполняет benchmark валидации YAML-проекта через compiled standalone path:

```text
packages/core/dist/index.js
  -> packages/core/dist/projectValidationWorker.js
  -> packages/core/dist/projectValidationAjvStandalone.js
```

Он не использует MCP service и не импортирует `packages/core/index.ts`, потому что это source/tsx path.

## Жёсткие инварианты

- Перед каждым замером выполняй свежую сборку: `pnpm --filter @nakidka/core build`.
- Запускай только `node .agents/skills/validation-profile/validation-profile.mjs ...`.
- Не запускай `pnpm test`.
- Не исправляй validation diagnostics в рамках этого скилла.
- Не коммить результаты замеров.
- Если пользователь просит сравнить source/tsx и compiled standalone, скажи, что это отдельная диагностика вне этого скилла.

## Быстрый запуск

```bash
pnpm --filter @nakidka/core build
node .agents/skills/validation-profile/validation-profile.mjs /path/to/yaml
```

С одним прогоном:

```bash
pnpm --filter @nakidka/core build
node .agents/skills/validation-profile/validation-profile.mjs /path/to/yaml --runs 1
```

С worker timing:

```bash
pnpm --filter @nakidka/core build
node .agents/skills/validation-profile/validation-profile.mjs /path/to/yaml --runs 1 --timing
```

## Параметры runner'а

- `--runs N` — число прогонов, по умолчанию `5`.
- `--concurrency N` — явно задать число worker'ов. Если не задано, core использует свой default.
- `--timing` — добавить один прогон с `NKDK_VALIDATION_TIMING=1` и распарсить first/second pass worker memory.
- `--json` — вывести только JSON.

## Как отвечать пользователю

В финальном ответе покажи:

```text
Режим: compiled standalone
YAML-каталог: <path>
Воркеры: <N>
Cold: <seconds>
Warm: avg=<seconds> min=<seconds> max=<seconds>
Diagnostics: <total> = <errors> errors + <warnings> warnings
Peak RSS: <MiB>
RSS по прогонам: <run list>
```

Если был `--timing`, добавь краткую таблицу:

```text
worker | phase | files | processRssPeak | workerHeapPeak
```

## Ограничения

`--timing` использует существующий `NKDK_VALIDATION_TIMING=1`, поэтому показывает first pass и second pass целиком. Он не показывает `afterRead`, `afterReferenceValidation` или другие внутренние точки, если core не был специально инструментирован.

Если diagnostics выглядят неожиданно, явно укажи, что это результат compiled standalone, и предложи отдельную проверку parity.
