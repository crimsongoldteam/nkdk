import { describe, expect, it } from "vitest"
import { registerMetadataItemCollectionRule } from "../ruleRuntime/metadataCollection/ruleFactory"
import type { MetadataItemRule } from "../ruleRuntime/property/types"
import {
  collectAddressableMetadataObjectEntries,
  objectTargetForProjectFile,
} from "./addressableMetadataTargets"

const collectionType = "__AddressableMetadataTargetsCollection" as never

const functionRule = {
  itemType: "MetadataExternalDataSourceFunction",
  externalMetadata: { segment: "Function", placement: "ownedEntry" },
  properties: {
    name: { type: "string" },
    type: { type: "string", yaml: "Тип" },
  },
} as const satisfies MetadataItemRule

const ownerRule = {
  itemType: "MetadataExternalDataSource",
  properties: {
    functions: { type: collectionType, yaml: "Функции" },
  },
} as const satisfies MetadataItemRule

registerMetadataItemCollectionRule({
  propertyType: collectionType,
  itemRule: functionRule,
  xmlElement: "Function",
  keyField: "name",
})

describe("collectAddressableMetadataObjectEntries", () => {
  it("reads the exact nested object target declared by topology", () => {
    expect(objectTargetForProjectFile({
      kind: "properties",
      projectPath: "ВнешнийИсточникДанных/Источник/Таблицы/Таблица/Свойства.yaml",
      metadataTarget: { canonical: "ExternalDataSource.Источник.Table.Таблица" },
    })).toEqual({
      kind: "object",
      root: "ExternalDataSource",
      objectName: "Источник",
      segments: [{ kind: "Table", objectName: "Таблица" }],
    })
  })

  it("indexes an addressable inline item from its declared external metadata segment", () => {
    const entries = collectAddressableMetadataObjectEntries({
      yaml: { Функции: { Функция1: { Тип: "Строка" } } },
      rule: ownerRule,
      canonicalTarget: "ExternalDataSource.Источник",
      filePath: "/project/ВнешнийИсточникДанных/Источник/Свойства.yaml",
    })

    expect(entries).toEqual([
      expect.objectContaining({
        canonical: "ExternalDataSource.Источник.Function.Функция1",
        target: expect.objectContaining({
          kind: "object",
          root: "ExternalDataSource",
          objectName: "Источник",
          segments: [{ kind: "Function", objectName: "Функция1" }],
        }),
        result: expect.objectContaining({
          ok: true,
          filePath: "/project/ВнешнийИсточникДанных/Источник/Свойства.yaml",
        }),
      }),
    ])
  })
})
