# Predefined → rules.ts Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести `commonObjects/predefined/` (и симметрично `commonObjects/additionalIndex/`) с ручных конвертеров на декларативный `rules.ts`; удалить глобальный реестр `externalFileEnvelopes`; ввести флаг `yamlInline` для расплющивания обёртки в YAML и JSON-схеме; переименовать маркер `MetaDataObject` в `XMLRoot`.

**Архитектура:** `Predefined` становится `MetadataItemRule` с двумя свойствами — маркером `xmlRoot` (тип `"XMLRoot"`, несёт `container` и `rootAttributes`) и содержательным `items: PredefinedItemCollection` (с флагом `yamlInline: true`). XML-обёртка корневого тега выполняется существующим механизмом `MetaDataObject`-маркера (после переименования — `XMLRoot`). Свойства каталога с `filePath` оркестратор обрабатывает как обычные item-типы (`importMetadataItemFromXML`/`exportMetadataItemToXML`), без отдельного реестра.

**Tech Stack:** TypeScript, vitest, pnpm-monorepo (`packages/core`).

**Спецификация:** `docs/superpowers/specs/2026-04-25-predefined-rules-migration-design.md`.

---

## File Structure

**Создаются:**
- `packages/core/metadata/commonObjects/predefined/index.ts` — триггер регистрации.
- `packages/core/metadata/commonObjects/predefined/fromXML.test.ts` — round-trip для импорта.
- `packages/core/metadata/commonObjects/predefined/toXML.test.ts` — round-trip для экспорта.
- `packages/core/metadata/commonObjects/predefined/fromYAML.test.ts` — round-trip для YAML-импорта.
- `packages/core/metadata/commonObjects/predefined/toYAML.test.ts` — round-trip для YAML-экспорта.
- `packages/core/metadata/commonObjects/additionalIndex/index.ts` — триггер регистрации (если ещё нет).
- `packages/core/metadata/commonObjects/additionalIndex/__fixtures__/full.xml` — фикстура (если ещё нет).
- `packages/core/metadata/commonObjects/additionalIndex/fromXML.test.ts`, `toXML.test.ts`, `fromYAML.test.ts`, `toYAML.test.ts` — round-trip-тесты.
- `packages/core/metadata/orchestration/metadataItem/yamlInline.test.ts` — тесты нового флага `yamlInline`.
- `.agents/architecture-orchestration.md` — архитектурные инварианты слоя `orchestration`.

**Переименовываются:**
- `packages/core/metadata/commonObjects/metaDataObject/` → `packages/core/metadata/commonObjects/xmlRoot/` (вся папка).
- Внутри файлов: тип `MetaDataObject` → `XMLRoot`, интерфейс `MetaDataObjectPropertyRule` → `XMLRootPropertyRule`, функции `importMetaDataObjectFromXML`/`exportMetaDataObjectToXML` → `importXMLRootFromXML`/`exportXMLRootToXML`.

**Существенно меняются:**
- `packages/core/metadata/commonObjects/predefined/rules.ts` — полная перепись (`PredefinedRules: MetadataItemRule`).
- `packages/core/metadata/commonObjects/predefined/types.ts` — полная перепись (вывод типов из правила, регистрация).
- `packages/core/metadata/commonObjects/additionalIndex/rules.ts` — полная перепись.
- `packages/core/metadata/commonObjects/additionalIndex/types.ts` — полная перепись.
- `packages/core/metadata/orchestration/property/types.ts` — добавление `yamlInline?: boolean` в `BasePropertyRule`; замена литерала `"MetaDataObject"` → `"XMLRoot"` в union (строки 233, 286).
- `packages/core/metadata/orchestration/property/registry.ts` — переключение `Predefined` на item-тип (строки 149–155, 413–424, 791–793); строки `493`, `829` — замена `MetaDataObject` → `XMLRoot`.
- `packages/core/metadata/orchestration/metadataItem/fromXML.ts` — поиск маркера по типу `"XMLRoot"` вместо `"MetaDataObject"` (строки 16–23).
- `packages/core/metadata/orchestration/metadataItem/toXML.ts` — то же (строки 41–47); удаление обёртки `MetaDataObject:` в результирующем объекте (теперь корневой тег = `container` напрямую).
- `packages/core/metadata/orchestration/metadataItem/toYAML.ts` — поддержка `yamlInline`.
- `packages/core/metadata/orchestration/metadataItem/fromYAML.ts` — поддержка `yamlInline`.
- `packages/core/metadata/orchestration/metadataItem/toJSONSchema.ts` — поддержка `yamlInline`.
- `packages/core/metadata/orchestration/appliedObject/convertFromXML.ts` — удаление `externalFileEnvelopes`-логики (строки 30–42).
- `packages/core/metadata/orchestration/appliedObject/syncToXML.ts` — то же (строки 101–120 и далее `mergeItemIds`).
- `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts` — `metaDataObject` → `xmlRoot`, `type: "MetaDataObject"` → `type: "XMLRoot"`.
- `packages/core/metadata/appliedObjects/metadataCatalog/types.ts` — переход с `PredefinedItemsXML/PredefinedItemsYAML` на новые выводимые типы.
- `AGENTS.md` — добавление ссылки на `architecture-orchestration.md`.

**Удаляются:**
- `packages/core/metadata/commonObjects/predefined/fromXML.ts`, `toXML.ts`, `fromYAML.ts`, `toYAML.ts`, `toJSONSchema.ts`.
- `packages/core/metadata/commonObjects/additionalIndex/fromXML.ts`, `toXML.ts`, `fromYAML.ts`, `toYAML.ts` (если есть).
- Константа `PredefinedDataEnvelope`, `AdditionalIndexesEnvelope`, реестр `externalFileEnvelopes`, интерфейс `ExternalFileEnvelope`.
- `packages/core/metadata/commonObjects/metaDataObject/` (после переименования).

---

## Соглашения по выполнению

- Все команды запускайте из корня репозитория `/Users/nikita/git/nakidka-core`, кроме явно указанных.
- Конкретный тестовый файл — `pnpm --filter core test <относительный путь от packages/core>`. Пример: `pnpm --filter core test metadata/commonObjects/predefined/fromXML.test.ts`.
- Полный прогон — `pnpm test` из корня (рекурсивно по всем пакетам).
- Стиль — Prettier (`.prettierrc.json`: semi false, tabWidth 2, double quotes, trailingComma es5, printWidth 120).
- Коммиты — Conventional Commits с gitmoji на русском языке. Примеры рядом: `refactor: :recycle: ...`, `feat: :sparkles: ...`. Каждый коммит — атомарный (один шаг плана).
- Имена идентификаторов на английском, текст комментариев и сообщений — на русском.

---

## Phase 0: Подготовка

### Task 0.1: Закоммитить спецификацию

**Files:**
- Create: `docs/superpowers/specs/2026-04-25-predefined-rules-migration-design.md` (уже создан; убедитесь, что не закоммичен).

- [ ] **Step 1: Проверить, есть ли спека в индексе**

```bash
git status docs/superpowers/specs/2026-04-25-predefined-rules-migration-design.md
```
Ожидание: untracked or modified.

- [ ] **Step 2: Закоммитить**

```bash
git add docs/superpowers/specs/2026-04-25-predefined-rules-migration-design.md
git commit -m "docs: :memo: спецификация миграции Predefined на rules.ts"
```

- [ ] **Step 3: Закоммитить план**

```bash
git add docs/superpowers/plans/2026-04-25-predefined-rules-migration.md
git commit -m "docs: :memo: план миграции Predefined на rules.ts"
```

---

## Phase 1: Переименование `MetaDataObject` → `XMLRoot`

