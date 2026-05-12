# Metadata Enumeration Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Привести `metadataEnumeration` к стандартному набору applied object тестов: YAML import/export, YAML round-trip и sync IO.

**Architecture:** XML-тесты уже соответствуют applied object шаблону, поэтому работа сосредоточена на YAML и синхронизации. Основной путь должен идти через существующие правила `MetadataEnumerationRules` и helper'ы из `~/tests/appliedObject`; рабочий код менять только если новые стандартные тесты выявят несимметричное поведение `MetadataEnumerationValues`.

**Tech Stack:** TypeScript, Vitest, pnpm, YAML/XML orchestration helpers из `packages/core`.

---

## File Structure

- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/full.ts`
  - Добавить `fullYAML: MetadataEnumerationYAML` для стандартных YAML-тестов.
- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/minimal.ts`
  - Добавить `minimalYAML: MetadataEnumerationYAML`.
- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/fromYAML.test.ts`
  - Оставить существующие граф-тесты.
  - Добавить стандартные applied object проверки импорта и YAML round-trip.
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/toYAML.test.ts`
  - Проверить экспорт `undefined`, `full`, `minimal`.
- Modify if tests require it: `packages/core/metadata/appliedObjects/metadataEnumeration/valuesFromYAML.ts`
  - Сделать импорт YAML-значений перечисления симметричным с `MetadataEnumerationValueRules`, не ломая graph-поведение.
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/convertFromXML.test.ts`
  - Проверить XML -> `Свойства.yaml`.
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/syncToXML.test.ts`
  - Проверить `Свойства.yaml` -> XML.
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/sync/data.ts`
  - Ожидаемая строка `Свойства.yaml`.
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/sync/xml/ПеречислениеВсеСвойства.xml`
  - Копия существующего `__fixtures__/full.xml`.
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/sync/nkdk/ПеречислениеВсеСвойства/Свойства.yaml`
  - YAML, совпадающий с `readEnumerationYAML`.

---

### Task 1: Add YAML Fixture Data

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/full.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/minimal.ts`
- Test: `packages/core/metadata/appliedObjects/metadataEnumeration/fromYAML.test.ts`

- [ ] **Step 1: Add `MetadataEnumerationYAML` imports**

Update the first line of `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/full.ts`:

```typescript
import { MetadataEnumeration, MetadataEnumerationYAML } from "../types"
```

Update the first line of `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/minimal.ts`:

```typescript
import { MetadataEnumeration, MetadataEnumerationYAML } from "../types"
```

- [ ] **Step 2: Add `fullYAML` to `full.ts`**

Append this export after `full` in `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/full.ts`:

```typescript
export const fullYAML: MetadataEnumerationYAML = {
  БыстрыйВыбор: "Ложь",
  ИсторияВыбораПриВводе: "НеИспользовать",
  Команды: {
    Команда1: "ПанельНавигацииВажное",
  },
  Комментарий: "Комментарий",
  ОсновнаяФормаДляВыбора: "Enum.ПеречислениеВсеСвойства.Form.ФормаВыбора",
  ОсновнаяФормаСписка: "Enum.ПеречислениеВсеСвойства.Form.ФормаСписка",
  Пояснение: "Пояснение\n",
  ПредставлениеСписка: "Представление списка",
  РасширенноеПредставлениеСписка: "Расширенное представление списка",
  Синоним: "Синоним",
  СтандартныеРеквизиты: {
    Порядок: {
      Синоним: "Другой синоним порядок",
    },
    Ссылка: {
      Синоним: "Другой синоним",
    },
  },
  Характеристики: [
    {
      ВидыХарактеристик: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов",
      ЗначенияХарактеристик: "Catalog.СправочникПолный",
      ПолеВида: "Catalog.СправочникПолный.Attribute.Реквизит1",
      ПолеКлюча: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов.StandardAttribute.Ref",
      ПолеОбъекта: "Catalog.СправочникПолный.Attribute.Реквизит1",
      ПолеПутиКДанным: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов.StandardAttribute.Ref",
    },
  ],
  Значения: {
    ЗначениеПеречисления1: {
      Синоним: "Синоним",
      Комментарий: "Комментарий",
    },
    ЗначениеПеречисления2: {
      Синоним: "Синоним 2",
      Комментарий: "Комментарий 2",
    },
  },
  ИспользоватьСтандартныеКоманды: "Истина",
} satisfies MetadataEnumerationYAML
```

