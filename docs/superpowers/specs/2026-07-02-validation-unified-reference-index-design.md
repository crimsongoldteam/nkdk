# Validation Unified Reference Index Design

## Context

Текущий этап уже вынес часть metadataTarget validation в `pendingReferences` и `memberIndexEntries`.
Профиль `/Users/nikita/git/nkdk-yaml` после этого показывает:

- `pending=77521`;
- `entries=145768`;
- `hits=10906`;
- `fallbacks=66615`;
- `snapshotBytes=342393714`;
- full validation проходит чисто за `real 41.33-45.45s`.

Это подтверждает, что поток `first pass -> index entries -> pending references -> second pass` работает, но архитектурно он ещё промежуточный:

- быстрый путь покрывает только часть `member`-ссылок;
- `object` и `value` остаются на старом `ProjectMetadataResolver`;
- большая часть ссылок всё ещё уходит в fallback;
- snapshot содержит дублированные структуры и уже занимает около `326 MB`.

Новая цель — не расширять точечный member-ускоритель, а завершить переход на единый механизм проверки ссылок.

## Decision

Заменить `ProjectMetadataResolver` единым `ProjectReferenceIndex` во всей validation.

`ProjectMetadataResolver` и `projectMetadataResolverRegistry` удаляются из runtime-кода validation. Старого fallback-пути быть не должно. Если индекс не умеет проверить ссылку, это считается ошибкой покрытия нового механизма, а не штатной веткой выполнения.

## Goals

- Единый механизм для `object`, `member`, `value` и metadataTarget filters.
- Один список `pendingReferences`, одна функция `ProjectReferenceIndex.resolve(reference)`.
- Full и partial validation используют один механизм.
- Partial validation сохраняет дозагрузку зависимостей через `needsDependency`, но возвращает её из `ProjectReferenceIndex`, а не из resolver-а.
- `unsupported=0` и `fallback=0` становятся инвариантами профильного запуска.
- Диагностики сохраняют смысл текущих ошибок: объект не найден, member не найден, value не найден, filter не пройден, ссылка неоднозначна.
- Старые resolver tests переносятся на contract tests нового индекса.

## Non-Goals

- Не менять формат YAML.
- Не менять canonical target syntax.
- Не менять `rules.ts` ради нового индекса.
- Не добавлять `SharedArrayBuffer` в этом этапе.
- Не оставлять совместимый фасад `ProjectMetadataResolver` для validation.

## Architecture

### ProjectReferenceIndex

Новый центральный объект:

```ts
export interface ProjectReferenceIndex {
  resolve(reference: PendingMetadataTargetReference): ProjectReferenceIndexResult
  stats(): ProjectReferenceIndexStats
}
```

Результат:

```ts
export type ProjectReferenceIndexResult =
  | { ok: true }
  | { ok: false; reason: "notFound"; diagnostics: Diagnostic[] }
  | { ok: false; reason: "conflict"; diagnostics: Diagnostic[] }
  | { ok: false; reason: "filter"; diagnostics: Diagnostic[] }
  | { ok: false; reason: "needsDependency"; dependency: ValidationDependencyRequest }
  | { ok: false; reason: "unsupported"; diagnostics: Diagnostic[] }
```

`unsupported` допустим только как защитный результат разработки. В штатной full/partial validation профиль должен показывать `unsupported=0`.

### Indexed Targets

Индекс хранит три семейства entries:

```ts
ProjectObjectIndexEntry
ProjectMemberIndexEntry
ProjectValueIndexEntry
```

Каждая entry содержит:

- canonical key;
- parsed target;
- filePath;
- details, нужные для filters;
- dependency identity, если target может требовать дозагрузку файла в partial mode.

Ключи строятся из `ParsedMetadataTarget`, а не из YAML-строки, чтобы все нормализованные формы ссылок сходились в одну запись.

### Builders

`first pass` после успешного импорта model создаёт:

- object entries для самого объекта и вложенных объектов;
- member entries из `fieldIndex`, коллекций модели и file-backed children;
- value entries для predefined/enum/emptyRef values;
- pending references из уже существующего обхода metadataTarget-правил.

Общие слои не знают конкретных `itemType` и папок. Конкретика остаётся в декларативных registrations рядом с объектами и commonObjects:

