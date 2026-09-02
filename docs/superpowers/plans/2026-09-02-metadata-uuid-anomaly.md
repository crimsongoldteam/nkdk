# `!xml/uuid` для UUID-ссылок на метаданные — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сохранять одиночные UUID и `UUID.UUID` в metadata-ссылках как
`!xml/uuid`, не разрешая их через индекс и не теряя исходный XML.

**Architecture:** Общий runtime `metadataTargetOccurrences` классифицирует UUID
до разбора смысловой ссылки. XML → YAML возвращает значение и точные UUID-
occurrence, после присоединения свойства записывает для них аннотации; YAML →
XML принимает UUID только с точной аннотацией. Прежняя таблица UUID → смысловой
путь и восстановление UUID из configuration index удаляются целиком.

**Tech Stack:** TypeScript, Vitest, js-yaml, pnpm, MCP round-trip runner.

**Spec:** `docs/superpowers/specs/2026-09-02-metadata-uuid-anomaly-design.md`

**Comparison base:** `627af0ebeccf8eedf91b8b606bbf72e16e9c33b4`
(`origin/develop` на момент создания worktree).

## Global Constraints

- Первый XML-проход только формирует индексы и факты; он не назначает и не
  проверяет `!xml/uuid`.
- UUID и `UUID.UUID` в metadata-ссылках считаются аномалией независимо от того,
  присутствуют ли их части в индексе.
- Обычные смысловые ссылки продолжают проходить через
  `metadataTargetLookup`/resolver и проверяться на существование.
- Собственные `uuid`/`_uuid` metadata-объектов и UUID в обычных строковых
  свойствах не классифицируются как metadata-ссылки.
- `!xml/uuid` разрешён только скаляру metadata-ссылки: значению, элементу списка
  или YAML-ключу; исходный регистр и текст сохраняются дословно.
- Новые поля в `PropertyRule`, `BasePropertyRule` и построители правил не
  добавляются; новые частные fromXML/toXML/fromYAML/toYAML правила не создаются.
- Существующие XML-фикстуры не изменяются.

---

### Task 1: Добавить строгую YAML-аннотацию `!xml/uuid`

**Files:**
- Modify: `packages/runtime/yaml/scalarTags.ts`
- Modify: `packages/runtime/yaml/xmlAnomalyAnnotations.ts`
- Modify: `packages/runtime/yaml/jsYamlParser.ts`
- Modify: `packages/runtime/yaml/xmlAnomalyAnnotations.test.ts`
- Modify: `packages/runtime/yaml/jsYamlParser.test.ts`
- Modify: `packages/runtime/yaml/export.test.ts`

**Interfaces:**
- Produces: `XmlAnomalyKind = "raw" | "invalid" | "important" | "uuid"`.
- Produces: парсер и сериализатор одной ненумерованной скалярной аннотации
  `!xml/uuid` на значении, элементе последовательности или ключе.
- Consumes: существующую out-of-band таблицу `XmlAnomalyAnnotations`; отдельный
  wrapper-тип для UUID не создаётся.

- [ ] **Step 1: Написать падающие тесты парсинга и сериализации**

  Добавить случаи, которые проверяют точный текст и расположение аннотации:

  ```ts
  const uuid = "A786340B-1CA9-48EE-8517-6BD389390BCC"
  const parsed = parseMetadataYaml([
    `Значение: !xml/uuid ${uuid}`,
    `Список:`,
    `  - !xml/uuid ${uuid}.00000000-0000-0000-0000-000000000000`,
    `Ключи:`,
    `  !xml/uuid ${uuid}: Истина`,
  ].join("\n"))
  expect(parsed.syntaxErrors).toEqual([])
  expect(parsed.annotations.at(parsed.data as object, "Значение")?.kind).toBe("uuid")
  expect(serializeYAMLDocument(parsed.data, parsed.annotations).text).toContain(
    `Значение: !xml/uuid ${uuid}`,
  )
  ```

  Добавить отказы для `!xml/uuid {}`, `!xml/uuid []`, корневой карты,
  `!xml/uuid/2` и сочетания с нумерацией повторных ключей. Ожидаемая причина:
  `!xml/uuid поддерживает только скаляр` либо
  `Тег !xml/uuid не поддерживает номер occurrence`.

- [ ] **Step 2: Запустить тесты и подтвердить падение**

  Run:
  `pnpm --filter @nkdk/runtime exec vitest run --project unit yaml/jsYamlParser.test.ts yaml/xmlAnomalyAnnotations.test.ts yaml/export.test.ts`

  Expected: FAIL — `!xml/uuid` ещё отсутствует в схеме или распознаётся как
  неизвестный тег.

