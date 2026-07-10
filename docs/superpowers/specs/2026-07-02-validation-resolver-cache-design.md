# Validation Resolver Cache Design

## Context

Полная YAML validation уже выполняет `second pass` в worker-ах и переиспользует worker-local context. После этого главный потребитель времени остался внутри проверки metadata target-ссылок.

Проверка гипотезы с индексом parser-а показала важную деталь: для больших `metadataTarget` списков сам `parseMetadataTargetFromModel` занимает мало времени. Временный диагностический замер разделил работу так:

- parse больших metadata target-ссылок: около `0.17 с` суммарно;
- `resolveMember` для тех же ссылок: около `39.8 с` суммарно.

Значит основной выигрыш нужно искать не в parser-е, а в повторном разрешении одинаковых object/member/value целей во время `second pass`.

Горячий путь сейчас:

```text
validateCanonicalTarget
  -> parseMetadataTargetFromModel
  -> resolveParsedTarget
  -> ProjectMetadataResolver.resolveMember / resolveObject / resolveValue
```

`ProjectMetadataResolver` создаётся на один validation pass внутри worker-а. В этот период YAML snapshot, object table, owner cache и правила не меняются, поэтому результат разрешения одной и той же цели стабилен.

## Goal

Ускорить validation за счёт кэширования результатов `ProjectMetadataResolver` на время жизни resolver-а.

Решение должно:

- кэшировать и успешные, и ошибочные результаты;
- не менять YAML/canonical формат metadata target-ссылок;
- не менять `rules.ts`;
- не добавлять частных условий по `ФункциональнаяОпция`, `КритерийОтбора`, `itemType` или папкам;
- сохранять диагностику и поведение resolver-а;
- работать внутри существующих границ validation/common слоёв.

## Success Criteria

Основной критерий:

- В профильном прогоне `/Users/nikita/git/nkdk-yaml` заметно падает время `properties:ФункциональнаяОпция + properties:КритерийОтбора`, потому что повторные ссылки перестают заново проходить `resolveMember`.

Контрольные критерии:

- `pnpm test` проходит по всему проекту.
- Полная validation возвращает `summary: 0 error, 0 warning`.
- Профильный прогон с `NKDK_VALIDATION_PROFILE=1 NKDK_VALIDATION_TIMING=1` показывает снижение `second pass validation` времени без роста diagnostics.
- Поведение ошибочных ссылок не меняется: одинаковая битая ссылка возвращает ту же диагностику, что и без кэша.

## Proposed Approach

Добавить кэши внутри `createProjectMetadataResolverCore` в `packages/core/metadata/validation/projectMetadataResolver.ts`.

Кэш живёт столько же, сколько конкретный resolver:

- для обычного CLI validation resolver создаётся на проход;
- для worker second pass resolver создаётся на worker-пакет файлов;
- при новом запуске validation кэш пустой.

Это даёт простое правило устаревания: вручную очищать кэш не нужно, потому что в пределах одного resolver-а входные данные не меняются.

## Cache Scope

Добавить отдельные `Map`:

- `objectResolveCache`;
- `memberResolveCache`;
- `valueResolveCache`.

Кэшировать нужно публичные методы resolver-а:

- `resolveObject`;
- `resolveMember`;
- `resolveValue`.

`resolveStyleItem` и `resolveCommonPicture` можно оставить без отдельного кэша на первом этапе: они не показали себя горячей точкой текущего профиля. Если `resolveObject` с `styleItemType` фильтром окажется частым, его уже покроет object cache, потому что filters входят в ключ.

## Cache Key

Ключ должен включать всё, что влияет на результат.

Для object:

```text
object|<canonical object target>|<filters key>
```

Для member:

```text
member|<canonical member target>|<filters key>
```

Для value:

```text
value|<canonical value target>
```

Canonical target нужно строить из `ParsedMetadataTarget`, а не из исходной строки, потому что resolver получает уже разобранную цель. В `projectMetadataResolver.ts` уже есть локальные форматтеры `formatObjectTarget`, `formatMemberTarget`, `formatValueTarget`; их можно использовать как основу ключа.

`filters key` должен быть стабильным и учитывать порядок и содержимое фильтров. Для текущих `MetadataTargetFilter` достаточно детерминированного JSON-представления, потому что filters состоят из простых объектов и массивов. Если filters отсутствуют, ключ должен использовать отдельный маркер, например `-`.

