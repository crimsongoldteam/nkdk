# MetadataDocument — закрыть пробелы round-trip

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Привести `MetadataDocument` к round-trip-полноте по образцу `MetadataSequence`/`MetadataCatalog`: добавить `xmlRoot`/`internalInfo`, массовые `defaultValueXMLRaw`, исправить расходящиеся имена XML-тегов, добавить `numerator` и `privilegedUnpostingMode`, унифицировать инфраструктуру.

**Architecture:** TS-ключи остаются идиоматичными (по карте ru-en и текущему `types.ts`); при расхождении с фактическим XML-тегом задаётся явное `xml:`. Корневая обёртка `<Document>` выносится в `xmlRoot`, а `xmlParents` каждого свойства упрощается с `["Document", "Properties"]` до `["Properties"]`. Все типы (`XMLRoot`, `InternalInfo`, `AdditionalIndex` и т.п.) уже зарегистрированы в `PropertyRuleTypeKeys` — добавления в реестры не требуются.

**Tech Stack:** TypeScript, vitest, pnpm workspaces. Спека: `docs/superpowers/specs/2026-04-26-metadata-document-round-trip-gaps-design.md`.

---

## Файловая структура

**Создаются:**
- `packages/core/metadata/appliedObjects/metadataDocument/index.ts` — реэкспорт `types`/`rules`.
- `packages/core/metadata/appliedObjects/metadataDocument/fromXML.test.ts` — XML→model.
- `packages/core/metadata/appliedObjects/metadataDocument/toXML.test.ts` — model→XML (round-trip побайтово на `full.xml`).
- `packages/core/metadata/appliedObjects/metadataDocument/fromYAML.test.ts` — YAML→model.
- `packages/core/metadata/appliedObjects/metadataDocument/toYAML.test.ts` — model→YAML.
- `packages/core/metadata/appliedObjects/metadataDocument/convertFromXML.test.ts` — конец-в-конец XML→YAML на диске.
- `packages/core/metadata/appliedObjects/metadataDocument/syncToXML.test.ts` — конец-в-конец YAML→XML на диске (round-trip по `__fixtures__/sync/ДокументВсеСвойства*`).

**Меняются:**
- `packages/core/metadata/appliedObjects/metadataDocument/rules.ts` — основная переработка.
- `packages/core/metadata/appliedObjects/metadataDocument/types.ts` — `numerator: string`.
- `packages/core/metadata/orchestration/importMetadataFileWithGraph.ts` — унифицированный вызов оркестратора.
- `packages/core/metadata/appliedObjects/index.ts` — добавить `import "./metadataDocument"`.
- `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts` — снять ослабленные assertions для Document (комментарий на line ~84).

**Удаляются:**
- `packages/core/metadata/appliedObjects/metadataDocument/fromYAML.ts` — обёртка-артефакт, заменяется унифицированным вызовом.

---

## Task 1: Подготовительные правки инфраструктуры (без `rules.ts`)