Цель: переименовать существующий маркер без изменения функциональности. После фазы все тесты должны проходить.

### Task 1.1: Переименовать папку `metaDataObject/` → `xmlRoot/`

**Files:**
- Rename: `packages/core/metadata/commonObjects/metaDataObject/` → `packages/core/metadata/commonObjects/xmlRoot/`

- [ ] **Step 1: Переименовать папку через git**

```bash
git mv packages/core/metadata/commonObjects/metaDataObject packages/core/metadata/commonObjects/xmlRoot
```

- [ ] **Step 2: Проверить листинг**

```bash
ls packages/core/metadata/commonObjects/xmlRoot/
```
Ожидание: `fromXML.test.ts  fromXML.ts  toXML.test.ts  toXML.ts  types.ts`.

- [ ] **Step 3: Коммит (без правок содержимого — оно временно несогласовано с именем папки, но компилируется)**

```bash
git commit -m "refactor: :truck: metaDataObject → xmlRoot (переименование папки)"
```

### Task 1.2: Переименовать тип `MetaDataObject` → `XMLRoot` в `xmlRoot/types.ts`

**Files:**
- Modify: `packages/core/metadata/commonObjects/xmlRoot/types.ts`

- [ ] **Step 1: Открыть файл и заменить весь текст**

```ts
import type { BasePropertyRule } from "~/metadata/orchestration/property/types"

/** Правило property-типа XMLRoot — маркер обёртки прикладного объекта/внешнего файла в XML.
 *
 * Сообщает оркестратору:
 * - при импорте: использовать `xml[container]` как корень для обхода остальных свойств;
 * - при экспорте: вернуть результат, обёрнутый в `{ [container]: { ...rootAttributes, ...result } }`.
 *
 * Не создаёт значения в модели данных (все обработчики возвращают undefined).
 */
export interface XMLRootPropertyRule extends BasePropertyRule {
  type: "XMLRoot"
  /** Имя корневого XML-тега, например "Catalog", "PredefinedData", "AdditionalIndexes" */
  container: string
  /** Атрибуты корневого тега: xmlns-декларации и version */
  rootAttributes: Record<string, string>
  forReferenceOnly: true
}
```

- [ ] **Step 2: Прогнать тесты пакета (увидим красноту во множестве мест — это ожидаемо)**

```bash
pnpm --filter core test 2>&1 | tail -30
```
Ожидание: ошибки компиляции в местах, где импортируется `MetaDataObjectPropertyRule` или используется литерал `"MetaDataObject"`. Это норма — исправим в Task 1.3–1.6.

### Task 1.3: Переименовать функции в `xmlRoot/fromXML.ts` и `toXML.ts`

**Files:**
- Modify: `packages/core/metadata/commonObjects/xmlRoot/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/xmlRoot/toXML.ts`

- [ ] **Step 1: Полностью переписать `fromXML.ts`**

```ts
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"

/** Маркерный обработчик: реальная работа выполняется оркестратором в importMetadataItemFromXML. */
export const importXMLRootFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  _xml: unknown
): undefined => {
  return undefined
}

registerTypeRule("XMLRoot", "importFromXML", importXMLRootFromXML)
```

- [ ] **Step 2: Полностью переписать `toXML.ts`**

```ts
import { registerTypeRule } from "~/metadata/orchestration"

export const exportXMLRootToXML = (): undefined => {
  return undefined
}

registerTypeRule("XMLRoot", "exportToXML", exportXMLRootToXML)
```

### Task 1.4: Обновить тесты `xmlRoot/fromXML.test.ts` и `toXML.test.ts`

**Files:**
- Modify: `packages/core/metadata/commonObjects/xmlRoot/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/xmlRoot/toXML.test.ts`

- [ ] **Step 1: Открыть `fromXML.test.ts` и заменить ссылки**

Замените:
- `import { importMetaDataObjectFromXML } from "./fromXML"` → `import { importXMLRootFromXML } from "./fromXML"`
- `describe("importMetaDataObjectFromXML", ...)` → `describe("importXMLRootFromXML", ...)`
- В литерале `{ type: "MetaDataObject", ... }` → `{ type: "XMLRoot", ... }`
- Все упоминания `importMetaDataObjectFromXML(...)` → `importXMLRootFromXML(...)`

- [ ] **Step 2: Симметрично для `toXML.test.ts`** — `exportMetaDataObjectToXML` → `exportXMLRootToXML`.

- [ ] **Step 3: Прогнать тесты этой папки**

```bash
pnpm --filter core test metadata/commonObjects/xmlRoot
```
Ожидание: тесты в этой папке — зелёные. Остальной проект пока не компилируется.

### Task 1.5: Обновить `orchestration/property/types.ts`

**Files:**
- Modify: `packages/core/metadata/orchestration/property/types.ts:233,286`

- [ ] **Step 1: Найти и заменить `"MetaDataObject"` → `"XMLRoot"` в union-литерале (строка ~233)**

Используйте `grep`/IDE чтобы найти точно один литерал в этом файле. Замените только в этом файле.

- [ ] **Step 2: Найти и заменить `MetaDataObjectPropertyRule` → `XMLRootPropertyRule` в импорте и union (строка ~286)**

Не забудьте про путь импорта `~/metadata/commonObjects/metaDataObject/types` → `~/metadata/commonObjects/xmlRoot/types`.

- [ ] **Step 3: Проверить, что компилируется (игнорируя пока другие файлы)**

```bash
pnpm --filter core test metadata/commonObjects/xmlRoot 2>&1 | tail -10
```

### Task 1.6: Обновить `orchestration/property/registry.ts`

**Files:**
- Modify: `packages/core/metadata/orchestration/property/registry.ts:493,829`

- [ ] **Step 1: Заменить `"MetaDataObject"` → `"XMLRoot"` (две позиции)**

Найти строки 493 и 829 (в `typeRules` и `PropertyRuleTypeToString`). Заменить ровно литерал.

### Task 1.7: Обновить `orchestration/metadataItem/fromXML.ts` и `toXML.ts`

**Files:**
- Modify: `packages/core/metadata/orchestration/metadataItem/fromXML.ts:19`
- Modify: `packages/core/metadata/orchestration/metadataItem/toXML.ts:43,47`

- [ ] **Step 1: В `fromXML.ts` заменить `(p) => p.type === "MetaDataObject"` → `(p) => p.type === "XMLRoot"` и переименовать переменную `metaDataObjectProp` → `xmlRootProp`**

- [ ] **Step 2: В `toXML.ts`** заменить:
- `(p) => p.type === "MetaDataObject"` → `(p) => p.type === "XMLRoot"`
- переменную `metaDataObjectProp` → `xmlRootProp`
- В возвращаемом объекте: `return { MetaDataObject: { ...rootAttributes, [container]: finalResult } }` → **новая семантика** — корневой тег теперь = `container`:
```ts
return { [container]: { ...rootAttributes, ...(finalResult as Record<string, unknown>) } }
```

**Внимание:** это семантическое изменение. Раньше `MetaDataObject` оборачивал результат в дополнительный тег `<MetaDataObject>`. Для текущего кода (catalog) `container` = `"Catalog"`, и обёртка получалась `<MetaDataObject><Catalog>...</Catalog></MetaDataObject>`. Теперь нужна та же XML-структура. **Уточнение:** прежде чем менять, проверьте в фикстуре `appliedObjects/metadataCatalog/__fixtures__/full.xml`, есть ли реально внешний тег `<MetaDataObject>`.

- [ ] **Step 3: Прочитать первые строки `metadataCatalog/__fixtures__/full.xml`**

```bash
head -3 packages/core/metadata/appliedObjects/metadataCatalog/__fixtures__/full.xml
```

