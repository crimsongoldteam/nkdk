import { describe, expect, it } from "vitest"

import { parseXmlDocumentWithSaxes } from "../../../xml/import/saxesParser"
import {
  createXmlImportAuditSession,
  type XmlImportAuditBoundary,
} from "./importAudit"

const boundary: XmlImportAuditBoundary = {
  itemType: "SyntheticItem",
  propertyKey: "value",
  propertyType: "string",
  yamlPath: ["Значение"],
  rulePath: [{ propertyKey: "value" }],
}

describe("XmlImportAuditSession", () => {
  it("не смешивает одинаковые локальные id и пути разных XML-документов", () => {
    const first = parseXmlDocumentWithSaxes("<Root/>").roots[0]!
    const second = parseXmlDocumentWithSaxes("<Root/>").roots[0]!

    const session = createXmlImportAuditSession([first, second])
    session.claim(first, boundary)
    session.finalize()

    expect(session.outcomes().map(({ node, state }) => [node, state])).toEqual([
      [first, "claimed"],
      [second, "unknown"],
    ])
  })

  it("хранит отдельный адресный результат для каждого XML-узла и атрибута", () => {
    const root = parseXmlDocumentWithSaxes(
      '<Root future="x"><Value>one</Value><Value>two</Value><Unknown extra="y"/></Root>',
    ).roots[0]!
    const [first, second, unknown] = root.content.filter((node) => node.type === "element")
    const session = createXmlImportAuditSession([root])

    expect(session.outcomes().every(({ state }) => state === "unclaimed")).toBe(true)

    session.claim(root, boundary)
    session.claim(first!, boundary)
    session.duplicate(second!, boundary)
    session.finalize()

    expect(
      session.outcomes()
        .filter(({ node }) =>
          node.path === root.path ||
          node.path === first?.path ||
          node.path === second?.path ||
          node.path === unknown?.path ||
          node.path.endsWith("/@future[1]") ||
          node.path.endsWith("/@extra[1]"),
        )
        .map(({ node, state }) => [node.path, state]),
    ).toEqual([
      ["/Root[1]", "claimed"],
      ["/Root[1]/@future[1]", "unknown"],
      ["/Root[1]/Value[1]", "claimed"],
      ["/Root[1]/Value[2]", "duplicate"],
      ["/Root[1]/Unknown[1]", "unknown"],
      ["/Root[1]/Unknown[1]/@extra[1]", "unknown"],
    ])
  })

  it("сохраняет точную минимальную границу raw-кандидата", () => {
    const node = parseXmlDocumentWithSaxes("<Value>broken</Value>").roots[0]!
    const session = createXmlImportAuditSession([node])
    const error = new Error("broken")

    session.rawCandidate(node, boundary, error)

    expect(session.rawCandidates()).toEqual([{ node, boundary, error }])
  })

  it("системно меняет YAML-префикс у outcomes и raw-кандидатов", () => {
    const root = parseXmlDocumentWithSaxes("<Root><Value>broken</Value></Root>").roots[0]!
    const value = root.content.find((node) => node.type === "element")!
    const session = createXmlImportAuditSession([root])
    const provisionalBoundary: XmlImportAuditBoundary = {
      ...boundary,
      yamlPath: ["Элементы", 0, "Значение"],
    }
    const siblingBoundary: XmlImportAuditBoundary = {
      ...boundary,
      yamlPath: ["Элементы", 1, "Значение"],
    }
    const error = new Error("broken")
    session.claim(root, provisionalBoundary)
    session.claim(value, siblingBoundary)
    session.rawCandidate(value, provisionalBoundary, error)

    session.rekeyYamlPath(["Элементы", 0], ["Элементы", "Финальный"])

    expect(session.outcomes().find(({ node }) => node === root)?.boundaries).toEqual([
      { ...provisionalBoundary, yamlPath: ["Элементы", "Финальный", "Значение"] },
    ])
    expect(session.outcomes().find(({ node }) => node === value)?.boundaries).toEqual([
      siblingBoundary,
    ])
    expect(session.rawCandidates()).toEqual([
      {
        node: value,
        boundary: { ...provisionalBoundary, yamlPath: ["Элементы", "Финальный", "Значение"] },
        error,
      },
    ])
  })
})