**Зачем:** убрать обёртку `fromYAML.ts`, подключить `metadataDocument` в общий `appliedObjects/index.ts` и создать `index.ts` пакета. Это симметрично соседям (Sequence/DocumentNumerator) и даёт корректную точку входа для последующих тестов.

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataDocument/index.ts`
- Modify: `packages/core/metadata/orchestration/importMetadataFileWithGraph.ts`
- Modify: `packages/core/metadata/appliedObjects/index.ts`
- Delete: `packages/core/metadata/appliedObjects/metadataDocument/fromYAML.ts`

- [ ] **Step 1.1: Прочитать `importMetadataFileWithGraph.ts`, понять текущий вызов**

Run: `grep -n 'MetadataDocument\|importMetadataDocumentFromYAML\|importMetadataItemFromYAML' packages/core/metadata/orchestration/importMetadataFileWithGraph.ts`

Цель: увидеть, как именно подключён Document сейчас (вызов через обёртку) и как подключён Sequence (через `importMetadataItemFromYAML`).

- [ ] **Step 1.2: Создать `metadataDocument/index.ts`**

Содержимое (полный файл):

```ts
export * from "./types"
export * from "./rules"
```

- [ ] **Step 1.3: Заменить вызов в `importMetadataFileWithGraph.ts`**

В `packages/core/metadata/orchestration/importMetadataFileWithGraph.ts` заменить:

```ts
import { importMetadataDocumentFromYAML } from "~/metadata/appliedObjects/metadataDocument/fromYAML"
```

на

```ts
import { MetadataDocumentRules } from "~/metadata/appliedObjects/metadataDocument/rules"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
```

И вызов (строка ~87) `importMetadataDocumentFromYAML(ctx, yaml as never, name)` — заменить на:

```ts
importMetadataItemFromYAML({
  context: ctx,
  yaml: yaml as never,
  rule: MetadataDocumentRules,
  name,
})
```

(Если `importMetadataItemFromYAML` уже импортирован выше — повторно не импортировать; добавить только `MetadataDocumentRules`.)

- [ ] **Step 1.4: Удалить `fromYAML.ts`**

Run:
```bash
git rm packages/core/metadata/appliedObjects/metadataDocument/fromYAML.ts
```

- [ ] **Step 1.5: Подключить `metadataDocument` в `appliedObjects/index.ts`**

В `packages/core/metadata/appliedObjects/index.ts` добавить строку (рядом с `import "./metadataSequence"`, отсортировано):

```ts
import "./metadataDocument"
```

- [ ] **Step 1.6: Запустить весь тестовый прогон, убедиться, что ничего не сломалось**

Run: `pnpm test`

Ожидание: все тесты, что были зелёными, остались зелёными. Этот шаг — проверка регрессии. Если что-то падает — фиксировать в первую очередь (вероятно, `importMetadataFileWithGraph.ts` имеет нюанс по типизации `yaml`).

- [ ] **Step 1.7: Коммит**

```bash
git add -A packages/core/metadata/appliedObjects/metadataDocument/index.ts \
         packages/core/metadata/orchestration/importMetadataFileWithGraph.ts \
         packages/core/metadata/appliedObjects/index.ts \
         packages/core/metadata/appliedObjects/metadataDocument/fromYAML.ts
git commit -m "refactor: :recycle: унифицировать подключение metadataDocument

- index.ts по образцу metadataSequence/metadataDocumentNumerator
- удалён fromYAML.ts (обёртка-артефакт)
- importMetadataFileWithGraph переключён на importMetadataItemFromYAML
- metadataDocument подключён в appliedObjects/index.ts"
```

---

## Task 2: Baseline-тест `fromXML` на `full.xml`

**Зачем:** до правок `rules.ts` зафиксировать, что **чтение** XML работает (по крайней мере для имеющихся свойств). Это red-baseline: тест должен пройти на всех существующих свойствах и фактически опираться на текущую структуру.

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataDocument/fromXML.test.ts`

- [ ] **Step 2.1: Прочитать соседний `fromXML.test.ts`**

Run: `cat packages/core/metadata/appliedObjects/metadataSequence/fromXML.test.ts`

Цель: понять, какой builder используется (`importMetadataItemFromXML`), какие assertions делаются.

- [ ] **Step 2.2: Написать `fromXML.test.ts` для Document**

```ts
import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { importMetadataItemFromXML } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/metadata/orchestration/__test-helpers__/mockContext"
import { MetadataDocumentRules } from "./rules"

describe("MetadataDocument fromXML", () => {
  it("читает minimal.xml", () => {
    const xml = fs.readFileSync(join(__dirname, "__fixtures__/minimal.xml"), "utf-8")
    const result = importMetadataItemFromXML({
      context: mockContextFromXML(),
      xml,
      rule: MetadataDocumentRules,
    })

    expect(result).toBeDefined()
    expect(result?.name).toBe("ДокументПоУмолчанию")
  })

  it("читает full.xml — основные свойства", () => {
    const xml = fs.readFileSync(join(__dirname, "__fixtures__/full.xml"), "utf-8")
    const result = importMetadataItemFromXML({
      context: mockContextFromXML(),
      xml,
      rule: MetadataDocumentRules,
    })

    expect(result?.name).toBe("ДокументВсеСвойства")
    expect(result?.posting).toBe("Allow")
    expect(result?.numberType).toBe("Number")
    expect(result?.attributes?.length).toBeGreaterThan(0)
  })
})
```

