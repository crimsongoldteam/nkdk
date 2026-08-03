---
name: validation-profile
description: Use when the user asks to measure YAML project validation speed or memory through the compiled standalone validation path.
---

# validation-profile

## Что делает скилл

Скилл выполняет benchmark валидации YAML-проекта через compiled standalone path:

```text
packages/core/dist/index.js
  -> packages/core/dist/projectValidationAjvStandalone.js
```

Он не использует MCP service и не импортирует `packages/core/index.ts`, потому что это source/tsx path.
Core выводит профиль при `NKDK_PROFILE=1`.

Runner использует один `ProjectStateService` для последовательных запусков: первый запуск является cold, последующие — warm. Машинный результат каждого запуска содержит счётчики состояния проекта, размер снимка, времена загрузки и checkpoint, а также SHA-256 digest полного стабильного представления diagnostics. Во время профильного запуска stderr получает отметки `[nkdk-project-state-phase]` для обнаружения путей, чтения исходных хэшей, обработки файлов в worker, чтения локальных diagnostics, dependency validation и checkpoint; итоговый JSON содержит длительность каждой фазы.

## Жёсткие инварианты

- Перед каждым замером выполняй свежую сборку: `pnpm --filter @nkdk/core build`.
- Запускай только `node .agents/skills/validation-profile/validation-profile.mjs ...`.
- Не запускай `pnpm test`.
- Не исправляй validation diagnostics в рамках этого скилла.
- Не коммить результаты замеров.
- Не запускай runner прямо на пользовательском проекте, если его `.nkdk` нельзя изменять: подготовь временную копию без `.nkdk` и зафиксируй контрольную сумму исходного кэша до и после.
- Для целевого проекта запускай runner через внешний ограничитель времени не более 115 секунд; не полагайся на отмену внутри JavaScript для остановки синхронной SQLite-фазы.
- Если пользователь просит сравнить source/tsx и compiled standalone, скажи, что это отдельная диагностика вне этого скилла.

## Быстрый запуск

```bash
pnpm --filter @nkdk/core build
node .agents/skills/validation-profile/validation-profile.mjs /path/to/yaml
```

С одним прогоном:

```bash
pnpm --filter @nkdk/core build
node .agents/skills/validation-profile/validation-profile.mjs /path/to/yaml --runs 1
```

С worker timing:

```bash
pnpm --filter @nkdk/core build
node .agents/skills/validation-profile/validation-profile.mjs /path/to/yaml --runs 1 --timing
```

Один холодный подробный прогон:

```bash
node .agents/skills/validation-profile/validation-profile.mjs /private/tmp/project-copy --timing-only
```

`--timing-only` удаляет только `.nkdk/cache/project-state.bin` и его незавершённые временные файлы, затем выполняет один профильный проход. Используй его только на временной копии проекта: на пользовательском каталоге удаление кэша запрещено.

## Параметры runner'а

- `--runs N` — число прогонов, по умолчанию `5`.
- `--concurrency N` — явно задать число worker'ов. Если не задано, core использует свой default.
- `--timing` — добавить один прогон с `NKDK_PROFILE=1` и распарсить first/second pass worker memory.
- `--timing-only` — сбросить двоичный кэш временной копии и выполнить единственный холодный проход с `NKDK_PROFILE=1`; несовместим с `--timing`.
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
Hashed/parsed YAML: <cold hashed>/<cold parsed>, <warm hashed>/<warm parsed>
Snapshot: <bytes>; load=<seconds>; checkpoint=<seconds>
Diagnostics digest: <sha256>; cold/warm equal=<true|false>
Peak RSS: <MiB>
RSS по прогонам: <run list>
```

Если был `--timing`, добавь краткую таблицу:

```text
worker | phase | files | processRssPeak | workerHeapPeak
```

Для `--timing` и `--timing-only` отдельно показывай таблицу `Обработка файлов Б1–Б4` со строками:

- подготовка заданий;
- чтение файлов;
- вычисление и сравнение хэшей;
- разбор и локальная проверка YAML;
- сбор сведений файла;
- двоичное кодирование результата;
- ожидание worker;
- применение пачек и удалений в главном процессе.

`Worker sum` — суммарное процессорное время параллельных worker. Его нельзя складывать с реальным временем `processFiles`; для длительности этапа используй `processFiles`, а worker min/avg/max — для поиска дисбаланса.

## Ограничения

`--timing` использует общий `NKDK_PROFILE=1` и выполняется после обычных прогонов, поэтому является прогретым. Для детализации холодного Б1–Б4 используй `--timing-only` на временной копии.

Если diagnostics выглядят неожиданно, явно укажи, что это результат compiled standalone, и предложи отдельную проверку parity.
