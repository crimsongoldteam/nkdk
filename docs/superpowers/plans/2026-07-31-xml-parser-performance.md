# XML Parser Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ускорить текущий XML-парсер настройкой `jPath: false` и создать изолированный однопроходный прототип на `saxes` для проверки эквивалентности, времени и peak RSS.

**Architecture:** Рабочий `importContentFromXML` сохраняет текущую связку `fast-xml-parser + compress` и получает только безопасную настройку. Отдельный неэкспортируемый прототип использует события `saxes` и стек открытых элементов, чтобы сразу формировать объект NKDK с `childOrder`; отдельный runner сравнивает оба результата и измеряет их в новых процессах.

**Tech Stack:** TypeScript 7, Node.js 26, pnpm 10, Vitest 4, `fast-xml-parser` 5.9, `saxes` 6.

## Global Constraints

- Не изменять существующие XML-фикстуры: они являются источником истины.
- Не менять публичный договор `importContentFromXML` и не экспортировать прототип из `@nkdk/core`.
- Не подключать прототип к рабочему XML-import независимо от результата замера.
- Не добавлять патчи или форк `fast-xml-parser`; `saxes` должен быть прямой зависимостью `@nkdk/core`.
- `jPath: false` выпускается независимо от результата прототипа.
- Сравнение обязано учитывать неперечисляемый `Symbol.for("metadata").childOrder`.
- Каждый замер выполняется в новом процессе; для вывода используются медианы трёх прогонов.
- Прототип перспективен только при полном совпадении результатов, устойчивом выигрыше времени и снижении peak RSS; числового порога нет.
- Результаты ручного benchmark не добавлять в git.
- Перед завершением выполнить `pnpm type-check` и полный `pnpm test` из корня.

## File Structure

- Modify: `packages/core/xml/import/importer.ts` — добавить безопасную настройку рабочего парсера.
- Modify: `packages/core/xml/import/importer.test.ts` — зафиксировать ещё не покрытые границы текущего договора.
- Create: `packages/core/xml/import/experimental/saxesImporter.ts` — однопроходный прототип и только его внутренние helpers.
- Create: `packages/core/xml/import/experimental/saxesImporter.test.ts` — узкие проверки эквивалентности обоих парсеров.
- Create: `packages/core/scripts/xml-parser-corpus.mjs` — разбор параметров, выбор корпуса и сравнимое представление `childOrder`.
- Create: `packages/core/scripts/xml-parser-corpus.test.ts` — проверки параметров, выборки и пути первого расхождения.
- Create: `packages/core/scripts/xml-parser-profile-worker.mjs` — один изолированный прогон выбранного парсера.
- Create: `packages/core/scripts/measure-xml-parsers.mjs` — проверка эквивалентности и оркестрация трёх прогонов.
- Create: `packages/core/scripts/measure-xml-parsers.test.ts` — проверка запуска worker и агрегации медиан без реального benchmark.
- Modify: `packages/core/package.json` — прямой `saxes` и команда `measure:xml-parsers`.
- Modify: `pnpm-lock.yaml` — зафиксировать прямую зависимость workspace-пакета.

---

### Task 1: Зафиксировать наблюдаемый договор текущего парсера

**Files:**
- Modify: `packages/core/xml/import/importer.test.ts`

**Interfaces:**
- Consumes: `importContentFromXML<T>(data: string, options?: ImportContentFromXMLOptions): T` из `importer.ts`.
- Produces: узкие проверки XML declaration, CDATA, `ChildItems` и неперечисляемого `childOrder`, которые защищают последующие оптимизации.

- [ ] **Step 1: Добавить helper чтения metadata в существующий тестовый файл**

```ts
const XML_METADATA = Symbol.for("metadata")

const childOrderOf = (value: unknown): Array<{ key: string; index: number }> | undefined => {
  if (typeof value !== "object" || value === null) return undefined
  const metadata = (value as Record<PropertyKey, unknown>)[XML_METADATA]
  if (typeof metadata !== "object" || metadata === null) return undefined
  return (metadata as { childOrder?: Array<{ key: string; index: number }> }).childOrder
}
```

- [ ] **Step 2: Добавить характеристические проверки текущего договора**

Добавить в существующий `describe("importContentFromXML", ...)`:

