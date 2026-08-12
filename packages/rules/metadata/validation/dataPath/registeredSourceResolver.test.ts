import { describe, expect, it } from "vitest"
import { enterDataPathRegistrySet } from "@nkdk/runtime/rule-kit"
import type { DataPathTypeInfo, FormDataPathColumnSource, FormDataPathSource } from "./types"
import type { FormDataPathIndex } from "./formIndex"
import { resolveDataPathCore } from "./coreResolver"
import { createDataPathRegistrySet, type TableColumnResolver } from "./registry"

describe("registered DataPath table sources", () => {
  it.each([
    ["Composer.Настройки", "yaml", [{ segmentIndex: 1, from: "Настройки", to: "Settings", reason: "standardMember" }]],
    ["Composer.Settings", "internal", [{ segmentIndex: 1, from: "Settings", to: "Настройки", reason: "standardMember" }]],
  ] as const)("translates registered table columns for %s", (value, nameMode, replacements) => {
    const settingsColumn: FormDataPathColumnSource = {
      name: "Настройки",
      targetName: "Settings",
      typeInfo: registeredSource("DataCompositionSettings"),
    }

    const result = withTableColumnResolver(({ table, segment }) =>
      table.kind === "Registered" && table.type === "Composer" &&
      (segment === "Настройки" || segment === "Settings")
        ? settingsColumn
        : undefined, () => resolveDataPathCore({
      value,
      nameMode,
      index: indexWithTypeInfo("Composer", registeredSource("Composer")),
      ownerCache: emptyOwnerCache,
    }))

    expect(result).toMatchObject({
      status: "ok",
      replacements,
      target: { typeInfo: { terminalTypes: ["DataCompositionSettings"] } },
    })
  })

  it("resolves a registered DynamicList column before keeping unknown columns opaque", () => {
    const settingsComposer: FormDataPathColumnSource = {
      name: "КомпоновщикНастроек",
      targetName: "SettingsComposer",
      typeInfo: registeredSource("DataCompositionSettingsComposer"),
    }
    const resolver: TableColumnResolver = ({ table, segment }) =>
      table.kind === "DynamicList" && (segment === "КомпоновщикНастроек" || segment === "SettingsComposer")
        ? settingsComposer
        : undefined
    const index = indexWithTypeInfo("Список", {
      kinds: ["dynamicList", "tableSource"],
      nextTypes: [],
      table: { kind: "DynamicList" },
    })

    const registered = withTableColumnResolver(resolver, () => resolveDataPathCore({
      value: "Список.КомпоновщикНастроек",
      nameMode: "yaml",
      index,
      ownerCache: emptyOwnerCache,
    }))
    const unknown = withTableColumnResolver(resolver, () => resolveDataPathCore({
      value: "Список.НеизвестноеПоле",
      nameMode: "yaml",
      index,
      ownerCache: emptyOwnerCache,
    }))

    expect(registered).toMatchObject({
      status: "ok",
      replacements: [{
        segmentIndex: 1,
        from: "КомпоновщикНастроек",
        to: "SettingsComposer",
        reason: "standardMember",
      }],
      target: { typeInfo: { terminalTypes: ["DataCompositionSettingsComposer"] } },
    })
    expect(unknown).toMatchObject({ status: "ok" })
    expect(unknown).not.toHaveProperty("target")
  })
})

const emptyOwnerCache = {
  get: () => ({ status: "not-found" as const, diagnostics: [] }),
  listRefs: () => [],
}

function registeredSource(type: string): DataPathTypeInfo {
  return {
    kinds: ["tableSource"],
    nextTypes: [],
    terminalTypes: [type],
    table: { kind: "Registered", type },
  }
}

function indexWithTypeInfo(name: string, typeInfo: DataPathTypeInfo): FormDataPathIndex {
  const source: FormDataPathSource = {
    kind: "formAttribute",
    name,
    typeInfo,
    ...(typeInfo.table === undefined ? {} : {
      tableSource: { table: typeInfo.table, columns: new Map(), hasColumns: typeInfo.table.kind === "Registered" },
    }),
  }
  const roots = new Map([[name, source]])
  return {
    roots, additionalColumnsByTablePath: new Map(), tabularElementsByName: new Map(), duplicateDiagnostics: [],
    getRoot(rootName) { return roots.get(rootName) },
  }
}

function withTableColumnResolver<Result>(resolver: TableColumnResolver, execute: () => Result): Result {
  enterDataPathRegistrySet(createDataPathRegistrySet([{ kind: "tableColumn", resolver }]))
  return execute()
}
