# XML Parser Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить рабочий разбор XML со связки `fast-xml-parser + compress` на проверенный однопроходный сборщик `saxes`, сохранив публичный API и результат для корректных поддерживаемых XML.

**Architecture:** `importer.ts` остаётся тонкой публичной оболочкой с прежними экспортами и передаёт данные во внутренний `saxesParser.ts`. Проверенный прототип переносится из `experimental` в рабочий модуль; старая реализация и временная сравнительная инфраструктура удаляются после контрольного замера.

**Tech Stack:** TypeScript 7, Node.js 26, pnpm 10, Vitest 4, `saxes` 6, `fast-xml-parser` 5.9 только для `XMLBuilder` экспорта.

## Global Constraints

- Не менять сигнатуру, именованный export и default export `importContentFromXML`.
- Не менять `ImportContentFromXMLOptions`, `I8N_TEXT_FIELDS` и существующие места вызова.
- Для корректных поддерживаемых XML сохранить строки, атрибуты, массивы, `ChildItems`, `xsi:nil`, пустые элементы, PI, BOM, XML-фрагменты и неперечисляемый `childOrder`.
- Некорректный XML должен завершаться ошибкой `saxes`; текст ошибки не нормализовать под `fast-xml-parser`.
- Не оставлять переключатель, двойной рабочий разбор или запасной парсер.
- Не удалять `fast-xml-parser` из зависимостей: XML-экспорт использует `XMLBuilder`.
- Не изменять существующие XML-фикстуры.
- Не запускать mutation testing в этом цикле по решению пользователя.
- Результаты ручных замеров хранить только в `/private/tmp`, не добавлять их в git.
- Для итоговой производительности нет автоматического порога: медианы трёх прогонов передаются пользователю для ручной оценки.

## File Structure

- Create: `packages/core/xml/import/saxesParser.ts` — внутренний событийный разбор и сборка результата NKDK.
- Modify: `packages/core/xml/import/importer.ts` — публичные типы и тонкий вызов внутреннего парсера.
- Modify: `packages/core/xml/import/importer.test.ts` — единый договор публичного парсера и строгая ошибка некорректного XML.
- Delete: `packages/core/xml/import/experimental/saxesImporter.ts` — бывший прототип после переноса.
- Delete: `packages/core/xml/import/experimental/saxesImporter.test.ts` — сравнительные тесты после переноса договоров.
- Delete: `packages/core/scripts/xml-parser-corpus.mjs` — временный сборщик сравнительного корпуса.
- Delete: `packages/core/scripts/xml-parser-corpus.test.ts` — тест временного сборщика.
- Delete: `packages/core/scripts/xml-parser-profile-worker.mjs` — worker двойного замера.
- Delete: `packages/core/scripts/measure-xml-parsers.mjs` — двойной измеритель.
- Delete: `packages/core/scripts/measure-xml-parsers.test.ts` — тест двойного измерителя.
- Modify: `packages/core/package.json` — удалить только команду `measure:xml-parsers`; зависимости `saxes` и `fast-xml-parser` сохранить.

---

### Task 1: Зафиксировать контрольную эквивалентность и производительность

**Files:**
- Read: `packages/core/scripts/measure-xml-parsers.mjs`
- Output outside git: `/private/tmp/nkdk-xml-parser-replacement-before.json`

**Interfaces:**
- Consumes: текущий `importContentFromXML`, `importContentFromXMLWithSaxes` и корпус compact ERP.
- Produces: контрольные медианы старой и новой реализаций непосредственно перед заменой.

- [ ] **Step 1: Убедиться, что дерево не содержит незаписанных изменений**

Run:

```bash
git status --short
```

Expected: пустой вывод. Если есть изменения пользователя, не изменять и не включать их в последующие коммиты.

- [ ] **Step 2: Повторить сравнение полного корпуса**

Run:

```bash
node packages/core/scripts/measure-xml-parsers.mjs \
  --xml-dir /Users/nikita/git/round-trip-compact/cf/erp \
  --large /Users/nikita/git/round-trip-compact/cf/erp/Roles/БазовыеПраваБПУХ/Ext/Rights.xml \
  > /private/tmp/nkdk-xml-parser-replacement-before.json
```