(Имя помощника `mockContextFromXML` сверить с тем, что используют соседи. Если он называется иначе — поправить импорт.)

- [ ] **Step 2.3: Прогнать тест**

Run: `pnpm --filter @nakidka/core test fromXML.test --testPathPattern metadataDocument`

Ожидание: оба теста зелёные. Если красные — проблема не в `rules.ts` (он точно читает текущий XML), а в импортах/моках. Поправить импорты.

- [ ] **Step 2.4: Коммит**

```bash
git add packages/core/metadata/appliedObjects/metadataDocument/fromXML.test.ts
git commit -m "test: :white_check_mark: baseline fromXML.test для metadataDocument"
```

---

## Task 3: Каркас round-trip — `xmlRoot`, `internalInfo`, упрощение `xmlParents`

**Зачем:** добавить корневую обёртку (`<MetaDataObject>...<Document>`) и `<InternalInfo>` (5 `<xr:GeneratedType>`). Параллельно — заменить константы `documentProperties = ["Document", "Properties"]` на `["Properties"]` и `documentChildObjects = ["Document", "ChildObjects"]` на `["ChildObjects"]`, потому что `xmlRoot` сам подмешивает `<Document>`.

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/rules.ts`
- Create: `packages/core/metadata/appliedObjects/metadataDocument/toXML.test.ts`

- [ ] **Step 3.1: Написать failing-тест `toXML.test.ts` (round-trip побайтово)**

```ts
import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { exportMetadataItemToXML, importMetadataItemFromXML } from "~/metadata/orchestration"
import { mockContextFromXML, mockContextToXML } from "~/metadata/orchestration/__test-helpers__/mockContext"
import { MetadataDocumentRules } from "./rules"

describe("MetadataDocument toXML round-trip", () => {
  it("full.xml — побайтовый round-trip", () => {
    const xml = fs.readFileSync(join(__dirname, "__fixtures__/full.xml"), "utf-8")
    const model = importMetadataItemFromXML({
      context: mockContextFromXML(),
      xml,
      rule: MetadataDocumentRules,
    })
    expect(model).toBeDefined()

    const back = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: model!,
      rule: MetadataDocumentRules,
    })

    expect(back).toBe(xml)
  })
})
```

(Имена `exportMetadataItemToXML` / `mockContextToXML` сверить с соседним `metadataSequence/toXML.test.ts`. Если есть иные обёртки — повторить точно.)

- [ ] **Step 3.2: Прогнать тест, зафиксировать красное**

Run: `pnpm --filter @nakidka/core test toXML.test --testPathPattern metadataDocument`

Ожидание: FAIL. В диагностике ожидать **отсутствие** `<MetaDataObject>` и `<InternalInfo>` в результате — это и есть пробелы, которые мы закрываем.

- [ ] **Step 3.3: Добавить `xmlRoot` и `internalInfo` в `rules.ts`**

В `packages/core/metadata/appliedObjects/metadataDocument/rules.ts` импортировать пресет:

```ts
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
```

В `properties` (в начале — до `uuid`) добавить:

```ts
xmlRoot: {
  type: "XMLRoot",
  container: "Document",
  rootAttributes: V8_MDCLASSES_ROOT,
  forReferenceOnly: true,
  toYAML: false,
  fromYAML: false,
},
internalInfo: {
  type: "InternalInfo",
  xmlParents: [],
  forReferenceOnly: true,
  items: [
    { name: "DocumentObject", category: "Object" },
    { name: "DocumentRef", category: "Ref" },
    { name: "DocumentSelection", category: "Selection" },
    { name: "DocumentList", category: "List" },
    { name: "DocumentManager", category: "Manager" },
  ],
},
```

- [ ] **Step 3.4: Упростить `documentProperties`/`documentChildObjects`**

В `rules.ts` заменить:

```ts
const documentProperties = ["Document", "Properties"]
const documentChildObjects = ["Document", "ChildObjects"]
```

на

```ts
const documentProperties = ["Properties"]
const documentChildObjects = ["ChildObjects"]
```

- [ ] **Step 3.5: Добавить `requiredXMLParents` на уровне правила**

В `MetadataDocumentRules` (после `properties: { ... }`, перед `graphTerminals`) добавить:

```ts
requiredXMLParents: [["ChildObjects"]],
```

- [ ] **Step 3.6: Прогнать `fromXML.test` и `toXML.test`**

Run: `pnpm --filter @nakidka/core test --testPathPattern metadataDocument`

Ожидание: `fromXML.test` остаётся зелёным; `toXML.test` всё ещё красный, но дельта уменьшилась — теперь видно, что не хватает `defaultValueXMLRaw` для пустых тегов и расходящихся имён.

- [ ] **Step 3.7: Коммит**

```bash
git add packages/core/metadata/appliedObjects/metadataDocument/rules.ts \
        packages/core/metadata/appliedObjects/metadataDocument/toXML.test.ts
