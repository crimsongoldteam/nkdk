import { parseMetadataYaml } from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { describe, expect, it } from "vitest"
import { mockContextToXML } from "../../tests/mockContext"
import { buildPreparedAssignmentXml } from "../fullSyncToXml/xmlAnomalyAssignment"
import { prepareTestXmlAnomalyAssignment } from "./testSupport"

const rootRule = {
  itemType: "XmlAnomalySynchronizationProbe",
  properties: {
    value: { type: "string", yaml: "Значение", xml: "Value" },
  },
} as const satisfies MetadataItemRule

describe("единое восстановление XML-аномалий при синхронизации", () => {
  it("повторное построение документа даёт тот же XML и не изменяет подготовленные данные", () => {
    const parsed = parseMetadataYaml([
      "Значение: !xml/raw",
      "  $значение: ordinary",
      "  $xml: { \"#text\": \"01\" }",
    ].join("\n"))
    const prepared = prepareTestXmlAnomalyAssignment({
      parsed,
      rootRule,
      runtime: { requiresImportant: () => false },
    })
    const document = {
      targetXmlPath: "Objects/One.xml",
      xml: { Root: { Value: "ordinary" } },
      deferred: [],
      rootRule,
      rawBoundaries: prepared.rawBoundaries,
    }

    const first = buildPreparedAssignmentXml({ document, context: mockContextToXML() })
    const second = buildPreparedAssignmentXml({ document, context: mockContextToXML() })

    expect(first).toBe(second)
    expect(first).toContain("<Value>01</Value>")
    expect(document.xml).toEqual({ Root: { Value: "ordinary" } })
    expect(prepared.preparedYamlFile.data).toEqual({ Значение: "ordinary" })
  })
})
