import { Type } from "typebox"
import { describe, expect, it } from "vitest"
import "../../commonObjects/boolean/toJSONSchema"
import "../../commonObjects/metadataPath/toJSONSchema"
import "../../commonObjects/standardAttributeDescription/registerCollectionRule"
import { EMPTY_XML_TAG_VALUE } from "@nkdk/runtime"
import { mockContext } from "../../../tests/mockContext"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { createValidationSchemaTestSession } from "../jsonSchemaTestSupport"
import {
  registerExplicitXMLProperty,
  registerExplicitXMLPropertyType,
} from "./explicitXMLPropertyRegistry"
import { exportPropertiesToJSONSchema } from "./toJSONSchema"
import type { MetadataItemRule } from "./types"
import { CheckBoxFieldRules } from "../../forms/elements/checkBoxField/rules"
import { ButtonRules } from "../../forms/elements/button/rules"
import { TableRules } from "../../forms/elements/table/rules"

function probeRule(itemType: string): MetadataItemRule {
  return {
    itemType,
    properties: {
      flag: { type: "boolean", yaml: "Флаг", xml: "Flag", implicitValueYAML: true },
    },
  } as MetadataItemRule
}

function explicitXMLSchemas(rule: MetadataItemRule) {
  const session = createValidationSchemaTestSession(mockContext, "inline")
  return {
    validationProperties: exportPropertiesToJSONSchema({
      context: session.context,
      rule,
    }),
    externalProperties: exportPropertiesToJSONSchema({
      context: {
        ...mockContext,
        exportToJSONSchema: { mode: "externalRefs", refs: new Set<string>() },
      },
      rule,
    }),
    validationSchemas: session.schemas,
  }
}

