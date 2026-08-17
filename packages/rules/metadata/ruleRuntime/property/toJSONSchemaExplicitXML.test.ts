import { Type } from "typebox"
import { describe, expect, it } from "vitest"
import { XML_ABSENT_TAG_VALUE, XML_PRESENT_TAG_VALUE } from "@nkdk/runtime"
import {
  composeMetadataRules,
  createPropertyRuleExecutor,
  createPropertyRuleRegistrySet,
  defineMetadataRules,
} from "@nkdk/runtime/rule-kit"
import { mockContext } from "../../../tests/mockContext"
import { staticPropertyTypes } from "../../composition/staticPropertyRules"
import { metadataRuleLayer000 as standardAttributeDescriptionRules } from "../../commonObjects/standardAttributeDescription/registerCollectionRule"
import { explicitRowFilterRules } from "../../forms/elements/table/explicitRowFilter"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { createValidationSchemaTestSession } from "../jsonSchemaTestSupport"
import { emptyMetadataRules } from "../definition/testSupport"
import { exportPropertiesToJSONSchema } from "./toJSONSchema"
import type { MetadataItemRule } from "./types"
import { CheckBoxFieldRules } from "../../forms/elements/checkBoxField/rules"
import { ButtonRules } from "../../forms/elements/button/rules"
import { TableRules } from "../../forms/elements/table/rules"
import { explicitAdditionalFieldsRules } from "../../commonObjects/indexField/explicitAdditionalFields"
import { explicitEmptyAttributesRules } from "../../forms/clientApplicationForm/explicitEmptyAttributes"
import { explicitEmptyFormElementTitleRules } from "../../forms/clientApplicationForm/explicitEmptyTitle"
import { explicitEmptyPredefinedExtDimensionTypesRules } from "../../appliedObjects/metadataChartOfAccounts/predefined/rules"
import { formAttributeValueTypeSettingsRules } from "../../forms/commonObjects/formAttribute/valueListSettings"
import { ClientApplicationFormRules } from "../../forms/clientApplicationForm/rules"
import { LabelDecorationRules } from "../../forms/elements/labelDecoration/rules"
import { ChartOfAccountsPredefinedItemRules } from "../../appliedObjects/metadataChartOfAccounts/predefined/rules"
import { FormAttributeRules } from "../../forms/commonObjects/formAttribute/rules"

function probeRule(itemType: string): MetadataItemRule {
  return {
    itemType,
    properties: {
      flag: { type: "boolean", yaml: "Флаг", xml: "Flag", implicitValueYAML: true },
    },
  } as MetadataItemRule
}

function explicitXMLExecution(
  explicitXMLProperties: Parameters<typeof defineMetadataRules>[0]["explicitXMLProperties"] = {},
) {
  const propertyTypeRules = defineMetadataRules({
    ...emptyMetadataRules,
    propertyTypes: staticPropertyTypes,
  })
  const testRules = defineMetadataRules({
    ...emptyMetadataRules,
    explicitXMLProperties,
  })
  return createPropertyRuleExecutor(createPropertyRuleRegistrySet(composeMetadataRules(
    propertyTypeRules,
    standardAttributeDescriptionRules,
    explicitRowFilterRules,
    testRules,
  )))
}

const defaultExecution = explicitXMLExecution()

function explicitXMLSchemas(rule: MetadataItemRule, execution = defaultExecution) {
  const session = createValidationSchemaTestSession(mockContext, "inline")
  return {
    validationProperties: exportPropertiesToJSONSchema({
      context: session.context,
      rule,
      execution,
    }),
    externalProperties: exportPropertiesToJSONSchema({
      context: {
        ...mockContext,
        exportToJSONSchema: { mode: "externalRefs", refs: new Set<string>() },
      },
      rule,
      execution,
    }),
    validationSchemas: session.schemas,
  }
}