```ts
it("сохраняет XML declaration и порядок разноимённых детей", () => {
  const result = importContentFromXML<{
    "?xml": { _version: string; _encoding: string }
    Root: { A: string[]; B: string }
  }>(`<?xml version="1.0" encoding="UTF-8"?><Root><A>1</A><B>2</B><A>3</A></Root>`)

  expect(result).toEqual({
    "?xml": { _version: "1.0", _encoding: "UTF-8" },
    Root: { A: ["1", "3"], B: "2" },
  })
  expect(childOrderOf(result)).toEqual([
    { key: "?xml", index: 0 },
    { key: "Root", index: 0 },
  ])
  expect(childOrderOf(result.Root)).toEqual([
    { key: "A", index: 0 },
    { key: "B", index: 0 },
    { key: "A", index: 1 },
  ])
})

it("сохраняет ordered-содержимое ChildItems", () => {
  const result = importContentFromXML<{
    Root: { ChildItems: Array<Record<string, unknown>> }
  }>("<Root><ChildItems><A/><B/><A/></ChildItems></Root>", { preserveEmptyElements: true })

  expect(result.Root.ChildItems).toEqual([{ A: {} }, { B: {} }, { A: {} }])
})

it("объединяет text и CDATA без обрезки пробелов", () => {
  expect(importContentFromXML("<Root> A<![CDATA[B]]> C</Root>")).toEqual({ Root: " AB C" })
})
```

- [ ] **Step 3: Запустить характеристические тесты**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run xml/import/importer.test.ts
```

Expected: PASS; эти тесты фиксируют уже существующее поведение, поэтому красный этап TDD здесь не требуется.

- [ ] **Step 4: Закоммитить защиту договора**

```bash
git add packages/core/xml/import/importer.test.ts
git commit -m "test: :white_check_mark: зафиксировать договор XML-парсера"
```

---

### Task 2: Отключить вычисление jPath в рабочем парсере

**Files:**
- Modify: `packages/core/xml/import/importer.ts:27-36`

**Interfaces:**
- Consumes: характеристические тесты Task 1.
- Produces: прежний `importContentFromXML` с тем же результатом и отключёнными строковыми путями callbacks внутри `fast-xml-parser`.

- [ ] **Step 1: Запустить тест рабочего парсера до изменения**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run xml/import/importer.test.ts
```

Expected: PASS.

- [ ] **Step 2: Добавить единственную настройку**

Изменить создание `XMLParser`:

```ts
const parser = new XMLParser({
  preserveOrder: true,
  jPath: false,
  attributeNamePrefix: "_",
  attributesGroupName: "@attributes",
  ignoreAttributes: false,
  parseTagValue: false,
  numberParseOptions: { leadingZeros: false, hex: true, eNotation: true },
  trimValues: false,
})
```

Не менять `compress` в этой задаче.

- [ ] **Step 3: Проверить отсутствие изменения договора**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run xml/import/importer.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: обе команды PASS.

- [ ] **Step 4: Закоммитить независимую оптимизацию**

```bash
git add packages/core/xml/import/importer.ts
git commit -m "perf: :zap: отключить вычисление jPath при парсинге XML"
```

---

### Task 3: Добавить базовый событийный прототип

**Files:**
- Modify: `packages/core/package.json`
- Modify: `pnpm-lock.yaml`
- Create: `packages/core/xml/import/experimental/saxesImporter.ts`
- Create: `packages/core/xml/import/experimental/saxesImporter.test.ts`

**Interfaces:**
- Consumes: `ImportContentFromXMLOptions` из `../importer.ts`, события `SaxesParser`.
- Produces: `importContentFromXMLWithSaxes<T>(data: string, options?: ImportContentFromXMLOptions): T`; функция остаётся внутренней и не экспортируется из `packages/core/index.ts`.

- [ ] **Step 1: Добавить прямую зависимость saxes**

Run:

```bash
pnpm --filter @nkdk/core add saxes@^6.0.0
```

Expected: `packages/core/package.json` содержит `"saxes": "^6.0.0"`, lockfile обновлён, `packages/core/index.ts` не изменён.

- [ ] **Step 2: Написать падающие проверки базовых значений**

