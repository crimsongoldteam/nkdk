import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes } from "../../../xml/import/saxesParser"
import { createXmlImportAuditSession } from "./importAudit"
import { xmlImportCompatibilityContainer, xmlImportCompatibilityValues } from "./compatibilityView"

describe("xmlImportCompatibilityContainer", () => {
  it("считает проверку присутствия скалярного элемента структурным потреблением", () => {
    const root = parseXmlDocumentWithSaxes("<Root><Known>value</Known></Root>").roots[0]!
    const audit = createXmlImportAuditSession([root])
    const boundary = { itemType: "Owner", yamlPath: [] }
    const value = xmlImportCompatibilityContainer({ node: root, audit, boundary }) as Record<string, unknown>

    expect(Object.prototype.hasOwnProperty.call(value, "Known")).toBe(true)
    expect(audit.outcomes().filter(({ node }) => node.path.includes("/Known[1]")).map(({ state }) => state))
      .toEqual(["claimed", "claimed"])
  })

  it("считает все повторные скалярные XML-узлы потреблёнными при передаче конвертеру", () => {
    const root = parseXmlDocumentWithSaxes(
      "<Root><Known>first</Known><Known>second</Known></Root>",
    ).roots[0]!
    const nodes = root.content.filter((node) => node.type === "element")
    const audit = createXmlImportAuditSession([root])
    const boundary = { itemType: "Owner", yamlPath: ["Значения"] }

    xmlImportCompatibilityValues({ nodes, audit, boundary })

    expect(audit.outcomes().filter(({ node }) => node.path.includes("/Known[")).map(({ state }) => state))
      .toEqual(["claimed", "claimed", "claimed", "claimed"])
  })
})
