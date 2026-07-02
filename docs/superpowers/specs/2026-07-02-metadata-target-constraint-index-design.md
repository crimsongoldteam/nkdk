# Metadata Target Constraint Index Design

## Context

Полная YAML validation уже распараллелена и worker-side context во `second pass` стал дешёвым: профиль показывает около `0.2-0.4 с` на worker для подготовки контекста. Основное время теперь уходит в саму проверку файлов.

Свежий профиль `NKDK_VALIDATION_PROFILE=1` показал главный источник времени во `second pass`:

- `properties:ФункциональнаяОпция`: около `39.6 с` суммарного worker-времени.
- `properties:КритерийОтбора`: около `4.7 с`.
- `form`: около `3.8 с`.

Медленные файлы содержат большие списки metadata target-ссылок в `СоставФункциональнойОпции` и `Состав`. В `/Users/nikita/git/nkdk-yaml` таких ссылок в `ФункциональнаяОпция` и `КритерийОтбора` суммарно `15 769`.

Текущий parser для `MetadataTargetConstraint` проверяет ссылку через перебор разрешённых форм пути. У `MetadataFunctionalOptionRules.properties.content.metadataTarget` есть `66` разрешённых member-path шаблонов и `26` object-path шаблонов. Поэтому одна строка-ссылка может запускать десятки лишних попыток сопоставления.

## Goal

Ускорить общую проверку `metadataTarget`, не меняя внешний договор:

- YAML-формат ссылок не меняется.
- Canonical-строки не меняются.
- `rules.ts` не меняются.
- Диагностика должна остаться семантически той же.
- Решение должно быть общим для `MetadataTargetConstraint`, а не частным условием для `ФункциональнаяОпция` или `КритерийОтбора`.

## Success Criteria

Основной критерий:

- В профильном прогоне `NKDK_VALIDATION_PROFILE=1` сумма времени `properties:ФункциональнаяОпция + properties:КритерийОтбора` падает минимум в 2 раза относительно текущего профиля `39.6 с + 4.7 с`.

Контрольные критерии:

- Полная validation `/Users/nikita/git/nkdk-yaml` возвращает `summary: 0 error, 0 warning`.
- Тёплый полный прогон не хуже текущего и желательно ниже прежней тёплой базы `52.89 с`.
- `pnpm test` проходит по всему проекту.

## Proposed Approach

Добавить внутреннюю компиляцию `MetadataTargetConstraint` в `packages/core/metadata/commonObjects/metadataTargets/parse.ts`.

Для каждого constraint-а parser один раз строит небольшой индекс разрешённых путей и хранит его в `WeakMap<MetadataTargetConstraint, CompiledMetadataTargetConstraint>`. Ключ `WeakMap` не требует ручной очистки: когда правило больше не используется, индекс тоже может быть собран сборщиком мусора.

Индекс нужен только как быстрый отбор кандидатов. Финальное сопоставление остаётся за существующей логикой, чтобы не менять правила диагностики и нормализации.

## Index Shape

Для object-path шаблонов:

- индексировать по root;
- длине tail;
- последовательности видов object-сегментов.

Для member-path шаблонов:

- индексировать по root;
- длине tail;
- последовательности видов object/member-сегментов;
- последнему member kind, если он известен.

Практический ключ можно сделать строковым после нормализации YAML/model-токенов в внутренние kind-ы:

```text
<root>:<tail-kind-1>/<tail-kind-2>/...
```

YAML и model используют разные имена сегментов (`Реквизит` / `Attribute`, `ТабличнаяЧасть` / `TabularSection`), но parser уже умеет превращать оба варианта в один внутренний kind. Индекс должен работать именно с этими нормализованными kind-ами, а не с исходными строками.

## Parsing Flow

### Object targets

Сейчас `parseExactObjectTarget` получает все `allowedObjectPaths` и проверяет их напрямую.

Новый flow:

1. Разобрать root/objectName/tail как сейчас.
2. Построить быстрый ключ из tail.
3. Получить кандидатов из compiled index.
4. Проверить только кандидатов существующей функцией сопоставления.
5. Если кандидатов нет или все не подошли, вернуть ту же ошибку, что и раньше: `unknownSegment`, `invalidShape` или `disallowedKind` в зависимости от старой семантики.