- [ ] **Step 3: Реализовать скалярный договор тега**

  Расширить `XML_ANNOTATION_TAGS` и `XmlAnomalyKind`, но для `uuid` создать
  только `defineScalarTag`. В `xmlAnomalyTag` принять точное имя `!xml/uuid`
  без суффикса `/N`; в `collectValueAnnotation` и обработке ключей явно
  отклонять mapping/sequence. Сериализация использует существующий
  `applyXmlAnomalyTag`, поэтому текст значения не нормализуется.

  Целевая развилка регистрации:

  ```ts
  const xmlAnnotationTags = XML_ANNOTATION_TAGS.flatMap((tag) =>
    tag === "uuid"
      ? [defineScalarTag("!xml/uuid", {
          resolve: parseYAMLScalarPayload,
          identify: () => false,
        })]
      : semanticAndRawAnnotationTags(tag)
  )
  ```

- [ ] **Step 4: Запустить тесты runtime**

  Run:
  `pnpm --filter @nkdk/runtime exec vitest run --project unit yaml/jsYamlParser.test.ts yaml/xmlAnomalyAnnotations.test.ts yaml/export.test.ts`

  Expected: PASS.

- [ ] **Step 5: Проверить дубли завершённого слоя**

  Run: `pnpm duplicates -- --base 627af0ebeccf8eedf91b8b606bbf72e16e9c33b4`

  Expected: PASS, новых дублей нет.

- [ ] **Step 6: Зафиксировать слой**

  ```bash
  git add packages/runtime/yaml
  git commit -m "feat: :sparkles: добавить YAML-тег UUID-ссылок"
  ```

### Task 2: Классифицировать UUID в общем runtime metadata-ссылок

**Files:**
- Modify: `packages/runtime/metadata/helpers/mdObjectRefUuid.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/metadataTargetOccurrences.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/toYAML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromXMLToYAML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts`
- Modify: `packages/runtime/metadata/projectDefinition/localIndexes.ts`
- Create: `packages/runtime/metadata/ruleRuntime/property/metadataTargetOccurrences.test.ts`
- Modify: `packages/rules/metadata/ruleRuntime/property/toYAML.test.ts`
- Modify: `packages/rules/metadata/ruleRuntime/property/fromYAMLToXML.test.ts`

**Interfaces:**
- Produces: `isMetadataTargetUuid(value: string): boolean`, принимающий ровно
  `UUID` или `UUID.UUID` по схеме `8-4-4-4-12`, без ограничения версии UUID и
  без изменения регистра.
- Produces:
  `projectMetadataTargetOccurrencesToYAML(params): { value: unknown;
  uuidOccurrences: readonly MetadataTargetOccurrence[] }`.
- Produces:
  `assignMetadataTargetUuidAnnotations({ yaml, annotations, occurrences }): void`.
- Preserves: `exportMetadataTargetOccurrencesToYAML(params): unknown` как
  совместимую обёртку над `.value` для существующих вызывающих мест.

- [ ] **Step 1: Написать падающие модульные тесты классификатора**

  Проверить одиночный UUID, составной UUID, верхний регистр, нулевой UUID и
  отказ для трёх UUID, фигурных скобок и смыслового пути:

  ```ts
  expect(isMetadataTargetUuid("00000000-0000-0000-0000-000000000000")).toBe(true)
  expect(isMetadataTargetUuid(`${typeId}.${valueId}`)).toBe(true)
  expect(isMetadataTargetUuid("Справочник.Товары")).toBe(false)
  ```

  Для проекции проверить, что formatter не вызывается для UUID, значение не
  меняется, а `uuidOccurrences` содержит исходную `location`. Для импорта
  проверить четыре договора: UUID с `uuid` принимается; UUID без тега
  отклоняется; смысловой путь с `uuid` отклоняется; смысловой путь без тега
  проходит прежний parser.

- [ ] **Step 2: Запустить тесты и подтвердить падение**

  Run:
  `pnpm --filter @nkdk/runtime exec vitest run --project unit metadata/ruleRuntime/property/metadataTargetOccurrences.test.ts`

  Expected: FAIL — классификатор, результат проекции и договор аннотации ещё не
  реализованы.