- [ ] **Step 3: Add `minimalYAML` to `minimal.ts`**

Append this export after `minimal` in `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/minimal.ts`:

```typescript
export const minimalYAML: MetadataEnumerationYAML = {
  Синоним: "Перечисление по умолчанию",
} satisfies MetadataEnumerationYAML
```

- [ ] **Step 4: Run existing enumeration YAML tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataEnumeration/fromYAML.test.ts
```

Expected: PASS. This task only adds fixture exports and should not affect existing tests.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/full.ts \
  packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/minimal.ts
git commit -m "test: :white_check_mark: добавить yaml-фикстуры перечисления"
```

---

### Task 2: Standardize fromYAML Tests

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/fromYAML.test.ts`
- Modify if needed: `packages/core/metadata/appliedObjects/metadataEnumeration/valuesFromYAML.ts`
- Test: `packages/core/metadata/appliedObjects/metadataEnumeration/fromYAML.test.ts`

- [ ] **Step 1: Replace the direct import smoke tests with applied object helper tests**

At the top of `packages/core/metadata/appliedObjects/metadataEnumeration/fromYAML.test.ts`, add these imports and keep the existing graph imports:

```typescript
import { testExportAppliedObjectToYAML, testImportAppliedObjectFromYAML } from "~/tests/appliedObject"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import { MetadataEnumerationRules } from "./rules"
import { MetadataEnumeration } from "./types"
```

Replace the first `describe("importMetadataEnumerationFromYAML", ...)` block with:

```typescript
describe("import MetadataEnumeration from YAML", () => {
  it("imports undefined", () => {
    const result = testImportAppliedObjectFromYAML<MetadataEnumeration>({
      rule: MetadataEnumerationRules,
      yaml: undefined,
      name: "СтатусЗаказа",
    })
    expect(result).toBeUndefined()
  })

  it("imports full fixture", () => {
    const result = testImportAppliedObjectFromYAML<MetadataEnumeration>({
      rule: MetadataEnumerationRules,
      yaml: fullYAML,
      name: "ПеречислениеВсеСвойства",
    })
    expect(result).toEqual(full)
  })

  it("imports minimal fixture", () => {
    const result = testImportAppliedObjectFromYAML<MetadataEnumeration>({
      rule: MetadataEnumerationRules,
      yaml: minimalYAML,
      name: "ПеречислениеПоУмолчанию",
    })
    expect(result).toEqual(minimal)
  })

  it("round-trip: full — import затем export даёт тот же YAML (parsed)", () => {
    const imported = testImportAppliedObjectFromYAML<MetadataEnumeration>({
      rule: MetadataEnumerationRules,
      yaml: fullYAML,
      name: "ПеречислениеВсеСвойства",
    })
    const exported = testExportAppliedObjectToYAML({
      rule: MetadataEnumerationRules,
      data: imported,
    })
    expect(exported).toEqual(fullYAML)
  })
})
```

Keep `describe("importMetadataEnumerationFromYAML — граф значений", ...)` below it.

- [ ] **Step 2: Run the new fromYAML test and verify the expected failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataEnumeration/fromYAML.test.ts
```

Expected before the fix: FAIL in `imports full fixture` if `enumValues` items lose `Синоним` or `Комментарий`. This confirms the current custom importer only preserves value names.

- [ ] **Step 3: Make enumeration value YAML import use the item rule**

Modify `packages/core/metadata/appliedObjects/metadataEnumeration/valuesFromYAML.ts`.

