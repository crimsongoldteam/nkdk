import { expect, it } from "vitest"
import {
  createDataPathRegistrySet,
  type DataPathContribution,
  type FormDataPathIndex,
  withDataPathRegistrySet,
} from "@nkdk/runtime/rule-kit"

import { resolveDataPathCore } from "./coreResolver"

const ownerCache = { get: () => ({ status: "not-found" as const, diagnostics: [] }), listRefs: () => [] }

const indexFor = (source: FormDataPathIndex["roots"] extends Map<string, infer Source> ? Source : never): FormDataPathIndex => ({
  roots: new Map([[source.name, source]]),
  additionalColumnsByTablePath: new Map(),
  tabularElementsByName: new Map(),
  duplicateDiagnostics: [],
  getRoot: (name) => name === source.name ? source : undefined,
})

const structuredSource = (name: string, type: string) => ({
  kind: "formAttribute" as const,
  name,
  typeInfo: { kinds: ["structured"] as const, nextTypes: [], structuredType: type, sourceText: type },
})

it("resolves a typed structured path and records its trace", () => {
  const contributions: readonly DataPathContribution[] = [{
    kind: "typedGraph",
    types: [
      {
        type: "Root",
        members: [
          { internal: "Nested", yaml: "Вложенное", target: { kind: "structured", type: "Nested" } },
        ],
      },
      {
        type: "Nested",
        members: [
          { internal: "Date", yaml: "Дата", target: { kind: "terminal", terminalTypes: ["dateTime"] } },
        ],
      },
    ],
  }]
  const source = structuredSource("Корень", "Root")
  const index = indexFor(source)

  withDataPathRegistrySet(createDataPathRegistrySet(contributions), () => {
    expect(resolveDataPathCore({
      value: "Корень.Вложенное.Дата",
      nameMode: "yaml",
      index,
      ownerCache,
    })).toMatchObject({
      status: "ok",
      target: {
        typeInfo: { terminalTypes: ["dateTime"] },
        trace: [
          { type: "Root", internal: "Nested", yaml: "Вложенное" },
          { type: "Nested", internal: "Date", yaml: "Дата" },
        ],
      },
    })
  })
})

it("materializes metadata-object and registered dynamic graph targets", () => {
  const contributions: readonly DataPathContribution[] = [
    {
      kind: "typedGraph",
      types: [{
        type: "Root",
        members: [
          { internal: "Owner", yaml: "Объект", target: {
            kind: "metadataObject", owner: { kind: "Справочник", name: "Номенклатура" },
          } },
          { internal: "Computed", yaml: "Вычисляемое", target: { kind: "dynamic", resolver: "computed" } },
          { internal: "Missing", yaml: "Неразрешимое", target: { kind: "dynamic", resolver: "missing" } },
        ],
      }],
    },
    {
      kind: "typedGraphDynamicTarget",
      name: "computed",
      resolver: ({ index }) => index.getRoot("Корень") === undefined
        ? undefined
        : { kind: "terminal", terminalTypes: ["decimal"] },
    },
  ]
  const source = structuredSource("Корень", "Root")
  const index = indexFor(source)

  withDataPathRegistrySet(createDataPathRegistrySet(contributions), () => {
    expect(resolveDataPathCore({ value: "Корень.Объект", nameMode: "yaml", index, ownerCache }))
      .toMatchObject({
        status: "ok",
        target: { typeInfo: { kinds: ["object"], nextTypes: [{ kind: "Справочник", name: "Номенклатура" }] } },
      })
    expect(resolveDataPathCore({ value: "Корень.Вычисляемое", nameMode: "yaml", index, ownerCache }))
      .toMatchObject({ status: "ok", target: { typeInfo: { terminalTypes: ["decimal"] } } })
    expect(resolveDataPathCore({ value: "Корень.Неразрешимое", nameMode: "yaml", index, ownerCache }))
      .toMatchObject({ status: "error", issues: [{ code: "unknown_type" }] })
  })
})
