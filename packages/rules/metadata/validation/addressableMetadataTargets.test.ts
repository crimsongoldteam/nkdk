import { describe, expect, it } from "vitest"
import { registerMetadataItemCollectionRule } from "../ruleRuntime/metadataCollection/ruleFactory"
import type { MetadataItemRule } from "../ruleRuntime/property/types"
import { MetadataEnumerationRules } from "../appliedObjects/metadataEnumeration/rules"
import "../commonObjects/metadataExternalDataSourceField/types"
import { MetadataExternalDataSourceDimensionTableRules } from "../commonObjects/metadataExternalDataSourceDimensionTable/rules"
import {
  collectAddressableMetadataLogicalAddresses,
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

const ownerChildType = "__AddressableMetadataTargetsOwnerChildCollection" as never

const ownerChildRule = {
  itemType: "MetadataEnumerationValue",
  externalMetadata: { segment: "EnumValue", placement: "ownerChild" },
  properties: {
    name: { type: "string" },
  },
} as const satisfies MetadataItemRule

const ownerWithChildRule = {
  itemType: "MetadataEnumeration",
  properties: {
    values: { type: ownerChildType, yaml: "Значения" },
  },
} as const satisfies MetadataItemRule

const indexedUuidType = "__AddressableMetadataTargetsIndexedUuidCollection" as never

const indexedUuidItemRule = {
  itemType: "MetadataHTTPServiceMethod",
  properties: {
    uuid: { type: "string" },
    name: { type: "string" },
  },
} as const satisfies MetadataItemRule

const ownerWithIndexedUuidRule = {
  itemType: "MetadataHTTPService",
  properties: {
    methods: {
      type: indexedUuidType,
      yaml: "Методы",
    },
  },
} as const satisfies MetadataItemRule

registerMetadataItemCollectionRule({
  propertyType: collectionType,
  itemRule: functionRule,
  xmlElement: "Function",
  keyField: "name",
})

registerMetadataItemCollectionRule({
  propertyType: indexedUuidType,
  itemRule: indexedUuidItemRule,
  xmlElement: "Method",
  keyField: "name",
  configurationIndexUidSegment: "Метод",
})

registerMetadataItemCollectionRule({
  propertyType: ownerChildType,
  itemRule: ownerChildRule,
  xmlElement: "EnumValue",
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

  it("collects an owner child as a logical address", () => {
    const entries = collectAddressableMetadataLogicalAddresses({
      yaml: { Значения: { Новый: {} } },
      rule: ownerWithChildRule,
      logicalAddress: "Перечисление.Статусы",
      filePath: "/project/Перечисление/Статусы/Свойства.yaml",
    })

    expect(entries).toEqual([{
      logicalAddress: "Перечисление.Статусы.EnumValue.Новый",
      sourceProjectPath: "/project/Перечисление/Статусы/Свойства.yaml",
    }])
  })

  it("collects enumeration values through the production rule", () => {
    expect(collectAddressableMetadataLogicalAddresses({
      yaml: { Значения: { Новый: {} } },
      rule: MetadataEnumerationRules,
      logicalAddress: "Перечисление.Статусы",
      filePath: "/project/Перечисление/Статусы/Свойства.yaml",
    })).toEqual([{
      logicalAddress: "Перечисление.Статусы.Значение.Новый",
      sourceProjectPath: "/project/Перечисление/Статусы/Свойства.yaml",
    }])
  })

  it("collects an indexed UUID item without a separate external metadata declaration", () => {
    expect(collectAddressableMetadataLogicalAddresses({
      yaml: { Методы: { Получить: {} } },
      rule: ownerWithIndexedUuidRule,
      logicalAddress: "HTTPСервис.API",
      filePath: "/project/HTTPСервис/API/Свойства.yaml",
    })).toEqual([{
      logicalAddress: "HTTPСервис.API.Метод.Получить",
      sourceProjectPath: "/project/HTTPСервис/API/Свойства.yaml",
    }])
  })

  it("continues the owner's topology logical address for nested dimension table fields", () => {
    expect(collectAddressableMetadataLogicalAddresses({
      yaml: { Поля: { Поле: {} } },
      rule: MetadataExternalDataSourceDimensionTableRules,
      logicalAddress:
        "ВнешнийИсточникДанных.Источник.Куб.Куб.ТаблицаИзмерений.Таблица",
      filePath:
        "/project/ВнешнийИсточникДанных/Источник/Кубы/Куб/ТаблицыИзмерений/Таблица/Свойства.yaml",
    })).toEqual([{
      logicalAddress:
        "ВнешнийИсточникДанных.Источник.Куб.Куб.ТаблицаИзмерений.Таблица.Поле.Поле",
      sourceProjectPath:
        "/project/ВнешнийИсточникДанных/Источник/Кубы/Куб/ТаблицыИзмерений/Таблица/Свойства.yaml",
    }])
  })
})
