# Validation Binary Shared Snapshot Design

> Historical note: this design compared JSON and binary owner snapshots. The current target design is `2026-07-02-validation-unified-shared-snapshot-design.md`: JSON owner snapshot and format-selection flags are removed.

## Цель

Заменить JSON inside `SharedArrayBuffer` для owner/field данных на компактный бинарный read-only snapshot.

Текущий опытный вариант корректен, но не ускоряет `secondPassWall`: owner snapshot весит `129265248` байт, а выигрыш от отсутствия `objectTable` supplement съедается созданием JSON и `JSON.parse` в worker-ах.

## Границы

В shared snapshot переносим факты проекта, которые нужны чужим worker-ам во `second pass`:

- references: объекты, поля, значения;
- owners: владельцы metadata-объектов;
- fields: реквизиты, стандартные реквизиты, табличные части, колонки, типы;
- files: наличие файлов;
- import diagnostics: минимальные ошибки first pass, нужные для owner cache.

Не переносим:

- parsed YAML;
- полный imported `model`;
- `ProjectValidationFileState`;
- локальные состояния форм и файлов worker-а.

Эти данные создаются и используются локально в worker-е, который получил файл на first pass.

## Формат

`SharedProjectValidationSnapshot` состоит из секций:

- `strings`: единый UTF-8 string pool;
- `references`: существующий shared reference index;
- `owners`: отсортированная таблица владельцев;
- `fields`: таблица полей владельцев;
- `tableSources`: диапазоны колонок табличных частей;
- `files`: отсортированная таблица путей;
- `diagnostics`: компактные записи импорт-ошибок.

Все таблицы используют числовые id и offsets в `Int32Array` / `Uint32Array`. Строки не дублируются: `kind`, `name`, `filePath`, `fieldName`, `sourceText` хранятся как `stringId`.

## Owner Table

Минимальная запись owner:

```ts
ownerKindId
ownerNameId
filePathId
fieldStart
fieldCount
aliasStart
aliasCount
diagnosticStart
diagnosticCount
status
```

Lookup выполняется бинарным поиском по `(ownerKindId, ownerNameId)`.

## Field Table

Минимальная запись field:

```ts
ownerId
nameId
targetNameId
kindId
typeFlags
sourceTextId
tableSourceId
columnStart
columnCount
```

`typeFlags` покрывает частые типы: `unknown`, `boolean`, `string`, `decimal`, `dateTime`, `uuid`, `defined`, `tableSource`, `styleItem`. Если тип требует строкового источника, используется `sourceTextId`.

Для табличных частей `tableSourceId` указывает на запись `tableSources`, а колонки лежат в том же `fields` диапазоном `columnStart..columnCount`.

## API Worker-а

Worker не декодирует весь snapshot в JS-объекты. Он создаёт лёгкий view поверх shared buffers:

```ts
snapshot.references.resolve(target)
snapshot.owners.get({ kind, name })
snapshot.fields.get(ownerId, fieldName)
snapshot.files.has(filePath)
snapshot.diagnostics.forOwner(ownerId)
```

Возврат к существующим договорам делается лениво на границе `OwnerMetadataCache`: если `resolveDataPath` запросил владельца, cache собирает только нужный `ObjectFieldIndex`, а не весь проект.

## Совместимость

Опытный JSON-backed путь остаётся только как диагностический fallback под флагом. По умолчанию остаётся текущий стабильный legacy owner supplement до тех пор, пока бинарный snapshot не покажет ускорение на `/Users/nikita/git/nkdk-yaml`.

Флаги на время внедрения:

- `NKDK_VALIDATION_SHARED_SECOND_PASS=1`: включить shared second pass;
- `NKDK_VALIDATION_SHARED_OWNER_FORMAT=json|binary`: выбрать формат owner snapshot для сравнения.

## Проверка

Минимальные проверки:

- unit-тесты binary owner lookup против `createOwnerMetadataCacheFromValidationTable`;
- regression-тесты `resolveDataPath` для реквизитов, табличных частей, колонок и стандартных реквизитов;
- full validation `/Users/nikita/git/nkdk-yaml` с `0 error, 0 warning`;
- профиль против JSON-backed и legacy paths:
  - `sharedOwnerBytes`;
  - `snapshot`;
  - `workerWall`;
  - `context`;
  - `secondPassWall`;
  - `real/user/sys`.

## Критерий успеха

Бинарный owner/field/file snapshot считается успешным, если:

- сохраняет `0 error, 0 warning` на `/Users/nikita/git/nkdk-yaml`;
- уменьшает `sharedOwnerBytes` заметно относительно `129265248`;
- снижает `secondPassWall` относительно legacy owner supplement и JSON-backed shared owner path;
- не требует хранить полный parsed YAML или imported model другого worker-а.