### Member targets

Сейчас `parseExactMemberTarget` перебирает все `allowedMemberPaths`.

Новый flow:

1. Проверить root/objectName/tail базовыми проверками как сейчас.
2. Найти неизвестные kind-токены как сейчас, чтобы сохранить приоритет ошибки `unknownSegment`.
3. Построить ключ по нормализованной последовательности kind-ов.
4. Получить кандидатов из compiled index.
5. Проверить только кандидатов существующей функцией `parseExactMemberPath`.
6. Если ни один кандидат не подошёл, вернуть старую `disallowedKind([root, ...extractExactPathKinds(...)].join("."))`.

## Error Semantics

Приоритет ошибок должен сохраниться:

1. Неверная форма строки: пустой root/objectName, нечётный tail, пустой member tail.
2. Неизвестный root или kind-сегмент.
3. Запрещённый root.
4. Запрещённый вид пути (`disallowedKind`).
5. Не найденный объект/member уже остаётся задачей resolver-а, не parser-а.

Индекс не должен превращать unknown-kind в disallowed-kind. Поэтому перед обращением к index parser всё равно должен выполнить текущие проверки неизвестных kind-сегментов.

## Components

### `parse.ts`

Добавить:

- `CompiledMetadataTargetConstraint`;
- `compileMetadataTargetConstraint(constraint)`;
- `getCompiledMetadataTargetConstraint(constraint)`;
- helper-ы построения ключа для object/member paths;
- helper-ы выбора кандидатов для `allowedObjectPaths` и `allowedMemberPaths`.

Изменить:

- `parseExactObjectTarget` использует preselected candidates вместо полного `allowedObjectPaths`.
- `parseExactMemberTarget` использует preselected candidates вместо полного `allowedMemberPaths`.

Не менять публичные типы и экспорт parser-а без необходимости.

### Tests

Расширить `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`:

- успешный member target с большим набором `allowedMemberPaths`;
- forbidden path остаётся `disallowedKind`;
- unknown segment остаётся `unknownSegment`;
- YAML/model сегменты индексируются корректно;
- object target с `allowedObjectPaths` и nested object fallback сохраняет поведение.

Добавить performance-oriented regression без жёсткого абсолютного времени:

- создать constraint с десятками allowed member paths;
- прогнать большое число ссылок;
- проверить, что parser вызывает финальное сопоставление только для маленького набора кандидатов.

Если прямой счётчик внутренних вызовов сделает тест хрупким, лучше проверить через exported-for-tests helper, который возвращает количество кандидатов для ссылки.

## Measurement

После реализации выполнить:

```bash
pnpm test
```

Затем полный профиль:

```bash
env NKDK_VALIDATION_PROFILE=1 NKDK_VALIDATION_TIMING=1 /usr/bin/time -p pnpm --filter @nakidka/cli exec tsx src/cli.ts validate /Users/nikita/git/nkdk-yaml
```

Сравнить:

- `properties:ФункциональнаяОпция`;
- `properties:КритерийОтбора`;
- общий `real/user/sys`;
- результат `summary`.

## Risks

### Ошибки диагностики

Самый важный риск: быстрый index может поменять тип ошибки. Например, вместо `unknownSegment` вернуть `disallowedKind`. Это закрывается тестами на порядок ошибок.

### Неполное покрытие форматов

YAML и model используют разные токены. Индекс должен учитывать оба источника или строить ключ после нормализации токенов текущим parser-ом.

### Случаи fallback

У object targets есть fallback с `nestedObjectRoots`: если exact path не подошёл, parser может попробовать nested root object target. Новый быстрый путь не должен убрать этот fallback.

### Слабый выигрыш на resolver-е

Если после ускорения parser-а основное время уйдёт в `ownerCache`/resolver, это будет следующий этап. Но текущий профиль и размер списков показывают, что перебор шаблонов является первым разумным узким местом.

## Non-Goals

- Не менять правила `MetadataFunctionalOptionRules` и `MetadataFilterCriterionRules`.
- Не добавлять частные условия по `itemType`, папкам или именам объектов в validation/common слои.
- Не менять формат YAML-ссылок.
- Не менять resolver и owner cache в этом этапе.
- Не удалять существующий `NKDK_VALIDATION_PROFILE`; он нужен для измерения результата.
