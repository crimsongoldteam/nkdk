# Known Round-Trip Discrepancies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Устранить согласованные round-trip дефекты Tester и Storekeeper и выявленный конфликт переносчиков, не расширяя семантику `!xml` за пределы зарегистрированных аномалий.

**Architecture:** Канонические булевы значения исправляются в общей классификации `FillValue`; точные некорректные XML-ссылки продолжают проходить только через реестр переносчиков. Пустой корневой `ClientApplicationInterface` использует существующую политику явной материализации XML, а проектная валидация сверяется с тем же реестром переносчиков, что структурные операции и экспорт.

**Tech Stack:** TypeScript, Vitest, TypeBox, YAML scalar tags, metadata rules/runtime, round-trip-yaml.

## Global Constraints

- Не изменять существующие XML-фикстуры: они являются источником истины.
- `!xml` разрешён только для формы XML, которую нельзя однозначно восстановить из смысловых данных YAML и индексов метаданных.
- Обычный или разрешённый стандартный реквизит единственного булевого типа хранит явные `Истина` и `Ложь` без `!xml`; отсутствующий, пустой или `xsi:nil` FillValue не создаёт поле YAML.
- Ошибочный булевый FillValue стандартных `Предопределенный` и `Владелец` сохраняется как `ЗначениеЗаполнения: !xml Ложь`.
- Битая `DesignTimeRef` хранится ровно как один тег `!xml <UUID>.<UUID>`; повторный текст `!xml` внутри payload запрещён.
- Переносчик битой XML-ссылки объявляет совпадение только для своей строгой грамматики и не перехватывает другие допустимые значения `!xml` того же типа свойства.
- Битая `MDObjectRef` исключается из проверки metadata target только при наличии YAML-тега `!xml` и успешном распознавании зарегистрированным переносчиком для текущего правила свойства и относительного YAML-пути.
- Пустой существующий `Ext/ClientApplicationInterface.xml`, содержащий только пять стандартных `panelDef`, хранится как `ИнтерфейсКлиентскогоПриложения: !xml`; отсутствующий файл не создаёт поле.
- Расхождение старых форм Tester по `xmlns:dcssch` в этот план не входит: решение по нему отложено.
- LMDB использует mmap и файловые блокировки; `pnpm --filter @nkdk/rules test:native`, `pnpm test:e2e`, полный `pnpm test` и round-trip запускать вне песочницы с `sandbox_permissions: require_escalated`.
- Если Vitest worker завершается с SIGABRT, сначала повторить запуск вне песочницы; не пересобирать LMDB как первичное исправление.
- После каждого законченного слоя запускать `pnpm duplicates -- --base 48a3e967a99e2f6c964edaa0b70b2f79d9069d5d`.

---

### Task 0: Избирательный экспорт через контекстные переносчики

**Files:**
- Modify: `packages/rules/metadata/commonObjects/metadataValue/brokenDesignTimeRef.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/brokenLocalReferences.ts`
- Test: `packages/rules/metadata/ruleRuntime/property/brokenXMLReferencePipeline.test.ts`
- Test: `packages/rules/metadata/commonObjects/metadataValue/brokenDesignTimeRef.test.ts`
- Test: `packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`
- Test: `packages/rules/metadata/appliedObjects/metadataCatalog/fromXMLToYAML.test.ts`
- Modify fixture expectation: `packages/rules/metadata/appliedObjects/metadataCatalog/__fixtures__/full.ts`

**Interfaces:**
- Consumes: контекстный `PropertyRuleExecution`, `prepareBrokenXMLReferenceExport`, YAML-тег и строгие грамматики зарегистрированных переносчиков.
- Produces: переносчик возвращает `undefined` для чужого tagged payload; реестр продолжает поиск другого совпадения, а при отсутствии совпадений оставляет значение обычному правилу свойства.

- [ ] **Step 1: Add coexistence regressions**

Добавить интеграционный тест с несколькими переносчиками одного типа свойства.
Проверить три случая: первый переносчик не принимает значение, второй принимает;
ни один переносчик не принимает допустимый для обычного правила `!xml`; два
переносчика действительно принимают значение и реестр сохраняет диагностику
неоднозначности.

В тестах `MetadataValue` подтвердить, что переносчик `DesignTimeRef` не
перехватывает `!xml Ложь` и `!xml Справочник.Роли.ПустаяСсылка`. В тестах формы
подтвердить, что переносчик `DataPath` не перехватывает допустимый tagged
payload другой зарегистрированной формы.