Add imports:

```typescript
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { MetadataEnumerationValueRules } from "./rules"
```

Replace `importMetadataEnumerationValuesFromYAML` with:

```typescript
export const importMetadataEnumerationValuesFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataEnumerationValuesYAML | undefined
): MetadataEnumerationValues | undefined => {
  if (!data) return undefined

  const results = Object.entries(data).map(([name, value]): MetadataEnumerationValue =>
    importMetadataItemFromYAML({
      context,
      yaml: value,
      rule: MetadataEnumerationValueRules,
      name,
    }) as MetadataEnumerationValue
  )

  return results.length > 0 ? results : undefined
}
```

This keeps the custom graph builder intact while letting `MetadataEnumerationValueRules` import `Синоним`, `Комментарий` and future YAML fields consistently.

- [ ] **Step 4: Run the fromYAML test again**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataEnumeration/fromYAML.test.ts
```

Expected: PASS. Existing graph tests must still pass.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/appliedObjects/metadataEnumeration/fromYAML.test.ts \
  packages/core/metadata/appliedObjects/metadataEnumeration/valuesFromYAML.ts
git commit -m "test: :white_check_mark: стандартизировать импорт yaml перечисления"
```

---

### Task 3: Add toYAML Tests

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/toYAML.test.ts`
- Test: `packages/core/metadata/appliedObjects/metadataEnumeration/toYAML.test.ts`

- [ ] **Step 1: Create the test file**

Create `packages/core/metadata/appliedObjects/metadataEnumeration/toYAML.test.ts`:

```typescript
import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToYAML } from "~/tests/appliedObject"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import { MetadataEnumerationRules } from "./rules"
import { MetadataEnumeration } from "./types"

describe("export MetadataEnumeration to YAML", () => {
  it("exports undefined", () => {
    const result = testExportAppliedObjectToYAML<MetadataEnumeration>({
      rule: MetadataEnumerationRules,
      data: undefined,
    })
    expect(result).toBeUndefined()
  })

  it("exports full fixture", () => {
    const result = testExportAppliedObjectToYAML({
      rule: MetadataEnumerationRules,
      data: full,
    })
    expect(result).toEqual(fullYAML)
  })

  it("exports minimal fixture", () => {
    const result = testExportAppliedObjectToYAML({
      rule: MetadataEnumerationRules,
      data: minimal,
    })
    expect(result).toEqual(minimalYAML)
  })
})
```

- [ ] **Step 2: Run toYAML test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataEnumeration/toYAML.test.ts
```

Expected: PASS. If only `full` fails, compare the result with `fullYAML` and adjust fixture data only when the exported YAML is semantically correct and matches the project patterns from `metadataDocument`/`metadataCatalog`.

- [ ] **Step 3: Run YAML pair**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run \
  metadata/appliedObjects/metadataEnumeration/fromYAML.test.ts \
  metadata/appliedObjects/metadataEnumeration/toYAML.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/appliedObjects/metadataEnumeration/toYAML.test.ts \
  packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/full.ts \
  packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/minimal.ts
git commit -m "test: :white_check_mark: покрыть экспорт yaml перечисления"
```

---

### Task 4: Add Sync Fixtures

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/sync/data.ts`
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/sync/xml/ПеречислениеВсеСвойства.xml`
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/sync/nkdk/ПеречислениеВсеСвойства/Свойства.yaml`
- Test: no new test yet; files are used by Task 5.

- [ ] **Step 1: Create sync directories**

Run:

```bash
mkdir -p packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/sync/xml
mkdir -p packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/sync/nkdk/ПеречислениеВсеСвойства
```

Expected: directories exist.

- [ ] **Step 2: Copy the XML source without changing the original fixture**

Run:

```bash
cp packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/full.xml \
  packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/sync/xml/ПеречислениеВсеСвойства.xml
```

