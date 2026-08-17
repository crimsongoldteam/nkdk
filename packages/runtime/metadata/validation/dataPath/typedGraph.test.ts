import { describe, expect, it } from "vitest"

import { createDataPathRegistrySet, type DataPathContribution } from "./registry"
import type { DataPathViewDeclaration, TypedDataPathTypeDeclaration } from "./typedGraph"

const types: readonly TypedDataPathTypeDeclaration[] = [
  {
    type: "Root",
    aliases: ["Корень"],
    members: [
      { internal: "Nested", yaml: "Вложенное", target: { kind: "structured", type: "Nested" } },
      { internal: "Rows", yaml: "Строки", target: { kind: "collection", itemType: "Row" } },
      {
        internal: "Owner",
        yaml: "Объект",
        target: { kind: "metadataObject", owner: { kind: "Справочник", name: "Номенклатура" } },
      },
      { internal: "Computed", yaml: "Вычисляемое", target: { kind: "dynamic", resolver: "computed" } },
      { internal: "Flag", yaml: "Флаг", target: { kind: "terminal", terminalTypes: ["boolean"] } },
    ],
  },
  {
    type: "Nested",
    members: [
      { internal: "Date", yaml: "Дата", target: { kind: "terminal", terminalTypes: ["dateTime"] } },
    ],
  },
]

const view: DataPathViewDeclaration = {
  purpose: "formConditionalFilter",
  types: { Root: ["Nested", "Flag"], Nested: ["Date"] },
}

const contributions: readonly DataPathContribution[] = [
  { kind: "typedGraph", types },
  { kind: "dataPathView", view },
  {
    kind: "typedGraphDynamicTarget",
    name: "computed",
    resolver: () => ({ kind: "terminal", terminalTypes: ["decimal"] }),
  },
]

describe("typed data path graph", () => {
  it.each(["Root", "Корень"])("resolves members through the type name %s", (type) => {
    const registry = createDataPathRegistrySet(contributions)

    expect(registry.resolveTypedMember({ type, segment: "Nested" })).toMatchObject({
      internal: "Nested",
      yaml: "Вложенное",
      target: { kind: "structured", type: "Nested" },
    })
    expect(registry.resolveTypedMember({ type, segment: "Вложенное" })).toMatchObject({
      internal: "Nested",
      yaml: "Вложенное",
    })
  })

  it("preserves structured, collection, metadata, dynamic and terminal targets", () => {
    const registry = createDataPathRegistrySet(contributions)

    expect(registry.resolveTypedMember({ type: "Root", segment: "Nested" })?.target)
      .toEqual({ kind: "structured", type: "Nested" })
    expect(registry.resolveTypedMember({ type: "Root", segment: "Rows" })?.target)
      .toEqual({ kind: "collection", itemType: "Row" })
    expect(registry.resolveTypedMember({ type: "Root", segment: "Flag" })?.target)
      .toEqual({ kind: "terminal", terminalTypes: ["boolean"] })
    expect(registry.resolveTypedMember({ type: "Root", segment: "Owner" })?.target)
      .toEqual({ kind: "metadataObject", owner: { kind: "Справочник", name: "Номенклатура" } })
    const dynamicMember = registry.resolveTypedMember({ type: "Root", segment: "Computed" })
    expect(dynamicMember?.target).toEqual({ kind: "dynamic", resolver: "computed" })
    expect(dynamicMember === undefined ? undefined : registry.resolveTypedDynamicTarget({
      member: dynamicMember,
      index: {} as never,
      ownerCache: {} as never,
    })).toEqual({ kind: "terminal", terminalTypes: ["decimal"] })
    expect(registry.resolveTypedMember({ type: "Root", segment: "Unknown" })).toBeUndefined()
  })

  it("checks a trace against an independent availability view", () => {
    const registry = createDataPathRegistrySet(contributions)

    expect(registry.checkTraceAvailability("formConditionalFilter", [
      { type: "Root", internal: "Nested", yaml: "Вложенное" },
      { type: "Nested", internal: "Date", yaml: "Дата" },
    ])).toBe(true)
    expect(registry.checkTraceAvailability("formConditionalFilter", [
      { type: "Root", internal: "Rows", yaml: "Строки" },
    ])).toBe(false)
    expect(registry.checkTraceAvailability("formConditionalFilter", [])).toBe(true)
    expect(registry.checkTraceAvailability("otherPurpose", [
      { type: "Root", internal: "Rows", yaml: "Строки" },
    ])).toBe(true)
  })

  it.each([
    ["duplicate type", [{ kind: "typedGraph", types: [types[0], types[0]] }]],
    ["duplicate alias", [{ kind: "typedGraph", types: [
      { ...types[0], aliases: ["Shared"] },
      { ...types[1], aliases: ["Shared"] },
    ] }]],
    ["duplicate member name", [{ kind: "typedGraph", types: [{
      type: "Broken",
      members: [
        { internal: "First", yaml: "Одинаково", target: { kind: "terminal", terminalTypes: ["string"] } },
        { internal: "Second", yaml: "Одинаково", target: { kind: "terminal", terminalTypes: ["string"] } },
      ],
    }] }]],
    ["duplicate dynamic resolver", [
      { kind: "typedGraphDynamicTarget", name: "same", resolver: () => undefined },
      { kind: "typedGraphDynamicTarget", name: "same", resolver: () => undefined },
    ]],
  ] as const)("rejects %s", (_name, invalid) => {
    expect(() => createDataPathRegistrySet(invalid as readonly DataPathContribution[])).toThrow()
  })
})
