# Validation Member Index Design

## Context

После кэша `ProjectMetadataResolver` полный прогон `/Users/nikita/git/nkdk-yaml` стал быстрее, но профиль всё ещё показывает крупную горячую точку:

- `properties:ФункциональнаяОпция`: около `30978ms`;
- `properties:КритерийОтбора`: около `4253ms`;
- вместе: около `35.23s`.

Обе группы в основном валидируют большие коллекции `metadataTarget` member-ссылок:

- `ФункциональнаяОпция.СоставФункциональнойОпции`;
- `КритерийОтбора.Состав`.

Кэш resolver-а убирает повторное разрешение одинаковых ссылок, но при большом числе уникальных ссылок остаётся дорогой путь:

```text
parseMetadataTargetFromModel
  -> ProjectMetadataResolver.resolveMember
  -> ownerCache.get
  -> resolveMemberSegments / registered member resolvers
```

В `first pass` проект уже читает YAML, валидирует структуру, импортирует модели владельцев и строит `fieldIndex`. Это лучший момент, чтобы сразу построить "оглавление" members для каждого объекта и собрать список ссылок, которые потом нужно проверить.

## Goal

Кардинально ускорить validation больших member-ссылок за счёт двух результатов `first pass`:

```text
canonical member target -> MetadataResolveResult
pending reference -> где ссылка находится и как её проверить
```

Решение должно:

- работать для всех правил через общий `ProjectMetadataResolver`, а не через частные условия для `ФункциональнаяОпция` или `КритерийОтбора`;
- не менять формат YAML, canonical target и diagnostics;
- не менять `rules.ts`;
- использовать уже разобранный YAML и построенные модели во время `first pass`;
- во `second pass` проверять готовые `pendingReferences`, а не заново обходить каждую модель;
- сохранять старый resolver как запасной путь для непокрытых случаев;
- дать профиль по числу index entries, pending references, размеру snapshot, hit/miss/запасных проходов.

## Proposed Approach

Добавить два новых результата `first pass`:

- `memberIndexEntries`: что существует в данном YAML-файле;
- `pendingReferences`: какие metadataTarget-ссылки нужно проверить после того, как известен весь проект.

Главный поток после `first pass` склеивает результаты worker-ов в общий snapshot и передаёт его во `second pass`. Worker-ы второго прохода проверяют ссылки lookup-ом по готовому индексу.

Новый поток:

```text
first pass worker
  -> read YAML
  -> schema validation
  -> import model
  -> build fieldIndex
  -> build memberIndexEntries for this owner
  -> collect pendingReferences from this model

main thread
  -> merge objectRecords
  -> merge memberIndexEntries into ProjectMemberIndexSnapshot
  -> partition pendingReferences

second pass worker
  -> receive ProjectMemberIndexSnapshot
  -> validate assigned pendingReferences by lookup
  -> fallback to ProjectMetadataResolver only for uncovered cases
```

`ProjectMetadataResolver.resolveMember` остаётся запасным механизмом и используется для непокрытых случаев, partial validation и совместимости старого потока. Для full validation горячий путь больших коллекций должен идти через `pendingReferences -> ProjectMemberIndexSnapshot`.

## Member Index Contract

Индекс не должен знать конкретные metadata item types напрямую. Для этого нужен расширяемый договор рядом с существующим `ProjectMemberResolver` registry.

Предлагаемый договор:

```ts
export type ProjectMemberIndexContributor = (params: {
  projectDir: string
  owner: OwnerMetadata
  hasFile: (filePath: string) => boolean
}) => Iterable<ProjectMemberIndexEntry>

export interface ProjectMemberIndexEntry {
  target: Extract<ParsedMetadataTarget, { kind: "member" }>
  result: MetadataResolveResult
}
```

Регистрация:

```ts
registerProjectMemberIndexContributor(contributor)
getProjectMemberIndexContributors()
```

Существующие registered resolvers остаются источником поведения для точечного запасного пути. Contributors добавляются там же, где сейчас регистрируются member resolvers, например в `metadataTargetProjectResolvers/register.ts`.

## Pending Reference Contract

`pendingReferences` должны быть компактными. Не нужно переносить модель или весь YAML.