describe("explicit XML property validation schema", () => {
  it("разрешает null для явно очищенной скалярной ссылки расширения", () => {
    const rule = {
      itemType: "ExplicitClearedReferenceProbe",
      properties: {
        form: {
          type: "string",
          yaml: "Форма",
          metadataTarget: { kind: "object", roots: ["CommonForm"] },
        },
      },
    } as MetadataItemRule
    const exported = explicitXMLSchemas(rule)

    expect(compileValidationSchema(exported.validationSchemas(), exported.validationProperties.Форма!).Check(null))
      .toBe(true)
    expect(JSON.stringify(exported.externalProperties)).not.toContain('"null"')
  })

  it.each([
    [
      "ДополнительныеПоля",
      { itemType: "IndexField", properties: { additionalFields: { type: "IndexField", yaml: "ДополнительныеПоля" } } },
    ],
    ["Реквизиты", ClientApplicationFormRules],
    ["Заголовок", LabelDecorationRules],
    ["ВидыСубконто", ChartOfAccountsPredefinedItemRules],
    ["ТипЗначения", FormAttributeRules],
  ] as const)("разрешает классифицированный пустой XML-маркер только согласованному свойству %s", (yamlKey, sourceRule) => {
    const explicitXMLProperties = {
      ...explicitAdditionalFieldsRules.explicitXMLProperties,
      ...explicitEmptyAttributesRules.explicitXMLProperties,
      ...explicitEmptyFormElementTitleRules.explicitXMLProperties,
      ...explicitEmptyPredefinedExtDimensionTypesRules.explicitXMLProperties,
      ...formAttributeValueTypeSettingsRules.explicitXMLProperties,
    }
    const execution = explicitXMLExecution(explicitXMLProperties)
    const completeRule = sourceRule as MetadataItemRule
    const propertyEntry = Object.entries(completeRule.properties).find(([, property]) => property.yaml === yamlKey)
    if (propertyEntry === undefined) throw new Error(`Не найдено правило свойства ${yamlKey}`)
    const [propertyKey, property] = propertyEntry
    const rule = {
      itemType: completeRule.itemType,
      properties: { [propertyKey]: property },
    } as MetadataItemRule
    const otherOwner = { ...rule, itemType: `${rule.itemType}Other` } as MetadataItemRule
    const accepted = explicitXMLSchemas(rule, execution)
    const acceptedProperty = accepted.validationProperties[yamlKey]

    if (acceptedProperty !== undefined) {
      const expected = yamlKey === "ТипЗначения" ? XML_ABSENT_TAG_VALUE : XML_PRESENT_TAG_VALUE
      expect(compileValidationSchema(accepted.validationSchemas(), acceptedProperty).Check(expected)).toBe(true)
    }
    expect(execution.explicitXMLPropertyValidationTag(rule.itemType, propertyKey))
      .toBe(yamlKey === "ТипЗначения" ? "xml/absent" : "xml/present")
    expect(execution.explicitXMLPropertyValidationTag(otherOwner.itemType, propertyKey)).toBeUndefined()
    const external = JSON.stringify(accepted.externalProperties)
    expect(external).not.toContain(`\"const\":\"${XML_PRESENT_TAG_VALUE}\"`)
    expect(external).not.toContain(`\"const\":\"${XML_ABSENT_TAG_VALUE}\"`)
  })

  it("разрешает пустой !xml для точного типа коллекции", () => {
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

    expect(validation.Check({ СтандартныеРеквизиты: XML_PRESENT_TAG_VALUE })).toBe(true)
    expect(validation.Check({ СтандартныеРеквизиты: "!xml/present payload" })).toBe(false)
    expect(validation.Check({ СтандартныеРеквизиты: XML_ABSENT_TAG_VALUE })).toBe(false)
    expect(JSON.stringify(externalProperties)).not.toContain(`\"const\":\"${XML_PRESENT_TAG_VALUE}\"`)
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
      execution: defaultExecution,
    })
    const validation = compileValidationSchema({}, Type.Object(properties))
    const externalProperties = exportPropertiesToJSONSchema({
      context: {
        ...mockContext,
        exportToJSONSchema: { mode: "externalRefs", refs: new Set<string>() },
      },
      rule,
      execution: defaultExecution,
    })

    expect(validation.Check({ [dataPathRule.yaml!]: "!xml/value Объект.Invalid" })).toBe(accepted)
    expect(validation.Check({ [dataPathRule.yaml!]: "!xml/value" })).toBe(false)
    expect(validation.Check({ [dataPathRule.yaml!]: "!xml/value   " })).toBe(false)
    expect(JSON.stringify(externalProperties)).not.toContain("!xml")
  })

  it("разрешает !xml только зарегистрированному ограниченному свойству", () => {
    const registeredRule = probeRule("ExplicitXMLSchemaProbe")
    const execution = explicitXMLExecution({
      registeredFlag: {
        itemType: registeredRule.itemType,
        propertyKey: "flag",
        xmlValue: true,
        yamlValue: XML_PRESENT_TAG_VALUE,
      },
    })
    const session = createValidationSchemaTestSession(mockContext, "inline", {
      excludeImplicitValueYAML: true,
    })
    const registeredSchema = Type.Object(
      exportPropertiesToJSONSchema({ context: session.context, rule: registeredRule, execution })
    )
    const unregisteredSchema = Type.Object(
      exportPropertiesToJSONSchema({
        context: session.context,
        rule: probeRule("UnregisteredExplicitXMLSchemaProbe"),
        execution,
      })
    )
    const refName = "nkdk://schema/validation/2.20/ru/boolean/without-true"
    const refSchema = session.get(refName)
    if (refSchema === undefined) throw new Error("Expected boolean validation schema")
    const schemaContext = { [refName]: refSchema }

    expect(compileValidationSchema(schemaContext, registeredSchema).Check({ Флаг: XML_PRESENT_TAG_VALUE })).toBe(true)
    expect(compileValidationSchema(schemaContext, unregisteredSchema).Check({ Флаг: XML_PRESENT_TAG_VALUE })).toBe(false)
  })

  it("не показывает !xml во внешней схеме подсказок", () => {
    const rule = probeRule("ExplicitXMLExternalSchemaProbe")
    const execution = explicitXMLExecution({
      externalFlag: {
        itemType: rule.itemType,
        propertyKey: "flag",
        xmlValue: true,
        yamlValue: XML_PRESENT_TAG_VALUE,
      },
    })
    const properties = exportPropertiesToJSONSchema({
      context: {
        ...mockContext,
        exportToJSONSchema: { mode: "externalRefs", refs: new Set<string>() },
      },
      rule,
      execution,
    })

    expect(JSON.stringify(properties)).not.toContain('"const":"!xml"')
  })

  it("разрешает для скрытого RowFilter только пустой !xml", () => {
    const rowFilterRule = {
      itemType: TableRules.itemType,
      properties: { rowFilter: TableRules.properties.rowFilter },
    } as MetadataItemRule
    const { validationProperties, externalProperties, validationSchemas } = explicitXMLSchemas(rowFilterRule)
    const validation = compileValidationSchema(validationSchemas(), Type.Object(validationProperties))

    expect(validation.Check({ ОтборСтрок: XML_PRESENT_TAG_VALUE })).toBe(true)
    expect(validation.Check({ ОтборСтрок: "!xml/present payload" })).toBe(false)
    expect(validation.Check({ ОтборСтрок: XML_ABSENT_TAG_VALUE })).toBe(false)
    expect(validation.Check({ ОтборСтрок: true })).toBe(false)
    expect(externalProperties).not.toHaveProperty("ОтборСтрок")
  })

  it("разрешает любой scalar только внутренней схеме зарегистрированного транспорта", () => {
    const rule = probeRule("ExplicitXMLScalarSchemaProbe")
    const execution = explicitXMLExecution({
      scalarFlag: {
        action: "transportScalar",
        itemType: rule.itemType,
        propertyKey: "flag",
        transformPayload: (payload) => payload === "Ложь",
      },
    })
    const { validationProperties, externalProperties, validationSchemas } = explicitXMLSchemas(rule, execution)

    const refName = "nkdk://schema/validation/2.20/ru/boolean/without-true"
    const refSchema = validationSchemas()[refName]
    if (refSchema === undefined) throw new Error("Expected boolean validation schema")
    const validation = compileValidationSchema({ [refName]: refSchema }, Type.Object(validationProperties))
    expect(validation.Check({ Флаг: "!xml/value" })).toBe(false)
    expect(validation.Check({ Флаг: "!xml/value Ложь" })).toBe(true)
    expect(validation.Check({ Флаг: "!xml/reference Ложь" })).toBe(false)
    expect(JSON.stringify(externalProperties)).not.toContain("!xml")
  })
})