- [ ] **Step 4: Принять решение и применить**

Если в фикстуре корневой тег — `<MetaDataObject>`, то прежнее поведение `{ MetaDataObject: { ...rootAttributes, [container]: finalResult } }` корректно. Тогда **сохраняем структуру вывода**, переименование касается только имени переменной (`metaDataObjectProp` → `xmlRootProp`) и литерала `"MetaDataObject"` → `"XMLRoot"` в `find(p => p.type === ...)`. **НЕ меняем** структуру результата на этом шаге — `MetaDataObject` остаётся именем корневого XML-тега для прикладных объектов.

В этом случае для `Predefined` (где корень — `<PredefinedData>`, без обёртки `<MetaDataObject>`) логика будет другой — реализуем в Phase 3 через отдельный механизм или дополнительное поле маркера. **Запишите эту развилку в комментарий к коду** (`// для прикладных объектов корнем XML-файла остаётся <MetaDataObject>; для внешних файлов вроде Predefined корнем является сам container — обрабатывается на стороне convertFromXML/syncToXML после Phase 5`).

- [ ] **Step 5: Добавить второй обработчик-флаг в `XMLRootPropertyRule`**

Добавьте в `commonObjects/xmlRoot/types.ts` опциональное поле:
```ts
export interface XMLRootPropertyRule extends BasePropertyRule {
  type: "XMLRoot"
  container: string
  rootAttributes: Record<string, string>
  forReferenceOnly: true
  /** Если true, корневой тег XML — это сам container (без внешней обёртки <MetaDataObject>).
   *  Используется для внешних файлов вроде Ext/Predefined.xml. По умолчанию (false) корень = <MetaDataObject>. */
  isFileRoot?: true
}
```

- [ ] **Step 6: В `metadataItem/toXML.ts` учесть флаг**

```ts
const xmlRootProp = Object.values(rule.properties).find((p) => p.type === "XMLRoot")
if (xmlRootProp) {
  const container = (xmlRootProp as any).container as string
  const rootAttributes = (xmlRootProp as any).rootAttributes as Record<string, string>
  const isFileRoot = (xmlRootProp as any).isFileRoot === true
  if (isFileRoot) {
    return { [container]: { ...rootAttributes, ...(finalResult as Record<string, unknown>) } }
  }
  return { MetaDataObject: { ...rootAttributes, [container]: finalResult } }
}
```

- [ ] **Step 7: Симметрично в `metadataItem/fromXML.ts` учесть флаг**

```ts
const xmlRootProp = Object.values(rule.properties).find((p) => p.type === "XMLRoot")
if (xmlRootProp) {
  const container = (xmlRootProp as any).container as string
  const isFileRoot = (xmlRootProp as any).isFileRoot === true
  if (isFileRoot) {
    // Корень XML уже = container; убираем атрибуты и оставляем дочерние теги.
    // На стороне importer контейнер раскрыт в xml; никаких xml[container] не требуется.
    // Но если обёртка ещё есть (передан полный документ), снимаем её.
    if (xml && typeof xml === "object" && container in (xml as object)) {
      xml = (xml as any)[container]
    }
  } else {
    xml = xml?.[container]
  }
}
```

### Task 1.8: Обновить `MetadataCatalogRules` в `appliedObjects/metadataCatalog/rules.ts`

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts:11-18`

- [ ] **Step 1: Переименовать ключ свойства и литерал типа**

```ts
xmlRoot: {
  type: "XMLRoot",
  container: "Catalog",
  rootAttributes: V8_MDCLASSES_ROOT,
  forReferenceOnly: true,
  toYAML: false,
  fromYAML: false,
},
```

(`isFileRoot` НЕ устанавливаем — для прикладного каталога корнем XML остаётся `<MetaDataObject>`.)

- [ ] **Step 2: Найти все остальные обращения к `metaDataObject` в проекте, которые могут ломаться**

```bash
grep -rn "\.metaDataObject\b\|metaDataObject:" packages/core --include="*.ts" | grep -v "__fixtures__" | head -20
```

Если есть — переименовать в `xmlRoot`.

### Task 1.9: Прогон полного теста после переименования

- [ ] **Step 1: Запустить `pnpm test`**

```bash
pnpm test 2>&1 | tail -40
```
Ожидание: все тесты проходят.

- [ ] **Step 2: Если есть падения, исправить (вероятнее всего — пропущенные `MetaDataObject` где-то в фикстурах или в строковых литералах)**

```bash
grep -rn "MetaDataObject\|metaDataObject" packages/core --include="*.ts" | grep -v "__fixtures__" | head
```

Дополнительно проверить XML-фикстуры — там корневой тег `<MetaDataObject>` сохраняется, фикстуры менять не нужно.

- [ ] **Step 3: Коммит**

```bash
git add -A
git commit -m "refactor: :recycle: переименовать MetaDataObject в XMLRoot, ввести флаг isFileRoot"
```

---

## Phase 2: Флаг `yamlInline` в оркестрации

Цель: ввести опциональный флаг `yamlInline?: boolean` на свойстве `BasePropertyRule`. Если у item-rule ровно одно содержательное свойство (без `forReferenceOnly: true`) с `yamlInline: true`, то YAML-сериализация и JSON-схема возвращают/принимают значение этого свойства напрямую, без обёртки.

### Task 2.1: Добавить поле `yamlInline?: boolean` в `BasePropertyRule`

**Files:**
- Modify: `packages/core/metadata/orchestration/property/types.ts` — секция `BasePropertyRule`.

- [ ] **Step 1: Добавить в конец `BasePropertyRule`**

```ts
  /**
   * Если true, при сериализации в YAML и JSON-схему значение этого свойства подставляется
   * напрямую как значение всего item-объекта (без обёртки ключом). Допустимо ровно одно
   * содержательное (не forReferenceOnly) свойство с этим флагом на правило.
   * Скоп — только YAML/JSON-схема. Модель данных и XML-сериализация не затрагиваются.
   */
  yamlInline?: boolean
```

- [ ] **Step 2: Прогнать typecheck (через тесты)**

```bash
pnpm --filter core test --reporter=basic 2>&1 | tail -10
```
Ожидание: всё компилируется, тесты зелёные (поведение пока не реализовано — флаг ничего не делает).

### Task 2.2: Создать тесты на `yamlInline` (red phase)

**Files:**
- Create: `packages/core/metadata/orchestration/metadataItem/yamlInline.test.ts`

- [ ] **Step 1: Написать тест-файл с тремя кейсами**

```ts
import { describe, expect, it } from "vitest"
import { exportMetadataItemToYAML, importMetadataItemFromYAML } from "~/metadata/orchestration"
import { exportMetadataItemToJSONSchema } from "./toJSONSchema"
import { mockContext } from "~/tests/mockContext"
import type { MetadataItemRule } from "../property/types"

const InlineRule = {
  itemType: "InlineTest",
  properties: {
    marker: {
      type: "XMLRoot",
      container: "Root",
      rootAttributes: { _xmlns: "ns" },
      forReferenceOnly: true,
    },
    payload: {
      type: "string",
      yamlInline: true,
    },
  },
} as const satisfies MetadataItemRule