- [ ] **Step 2: Verify RED against the contextual pipeline**

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/ruleRuntime/property/brokenXMLReferencePipeline.test.ts metadata/commonObjects/metadataValue/brokenDesignTimeRef.test.ts
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts metadata/appliedObjects/metadataCatalog/fromXMLToYAML.test.ts
```

Expected: строгие переносчики бросают ошибку на чужом tagged payload вместо
возврата `undefined`.

- [ ] **Step 3: Make carrier selection non-claiming**

В `prepareExport` каждого скалярного переносчика сначала проверить одновременно
наличие YAML-тега и соответствие payload его грамматике. При несовпадении
вернуть `undefined`; `scalarPayload` и `brokenDesignTimeRefPayload` оставить
строгими для уже выбранного переносчика и стадии patch.

Не откатывать использование `currentPropertyRuleRegistrySet`: контекстный реестр
должен оставаться рабочим путём production pipeline.

- [ ] **Step 4: Correct only the stale expectation**

В тесте импорта пары UUID заменить ожидание обычной строки на
`!xml <UUID>.<UUID>`. Остальные шесть исходных падений исправить кодом, не
ослабляя их ожидания.

- [ ] **Step 5: Verify baseline recovery, duplication and commit**

Запустить узкие тесты из Step 2, затем полный `pnpm test` вне песочницы.

```bash
pnpm duplicates -- --base 48a3e967a99e2f6c964edaa0b70b2f79d9069d5d
git add packages/rules/metadata/commonObjects/metadataValue/brokenDesignTimeRef.ts packages/rules/metadata/forms/clientApplicationForm/brokenLocalReferences.ts packages/rules/metadata/ruleRuntime/property/brokenXMLReferencePipeline.test.ts packages/rules/metadata/commonObjects/metadataValue/brokenDesignTimeRef.test.ts packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts packages/rules/metadata/appliedObjects/metadataCatalog/fromXMLToYAML.test.ts packages/rules/metadata/appliedObjects/metadataCatalog/__fixtures__/full.ts docs/superpowers/plans/2026-08-14-round-trip-known-discrepancies.md
git commit -m "fix: :bug: не перехватывать чужие значения xml"
```

---

### Task 1: Пустой корневой ClientApplicationInterface

**Files:**
- Modify: `packages/rules/metadata/commonObjects/clientApplicationInterface/register.ts`
- Test: `packages/rules/metadata/commonObjects/clientApplicationInterface/fromXMLToYAML.test.ts`
- Test: `packages/rules/metadata/commonObjects/clientApplicationInterface/fromYAMLToXML.test.ts`
- Test: `packages/rules/metadata/appliedObjects/configuration/convertFromXML.test.ts`

**Interfaces:**
- Consumes: `EMPTY_XML_TAG_VALUE`, `explicitXMLPropertyTypes`, существующие `standardPanelUuids` и `ClientApplicationInterfaceRules`.
- Produces: политика `ClientApplicationInterface` с `action: "materializeCollection"`, которая различает отсутствующий внешний файл и существующий файл только с пятью стандартными пустыми `panelDef`.

- [ ] **Step 1: Add the failing import regression**

Добавить случай конфигурационного импорта с существующим `Ext/ClientApplicationInterface.xml`, содержащим только эти определения:

```xml
<panelDef id="b553047f-c9aa-4157-978d-448ecad24248"/>
<panelDef id="13322b22-3960-4d68-93a6-fe2dd7f28ca3"/>
<panelDef id="c933ac92-92cd-459d-81cc-e0c8a83ced99"/>
<panelDef id="cbab57f2-a0f3-4f0a-89ea-4cb19570ab75"/>
<panelDef id="b2735bd3-d822-4430-ba59-c9e869693b24"/>
```

Проверить сериализованный результат:

```yaml
ИнтерфейсКлиентскогоПриложения: !xml
```

В том же тесте подтвердить, что отсутствие внешнего файла не создаёт поле.

- [ ] **Step 2: Run the import test and verify RED**

Run outside sandbox:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project native-lmdb metadata/appliedObjects/configuration/convertFromXML.test.ts
```

Expected: существующий пустой интерфейс не представлен в YAML либо исчезает как пустой объект.

- [ ] **Step 3: Register exact empty-root materialization**

В `register.ts` вернуть `EMPTY_XML_TAG_VALUE` только когда одновременно:

