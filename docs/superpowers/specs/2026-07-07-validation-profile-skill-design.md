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

## Целевой вывод `--timing`

При запуске с `--timing` скилл должен печатать одну иерархическую таблицу этапов validation. Подшаги выводятся в той же таблице строками с префиксом `-`, без отдельной вложенной таблицы.

Основная таблица `Шаги validation` измеряет warm validation на уже созданном worker pool. В MCP worker pool должен жить заранее, поэтому время создания worker pool и первичной инициализации worker не входит в `Итого validation`.

Если скилл в разовом CLI-запуске сам создает worker pool или впервые инициализирует validation worker, эти затраты выводятся отдельным блоком `Инициализация` перед основной таблицей.

Таблица должна отвечать на два вопроса:

- сколько времени пользователь ждет весь этап;
- сколько времени и памяти потрачено в главном процессе и внутри worker.

Колонки таблицы:

| Колонка | Значение |
|---|---|
| `Шаг` | Этап validation или подшаг этапа. Подшаги пишутся с `-`, например `- Поиск файлов проекта`. |
| `Общее время` | Wall-clock время этапа на уровне всего validation-запуска. Для worker-only подшагов это приближенно `Worker max`, потому что worker выполняются параллельно. |
| `Главный поток` | Время работы координатора/main thread на этом этапе или подшаге. |
| `Worker min` | Минимальное время среди worker для этого этапа или подшага. |
| `Worker avg` | Среднее время среди worker для этого этапа или подшага. |
| `Worker max` | Максимальное время среди worker; это нижняя граница времени ожидания параллельного worker-этапа. |
| `Worker sum` | Сумма времени всех worker; это расход процессорного времени, а не ожидание пользователя. |
| `RSS процесса max` | Максимальный RSS всего validation-процесса в момент замера этапа. |
| `RSS worker min` | Минимальный peak RSS среди worker на этом этапе или подшаге. |
| `RSS worker avg` | Средний peak RSS среди worker на этом этапе или подшаге. |
| `RSS worker max` | Максимальный peak RSS среди worker на этом этапе или подшаге. |

Целевой вид таблицы:

```text
Инициализация:

| Шаг | Время | RSS процесса max |
|---|---:|---:|
| Создание worker pool | 0.20s | 5304 MiB |
| Инициализация validation worker | 0.00s | 5304 MiB |

Шаги validation:

| Шаг | Общее время | Главный поток | Worker min | Worker avg | Worker max | Worker sum | RSS процесса max | RSS worker min | RSS worker avg | RSS worker max |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Подготовка YAML-проекта | 10.49s | 6.43s | 4.03s | 4.04s | 4.06s | 16.18s | 5304 MiB | 1556 MiB | 1562 MiB | 1582 MiB |
| - Поиск файлов проекта | 1.20s | 1.20s | - | - | - | - | 900 MiB | - | - | - |
| - Классификация файлов проекта | 0.35s | 0.35s | - | - | - | - | 980 MiB | - | - | - |
| - Разбиение по worker | 0.03s | 0.03s | - | - | - | - | 980 MiB | - | - | - |
| - Обмен с worker и получение результата | 7.80s | 7.80s | 4.03s | 4.04s | 4.06s | 16.18s | 5304 MiB | 1556 MiB | 1562 MiB | 1582 MiB |
| - Чтение YAML | 2.18s | - | 2.15s | 2.17s | 2.18s | 8.67s | - | 1556 MiB | 1562 MiB | 1582 MiB |
| - Разбор YAML | 1.67s | - | 1.63s | 1.65s | 1.67s | 6.61s | - | 1556 MiB | 1562 MiB | 1582 MiB |
| - Извлечение локальных индексов | 0.21s | - | 0.19s | 0.20s | 0.21s | 0.80s | - | 1556 MiB | 1562 MiB | 1582 MiB |
| - Сохранение worker данных YAML | 0.02s | - | 0.02s | 0.02s | 0.02s | 0.08s | - | 1556 MiB | 1562 MiB | 1582 MiB |
| - Слияние индекса объявлений | 0.12s | 0.12s | - | - | - | - | 5200 MiB | - | - | - |
| - Перераспределение индекса обращений | 0.38s | 0.38s | - | - | - | - | 5304 MiB | - | - | - |
| Проверка по схеме | 17.71s | 1.10s | 14.74s | 15.96s | 16.61s | 63.82s | 5304 MiB | 3572 MiB | 3655 MiB | 3682 MiB |
| Обобщение индексов | 0.50s | 0.50s | - | - | - | - | 5304 MiB | - | - | - |
| Проверка зависимостей | 1.80s | 1.13s | 0.64s | 0.65s | 0.67s | 2.59s | 5304 MiB | 2942 MiB | 2991 MiB | 3019 MiB |
| Итого validation | 30.71s | - | - | - | - | - | 5304 MiB | - | - | - |
```

`Обмен с worker и получение результата` не нужно раскладывать на сериализацию, доставку задачи, очередь Piscina и десериализацию. В первой версии это один честный этап roundtrip: главный поток отправляет задачи, ждет `pool.run(...)`, получает массив результатов и переходит к слиянию. Worker-подшаги ниже показывают, какая часть этого ожидания была реальной работой внутри worker.

`Запуск worker` не должен попадать в основную таблицу `Шаги validation`. Если он измеряется, он относится к отдельному блоку `Инициализация`.

При формировании агрегатов:

- строки верхнего уровня (`Подготовка YAML-проекта`, `Проверка по схеме`, `Проверка зависимостей`) объединяют main- и worker-замеры соответствующего этапа;
- `Worker min/avg/max/sum` считаются только по worker-записям этого этапа или подшага;
- `RSS процесса max` берется из main/orchestration-замеров;
- `RSS worker min/avg/max` считаются по worker peak RSS;
- если данных для колонки нет, выводится `-`, а не `0`.

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
