# Fill Value DateTime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Научить `ЗначениеЗаполнения` проверять даты с уточнениями `Date`, `Time`, `DateTime`, удалять начальную дату одиночного типа при import и включить договор у 14 стандартных реквизитов.

**Architecture:** `FillValueAlternative` получает вариант `dateTime`, `effectiveType` переносит `dateFractions`, а общий классификатор проверяет каноническую строку без `Date` и часового пояса. Стандартные реквизиты включаются только явной политикой `byEffectiveType`; существующий зависимый import удаляет результат `implicit` и сохраняет XML-форму в снимке.

**Tech Stack:** TypeScript 7, Vitest 4, metadata ruleRuntime, configuration snapshot.

## Global Constraints

- Не изменять существующие XML-фикстуры.
- Не расширять `BasePropertyRule`, `PropertyRule` и параметры построителей rules.ts.
- Не выводить политику автоматически из `kind: "dateTime"`.
- Внутренняя форма даты — `yyyy-MM-dd'T'HH:mm:ss`; отсутствие уточнения означает `DateTime`.
- `0001-01-01T00:00:00` — `implicit` только для одиночного типа; в составном типе это содержательный выбор ветви даты.
- После каждого слоя выполнять `pnpm duplicates -- --base 86fc64d5b`.

---

## File Structure

- `packages/core/metadata/commonObjects/fillValue/types.ts` — вариант эффективного типа даты.
- `packages/core/metadata/commonObjects/fillValue/effectiveType.ts` — перенос уточнения обычного и стандартного реквизита.
- `packages/core/metadata/commonObjects/fillValue/classify.ts` — календарная и квалификационная проверка.
- `packages/core/metadata/commonObjects/fillValue/{effectiveType,classify,standardMember}.test.ts` — узкие предметные договоры.
- `packages/core/metadata/standardMembers/declarations.test.ts` — перечень явных политик.
- Девять `packages/core/metadata/appliedObjects/*/standardMembers.ts` — 14 деклараций даты.
- `packages/core/metadata/importFromXml/{dependentItems,fillValueImport}.test.ts` — удаление даты и сохранение XML-состояния.

---

### Task 1: Эффективный тип и классификатор даты

**Files:**
- Modify: `packages/core/metadata/commonObjects/fillValue/types.ts`
- Modify: `packages/core/metadata/commonObjects/fillValue/effectiveType.ts`
- Modify: `packages/core/metadata/commonObjects/fillValue/classify.ts`
- Test: `packages/core/metadata/commonObjects/fillValue/effectiveType.test.ts`
- Test: `packages/core/metadata/commonObjects/fillValue/classify.test.ts`

**Interfaces:**
- Consumes: `TypeDescription.dateQualifiers?.dateFractions`, `MetadataTypedValue.type === "dateTime"`.
- Produces: `{ kind: "dateTime"; dateFractions: "Date" | "Time" | "DateTime" }`; прежний `classifyFillValue(...)` возвращает `valid`, `implicit` или `invalid` и для даты.

- [ ] **Step 1: Написать падающие тесты эффективного типа**

В `effectiveType.test.ts` добавить:

```ts
it.each(["Date", "Time", "DateTime"] as const)("maps %s qualifier", (dateFractions) => {
  expect(effectiveTypeFromTypeDescription({
    type: ["dateTime"],
    dateQualifiers: { dateFractions },
  })).toEqual({
    status: "known",
    alternatives: [{ kind: "dateTime", dateFractions }],
    composite: false,
  })
})

it("defaults dateTime to DateTime", () => {
  expect(effectiveTypeFromTypeDescription({ type: ["dateTime"] })).toEqual({
    status: "known",
    alternatives: [{ kind: "dateTime", dateFractions: "DateTime" }],
    composite: false,
  })
})
```

- [ ] **Step 2: Написать падающую таблицу классификации**

В `classify.test.ts` добавить:

```ts
it.each([
  ["Date", "2026-08-09T00:00:00", "valid"],
  ["Date", "2026-08-09T12:30:00", "invalid"],
  ["Time", "0001-01-01T12:30:59", "valid"],
  ["Time", "2026-08-09T12:30:00", "invalid"],
  ["DateTime", "2026-08-09T12:30:00", "valid"],
  ["DateTime", "2025-02-29T00:00:00", "invalid"],
  ["DateTime", "2024-02-29T00:00:00", "valid"],
  ["DateTime", "2026-13-01T00:00:00", "invalid"],
  ["DateTime", "2026-08-09T24:00:00", "invalid"],
  ["DateTime", "09.08.2026 12:30:00", "invalid"],
] as const)("classifies %s %s as %s", (dateFractions, value, expected) => {
  expect(classify(
    { type: ["dateTime"], dateQualifiers: { dateFractions } },
    { type: "dateTime", value },
  ).kind).toBe(expected)
})

it.each(["Date", "Time", "DateTime"] as const)("makes beginning %s implicit", (dateFractions) => {
  expect(classify(
    { type: ["dateTime"], dateQualifiers: { dateFractions } },
    { type: "dateTime", value: "0001-01-01T00:00:00" },
  ).kind).toBe("implicit")
})

it("keeps beginning date as a composite branch", () => {
  expect(classify(
    { type: ["string", "dateTime"], dateQualifiers: { dateFractions: "Date" } },
    { type: "dateTime", value: "0001-01-01T00:00:00" },
  ).kind).toBe("valid")
})
```

