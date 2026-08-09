# Fill Value DefinedType Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Раскрывать `DefinedType.<Имя>` через проектный индекс при проверке и импорте `ЗначениеЗаполнения`, а пустой `xr:DesignTimeRef` представлять точным транспортным значением `!xml DesignTimeRef`.

**Architecture:** Локальный проход выделяет компактную сериализуемую проверку только для значений, чей эффективный тип зависит от DefinedType. Проектный проход получает состав определяемых типов через существующий `OwnerMetadataCache` и вызывает общий fillValue-классификатор. XML-import откладывает только такие кандидаты до уже существующего второго прохода; исходный XML предварительно сохраняется в configuration snapshot, поэтому позднее удаление не теряет форму. Скалярный транспорт `!xml` остаётся инфраструктурой из ранее согласованного плана, а допустимость решает предметный классификатор.

**Tech Stack:** TypeScript 7, Vitest 4, project-state binary store, metadata import two-pass pipeline, configuration snapshot.

## Global Constraints

- Сначала выполнить `docs/superpowers/plans/2026-08-09-fill-value-xml-exceptions.md`; этот план использует его `transportScalar`, распаковку payload, import-маркировку и сохранение ссылок.
- Реализовать договор из `docs/superpowers/specs/2026-08-09-fill-value-defined-type-design.md`.
- Не читать соседние YAML-файлы напрямую: только `OwnerMetadataCache`, построенный validation/project state.
- Не добавлять поля в общие типы rules.ts и не помещать частные условия fillValue в orchestration/project.
- Не превращать отсутствующий, ошибочный или циклический DefinedType в допустимый тип.
- `!xml DesignTimeRef` разрешён только для `MetadataAttribute.fillValue` и `StandardAttributeDescription.fillValue`; внешняя схема подсказок его не показывает.
- Не изменять существующие XML-фикстуры и пользовательский `packages/mcp/README.md`.
- После каждого слоя выполнять `pnpm duplicates -- --base 87a5e5920`.

---

## File Structure

- `packages/core/metadata/commonObjects/fillValue/definedType.ts` — предметное рекурсивное раскрытие через переданный lookup, без зависимости от validation.
- `packages/core/metadata/commonObjects/fillValue/{effectiveType,analyzeItem,register,types}.ts` — классификация с lookup, локальный pending-кандидат и `DesignTimeRef`.
- `packages/core/metadata/ruleRuntime/property/dependentItemRegistry.ts` — компактный `DependentProjectCheckCandidate` и deferred import decision.
- `packages/core/metadata/validation/{yamlFactExtractor,projectValidationPendingChecks}.ts` — формирование и выполнение project check.
- `packages/core/metadata/projectState/{contracts/fileUpdate,fileUpdate,fileUpdateValidation}.ts` — сериализуемый union проверки.
- `packages/core/metadata/projectState/binary/{typedBuilder,typedReader,fragment}.ts` — двоичное хранение fillValue-check как JSON payload с явным kind.
- `packages/core/metadata/importFromXml/{prepareYaml,dependentItems,worker,types}.ts` — отложенная нормализация DefinedType-кандидатов.
- Узкие fillValue, project-state, import и validation тесты — договоры каждого слоя.

---

### Task 1: Рекурсивное раскрытие DefinedType в предметный эффективный тип

**Files:**
- Create: `packages/core/metadata/commonObjects/fillValue/definedType.ts`
- Create: `packages/core/metadata/commonObjects/fillValue/definedType.test.ts`
- Modify: `packages/core/metadata/commonObjects/fillValue/effectiveType.ts`
- Modify: `packages/core/metadata/commonObjects/fillValue/types.ts`

**Interfaces:**
- Produces: `DefinedTypeLookup = (name: string) => { status: "ok"; type?: TypeDescriptionView } | { status: "unresolved"; reason: string }`.
- Produces: `effectiveFillValueType(type, lookup?)`, сохраняющий прежнее поведение прямых типов и рекурсивно раскрывающий `DefinedType.*`.
- Produces: предметные причины `не найден определяемый тип <имя>`, `у определяемого типа <имя> не задан Тип`, `цикл определяемых типов: ...`.