Создать `saxesImporter.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { importContentFromXML } from "../importer"
import { importContentFromXMLWithSaxes } from "./saxesImporter"

const parsers = [
  ["fast-xml-parser", importContentFromXML],
  ["saxes", importContentFromXMLWithSaxes],
] as const

describe.each(parsers)("XML contract: %s", (_name, parse) => {
  it.each([
    ["numeric text", "<Root>2.0</Root>", { Root: "2.0" }],
    ["entity and CDATA", "<Root>A&amp;<![CDATA[B]]>C</Root>", { Root: "A&BC" }],
    ["comment ignored", "<Root>A<!--ignored-->B</Root>", { Root: "AB" }],
    ["empty child dropped", "<Root><Empty/></Root>", { Root: { Empty: undefined } }],
    ["attribute", '<Root id="1">x</Root>', { Root: { _id: "1", "#text": "x" } }],
    ["namespace prefixes", '<xr:Root xr:id="1"/>', { "xr:Root": { "_xr:id": "1" } }],
  ])("%s", (_case, xml, expected) => {
    expect(parse(xml)).toEqual(expected)
  })

  it("сохраняет XML declaration", () => {
    expect(parse(`<?xml version="1.0" encoding="UTF-8"?><Root/>`, { preserveEmptyElements: true })).toEqual({
      "?xml": { _version: "1.0", _encoding: "UTF-8" },
      Root: {},
    })
  })
})
```

- [ ] **Step 3: Запустить новый тест и подтвердить красный этап**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run xml/import/experimental/saxesImporter.test.ts
```

Expected: FAIL с `Cannot find module './saxesImporter'`.

- [ ] **Step 4: Реализовать стек и базовое завершение элемента**

Создать `saxesImporter.ts` с интерфейсами:

```ts
import { SaxesParser, type SaxesTagPlain, type XMLDecl } from "saxes"
import type { ImportContentFromXMLOptions } from "../importer"

const XML_METADATA = Symbol.for("metadata")

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

