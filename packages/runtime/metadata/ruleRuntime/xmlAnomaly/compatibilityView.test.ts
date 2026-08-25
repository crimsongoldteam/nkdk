import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes } from "../../../xml/import/saxesParser"
import { createXmlImportAuditSession } from "./importAudit"
import {
  claimCanonicalXmlImportAttribute,
  xmlImportCompatibilityContainer,
  xmlImportCompatibilityValues,
} from "./compatibilityView"

function createCompatibilityFixture(xml: string, yamlPath: (string | number)[] = []) {
  const root = parseXmlDocumentWithSaxes(xml).roots[0]!
  const audit = createXmlImportAuditSession([root])
  const boundary = { itemType: "Owner", yamlPath }
  const value = xmlImportCompatibilityContainer({ node: root, audit, boundary }) as Record<string, unknown>
  return { audit, value }
}

describe("xmlImportCompatibilityContainer", () => {
  it("считает проверку присутствия скалярного элемента структурным потреблением", () => {
    const { audit, value } = createCompatibilityFixture("<Root><Known>value</Known></Root>")

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

  it("заявляет только ожидаемое каноническое значение атрибута", () => {
    const { audit, value } = createCompatibilityFixture(
      '<Root><Canonical xsi:type="v8:Known"/><Future xsi:type="v8:Future"/></Root>',
    )

    claimCanonicalXmlImportAttribute({
      value: value.Canonical,
      name: "xsi:type",
      expectedValue: "v8:Known",
    })
    claimCanonicalXmlImportAttribute({
      value: value.Future,
      name: "xsi:type",
      expectedValue: "v8:Known",
    })

    const attributeStates = audit.outcomes()
      .filter(({ node }) => !("type" in node) && node.name === "xsi:type")
      .map(({ state }) => state)
    expect(attributeStates).toEqual(["claimed", "unclaimed"])
  })
})