- [ ] **Step 1: Написать падающие тесты раскрытия**

В новом `definedType.test.ts` проверить таблицей:

- `DefinedType.Организация -> CatalogRef.Организации` даёт одну ссылочную альтернативу;
- DefinedType из трёх справочников даёт три альтернативы и `composite: true`;
- сочетание прямого `string` и DefinedType сохраняет обе ветви;
- вложенная цепочка `А -> Б -> CatalogRef.Товары` раскрывается;
- повторное имя в разных ветвях не создаёт дубликаты альтернатив;
- цикл `А -> Б -> А`, отсутствующий owner и пустой `type` возвращают `unresolved` с именем объекта.

Lookup реализовать тестовой `Map`, не подключая validation.

- [ ] **Step 2: Подтвердить красный результат**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/fillValue/definedType.test.ts metadata/commonObjects/fillValue/effectiveType.test.ts --no-isolate
```

Expected: FAIL — lookup и рекурсивный resolver отсутствуют.

- [ ] **Step 3: Выделить преобразование одной альтернативы**

Экспортировать из `effectiveType.ts` только предметную операцию верхнего уровня. Внутренний `alternativeFromType(...)` оставить закрытым либо перенести в `definedType.ts`; публичный договор должен принимать `TypeDescriptionView`, потому что именно такую компактную форму хранит owner cache.

Алгоритм:

```ts
resolve(type, stack):
  for sourceType of type.type:
    if sourceType is DefinedType.<name>:
      reject when name in stack
      lookup(name), require non-empty owner type, recurse with stack + name
    else:
      convert sourceType with qualifiers of current type
  dedupe structurally equal alternatives
  composite = alternatives.length > 1
```

Не сливать qualifiers разных TypeDescription в один общий объект: каждая раскрытая ветвь преобразуется с qualifiers того объекта, в котором она объявлена.

- [ ] **Step 4: Получить зелёный слой и создать коммит**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/fillValue/definedType.test.ts metadata/commonObjects/fillValue/effectiveType.test.ts metadata/commonObjects/fillValue/classify.test.ts --no-isolate
pnpm type-check
pnpm duplicates -- --base 87a5e5920
git diff --check
git add packages/core/metadata/commonObjects/fillValue/definedType.ts packages/core/metadata/commonObjects/fillValue/definedType.test.ts packages/core/metadata/commonObjects/fillValue/effectiveType.ts packages/core/metadata/commonObjects/fillValue/types.ts
git commit -m "feat: :sparkles: раскрыть DefinedType значения заполнения"
```

---

### Task 2: Сериализуемая проектная проверка fillValue

**Files:**
- Modify: `packages/core/metadata/ruleRuntime/property/dependentItemRegistry.ts`
- Modify: `packages/core/metadata/commonObjects/fillValue/analyzeItem.ts`
- Modify: `packages/core/metadata/commonObjects/fillValue/register.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts`
- Modify: `packages/core/metadata/validation/projectValidationPendingChecks.ts`
- Modify: `packages/core/metadata/validation/projectValidationPendingChecks.test.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.fillValue.test.ts`

**Interfaces:**
- Extends: `DependentYamlItemAnalysis` полем `projectChecks: readonly DependentProjectCheckCandidate[]`.
- Produces: candidate `{ kind: "fillValue"; yamlPath; type; value; tagged; itemType }`, содержащий только plain data.
- Extends: `ValidationPendingCheck` вариантом `kind: "fillValue"` с location и тем же payload.

- [ ] **Step 1: Написать падающий тест извлечения проверки**

В `yamlFactExtractor.fillValue.test.ts` создать реквизит:

```yaml
Тип: ОпределяемыйТип.АвторДействия
ЗначениеЗаполнения: Справочник.Пользователи.ПустаяСсылка
```

Ожидать:

- локального предупреждения `DefinedType ... не поддержан` нет;
- `facts.pendingChecks` содержит один `kind: "fillValue"` с точным YAML-путём;
- check не содержит `parsed`, функций, корневого YAML или `MetadataItemRule`.

Прямой тип должен по-прежнему проверяться локально и не создавать pending check.

- [ ] **Step 2: Написать падающие тесты проектного выполнения**

В `projectValidationPendingChecks.test.ts` использовать `OwnerMetadataCache` с `ОпределяемыйТип.АвторДействия` и проверить:

- допустимая ссылка даёт ноль diagnostics;
- несовместимая обычная ссылка даёт ошибку;
- та же несовместимая ссылка с `tagged: true` проходит по договору XML-exception;
- `!xml DesignTimeRef` проходит, если раскрытый тип содержит ссылку;
- `!xml DesignTimeRef` у DefinedType только из `string` даёт ошибку;
- not-found/import-error/empty type/cycle дают одну cross-file или предметную диагностику и не скрываются тегом.

- [ ] **Step 3: Подтвердить красный результат**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/yamlFactExtractor.fillValue.test.ts metadata/validation/projectValidationPendingChecks.test.ts --no-isolate
```

- [ ] **Step 4: Добавить предметный candidate без зависимости от validation**

В `dependentItemRegistry.ts` определить plain-data union отдельно от validation. Все функции `emptyAnalysis()` и существующие handlers должны возвращать `projectChecks: []`.

В `analyzeMetadataAttributeFillValue(...)`:

1. разобрать обычный или tagged payload инфраструктурой XML-exception;
2. импортировать `Тип` в `TypeDescriptionView`;
3. если тип не содержит `DefinedType.*`, выполнить прежнюю локальную классификацию;
4. иначе вернуть pending candidate и локально собрать только ссылочную зависимость через `withValueReference(...)`.

Для `StandardAttributeDescription` pending check не создавать: его эффективный тип не задаётся DefinedType.

- [ ] **Step 5: Выполнить candidate через OwnerMetadataCache**

В `yamlFactExtractor.ts` преобразовать candidates в `ValidationPendingCheck`, добавив `yamlDiagnosticLocationAtPath(...)`.

В `projectValidationPendingChecks.ts` добавить ветку `fillValue`:

- lookup вызывает `ownerCache.get({ kind: "ОпределяемыйТип", name })`;
- `status: ok` читает `owner.facts.type`;
- остальные статусы переносят diagnostics к location текущего значения без чтения файлов;
- после раскрытия вызывается тот же `classifyFillValue(...)` и та же политика tagged XML-exception, что в локальном анализе.

Вынести преобразование `FillValueClassification -> Diagnostic[]` в предметный helper, чтобы локальная и проектная ветви не разошлись по severity и текстам.

- [ ] **Step 6: Получить зелёный validation-слой**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/yamlFactExtractor.fillValue.test.ts metadata/validation/projectValidationPendingChecks.test.ts metadata/validation/projectValidationPasses.test.ts --no-isolate
pnpm type-check
pnpm duplicates -- --base 87a5e5920
```

Expected: PASS; проектная проверка содержит только сериализуемые данные.

---

### Task 3: Хранение fillValue-check в project state

**Files:**
- Modify: `packages/core/metadata/projectState/contracts/fileUpdate.ts`
- Modify: `packages/core/metadata/projectState/fileUpdate.ts`
- Modify: `packages/core/metadata/projectState/fileUpdateValidation.ts`
- Modify: `packages/core/metadata/projectState/binary/typedBuilder.ts`
- Modify: `packages/core/metadata/projectState/binary/typedReader.ts`
- Modify: `packages/core/metadata/projectState/binary/fragment.ts`
- Modify: `packages/core/metadata/projectState/fileUpdate.test.ts`
- Modify: `packages/core/metadata/projectState/binary/{fragment,readSession}.test.ts`
- Modify: `packages/core/metadata/validation/projectStateDependencyValidation.test.ts`