```ts
export interface PendingMetadataTargetReference {
  filePath: string
  yamlPath: YamlPath
  canonical: string
  target: ParsedMetadataTarget
  constraint: MetadataTargetConstraintSnapshot
}
```

`constraint` должен быть пригоден для structured clone. Если полный `MetadataTargetConstraint` содержит лишние поля или функции, нужно передавать компактный снимок только с тем, что нужно для проверки: `kind`, `filters`, разрешённые roots/path restrictions и режим owner.

Первый этап может собирать pending references только для full validation. Partial validation может остаться на старом resolver-пути, потому что там важнее корректная дозагрузка зависимостей.

## Indexed Members

Первый этап индекса должен покрыть основные горячие виды:

- field-like members из `owner.fieldIndex`: `Attribute`, `StandardAttribute`, `TabularSection`, `Dimension`, `Resource`, `AddressingAttribute`;
- вложенные поля табличных частей: `TabularSection.Attribute`, `TabularSection.StandardAttribute`;
- collection members из модели владельца: `Command`, `Form`, `Template`, `AccountingFlag`, `ExtDimensionAccountingFlag`, `Field`, `Dimension`, `Resource`;
- file-backed local members, где это безопасно и дёшево проверить: формы и макеты по физическим путям.

Если какой-то вид member пока сложно перечислить без риска изменить поведение, он должен оставаться на старом resolver-е.

## Cache Key and Lookup

Индекс хранит canonical key, построенный из `ParsedMetadataTarget`.

Формат ключа должен совпадать по смыслу с resolver-cache key:

```text
member|<canonical member target>
```

Filters не входят в сам индекс. Lookup получает `target` и `filters` из pending reference:

1. Если filters отсутствуют, можно вернуть indexed result сразу.
2. Если filters есть и result успешный, нужно применить тот же `applyMetadataTargetFilters`, что использует старый resolver.
3. Если filters есть и индекс не содержит details, lookup должен вернуть `undefined`, чтобы сработал старый resolver.

Так индекс остаётся ускорителем, а не отдельной реализацией validation semantics.

## Miss Semantics

Индекс не должен сам придумывать diagnostics для сложных miss.

Правило:

- если owner найден и индекс умеет family target-а, можно вернуть ту же reference diagnostic, что старый resolver вернул бы для отсутствующего сегмента;
- если index не уверен, он возвращает `undefined`;
- `undefined` означает запасной переход на текущий `resolveMemberUncached`.

Это сохраняет совместимость и позволяет внедрять индекс постепенно по видам members.

## Data Flow Details

### First Pass Build

`validateProjectFileFirstPass` после успешного импорта модели возвращает:

- `objectRecords`, как сейчас;
- `memberIndexEntries`;
- `pendingReferences`.

`memberIndexEntries` строятся из уже доступных данных owner-а:

- `fieldIndex`;
- модель владельца;
- физические соседние файлы, если contributor может проверить их дёшево и безопасно.

`pendingReferences` собираются тем же обходом правил, который сейчас выполняет metadata target validation, но вместо немедленного `resolver.resolveMember` он записывает задачу проверки.

Для каждого entry:

- строится canonical key;
- если ключ ещё не занят, entry попадает в snapshot;
- если ключ конфликтует, индекс хранит ambiguous marker или не индексирует ключ, чтобы старый resolver сохранил текущую диагностику.

### Merge

Главный поток после `runFirstPass` объединяет:

- `ValidationObjectRecord[]`;
- `ProjectMemberIndexEntry[]`;
- `PendingMetadataTargetReference[]`.

Склейка индекса остаётся последовательной, но она должна быть короткой: это вставка уже готовых entries в `Map` и построение компактного snapshot для worker-ов.

### Second Pass Resolve

Worker второго прохода получает:

- общий `ProjectMemberIndexSnapshot`;
- свою часть `pendingReferences`;
- `objectTable` для запасного resolver-а.

Основной путь:

1. Взять pending reference.
2. Если target не `member`, проверить через соответствующий индекс/старый resolver.
3. Для member target сделать lookup в `ProjectMemberIndexSnapshot`.
4. Если найдено и filters применимы, ссылка валидна.
5. Если не найдено или случай не покрыт индексом, вызвать старый `ProjectMetadataResolver`.

Resolver cache остаётся полезным для запасного пути: он кэширует diagnostics, filters и результаты старого resolver-а.