- [ ] **Step 3: Реализовать классификацию до разбора смыслового пути**

  В `projectMetadataTargetOccurrencesToYAML` первой проверкой отделять UUID:

  ```ts
  if (isMetadataTargetUuid(occurrence.representation.canonical)) {
    uuidOccurrences.push(occurrence)
    continue
  }
  ```

  Остальные значения форматировать прежним способом. В
  `importMetadataTargetOccurrencesFromYAML` сначала сопоставлять точную
  аннотацию occurrence и UUID-текст, затем запускать
  `parseMetadataTargetFromYAML` только для смысловых ссылок. Удалить
  `allowUnresolvedUuid`, `isXmlImportControlExportContext` и разрешение UUID
  через `!xml/invalid`.

  Сообщения ошибок закрепить тестами:

  ```text
  UUID metadata-ссылки требует !xml/uuid
  !xml/uuid допустим только для UUID или UUID.UUID metadata-ссылки
  ```

- [ ] **Step 4: Назначать аннотацию после присоединения свойства к YAML**

  `exportPropertyMetadataTargetsToYAML` получить вариант, возвращающий
  проекцию. В `fromXMLToYAML.ts` собирать `uuidOccurrences`, сначала выполнять
  `Object.assign(result, exportedValues)`, затем для второго прохода, когда
  `params.annotations` и `result` определены, вызывать:

  ```ts
  assignMetadataTargetUuidAnnotations({
    yaml: result,
    annotations: params.annotations,
    occurrences: uuidOccurrences,
  })
  ```

  Для `location.kind === "value"` ставить `{ kind: "uuid", occurrence: 1,
  target: "value" }`; для `location.kind === "key"` использовать `setKey` и
  сохранять `logicalKey`. В режиме `facts` без таблицы аннотаций ничего не
  назначать.

- [ ] **Step 5: Исключить UUID из индекса зависимостей**

  В `appendMetadataTargetFact` не добавлять значения, для которых
  `isMetadataTargetUuid(value) === true`. Это применяется и к UUID без тега:
  он будет диагностирован, но не станет зависимостью и не обратится к resolver.
  Смысловые значения продолжают добавляться без изменений.

- [ ] **Step 6: Запустить проверки обоих направлений**

  Run:
  `pnpm --filter @nkdk/runtime exec vitest run --project unit metadata/ruleRuntime/property/metadataTargetOccurrences.test.ts`

  Run:
  `pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/ruleRuntime/property/toYAML.test.ts metadata/ruleRuntime/property/fromYAMLToXML.test.ts`

  Expected: PASS; счётчик-шпион resolver равен нулю для UUID и единице для
  обычной смысловой ссылки.

- [ ] **Step 7: Проверить дубли завершённого слоя**

  Run: `pnpm duplicates -- --base 627af0ebeccf8eedf91b8b606bbf72e16e9c33b4`

  Expected: PASS.

- [ ] **Step 8: Зафиксировать слой**

  ```bash
  git add packages/runtime packages/rules/metadata/ruleRuntime/property
  git commit -m "feat: :sparkles: классифицировать UUID metadata-ссылок"
  ```

### Task 3: Проверять область применения `!xml/uuid`

**Files:**
- Modify: `packages/rules/metadata/validation/yamlFactExtractor.ts`
- Modify: `packages/rules/metadata/validation/projectValidationPasses.integration.test.ts`

**Interfaces:**
- Produces: проектная диагностика для UUID без тега и для `!xml/uuid`, который
  не совпадает с occurrence metadata-ссылки либо имеет неправильный текст.
- Preserves: `!xml/invalid` и `!xml/important` участвуют только в прежнем
  механизме принятия смысловых ошибок; `uuid` не подавляет эти ошибки.

- [ ] **Step 1: Написать падающие проверки договора**

  В интеграционном тесте проекта покрыть:

  ```yaml
  # ошибка: metadata-ссылка без тега
  ФункциональныеОпции:
    - a786340b-1ca9-48ee-8517-6bd389390bcc

  # ошибка: тег на обычном строковом свойстве
  Комментарий: !xml/uuid a786340b-1ca9-48ee-8517-6bd389390bcc

  # ошибка: тег на смысловой ссылке
  ФункциональныеОпции:
    - !xml/uuid ФункциональнаяОпция.Склад

  # допустимо и не образует pending reference
  ФункциональныеОпции:
    - !xml/uuid a786340b-1ca9-48ee-8517-6bd389390bcc
  ```

  Отдельно проверить UUID-ключ `UserVisible` и `UUID.UUID` внутри
  `MetadataValue`.

