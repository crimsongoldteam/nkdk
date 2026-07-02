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

В `first pass` проект уже импортирует модели владельцев и строит `fieldIndex`. Эти данные попадают в `ValidationObjectTable`, поэтому на `second pass` можно построить worker-local индекс members без повторного чтения YAML.

## Goal

Кардинально ускорить validation больших member-ссылок за счёт индекса:

```text
canonical member target -> MetadataResolveResult
```

Решение должно:

- работать для всех правил через общий `ProjectMetadataResolver`, а не через частные условия для `ФункциональнаяОпция` или `КритерийОтбора`;
- не менять формат YAML, canonical target и diagnostics;
- не менять `rules.ts`;
- использовать уже построенные данные `ValidationObjectTable` и `OwnerMetadata`;
- сохранять старый resolver как запасной путь для непокрытых случаев;
- дать профиль по времени построения индекса, числу entries, hit/miss/запасных проходов.

## Proposed Approach

Добавить worker-local `ProjectMemberIndex`, который строится один раз в `runSecondPass` после сборки `supplementedTable`.

Новый поток:

```text
runSecondPass
  -> createValidationObjectTable(...)
  -> createOwnerMetadataCacheFromValidationTable(...)
  -> createProjectMemberIndex(...)
  -> createProjectMetadataResolverFromValidationTable({ memberIndex })
  -> validateProjectFileSecondPass(...)
```

`ProjectMetadataResolver.resolveMember` сначала спрашивает индекс. Если индекс возвращает результат, resolver отдаёт его сразу. Если индекс не умеет такой target или не может безопасно ответить, resolver идёт старым путём.

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

Filters не входят в сам индекс. Lookup получает `target` и `filters`:

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

### Build

`createProjectMemberIndex` принимает:

- `projectDir`;
- `ValidationObjectTable`;
- `OwnerMetadataCache`;
- `hasFile`.

Он проходит по object records из table, получает owner через `ownerCache.get(record.ownerRef)`, пропускает неуспешные owners и передаёт успешные owners всем contributors.

Для каждого entry:

- строится canonical key;
- если ключ ещё не занят, entry кладётся в map;
- если ключ конфликтует, индекс хранит ambiguous marker или не индексирует ключ, чтобы старый resolver сохранил текущую диагностику.

### Resolve

`ProjectMetadataResolver` получает необязательный `memberIndex`.

В `resolveMember(params)`:

1. Проверить resolver cache.
2. Если есть `memberIndex`, вызвать `memberIndex.resolve(params)`.
3. Если result не `undefined`, сохранить его в resolver cache и вернуть.
4. Иначе выполнить старую `resolveMemberUncached`.

Resolver cache остаётся полезным поверх индекса: он кэширует diagnostics, filters и результаты старого resolver-а.

## Profiling

Добавить профильные строки при `NKDK_VALIDATION_PROFILE=1`:

```text
[validation-profile] member-index build entries=<n> owners=<n> skipped=<n> conflicts=<n> ms=<n>
[validation-profile] member-index lookup hits=<n> misses=<n> fallbacks=<n>
```

В `runSecondPass` timing можно добавить `memberIndexMs`, чтобы видеть стоимость подготовки отдельно от `validationMs`.

## Success Criteria

На `/Users/nikita/git/nkdk-yaml`:

- `summary: 0 error, 0 warning`;
- `pnpm test` проходит полностью;
- `properties:ФункциональнаяОпция + properties:КритерийОтбора` падают заметно сильнее текущих `35.23s`;
- `second pass validation` уменьшается сильнее стоимости `memberIndex build`;
- профиль показывает высокий hit rate на member-index для больших коллекций.

Целевой ориентир для первой реализации: снизить сумму `ФункциональнаяОпция + КритерийОтбора` хотя бы в 2 раза. Если индекс покрывает большинство ссылок, ожидаемый выигрыш может быть больше.

## Risks

### Дублирование логики resolver-а

Если индекс начнёт заново реализовывать все правила resolution, поведение разойдётся. Поэтому индекс должен быть ускорителем с запасным путём и contributors рядом с существующими registrations.

### Неполное покрытие member kinds

Часть target-ов может остаться вне индекса. Это нормально, если старый resolver сохраняется и профиль показывает, какие kinds дают miss/fallback.

### Конфликты canonical key

Если два contributors создают один target с разными result, индекс не должен молча выбирать случайный результат. Безопаснее считать такой key непокрытым и отправлять на старый resolver.

### Память

Индекс хранится на worker second pass и ограничен числом members в проекте. Для большого проекта это заметная, но контролируемая плата за ускорение. Нужно вывести `entries` в профиль и смотреть на рост памяти косвенно через `user/sys` и стабильность процесса.

### Filters

Member filters должны применяться так же, как в старом resolver-е. Если indexed entry не содержит `details`, lookup с filters обязан уходить в старый resolver.

## Non-Goals

- Не менять `rules.ts`.
- Не добавлять частные ветки для `ФункциональнаяОпция` или `КритерийОтбора`.
- Не менять parser metadata target.
- Не убирать текущий resolver cache.
- Не делать глобальный кэш между запусками.