Expected: exit code `0`; JSON содержит `equivalent: true`, `fixtureFiles: 704`, `smallFiles: 5000`, `largeFiles: 1`, по три прогона `current` и `saxes`.

- [ ] **Step 3: Прочитать и зафиксировать контрольные медианы в рабочей заметке**

Run:

```bash
node -e 'const r=require("/private/tmp/nkdk-xml-parser-replacement-before.json"); console.log(JSON.stringify({current:r.current,saxes:r.saxes},null,2))'
```

Expected: выводит `medianElapsedMs` и `medianPeakRssMiB` обоих парсеров. Файл не добавлять в git; в этой задаче коммит не создаётся.

---

### Task 2: Переключить публичный импорт на saxes

**Files:**
- Create: `packages/core/xml/import/saxesParser.ts`
- Modify: `packages/core/xml/import/importer.ts`
- Modify: `packages/core/xml/import/importer.test.ts`

**Interfaces:**
- Consumes: `ImportContentFromXMLOptions` из `importer.ts`, события `SaxesParser` и поведение проверенного прототипа.
- Produces: `parseXmlWithSaxes<T>(data: string, options?: ImportContentFromXMLOptions): T`; публичный `importContentFromXML<T>(data, options): T` делегирует ему без изменения API.

- [ ] **Step 1: Добавить недостающие проверки публичного договора**

В `importer.test.ts` оставить существующие шесть тестов и добавить параметризованные случаи:

```ts
it.each([
  ["entity", "<Root>A&amp;B</Root>", { Root: "A&B" }],
  ["comment", "<Root>A<!--ignored-->B</Root>", { Root: "AB" }],
  ["attribute and text", '<Root id="1">x</Root>', { Root: { _id: "1", "#text": "x" } }],
  ["namespace prefixes", '<xr:Root xr:id="1"/>', { "xr:Root": { "_xr:id": "1" }],
])("сохраняет %s", (_case, xml, expected) => {
  expect(importContentFromXML(xml)).toEqual(expected)
})
```

Добавить самостоятельные договоры:

```ts
it("преобразует processing instruction в элемент", () => {
  expect(importContentFromXML('<Root><?foo bar="baz"?></Root>', { preserveEmptyElements: true })).toEqual({
    Root: { "?foo": { _bar: "baz" } },
  })
})

it("отклоняет имена, небезопасные для объекта", () => {
  expect(() => importContentFromXML("<Root><__proto__>x</__proto__></Root>")).toThrow()
})

it("сохраняет BOM перед XML declaration как документный текст", () => {
  expect(importContentFromXML('\uFEFF<?xml version="1.0"?><Root/>')).toEqual({
    "?xml": { _version: "1.0" },
    Root: undefined,
    "#text": "\uFEFF",
  })
})

it("разбирает XML-фрагмент с несколькими корнями", () => {
  const result = importContentFromXML<{ Command: Array<{ _id: string }> }>(
    '<Command id="1"/><Command id="2"/>'
  )

  expect(result).toEqual({ Command: [{ _id: "1" }, { _id: "2" }] })
  expect(childOrderOf(result)).toEqual([
    { key: "Command", index: 0 },
    { key: "Command", index: 1 },
  ])
})

it("отклоняет некорректный XML", () => {
  expect(() => importContentFromXML("<Root><Child></Root>")).toThrow()
})
```

- [ ] **Step 2: Подтвердить красный этап строгого XML**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run xml/import/importer.test.ts -t "отклоняет некорректный XML"
```

Expected: FAIL, потому что текущий `fast-xml-parser` принимает этот несогласованный XML.

- [ ] **Step 3: Создать внутренний рабочий модуль saxes**

Создать `packages/core/xml/import/saxesParser.ts` с полным содержимым:

```ts
import { SaxesParser, type SaxesTagPlain, type XMLDecl } from "saxes"
import type { ImportContentFromXMLOptions } from "./importer"