- object path contributors;
- member index contributors;
- value index contributors;
- file item contributors.

### Filters

Filters являются частью `resolve`, а не частью отдельного resolver-а.

Нужно покрыть текущие виды:

- `styleItemType`;
- `directMember`;
- `hasType`;
- `stringIndexedAttribute`;
- ограничения `roots`, `objectRoots`, `memberKinds`, `valueKinds`, `allowedObjectPaths`, `allowedMemberPaths`, `allowOwner`.

Если filter требует details, entry обязана хранить эти details. Если details нет, это ошибка индекса, а не fallback.

### Full Validation Flow

```text
discover files
  -> first pass over all files
  -> build ProjectReferenceIndexSnapshot
  -> validate all pendingReferences through ProjectReferenceIndex
  -> run non-reference second-pass checks
  -> diagnostics
```

Во full mode `needsDependency` не должен появляться: все файлы уже известны. Если появился, это ошибка сборки индекса.

### Partial Validation Flow

Partial validation строит index из уже загруженных файлов.

Если `resolve(reference)` видит, что для проверки нужен отсутствующий YAML-файл, он возвращает:

```ts
{ ok: false, reason: "needsDependency", dependency }
```

Очередь validation догружает файл, first pass добавляет entries в index, и проверка повторяется. Это заменяет текущий dependency path старого resolver-а.

### Worker Flow

Worker-ы получают snapshot единого индекса и свою часть `pendingReferences`.

Snapshot должен быть компактнее текущего:

- не хранить одновременно большой массив и полный lookup-object, если это дублирует данные;
- хранить lookup-представление, достаточное для structured clone;
- считать `snapshotBytes`.

`SharedArrayBuffer` не входит в этот этап. Если после удаления fallback snapshot останется главным узким местом, это будет отдельный дизайн.

## Deletion Scope

Удаляются runtime-зависимости validation от:

- `ProjectMetadataResolver`;
- `createProjectMetadataResolver`;
- `createProjectMetadataResolverFromValidationTable`;
- `projectMetadataResolverRegistry` как resolver registry;
- `validateMetadataTargetsInModel` как resolver-based validation path.

Старые тесты `projectMetadataResolver.test.ts` не удаляются без замены: их сценарии переносятся на `ProjectReferenceIndex` contract tests.

После миграции команда:

```bash
rg "ProjectMetadataResolver|projectMetadataResolverRegistry|createProjectMetadataResolver" packages/core/metadata packages/cli packages/mcp
```

не должна находить runtime-использований. Допустимы только docs или удаляемые исторические test names на время миграции внутри той же ветки.

## Error Handling

Индекс возвращает diagnostics с тем же смыслом, что текущий resolver:

- object target missing;
- member owner missing;
- member segment missing;
- value missing;
- style item type mismatch;
- type filter mismatch;
- string indexed attribute mismatch;
- ambiguous/conflicting index key.

`conflict` должен быть явной диагностикой, а не молчаливым miss.

`unsupported` должен попадать в profile counters и проваливать focused tests. В полном `/Users/nikita/git/nkdk-yaml` ожидается `unsupported=0`.

## Testing

Нужны contract tests для:

- object lookup;
- nested object lookup;
- member lookup;
- nested member lookup;
- file-backed forms/templates;
- collection members;
- predefined and enum values;
- empty refs;
- `styleItemType`;
- `directMember`;
- `hasType`;
- `stringIndexedAttribute`;
- missing object/member/value diagnostics;
- conflict diagnostics;
- partial `needsDependency`;
- full validation without resolver fallback.

Regression checks:

- `pnpm test`;
- full validation `/Users/nikita/git/nkdk-yaml`;
- profile validation with `unsupported=0`, `fallback=0`;
- `rg` check that old resolver runtime usage is gone.

## Success Criteria

- Full validation returns `summary: 0 error, 0 warning` on `/Users/nikita/git/nkdk-yaml`.
- Partial validation tests remain green and use `ProjectReferenceIndex` for dependency requests.
- `ProjectMetadataResolver` runtime code is removed.
- Profile reports no fallback path.
- Current performance does not regress beyond the latest baseline `real 41.33-45.45s`.
- If snapshot remains large, it is measured and documented, but not solved with shared memory in this step.