## Parallelism

Параллелятся две тяжёлые фазы:

1. `first pass`: чтение YAML, schema validation, импорт модели, построение local member entries и pending references.
2. `second pass`: проверка pending references по готовому индексу.

Не параллелится только склейка общего snapshot между проходами. Она должна быть быстрой и измеряемой.

`pendingReferences` нужно делить между worker-ами отдельно от файлов. Для равномерности лучше делить по количеству references, а не по количеству YAML-файлов: один файл функциональной опции может содержать сильно больше ссылок, чем обычный объект.

## Memory Model

Первый этап использует обычный cloneable snapshot, без `SharedArrayBuffer`.

Память будет расходоваться на:

- `memberIndexEntries`: что существует;
- `pendingReferences`: что нужно проверить;
- копии snapshot в worker-ах второго прохода.

Чтобы удержать память:

- `details` в index entry должны быть компактными и хранить только данные, нужные для filters и diagnostics;
- повторяющиеся строки `filePath`, `kind`, `memberKind`, `typeInfo` желательно кодировать id внутри snapshot;
- `pendingReferences` не должны хранить model/raw YAML;
- профиль должен показывать число entries/references и примерный размер сериализованного snapshot.

`SharedArrayBuffer` не входит в первый этап. Он может стать отдельным вторым этапом только если замеры покажут, что копирование snapshot в worker-ы стало главным ограничением. Готовой надёжной JS `Map`-структуры поверх `SharedArrayBuffer` для этого места не закладываем; если понадобится, это будет отдельный бинарный read-only индекс.

## Profiling

Добавить профильные строки при `NKDK_VALIDATION_PROFILE=1`:

```text
[validation-profile] references first-pass entries=<n> pending=<n> conflicts=<n> bytes=<n> ms=<n>
[validation-profile] references second-pass hits=<n> misses=<n> fallbacks=<n> diagnostics=<n> ms=<n>
```

В timing стоит добавить:

- `referenceBuildMs` для first pass;
- `referenceMergeMs` для главного потока;
- `referenceValidationMs` для second pass;
- `snapshotBytes` как приблизительный размер передаваемых данных.

## Success Criteria

На `/Users/nikita/git/nkdk-yaml`:

- `summary: 0 error, 0 warning`;
- `pnpm test` проходит полностью;
- `properties:ФункциональнаяОпция + properties:КритерийОтбора` падают заметно сильнее текущих `35.23s`;
- `second pass validation` уменьшается сильнее стоимости сборки/передачи snapshot;
- профиль показывает высокий hit rate на member-index для больших коллекций;
- `snapshotBytes` и память worker-ов остаются приемлемыми для текущего проекта.

Целевой ориентир для первой реализации: снизить сумму `ФункциональнаяОпция + КритерийОтбора` хотя бы в 2 раза. Если индекс покрывает большинство ссылок, ожидаемый выигрыш может быть больше.

## Risks

### Дублирование логики resolver-а

Если индекс начнёт заново реализовывать все правила resolution, поведение разойдётся. Поэтому индекс должен быть ускорителем с запасным путём и contributors рядом с существующими registrations.

### Неполное покрытие member kinds

Часть target-ов может остаться вне индекса. Это нормально, если старый resolver сохраняется и профиль показывает, какие kinds дают miss/fallback.

### Конфликты canonical key

Если два contributors создают один target с разными result, индекс не должен молча выбирать случайный результат. Безопаснее считать такой key непокрытым и отправлять на старый resolver.

### Память

Обычный snapshot будет скопирован в worker-ы. Это осознанное упрощение первого этапа. Нужно измерить `snapshotBytes`, число entries и число pending references. Если копирование станет главным ограничением, отдельно проектировать `SharedArrayBuffer`-индекс.

### Filters

Member filters должны применяться так же, как в старом resolver-е. Если indexed entry не содержит `details`, lookup с filters обязан уходить в старый resolver.

## Non-Goals

- Не менять `rules.ts`.
- Не добавлять частные ветки для `ФункциональнаяОпция` или `КритерийОтбора`.
- Не менять parser metadata target.
- Не убирать текущий resolver cache.
- Не делать глобальный кэш между запусками.
- Не использовать `SharedArrayBuffer` в первом этапе.
