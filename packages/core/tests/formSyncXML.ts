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

  assertYAMLEventOrder(yaml, result, params.path)
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

function assertYAMLEventOrder(yaml: unknown, xml: unknown, path: string): void {
  const yamlGroups = collectYAMLEventGroups(yaml)
  const unmatched = collectXMLEventGroups(xml)

  for (const yamlGroup of yamlGroups) {
    const matchIndex = unmatched.findIndex(
      (xmlGroup) =>
        xmlGroup.length >= yamlGroup.length && yamlGroup.every((handler, index) => xmlGroup[index] === handler)
    )
    assert.notEqual(
      matchIndex,
      -1,
      `${path}: порядок обработчиков XML не начинается с порядка раздела События из YAML: ${yamlGroup.join(", ")}`
    )
    unmatched.splice(matchIndex, 1)
  }
}

function collectYAMLEventGroups(value: unknown): string[][] {
  const result: string[][] = []
  visitRecords(value, (record) => {
    const events = asRecord(record.События)
    if (events === undefined) return
    const handlers = Object.values(events).flatMap((event) => {
      if (typeof event === "string") return [event]
      const callHandlers = asRecord(event)
      return callHandlers === undefined
        ? []
        : Object.values(callHandlers).filter((handler): handler is string => typeof handler === "string")
    })
    if (handlers.length > 0) result.push(handlers)
  })
  return result
}

function collectXMLEventGroups(value: unknown): string[][] {
  const result: string[][] = []
  visitRecords(value, (record) => {
    const events = asRecord(record.Events)
    if (events === undefined) return
    const source = events.Event
    const items = Array.isArray(source) ? source : source === undefined ? [] : [source]
    const handlers = items.flatMap((item) => {
      const handler = asRecord(item)?.["#text"]
      return typeof handler === "string" ? [handler] : []
    })
    if (handlers.length > 0) result.push(handlers)
  })
  return result
}

function visitRecords(value: unknown, visitor: (record: Record<string, unknown>) => void): void {
  if (Array.isArray(value)) {
    for (const child of value) visitRecords(child, visitor)
    return
  }
  const record = asRecord(value)
  if (record === undefined) return
  visitor(record)
  for (const child of Object.values(record)) visitRecords(child, visitor)
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