describe("yamlInline flag", () => {
  it("export: значение payload подставляется как значение всего объекта", () => {
    const result = exportMetadataItemToYAML({
      context: mockContext(),
      data: { itemType: "InlineTest", payload: "hello", name: "X" } as any,
      rule: InlineRule,
    })
    expect(result).toBe("hello")
  })

  it("import: всё значение YAML кладётся в payload", () => {
    const result = importMetadataItemFromYAML({
      context: mockContext(),
      yaml: "hello",
      rule: InlineRule,
      name: "X",
    })
    expect(result).toMatchObject({ payload: "hello" })
  })

  it("toJSONSchema: схема = схема payload, а не объект со свойствами", () => {
    const schema = exportMetadataItemToJSONSchema({ context: mockContext(), rule: InlineRule })
    expect((schema as any).type).toBe("string")
  })
})
```

- [ ] **Step 2: Запустить тест и убедиться, что падает с понятным сообщением**

```bash
pnpm --filter core test metadata/orchestration/metadataItem/yamlInline.test.ts 2>&1 | tail -20
```
Ожидание: FAIL во всех трёх кейсах (поведение ещё не реализовано). Если `mockContext` называется иначе — найдите аналог в `packages/core/tests/` и подставьте.

### Task 2.3: Реализовать `yamlInline` в `metadataItem/toYAML.ts`

**Files:**
- Modify: `packages/core/metadata/orchestration/metadataItem/toYAML.ts`

- [ ] **Step 1: Открыть файл и понять текущую структуру (он простой, проксирует в `exportPropertiesToYAML`).**

```bash
cat packages/core/metadata/orchestration/metadataItem/toYAML.ts
```

- [ ] **Step 2: Добавить проверку `yamlInline` после сборки результата**

```ts
import { exportPropertiesToYAML } from "../property/toYAML"
// ... остальные импорты

export const exportMetadataItemToYAML = <Rule extends MetadataItemRule>(params: {
  context: ConfigurationContextWithExportToYAML
  data: ToMetadata<Rule["itemType"]> | undefined
  rule: Rule
}): unknown => {
  // ... существующая логика (получаем yamlObj через exportPropertiesToYAML)
  const yamlObj = exportPropertiesToYAML({ ... })

  // Поддержка yamlInline: если ровно одно свойство с флагом — возвращаем его значение напрямую.
  const inlineEntries = Object.entries(rule.properties).filter(
    ([, p]) => (p as any).yamlInline === true && (p as any).forReferenceOnly !== true
  )
  if (inlineEntries.length > 1) {
    throw new Error(
      `Rule "${rule.itemType}": yamlInline=true должно быть установлено максимум для одного свойства, найдено ${inlineEntries.length}`
    )
  }
  if (inlineEntries.length === 1) {
    const [key, prop] = inlineEntries[0]
    const yamlKey = (prop as any).yaml ?? key
    return (yamlObj as any)?.[yamlKey]
  }

  return yamlObj
}
```

- [ ] **Step 3: Запустить тест экспорта**

```bash
pnpm --filter core test metadata/orchestration/metadataItem/yamlInline.test.ts -t "export" 2>&1 | tail -10
```
Ожидание: PASS.

### Task 2.4: Реализовать `yamlInline` в `metadataItem/fromYAML.ts`

**Files:**
- Modify: `packages/core/metadata/orchestration/metadataItem/fromYAML.ts`

- [ ] **Step 1: Перед вызовом `importPropertiesFromYAML` — обернуть значение в объект, если нужно**

```ts
export const importMetadataItemFromYAML = <Rule extends MetadataItemRule>(params: {
  context: ConfigurationContextFromYAML
  yaml: unknown
  rule: Rule
  name: string
}): ToMetadata<Rule["itemType"]> | undefined => {
  const { yaml, rule } = params

  // Поддержка yamlInline: если у правила есть инлайн-свойство, оборачиваем входное значение.
  const inlineEntries = Object.entries(rule.properties).filter(
    ([, p]) => (p as any).yamlInline === true && (p as any).forReferenceOnly !== true
  )
  if (inlineEntries.length > 1) {
    throw new Error(
      `Rule "${rule.itemType}": yamlInline=true должно быть установлено максимум для одного свойства`
    )
  }
  let effectiveYaml = yaml
  if (inlineEntries.length === 1) {
    const [key, prop] = inlineEntries[0]
    const yamlKey = (prop as any).yaml ?? key
    effectiveYaml = { [yamlKey]: yaml }
  }

  // ... вызвать importPropertiesFromYAML с effectiveYaml вместо yaml
}
```

- [ ] **Step 2: Запустить тест импорта**

```bash
pnpm --filter core test metadata/orchestration/metadataItem/yamlInline.test.ts -t "import" 2>&1 | tail -10
```
Ожидание: PASS.

### Task 2.5: Реализовать `yamlInline` в `metadataItem/toJSONSchema.ts`

**Files:**
- Modify: `packages/core/metadata/orchestration/metadataItem/toJSONSchema.ts`

- [ ] **Step 1: Открыть файл, посмотреть как выводится схема**

```bash
cat packages/core/metadata/orchestration/metadataItem/toJSONSchema.ts
```

- [ ] **Step 2: После сборки объектной схемы — если есть yamlInline-свойство, возвращать его подсхему**

```ts
const inlineEntries = Object.entries(rule.properties).filter(
  ([, p]) => (p as any).yamlInline === true && (p as any).forReferenceOnly !== true
)
if (inlineEntries.length === 1) {
  const [, prop] = inlineEntries[0]
  // получить подсхему типа prop.type через существующий механизм:
  const inlineSchema = exportPropertyToJSONSchema({ context, rule: prop })
  return inlineSchema
}
return objectSchema
```

(Точные имена `exportPropertyToJSONSchema` уточните, посмотрев импорты в этом файле.)

- [ ] **Step 3: Запустить тест JSON-схемы**

```bash
pnpm --filter core test metadata/orchestration/metadataItem/yamlInline.test.ts -t "toJSONSchema" 2>&1 | tail -10
```
Ожидание: PASS.

### Task 2.6: Прогон полного теста после Phase 2

- [ ] **Step 1: Запустить весь pnpm test**

```bash
pnpm test 2>&1 | tail -20
```
Ожидание: все тесты зелёные.

- [ ] **Step 2: Коммит**

```bash
git add -A
git commit -m "feat: :sparkles: флаг yamlInline для расплющивания обёртки в YAML/JSON-схеме"
```

---

## Phase 3: `commonObjects/predefined/` на `rules.ts`

### Task 3.1: Заглушки нового `rules.ts` и `types.ts`

**Files:**
- Modify: `packages/core/metadata/commonObjects/predefined/rules.ts` (полная перепись)
- Modify: `packages/core/metadata/commonObjects/predefined/types.ts` (полная перепись)
- Create: `packages/core/metadata/commonObjects/predefined/index.ts`

**Внимание:** на этом шаге ещё **не удаляем** старые `fromXML.ts/toXML.ts/fromYAML.ts/toYAML.ts/toJSONSchema.ts` и **не трогаем** envelope-инфраструктуру. Они будут жить параллельно до тех пор, пока новые тесты не пройдут (Task 3.5–3.7), и удалятся в Task 3.8.

- [ ] **Step 1: Перезаписать `rules.ts`**

```ts
import { PredefinedItemRules } from "~/metadata/commonObjects/predefinedItem/rules"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const PredefinedRules = {
  itemType: "Predefined",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "PredefinedData",
      rootAttributes: {
        _xmlns: "http://v8.1c.ru/8.3/xcf/predef",
        "_xmlns:v8": "http://v8.1c.ru/8.1/data/core",
        "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
        "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
        "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "_xsi:type": "CatalogPredefinedItems",
        _version: "2.20",
      },
      forReferenceOnly: true,
      isFileRoot: true,
    },
    items: {
      type: "PredefinedItemCollection",
      yamlInline: true,
      yaml: "items",
    },
  },
} as const satisfies MetadataItemRule