git commit -m "feat: :sparkles: xmlRoot + internalInfo для metadataDocument

- xmlRoot c V8_MDCLASSES_ROOT и container=Document
- internalInfo с 5 GeneratedType (Object/Ref/Selection/List/Manager)
- documentProperties/documentChildObjects упрощены до [Properties]/[ChildObjects]
- requiredXMLParents=[[ChildObjects]] на уровне правила
- failing-тест toXML.test для полного round-trip full.xml"
```

---

## Task 4: Расходящиеся имена XML-тегов (3 свойства)

**Зачем:** TS-ключи остаются идиоматичными, но фактический XML использует другие имена. Без явного `xml:` toXML генерирует неправильный XML, fromXML не находит свойства.

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/rules.ts`

- [ ] **Step 4.1: В `rules.ts`, в `properties`, добавить `xml:` для трёх свойств**

`actionsWritingOnPost`:
```ts
actionsWritingOnPost: {
  yaml: "ЗаписьДвиженийПриПроведении",
  type: "SystemEnumeration",
  typeSE: "RegisterRecordsWritingOnPost",
  xml: "RegisterRecordsWritingOnPost",
  defaultValueXML: "RealTime",
  xmlParents: documentProperties,
},
```

`privilegedPostingMode`:
```ts
privilegedPostingMode: {
  yaml: "ПривилегированныйРежимПриПроведении",
  type: "boolean",
  xml: "PostInPrivilegedMode",
  defaultValueXML: false,
  xmlParents: documentProperties,
},
```

- [ ] **Step 4.2: Прогнать `toXML.test`**

Run: `pnpm --filter @nakidka/core test toXML.test --testPathPattern metadataDocument`

Ожидание: дельта уменьшилась — нет более ошибок про `ActionsWritingOnPost`/`PrivilegedPostingMode`. Всё ещё красный из-за пустых тегов и `Numerator`.

- [ ] **Step 4.3: Коммит**

```bash
git add packages/core/metadata/appliedObjects/metadataDocument/rules.ts
git commit -m "fix: :wrench: исправить XML-теги actionsWritingOnPost/privilegedPostingMode

- actionsWritingOnPost → xml=RegisterRecordsWritingOnPost (фикстура использует этот тег)
- privilegedPostingMode → xml=PostInPrivilegedMode"
```

---

## Task 5: Добавить `numerator` и `privilegedUnpostingMode`