- [ ] **Step 3: Подтвердить красный результат**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/fillValue/effectiveType.test.ts metadata/commonObjects/fillValue/classify.test.ts --no-isolate
```

Expected: FAIL, потому что `dateTime` пока возвращает `unresolved`.

- [ ] **Step 4: Добавить вариант и перенос уточнения**

В `types.ts` добавить в union:

```ts
| { readonly kind: "dateTime"; readonly dateFractions: "Date" | "Time" | "DateTime" }
```

В `alternativeFromType(...)` добавить:

```ts
case "dateTime":
  return { kind: "dateTime", dateFractions: type.dateQualifiers?.dateFractions ?? "DateTime" }
```

- [ ] **Step 5: Реализовать проверку без системного `Date`**

Добавить ветви `dateTime` в `isImplicit(...)` и `matchesAlternative(...)`, затем локальные функции:

```ts
const canonicalDateTime = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/

function matchesDateTime(value: string, fractions: "Date" | "Time" | "DateTime"): boolean {
  const match = canonicalDateTime.exec(value)
  if (match === null) return false
  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match
  const y = Number(yearText)
  const m = Number(monthText)
  const d = Number(dayText)
  const h = Number(hourText)
  const min = Number(minuteText)
  const s = Number(secondText)
  if (y < 1 || m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return false
  if (h > 23 || min > 59 || s > 59) return false
  if (fractions === "Date") return h === 0 && min === 0 && s === 0
  if (fractions === "Time") return y === 1 && m === 1 && d === 1
  return true
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}
```

В `isImplicit(...)` сравнивать с `0001-01-01T00:00:00`; существующий порядок `classifyFillValue(...)` уже применяет это только при `composite === false`.

- [ ] **Step 6: Получить зелёный слой и создать коммит**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/fillValue/effectiveType.test.ts metadata/commonObjects/fillValue/classify.test.ts --no-isolate
pnpm duplicates -- --base 86fc64d5b
git add packages/core/metadata/commonObjects/fillValue/types.ts packages/core/metadata/commonObjects/fillValue/effectiveType.ts packages/core/metadata/commonObjects/fillValue/classify.ts packages/core/metadata/commonObjects/fillValue/effectiveType.test.ts packages/core/metadata/commonObjects/fillValue/classify.test.ts
git commit -m "feat: :sparkles: проверить даты значений заполнения"
```

Expected: PASS; коммит содержит только классификатор и его тесты.

---

### Task 2: Стандартные реквизиты даты

**Files:**
- Modify: `packages/core/metadata/commonObjects/fillValue/effectiveType.ts`
- Modify: `packages/core/metadata/commonObjects/fillValue/standardMember.test.ts`
- Modify: `packages/core/metadata/standardMembers/declarations.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadata{Document,BusinessProcess,Task,DocumentJournal,ExchangePlan,InformationRegister,AccumulationRegister,AccountingRegister,CalculationRegister}/standardMembers.ts`

**Interfaces:**
- Consumes: вариант даты из Task 1.
- Produces: стандартная дата классифицируется как `DateTime`; 14 деклараций явно содержат `fillValue: { policy: "byEffectiveType" }`.

- [ ] **Step 1: Написать падающий предметный тест**

В `standardMember.test.ts` зарегистрировать standard members задачи и проверить:

```ts
it("checks task Date as DateTime", () => {
  const member = getStandardMembers("Задача").find(({ names }) => names.yaml === "Дата")
  if (member === undefined) throw new Error("Не найден стандартный реквизит Дата задачи")
  expect(classify(member, { type: "dateTime", value: "2026-08-09T12:30:00" }).kind).toBe("valid")
  expect(classify(member, { type: "dateTime", value: "0001-01-01T00:00:00" }).kind).toBe("implicit")
})
```

- [ ] **Step 2: Зафиксировать полный перечень политик**

В `declarations.test.ts` добавить `it.each` для 14 пар из спецификации: `Документ.Дата`, `БизнесПроцесс.Дата`, `Задача.Дата`, `ЖурналДокументов.Дата`, `ПланОбмена.ДатаОбмена`, по одному `Период` трёх регистров и шесть дат `РегистрРасчета`. Для каждой пары:

```ts
const member = getStandardMembers(owner).find(({ names }) => names.yaml === name)
expect(member?.fillValue).toEqual({ policy: "byEffectiveType" })
```

Внутренний ключ `owner` брать из фактического `registerStandardMembers(...)` соответствующего файла.

- [ ] **Step 3: Подтвердить красный результат**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/fillValue/standardMember.test.ts metadata/standardMembers/declarations.test.ts --no-isolate
```

Expected: FAIL — даты ещё `notSpecified`/`unresolved`.

- [ ] **Step 4: Реализовать стандартную дату и явные политики**

В `effectiveTypeFromDeclaration(...)`:

```ts
case "dateTime":
  return { status: "known", alternatives: [{ kind: "dateTime", dateFractions: "DateTime" }], composite: false }
```

В каждую из 14 деклараций даты добавить:

```ts
fillValue: { policy: "byEffectiveType" },
```

Не менять `withCommonFillValuePolicy(...)`.

- [ ] **Step 5: Получить зелёный слой и создать коммит**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/fillValue/standardMember.test.ts metadata/standardMembers/declarations.test.ts --no-isolate
pnpm duplicates -- --base 86fc64d5b
git add packages/core/metadata/commonObjects/fillValue/effectiveType.ts packages/core/metadata/commonObjects/fillValue/standardMember.test.ts packages/core/metadata/standardMembers/declarations.test.ts packages/core/metadata/appliedObjects/*/standardMembers.ts
git commit -m "feat: :sparkles: включить даты стандартных реквизитов"
```

Expected: PASS; таблица покрывает ровно 14 согласованных деклараций.

---

### Task 3: Import начальной даты и снимок XML

**Files:**
- Modify: `packages/core/metadata/importFromXml/dependentItems.test.ts`
- Modify: `packages/core/metadata/importFromXml/fillValueImport.test.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.fillValue.test.ts`
- Modify: `packages/core/metadata/ruleRuntime/property/fromYAMLToXML.test.ts`

**Interfaces:**
- Consumes: существующие `normalizeImportedDependentItems(...)` и `ConfigurationIndexCollector`.
- Produces: начальная дата удаляется после сборки полного элемента, а `{ xsiType, xmlText }` остаются в снимке.

- [ ] **Step 1: Написать модульную проверку даты**

В `dependentItems.test.ts` создать реквизит `{ Тип: "ДатаВремя", ЗначениеЗаполнения: "01.01.0001 00:00:00" }`, candidate с XML:

```ts
xmlValue: { "_xsi:type": "xs:dateTime", "#text": "0001-01-01T00:00:00" }
```

Проверить `normalizeImportedDependentItems(...) === 1`, отсутствие `ЗначениеЗаполнения` и entity снимка:

```ts
{
  logicalAddress: "Справочник.Товары.Attribute.Момент.Property.fillValue",
  sourceProjectPath: "Справочник/Товары/Свойства.yaml",
  xml: { xsiType: "xs:dateTime", xmlText: "0001-01-01T00:00:00" },
}
```

- [ ] **Step 2: Добавить сквозной случай без изменения XML-фикстуры**

В `fillValueImport.test.ts` копировать fixture во временный каталог и строковой заменой в копии сформировать реквизит `ДатаВремя` с `<FillValue xsi:type="xs:dateTime">0001-01-01T00:00:00</FillValue>`. После `prepareImportYaml(...)` проверить отсутствие поля и сохранённые `xsiType/xmlText` в collector.

- [ ] **Step 3: Защитить ручной YAML и обратную sync**

В `yamlFactExtractor.fillValue.test.ts` проверить, что явно записанная начальная дата одиночного `ДатаВремя` создаёт ровно одну error diagnostic на `/Реквизиты/Момент/ЗначениеЗаполнения` с текстом `неявное значение`, а содержательная дата проходит.

В `ruleRuntime/property/fromYAMLToXML.test.ts` использовать существующий `fillValueTestRule()` и configuration snapshot:

- при отсутствующем YAML-поле восстановить `{ "_xsi:type": "xs:dateTime", "#text": "0001-01-01T00:00:00" }`;
- при явной содержательной дате `09.08.2026 12:30:00` ожидать новый `xs:dateTime`, а не snapshot;
- без snapshot и без поля сохранить существующее каноническое пустое поведение правила.

- [ ] **Step 4: Запустить слой import и создать коммит тестов**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/dependentItems.test.ts metadata/importFromXml/fillValueImport.test.ts metadata/validation/yamlFactExtractor.fillValue.test.ts metadata/ruleRuntime/property/fromYAMLToXML.test.ts --no-isolate
pnpm type-check
pnpm duplicates -- --base 86fc64d5b
git add packages/core/metadata/importFromXml/dependentItems.test.ts packages/core/metadata/importFromXml/fillValueImport.test.ts packages/core/metadata/validation/yamlFactExtractor.fillValue.test.ts packages/core/metadata/ruleRuntime/property/fromYAMLToXML.test.ts
git commit -m "test: :white_check_mark: защитить импорт начальной даты"
```

Expected: PASS; production-код этого шага не нужен, если Tasks 1–2 полностью выразили договор через существующий dependent import.

---

## Plan Verification

```bash
pnpm test
pnpm test:architecture
pnpm duplicates -- --base 86fc64d5b
git diff --check
```

Expected: все команды успешны, XML-фикстуры не изменены, предупреждение `проверка значения для типа dateTime не поддержана` больше не создаётся. Реализация `!xml` выполняется следующим планом.
