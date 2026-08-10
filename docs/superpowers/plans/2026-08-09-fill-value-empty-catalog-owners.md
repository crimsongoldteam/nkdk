# Fill Value Empty Catalog Owners Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Считать обычное `ЗначениеЗаполнения` стандартного реквизита `Владелец` ошибочным у собственного справочника без владельцев и сохранять исходное XML-значение только через согласованный `!xml`.

**Architecture:** Существующая политика `ownerReference` различает пустой список и повреждённый непустой список непосредственно в `commonObjects/fillValue`. Общий XML-exception handler ставит тег при результате `invalid`; `!xml DesignTimeRef` использует точный sentinel из плана DefinedType. Заимствованные объекты не получают отдельного fallback к базе, потому что расширение не может менять свойства их стандартных реквизитов.

**Tech Stack:** TypeScript 7, Vitest 4, metadata standard members, XML-import dependent items.

## Global Constraints

- Сначала выполнить `docs/superpowers/plans/2026-08-09-fill-value-xml-exceptions.md` и `docs/superpowers/plans/2026-08-09-fill-value-defined-type.md`.
- Реализовать договор из `docs/superpowers/specs/2026-08-09-fill-value-empty-catalog-owners-design.md`.
- Не выводить владельца из самого `ЗначениеЗаполнения` и не читать базовый компонент для заимствованного стандартного реквизита.
- Пустой/отсутствующий список владельцев даёт `invalid` только когда `ЗначениеЗаполнения` присутствует; отсутствие значения не диагностируется.
- Непустой список с неразбираемым элементом остаётся `unresolved`.
- Не изменять XML-фикстуры, общие типы rules.ts и пользовательский `packages/mcp/README.md`.
- После каждого слоя выполнять `pnpm duplicates -- --base 87a5e5920`.

---

## File Structure

- `packages/core/metadata/commonObjects/fillValue/effectiveType.ts` — политика пустого списка владельцев.
- `packages/core/metadata/commonObjects/fillValue/standardMember.test.ts` — таблица состояний `ownerReference`.
- `packages/core/metadata/importFromXml/dependentItems.test.ts` — автоматическая маркировка 5 + 6 XML-форм.
- `packages/core/metadata/validation/yamlFactExtractor.fillValue.test.ts` — обычное и tagged YAML-поведение.
- `packages/core/metadata/importFromXml/fillValueImport.test.ts` — сквозной XML -> YAML без snapshot.
- `packages/core/metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts` — точный обратный XML.
- `packages/core/metadata/validation/structuralReferences.fillValue.test.ts` — зависимость и переименование typed ref внутри тега.
- `packages/core/metadata/validation/projectStateDependencyValidation.test.ts` — отсутствие наследования политики стандартного реквизита расширения.

---

### Task 1: Предметная классификация пустого списка владельцев

**Files:**
- Modify: `packages/core/metadata/commonObjects/fillValue/effectiveType.ts`
- Modify: `packages/core/metadata/commonObjects/fillValue/standardMember.test.ts`

**Interfaces:**
- Changes: `classifyOwnerReference(value, ownersValue)` возвращает `invalid` для `undefined`/`[]`.
- Preserves: `unresolved` для непустого неразбираемого списка и прежнюю классификацию непустого корректного списка.

- [ ] **Step 1: Написать падающую таблицу состояний**

В `standardMember.test.ts` найти декларацию `Справочник.Владелец` с `policy: "ownerReference"` и проверить:

```ts
it.each([undefined, []])("rejects fill value without catalog owners", (owners) => {
  expect(classifyOwner({ owners }, { type: "ref", value: "Catalog.ПапкиФайлов.EmptyRef" })).toEqual({
    kind: "invalid",
    reason: "у справочника отсутствуют владельцы; значение заполнения реквизита Владелец допускается только с !xml",
  })
})
```

Добавить соседние проверки:

- `["Catalog.ПапкиФайлов"]` + matching EmptyRef -> `implicit`;
- два корректных владельца + соответствующая ссылка -> `valid`;
- `[42]` или `['сломано']` -> `unresolved`;
- непустой список и несовместимый EmptyRef -> `invalid` с прежней общей причиной.