**Зачем:** `numerator` и `privilegedUnpostingMode` есть в фикстуре `full.xml` и `withNumerator.xml`, но отсутствуют в `rules.ts`. Также `numerator` в `types.ts` ошибочно типизирован как вложенный объект `MetadataDocumentNumerator` — заменяем на `string` (ссылка на нумератор).

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/types.ts`

- [ ] **Step 5.1: В `types.ts` заменить тип `numerator`**

В `MetadataDocument`:
```ts
numerator?: string
```

В `MetadataDocumentXML`:
```ts
Numerator?: string
```

В `MetadataDocumentYAML`:
```ts
Нумератор?: string
```

Удалить ставшие ненужными импорты:
```ts
import {
  MetadataDocumentNumerator,
  MetadataDocumentNumeratorXML,
  MetadataDocumentNumeratorYAML,
} from "~/metadata/appliedObjects/metadataDocumentNumerator/types"
```

- [ ] **Step 5.2: В `rules.ts`, в `properties`, добавить `numerator` и `privilegedUnpostingMode`**

```ts
numerator: {
  yaml: "Нумератор",
  type: "string",
  xmlParents: documentProperties,
  referenceScope: { target: "topLevel", allowedTypes: ["Нумератор"] },
  defaultValueXMLRaw: "",
},
privilegedUnpostingMode: {
  yaml: "ПривилегированныйРежимПриОтменеПроведения",
  type: "boolean",
  xml: "UnpostInPrivilegedMode",
  defaultValueXML: false,
  xmlParents: documentProperties,
},
```

- [ ] **Step 5.3: Найти и проверить внешних потребителей API `MetadataDocument.numerator`**

Run:
```bash
grep -rn '\.numerator\b' packages/ | grep -v __fixtures__ | grep -v test\.ts | grep -v node_modules
```

Если в `packages/cli` или `packages/vscode-extension` встречается обращение к `numerator` как к объекту (например, `doc.numerator.numberType`) — это тот самый риск из спеки. **Тогда:** добавить отдельный шаг миграции тех файлов; иначе просто продолжать.

- [ ] **Step 5.4: Прогнать `pnpm test` (типы и тесты)**

Run: `pnpm test`

Ожидание: типизация чистая (`numerator?: string` совместим с пустой строкой и со ссылкой). `toXML.test` ещё красный, но дельта уменьшилась.

- [ ] **Step 5.5: Коммит**

```bash
git add packages/core/metadata/appliedObjects/metadataDocument/rules.ts \
        packages/core/metadata/appliedObjects/metadataDocument/types.ts
git commit -m "feat: :sparkles: numerator + privilegedUnpostingMode для metadataDocument

- numerator: string (ссылка) с referenceScope topLevel/Нумератор
- privilegedUnpostingMode → xml=UnpostInPrivilegedMode
- types: numerator теперь string вместо MetadataDocumentNumerator"
```

---

## Task 6: Массовый `defaultValueXMLRaw` для пустых тегов

**Зачем:** `<Synonym/>`, `<Comment/>`, `<DefaultObjectForm/>` и т.п. в фикстуре имеют пустые формы. Без `defaultValueXMLRaw` оркестратор не сериализует поле, если в модели его нет — и round-trip ломается.

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/rules.ts`

- [ ] **Step 6.1: Скалярные пустышки (`""`)**

В `properties`, добавить `defaultValueXMLRaw: ""` к каждому из:

- `synonym`
- `comment`
- `auxiliaryObjectForm`
- `auxiliaryListForm`
- `auxiliaryChoiceForm`
- `defaultObjectForm`
- `defaultListForm`
- `defaultChoiceForm`
- `objectPresentation`
- `extendedObjectPresentation`
- `listPresentation`
- `extendedListPresentation`
- `explanation`

Пример для `synonym`:
```ts
synonym: {
  yaml: "Синоним",
  type: "I8nText",
  xmlParents: documentProperties,
  defaultValueXMLRaw: "",
},
```

- [ ] **Step 6.2: Коллекционные пустышки (`{}`)**

Добавить `defaultValueXMLRaw: {}` к:

- `basedOn`
- `registerRecords`
- `characteristics`
- `dataLockFields`
- `inputByString`

Пример:
```ts
basedOn: {
  yaml: "ВводитсяНаОсновании",
  type: "MetadataItemLinks",
  xmlParents: documentProperties,
  defaultValueXMLRaw: {},
},
```

- [ ] **Step 6.3: Прогнать `toXML.test`**

Run: `pnpm --filter @nakidka/core test toXML.test --testPathPattern metadataDocument`

Ожидание: тест **зелёный** (round-trip побайтовый на `full.xml` пройден).

- Если тест всё ещё красный — внимательно сравнить дифф: какой именно тег расходится. Скорее всего это:
  - не учтённый `defaultValueXMLRaw` для одного-двух свойств (расширить список);
  - `Numerator` сериализуется не пустым тегом — проверить, что `defaultValueXMLRaw: ""` (Step 5.2) работает для пустого `<Numerator/>`;
  - порядок свойств в XML отличается от порядка в `properties` — это отдельная проблема (см. risks).