**Interfaces:**
- Extends: `ProjectStatePendingDependencyCheck` discriminated union с `kind: "fillValue"`.
- Stores: fillValue payload как канонический JSON в отдельном string-id поле строки pendingChecks; существующая форма dataPath остаётся обратимо читаемой.

- [ ] **Step 1: Написать падающий round-trip project-state тест**

Добавить один `fillValue` check с составным TypeDescription, `MetadataTypedValue` ref и `tagged: true` в `binary/testData.ts`. Проверить в `fragment.test.ts` и `readSession.test.ts`, что после записи/чтения объект равен исходному побайтно по JSON-представлению и не получает поля dataPath.

В `fileUpdate.test.ts` добавить отрицательные случаи: неизвестный kind, нестроковый JSON payload, повреждённый JSON и несовместимая форма value должны отклоняться до записи.

- [ ] **Step 2: Расширить контракт и таблицу без частных колонок модели**

В `contracts/fileUpdate.ts` добавить union. В binary pendingChecks добавить колонки `kindId` и `payloadId`; для dataPath payload может остаться в текущих колонках, а для fillValue хранится версия:

```ts
{ version: 1, itemType, type, value, tagged }
```

`typedReader` обязан валидировать `version === 1` и форму payload, а не делать слепое `as`. `fileUpdateValidation.ts` проверяет те же границы до двоичной записи.

- [ ] **Step 3: Выполнить двоичные и dependency тесты**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/projectState/fileUpdate.test.ts metadata/projectState/binary/fragment.test.ts metadata/projectState/binary/readSession.test.ts metadata/validation/projectStateDependencyValidation.test.ts --no-isolate
pnpm type-check
pnpm test:architecture
pnpm duplicates -- --base 87a5e5920
git diff --check
```

- [ ] **Step 4: Создать коммит проектной проверки**

```bash
git add packages/core/metadata/ruleRuntime/property/dependentItemRegistry.ts packages/core/metadata/commonObjects/fillValue/analyzeItem.ts packages/core/metadata/commonObjects/fillValue/register.ts packages/core/metadata/validation/yamlFactExtractor.ts packages/core/metadata/validation/projectValidationPendingChecks.ts packages/core/metadata/validation/projectValidationPendingChecks.test.ts packages/core/metadata/validation/yamlFactExtractor.fillValue.test.ts packages/core/metadata/projectState/contracts/fileUpdate.ts packages/core/metadata/projectState/fileUpdate.ts packages/core/metadata/projectState/fileUpdateValidation.ts packages/core/metadata/projectState/binary/typedBuilder.ts packages/core/metadata/projectState/binary/typedReader.ts packages/core/metadata/projectState/binary/fragment.ts packages/core/metadata/projectState/fileUpdate.test.ts packages/core/metadata/projectState/binary/fragment.test.ts packages/core/metadata/projectState/binary/readSession.test.ts packages/core/metadata/validation/projectStateDependencyValidation.test.ts
git commit -m "feat: :sparkles: проверять DefinedType значения заполнения"
```

---

### Task 4: Отложенная нормализация XML-import

**Files:**
- Modify: `packages/core/metadata/ruleRuntime/property/dependentItemRegistry.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/importYamlTypes.ts`
- Modify: `packages/core/metadata/importFromXml/prepareYaml.ts`
- Modify: `packages/core/metadata/importFromXml/dependentItems.ts`
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/importFromXml/dependentItems.test.ts`
- Modify: `packages/core/metadata/importFromXml/worker.test.ts`
- Modify: `packages/core/metadata/importFromXml/fillValueImport.test.ts`

