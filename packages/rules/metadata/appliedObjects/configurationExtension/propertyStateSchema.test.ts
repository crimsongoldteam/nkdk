import { describe, expect, it } from "vitest"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { Type } from "typebox"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import type { ResolvedPropertyStateItemCapability } from "../../ruleRuntime/definition"
import { exportBorrowedPropertyStateSchema } from "../../ruleRuntime/property/propertyStateSchema"
import { exportNestedPropertyStateSchema } from "../../ruleRuntime/property/propertyStateSchema"
import { MetadataAccountingRegisterDimensionRules } from "../metadataAccountingRegister/childRules"
import { createPropertyStateCapabilityRegistry } from "./propertyStateCapabilities"
import { configurationExtensionPropertyStateCapabilities } from "./propertyStateRules"

const rule = {
  itemType: "MetadataCatalog",
  properties: {
    name: { type: "string", yaml: "Имя" },
    comment: { type: "string", yaml: "Комментарий" },
    synonym: { type: "string", yaml: "Синоним" },
    codeLength: { type: "number", yaml: "ДлинаКода", implicitValueYAML: 9 },
    objectModule: { type: "ExternalFile", yaml: "МодульОбъекта" },
    attributes: { type: "Attributes", yaml: "Реквизиты" },
  },
} as MetadataItemRule

const capability: ResolvedPropertyStateItemCapability = {
  itemType: "MetadataCatalog",
  properties: {
    name: { availability: "own", modes: [] },
    comment: { availability: "own", modes: [] },
    synonym: { availability: "borrowed", modes: ["extend"], representation: "plain" },
    codeLength: { availability: "borrowed", modes: ["control", "notify", "extend"], representation: "tagged" },
    objectModule: {
      availability: "borrowed",
      modes: ["extend"],
      representation: "section",
      externalName: "МодульОбъекта",
    },
  },
}