- [ ] **Step 6.4: Коммит**

```bash
git add packages/core/metadata/appliedObjects/metadataDocument/rules.ts
git commit -m "feat: :sparkles: defaultValueXMLRaw для пустых тегов metadataDocument

- 13 скалярных полей: defaultValueXMLRaw: \"\"
- 5 коллекционных полей: defaultValueXMLRaw: {}
- round-trip toXML на full.xml теперь побайтовый"
```

---

## Task 7: `additionalIndexes` через `filePath` + выровнять `objectBelonging`

**Зачем:** в реальном sync-выгрузе `AdditionalIndexes` живёт в отдельном файле `Ext/AdditionalIndexes.xml`, а не внутри `<Document>` напрямую — это видно в `__fixtures__/sync/ДокументВсеСвойства/Ext/AdditionalIndexes.xml`. Catalog использует `filePath` — повторяем. `objectBelonging` приводим к стилю Sequence (runtime-only через YAML).

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/rules.ts`

- [ ] **Step 7.1: `additionalIndexes` — переключить на `filePath`**

Сейчас:
```ts
additionalIndexes: {
  yaml: "ДополнительныеИндексы",
  type: "AdditionalIndex",
  xmlParents: documentProperties,
},
```

Заменить на:
```ts
additionalIndexes: {
  yaml: "ДополнительныеИндексы",
  type: "AdditionalIndex",
  filePath: "Ext/AdditionalIndexes.xml",
},
```

- [ ] **Step 7.2: `objectBelonging` — выровнять под Sequence**

Сейчас:
```ts
objectBelonging: {
  yaml: "ПринадлежностьОбъекта",
  type: "SystemEnumeration",
  typeSE: "ObjectBelonging",
  xmlParents: documentProperties,
},
```

Заменить на:
```ts
objectBelonging: {
  yaml: "ПринадлежностьОбъекта",
  type: "SystemEnumeration",
  typeSE: "ObjectBelonging",
  implicitValueYAML: "Native",
  toYAML: false,
  fromYAML: false,
  xmlParents: documentProperties,
},
```

- [ ] **Step 7.3: Прогнать `pnpm test`**

Run: `pnpm test`

Ожидание: `fromXML.test`, `toXML.test`, всё остальное — зелёное. (Изменение `additionalIndexes` влияет на расположение в выгрузке, но `full.xml` его не содержит, так что прежний тест не задет.)

- [ ] **Step 7.4: Коммит**

```bash
git add packages/core/metadata/appliedObjects/metadataDocument/rules.ts
git commit -m "refactor: :recycle: additionalIndexes через filePath, objectBelonging как у Sequence

- additionalIndexes: filePath=Ext/AdditionalIndexes.xml (по образцу Catalog)
- objectBelonging: toYAML/fromYAML=false, implicitValueYAML=Native"
```

---

## Task 8: `fromYAML.test.ts` и `toYAML.test.ts`

**Зачем:** проверить, что после массовых правок rules YAML-направление работает: model→YAML→model даёт ту же модель.

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataDocument/fromYAML.test.ts`
- Create: `packages/core/metadata/appliedObjects/metadataDocument/toYAML.test.ts`

- [ ] **Step 8.1: Прочитать соседние тесты**

Run: `cat packages/core/metadata/appliedObjects/metadataSequence/fromYAML.test.ts packages/core/metadata/appliedObjects/metadataSequence/toYAML.test.ts`

- [ ] **Step 8.2: Написать `toYAML.test.ts` (model→YAML)**

```ts
import { describe, expect, it } from "vitest"
import { exportMetadataItemToYAML } from "~/metadata/orchestration"
import { mockContextToYAML } from "~/metadata/orchestration/__test-helpers__/mockContext"
import { MetadataDocumentRules } from "./rules"

describe("MetadataDocument toYAML", () => {
  it("сериализует минимальную модель", () => {
    const yaml = exportMetadataItemToYAML({
      context: mockContextToYAML(),
      data: { name: "ТестДокумент", numberType: "String" },
      rule: MetadataDocumentRules,
    })
    expect(yaml).toContain("Имя: ТестДокумент")
    expect(yaml).toContain("ТипНомера: String")
  })
})
```