// Сохраняем старые экспорты PredefinedDataEnvelope и externalFileEnvelopes до завершения Phase 5,
// чтобы оркестратор продолжал работать. После Phase 5 эти константы удаляются.
export const PredefinedDataEnvelope = {
  container: "PredefinedData",
  rootAttributes: PredefinedRules.properties.xmlRoot.rootAttributes,
} as const

export interface ExternalFileEnvelope {
  readonly container: string
  readonly rootAttributes: Record<string, string>
  readonly childTag?: string
}

import { AdditionalIndexesEnvelope } from "~/metadata/commonObjects/additionalIndex/rules"

export const externalFileEnvelopes: Record<string, ExternalFileEnvelope> = {
  Predefined: PredefinedDataEnvelope,
  AdditionalIndex: AdditionalIndexesEnvelope,
}
```

- [ ] **Step 2: Перезаписать `types.ts`**

```ts
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { PredefinedRules } from "./rules"

export type Predefined = MetadataTypeByRule<typeof PredefinedRules>
export type PredefinedYAML = YAMLTypeByRule<typeof PredefinedRules>

registerMetadataItemRule({
  propertyType: "Predefined",
  itemRule: PredefinedRules,
})
```

- [ ] **Step 3: Создать `index.ts`**

```ts
import "./types"
```

- [ ] **Step 4: Удалить из старых `fromXML.ts`/`toXML.ts`/`fromYAML.ts`/`toYAML.ts`/`toJSONSchema.ts` строки `registerTypeRule("Predefined", ...)`**

Эти регистрации будут заменены автоматическими при `registerMetadataItemRule`. Чтобы не было конфликта — закомментировать или удалить вызовы. Без удаления экспортируемых функций.

- [ ] **Step 5: Удалить старый `types.ts`-импорт `PredefinedItemsXML/PredefinedItemsYAML` в `appliedObjects/metadataCatalog/types.ts:15` и связанные использования (строка 126)**

Заменить на новые типы:
```ts
import { Predefined, PredefinedYAML } from "~/metadata/commonObjects/predefined/types"
// ...
Predefined?: ItemXML  // или Predefined — посмотреть по контексту что подходит
```

(Точные правки определите по реальной структуре `metadataCatalog/types.ts` после чтения файла.)

- [ ] **Step 6: Прогон тестов — убедиться, что компилируется**

```bash
pnpm --filter core test 2>&1 | tail -20
```
Ожидание: компилируется. Тесты `metadataCatalog/syncToXML.test.ts` могут падать — это ожидаемо, чиним в Phase 5.

### Task 3.2: Тест round-trip XML — `fromXML.test.ts` для `Predefined`

**Files:**
- Create: `packages/core/metadata/commonObjects/predefined/fromXML.test.ts`

- [ ] **Step 1: Написать тест по образцу `predefinedItem/fromXML.test.ts`**

```ts
import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { importMetadataItemFromXML } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/tests/mockContext"
import { PredefinedRules } from "./rules"

