import fs from "node:fs"
import { strict as assert } from "node:assert"
import { join } from "node:path"
import { importFromYAML } from "../yaml/import"
import { canonicalXML } from "./canonicalXML"

export function canonicalFormSyncXML(params: { path: string; result: string; expected: string; inputDir: string }): {
  result: unknown
  expected: unknown
} {
  const yamlPath = formYamlPath(params.inputDir, params.path)
  const yaml = importFromYAML<unknown>(fs.readFileSync(yamlPath, "utf8"))
  const result = canonicalXML(params.result)
  const expected = canonicalXML(params.expected)

  assertYAMLEventOrder(yaml, result, expected, params.path)
  return {
    result: normalizeEventCollections(result),
    expected: normalizeEventCollections(expected),
  }
}

function formYamlPath(inputDir: string, xmlPath: string): string {
  const segments = xmlPath.split("/")
  const formsIndex = segments.lastIndexOf("Forms")
  if (
    formsIndex < 0 ||
    segments[formsIndex + 1] === undefined ||
    segments.slice(formsIndex + 2).join("/") !== "Ext/Form.xml"
  ) {
    throw new Error(`Не удалось сопоставить XML формы с YAML: ${xmlPath}`)
  }
  return join(inputDir, ...segments.slice(0, formsIndex), "Формы", segments[formsIndex + 1], "Форма.yaml")
}

interface YAMLEventBinding {
  readonly eventKey: string
  readonly callType?: string
  readonly handler: string
}

interface YAMLEventGroup {
  readonly ownerPath: readonly string[]
  readonly bindings: readonly YAMLEventBinding[]
}

interface XMLEventBinding {
  readonly name: string
  readonly callType?: string
  readonly handler: string
}

interface XMLEventGroup {
  readonly ownerPath: readonly string[]
  readonly bindings: readonly XMLEventBinding[]
}

function assertYAMLEventOrder(yaml: unknown, xml: unknown, expectedXml: unknown, path: string): void {
  const yamlGroups = collectYAMLEventGroups(yaml)
  const resultGroups = eventGroupsByOwner(collectXMLEventGroups(xml), path, "результате")
  const expectedGroups = eventGroupsByOwner(collectXMLEventGroups(expectedXml), path, "reference XML")

  for (const yamlGroup of yamlGroups) {
    const ownerKey = ownerPathKey(yamlGroup.ownerPath)
    const owner = yamlGroup.ownerPath.join("/") || "форма"
    const resultGroup = resultGroups.get(ownerKey)
    const expectedGroup = expectedGroups.get(ownerKey)
    assert.notEqual(expectedGroup, undefined, `${path}: владелец ${owner}: группа Event отсутствует в reference XML`)
    assert.notEqual(resultGroup, undefined, `${path}: владелец ${owner}: группа Event отсутствует в результате`)

    const unmatchedExpected = [...expectedGroup!.bindings]
    const desiredOrder = yamlGroup.bindings.map((binding) => {
      const candidates = unmatchedExpected
        .map((event, index) => ({ event, index }))
        .filter(({ event }) => event.handler === binding.handler && event.callType === binding.callType)
      const canonicalName = capitalize(binding.eventKey)
      const matched = candidates.find(({ event }) => event.name === canonicalName) ?? candidates[0]
      assert.notEqual(
        matched,
        undefined,
        `${path}: владелец ${owner}: не найдено reference-событие ${binding.eventKey}/${binding.callType ?? "Auto"}`
      )
      unmatchedExpected.splice(matched!.index, 1)
      return eventSignature(matched!.event)
    })
    const actualOrder = resultGroup!.bindings.slice(0, desiredOrder.length).map(eventSignature)
    assert.deepEqual(
      actualOrder,
      desiredOrder,
      `${path}: владелец ${owner}: порядок обработчиков XML не соответствует разделу События из YAML`
    )
  }
}

function collectYAMLEventGroups(value: unknown): YAMLEventGroup[] {
  const result: YAMLEventGroup[] = []
  visitYAMLRecords(value, [], result)
  return result
}