```ts
const emptyStandardRoot =
  Object.keys(result).length === 0 &&
  panelDefs?.length === standardPanelUuids.size &&
  new Set(panelDefs.map(({ id }) => id)).size === standardPanelUuids.size &&
  panelDefs.every((panelDef) =>
    standardPanelUuids.has(panelDef.id) &&
    panelDef.name === undefined &&
    panelDef.spr === undefined &&
    Object.keys(getReferenceRawXML(panelDef) ?? panelDef)
      .every((key) => key === "_id" || key === "id")
  )
```

Зарегистрировать для типа свойства `ClientApplicationInterface` существующую политику:

```ts
{
  propertyType: "ClientApplicationInterface",
  action: "materializeCollection",
  yamlValue: EMPTY_XML_TAG_VALUE,
}
```

Не добавлять новый общий признак в `PropertyRule` и не хранить наличие файла в снимке.

- [ ] **Step 4: Add the export regression and verify GREEN**

Проверить, что `ИнтерфейсКлиентскогоПриложения: !xml` материализует корень с пятью стандартными `panelDef`, а отсутствие поля не создаёт файл. Запустить оба узких набора:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/commonObjects/clientApplicationInterface/fromXMLToYAML.test.ts metadata/commonObjects/clientApplicationInterface/fromYAMLToXML.test.ts
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project native-lmdb metadata/appliedObjects/configuration/convertFromXML.test.ts
```

Expected: PASS.

- [ ] **Step 5: Check duplication and commit**

```bash
pnpm duplicates -- --base 48a3e967a99e2f6c964edaa0b70b2f79d9069d5d
git add packages/rules/metadata/commonObjects/clientApplicationInterface/register.ts packages/rules/metadata/commonObjects/clientApplicationInterface/fromXMLToYAML.test.ts packages/rules/metadata/commonObjects/clientApplicationInterface/fromYAMLToXML.test.ts packages/rules/metadata/appliedObjects/configuration/convertFromXML.test.ts
git commit -m "fix: :bug: сохранить пустой интерфейс приложения"
```

---

### Task 2: Семантическое булево значение заполнения

**Files:**
- Modify: `packages/runtime/metadata/ruleRuntime/property/fillValueSemantics.ts`
- Test: `packages/rules/metadata/commonObjects/fillValue/classify.test.ts`
- Test: `packages/rules/metadata/commonObjects/fillValue/standardMember.test.ts`
- Test: `packages/rules/metadata/importFromXml/fillValueImport.test.ts`

**Interfaces:**
- Consumes: `classifyFillValue`, декларации политик стандартных реквизитов и зависимую нормализацию импорта.
- Produces: `false` для единственной булевой альтернативы классифицируется как `valid`; запретные политики `Предопределенный` и `Владелец` остаются `invalid`.

- [ ] **Step 1: Change the classification expectations to RED**

Изменить проверки обычного и разрешённого стандартного булевого значения:

```ts
expect(classify({ type: ["boolean"] }, { type: "boolean", value: false }).kind).toBe("valid")
expect(classify(catalogMember("ПометкаУдаления"), { type: "boolean", value: false }).kind).toBe("valid")
```

Оставить и усилить границы:

```ts
expect(classify(catalogMember("Предопределенный"), { type: "boolean", value: false }).kind).toBe("invalid")
expect(classify(catalogMember("Владелец"), { type: "boolean", value: false }).kind).toBe("invalid")
```

- [ ] **Step 2: Run classification tests and verify RED**

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/commonObjects/fillValue/classify.test.ts metadata/commonObjects/fillValue/standardMember.test.ts
```

Expected: `false` всё ещё классифицируется как `implicit`.

- [ ] **Step 3: Remove boolean false from implicit FillValue values**

В `fillValueSemantics.ts` изменить `isImplicit`: строка, число, дата и одиночная пустая ссылка сохраняют текущий договор, а булева ветка всегда возвращает `false`, позволяя `matchesAlternative` признать оба булевых значения корректными.

```ts
if (alternative.kind === "boolean") return false
```

- [ ] **Step 4: Add XML import coverage and verify GREEN**

Расширить `fillValueImport.test.ts` представителями трёх договоров:

```yaml
Реквизиты:
  БулевоПоле:
    Тип: Булево
    ЗначениеЗаполнения: Ложь
СтандартныеРеквизиты:
  ПометкаУдаления:
    ЗначениеЗаполнения: Ложь
  Предопределенный:
    ЗначениеЗаполнения: !xml Ложь
```