**Interfaces:**
- Produces: `shouldDefer(params)` у dependent import-handler только для MetadataAttribute с DefinedType.
- Extends: `PreparedImportYaml`/worker-local `DeferredImportYaml` массивом deferred dependent candidates.
- Produces: `normalizeImportedDependentItems(..., { definedTypeLookup?, preserveRawXML })` с одним решением классификатора после lookup.

- [ ] **Step 1: Написать падающие тесты трёх исходов**

В `dependentItems.test.ts` и `fillValueImport.test.ts` проверить DefinedType:

- одиночная соответствующая пустая ссылка удаляется, а raw XML уже находится в snapshot;
- несовместимая ссылка остаётся как `!xml <payload>` без удаления;
- допустимое содержательное значение остаётся обычным YAML;
- неразрешимый DefinedType остаётся обычным YAML и создаёт предупреждение, а не автоматически получает тег.

Отдельно проверить, что предварительно сохранённый raw XML не переопределяет явно tagged YAML при последующем YAML -> XML.

- [ ] **Step 2: Не выпускать deferred-кандидат досрочно**

В `prepareImportYaml.ts` разделить candidates:

- локально разрешимые по-прежнему нормализовать сразу;
- DefinedType candidates вернуть в `PreparedImportYaml.dependentDeferred`;
- до `collector.fragment(...)` вызвать отдельный `preserveDeferredDependentRawXML(...)` для каждого кандидата с `logicalAddress`, чтобы позднее удаление уже имело точный snapshot.

Это сохранение является предварительным: если YAML останется явным или tagged, штатный YAML -> XML имеет приоритет над raw snapshot.

В `worker.ts` считать файл отложенным, когда `prepared.deferred.length > 0 || prepared.dependentDeferred.length > 0`; не записывать такой YAML в первом проходе.

- [ ] **Step 3: Нормализовать после построения OwnerMetadataCache**

В `writePreparedYamlToOutput(...)` после `finalizeImportedYamlValues(...)`, но до сериализации:

1. построить lookup поверх переданного `ownerMetadataCache`;
2. вызвать normalization только для `dependentDeferred`;
3. запретить повторную запись snapshot (`preserveRawXML: false`);
4. затем сериализовать и выполнить существующую serialized validation.

Lookup расширения использует действующий layered owner cache. Не добавлять отдельного поиска в `cf`: пустой локальный заимствованный DefinedType разрешается тем же fallback, что уже даёт cache.

- [ ] **Step 4: Проверить worker-протокол**

