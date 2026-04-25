import { describe, expect, it } from "vitest"
import { importMetadataItemFromXML } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/tests/mockContext"
import { readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { PredefinedRules } from "./rules"

// Активируем регистрацию правила
import "./types"

describe("import Predefined from XML", () => {
  it("imports full.xml", () => {
    const xmlString = readXMLFixtureAsString(import.meta.url, "full.xml")
    const result = importMetadataItemFromXML({
      context: mockContextFromXML(),
      rule: PredefinedRules,
      xmlString,
    })
    expect(result).toMatchObject({
      itemType: "Predefined",
      items: expect.any(Array),
    })
    expect(result?.items?.length ?? 0).toBeGreaterThan(0)
    // Корневой Item с дочерним
    const group = result!.items!.find((it: any) => it.name === "Группа")
    expect(group).toMatchObject({
      isFolder: true,
      childItems: expect.any(Array),
    })
    expect(group!.childItems[0]).toMatchObject({ name: "Предопределенный1", isFolder: false })
  })
})