- [ ] **Step 2: Подтвердить красный результат**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/fillValue/standardMember.test.ts --no-isolate
```

Expected: FAIL — пустой список пока возвращает `unresolved`.

- [ ] **Step 3: Изменить только ветку пустого списка**

В `classifyOwnerReference(...)` разделить проверки:

```ts
if (ownersValue === undefined || (Array.isArray(ownersValue) && ownersValue.length === 0)) {
  return {
    kind: "invalid",
    reason: "у справочника отсутствуют владельцы; значение заполнения реквизита Владелец допускается только с !xml",
  }
}
if (!Array.isArray(ownersValue)) {
  return { kind: "unresolved", reason: "не удалось определить владельцев справочника" }
}
```

Оставить существующий разбор элементов и вызов `classifyFillValue(...)` без изменений.

- [ ] **Step 4: Получить зелёный слой и создать коммит**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/fillValue/standardMember.test.ts --no-isolate
pnpm type-check
pnpm duplicates -- --base 87a5e5920
git diff --check
git add packages/core/metadata/commonObjects/fillValue/effectiveType.ts packages/core/metadata/commonObjects/fillValue/standardMember.test.ts
git commit -m "fix: :bug: отклонять заполнение владельца без типа"
```

---

### Task 2: XML-import и validation исключений

**Files:**
- Modify: `packages/core/metadata/importFromXml/dependentItems.test.ts`
- Modify: `packages/core/metadata/importFromXml/fillValueImport.test.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.fillValue.test.ts`

**Interfaces:**
- Consumes: `shouldTagXML` из плана XML-exceptions и exact `DesignTimeRef` из плана DefinedType.
- Produces: 5 `!xml DesignTimeRef` и 6 `!xml <typed EmptyRef>` без configuration snapshot.

- [ ] **Step 1: Написать падающий import-тест typed EmptyRef**

В `dependentItems.test.ts` создать `StandardAttributeDescription` с именем `Владелец`, корневым `Владельцы: []`, YAML-значением `Справочник.ПапкиФайлов.ПустаяСсылка` и исходным XML:

```ts
{ "_xsi:type": "xr:DesignTimeRef", "#text": "Catalog.ПапкиФайлов.EmptyRef" }
```

После normalization ожидать:

- значение осталось и сериализуется как `!xml Справочник.ПапкиФайлов.ПустаяСсылка`;
- scalar помечен тегом `xml`;
- snapshot fragment не содержит logicalAddress этого свойства.

- [ ] **Step 2: Написать падающий import-тест пустого DesignTimeRef**

Повторить сценарий с YAML `.` и XML `{ "_xsi:type": "xr:DesignTimeRef" }`. Ожидать точный `!xml DesignTimeRef`, отсутствие ссылки и snapshot.

- [ ] **Step 3: Зафиксировать validation**

В `yamlFactExtractor.fillValue.test.ts` проверить для отсутствующего ключа `Владельцы` и для `Владельцы: []`:

- обычные `.` и typed EmptyRef дают ровно одну предметную ошибку по пути `ЗначениеЗаполнения`;
- `!xml DesignTimeRef` и `!xml Справочник.ПапкиФайлов.ПустаяСсылка` не дают локальной fillValue-ошибки;
- tagged typed ref по-прежнему создаёт pending reference;
- отсутствие `ЗначениеЗаполнения` не даёт diagnostics.

- [ ] **Step 4: Получить зелёный import/validation слой**

Основная реализация должна потребовать только результата `invalid` из Task 1. Если import-handler содержит частную проверку причины, удалить её: `shouldTagXML` обязан работать через общий результат классификатора.

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/dependentItems.test.ts metadata/importFromXml/fillValueImport.test.ts metadata/validation/yamlFactExtractor.fillValue.test.ts --no-isolate
pnpm type-check
pnpm duplicates -- --base 87a5e5920
git diff --check
```

- [ ] **Step 5: Создать коммит тестового слоя**

```bash
git add packages/core/metadata/importFromXml/dependentItems.test.ts packages/core/metadata/importFromXml/fillValueImport.test.ts packages/core/metadata/validation/yamlFactExtractor.fillValue.test.ts
git commit -m "test: :white_check_mark: закрепить исключения пустого владельца"
```

---

### Task 3: Точный YAML -> XML и ссылки

**Files:**
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/validation/structuralReferences.fillValue.test.ts`
- Modify: `packages/core/metadata/validation/fillValueReferences.test.ts`