const XML_METADATA = Symbol.for("metadata")
const PI_ATTRIBUTE = /([^\s=]+)\s*=\s*(["'])([\s\S]*?)\2/gu
const UNSAFE_NAMES = new Set([
  "__proto__",
  "constructor",
  "prototype",
  "hasOwnProperty",
  "toString",
  "valueOf",
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__",
])

type XmlContainer = Record<string, unknown> | Array<Record<string, unknown>>

interface ElementFrame {
  name: string
  attributes: Record<string, string>
  text: string
  children: Record<string, unknown>
  childCounts: Record<string, number>
  childOrder: Array<{ key: string; index: number }>
  orderedChildren: Array<Record<string, unknown>> | undefined
}

const createFrame = (name: string, attributes: Record<string, string> = {}): ElementFrame => ({
  name,
  attributes,
  text: "",
  children: {},
  childCounts: {},
  childOrder: [],
  orderedChildren: name === "ChildItems" ? [] : undefined,
})

export function parseXmlWithSaxes<T>(
  data: string,
  options: ImportContentFromXMLOptions = {}
): T {
  const document = createFrame("")
  const stack = [document]
  const parser = new SaxesParser({ xmlns: false, fragment: !hasXmlDeclaration(data) })

  parser.on("xmldecl", (declaration) => {
    if (data.startsWith("\uFEFF")) document.text = "\uFEFF"
    appendDeclaration(document, declaration)
  })
  parser.on("opentag", (tag: SaxesTagPlain) => {
    assertSafeName(tag.name)
    stack.push(createFrame(tag.name, tag.attributes))
  })
  parser.on("text", (text) => appendText(stack, text))
  parser.on("cdata", (text) => appendText(stack, text))
  parser.on("processinginstruction", ({ target, body }) => {
    const attributes: Record<string, string> = {}
    for (const match of body.matchAll(PI_ATTRIBUTE)) attributes[`_${match[1]}`] = match[3] ?? ""
    const parent = stack.at(-1)
    if (parent === undefined) throw new Error("XML PI вне документа")
    appendChild(parent, `?${target}`, attributes)
  })
  parser.on("closetag", () => {
    const frame = stack.pop()
    const parent = stack.at(-1)
    if (frame === undefined || parent === undefined) throw new Error("Несогласованный стек XML")
    appendChild(parent, frame.name, finalizeFrame(frame, options))
  })
  parser.on("error", (error) => {
    throw error
  })
  parser.write(data).close()

  return finalizeFrame(document, { ...options, preserveEmptyElements: true }) as T
}

function appendText(stack: ElementFrame[], text: string): void {
  if (stack.length === 1) return
  const current = stack.at(-1)
  if (current !== undefined) current.text += text
}

function appendDeclaration(document: ElementFrame, declaration: XMLDecl): void {
  const value: Record<string, string> = {}
  if (declaration.version !== undefined) value._version = declaration.version
  if (declaration.encoding !== undefined) value._encoding = declaration.encoding
  if (declaration.standalone !== undefined) value._standalone = declaration.standalone
  appendChild(document, "?xml", value)
}

function appendChild(parent: ElementFrame, name: string, value: unknown): void {
  const index = parent.childCounts[name] ?? 0
  parent.childCounts[name] = index + 1

  if (parent.orderedChildren !== undefined) {
    parent.orderedChildren.push({ [name]: value })
    return
  }

  parent.childOrder.push({ key: name, index })
  if (!Object.prototype.hasOwnProperty.call(parent.children, name)) {
    parent.children[name] = value
    return
  }

  const previous = parent.children[name]
  if (Array.isArray(previous)) previous.push(value)
  else parent.children[name] = [previous, value]
}

function finalizeFrame(frame: ElementFrame, options: ImportContentFromXMLOptions): unknown {
  const container: XmlContainer = frame.orderedChildren ?? frame.children
  const properties = containerProperties(container)
  let assignedAttributesCount = 0
  for (const [name, attributeValue] of Object.entries(frame.attributes)) {
    if (name === "xsi:nil" && options.preserveXsiNil !== true) continue
    properties[`_${name}`] = attributeValue
    assignedAttributesCount += 1
  }
  if (frame.text.length > 0) properties["#text"] = frame.text

  const keys = Object.keys(container)
  if (
    !Array.isArray(container) &&
    assignedAttributesCount === 0 &&
    keys.length === 1 &&
    properties["#text"] !== undefined
  ) {
    return properties["#text"]
  }
  if (keys.length === 0 && frame.name !== "" && options.preserveEmptyElements !== true) return undefined
  if (frame.orderedChildren === undefined && frame.childOrder.length > 0) {
    Object.defineProperty(container, XML_METADATA, {
      value: { childOrder: frame.childOrder },
      enumerable: false,
    })
  }
  return container
}

const containerProperties = (container: XmlContainer): Record<PropertyKey, unknown> =>
  container as unknown as Record<PropertyKey, unknown>

function assertSafeName(name: string): void {
  if (UNSAFE_NAMES.has(name)) throw new Error(`Небезопасное имя XML-элемента: ${name}`)
}

function hasXmlDeclaration(data: string): boolean {
  return data.startsWith("<?xml") || data.startsWith("\uFEFF<?xml")
}
```

Итоговый модуль не должен импортировать `fast-xml-parser` и не должен экспортироваться из `packages/core/index.ts`.

- [ ] **Step 4: Превратить importer.ts в тонкую публичную оболочку**

Удалить импорт `XMLParser`, `defaultOptions`, `compress`, `propName`,
`assignAttributes` и `isIgnoredXsiNilAttribute`. Сохранить массив
`I8N_TEXT_FIELDS` и определить остальную часть файла так:

```ts
import { parseXmlWithSaxes } from "./saxesParser"

export type ImportContentFromXMLOptions = {
  preserveXsiNil?: true
  preserveEmptyElements?: true
}

export const importContentFromXML = <T>(
  data: string,
  importOptions: ImportContentFromXMLOptions = {}
): T => parseXmlWithSaxes<T>(data, importOptions)

export default importContentFromXML
```

`I8N_TEXT_FIELDS` остаётся между import и типом с тем же содержимым, что до изменения.

- [ ] **Step 5: Получить зелёный тест строгого XML**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run xml/import/importer.test.ts -t "отклоняет некорректный XML"
```

Expected: PASS; ошибка приходит от `saxes`.

- [ ] **Step 6: Проверить весь публичный договор и типы**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  xml/import/importer.test.ts \
  xml/import/experimental/saxesImporter.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: оба набора и `type-check` проходят. Экспериментальный тест пока остаётся как временная независимая проверка переноса.

- [ ] **Step 7: Проверить отсутствие старого рабочего разбора**

Run:

```bash
rg -n "XMLParser|function compress|defaultOptions|assignAttributes" packages/core/xml/import/importer.ts
```

Expected: пустой вывод.

- [ ] **Step 8: Закоммитить рабочую замену**

```bash
git add \
  packages/core/xml/import/importer.ts \
  packages/core/xml/import/importer.test.ts \
  packages/core/xml/import/saxesParser.ts
git commit -m "perf: :zap: заменить XML-парсер на saxes"
```

---

### Task 3: Проверить новую рабочую реализацию и удалить эксперимент

**Files:**
- Delete: `packages/core/xml/import/experimental/saxesImporter.ts`
- Delete: `packages/core/xml/import/experimental/saxesImporter.test.ts`
- Delete: `packages/core/scripts/xml-parser-corpus.mjs`
- Delete: `packages/core/scripts/xml-parser-corpus.test.ts`
- Delete: `packages/core/scripts/xml-parser-profile-worker.mjs`
- Delete: `packages/core/scripts/measure-xml-parsers.mjs`
- Delete: `packages/core/scripts/measure-xml-parsers.test.ts`
- Modify: `packages/core/package.json`
- Output outside git: `/private/tmp/nkdk-xml-parser-replacement-after.json`

**Interfaces:**
- Consumes: публичный `importContentFromXML`, новый `parseXmlWithSaxes` и временный двойной измеритель.
- Produces: зафиксированные медианы рабочей реализации и production-дерево без старого парсера и экспериментальной инфраструктуры.

- [ ] **Step 1: Измерить уже переключённый публичный парсер до удаления runner**

Run:

```bash
node packages/core/scripts/measure-xml-parsers.mjs \
  --xml-dir /Users/nikita/git/round-trip-compact/cf/erp \
  --large /Users/nikita/git/round-trip-compact/cf/erp/Roles/БазовыеПраваБПУХ/Ext/Rights.xml \
  > /private/tmp/nkdk-xml-parser-replacement-after.json
```

Expected: exit code `0`, `equivalent: true`, 5705 файлов и три прогона каждого пути. После Task 2 оба пути используют один и тот же алгоритм `saxes`; поле `current` измеряет публичную оболочку.

- [ ] **Step 2: Показать контрольные и итоговые медианы без автоматического порога**

Run:

```bash
node -e 'for(const name of ["before","after"]){const r=require(`/private/tmp/nkdk-xml-parser-replacement-${name}.json`); console.log(name,JSON.stringify({current:r.current,saxes:r.saxes},null,2))}'
```

Expected: обе серии медиан напечатаны для последующей ручной оценки пользователем. Не останавливать реализацию только из-за процентного отличия; остановиться при ошибке, несовпадении результатов или явно аномальном измерении.

- [ ] **Step 3: Удалить экспериментальные исходники и сравнительные тесты**

Удалить ровно:

```text
packages/core/xml/import/experimental/saxesImporter.ts
packages/core/xml/import/experimental/saxesImporter.test.ts
packages/core/scripts/xml-parser-corpus.mjs
packages/core/scripts/xml-parser-corpus.test.ts
packages/core/scripts/xml-parser-profile-worker.mjs
packages/core/scripts/measure-xml-parsers.mjs
packages/core/scripts/measure-xml-parsers.test.ts
```

Существующие XML-фикстуры и другие scripts не изменять.

- [ ] **Step 4: Удалить только команду двойного измерителя**

В `packages/core/package.json` удалить:

```json
"measure:xml-parsers": "node scripts/measure-xml-parsers.mjs",
```

Сохранить обе зависимости:

```json
"fast-xml-parser": "^5.9.2",
"saxes": "^6.0.0"
```

`pnpm-lock.yaml` в этой задаче изменяться не должен.

- [ ] **Step 5: Проверить отсутствие ссылок на эксперимент и старый XMLParser**

Run:

```bash
rg -n "experimental/saxesImporter|importContentFromXMLWithSaxes|measure:xml-parsers|new XMLParser|function compress" \
  packages/core packages/mcp
```

Expected: пустой вывод. Вхождения `XMLBuilder` и зависимости `fast-xml-parser` допустимы и должны остаться.

- [ ] **Step 6: Проверить целевой тест и типы после удаления**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run xml/import/importer.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: обе команды PASS.

- [ ] **Step 7: Закоммитить уборку**

```bash
git add \
  packages/core/xml/import/experimental \
  packages/core/scripts/xml-parser-corpus.mjs \
  packages/core/scripts/xml-parser-corpus.test.ts \
  packages/core/scripts/xml-parser-profile-worker.mjs \
  packages/core/scripts/measure-xml-parsers.mjs \
  packages/core/scripts/measure-xml-parsers.test.ts \
  packages/core/package.json
git commit -m "chore: :wrench: удалить эксперимент XML-парсера"
```

---

### Task 4: Проверить сборку и весь проект

**Files:**
- Verify only: production- и test-файлы Tasks 2–3.

**Interfaces:**
- Consumes: окончательный `importContentFromXML` на `saxes`.
- Produces: свидетельство успешной сборки, проверки типов и полного набора тестов без mutation testing.

- [ ] **Step 1: Проверить production-сборку core**

Run:

```bash
pnpm --filter @nkdk/core build
```

Expected: PASS; esbuild разрешает импорт `saxes` и создаёт `packages/core/dist`.

- [ ] **Step 2: Проверить production-сборку MCP, включающую core**

Run:

```bash
pnpm --filter @nkdk/mcp build
```

Expected: PASS; собранные worker и MCP-сервер разрешают рабочий XML-парсер.

- [ ] **Step 3: Запустить полную проверку типов**

Run:

```bash
pnpm type-check
```

Expected: PASS во всех workspace-пакетах.

- [ ] **Step 4: Запустить полный набор тестов**

Run:

```bash
pnpm test
```

Expected: PASS во всех workspace-пакетах, включая обновлённый `importer.test.ts`.

- [ ] **Step 5: Проверить итоговое состояние**

Run:

```bash
git status --short
git diff --check
git log --oneline -4
```

Expected: дерево чистое; последние production-коммиты — замена парсера и удаление экспериментальной инфраструктуры. Mutation testing не запускать.
