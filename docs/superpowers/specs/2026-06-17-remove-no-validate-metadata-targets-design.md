# Удаление --no-validate-metadata-targets

## Цель

Убрать диагностический обход проверки `metadataTarget`, добавленный коммитом `c207ad6b68`.
После изменения `import` и `sync` всегда выполняют обычную проверку и преобразование `metadataTarget`; отключить это поведение через CLI или внутренний контекст нельзя.

## Границы

- Удалить CLI-флаг `--no-validate-metadata-targets` из команд `import` и `sync`.
- Удалить передачу `validateMetadataTargets` из CLI-команд в metadata-контекст.
- Удалить поле `validateMetadataTargets` из типов контекста YAML-импорта и YAML-экспорта.
- Удалить ветвления в `metadataPath/fromYAML.ts` и `metadataPath/toYAML.ts`, которые возвращали исходную строку вместо проверки.
- Удалить или обновить тесты, которые проверяли отключение `metadataTarget`.
- Убрать использование флага из round-trip скриптов `.agents/skills/round-trip-yaml*/round-trip.sh`.

## Поведение

`metadataTarget` становится обязательной частью YAML-пути:

- `fromYAML` всегда разбирает строку через `parseMetadataTargetFromYAML`;
- `toYAML` всегда форматирует значение через `formatMetadataTargetToYAML`;
- ошибки в round-trip диагностируются как проблемы правил, данных или reference-контекста, а не скрываются отключением проверки.

## Проверка ошибок

Если после удаления обхода появятся ошибки round-trip, их нужно рассматривать по существующим правилам metadata:

- простые расхождения чинить в `rules.ts` или контексте владельца;
- расхождения в чужом `metadataItem` не исправлять без отдельного решения;
- XML-фикстуры не менять.

## Тестирование

Минимальная проверка:

- точечные тесты CLI и `metadataPath`;
- полный `pnpm test` из корня worktree.

Критерий готовности: в коде и скриптах не остаётся упоминаний `--no-validate-metadata-targets` и `validateMetadataTargets`, а тесты проходят.