- [ ] **Step 2: Запустить тесты и подтвердить падение**

  Run:
  `pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration metadata/validation/projectValidationPasses.integration.test.ts`

  Expected: FAIL — проектная валидация пока не сопоставляет `uuid`-аннотации с
  occurrence правил.

- [ ] **Step 3: Добавить единый аудит UUID-аннотаций в обход правил**

  Во время `collectPendingReferences` для каждого свойства получить
  `metadataTargetOccurrences` по его типу, значению, владельцу и YAML-пути.
  Общий helper из Task 2 должен вернуть точные разрешённые UUID-location.
  Собрать ключи расположений в `Set`, затем один раз пройти
  `parsed.annotations.entries()`:

  ```ts
  type UuidAnnotationTargetKey =
    | `value:${string}`
    | `key:${string}:${string}`
  ```

  Для `annotation.kind === "uuid"` требовать совпадение с разрешённой
  location и корректный UUID-текст. Для найденного UUID occurrence требовать
  точную `uuid`-аннотацию. Диагностики адресовать через
  `diagnosticAtYamlPath`; корректный UUID не добавлять в `pendingReferences`.
  Обычные смысловые ссылки передавать в прежний resolver без изменений.

- [ ] **Step 4: Запустить интеграционные тесты валидации**

  Run:
  `pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration metadata/validation/projectValidationPasses.integration.test.ts`

  Expected: PASS; корректный `!xml/uuid` не создаёт ни диагностику, ни
  зависимость.

- [ ] **Step 5: Проверить дубли завершённого слоя**

  Run: `pnpm duplicates -- --base 627af0ebeccf8eedf91b8b606bbf72e16e9c33b4`

  Expected: PASS.

- [ ] **Step 6: Зафиксировать слой**

  ```bash
  git add packages/runtime/metadata/validation packages/rules/metadata/validation
  git commit -m "fix: :bug: проверять договор UUID-аннотаций"
  ```

### Task 4: Удалить разрешение UUID через индекс

**Files:**
- Modify: `packages/rules/metadata/project/xmlReconstructionProfile.ts`
- Modify: `packages/rules/metadata/project/xmlReconstructionProfile.test.ts`
- Modify: `packages/runtime/metadata/context/types.ts`
- Modify: `packages/rules/metadata/importFromXml/dependentItems.ts`
- Modify: `packages/rules/metadata/importFromXml/dependentItems.test.ts`
- Modify: `packages/rules/metadata/importFromXml/prepareFacts.ts`
- Modify: `packages/rules/metadata/importFromXml/prepareYaml.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.ts`
- Modify: `packages/rules/metadata/importFromXml/controlExport.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/worker.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataValue/toXML.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataValue/toXML.integration.test.ts`

**Interfaces:**
- Removes: `XmlComponentReconstructionProfile.designTimeReferenceByUuid`.
- Removes: `ToXMLConfigurationContext.designTimeReferenceByUuid`.
- Removes: `normalizeImportedDependentItems.metadataTargetCanonicalizer`.
- Removes: `collectImportedDependentXmlValues` и
  `restoreDesignTimeReferenceUuid`.
- Preserves: `adoptedUuids`, UUID идентичности объектов, XML-default profile и
  проверку смысловых ссылок.

- [ ] **Step 1: Переписать тесты с требуемым новым результатом**

  Удалить ожидания построенной таблицы UUID → смысловая ссылка. В тесте
  `MetadataValue` закрепить прямой экспорт уже типизированного значения:

  ```ts
  const uuidReference = `${typeId}.${valueId}`
  const xmlData = exportMetadataValueToXML({
    context: mockContextToXML(),
    rule: { type: "MetadataValue" },
    value: { type: "ref", value: uuidReference },
  })
  expect(xmlExport({ Value: xmlData }, false)).toBe(
    `<Value xsi:type="xr:DesignTimeRef">${uuidReference}</Value>`,
  )
  ```

  В `dependentItems.test.ts` закрепить отсутствие замены UUID смысловым путём и
  отсутствие записи `DesignTimeRef` в configuration index.

- [ ] **Step 2: Запустить тесты до удаления и подтвердить расхождение**

  Run:
  `pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/project/xmlReconstructionProfile.test.ts metadata/importFromXml/dependentItems.test.ts`

  Run:
  `pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration metadata/commonObjects/metadataValue/toXML.integration.test.ts`

  Expected: FAIL — старые профиль и exporter продолжают строить/использовать
  UUID-таблицу.