Проверить `yamlScalarTagAt`: у первых двух значений тега нет, у запретного стандартного реквизита тег равен `xml`. Запустить:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/commonObjects/fillValue/classify.test.ts metadata/commonObjects/fillValue/standardMember.test.ts
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/importFromXml/fillValueImport.test.ts
```

Expected: PASS.

- [ ] **Step 5: Check duplication and commit**

```bash
pnpm duplicates -- --base 48a3e967a99e2f6c964edaa0b70b2f79d9069d5d
git add packages/runtime/metadata/ruleRuntime/property/fillValueSemantics.ts packages/rules/metadata/commonObjects/fillValue/classify.test.ts packages/rules/metadata/commonObjects/fillValue/standardMember.test.ts packages/rules/metadata/importFromXml/fillValueImport.test.ts
git commit -m "fix: :bug: сохранить явное булево FillValue"
```

---

### Task 3: Идемпотентная маркировка битой DesignTimeRef

**Files:**
- Modify: `packages/rules/metadata/importFromXml/dependentItems.ts`
- Test: `packages/rules/metadata/importFromXml/dependentItems.test.ts`
- Test: `packages/rules/metadata/importFromXml/fillValueImport.test.ts`

**Interfaces:**
- Consumes: `yamlScalarTagAt`, уже выполненную маркировку переносчиком `metadataValue.designTimeRefUuid`.
- Produces: зависимая нормализация не оборачивает повторно уже тегированный скаляр.

- [ ] **Step 1: Add the failing double-tag regression**

Добавить импорт реального `MetadataAttribute` и `StandardAttributeDescription` с XML:

```xml
<FillValue xsi:type="xr:DesignTimeRef">c794310a-bab9-4917-b1d0-e3438282256a.00000000-0000-0000-0000-000000000000</FillValue>
```

Проверить точный YAML и внутренний payload:

```ts
expect(value).toBe("!xml c794310a-bab9-4917-b1d0-e3438282256a.00000000-0000-0000-0000-000000000000")
expect(xmlScalarTagPayload(value)).toBe("c794310a-bab9-4917-b1d0-e3438282256a.00000000-0000-0000-0000-000000000000")
```

- [ ] **Step 2: Run import tests and verify RED**

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/importFromXml/dependentItems.test.ts metadata/importFromXml/fillValueImport.test.ts
```

Expected: payload содержит второй текст `!xml`.

- [ ] **Step 3: Make dependent tagging idempotent**

В `normalizeImportedDependentItems` перед `xmlScalarTagValue(String(value))` проверить текущий тег:

```ts
if (
  shouldTagXML &&
  yamlScalarTagAt(item, yamlKey) !== "xml" &&
  (typeof value === "string" || typeof value === "number")
) {
  item[yamlKey] = xmlScalarTagValue(String(value))
  markYAMLScalarTag(item, yamlKey, "xml")
}
```

Не ослаблять строгую грамматику двух UUID и не распознавать строковый префикс без YAML-тега.

- [ ] **Step 4: Verify import and export GREEN**

Добавить round-trip проверку, что полученный YAML экспортируется обратно в один `xr:DesignTimeRef` с исходным текстом. Запустить:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/importFromXml/dependentItems.test.ts metadata/importFromXml/fillValueImport.test.ts
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/commonObjects/metadataValue/brokenDesignTimeRef.test.ts
```

Expected: PASS.

- [ ] **Step 5: Check duplication and commit**

```bash
pnpm duplicates -- --base 48a3e967a99e2f6c964edaa0b70b2f79d9069d5d
git add packages/rules/metadata/importFromXml/dependentItems.ts packages/rules/metadata/importFromXml/dependentItems.test.ts packages/rules/metadata/importFromXml/fillValueImport.test.ts
git commit -m "fix: :bug: не дублировать тег битой DesignTimeRef"
```

---

### Task 4: Проектная валидация перенесённых битых ссылок

**Files:**
- Modify: `packages/runtime/metadata/validation/structuralReferences.ts`
- Modify: `packages/rules/metadata/validation/yamlFactExtractor.ts`
- Test: `packages/rules/metadata/validation/yamlFactExtractor.test.ts`

**Interfaces:**
- Consumes: `resolveDeferredPropertyRule`, `PropertyRuleExecution.isTransportedBrokenXMLReference` и YAML-теги по относительному пути.
- Produces: общий экспортируемый помощник `isRelativeYAMLScalarTagged(parent, propertyKey, path)` и фильтр переносимых значений до `parseMetadataTargetFromYAML`.

- [ ] **Step 1: Add the failing mixed-subsystem regression**

В `yamlFactExtractor.test.ts` использовать объект
`/project/Подсистема/ОбщийФункционал/Подсистемы/ОбратнаяСвязь/Свойства.yaml`:

```yaml
Состав:
  - ОбщаяФорма.ОценитьПриложение
  - !xml 6f583fdc-08d4-45d8-9dd0-45aaff4cb2f4