## Error Handling

Кэш хранит `MetadataResolveResult` целиком:

- `{ ok: true, filePath, details }`;
- `{ ok: false, diagnostics, dependency? }`.

Это важно для повторяющихся битых ссылок: повторная ошибка не должна заново обходить проект.

Результаты resolver-а должны считаться read-only договором. Если тесты покажут, что вызывающий код мутирует `diagnostics` или `details`, нужно возвращать поверхностную копию результата из кэша. Начинать лучше без копирования, чтобы не создавать лишние объекты на горячем пути.

## Data Flow

### `resolveMember`

Новый flow:

1. Построить cache key из target и filters.
2. Если ключ есть в `memberResolveCache`, вернуть cached result.
3. Выполнить текущую логику `resolveMember` без изменения поведения.
4. Сохранить результат в cache.
5. Вернуть результат.

Чтобы не раздувать метод, текущую логику лучше вынести в локальную функцию `resolveMemberUncached`.

### `resolveObject`

Такой же flow:

1. Key по object target и filters.
2. Cache hit возвращает результат.
3. Cache miss выполняет текущую логику.
4. Результат сохраняется.

Важно: `resolveMember` вызывает `resolver.resolveObject`. Это хорошо: member-кэш уберёт повторные member-пути, а object-кэш дополнительно уберёт повторное разрешение владельца.

### `resolveValue`

Value target встречается реже, но кэш дешёвый и симметричный. Он также вызывает `resolveObject`, поэтому получит часть выигрыша через object cache.

## Tests

Добавить focused-тесты в `packages/core/metadata/validation/projectMetadataResolver.test.ts`.

Проверить:

1. Повторный `resolveMember` одной и той же прямой ссылки возвращает тот же результат и не выполняет дорогую часть повторно.
2. Повторный `resolveMember` битой ссылки возвращает ту же ошибку.
3. Разные filters не смешиваются в одном cache entry.
4. `resolveObject` кэширует успешный результат.
5. `resolveObject` кэширует ошибку отсутствующего объекта.

Для проверки cache hit не нужно завязываться на время. Лучше использовать существующие тестовые seam-ы: например, resolver с `hasFile`/`missingObject` или объект, где повторный вызов можно заметить через счётчик. Если такого seam-а недостаточно, добавить test-only helper минимально и рядом с resolver-ом.

## Measurement

После реализации выполнить:

```bash
pnpm test
```

Затем validation без профиля:

```bash
/usr/bin/time -p pnpm --filter @nakidka/cli exec tsx src/cli.ts validate /Users/nikita/git/nkdk-yaml
```

Затем validation с профилем:

```bash
env NKDK_VALIDATION_PROFILE=1 NKDK_VALIDATION_TIMING=1 /usr/bin/time -p pnpm --filter @nakidka/cli exec tsx src/cli.ts validate /Users/nikita/git/nkdk-yaml
```

Сравнить:

- `summary`;
- общий `real/user/sys`;
- `properties:ФункциональнаяОпция`;
- `properties:КритерийОтбора`;
- worker `second pass validation`.

## Risks

### Неполный ключ

Если ключ не учитывает filters, одна и та же ссылка может ошибочно переиспользовать результат другого правила. Поэтому filters обязаны входить в ключ для object/member.

### Мутация cached result

Если вызывающий код изменяет diagnostics/details, повторная выдача того же объекта может дать неверное поведение. Это нужно проверить тестами. При необходимости кэш должен возвращать поверхностные копии.

### Ошибки partial validation

`MetadataResolveResult` может содержать `dependency` в partial mode. Это тоже часть результата и может кэшироваться в рамках одного resolver-а, потому что mode и object table стабильны на время resolver-а.

### Память

Кэш живёт только внутри resolver-а и ограничен числом уникальных metadata target-ссылок в worker second pass. Это приемлемо для текущего профиля: проблема именно в большом числе повторных разрешений, а не в миллионах уникальных ссылок.

## Non-Goals

- Не менять parser metadata target.
- Не строить глобальный индекс всех members проекта.
- Не менять owner cache.
- Не добавлять частные правила для `ФункциональнаяОпция` или `КритерийОтбора`.
- Не менять формат diagnostics.