describe("explicit XML property validation schema", () => {
  it("разрешает пустой !xml для точного типа коллекции", () => {
    registerExplicitXMLPropertyType({
      propertyType: "StandardAttributeDescriptions",
      action: "materializeCollection",
      yamlValue: EMPTY_XML_TAG_VALUE,
    })
    const rule = {
      itemType: "ExplicitXMLCollectionSchemaProbe",
      properties: {
        standardAttributes: {
          type: "StandardAttributeDescriptions",
          yaml: "СтандартныеРеквизиты",
          xml: "StandardAttributes",
          standartAttributeNames: { LineNumber: "НомерСтроки" },
        },
      },
    } as const satisfies MetadataItemRule
    const { validationProperties, externalProperties, validationSchemas } = explicitXMLSchemas(rule)
    const validation = compileValidationSchema(validationSchemas(), Type.Object(validationProperties))

    expect(validation.Check({ СтандартныеРеквизиты: "!xml" })).toBe(true)
    expect(validation.Check({ СтандартныеРеквизиты: "!xml payload" })).toBe(false)
    expect(JSON.stringify(externalProperties)).not.toContain("!xml")
  })

  it.each([
    ["закрытая основная политика", CheckBoxFieldRules.properties.dataPath, true],
    ["кнопка без политики", ButtonRules.properties.dataPath, false],
    ["дополнительный путь таблицы", TableRules.properties.rowPictureDataPath, false],
  ] as const)("разрешает !xml для DataPath только когда это %s", (_name, dataPathRule, accepted) => {
    const rule = {
      itemType: `DataPathXMLProbe${_name}`,
      properties: { dataPath: dataPathRule },
    } as MetadataItemRule
    const properties = exportPropertiesToJSONSchema({
      context: {
        ...mockContext,
        exportToJSONSchema: {
          mode: "inline",
          refs: new Set<string>(),
          validationPropertyRefs: true,
        },
      },
      rule,
    })
    const validation = compileValidationSchema({}, Type.Object(properties))
    const externalProperties = exportPropertiesToJSONSchema({
      context: {
        ...mockContext,
        exportToJSONSchema: { mode: "externalRefs", refs: new Set<string>() },
      },
      rule,
    })

    expect(validation.Check({ [dataPathRule.yaml!]: "!xml Объект.Invalid" })).toBe(accepted)
    expect(validation.Check({ [dataPathRule.yaml!]: "!xml" })).toBe(false)
    expect(validation.Check({ [dataPathRule.yaml!]: "!xml   " })).toBe(false)
    expect(JSON.stringify(externalProperties)).not.toContain("!xml")
  })

  it("разрешает !xml только зарегистрированному ограниченному свойству", () => {
    const registeredRule = probeRule("ExplicitXMLSchemaProbe")
    registerExplicitXMLProperty({
      itemType: registeredRule.itemType,
      propertyKey: "flag",
      xmlValue: true,
      yamlValue: EMPTY_XML_TAG_VALUE,
    })
    const session = createValidationSchemaTestSession(mockContext, "inline", {
      excludeImplicitValueYAML: true,
    })
    const registeredSchema = Type.Object(
      exportPropertiesToJSONSchema({ context: session.context, rule: registeredRule })
    )
    const unregisteredSchema = Type.Object(
      exportPropertiesToJSONSchema({
        context: session.context,
        rule: probeRule("UnregisteredExplicitXMLSchemaProbe"),
      })
    )
    const refName = "nkdk://schema/validation/2.20/ru/boolean/without-true"
    const refSchema = session.get(refName)
    if (refSchema === undefined) throw new Error("Expected boolean validation schema")
    const schemaContext = { [refName]: refSchema }

    expect(compileValidationSchema(schemaContext, registeredSchema).Check({ Флаг: "!xml" })).toBe(true)
    expect(compileValidationSchema(schemaContext, unregisteredSchema).Check({ Флаг: "!xml" })).toBe(false)
  })

  it("не показывает !xml во внешней схеме подсказок", () => {
    const rule = probeRule("ExplicitXMLExternalSchemaProbe")
    registerExplicitXMLProperty({
      itemType: rule.itemType,
      propertyKey: "flag",
      xmlValue: true,
      yamlValue: EMPTY_XML_TAG_VALUE,
    })
    const properties = exportPropertiesToJSONSchema({
      context: {
        ...mockContext,
        exportToJSONSchema: { mode: "externalRefs", refs: new Set<string>() },
      },
      rule,
    })

    expect(JSON.stringify(properties)).not.toContain('"const":"!xml"')
  })

  it("разрешает для скрытого RowFilter только пустой !xml", () => {
    const { validationProperties, externalProperties, validationSchemas } = explicitXMLSchemas(TableRules)
    const validation = compileValidationSchema(validationSchemas(), Type.Object(validationProperties))

    expect(validation.Check({ ОтборСтрок: EMPTY_XML_TAG_VALUE })).toBe(true)
    expect(validation.Check({ ОтборСтрок: "!xml payload" })).toBe(false)
    expect(validation.Check({ ОтборСтрок: true })).toBe(false)
    expect(externalProperties).not.toHaveProperty("ОтборСтрок")
  })

  it("разрешает любой scalar только внутренней схеме зарегистрированного транспорта", () => {
    const rule = probeRule("ExplicitXMLScalarSchemaProbe")
    registerExplicitXMLProperty({
      action: "transportScalar",
      itemType: rule.itemType,
      propertyKey: "flag",
    })
    const { validationProperties, externalProperties, validationSchemas } = explicitXMLSchemas(rule)

    const refName = "nkdk://schema/validation/2.20/ru/boolean/without-true"
    const refSchema = validationSchemas()[refName]
    if (refSchema === undefined) throw new Error("Expected boolean validation schema")
    const validation = compileValidationSchema({ [refName]: refSchema }, Type.Object(validationProperties))
    expect(validation.Check({ Флаг: "!xml" })).toBe(true)
    expect(validation.Check({ Флаг: "!xml Ложь" })).toBe(true)
    expect(JSON.stringify(externalProperties)).not.toContain("!xml")
  })
})