```

Проверить:

```ts
expect(facts.diagnostics).toEqual([])
expect(facts.pendingReferences).toEqual([
  expect.objectContaining({
    canonical: "CommonForm.ОценитьПриложение",
    yamlPath: ["Состав", 0],
  }),
])
```

Добавить границу с нетегированным UUID: она должна сохранить диагностику `Неизвестный корень`.

- [ ] **Step 2: Run validation test and verify RED**

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/validation/yamlFactExtractor.test.ts
```

Expected: тегированный UUID ошибочно диагностируется как корень `!xml <UUID>`.

- [ ] **Step 3: Reuse the structural tag-path contract**

Экспортировать существующую функцию из runtime:

```ts
export function isRelativeYAMLScalarTagged(
  parent: Readonly<Record<string, unknown>>,
  propertyKey: string,
  path: readonly (string | number)[],
): boolean
```

Не копировать её реализацию в `yamlFactExtractor.ts`.

- [ ] **Step 4: Filter only carrier-recognized values**

В `collectPendingReferences` разрешить фактическое правило свойства через:

```ts
resolveDeferredPropertyRule(params.rootRule, rulePath, execution)
```

При переходе во вложенное правило включать `property.nestedItemType` в соответствующий сегмент `rulePath`. Перед разбором строкового target передавать относительный путь элемента и вызывать:

```ts
execution.isTransportedBrokenXMLReference({
  rule,
  yamlValue: value,
  path: relativePath,
  isTagged: (path) => isRelativeYAMLScalarTagged(record, yamlKey, path),
})
```

Пропускать только результат `true`; обычные соседние ссылки, нетегированный UUID и неизвестный тег продолжать разбирать и диагностировать.

- [ ] **Step 5: Verify validation and structural operations GREEN**

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/validation/yamlFactExtractor.test.ts metadata/validation/structuralReferences.test.ts
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/commonObjects/metadataRef/brokenMDObjectRef.test.ts
pnpm --filter @nkdk/rules type-check
```

Expected: PASS.

- [ ] **Step 6: Check duplication and commit**

```bash
pnpm duplicates -- --base 48a3e967a99e2f6c964edaa0b70b2f79d9069d5d
git add packages/runtime/metadata/validation/structuralReferences.ts packages/rules/metadata/validation/yamlFactExtractor.ts packages/rules/metadata/validation/yamlFactExtractor.test.ts
git commit -m "fix: :bug: пропустить перенесённые битые ссылки при валидации"
```

---

### Task 5: Сквозная проверка известных расхождений

**Files:**
- No production files expected.
- Diagnostic outputs remain outside git.

**Interfaces:**
- Consumes: результаты Tasks 1–4.
- Produces: подтверждение, что известные 57 ошибок Storekeeper устранены, а в Tester остаётся только отложенное namespace-расхождение.

- [ ] **Step 1: Run package and architecture verification**

Run outside sandbox where noted:

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 48a3e967a99e2f6c964edaa0b70b2f79d9069d5d
```

Expected: все команды PASS; `pnpm test` запускается вне песочницы из-за native LMDB.

- [ ] **Step 2: Re-run Tester triage**

Run outside sandbox:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/Tester_1_0_10_34_setup1c ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 10
```

Expected: `Ext/ClientApplicationInterface.xml` больше не удаляется; допустимы только 98 ранее отложенных расхождений `xmlns:dcssch` в формах.

- [ ] **Step 3: Re-run Storekeeper triage**

Run outside sandbox:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/StorekeeperDevelopers_2_0_108_1_setup1c ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 10
```

Expected: отсутствуют все прежние 57 ошибок: 9 диагностик `!xml`, 42 неизвестных корня `!xml <UUID>` и 6 ошибок экспорта битой `DesignTimeRef`. Если после успешной синхронизации обнаружится новое XML-расхождение, остановиться и зарегистрировать его отдельно, не расширяя этот план.

- [ ] **Step 4: Record verification evidence**

Записать в SDD-отчёт точные команды, коды завершения и первое новое расхождение либо подтверждение отсутствия новых расхождений. Не изменять диагностические XML/YAML-файлы и не восстанавливать их через git.