- [ ] **Step 3: Удалить таблицу и всю передачу по контекстам**

  Упростить `frozenProfile` до трёх аргументов:

  ```ts
  function frozenProfile(
    componentKind: XmlReconstructionComponentKind,
    adoptedUuids: Record<string, string>,
    variants: Record<string, XMLDefaultVariant>,
  ): XmlComponentReconstructionProfile
  ```

  Удалить `designTimeReferenceAliases`,
  `mergeDesignTimeReferenceAliases`, `generatedReferenceType`,
  `designTimeValueCanonical` и связанные импорты. Удалить поле из runtime-
  контекста, control export и full sync worker.

- [ ] **Step 4: Удалить скрытое сохранение и восстановление UUID**

  Удалить `collectImportedDependentXmlValues` и оба вызова из первого/второго
  прохода. Удалить `metadataTargetCanonicalizer` из нормализации зависимых
  свойств и worker. В `MetadataValue/toXML.ts` передавать значение обработчику
  напрямую:

  ```ts
  return handler.toXML(value)
  ```

  Удалить `restoreDesignTimeReferenceUuid`; configuration index больше не
  хранит UUID только ради обратной подстановки.

- [ ] **Step 5: Доказать полное удаление механизма**

  Run:
  `rg -n "designTimeReferenceByUuid|metadataTargetCanonicalizer|restoreDesignTimeReferenceUuid|collectImportedDependentXmlValues" packages`

  Expected: команда не выводит совпадений и завершается с кодом 1.

- [ ] **Step 6: Запустить затронутые тесты**

  Run:
  `pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/project/xmlReconstructionProfile.test.ts metadata/importFromXml/dependentItems.test.ts`

  Run:
  `pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration metadata/commonObjects/metadataValue/toXML.integration.test.ts`

  Expected: PASS.

- [ ] **Step 7: Проверить дубли завершённого слоя**

  Run: `pnpm duplicates -- --base 627af0ebeccf8eedf91b8b606bbf72e16e9c33b4`

  Expected: PASS.

- [ ] **Step 8: Зафиксировать слой**

  ```bash
  git add packages/runtime/metadata packages/rules/metadata
  git commit -m "refactor: :recycle: удалить разрешение UUID через индекс"
  ```

### Task 5: Перевести реальные UUID-аномалии и проверить round-trip

**Files:**
- Modify: `packages/rules/metadata/importFromXml/worker.integration.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataSubsystem/fromXMLToYAMLToXML.integration.test.ts`
- Modify: `packages/rules/metadata/commonObjects/userVisible/fromYAML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/userVisible/fromYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataValue/handlers.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataValue/fromYAML.test.ts`

**Interfaces:**
- Consumes: строгий `!xml/uuid` из Tasks 1–3.
- Produces: второй XML-проход автоматически записывает `!xml/uuid` до
  контрольного экспорта; одиночные и составные UUID возвращаются в XML
  дословно.

- [ ] **Step 1: Переписать интеграционные ожидания `invalid` на `uuid`**

  Тест подсистемы должен ожидать:

  ```ts
  expect(readFileSync(join(outputDir, assignment.targetProjectPath), "utf8"))
    .toContain(`- !xml/uuid ${uuid}`)
  expect(second).toMatchObject({ kind: "secondPassResult", diagnostics: [] })
  expect(controlExportCountForTests()).toBe(1)
  ```

  Тест `UserVisible` должен принимать только
  `!xml/uuid <uuid>:` и отклонять `!xml/invalid <uuid>:` и UUID без тега.
  Для `MetadataValue` добавить реальный `UUID.UUID` и проверить модель
  `{ type: "ref", value: uuidReference }`.

- [ ] **Step 2: Запустить тесты и подтвердить оставшиеся падения**

  Run:
  `pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/commonObjects/userVisible/fromYAML.test.ts metadata/commonObjects/metadataValue/fromYAML.test.ts`

  Run:
  `pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration metadata/importFromXml/worker.integration.test.ts metadata/appliedObjects/metadataSubsystem/fromXMLToYAMLToXML.integration.test.ts`

  Expected: FAIL, если прямой или составной путь ещё допускает старую
  `!xml/invalid` семантику либо аннотация назначается после control export.

- [ ] **Step 3: Завершить интеграцию без частных правил**

  В `UserVisible/fromYAML.ts` удалить отдельную проверку control-export и
  передавать аннотации общему `importMetadataTargetOccurrencesFromYAML`.
  В `metadataValue/handlers.ts` использовать общий
  `isMetadataTargetUuid` для составного `DesignTimeRef`, не нормализуя строку.
  Исправления в конкретных `rules.ts` и новые частные преобразователи не
  добавлять.

