# round-trip-yaml skill design

## Цель

Добавить отдельный Codex skill `round-trip-yaml` для диагностики полного metadata round-trip:

```text
XML -> модель -> YAML -> модель -> XML
```

Скилл нужен как обзорный инструмент: он показывает diff'ы полного цикла, помогает выбрать проблемный файл и не создаёт reproducer.

## Не-цели

- Не создавать ветки.
- Не создавать XML, TS или YAML-фикстуры.
- Не добавлять тесты.
- Не исправлять `rules.ts`.
- Не запускать полный `pnpm test`.
- Не коммитить результаты диагностики.

## Расположение

Новый skill живёт отдельно от short XML-cycle:

```text
.agents/skills/round-trip-yaml/
  SKILL.md
  round-trip.sh
```

`round-trip-xml` остаётся скиллом для short cycle `XML -> модель -> XML` и reproducer workflow. Новый `round-trip-yaml` не расширяет его флагом, чтобы не смешивать разные циклы и правила работы.

## Режимы

### Single

По умолчанию скилл запускает полный цикл и показывает один diff-файл.

Поддерживается выбор diff'а:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh --diff-index N
```

### Triage

Для обзорной пачки diff'ов:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5
./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5 --start-index 6
```

Формат ответа повторяет triage из `round-trip-xml`:

- относительный XML-путь;
- кликабельный абсолютный `XML_FILE_ABS`;
- активный XML-каталог;
- вероятный metadata-модуль;
- вероятный файл кода;
- категория расхождения;
- краткое описание;
- релевантный diff-фрагмент;
- сомнения, если причина или модуль неочевидны.

## Поведение `round-trip.sh`

Скрипт читает `NKDK_XML_REPO` и `NKDK_XML_DIR` из `.env` корня `nakidka-core`, как `round-trip-xml`.

Перед запуском он проверяет:

- рабочее дерево `nakidka-core` чистое;
- `NKDK_XML_REPO` является git-репозиторием;
- `NKDK_XML_DIR` существует;
- команда `nkdk` доступна или может быть запущена через `packages/cli/src/cli.ts`.

Для каждого выбранного XML-каталога скрипт:

1. откатывает XML-репо к `HEAD` через `git restore .`;
2. определяет предсказуемый временный YAML-каталог для активного XML-каталога;
3. удаляет этот YAML-каталог перед прогоном;
4. создаёт пустой YAML-каталог;
5. запускает `nkdk import <xml-dir> <tmp-yaml-dir>`;
6. запускает `nkdk sync <tmp-yaml-dir> <xml-dir>`;
7. собирает `git diff` в XML-каталоге;
8. останавливается на первом каталоге с actionable diff, если не указан режим обхода всех каталогов.

Временный YAML-каталог намеренно остаётся после прогона: он нужен для диагностики YAML-слоя. Главное требование: он всегда очищается перед следующим запуском.

## Каталоги конфигураций

Скрипт использует тот же подход, что `round-trip-xml`:

- если `NKDK_XML_DIR` сам содержит зарегистрированные XML-каталоги, проверяется он;
- иначе проверяются дочерние каталоги в алфавитном порядке;
- поддерживаемые XML-каталоги должны включать существующий список `round-trip-xml`: `Catalogs`, `Documents`, `DocumentNumerators`, `Sequences`, `Enums`.

## Протокол вывода

Скрипт отдаёт машинно-читаемые блоки, совместимые по смыслу с `round-trip-xml`:

- `ACTIVE_XML_DIR`;
- `DIFF_COUNT`;
- `SELECTED_DIFF_INDEX`;
- `SELECTED_DIFF_FILE`;
- `SELECTED_XML_FILE_ABS`;
- `FULL_DIFF`;
- `TRIAGE_RANGE`;
- `TRIAGE_DIFF`;
- `Round-trip чистый: диффов нет`.

Дополнительно выводит путь к временному YAML-каталогу, чтобы пользователь мог посмотреть промежуточный YAML:

```text
YAML_DIR: <absolute tmp yaml dir>
```

## Обработка ошибок

Если `nakidka-core` не чистый, скилл останавливается и просит пользователя сохранить или откатить правки. Он не запускает `git stash`, `git restore` или `git clean` в основном репозитории.

Если `nkdk import` или `nkdk sync` падают, скилл показывает команду, активный XML-каталог, временный YAML-каталог и текст ошибки. После такой ошибки он не пытается строить diff по частичному результату.

## Критерии готовности

- Есть `.agents/skills/round-trip-yaml/SKILL.md`.
- Есть `.agents/skills/round-trip-yaml/round-trip.sh`.
- `round-trip.sh --help` описывает single и triage режимы.
- Скрипт очищает временный YAML-каталог перед прогоном.
- Скрипт оставляет временный YAML-каталог после прогона для диагностики.
- Формат triage-ответа в `SKILL.md` явно описан.
- Новый skill не создаёт ветки, фикстуры, тесты, планы исправления и коммиты.
