# validation-profile skill design

## Цель

Добавить repo-skill `.agents/skills/validation-profile`, который по заданному YAML-каталогу выполняет compiled standalone validation benchmark и возвращает профиль скорости и памяти.

Скилл нужен для повторяемых замеров валидации без ручного написания временных скриптов. Он измеряет только compiled path: свежая сборка `@nakidka/core`, импорт `packages/core/dist/index.js`, worker `packages/core/dist/projectValidationWorker.js`, standalone schema module `packages/core/dist/projectValidationAjvStandalone.js`.

## Не цели

- Не сравнивать source/tsx и compiled/standalone.
- Не запускать MCP service `packages/mcp/src/services/validateProject.ts`, потому что текущий MCP `loadCoreApi()` импортирует `packages/core/index.ts` и тем самым использует source/tsx path.
- Не исправлять validation diagnostics, parity bugs или memory leaks.
- Не коммитить результаты замеров и не запускать полный `pnpm test`.

## Состав скилла

Каталог:

```text
.agents/skills/validation-profile/
├── SKILL.md
└── validation-profile.mjs
```

`SKILL.md` содержит:

- когда использовать скилл;
- обязательный compiled-only инвариант;
- команды запуска;
- как читать итоговый JSON и текстовый отчёт;
- что делать при расхождении diagnostics или падении сборки.

`validation-profile.mjs` содержит deterministic runner:

- парсит аргументы;
- импортирует `packages/core/dist/index.js`;
- запускает `createValidationWorkerPoolHandle({ concurrency })`;
- выполняет N прогонов;
- собирает скорость, diagnostics, RSS/heap, worker pool size;
- опционально запускает один `NKDK_VALIDATION_TIMING=1` прогон и извлекает worker timing/memory lines из stderr.

## CLI договора

Основной запуск:

```bash
node .agents/skills/validation-profile/validation-profile.mjs /path/to/yaml
```

Параметры:

- `--runs N`, по умолчанию `5`.
- `--concurrency N`, по умолчанию не передаётся, чтобы core применил свой default.
- `--timing`, дополнительно запускает один timing-прогон с `NKDK_VALIDATION_TIMING=1`.
- `--json`, печатает только JSON без человекочитаемой таблицы.

Скрипт не делает build сам. Скилл перед запуском всегда выполняет:

```bash
pnpm --filter @nakidka/core build
```

Так build остаётся явным шагом workflow, а скрипт остаётся маленьким и проверяемым.

## Workflow скилла

1. Проверить, что команда запущена из корня репозитория.
2. Проверить, что YAML-каталог задан и существует.
3. Выполнить свежую сборку `pnpm --filter @nakidka/core build`.
4. Запустить `node .agents/skills/validation-profile/validation-profile.mjs <yaml-dir>`.
5. Если нужен подробный worker memory profile, повторить с `--timing`.
6. В финальном ответе показать:
   - режим `compiled standalone`;
   - путь YAML-каталога;
   - число worker'ов;
   - cold time;
   - warm avg/min/max;
   - diagnostics/errors/warnings;
   - RSS/heap после каждого прогона;
   - peak RSS внутри процесса;
   - при `--timing`: first pass и second pass memory per worker.

## Формат результата

JSON верхнего уровня:

```json
{
  "mode": "compiled-standalone",
  "projectDir": "/path/to/yaml",
  "runs": [
    {
      "run": 1,
      "elapsedMs": 17699,
      "diagnostics": 43394,
      "errors": 6072,
      "warnings": 37322,
      "workerPoolSize": 4,
      "rssMiB": 6358,
      "heapUsedMiB": 552
    }
  ],
  "coldMs": 17699,
  "warmAvgMs": 18564,
  "warmMinMs": 16256,
  "warmMaxMs": 20581,
  "peakRssMiB": 7849,
  "timing": {
    "firstPass": [],
    "secondPass": []
  }
}
```

`timing.firstPass` и `timing.secondPass` заполняются только в `--timing` режиме. Базовая реализация использует уже существующий `NKDK_VALIDATION_TIMING=1`, поэтому фазовая детализация ограничена текущими полями core: first pass целиком и second pass целиком. Детализация `afterRead`, `afterReferenceValidation`, `afterValidation` не входит в скилл, потому что требует изменения core-инструментации.

## Ошибки и ограничения

- Если `packages/core/dist/projectValidationAjvStandalone.js` отсутствует после build, скилл сообщает ошибку сборки/генерации standalone.
- Если validation падает, скилл показывает stderr/stdout и не делает вывод о производительности.
- Если diagnostics выглядят подозрительно, скилл явно пишет, что это результат compiled standalone. Проверка parity с source/tsx является отдельной задачей и не входит в этот скилл.
- `/usr/bin/time -l` не является обязательным: в sandbox он может требовать повышенных прав. Основной источник memory profile — `process.memoryUsage()` внутри runner и worker timing logs.

## Проверка

Минимальная проверка реализации:

```bash
pnpm --filter @nakidka/core build
node .agents/skills/validation-profile/validation-profile.mjs /Users/nikita/git/nkdk-yaml --runs 1
node .agents/skills/validation-profile/validation-profile.mjs /Users/nikita/git/nkdk-yaml --runs 1 --timing
```

После создания скилла полный `pnpm test` не обязателен, потому что скилл диагностический и не меняет runtime-код. Если будут изменены core-файлы для поддержки дополнительного timing, тогда `pnpm test` обязателен.