describe("import Predefined from XML", () => {
  it("imports full.xml round-trip-ready", () => {
    const xmlString = readFileSync(join(__dirname, "__fixtures__", "full.xml"), "utf-8")
      .replace(/^﻿/, "")
      .trimEnd()
    const result = importMetadataItemFromXML({
      context: mockContextFromXML(),
      rule: PredefinedRules,
      xmlString,
    })
    expect(result).toMatchObject({
      itemType: "Predefined",
      items: expect.any(Array),
    })
    expect(result?.items.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Запустить тест**

```bash
pnpm --filter core test metadata/commonObjects/predefined/fromXML.test.ts 2>&1 | tail -20
```
Ожидание: либо PASS (если регистрация правил отрабатывает), либо понятная ошибка по части `XMLRoot.isFileRoot` или регистрации.

Если падает — диагностируйте: проверьте, что `import "./types"` где-то выполняется (например, через корневой `index.ts` оркестрации); если нужно — добавьте импорт в начало теста (`import "./types"`).

### Task 3.3: Тест round-trip XML — `toXML.test.ts` для `Predefined`

**Files:**
- Create: `packages/core/metadata/commonObjects/predefined/toXML.test.ts`

- [ ] **Step 1: Написать тест**

```ts
import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { exportMetadataItemToXML, importMetadataItemFromXML } from "~/metadata/orchestration"
import { mockContextFromXML, mockContextWithExportToXML } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { PredefinedRules } from "./rules"

describe("export Predefined to XML", () => {
  it("round-trip from full.xml", () => {
    const source = readFileSync(join(__dirname, "__fixtures__", "full.xml"), "utf-8")
      .replace(/^﻿/, "")
      .trimEnd()
    const imported = importMetadataItemFromXML({
      context: mockContextFromXML(),
      rule: PredefinedRules,
      xmlString: source,
    })
    const xmlObj = exportMetadataItemToXML({
      context: mockContextWithExportToXML(),
      data: imported,
      rule: PredefinedRules,
    })
    const exported = xmlExport(xmlObj as any).trimEnd()
    expect(exported).toBe(source)
  })
})
```

- [ ] **Step 2: Запустить**

```bash
pnpm --filter core test metadata/commonObjects/predefined/toXML.test.ts 2>&1 | tail -30
```
Ожидание: либо PASS, либо diff. Если diff — поправить порядок свойств / атрибутов в `PredefinedRules` (значимы порядок и присутствие `version`/`xsi:type`). Сравнить с реальным выводом и эталоном.

### Task 3.4: Тесты YAML

**Files:**
- Create: `packages/core/metadata/commonObjects/predefined/fromYAML.test.ts`
- Create: `packages/core/metadata/commonObjects/predefined/toYAML.test.ts`

- [ ] **Step 1: Написать `fromYAML.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { mockContextFromYAML } from "~/tests/mockContext"
import { PredefinedRules } from "./rules"

describe("import Predefined from YAML", () => {
  it("inline-record парсится в items без обёртки", () => {
    const yaml = {
      ПредопределенноеЗначение: { Код: "000000001", Наименование: "Тест", ЭтоГруппа: false },
    }
    const result = importMetadataItemFromYAML({
      context: mockContextFromYAML(),
      yaml,
      rule: PredefinedRules,
      name: "predefined",
    })
    expect(result?.items[0]).toMatchObject({ name: "ПредопределенноеЗначение", isFolder: false })
  })
})
```

- [ ] **Step 2: Написать `toYAML.test.ts`**

```ts
import { describe, expect, it } from "vitest"
import { exportMetadataItemToYAML } from "~/metadata/orchestration"
import { mockContextWithExportToYAML } from "~/tests/mockContext"
import { PredefinedRules } from "./rules"

describe("export Predefined to YAML", () => {
  it("экспортирует items как корневой Record (без обёртки items:)", () => {
    const data = {
      itemType: "Predefined",
      items: [{ name: "X", code: "001", description: "X", isFolder: false }],
    } as any
    const result = exportMetadataItemToYAML({
      context: mockContextWithExportToYAML(),
      data,
      rule: PredefinedRules,
    })
    expect(result).toEqual({ X: { Код: "001", Наименование: "X", ЭтоГруппа: false } })
  })
})
```

- [ ] **Step 3: Запустить оба теста**

```bash
pnpm --filter core test metadata/commonObjects/predefined/fromYAML.test.ts metadata/commonObjects/predefined/toYAML.test.ts 2>&1 | tail -30
```
Ожидание: PASS. Если падают — диагностируйте, какой шаг yamlInline не отработал.

### Task 3.5: Удалить старые ручные конвертеры `predefined/`

**Files:**
- Delete: `packages/core/metadata/commonObjects/predefined/fromXML.ts`
- Delete: `packages/core/metadata/commonObjects/predefined/toXML.ts`
- Delete: `packages/core/metadata/commonObjects/predefined/fromYAML.ts`
- Delete: `packages/core/metadata/commonObjects/predefined/toYAML.ts`
- Delete: `packages/core/metadata/commonObjects/predefined/toJSONSchema.ts`

- [ ] **Step 1: Удалить файлы**

```bash
git rm packages/core/metadata/commonObjects/predefined/fromXML.ts \
       packages/core/metadata/commonObjects/predefined/toXML.ts \
       packages/core/metadata/commonObjects/predefined/fromYAML.ts \
       packages/core/metadata/commonObjects/predefined/toYAML.ts \
       packages/core/metadata/commonObjects/predefined/toJSONSchema.ts
```

- [ ] **Step 2: Найти и удалить импорты этих файлов**

```bash
grep -rn 'commonObjects/predefined/from\|commonObjects/predefined/to' packages/core --include="*.ts"
```
Все найденные обращения — исправить (импорты больше не нужны, регистрация переехала в `types.ts`).

- [ ] **Step 3: Прогон**

```bash
pnpm --filter core test metadata/commonObjects/predefined 2>&1 | tail -20
```
Ожидание: PASS.

### Task 3.6: Обновить `orchestration/property/registry.ts` для `Predefined`

**Files:**
- Modify: `packages/core/metadata/orchestration/property/registry.ts:149-155, 413-424`

- [ ] **Step 1: Удалить импорт `PredefinedItems, PredefinedItemsYAML` (строка 149)**

- [ ] **Step 2: Заменить запись `Predefined` (строки 413–424)**

```ts
Predefined: {
  item: Predefined
  yaml: PredefinedYAML
}
```

С импортом `import { Predefined, PredefinedYAML } from "~/metadata/commonObjects/predefined/types"`.

- [ ] **Step 3: Прогон**

```bash
pnpm --filter core test 2>&1 | tail -20
```

### Task 3.7: Коммит фазы 3

- [ ] **Step 1: Коммит**

```bash
git add -A
git commit -m "refactor: :recycle: Predefined на rules.ts с маркером XMLRoot и yamlInline"
```

---

## Phase 4: `commonObjects/additionalIndex/` на `rules.ts`

Полностью симметрично Phase 3, но для типа `AdditionalIndex`. Корневой тег — `<AdditionalIndexes>`, дочерний — `<AdditionalIndex>` (см. envelope в `additionalIndex/rules.ts:9–20`).

### Task 4.1: Прочитать существующие файлы AdditionalIndex

- [ ] **Step 1: Просмотр**

```bash
ls packages/core/metadata/commonObjects/additionalIndex/
cat packages/core/metadata/commonObjects/additionalIndex/types.ts
cat packages/core/metadata/commonObjects/additionalIndex/fromXML.ts
cat packages/core/metadata/commonObjects/additionalIndex/toXML.ts
```

- [ ] **Step 2: Понять структуру одного `AdditionalIndex`-элемента (поля Имя/Таблица/ИндексируемыеПоля/ДополнительныеПоля).** На основе этого определить, нужен ли отдельный item-rule `AdditionalIndexItemRules` (по аналогии с `PredefinedItemRules`).

### Task 4.2: Создать `AdditionalIndexItemRules` (если ещё нет)

**Files:**
- Modify: `packages/core/metadata/commonObjects/additionalIndex/rules.ts` (полная перепись)
- Modify: `packages/core/metadata/commonObjects/additionalIndex/types.ts` (полная перепись)
- Create: `packages/core/metadata/commonObjects/additionalIndex/index.ts`

- [ ] **Step 1: Перезаписать `rules.ts`**

```ts
import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const AdditionalIndexItemRules = {
  itemType: "AdditionalIndexItem",
  properties: {
    id: { ...uuidPropertyRule, xml: "_id" },
    name: { type: "string", xml: "Name", yaml: "Имя", required: true },
    // ... остальные поля по факту существующего AdditionalIndex.types.ts
  },
} as const satisfies MetadataItemRule

export const AdditionalIndexRules = {
  itemType: "AdditionalIndex",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "AdditionalIndexes",
      rootAttributes: {
        _xmlns: "http://v8.1c.ru/8.3/xcf/extrnprops",
        "_xmlns:v8": "http://v8.1c.ru/8.1/data/core",
        "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
        "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
        "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        _version: "2.20",
      },
      forReferenceOnly: true,
      isFileRoot: true,
    },
    items: {
      type: "AdditionalIndexItemCollection",
      yamlInline: true,
      yaml: "items",
    },
  },
} as const satisfies MetadataItemRule
```

- [ ] **Step 2: Перезаписать `types.ts`**

```ts
import { registerMetadataItemCollectionRule, registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { AdditionalIndexItemRules, AdditionalIndexRules } from "./rules"

export type AdditionalIndexItem = MetadataTypeByRule<typeof AdditionalIndexItemRules>
export type AdditionalIndexItemYAML = YAMLTypeByRule<typeof AdditionalIndexItemRules>
export type AdditionalIndex = MetadataTypeByRule<typeof AdditionalIndexRules>
export type AdditionalIndexYAML = YAMLTypeByRule<typeof AdditionalIndexRules>

registerMetadataItemRule({
  propertyType: "AdditionalIndexItem",
  itemRule: AdditionalIndexItemRules,
})

registerMetadataItemCollectionRule({
  propertyType: "AdditionalIndexItemCollection",
  itemRule: AdditionalIndexItemRules,
  xmlElement: "AdditionalIndex",
  keyField: "name",
})

registerMetadataItemRule({
  propertyType: "AdditionalIndex",
  itemRule: AdditionalIndexRules,
})
```

- [ ] **Step 3: Создать `index.ts`** — `import "./types"`.

### Task 4.3: Обновить `metadataCatalog/rules.ts` свойство `additionalIndexes`

- [ ] **Step 1: Прочитать строки 37–41**

```ts
additionalIndexes: {
  yaml: "ДополнительныеИндексы",
  type: "AdditionalIndex",
  filePath: "Ext/AdditionalIndexes.xml",
},
```

Тип уже `"AdditionalIndex"` — менять не нужно. Регистрация в новом `additionalIndex/types.ts` зарегистрирует тип как item-rule, оркестратор поднимет.

### Task 4.4: Удалить старые ручные конвертеры `additionalIndex/`

```bash
git rm packages/core/metadata/commonObjects/additionalIndex/fromXML.ts \
       packages/core/metadata/commonObjects/additionalIndex/toXML.ts \
       packages/core/metadata/commonObjects/additionalIndex/fromYAML.ts \
       packages/core/metadata/commonObjects/additionalIndex/toYAML.ts
```

(Если каких-то файлов нет — просто пропустить.)

### Task 4.5: Тесты round-trip для AdditionalIndex

**Files:**
- Create: `packages/core/metadata/commonObjects/additionalIndex/__fixtures__/full.xml` (если не существует — скопировать из `metadataCatalog/__fixtures__/sync/xml/Ext/AdditionalIndexes.xml`)
- Create: `packages/core/metadata/commonObjects/additionalIndex/fromXML.test.ts` (по аналогии с `predefined/fromXML.test.ts`)
- Create: `packages/core/metadata/commonObjects/additionalIndex/toXML.test.ts`
- Create: `packages/core/metadata/commonObjects/additionalIndex/fromYAML.test.ts`
- Create: `packages/core/metadata/commonObjects/additionalIndex/toYAML.test.ts`

- [ ] **Step 1: Скопировать фикстуру** (если ещё нет)

```bash
mkdir -p packages/core/metadata/commonObjects/additionalIndex/__fixtures__
cp packages/core/metadata/appliedObjects/metadataCatalog/__fixtures__/sync/xml/Ext/AdditionalIndexes.xml \
   packages/core/metadata/commonObjects/additionalIndex/__fixtures__/full.xml
```

- [ ] **Step 2-5: Адаптировать тесты `predefined/*.test.ts` под `AdditionalIndex` (заменить `PredefinedRules` → `AdditionalIndexRules`, ожидаемые поля — Имя/Таблица и т.п.)**

- [ ] **Step 6: Прогон**

```bash
pnpm --filter core test metadata/commonObjects/additionalIndex 2>&1 | tail -20
```

### Task 4.6: Коммит фазы 4

```bash
git add -A
git commit -m "refactor: :recycle: AdditionalIndex на rules.ts с маркером XMLRoot и yamlInline"
```

---

## Phase 5: Удалить `externalFileEnvelopes` и упростить `appliedObject` оркестратор

### Task 5.1: Переписать `appliedObject/convertFromXML.ts`

**Files:**
- Modify: `packages/core/metadata/orchestration/appliedObject/convertFromXML.ts:30-42`

- [ ] **Step 1: Заменить блок чтения внешних файлов**

Был:
```ts
for (const [key, propRule] of Object.entries(rule.properties)) {
  if (propRule.filePath === undefined) continue
  const envelope = externalFileEnvelopes[propRule.type]
  if (!envelope) continue
  const extFilePath = join(inputDir, propRule.filePath)
  if (!fs.existsSync(extFilePath)) continue
  const extContent = await fs.promises.readFile(extFilePath, "utf-8")
  const extParsed = importContentFromXML<Record<string, unknown>>(extContent)
  const containerContent = extParsed[envelope.container]
  const value = importPropertyFromXML({ context, rule: propRule as PropertyRule, value: containerContent, name: key })
  if (value !== undefined) (model as Record<string, unknown>)[key] = value
}
```

Стал:
```ts
import { importMetadataItemFromXML } from "~/metadata/orchestration"
import { getMetadataItemRule } from "~/metadata/orchestration/metadataItem/registry" // имя уточнить

for (const [key, propRule] of Object.entries(rule.properties)) {
  if (propRule.filePath === undefined) continue
  const itemRule = getMetadataItemRule(propRule.type)
  if (!itemRule) continue
  const extFilePath = join(inputDir, propRule.filePath)
  if (!fs.existsSync(extFilePath)) continue
  const extContent = await fs.promises.readFile(extFilePath, "utf-8")
  const extParsed = importContentFromXML<Record<string, unknown>>(extContent)
  const value = importMetadataItemFromXML({ context, rule: itemRule, xml: extParsed })
  if (value !== undefined) (model as Record<string, unknown>)[key] = value
}
```

- [ ] **Step 2: Удалить импорт `externalFileEnvelopes`**

- [ ] **Step 3: Прогон тестов конкретно `metadataCatalog/convertFromXML.test.ts`**

```bash
pnpm --filter core test metadata/appliedObjects/metadataCatalog/convertFromXML.test.ts 2>&1 | tail -30
```
Ожидание: PASS. Если падает на формате модели — то скорее всего из-за лишней обёртки `items:` в модели каталога. Проверить `metadataCatalog/types.ts` — поле `predefined` теперь имеет тип `Predefined`, который выводится из `PredefinedRules` и содержит `{ items, itemType, ... }`. Это **отличается** от прежнего `PredefinedItems = Predefined[]`. Нужно либо обновить тип в `metadataCatalog/types.ts` и в фикстурах, либо добавить «расплющивание» при синхронизации `predefined.items` ↔ `predefined`.

**Решение:** в `metadataCatalog/types.ts` поле `predefined` изменяется на `Predefined` (item-объект с `items: PredefinedItem[]`). В фикстурах модель доступа — `model.predefined?.items[0]` вместо `model.predefined?.[0]`. Обновить это синхронно.

### Task 5.2: Переписать `appliedObject/syncToXML.ts`

**Files:**
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts:101-160`

- [ ] **Step 1: Заменить блок записи внешних файлов**

Был (укороченно):
```ts
for (const [key, propRule] of Object.entries(rule.properties)) {
  if (propRule.filePath === undefined) continue
  const envelope = externalFileEnvelopes[propRule.type]
  if (!envelope) continue
  // ... typeExportFn, mergeItemIds, и т.д.
}
```

Стал:
```ts
for (const [key, propRule] of Object.entries(rule.properties)) {
  if (propRule.filePath === undefined) continue
  const itemRule = getMetadataItemRule(propRule.type)
  if (!itemRule) continue

  const modelValue = (model as Record<string, unknown>)[key]
  if (modelValue === undefined) continue

  const xmlObj = exportMetadataItemToXML({
    context: contextWithForms,
    data: modelValue,
    rule: itemRule,
  })
  if (!xmlObj) continue

  // Подмесить _id из reference (логика mergeItemIds сохраняется, но получает container/childTag из правила)
  const xmlRootProp = Object.values(itemRule.properties).find((p) => p.type === "XMLRoot")
  const container = (xmlRootProp as any)?.container as string | undefined
  const childTag = (Object.values(itemRule.properties).find((p) => (p as any).type === ... ) as any)?.xmlElement
    ?? "Item" // fallback
  const referenceExtPath = join(referenceDir, propRule.filePath)
  const merged = mergeItemIds(xmlObj as any, referenceExtPath, container!, childTag)

  const extOutputPath = join(outputDir, propRule.filePath)
  await fs.promises.mkdir(dirname(extOutputPath), { recursive: true })
  await fs.promises.writeFile(extOutputPath, xmlExport(merged), "utf-8")
}
```

(Точные детали `mergeItemIds` сохраняем — функция остаётся.)

- [ ] **Step 2: Прогон**

```bash
pnpm --filter core test metadata/appliedObjects/metadataCatalog/syncToXML.test.ts 2>&1 | tail -30
```

### Task 5.3: Удалить `ExternalFileEnvelope`, `externalFileEnvelopes`, envelope-константы

**Files:**
- Modify: `packages/core/metadata/commonObjects/predefined/rules.ts` — удалить `PredefinedDataEnvelope`, `externalFileEnvelopes`, `ExternalFileEnvelope`.
- Modify: `packages/core/metadata/commonObjects/additionalIndex/rules.ts` — удалить `AdditionalIndexesEnvelope`.
- Modify: `packages/core/metadata/orchestration/appliedObject/convertFromXML.ts` — убедиться, что импорта `externalFileEnvelopes` больше нет.
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts` — то же.

- [ ] **Step 1: Удалить экспорты из `predefined/rules.ts`**

Из файла удалить блок `export const PredefinedDataEnvelope = {...}`, `export interface ExternalFileEnvelope {...}`, `export const externalFileEnvelopes = {...}`. Остаётся только `PredefinedRules`.

- [ ] **Step 2: Удалить экспорт `AdditionalIndexesEnvelope` из `additionalIndex/rules.ts`** (атрибуты xmlns теперь живут в `AdditionalIndexRules.properties.xmlRoot.rootAttributes`).

- [ ] **Step 3: Поиск остатков**

```bash
grep -rn "externalFileEnvelopes\|ExternalFileEnvelope\|PredefinedDataEnvelope\|AdditionalIndexesEnvelope" packages/core --include="*.ts"
```
Ожидание: пусто.

- [ ] **Step 4: Прогон полного теста**

```bash
pnpm test 2>&1 | tail -40
```

- [ ] **Step 5: Коммит**

```bash
git add -A
git commit -m "refactor: :fire: удалить externalFileEnvelopes, обработка filePath через MetadataItemRule"
```

---

## Phase 6: Документация и финальный прогон

### Task 6.1: Создать `.agents/architecture-orchestration.md`

**Files:**
- Create: `.agents/architecture-orchestration.md`

- [ ] **Step 1: Записать**

```markdown
# Архитектура слоя `orchestration`

Документ фиксирует ключевые инварианты слоя `packages/core/metadata/orchestration/`. **Перед изменениями в этом слое — прочитать и при необходимости обновить.**

## Регистрация типов

- `registerMetadataItemRule({ propertyType, itemRule })` — регистрирует тип property как полноценный объект (`MetadataItemRule`). Автоматически вешает обработчики `importFromXML`/`exportToXML`/`importFromYAML`/`exportToYAML`/`exportToJSONSchema` через `registerTypeRule`.
- `registerMetadataItemCollectionRule({ propertyType, itemRule, xmlElement, keyField, ... })` — регистрирует тип property как коллекцию.
- Хранилище: единый реестр `registerTypeRule(type, role, value)` (см. `orchestration/formElement/factory.ts`). По типу можно достать как функцию-обработчик, так и произвольное значение.

## Маркер `XMLRoot`

- Свойство-маркер с типом `"XMLRoot"`, помеченное `forReferenceOnly: true`, описывает корневой XML-тег и его атрибуты (`container`, `rootAttributes`).
- `metadataItem/fromXML.ts`/`toXML.ts` ищут это свойство в `rule.properties` и используют его при импорте/экспорте.
- Поле `isFileRoot?: true` различает два режима:
  - **без `isFileRoot`** — корневой тег = `<MetaDataObject>`, container — внутренний тег (`<Catalog>`, `<DocumentNumerator>`); для прикладных объектов.
  - **`isFileRoot: true`** — корневой тег = `container` напрямую (`<PredefinedData>`, `<AdditionalIndexes>`); для внешних файлов.

## Свойства с `filePath`

- Свойство item-rule с заданным `filePath: string` означает, что значение хранится во внешнем XML-файле (например, `Ext/Predefined.xml`).
- Тип такого свойства должен быть зарегистрирован как `MetadataItemRule` через `registerMetadataItemRule`.
- Оркестраторы `appliedObject/convertFromXML.ts` и `syncToXML.ts` обрабатывают `filePath`-свойства как обычные item-типы: `importMetadataItemFromXML`/`exportMetadataItemToXML` с правилом этого типа.

## Флаг `yamlInline`

- Опциональный флаг `yamlInline?: boolean` на свойстве `BasePropertyRule`.
- Применяется только в YAML и JSON-схеме (модель данных и XML — без изменений).
- Семантика: если у `MetadataItemRule` ровно одно содержательное свойство (без `forReferenceOnly`) с `yamlInline: true`, то сериализация в YAML/JSON-схему использует значение этого свойства напрямую, без обёртки. Импорт — симметрично.
- При наличии более одного `yamlInline`-свойства оркестратор кидает ошибку.

## Поток import / sync

**`convertAppliedObjectFromXML` (`appliedObject/convertFromXML.ts`):**
1. Читает `<inputDir>/<name>.xml`, парсит, передаёт в `importMetadataItemFromXML` с правилом объекта.
2. Для каждого свойства правила с `filePath`: читает внешний файл, передаёт в `importMetadataItemFromXML` с правилом типа этого свойства, кладёт результат в модель.
3. Вызывает обработчики `syncExternalFromXML` для свойств с собственной логикой синхронизации (Module, Help, Template).
4. Записывает `Свойства.yaml` через `exportMetadataItemToYAML`.

**`syncAppliedObjectToXML` (`appliedObject/syncToXML.ts`):**
1. Читает `Свойства.yaml`, импортирует через `importMetadataItemFromYAML`.
2. Через `exportMetadataItemToXML` с правилом объекта собирает основной XML.
3. Для свойств с `filePath`: вызывает `exportMetadataItemToXML` с правилом типа, мерджит `_id` из эталона, записывает внешний файл.
4. Вызывает обработчики `syncExternalToXML` для Module/Help/Template.
```

- [ ] **Step 2: Сохранить и проверить**

```bash
ls -la .agents/architecture-orchestration.md
```

### Task 6.2: Добавить ссылку в `AGENTS.md`

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Открыть файл и добавить раздел в подходящее место**

```markdown
## Архитектура слоя `orchestration`

См. [`architecture-orchestration.md`](architecture-orchestration.md). Перед любыми изменениями в `packages/core/metadata/orchestration/` обязательно прочитать и при необходимости обновить.
```

### Task 6.3: Финальный прогон полного теста

- [ ] **Step 1: Из корня запустить весь pnpm test**

```bash
pnpm test 2>&1 | tail -60
```
Ожидание: все тесты зелёные (включая `metadataCatalog/syncToXML.test.ts`, который сравнивает побайтно с эталонным `Ext/Predefined.xml`).

- [ ] **Step 2: Если есть падения — диагностировать. Самые вероятные точки:**
  - Атрибуты xmlns в выходном `Ext/Predefined.xml` не в том порядке (или потерялся `xsi:type`/`version`) → проверить порядок ключей в `rootAttributes` `PredefinedRules`.
  - Модель `metadataCatalog.predefined` теперь объект с `items`, а не массив — фикстуры/тесты, прямо обращающиеся к `catalog.predefined[0]`, нужно поправить на `catalog.predefined.items[0]`.
  - Регистрация `Predefined` не подгружается → убедиться, что `commonObjects/predefined/index.ts` где-то импортируется (например, в общем индексе оркестрации или в `metadataCatalog/index.ts`).

### Task 6.4: Коммит документации и закрытие

```bash
git add -A
git commit -m "docs: :memo: архитектура слоя orchestration в .agents/architecture-orchestration.md"
```

---

## Self-Review (выполнено автором плана)

**Spec coverage:** все 6 архитектурных решений из спецификации покрыты — переименование `MetaDataObject → XMLRoot` (Phase 1), `yamlInline` (Phase 2), `Predefined` на rules.ts (Phase 3), `AdditionalIndex` на rules.ts (Phase 4), удаление `externalFileEnvelopes` (Phase 5), документация (Phase 6).

**Placeholder scan:** нет «TBD»/«TODO». Все шаги содержат конкретные команды или код. Места, где имена помощников могут отличаться (например, `mockContext`), помечены явно с инструкцией «найдите аналог в `tests/` и подставьте».

**Type consistency:** имена типов согласованы (`PredefinedRules`, `AdditionalIndexRules`, `XMLRootPropertyRule`); регистрация коллекции `PredefinedItemCollection` уже существует, не дублируется.

**Известные открытые вопросы для исполнителя:**
- Точная структура полей `AdditionalIndexItem` (Имя/Таблица/ИндексируемыеПоля/ДополнительныеПоля) — сверять с существующим `additionalIndex/types.ts` перед переписью.
- Точная сигнатура `getMetadataItemRule(type)` в `orchestration/metadataItem/registry.ts` — уточнить при реализации Phase 5.
- В Task 1.7 шаг 5 вводится поле `isFileRoot?: true` — это решение принято на этом плане, чтобы не ломать существующее поведение `MetadataObject`-обёртки для catalog. Спецификация не упоминает этот флаг явно, но он необходим для совместимости. После выполнения плана может потребоваться обновить spec под фактическое поведение.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-25-predefined-rules-migration.md`. Two execution options:

1. **Subagent-Driven (recommended)** — я диспатчу свежий subagent на каждую таску, ревью между тасками, быстрые итерации.
2. **Inline Execution** — выполнять задачи в этой сессии через executing-plans, чекпоинты для ревью.

Какой подход?