- [ ] **Step 8.3: Написать `fromYAML.test.ts` (YAML→model)**

```ts
import { describe, expect, it } from "vitest"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { mockContextFromYAML } from "~/metadata/orchestration/__test-helpers__/mockContext"
import { MetadataDocumentRules } from "./rules"

describe("MetadataDocument fromYAML", () => {
  it("парсит минимальный YAML", () => {
    const result = importMetadataItemFromYAML({
      context: mockContextFromYAML(),
      yaml: { Имя: "ТестДокумент", ТипНомера: "String" },
      rule: MetadataDocumentRules,
      name: "ТестДокумент",
    })
    expect(result?.name).toBe("ТестДокумент")
    expect(result?.numberType).toBe("String")
  })
})
```

- [ ] **Step 8.4: Прогнать тесты**

Run: `pnpm --filter @nakidka/core test --testPathPattern metadataDocument`

Ожидание: оба новых теста зелёные.

- [ ] **Step 8.5: Коммит**

```bash
git add packages/core/metadata/appliedObjects/metadataDocument/fromYAML.test.ts \
        packages/core/metadata/appliedObjects/metadataDocument/toYAML.test.ts
git commit -m "test: :white_check_mark: fromYAML/toYAML тесты для metadataDocument"
```

---

## Task 9: `convertFromXML.test.ts` — конец-в-конец XML→YAML на диске

**Зачем:** проверить, что walker `convertAppliedObjectFromXML` корректно работает с обновлённым правилом — генерирует YAML-проект на диске. По образцу `metadataSequence/convertFromXML.test.ts`.

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataDocument/convertFromXML.test.ts`

- [ ] **Step 9.1: Прочитать соседний тест**

Run: `cat packages/core/metadata/appliedObjects/metadataSequence/convertFromXML.test.ts`

- [ ] **Step 9.2: Написать `convertFromXML.test.ts`**

```ts
import fs from "fs"
import os from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"
import { mockContextFromXML } from "~/metadata/orchestration/__test-helpers__/mockContext"
import { MetadataDocumentRules } from "./rules"

describe("MetadataDocument convertFromXML", () => {
  let tmpDir: string

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it("конвертирует minimal.xml в YAML на диске", async () => {
    tmpDir = fs.mkdtempSync(join(os.tmpdir(), "doc-convert-"))

    await convertAppliedObjectFromXML({
      rule: MetadataDocumentRules,
      context: mockContextFromXML(),
      inputDir: join(__dirname, "__fixtures__"),
      name: "minimal",
      outputDir: tmpDir,
    })

    const yamlPath = join(tmpDir, "minimal", "Свойства.yaml")
    expect(fs.existsSync(yamlPath)).toBe(true)
    const yamlContent = fs.readFileSync(yamlPath, "utf-8")
    expect(yamlContent).toContain("Имя: ДокументПоУмолчанию")
  })
})
```

- [ ] **Step 9.3: Прогнать**

Run: `pnpm --filter @nakidka/core test convertFromXML --testPathPattern metadataDocument`

Ожидание: зелёный.

- [ ] **Step 9.4: Коммит**

```bash
git add packages/core/metadata/appliedObjects/metadataDocument/convertFromXML.test.ts
git commit -m "test: :white_check_mark: convertFromXML.test для metadataDocument"
```

---

## Task 10: `syncToXML.test.ts` — round-trip YAML→XML на диске

**Зачем:** финальный тест, симметричный Task 9. Берёт sync-фикстуру `__fixtures__/sync/ДокументВсеСвойства*`, прогоняет YAML→XML и побайтово сравнивает с исходной фикстурой.

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataDocument/syncToXML.test.ts`

- [ ] **Step 10.1: Прочитать соседний тест**

Run: `cat packages/core/metadata/appliedObjects/metadataSequence/syncToXML.test.ts`

Цель: повторить именно тот формат — он стабилизирован.

- [ ] **Step 10.2: Написать `syncToXML.test.ts`**