export function importContentFromXMLWithSaxes<T>(
  data: string,
  options: ImportContentFromXMLOptions = {}
): T {
  const document = createFrame("")
  const stack = [document]
  const parser = new SaxesParser({ xmlns: false })

  parser.on("xmldecl", (declaration) => appendDeclaration(document, declaration, options))
  parser.on("opentag", (tag: SaxesTagPlain) => stack.push(createFrame(tag.name, tag.attributes)))
  parser.on("text", (text) => {
    if (stack.length === 1) return
    const current = stack.at(-1)
    if (current !== undefined) current.text += text
  })
  parser.on("cdata", (text) => {
    if (stack.length === 1) return
    const current = stack.at(-1)
    if (current !== undefined) current.text += text
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
```

В этой задаче `appendChild` должен поддерживать одно значение и превращение во второй одноимённый элемент в массив. `finalizeFrame` должен:

1. добавить `#text`, только если накопленная строка непустая;
2. добавить атрибуты с префиксом `_`;
3. свернуть единственный `#text` без атрибутов в строку;
4. вернуть `undefined` для пустого элемента без атрибутов, если `preserveEmptyElements !== true`;
5. сохранить пустой объект для синтетического document frame.

`appendDeclaration` создаёт объект только из присутствующих `version`, `encoding`, `standalone`, добавляя ключи `_version`, `_encoding`, `_standalone`, и передаёт его в `appendChild(document, "?xml", value)`.

Текстовые события при `stack.length === 1` принадлежат промежуткам до или после
корневого элемента и игнорируются, как в текущем парсере.

- [ ] **Step 5: Получить зелёные базовые тесты**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run xml/import/experimental/saxesImporter.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: обе команды PASS.

- [ ] **Step 6: Закоммитить базовый прототип**

```bash
git add packages/core/package.json pnpm-lock.yaml packages/core/xml/import/experimental
git commit -m "perf: :zap: добавить событийный прототип XML-парсера"
```

---

### Task 4: Воспроизвести порядок, ChildItems и параметры импорта

**Files:**
- Modify: `packages/core/xml/import/experimental/saxesImporter.ts`
- Modify: `packages/core/xml/import/experimental/saxesImporter.test.ts`

**Interfaces:**
- Consumes: `importContentFromXMLWithSaxes` и `ElementFrame` из Task 3.
- Produces: полный согласованный договор прототипа для `childOrder`, `ChildItems`, `xsi:nil`, пустых элементов и XML PI.

- [ ] **Step 1: Добавить сравнение неперечисляемого childOrder**

В тесте определить:

```ts
const XML_METADATA = Symbol.for("metadata")

const childOrderOf = (value: unknown): unknown =>
  typeof value === "object" && value !== null
    ? (value as Record<PropertyKey, { childOrder?: unknown }>)[XML_METADATA]?.childOrder
    : undefined
```

Добавить проверки для `<Root><A>1</A><B>2</B><A>3</A></Root>`:

```ts
const parsed = importContentFromXMLWithSaxes<{ Root: { A: string[]; B: string } }>(xml)
expect(parsed).toEqual(importContentFromXML(xml))
expect(childOrderOf(parsed)).toEqual(childOrderOf(importContentFromXML(xml)))
expect(childOrderOf(parsed.Root)).toEqual(childOrderOf(importContentFromXML<{ Root: unknown }>(xml).Root))
```

- [ ] **Step 2: Добавить падающие проверки специальных случаев**

Добавить отдельные `it` для:

```ts
expect(importContentFromXMLWithSaxes("<Root><ChildItems><A/><B/><A/></ChildItems></Root>", {
  preserveEmptyElements: true,
})).toEqual({ Root: { ChildItems: [{ A: {} }, { B: {} }, { A: {} }] } })

expect(importContentFromXMLWithSaxes('<Root xsi:nil="true"/>')).toEqual({ Root: undefined })
expect(importContentFromXMLWithSaxes('<Root xsi:nil="true"/>', { preserveXsiNil: true })).toEqual({
  Root: { "_xsi:nil": "true" },
})
expect(importContentFromXMLWithSaxes("<Root><Empty/></Root>", { preserveEmptyElements: true })).toEqual({
  Root: { Empty: {} },
})
expect(importContentFromXMLWithSaxes('<Root><?foo bar="baz"?></Root>', { preserveEmptyElements: true })).toEqual({
  Root: { "?foo": { _bar: "baz" } },
})
expect(() => importContentFromXMLWithSaxes("<Root><__proto__>x</__proto__></Root>")).toThrow()
```

- [ ] **Step 3: Запустить тест и подтвердить содержательные падения**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run xml/import/experimental/saxesImporter.test.ts
```

Expected: FAIL на `childOrder`, `ChildItems` или `xsi:nil`, а не на загрузке модуля.

- [ ] **Step 4: Реализовать ordered и metadata семантику**

`appendChild` должен использовать этот алгоритм:

```ts
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
```

`finalizeFrame` должен начать с `orderedChildren ?? children`, добавить текст и разрешённые атрибуты, затем определить пустое или скалярное значение. Перед возвратом обычного объекта с детьми добавить metadata:

```ts
if (frame.orderedChildren === undefined && frame.childOrder.length > 0) {
  Object.defineProperty(container, XML_METADATA, {
    value: { childOrder: frame.childOrder },
    enumerable: false,
  })
}
```

Чтобы добавлять `#text` и атрибуты как к объекту, так и к массиву `ChildItems`,
держать единственное приведение типов в именованном переходнике:

```ts
type XmlContainer = Record<string, unknown> | Array<Record<string, unknown>>

const containerProperties = (container: XmlContainer): Record<PropertyKey, unknown> =>
  container as unknown as Record<PropertyKey, unknown>
```

При копировании атрибутов преобразовывать `xsi:nil` в `_xsi:nil` и пропускать его, если `options.preserveXsiNil !== true`. Остальные атрибуты записывать как `_${name}`.

- [ ] **Step 5: Реализовать XML PI и защиту имён**

Подписать parser на `processinginstruction`. Для body извлекать только пары `name="value"` или `name='value'` регулярным выражением; голый текст текущий парсер превращает в пустой объект:

```ts
const PI_ATTRIBUTE = /([^\s=]+)\s*=\s*(["'])([\s\S]*?)\2/gu

parser.on("processinginstruction", ({ target, body }) => {
  const attributes: Record<string, string> = {}
  for (const match of body.matchAll(PI_ATTRIBUTE)) attributes[`_${match[1]}`] = match[3] ?? ""
  const parent = stack.at(-1)
  if (parent === undefined) throw new Error("XML PI вне документа")
  appendChild(parent, `?${target}`, attributes)
})
```

Перед добавлением обычного тега отклонять имена из точного локального набора
`__proto__`, `constructor`, `prototype`, `hasOwnProperty`, `toString`, `valueOf`,
`__defineGetter__`, `__defineSetter__`, `__lookupGetter__`, `__lookupSetter__`.
Это сохраняет защиту свойств объекта без импорта внутренних модулей
`fast-xml-parser`.

- [ ] **Step 6: Запустить оба узких набора**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run xml/import/importer.test.ts xml/import/experimental/saxesImporter.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: обе команды PASS.

- [ ] **Step 7: Закоммитить полный договор прототипа**

```bash
git add packages/core/xml/import/experimental/saxesImporter.ts packages/core/xml/import/experimental/saxesImporter.test.ts
git commit -m "perf: :zap: воспроизвести договор XML в saxes-прототипе"
```

---

### Task 5: Добавить воспроизводимое сравнение XML-корпуса

**Files:**
- Create: `packages/core/scripts/xml-parser-corpus.mjs`
- Create: `packages/core/scripts/xml-parser-corpus.test.ts`

**Interfaces:**
- Produces: `parseXmlParserArguments(argv)`, `collectXmlCorpus(coreDir, options)`, `comparableXml(value)`, `firstDifferencePath(left, right, path = "$" )`.
- Consumes later: `measure-xml-parsers.mjs` из Task 6.

- [ ] **Step 1: Написать падающие тесты параметров и детерминированной выборки**

Проверить следующие договоры:

```ts
expect(parseXmlParserArguments(["--", "--xml-dir", "/xml", "--large", "/large.xml"])).toEqual({
  xmlDir: "/xml",
  largePaths: ["/large.xml"],
  sampleSize: 5000,
  runs: 3,
})
expect(() => parseXmlParserArguments(["--sample-size", "0"])).toThrow("положительным")
```

Для временного дерева из шести маленьких файлов передать `sampleSize: 3` и ожидать первый, средний и последний путь после UTF-8 сортировки. Fixtures и внешние пути должны дедуплицироваться.

- [ ] **Step 2: Написать падающие тесты сравнимого metadata**

Создать два внешне равных объекта, но определить разные `childOrder` через `Object.defineProperty`. Проверить:

```ts
expect(comparableXml(left)).not.toEqual(comparableXml(right))
expect(firstDifferencePath(comparableXml(left), comparableXml(right))).toBe("$.Root.@@childOrder[0].key")
```

Также проверить путь расхождения массива `$.Root.A[1]`.

- [ ] **Step 3: Запустить тест и подтвердить красный этап**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run scripts/xml-parser-corpus.test.ts
```

Expected: FAIL с отсутствующим `xml-parser-corpus.mjs`.

- [ ] **Step 4: Реализовать параметры и выбор корпуса**

`parseXmlParserArguments` принимает необязательный абсолютный `--xml-dir`,
повторяемый абсолютный `--large` и необязательный положительный
`--sample-size`. Значения по умолчанию: `sampleSize: 5000`, `runs: 3`. CLI не
предоставляет изменение числа прогонов: три прогона являются частью договора.

`collectXmlCorpus` должен:

1. собрать `**/__fixtures__/**/*.xml` и `**/fixtures/**/*.xml` внутри `packages/core`;
2. отсортировать и дедуплицировать абсолютные пути;
3. для `xmlDir` выбрать файлы размером `1..65536` байт;
4. если их больше `sampleSize`, взять индекс `Math.floor(i * count / sampleSize)` для каждого `i` от `0` до `sampleSize - 1`;
5. добавить `largePaths`, проверить существование и обычный тип каждого файла;
6. вернуть `{ fixturePaths, smallPaths, largePaths, allPaths }`.

- [ ] **Step 5: Реализовать сравнимое представление**

`comparableXml` рекурсивно копирует массивы и перечисляемые свойства объектов. Если у объекта есть `Symbol.for("metadata").childOrder`, добавить в копию перечисляемый ключ `@@childOrder` с рекурсивно скопированным массивом.

`firstDifferencePath` сравнивает тип, массив/объект, отсортированные ключи и примитивы в этом порядке и возвращает первый JSON-подобный путь либо `undefined`.

- [ ] **Step 6: Получить зелёный тест helper-ов**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run scripts/xml-parser-corpus.test.ts
```

Expected: PASS.

- [ ] **Step 7: Закоммитить корпус и comparator**

```bash
git add packages/core/scripts/xml-parser-corpus.mjs packages/core/scripts/xml-parser-corpus.test.ts
git commit -m "test: :white_check_mark: добавить корпус сравнения XML-парсеров"
```

---

### Task 6: Добавить изолированный runner времени и peak RSS

**Files:**
- Create: `packages/core/scripts/xml-parser-profile-worker.mjs`
- Create: `packages/core/scripts/measure-xml-parsers.mjs`
- Create: `packages/core/scripts/measure-xml-parsers.test.ts`
- Modify: `packages/core/package.json`

**Interfaces:**
- Consumes: corpus helpers Task 5, оба парсера, `tsx/esm/api`.
- Produces: команда `pnpm --filter @nkdk/core measure:xml-parsers -- [--xml-dir ABS] [--large ABS]` и JSON с эквивалентностью, тремя прогонами, медианой времени и медианой peak RSS.

- [ ] **Step 1: Написать падающий тест оркестрации**

Экспортировать из будущего runner `aggregateParserRuns(records)` и `runParserMeasurements(params, spawn)`. В тесте передать поддельный `spawn`, возвращающий по три JSON-ответа для `current` и `saxes`, и проверить:

```ts
expect(aggregateParserRuns([
  { elapsedMs: 30, peakRssMiB: 90 },
  { elapsedMs: 10, peakRssMiB: 70 },
  { elapsedMs: 20, peakRssMiB: 80 },
])).toEqual({
  runs: [
    { elapsedMs: 30, peakRssMiB: 90 },
    { elapsedMs: 10, peakRssMiB: 70 },
    { elapsedMs: 20, peakRssMiB: 80 },
  ],
  medianElapsedMs: 20,
  medianPeakRssMiB: 80,
})
```

Проверить, что вызовы чередуются `current, saxes, saxes, current, current, saxes`, каждый использует новый процесс с `--expose-gc`, а ненулевой status превращается в ошибку.

- [ ] **Step 2: Запустить тест и подтвердить красный этап**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run scripts/measure-xml-parsers.test.ts
```

Expected: FAIL с отсутствующим модулем runner.

- [ ] **Step 3: Реализовать worker одного прогона**

Worker принимает `--parser current|saxes` и `--manifest ABS`. Он:

1. читает JSON-массив абсолютных XML-путей;
2. загружает выбранный TypeScript-модуль через `tsImport`;
3. читает все XML в память до начала таймера;
4. вызывает `global.gc?.()`;
5. последовательно парсит каждый текст, удерживая только последний результат;
6. возвращает одну JSON-строку:

```js
{
  parser: parserName,
  files: documents.length,
  bytes: documents.reduce((sum, document) => sum + Buffer.byteLength(document), 0),
  elapsedMs: performance.now() - started,
  peakRssMiB: process.resourceUsage().maxRSS / 1024,
}
```

Если `parser` неизвестен, manifest не является массивом абсолютных строк или парсинг падает, worker пишет сообщение в stderr и завершает процесс с кодом `1`.

- [ ] **Step 4: Реализовать главный runner**

Главный runner:

1. получает корпус через `collectXmlCorpus`;
2. загружает оба TypeScript-парсера через `tsImport`;
3. для каждого файла последовательно строит оба результата, применяет `comparableXml` и проверяет глубокое равенство;
4. при расхождении бросает ошибку `XML parser mismatch: <path> at <valuePath>`;
5. записывает `allPaths` во временный manifest;
6. запускает worker шесть раз в согласованном чередующемся порядке;
7. агрегирует медианы;
8. удаляет только созданный им временный каталог в `finally`;
9. печатает JSON с полями `corpus`, `equivalent: true`, `current`, `saxes`, `elapsedDeltaPercent`, `peakRssDeltaPercent`.

Формулы дельт:

```js
const elapsedDeltaPercent = ((saxes.medianElapsedMs - current.medianElapsedMs) / current.medianElapsedMs) * 100
const peakRssDeltaPercent = ((saxes.medianPeakRssMiB - current.medianPeakRssMiB) / current.medianPeakRssMiB) * 100
```

- [ ] **Step 5: Добавить package script**

В `packages/core/package.json`:

```json
"measure:xml-parsers": "node scripts/measure-xml-parsers.mjs"
```

- [ ] **Step 6: Получить зелёные тесты runner**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run scripts/xml-parser-corpus.test.ts scripts/measure-xml-parsers.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: обе команды PASS.

- [ ] **Step 7: Проверить эквивалентность всех репозиторных фикстур**

Run:

```bash
pnpm --filter @nkdk/core measure:xml-parsers
```

Expected: exit code `0`, `equivalent: true`, `corpus.fixtureFiles > 0`, у каждого парсера ровно три прогона.

Если команда сообщает расхождение, применить `superpowers:systematic-debugging`, добавить минимальный строковый reproducer в `saxesImporter.test.ts`, получить красный тест, исправить только `saxesImporter.ts` и повторить эту команду. Существующую XML-фикстуру не менять.

- [ ] **Step 8: Закоммитить runner**

```bash
git add packages/core/scripts/xml-parser-profile-worker.mjs packages/core/scripts/measure-xml-parsers.mjs packages/core/scripts/measure-xml-parsers.test.ts packages/core/package.json
git commit -m "test: :white_check_mark: добавить замер XML-парсеров"
```

---

### Task 7: Проверить мутации, полный проект и compact ERP

**Files:**
- Modify only if justified by mutation report: `packages/core/xml/import/importer.test.ts`
- Modify only if justified by mutation report: `packages/core/xml/import/experimental/saxesImporter.test.ts`
- Do not commit: benchmark JSON or files из `/Users/nikita/git/round-trip-compact/cf/erp`.

**Interfaces:**
- Consumes: завершённые Tasks 1–6.
- Produces: проверенный набор тестов и итоговые числа времени/RSS для решения о следующем дизайне; production-переключения не производит.

- [ ] **Step 1: Снять mutation baseline изменённых production-файлов**

Run:

```bash
pnpm test:mutation -- --report xml-parser-before \
  --tests packages/core/xml/import/importer.test.ts,packages/core/xml/import/experimental/saxesImporter.test.ts \
  packages/core/xml/import/importer.ts packages/core/xml/import/experimental/saxesImporter.ts
```

Expected: отчёт без `Timeout`, `RuntimeError` и `CompileError`.

- [ ] **Step 2: Проверить уникальность тестов по mutation report**

Прочитать `killedBy` и `coveredBy`. Объединять или удалять только утверждения без собственного обнаруживаемого мутанта; сохранить отдельные проверки XML declaration, смешанного порядка, `ChildItems`, `xsi:nil`, CDATA и ошибки опасного имени как разные классы договора.

- [ ] **Step 3: Снять итоговый mutation report и сравнить**

Run:

```bash
pnpm test:mutation -- --report xml-parser-after \
  --tests packages/core/xml/import/importer.test.ts,packages/core/xml/import/experimental/saxesImporter.test.ts \
  packages/core/xml/import/importer.ts packages/core/xml/import/experimental/saxesImporter.ts
pnpm test:mutation:compare -- xml-parser-before xml-parser-after
```

Expected: отсутствует потеря обнаруживаемых мутантов. Если тесты не менялись после baseline, оба отчёта должны совпасть.

- [ ] **Step 4: Закоммитить только обоснованное уплотнение тестов**

Если Step 2 изменил тесты:

```bash
git add packages/core/xml/import/importer.test.ts packages/core/xml/import/experimental/saxesImporter.test.ts
git commit -m "test: :white_check_mark: уплотнить договор XML-парсеров"
```

Если изменений нет, этот commit не создавать.

- [ ] **Step 5: Выполнить полную проверку проекта**

Run:

```bash
pnpm type-check
pnpm test
```

Expected: обе команды PASS, все пакеты зелёные.

- [ ] **Step 6: Выполнить итоговый ручной замер compact ERP**

Run:

```bash
pnpm --filter @nkdk/core measure:xml-parsers -- \
  --xml-dir /Users/nikita/git/round-trip-compact/cf/erp \
  --large /Users/nikita/git/round-trip-compact/cf/erp/Roles/БазовыеПраваБПУХ/Ext/Rights.xml
```

Expected: `equivalent: true`; JSON содержит 711 или больше fixture XML, 5000 маленьких XML, крупный XML, три прогона каждого парсера и обе медианы.

- [ ] **Step 7: Интерпретировать результат без production-переключения**

В итоговом сообщении показать:

- количество и суммарный размер файлов каждого набора;
- три значения времени и peak RSS каждого парсера;
- медианы и процентные дельты;
- прошла ли полная эквивалентность;
- выполнен ли критерий «устойчиво быстрее и ниже peak RSS».

Не добавлять benchmark JSON в git и не менять вызовы `importContentFromXML` на прототип. Если критерий выполнен, предложить отдельный brainstorming для production-замены.