describe("borrowed property-state schema", () => {
  it("разрешает оба явных значения Balance только в режимах контроля и проверки", () => {
    const registry = createPropertyStateCapabilityRegistry(configurationExtensionPropertyStateCapabilities)
    const item = registry.item(MetadataAccountingRegisterDimensionRules.itemType)!
    const schema = exportBorrowedPropertyStateSchema({
      rule: MetadataAccountingRegisterDimensionRules,
      capability: item,
      source: Type.Object({
        Балансовый: Type.Optional(Type.Enum(["Истина", "Ложь"])),
      }, { additionalProperties: false }),
    })
    const validator = compileValidationSchema(schema)

    expect(validator.Check({ Балансовый: "Истина" })).toBe(true)
    expect(validator.Check({ Балансовый: "Ложь" })).toBe(true)
    expect(registry.resolve({
      itemType: MetadataAccountingRegisterDimensionRules.itemType,
      propertyKey: "balance",
    })?.modes).toEqual(["control", "notify"])
  })

  it("расширяет корень схемы, упакованный в $defs", () => {
    const source = {
      $defs: {
        command: {
          $id: "command",
          type: "object",
          properties: {},
          additionalProperties: false,
        },
      },
      $ref: "command",
    }
    const schema = exportBorrowedPropertyStateSchema({ rule, capability, source }) as typeof source

    expect(schema.$defs.command.properties).toHaveProperty("Изменять")
    expect(schema).not.toHaveProperty("properties")
  })

  it("accepts a generated Изменять section", () => {
    const schema = exportBorrowedPropertyStateSchema({
      rule,
      capability,
      source: Type.Object({}, { additionalProperties: false }),
    })
    expect(compileValidationSchema(schema).Check({ Изменять: ["МодульОбъекта"] })).toBe(true)
  })
  it("keeps only capabilities and adds closed canonical sections", () => {
    const schema = exportBorrowedPropertyStateSchema({
      rule,
      capability,
      source: Type.Object({
        Имя: Type.String(),
        Комментарий: Type.Optional(Type.String()),
        Синоним: Type.Optional(Type.String()),
        ДлинаКода: Type.Optional(Type.Number()),
        Реквизиты: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
      }, { additionalProperties: false }),
      structuralPropertyKeys: ["attributes"],
    }) as { properties: Record<string, unknown>; additionalProperties: boolean }

    expect(Object.keys(schema.properties)).toEqual([
      "Имя",
      "Комментарий",
      "Синоним",
      "ДлинаКода",
      "Реквизиты",
      "Изменять",
    ])
    expect(schema.properties.Изменять).toMatchObject({
      type: "array",
      items: { enum: ["МодульОбъекта"] },
      uniqueItems: true,
    })
    expect(schema.properties).not.toHaveProperty("Проверять")
    expect(schema.additionalProperties).toBe(false)
    expect(schema.properties.Реквизиты).not.toMatchObject({
      pattern: "^!xml configurationExtensionPropertyStateXML:[A-Za-z0-9_-]+$",
    })
  })

  it("adds both sections only with names allowed for each mode", () => {
    const schema = exportBorrowedPropertyStateSchema({
      rule,
      capability: {
        ...capability,
        properties: {
          ...capability.properties,
          objectModule: {
            ...capability.properties.objectModule!,
            modes: ["control", "notify", "extend"],
          },
        },
      },
      source: Type.Object({}, { additionalProperties: false }),
    }) as { properties: Record<string, { items?: { enum?: string[] } }> }

    expect(schema.properties.Проверять?.items?.enum).toEqual(["МодульОбъекта"])
    expect(schema.properties.Изменять?.items?.enum).toEqual(["МодульОбъекта"])
  })

  it("разрешает пустое значение локального тега для многорежимного скаляра", () => {
    const schema = exportBorrowedPropertyStateSchema({
      rule,
      capability,
      source: Type.Object({ ДлинаКода: Type.Optional(Type.Number()) }, { additionalProperties: false }),
    }) as { properties: Record<string, { anyOf?: unknown[] }> }

    expect(schema.properties.ДлинаКода?.anyOf).toEqual(expect.arrayContaining([
      expect.objectContaining({ anyOf: expect.arrayContaining([
        expect.objectContaining({ type: "number" }),
        expect.objectContaining({ const: 9 }),
      ]) }),
      expect.objectContaining({ type: "object", maxProperties: 0 }),
    ]))
  })

  it("разрешает null только предметной ссылке", () => {
    const referenceRule = {
      itemType: "MetadataTaskAddressingAttribute",
      properties: {
        addressingDimension: {
          type: "string",
          yaml: "ИзмерениеАдресации",
          metadataTarget: { kind: "member", owner: "explicit", objectRoots: ["InformationRegister"], memberKinds: ["Dimension"] },
        },
        ordinary: { type: "string", yaml: "ОбычнаяСтрока" },
        collection: {
          type: "MetadataObjectRefCollection",
          yaml: "ОбычнаяКоллекция",
          metadataTarget: { kind: "object", roots: ["Catalog"] },
        },
        object: {
          type: "Picture",
          yaml: "ОбычныйОбъект",
          metadataTarget: { kind: "object", roots: ["CommonPicture"] },
        },
      },
    } as MetadataItemRule
    const schema = exportBorrowedPropertyStateSchema({
      rule: referenceRule,
      capability: {
        itemType: referenceRule.itemType,
        properties: {
          addressingDimension: { availability: "borrowed", modes: ["control", "notify", "extend"], representation: "tagged" },
          ordinary: { availability: "borrowed", modes: ["control", "notify", "extend"], representation: "tagged" },
          collection: { availability: "borrowed", modes: ["control", "notify", "extend"], representation: "tagged" },
          object: { availability: "borrowed", modes: ["control", "notify", "extend"], representation: "tagged" },
        },
      },
      source: Type.Object({
        ИзмерениеАдресации: Type.Optional(Type.String()),
        ОбычнаяСтрока: Type.Optional(Type.String()),
        ОбычнаяКоллекция: Type.Optional(Type.Array(Type.String())),
        ОбычныйОбъект: Type.Optional(Type.Object({ Значение: Type.Optional(Type.String()) })),
      }, { additionalProperties: false }),
    })
    const validator = compileValidationSchema(schema)

    expect(validator.Check({ ИзмерениеАдресации: null })).toBe(true)
    expect(validator.Check({ ОбычнаяСтрока: null })).toBe(false)
    expect(validator.Check({ ОбычнаяКоллекция: null })).toBe(false)
    expect(validator.Check({ ОбычныйОбъект: null })).toBe(false)
  })

  it("сохраняет остальные поля корня расширения, но расширяет схему локального тега", () => {
    const schema = exportBorrowedPropertyStateSchema({
      rule,
      capability,
      source: Type.Object({
        ДлинаКода: Type.Optional(Type.Number()),
        СобственноеПоле: Type.Optional(Type.String()),
      }, { additionalProperties: false }),
      closed: false,
    }) as { properties: Record<string, { anyOf?: unknown[] }> }

    expect(schema.properties).toHaveProperty("СобственноеПоле")
    expect(schema.properties.ДлинаКода?.anyOf).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "object", maxProperties: 0 }),
    ]))
  })

  it("запрещает свойство вне закрытой матрицы", () => {
    const schema = exportBorrowedPropertyStateSchema({
      rule,
      capability,
      source: Type.Object({ Реквизиты: Type.Optional(Type.Object({})) }, { additionalProperties: false }),
      closed: true,
    }) as { properties: Record<string, { pattern?: string }> }

    expect(schema.properties).not.toHaveProperty("Реквизиты")
  })

  it("выбирает безопасную закрытую форму вложенного объекта с признаком принадлежности", () => {
    const nestedRule = {
      ...rule,
      properties: {
        ...rule.properties,
        objectBelonging: {
          type: "string",
          yaml: "ПринадлежностьОбъекта",
        },
      },
    } as MetadataItemRule
    const nestedCapability: ResolvedPropertyStateItemCapability = {
      ...capability,
      properties: {
        ...capability.properties,
        objectBelonging: {
          availability: "borrowed",
          modes: [],
          representation: "plain",
        },
      },
    }
    const schema = exportNestedPropertyStateSchema({
      rule: nestedRule,
      capability: nestedCapability,
      source: Type.Object({
        Имя: Type.Optional(Type.String()),
        ДлинаКода: Type.Optional(Type.Number()),
        СобственноеПоле: Type.Optional(Type.String()),
        ПринадлежностьОбъекта: Type.Optional(Type.String()),
      }, { additionalProperties: false }),
    }) as { properties?: Record<string, unknown>; additionalProperties?: boolean }

    expect(schema.properties).not.toHaveProperty("СобственноеПоле")
    expect(schema.properties).toHaveProperty("ПринадлежностьОбъекта")
    expect(schema.additionalProperties).toBe(false)
  })

  it("сохраняет признак принадлежности у корневого заимствованного объекта", () => {
    const borrowedRule = {
      ...rule,
      properties: {
        ...rule.properties,
        objectBelonging: { type: "string", yaml: "ПринадлежностьОбъекта" },
      },
    } as MetadataItemRule
    const schema = exportBorrowedPropertyStateSchema({
      rule: borrowedRule,
      capability,
      source: Type.Object({
        ПринадлежностьОбъекта: Type.Optional(Type.String()),
      }, { additionalProperties: false }),
    }) as { properties?: Record<string, unknown> }

    expect(schema.properties).toHaveProperty("ПринадлежностьОбъекта")
  })

  it("не закрывает вложенную схему без признака принадлежности", () => {
    const nestedRule = {
      itemType: "ClientApplicationForm",
      properties: {
        form: { type: "Form", yaml: "Форма" },
      },
    } as MetadataItemRule
    const schema = exportNestedPropertyStateSchema({
      rule: nestedRule,
      capability: { itemType: nestedRule.itemType, properties: {} },
      source: Type.Object({ Форма: Type.Optional(Type.Object({})) }),
    })

    expect(schema).toMatchObject({ properties: { Форма: expect.any(Object) } })
  })

  it("разрешает зарегистрированный !xml во вложенном заимствованном объекте", () => {
    const schema = exportNestedPropertyStateSchema({
      rule,
      capability,
      source: Type.Object({
        ДлинаКода: Type.Optional(Type.Number()),
        Реквизиты: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
      }, { additionalProperties: false }),
      explicitXMLPropertyKeys: ["attributes"],
    }) as { properties?: Record<string, unknown> }

    expect(schema.properties?.Реквизиты).toEqual(expect.objectContaining({ type: "object" }))
    expect(JSON.stringify(schema.properties?.Реквизиты)).not.toContain("configurationExtensionPropertyStateXML")
  })

  it("разрешает только Ложь или пустой !проверять для флажка расширяемого объекта", () => {
    const serviceRule = {
      ...rule,
      properties: {
        ...rule.properties,
        extendedConfigurationObject: {
          type: "string",
          xml: "ExtendedConfigurationObject",
          xmlParents: ["Properties"],
          runtimeOnly: true,
        },
      },
    } as MetadataItemRule
    const schema = exportNestedPropertyStateSchema({
      rule: serviceRule,
      capability: {
        ...capability,
        properties: {
          ...capability.properties,
          extendedConfigurationObject: {
            availability: "borrowed",
            modes: ["control", "notify"],
            representation: "tagged",
          },
        },
      },
      source: Type.Object({ ДлинаКода: Type.Optional(Type.Number()) }, { additionalProperties: false }),
    })
    const validator = compileValidationSchema(schema)

    expect(validator.Check({ ОбъектРасширяемойКонфигурации: "Ложь" })).toBe(true)
    expect(validator.Check({ ОбъектРасширяемойКонфигурации: {} })).toBe(true)
    expect(validator.Check({ ОбъектРасширяемойКонфигурации: false })).toBe(false)
    expect(validator.Check({ ОбъектРасширяемойКонфигурации: true })).toBe(false)
    expect(validator.Check({ ОбъектРасширяемойКонфигурации: "11111111-1111-4111-8111-111111111111" })).toBe(false)
  })
})