(Скопировать структуру из metadataSequence/syncToXML.test.ts, заменить:
- `MetadataSequenceRules` → `MetadataDocumentRules`,
- ссылки на фикстуру `metadataSequence/__fixtures__/sync/...` → `metadataDocument/__fixtures__/sync/ДокументВсеСвойства...`,
- ожидаемое имя `ПоследовательностьПоУмолчанию` → `ДокументВсеСвойства`.)

Главные assertions:
1. После `syncAppliedObjectToXML` файл `Documents/ДокументВсеСвойства.xml` создан в outputDir.
2. Содержимое **побайтово равно** `__fixtures__/sync/ДокументВсеСвойства.xml`.
3. (Опционально) `Documents/ДокументВсеСвойства/Ext/AdditionalIndexes.xml` тоже создан и равен исходному.

- [ ] **Step 10.3: Прогнать**

Run: `pnpm --filter @nakidka/core test syncToXML --testPathPattern metadataDocument`

Ожидание: зелёный. Если красный — анализировать diff между ожидаемым и фактическим XML, искать незакрытый `defaultValueXMLRaw` или порядок тегов.

- [ ] **Step 10.4: Коммит**

```bash
git add packages/core/metadata/appliedObjects/metadataDocument/syncToXML.test.ts
git commit -m "test: :white_check_mark: syncToXML round-trip для metadataDocument"
```

---

## Task 11: Снять ослабленные assertions в `configuration/syncToXML.test.ts`

**Зачем:** на line ~84 файла `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts` есть комментарий «Полный round-trip пока невозможен из-за пробелов в MetadataDocumentRules…» с ослабленными assertions. После Task 1–10 эти ослабления больше не нужны.

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`

- [ ] **Step 11.1: Прочитать текущее состояние**

Run: `sed -n '70,110p' packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`

- [ ] **Step 11.2: Заменить ослабленные assertions полноценными**

Удалить комментарий-объяснение и привести assertions для Document к тому же уровню, что для Sequence/DocumentNumerator (полное побайтовое сравнение, не «только наличие файла»).

- [ ] **Step 11.3: Прогнать весь configuration test-suite**

Run: `pnpm --filter @nakidka/core test --testPathPattern configuration`

Ожидание: зелёный, включая Document.

- [ ] **Step 11.4: Прогнать `pnpm test` целиком**

Run: `pnpm test`

Ожидание: ВСЁ зелёное. Это критерий готовности из спеки.

- [ ] **Step 11.5: Коммит**

```bash
git add packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
git commit -m "test: :white_check_mark: убрать ослабленные assertions для Document round-trip

Закрывает project_document_rules_gaps.md"
```

---

## Self-Review

Прохождение по спеке:

| Раздел спеки | Покрыто в плане |
|---|---|
| Группа A (расходящиеся xml-теги) | Task 4 |
| Группа B (новые свойства numerator/privilegedUnpostingMode) | Task 5 |
| Группа C (xmlRoot, internalInfo, additionalIndexes filePath) | Task 3, Task 7 |
| Группа D (defaultValueXMLRaw) | Task 6 |
| Группа E (objectBelonging, xmlParents-константы, requiredXMLParents) | Task 3 + Task 7 |
| `types.ts` — `numerator: string` | Task 5 |
| `index.ts`, удаление `fromYAML.ts`, `importMetadataFileWithGraph.ts`, `appliedObjects/index.ts` | Task 1 |
| `fromXML/toXML/fromYAML/toYAML/convertFromXML/syncToXML` тесты | Task 2, 3, 8, 9, 10 |
| Снять ослабленные assertions в `configuration/syncToXML.test.ts` | Task 11 |

Все разделы покрыты. Никаких placeholder-шагов. Имена функций (`importMetadataItemFromXML`, `exportMetadataItemToXML`, `importMetadataItemFromYAML`, `exportMetadataItemToYAML`, `convertAppliedObjectFromXML`, `MetadataDocumentRules`, `V8_MDCLASSES_ROOT`) консистентны между задачами.

**Замечание:** в шагах с тестами (Task 2, 8, 9, 10) есть оговорка «сверить точные имена помощников с соседним файлом». Это не placeholder — это страховка от незначительных расхождений в именовании mock-контекстов (`mockContextFromXML` vs `mockContext`), которые гадательно угадывать не нужно — реализатор увидит соседа и повторит.
