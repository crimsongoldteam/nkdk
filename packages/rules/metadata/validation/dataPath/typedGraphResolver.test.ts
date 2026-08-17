import { expect, it } from "vitest"
import {
  createDataPathRegistrySet,
  type DataPathContribution,
  type FormDataPathIndex,
  withDataPathRegistrySet,
} from "@nkdk/runtime/rule-kit"

import { resolveDataPathCore } from "./coreResolver"

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
  const source = {
    kind: "formAttribute" as const,
    name: "Корень",
    typeInfo: { kinds: ["structured"] as const, nextTypes: [], structuredType: "Root", sourceText: "Root" },
  }
  const index: FormDataPathIndex = {
    roots: new Map([[source.name, source]]),
    additionalColumnsByTablePath: new Map(),
    tabularElementsByName: new Map(),
    duplicateDiagnostics: [],
    getRoot: (name) => name === source.name ? source : undefined,
  }

  withDataPathRegistrySet(createDataPathRegistrySet(contributions), () => {
    expect(resolveDataPathCore({
      value: "Корень.Вложенное.Дата",
      nameMode: "yaml",
      index,
      ownerCache: { get: () => ({ status: "not-found", diagnostics: [] }), listRefs: () => [] },
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