function visitYAMLRecords(
  value: unknown,
  ownerPath: readonly string[],
  result: YAMLEventGroup[]
): void {
  if (Array.isArray(value)) {
    for (const child of value) visitYAMLRecords(child, ownerPath, result)
    return
  }
  const record = asRecord(value)
  if (record === undefined) return

  const events = asRecord(record.События)
  if (events !== undefined) {
    const bindings = Object.entries(events).flatMap(([eventKey, event]): YAMLEventBinding[] => {
      if (typeof event === "string") return [{ eventKey, handler: event }]
      const callHandlers = asRecord(event)
      if (callHandlers === undefined) return []
      return Object.entries(callHandlers).flatMap(([callType, handler]) => {
        const xmlCallType = yamlCallTypeToXML(callType)
        return typeof handler === "string" && xmlCallType !== undefined
          ? [{ eventKey, callType: xmlCallType, handler }]
          : []
      })
    })
    if (bindings.length > 0) result.push({ ownerPath, bindings })
  }

  for (const [key, child] of Object.entries(record)) {
    if (key === "События") continue
    if (key === "Элементы") {
      const elements = asRecord(child)
      if (elements !== undefined) {
        for (const [name, element] of Object.entries(elements)) {
          visitYAMLRecords(element, [...ownerPath, name], result)
        }
      }
      continue
    }
    visitYAMLRecords(child, ownerPath, result)
  }
}

function collectXMLEventGroups(value: unknown): XMLEventGroup[] {
  const result: XMLEventGroup[] = []
  visitXMLRecords(value, [], result)
  return result
}

function visitXMLRecords(value: unknown, parentPath: readonly string[], result: XMLEventGroup[]): void {
  if (Array.isArray(value)) {
    for (const child of value) visitXMLRecords(child, parentPath, result)
    return
  }
  const record = asRecord(value)
  if (record === undefined) return
  const ownerPath = typeof record._name === "string" ? [...parentPath, record._name] : parentPath
  const events = asRecord(record.Events)
  if (events !== undefined) {
    const source = events.Event
    const items = Array.isArray(source) ? source : source === undefined ? [] : [source]
    const bindings = items.flatMap((item): XMLEventBinding[] => {
      const event = asRecord(item)
      const name = event?._name
      const callType = event?._callType
      const handler = event?.["#text"]
      if (
        typeof name !== "string" ||
        typeof handler !== "string" ||
        (callType !== undefined && typeof callType !== "string")
      ) {
        return []
      }
      return [{ name, ...(callType === undefined ? {} : { callType }), handler }]
    })
    if (bindings.length > 0) result.push({ ownerPath, bindings })
  }
  for (const [key, child] of Object.entries(record)) {
    if (key !== "Events") visitXMLRecords(child, ownerPath, result)
  }
}

function eventGroupsByOwner(
  groups: readonly XMLEventGroup[],
  path: string,
  source: string
): ReadonlyMap<string, XMLEventGroup> {
  const result = new Map<string, XMLEventGroup>()
  for (const group of groups) {
    const key = ownerPathKey(group.ownerPath)
    assert.equal(
      result.has(key),
      false,
      `${path}: повторный structural owner path в ${source}: ${group.ownerPath.join("/") || "форма"}`
    )
    result.set(key, group)
  }
  return result
}

function ownerPathKey(ownerPath: readonly string[]): string {
  return JSON.stringify(ownerPath)
}

function eventSignature(event: Pick<XMLEventBinding, "name" | "callType">): string {
  return JSON.stringify([event.name, event.callType ?? null])
}

function yamlCallTypeToXML(value: string): string | undefined {
  if (value === "Перед") return "Before"
  if (value === "После") return "After"
  if (value === "Вместо") return "Override"
  if (value === "Before" || value === "After" || value === "Override") return value
  return undefined
}

function capitalize(value: string): string {
  return value.length === 0 ? value : `${value[0]!.toUpperCase()}${value.slice(1)}`
}

function normalizeEventCollections(value: unknown, key?: string): unknown {
  if (Array.isArray(value)) {
    const normalized = value.map((child) => normalizeEventCollections(child))
    if (key === "Event") normalized.sort((left, right) => eventKey(left).localeCompare(eventKey(right)))
    return normalized
  }
  const record = asRecord(value)
  if (record === undefined) return value
  return Object.fromEntries(
    Object.entries(record).map(([childKey, child]) => [childKey, normalizeEventCollections(child, childKey)])
  )
}

function eventKey(value: unknown): string {
  const item = asRecord(value)
  return item === undefined ? JSON.stringify(value) : [item._name, item._callType, item["#text"]].join("\u0000")
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
