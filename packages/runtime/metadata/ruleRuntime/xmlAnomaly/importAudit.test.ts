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

  it("меняет YAML-префикс только в указанном XML-поддереве", () => {
    const root = parseXmlDocumentWithSaxes("<Root><Value/></Root>").roots[0]!
    const unrelated = parseXmlDocumentWithSaxes("<Other><Value/></Other>").roots[0]!
    const session = createXmlImportAuditSession([root, unrelated])
    const sourceBoundary = { ...boundary, yamlPath: ["Элементы", 0, "Значение"] }
    for (const node of [root, root.content[0]!, unrelated, unrelated.content[0]!]) {
      session.claim(node, sourceBoundary)
    }
    session.rawCandidate(root.content[0]!, sourceBoundary, new Error("root"))
    session.rawCandidate(unrelated.content[0]!, sourceBoundary, new Error("unrelated"))

    session.rekeyYamlPath(["Элементы", 0], ["Элементы", "Первый"], root)

    expect(session.getOutcome(root).boundaries[0]?.yamlPath)
      .toEqual(["Элементы", "Первый", "Значение"])
    expect(session.getOutcome(unrelated).boundaries[0]?.yamlPath)
      .toEqual(["Элементы", 0, "Значение"])
    expect(session.rawCandidates().map(({ boundary: candidate }) => candidate.yamlPath)).toEqual([
      ["Элементы", "Первый", "Значение"],
      ["Элементы", 0, "Значение"],
    ])
  })

  it("атомарно отмечает полностью заявленное поддерево как осмысленно исключённое", () => {
    const root = parseXmlDocumentWithSaxes(
      '<Root kind="known"><Value>one</Value><Value>two</Value></Root>',
    ).roots[0]!
    const session = createXmlImportAuditSession([root])
    for (const { node } of session.outcomes()) session.claim(node, boundary)

    expect(session.elideSubtree(root, boundary)).toBe(true)
    const outcomes = session.outcomes()
    expect(outcomes.map(({ state }) => state))
      .toEqual(Array(outcomes.length).fill("semanticallyElided"))
    expect(outcomes.find(({ node }) => node === root)?.boundaries).toEqual([boundary])
    expect(outcomes.filter(({ node }) => node !== root).every(({ boundaries }) =>
      boundaries.length === 0
    )).toBe(true)
    expect(outcomes.reduce((sum, { boundaries }) => sum + boundaries.length, 0)).toBe(1)

    session.rekeyYamlPath([], ["Владелец"])

    expect(session.outcomes().find(({ node }) => node === root)?.boundaries[0]?.yamlPath)
      .toEqual(["Владелец", "Значение"])
  })

  it("не меняет состояния, если в исключаемом поддереве остался неизвестный узел", () => {
    const root = parseXmlDocumentWithSaxes(
      "<Root><Known>value</Known><Unknown/></Root>",
    ).roots[0]!
    const session = createXmlImportAuditSession([root])
    const unknown = root.content.find(
      (node) => node.type === "element" && node.name === "Unknown",
    )!
    for (const { node } of session.outcomes()) {
      if (node !== unknown) session.claim(node, boundary)
    }
    const before = session.outcomes()

    expect(session.elideSubtree(root, boundary)).toBe(false)
    expect(session.outcomes()).toEqual(before)
  })

  it("не исключает поддерево с дублем, неоднозначностью или raw-кандидатом", () => {
    const variants = ["duplicate", "ambiguous", "rawCandidate"] as const
    for (const variant of variants) {
      const root = parseXmlDocumentWithSaxes("<Root><Value>broken</Value></Root>").roots[0]!
      const value = root.content.find((node) => node.type === "element")!
      const session = createXmlImportAuditSession([root])
      for (const { node } of session.outcomes()) session.claim(node, boundary)
      if (variant === "duplicate") session.duplicate(value, boundary)
      if (variant === "ambiguous") {
        session.ambiguous(value, [{ ...boundary, propertyKey: "other" }])
      }
      if (variant === "rawCandidate") {
        session.rawCandidate(value, boundary, new Error("broken"))
      }
      const before = session.outcomes()

      expect(session.elideSubtree(root, boundary), variant).toBe(false)
      expect(session.outcomes(), variant).toEqual(before)
    }
  })

  it("компактно заявляет известное XML-only поддерево одной границей", () => {
    const root = parseXmlDocumentWithSaxes(
      '<Root kind="known"><Child>value</Child></Root>',
    ).roots[0]!
    const session = createXmlImportAuditSession([root])
    session.claim(root, boundary)

    expect(session.claimStructuralSubtree(root, boundary)).toBe(true)
    session.finalize()

    const outcomes = session.outcomes()
    expect(outcomes.find(({ node }) => node === root)).toEqual({
      node: root,
      state: "structurallyClaimed",
      boundaries: [boundary],
    })
    expect(outcomes.filter(({ node }) => node !== root).every(({ state, boundaries }) =>
      state === "structurallyCovered" && boundaries.length === 0
    )).toBe(true)
    expect(outcomes.reduce((sum, { boundaries }) => sum + boundaries.length, 0)).toBe(1)
  })

  it("атомарно отклоняет пересечение структурной и смысловой границ", () => {
    const root = parseXmlDocumentWithSaxes("<Root><Child>value</Child></Root>").roots[0]!
    const child = root.content.find((node) => node.type === "element")!
    const otherBoundary: XmlImportAuditBoundary = {
      ...boundary,
      propertyKey: "other",
      yamlPath: ["Другое"],
    }
    const session = createXmlImportAuditSession([root])
    session.claim(root, boundary)
    session.claim(child, otherBoundary)
    const before = session.outcomes()

    expect(session.claimStructuralSubtree(root, boundary)).toBe(false)
    expect(session.outcomes()).toEqual(before)
  })

  it("переносит YAML-путь корня структурной границы", () => {
    const root = parseXmlDocumentWithSaxes("<Root><Child/></Root>").roots[0]!
    const session = createXmlImportAuditSession([root])
    session.claim(root, boundary)
    expect(session.claimStructuralSubtree(root, boundary)).toBe(true)

    session.rekeyYamlPath([], ["Владелец"])

    expect(session.outcomes().find(({ node }) => node === root)?.boundaries).toEqual([
      { ...boundary, yamlPath: ["Владелец", "Значение"] },
    ])
  })
})