Expected: `sync/xml/ПеречислениеВсеСвойства.xml` is byte-for-byte equal to `__fixtures__/full.xml`.

- [ ] **Step 3: Create `Свойства.yaml`**

Create `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/sync/nkdk/ПеречислениеВсеСвойства/Свойства.yaml`:

```yaml
Синоним: Синоним
Комментарий: Комментарий
ИспользоватьСтандартныеКоманды: Истина
СтандартныеРеквизиты:
  Порядок:
    Синоним: Другой синоним порядок
  Ссылка:
    Синоним: Другой синоним
Характеристики:
  - ВидыХарактеристик: ChartOfCharacteristicTypes.ХарактеристикиОбъектов
    ЗначенияХарактеристик: Catalog.СправочникПолный
    ПолеКлюча: ChartOfCharacteristicTypes.ХарактеристикиОбъектов.StandardAttribute.Ref
    ПолеОбъекта: Catalog.СправочникПолный.Attribute.Реквизит1
    ПолеВида: Catalog.СправочникПолный.Attribute.Реквизит1
    ПолеПутиКДанным: ChartOfCharacteristicTypes.ХарактеристикиОбъектов.StandardAttribute.Ref
БыстрыйВыбор: Ложь
ОсновнаяФормаСписка: Enum.ПеречислениеВсеСвойства.Form.ФормаСписка
ОсновнаяФормаДляВыбора: Enum.ПеречислениеВсеСвойства.Form.ФормаВыбора
ПредставлениеСписка: Представление списка
РасширенноеПредставлениеСписка: Расширенное представление списка
Пояснение: |
  Пояснение
ИсторияВыбораПриВводе: НеИспользовать
Значения:
  ЗначениеПеречисления1:
    Синоним: Синоним
    Комментарий: Комментарий
  ЗначениеПеречисления2:
    Синоним: Синоним 2
    Комментарий: Комментарий 2
Команды:
  Команда1: ПанельНавигацииВажное
```

- [ ] **Step 4: Create `data.ts` with the same content**

Create `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/sync/data.ts`:

```typescript
export const readEnumerationYAML = `Синоним: Синоним
Комментарий: Комментарий
ИспользоватьСтандартныеКоманды: Истина
СтандартныеРеквизиты:
  Порядок:
    Синоним: Другой синоним порядок
  Ссылка:
    Синоним: Другой синоним
Характеристики:
  - ВидыХарактеристик: ChartOfCharacteristicTypes.ХарактеристикиОбъектов
    ЗначенияХарактеристик: Catalog.СправочникПолный
    ПолеКлюча: ChartOfCharacteristicTypes.ХарактеристикиОбъектов.StandardAttribute.Ref
    ПолеОбъекта: Catalog.СправочникПолный.Attribute.Реквизит1
    ПолеВида: Catalog.СправочникПолный.Attribute.Реквизит1
    ПолеПутиКДанным: ChartOfCharacteristicTypes.ХарактеристикиОбъектов.StandardAttribute.Ref
БыстрыйВыбор: Ложь
ОсновнаяФормаСписка: Enum.ПеречислениеВсеСвойства.Form.ФормаСписка
ОсновнаяФормаДляВыбора: Enum.ПеречислениеВсеСвойства.Form.ФормаВыбора
ПредставлениеСписка: Представление списка
РасширенноеПредставлениеСписка: Расширенное представление списка
Пояснение: |
  Пояснение
ИсторияВыбораПриВводе: НеИспользовать
Значения:
  ЗначениеПеречисления1:
    Синоним: Синоним
    Комментарий: Комментарий
  ЗначениеПеречисления2:
    Синоним: Синоним 2
    Комментарий: Комментарий 2
Команды:
  Команда1: ПанельНавигацииВажное`
```

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/sync
git commit -m "test: :white_check_mark: добавить sync-фикстуры перечисления"
```

---

### Task 5: Add IO Tests

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/convertFromXML.test.ts`
- Create: `packages/core/metadata/appliedObjects/metadataEnumeration/syncToXML.test.ts`
- Modify if needed: `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/sync/data.ts`
- Modify if needed: `packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/sync/nkdk/ПеречислениеВсеСвойства/Свойства.yaml`
- Test: `convertFromXML.test.ts`, `syncToXML.test.ts`

