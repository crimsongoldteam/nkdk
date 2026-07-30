import { beforeAll, describe, expect, it } from "vitest"
import { importContentFromXML } from "../../../xml/import/importer"
import { testAppliedObjectFromXMLToYAML, testAppliedObjectFromYAMLToXML } from "../../../tests/directConversion"
import { appliedObjectModelCases } from "./yamlFixtures"

describe("applied object direct XML → YAML → XML", () => {
  const prepared = new Map<string, { yaml: unknown; result: unknown; expected: unknown }>()

  beforeAll(() => {
    for (const { label, scenario, fixture } of appliedObjectModelCases) {
      const imported = testAppliedObjectFromXMLToYAML({
        rule: scenario.rule,
        importMetaUrl: scenario.importMetaUrl,
        fixture: fixture.fixture,
        name: fixture.name,
      })
      const exported = testAppliedObjectFromYAMLToXML({
        rule: scenario.rule,
        importMetaUrl: scenario.importMetaUrl,
        fixture: fixture.fixture,
        name: fixture.name,
        yaml: imported.yaml,
      })
      prepared.set(label, {
        yaml: imported.yaml,
        result: normalizeXML(exported.result),
        expected: normalizeXML(exported.expected),
      })
    }
  })

  it.each(appliedObjectModelCases)("$label direct XML → YAML → XML", ({ label }) => {
    const result = prepared.get(label)
    if (result === undefined) throw new Error(`Не подготовлен direct round-trip: ${label}`)

    expect(result.yaml).toBeDefined()
    expect(result.result).toEqual(result.expected)
  })
})

function normalizeXML(value: string): unknown {
  return removeFormattingText(importContentFromXML(value.replace(/^\uFEFF/, "")))
}

function removeFormattingText(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(removeFormattingText)
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
      key === "#text" && typeof child === "string" && child.trim() === "" ? [] : [[key, removeFormattingText(child)]]
    )
  )
}
