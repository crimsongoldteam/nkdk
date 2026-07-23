import { describe, expect, it } from "vitest"
import { importContentFromXML } from "../../../xml/import/importer"
import { testAppliedObjectFromXMLToYAML, testAppliedObjectFromYAMLToXML } from "../../../tests/directConversion"
import { appliedObjectModelCases } from "./yamlFixtures"

describe("applied object direct XML → YAML → XML", () => {
  it.each(appliedObjectModelCases)("$label direct XML → YAML → XML", ({ scenario, fixture }) => {
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

    expect(imported.yaml).toBeDefined()
    expect(normalizeXML(exported.result)).toEqual(normalizeXML(exported.expected))
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