В `worker.test.ts` создать пакет, где сам DefinedType и использующий его объект попадают в разные задания первого прохода. Проверить, что YAML пользователя пишется только во втором проходе и решение не зависит от порядка/worker partition.

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/dependentItems.test.ts metadata/importFromXml/fillValueImport.test.ts metadata/importFromXml/worker.test.ts --no-isolate
pnpm type-check
pnpm test:architecture
pnpm duplicates -- --base 87a5e5920
git diff --check
```

- [ ] **Step 5: Создать коммит import-слоя**

```bash
git add packages/core/metadata/ruleRuntime/property/dependentItemRegistry.ts packages/core/metadata/ruleRuntime/property/importYamlTypes.ts packages/core/metadata/importFromXml/prepareYaml.ts packages/core/metadata/importFromXml/dependentItems.ts packages/core/metadata/importFromXml/worker.ts packages/core/metadata/importFromXml/dependentItems.test.ts packages/core/metadata/importFromXml/worker.test.ts packages/core/metadata/importFromXml/fillValueImport.test.ts
git commit -m "feat: :sparkles: уточнять DefinedType при XML-import"
```

---

### Task 5: Точный транспорт `!xml DesignTimeRef`

**Files:**
- Modify: `packages/core/metadata/commonObjects/fillValue/{analyzeItem,register}.ts`
- Modify: `packages/core/metadata/importFromXml/dependentItems.ts`
- Modify: `packages/core/metadata/importFromXml/dependentItems.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.fillValue.test.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts`

**Interfaces:**
- Produces: exact sentinel payload `DesignTimeRef` -> `{ type: "ref", value: "" }` only inside fillValue transport.
- Produces: exact XML matcher `{ "_xsi:type": "xr:DesignTimeRef" }` -> `!xml DesignTimeRef`.

- [ ] **Step 1: Написать падающую таблицу точных форм**

Проверить import и YAML -> XML:

- пустой `xr:DesignTimeRef` -> `!xml DesignTimeRef` -> пустой `xr:DesignTimeRef`;
- `xsi:nil`, обычная строка `DesignTimeRef`, пустой `!xml` и `!xml xr:DesignTimeRef` не совпадают с sentinel;
- для exact sentinel snapshot не создаётся;
- для ссылочного эффективного типа validation проходит, для чисто строкового — даёт ошибку;
- sentinel не создаёт pending reference.

- [ ] **Step 2: Реализовать точный предметный sentinel**

До общего разбора tagged payload в `analyzeItem.ts` распознавать только точную строку `DesignTimeRef` и передавать классификатору `{ type: "ref", value: "" }` с отдельным признаком транспорта. В политике тега разрешать её:

- при известном эффективном типе с хотя бы одной reference-альтернативой;
- при `ownerReference` с пустыми владельцами — только после выполнения следующего плана;
- не разрешать при unresolved DefinedType.

В import-handler проверять точную XML-структуру кандидата, ставить tagged scalar и не сохранять raw XML. В YAML -> XML transport action должен вернуть точный объект `{ "_xsi:type": "xr:DesignTimeRef" }`, а не пустой payload штатного MetadataValue.

Если существующий `transportScalar` допускает только передачу payload штатному преобразователю, расширить explicit XML registry отдельным точным scalar override для пары `itemType + propertyKey + payload`, не добавляя поля в rules.ts.

- [ ] **Step 3: Проверить схему**

Внутренняя validation schema принимает зарегистрированный scalar, но предметная проверка отклоняет неправильную форму/тип. Внешняя schema не содержит `!xml` и `DesignTimeRef`.

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/dependentItems.test.ts metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts metadata/validation/yamlFactExtractor.fillValue.test.ts metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts --no-isolate
pnpm type-check
pnpm duplicates -- --base 87a5e5920
git diff --check
```

- [ ] **Step 4: Создать коммит**

```bash
git add packages/core/metadata/commonObjects/fillValue/analyzeItem.ts packages/core/metadata/commonObjects/fillValue/register.ts packages/core/metadata/importFromXml/dependentItems.ts packages/core/metadata/importFromXml/dependentItems.test.ts packages/core/metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts packages/core/metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts packages/core/metadata/validation/yamlFactExtractor.fillValue.test.ts packages/core/metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts
git commit -m "feat: :sparkles: сохранить пустой DesignTimeRef явно"
```

---

### Task 6: Полная проверка и контрольный импорт SED

- [ ] **Step 1: Выполнить обязательные проверки**

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 87a5e5920
git diff --check
```

- [ ] **Step 2: Повторить чистый импорт SED**

Удалить только ранее согласованные `/Users/nikita/git/sed_nkdk/cf` и `/Users/nikita/git/sed_nkdk/cfe`, затем импортировать `/Users/nikita/git/sed_xml/cf` и расширения `/Users/nikita/git/sed_xml/cfe`.

- [ ] **Step 3: Проверить 19 случаев DefinedType**

Ожидать:

- 5 `ЗначениеЗаполнения: !xml DesignTimeRef`;
- 12 `ЗначениеЗаполнения: !xml Справочник.Пользователи.ПустаяСсылка`;
- 2 неявные типизированные пустые ссылки отсутствуют в YAML и имеют snapshot;
- ноль предупреждений `проверка значения для типа DefinedType.<Имя> не поддержана`;
- tagged ссылки участвуют в dependency validation и переименовании;
- generated-проект SED не добавлен в git-индекс NKDK.