- [ ] **Step 4: Запустить интеграционные тесты**

  Run:
  `pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/commonObjects/userVisible/fromYAML.test.ts metadata/commonObjects/metadataValue/fromYAML.test.ts`

  Run:
  `pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration metadata/importFromXml/worker.integration.test.ts metadata/appliedObjects/metadataSubsystem/fromXMLToYAMLToXML.integration.test.ts`

  Expected: PASS.

- [ ] **Step 5: Запустить полный round-trip Cashdesk свежим MCP**

  Сначала проверить чистоту только активной конфигурации:

  ```bash
  git -C /Users/nikita/git/round-trip-compact status --short -- cf/CashdeskDev_3_32_26_0_setup1c
  ```

  Если вывод непустой, остановиться и показать его пользователю согласно
  `round-trip-yaml`; самостоятельно каталог не откатывать. Если чисто:

  ```bash
  NKDK_XML_REPO=/Users/nikita/git/round-trip-compact \
  NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/CashdeskDev_3_32_26_0_setup1c \
  ./.agents/skills/round-trip-yaml/round-trip.sh
  ```

  Expected: импорт и sync завершаются успешно, `DIFF_COUNT=0`; в сохранённом
  YAML три `FunctionalOptions` содержат одиночный `!xml/uuid`, а
  `Documents/Инвентаризация` содержит `UUID.UUID` с тем же тегом.

- [ ] **Step 6: Проверить дубли завершённого слоя**

  Run: `pnpm duplicates -- --base 627af0ebeccf8eedf91b8b606bbf72e16e9c33b4`

  Expected: PASS.

- [ ] **Step 7: Зафиксировать интеграцию**

  ```bash
  git add packages/rules/metadata
  git commit -m "test: :white_check_mark: закрепить round-trip UUID-ссылок"
  ```

### Task 6: Полная проверка и независимое ревью

**Files:**
- Verify: все изменения после
  `627af0ebeccf8eedf91b8b606bbf72e16e9c33b4`.

**Interfaces:**
- Consumes: утверждённые specification и plan.
- Produces: зелёные проверки репозитория и `VERDICT: APPROVED` независимого
  reviewer без изменения файлов reviewer-ом.

- [ ] **Step 1: Проверить типы и архитектурные ограничения**

  Run: `pnpm type-check`

  Run: `pnpm test:architecture:rules`

  Run: `pnpm test:architecture`

  Expected: PASS для всех трёх команд.

- [ ] **Step 2: Запустить полный набор тестов вне песочницы**

  Run: `pnpm test`

  Expected: PASS во всех `packages/*`, включая native LMDB и MCP.

- [ ] **Step 3: Выполнить итоговую проверку дублей и дерева**

  Run: `pnpm duplicates -- --base 627af0ebeccf8eedf91b8b606bbf72e16e9c33b4`

  Run: `git diff --check 627af0ebeccf8eedf91b8b606bbf72e16e9c33b4..HEAD`

  Run: `git status --short`

  Expected: проверки проходят; worktree не содержит незакоммиченных или
  незарегистрированных файлов реализации.

- [ ] **Step 4: Передать полный результат независимому reviewer**

  Передать одному reviewer:

  ```text
  spec: docs/superpowers/specs/2026-09-02-metadata-uuid-anomaly-design.md
  plan: docs/superpowers/plans/2026-09-02-metadata-uuid-anomaly.md
  base: 627af0ebeccf8eedf91b8b606bbf72e16e9c33b4
  worktree: /Users/nikita/git/nkdk/.worktrees/metadata-uuid-anomaly
  surface: все committed/staged/unstaged/untracked изменения после base
  ```

  Expected: ответ строго в договоре `executing-plans-with-review` и итоговый
  `VERDICT: APPROVED`. При `CHANGES_REQUIRED` основной агент исправляет каждое
  замечание, повторяет затронутые проверки и возвращает тому же reviewer полный
  diff; reviewer файлы не меняет.

- [ ] **Step 5: Повторить финальные проверки после APPROVED**

  Run: `pnpm test`

  Run: `pnpm test:architecture:rules`

  Run: `pnpm test:architecture`

  Run: `pnpm duplicates -- --base 627af0ebeccf8eedf91b8b606bbf72e16e9c33b4`

  Expected: PASS на том же дереве, которое одобрил reviewer. Если проверка
  меняет файлы, одобрение аннулируется и полное дерево отправляется reviewer
  повторно.