- [ ] **Step 1: Create `convertFromXML.test.ts`**

Create `packages/core/metadata/appliedObjects/metadataEnumeration/convertFromXML.test.ts`:

```typescript
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
import { readEnumerationYAML } from "./__fixtures__/sync/data"
import { MetadataEnumerationRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataEnumeration", () => {
  it("читает Enum из XML и записывает Свойства.yaml в outputDir", async () => {
    const { yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataEnumerationRules,
      name: "ПеречислениеВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedYAML: readEnumerationYAML,
    })
    expect(yaml.result).toBe(yaml.expected)
  })
})
```

- [ ] **Step 2: Create `syncToXML.test.ts`**

Create `packages/core/metadata/appliedObjects/metadataEnumeration/syncToXML.test.ts`:

```typescript
import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataEnumerationRules } from "./rules"

describe("syncAppliedObjectToXML — MetadataEnumeration", () => {
  it("читает Enum из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataEnumerationRules,
      name: "ПеречислениеВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: ["ПеречислениеВсеСвойства.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(result, path).toBe(expected)
    }
  })
})
```

- [ ] **Step 3: Run convert test and correct YAML ordering if needed**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataEnumeration/convertFromXML.test.ts
```

Expected: PASS. If it fails only because `yaml.result` orders keys differently, copy the exact `yaml.result` from the Vitest diff into both `__fixtures__/sync/data.ts` and `__fixtures__/sync/nkdk/ПеречислениеВсеСвойства/Свойства.yaml`. Do not change `full.xml`.

- [ ] **Step 4: Run sync test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataEnumeration/syncToXML.test.ts
```

Expected: PASS. If it fails because YAML omitted a property that exists in XML, add that property to `Свойства.yaml` and `readEnumerationYAML`; if it fails because XML export emits a wrong semantic value, fix the relevant rule or type-specific YAML importer/exporter minimally.

- [ ] **Step 5: Run all enumeration tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataEnumeration
```

Expected: PASS for `fromXML`, `toXML`, `fromYAML`, `toYAML`, `convertFromXML`, `syncToXML`.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/appliedObjects/metadataEnumeration/convertFromXML.test.ts \
  packages/core/metadata/appliedObjects/metadataEnumeration/syncToXML.test.ts \
  packages/core/metadata/appliedObjects/metadataEnumeration/__fixtures__/sync \
  packages/core/metadata/appliedObjects/metadataEnumeration/rules.ts \
  packages/core/metadata/appliedObjects/metadataEnumeration/valuesFromYAML.ts
git commit -m "test: :white_check_mark: покрыть синхронизацию перечисления"
```

If `rules.ts` or `valuesFromYAML.ts` was not changed during this task, omit it from `git add`.

---

### Task 6: Final Verification

**Files:**
- No intended source changes.
- Test: project-level verification.

- [ ] **Step 1: Check status**

Run:

```bash
git status --short
```

Expected: clean working tree before final verification, or only intentional uncommitted changes from the previous task.

- [ ] **Step 2: Regenerate Langium files**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: generator finishes successfully.

- [ ] **Step 3: Run full project tests**

Run:

```bash
pnpm test
```

Expected: all project tests pass. Baseline in this worktree before implementation was green: `core` had 405 passed files and `cli` had 8 passed files, with existing skipped tests.

- [ ] **Step 4: Commit any generated or final test adjustments**

If `git status --short` shows intentional changes after verification, commit them:

```bash
git add packages/core/metadata/appliedObjects/metadataEnumeration
git commit -m "test: :white_check_mark: привести тесты перечисления к стандарту"
```

If the working tree is clean, skip this commit.