- [ ] **Step 1: Проверить обе обратные XML-формы**

В `fromYAMLToXML.test.ts` проверить:

```yaml
ЗначениеЗаполнения: !xml DesignTimeRef
```

даёт `{ "_xsi:type": "xr:DesignTimeRef" }`, а:

```yaml
ЗначениеЗаполнения: !xml Справочник.ПапкиФайлов.ПустаяСсылка
```

даёт `{ "_xsi:type": "xr:DesignTimeRef", "#text": "Catalog.ПапкиФайлов.EmptyRef" }`. Ни `!xml`, ни слово `DesignTimeRef` не попадают в `#text`.

- [ ] **Step 2: Проверить dependency и rename**

В `fillValueReferences.test.ts` ожидать reference diagnostic для отсутствующего `Справочник.ПапкиФайлов` даже при tagged значении.

В `structuralReferences.fillValue.test.ts` переименовать объект внутри tagged EmptyRef и проверить одновременно новый payload и сохранение YAML-тега после `commitStaged()`.

- [ ] **Step 3: Выполнить узкие проверки и создать коммит**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts metadata/validation/structuralReferences.fillValue.test.ts metadata/validation/fillValueReferences.test.ts --no-isolate
pnpm type-check
pnpm duplicates -- --base 87a5e5920
git diff --check
git add packages/core/metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts packages/core/metadata/validation/structuralReferences.fillValue.test.ts packages/core/metadata/validation/fillValueReferences.test.ts
git commit -m "test: :white_check_mark: проверить XML исключений владельца"
```

---

### Task 4: Граница расширения

**Files:**
- Modify: `packages/core/metadata/validation/projectStateDependencyValidation.test.ts`
- Modify: `packages/core/metadata/importFromXml/fillValueImport.test.ts`

- [ ] **Step 1: Зафиксировать отсутствие наследования standard attributes**

Создать layered owner cache, где базовый `Справочник.Товары` имеет владельцев, а расширение содержит только заимствованный объект без `СтандартныеРеквизиты`. Проверить, что:

- fillValue-check для `Владелец` не создаётся из базового объекта;
- import расширения не синтезирует `СтандартныеРеквизиты.Владелец`;
- код `ownerReference` не вызывает `ownerCache.get(...)` ради этой политики.

- [ ] **Step 2: Выполнить архитектурные проверки**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/projectStateDependencyValidation.test.ts metadata/importFromXml/fillValueImport.test.ts --no-isolate
pnpm type-check
pnpm test:architecture
pnpm duplicates -- --base 87a5e5920
git diff --check
```

Expected: PASS; в общих orchestration/validation/project модулях нет условий по имени `Владелец` или типу `Справочник`.

- [ ] **Step 3: Создать коммит**

```bash
git add packages/core/metadata/validation/projectStateDependencyValidation.test.ts packages/core/metadata/importFromXml/fillValueImport.test.ts
git commit -m "test: :white_check_mark: закрепить границу владельца расширения"
```

---

### Task 5: Полная проверка и контрольный импорт SED

- [ ] **Step 1: Выполнить обязательные проверки**

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 87a5e5920
git diff --check
```

- [ ] **Step 2: Повторить чистый импорт**

Удалить только согласованные `/Users/nikita/git/sed_nkdk/cf` и `/Users/nikita/git/sed_nkdk/cfe`, затем импортировать `/Users/nikita/git/sed_xml/cf` и `/Users/nikita/git/sed_xml/cfe`.

- [ ] **Step 3: Проверить 11 случаев владельца**

Ожидать:

- 5 `!xml DesignTimeRef`;
- 6 `!xml <типизированная пустая ссылка>`;
- ноль предупреждений `не определены владельцы справочника`;
- ноль fillValue-ошибок для согласованных тегов;
- точный YAML -> XML round-trip всех 11 значений;
- отсутствие snapshot для этих 11 явных XML-исключений;
- generated-проект SED не добавлен в git-индекс NKDK.
