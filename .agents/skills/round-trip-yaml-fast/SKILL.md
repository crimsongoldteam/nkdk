---
name: round-trip-yaml-fast
description: Use when diagnosing metadata XML -> YAML text -> XML round-trip diffs quickly, especially before the full round-trip-yaml workflow or when external files are intentionally out of scope.
---

# round-trip-yaml-fast

Быстрая диагностика metadata round-trip без записи YAML/XML-деревьев:

```text
XML text -> parsed XML -> модель -> YAML-текст -> модель -> XML text
```

Перед анализом metadata обязательно прочитай:

1. `.agents/knowledge/metadata/INDEX.md`
2. `.agents/knowledge/metadata/sources-of-truth.md`
3. `.agents/knowledge/metadata/round-trip-cycle.md`
4. `.agents/knowledge/metadata/yaml-contract.md`

## Когда использовать

- Нужно быстро найти расхождения YAML-слоя по XML-файлам верхнего уровня, дочерним file-item XML и формам, найденным штатным import-путём.
- Внешние `.bsl`, `.txt`, `.bin`, `.png` не важны для текущей проверки.
- Нужен single diff или triage-пачка без создания reproducer.

Проверяет XML-файлы верхнего уровня, дочерние file-item XML и формы, найденные штатным import-путём. Не используй для проверки модулей, шаблонов, бинарных файлов, справки и полного sync-поведения. Для этого запускай `round-trip-yaml`.

## Запуск

Из корня `nkdk`:

```bash
./.agents/skills/round-trip-yaml-fast/round-trip.sh
./.agents/skills/round-trip-yaml-fast/round-trip.sh --diff-index 3
./.agents/skills/round-trip-yaml-fast/round-trip.sh --triage --batch-size 5 --start-index 6
./.agents/skills/round-trip-yaml-fast/round-trip.sh --triage --all-configs --batch-size 20
```

Скрипт читает `.env`: `NKDK_XML_REPO` обязателен, `NKDK_XML_DIR` опционален. Если `NKDK_XML_DIR` не задан, проверяется `NKDK_XML_REPO`.
Если `NKDK_XML_DIR` указывает на корень с несколькими конфигурациями, скрипт выбирает конфигурационные каталоги так же, как `round-trip-yaml` и `round-trip-xml`; `--all-configs` проходит все найденные каталоги.

## Ответ после запуска

Если вывод содержит `=== Round-trip YAML fast чистый: диффов нет ===`, остановись: анализировать нечего.

В single-режиме дай краткий разбор:

```text
XML-файл: <SELECTED_XML_FILE_ABS>
XML-каталог: <ACTIVE_XML_DIR>
Diff: <SELECTED_DIFF_FILE>
Вероятный модуль: packages/core/metadata/<...> или неизвестно
Категория: потеря пустого тега / порядок XML-узлов / лишний default / потеря атрибута / потеря xsi:type / потеря id или ссылки / YAML-default / YAML-исключение / неизвестно
Описание: <что изменилось>
Diff:
<фрагмент или полный diff>
```

В triage-режиме перечисли каждый `=== TRIAGE_DIFF ===` отдельно. Не исправляй код, не создавай ветку, тест, план, коммит или PR в рамках этого skill.
