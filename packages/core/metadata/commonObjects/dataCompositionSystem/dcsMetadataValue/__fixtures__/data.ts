import type { Color, ColorYAML } from "~/metadata/commonObjects/color/types"
import type { Font, FontYAML } from "~/metadata/commonObjects/font/types"
import type { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import type { MetadataFieldYAML } from "~/metadata/commonObjects/metadataField/types"
import type { MetadataTypedPrimitiveValue, MetadataValueYAML } from "~/metadata/commonObjects/metadataValue/types"
import type { TypeLink, TypeLinkYAML } from "~/metadata/commonObjects/typeLink/types"
import type {
  ChoiceParameterLinks,
  ChoiceParameterLinksYAML,
} from "~/metadata/commonObjects/сhoiceParameterLinks/types"
import type { ChoiceParameter, ChoiceParametersYAML } from "~/metadata/commonObjects/сhoiceParameters/types"
import type { DcsMetadataValuePropertyRule, MetadataDcsMetadataValue, MetadataDcsMetadataValueYAML } from "../types"

export const fixtureColorWebRed: Color = {
  type: "WebColor",
  value: "Red",
}

export const fixtureColorRawRef: Color = {
  rawRef: "0:615512b6-4378-4fce-86f1-a56725f945da",
}

export const fixtureFieldPath = "Реквизит1"
export const fixtureDesignTimeRefPath = "Перечисление.СтраницыЖурналаОтчетность.ЕГРЮЛ"
export const fixtureDesignTimeFieldPath = "Сертификаты.СертификатПредставление"

export const fixtureBooleanPrimitive: MetadataTypedPrimitiveValue = {
  type: "boolean",
  value: true,
}

export const fixtureTypeRefPrimitive: MetadataTypedPrimitiveValue = {
  type: "typeRef",
  value: "d6p1:Undefined",
}

export const fixtureUuidPrimitive: MetadataTypedPrimitiveValue = {
  type: "uuid",
  value: "00000000-0000-0000-0000-000000000000",
}

export const fixtureLocalStringI8n: I8nText = {
  items: {
    ru: "ЧЦ=3; ЧДЦ=2",
  },
}

export const fixtureHorizontalAlign = "Center"

export const fixtureAccumulationRecordType = {
  type: "SystemEnumeration",
  typeSE: "AccumulationRecordType",
  value: "Expense",
} as const

export const fixtureFontStyleExtraLarge: Font = {
  kind: "StyleItem",
  ref: "ExtraLargeTextFont",
}

export const fixtureTypeLink: TypeLink = {
  dataPath: "Поле1",
  linkItem: 2,
}

export const fixtureChoiceParameterLinks: ChoiceParameterLinks = [
  {
    name: "ПараметрВыбора",
    dataPath: "Поле1",
    valueChange: "DontChange",
  },
]

/** Соответствует `choiceParameter.xml` (как в choiceParameters `dcs/full.xml`). */
export const fixtureChoiceParameterDecimal: ChoiceParameter = {
  name: "Параметр",
  value: {
    type: "decimal",
    value: 123,
  },
}

export const yamlColorWebRed: ColorYAML = "Красный"
export const yamlFieldPath: MetadataFieldYAML = "Реквизит1"
export const yamlDesignTimeFieldExplicit = {
  Тип: "Поле",
  Значение: fixtureDesignTimeFieldPath,
} as const
export const yamlBooleanPrimitive: MetadataValueYAML = "Истина"
export const yamlLocalStringI8n = {
  Тип: "МногоязычнаяСтрока",
  Значение: "ЧЦ=3; ЧДЦ=2",
} as const
export const yamlHorizontalAlign = "Центр" as const
export const yamlFontStyleExtraLarge: FontYAML = { Вид: "ОченьКрупныйШрифтТекста" }
export const yamlTypeLink: TypeLinkYAML = "Поле1(2)"
export const yamlChoiceParameterLinks: ChoiceParameterLinksYAML = [
  {
    Имя: "ПараметрВыбора",
    ПутьКДанным: "Поле1",
    РежимИзменения: "НеИзменять",
  },
]
export const yamlChoiceParameterDecimal: ChoiceParametersYAML = {
  Параметр: 123,
}

export type DcsMetadataValueFixture = {
  id: string
  title: string
  rule: DcsMetadataValuePropertyRule
  value: MetadataDcsMetadataValue | undefined
  yaml: MetadataDcsMetadataValueYAML | undefined
  xml: string
}

export type DcsMetadataValueYAMLFixture = Omit<DcsMetadataValueFixture, "xml">

const primitiveTypeRefFixture: DcsMetadataValueFixture = {
  id: "primitiveTypeRef",
  title: "Primitive typeRef",
  rule: { type: "MetadataDcsMetadataValue", valueType: "Primitive", yaml: "value" },
  value: fixtureTypeRefPrimitive,
  yaml: "d6p1:Undefined",
  xml: "primitive-type-ref.xml",
}

const designTimeRefUnderFieldDefaultFixture: DcsMetadataValueFixture = {
  id: "designTimeRefUnderFieldDefault",
  title: "DesignTimeValue under Field default",
  rule: { type: "MetadataDcsMetadataValue", valueType: "Field", yaml: "value" },
  value: {
    type: "DesignTimeValue",
    value: fixtureDesignTimeRefPath,
  },
  yaml: fixtureDesignTimeRefPath,
  xml: "design-time-ref.xml",
}

const designTimeFieldFixture: DcsMetadataValueFixture = {
  id: "designTimeField",
  title: "DesignTimeValue explicit Field",
  rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
  value: {
    type: "Field",
    value: fixtureDesignTimeFieldPath,
  },
  yaml: yamlDesignTimeFieldExplicit,
  xml: "design-time-field.xml",
}

const primitiveUuidFixture: DcsMetadataValueFixture = {
  id: "primitiveUuid",
  title: "Primitive UUID",
  rule: { type: "MetadataDcsMetadataValue", valueType: "Primitive", yaml: "value" },
  value: fixtureUuidPrimitive,
  yaml: "00000000-0000-0000-0000-000000000000",
  xml: "primitive-uuid.xml",
}

const emptyLocalStringFixture: DcsMetadataValueFixture = {
  id: "emptyLocalString",
  title: "DesignTimeValue (empty LocalStringType)",
  rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
  value: { items: {} },
  yaml: undefined,
  xml: "empty-local-string.xml",
}

const nilFixture: DcsMetadataValueFixture = {
  id: "nil",
  title: "nil value",
  rule: { type: "MetadataDcsMetadataValue", valueType: "Primitive", exportNilValue: true, yaml: "value" },
  value: undefined,
  yaml: undefined,
  xml: "nil.xml",
}

const inferredAccumulationRecordTypeFixture: DcsMetadataValueFixture = {
  id: "systemEnumerationAccumulationRecordTypeInferred",
  title: "SystemEnumeration inferred from ent:AccumulationRecordType",
  rule: { type: "MetadataDcsMetadataValue", valueType: "Primitive", yaml: "value" },
  value: fixtureAccumulationRecordType,
  yaml: {
    Тип: "СистемноеПеречисление",
    Имя: "AccumulationRecordType",
    Значение: "Расход",
  },
  xml: "system-enumeration-accumulation-record-type.xml",
}

const colorRawRefFixture: DcsMetadataValueFixture = {
  id: "colorRawRef",
  title: "Color raw XML ref",
  rule: { type: "MetadataDcsMetadataValue", valueType: "Color", yaml: "value" },
  value: fixtureColorRawRef,
  yaml: undefined,
  xml: "color-raw-ref.xml",
}

const fieldRuleDecimalFixture: DcsMetadataValueYAMLFixture = {
  id: "fieldRuleDecimal",
  title: "Field rule with decimal typed value",
  rule: { type: "MetadataDcsMetadataValue", valueType: "Field", yaml: "value" },
  value: {
    type: "decimal",
    value: 0,
  },
  yaml: 0,
}

const fieldRuleInferredSystemEnumerationFixture: DcsMetadataValueYAMLFixture = {
  id: "fieldRuleInferredSystemEnumeration",
  title: "Field rule with inferred system enumeration typed value",
  rule: { type: "MetadataDcsMetadataValue", valueType: "Field", yaml: "value" },
  value: fixtureAccumulationRecordType,
  yaml: {
    Тип: "СистемноеПеречисление",
    Имя: "AccumulationRecordType",
    Значение: "Расход",
  },
}

export const dcsMetadataValueFixtures: DcsMetadataValueFixture[] = [
  {
    id: "color",
    title: "Color",
    rule: { type: "MetadataDcsMetadataValue", valueType: "Color", yaml: "value" },
    value: fixtureColorWebRed,
    yaml: yamlColorWebRed,
    xml: "color.xml",
  },
  {
    id: "field",
    title: "Field",
    rule: { type: "MetadataDcsMetadataValue", valueType: "Field", yaml: "value" },
    value: fixtureFieldPath,
    yaml: yamlFieldPath,
    xml: "field.xml",
  },
  designTimeRefUnderFieldDefaultFixture,
  {
    id: "primitiveBoolean",
    title: "Primitive boolean",
    rule: { type: "MetadataDcsMetadataValue", valueType: "Primitive", yaml: "value" },
    value: fixtureBooleanPrimitive,
    yaml: yamlBooleanPrimitive,
    xml: "primitive-boolean.xml",
  },
  {
    id: "designTimeValue",
    title: "DesignTimeValue (LocalStringType)",
    rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
    value: fixtureLocalStringI8n,
    yaml: yamlLocalStringI8n,
    xml: "design-time-value.xml",
  },
  designTimeFieldFixture,
  {
    id: "systemEnumerationHorizontalAlign",
    title: "SystemEnumeration (HorizontalAlign)",
    rule: {
      type: "MetadataDcsMetadataValue",
      valueType: "SystemEnumeration",
      typeSE: "HorizontalAlign",
      yaml: "value",
    },
    value: fixtureHorizontalAlign,
    yaml: yamlHorizontalAlign,
    xml: "system-enumeration-horizontal-align.xml",
  },
  {
    id: "font",
    title: "Font",
    rule: { type: "MetadataDcsMetadataValue", valueType: "Font", yaml: "value" },
    value: fixtureFontStyleExtraLarge,
    yaml: yamlFontStyleExtraLarge,
    xml: "font.xml",
  },
  {
    id: "typeLink",
    title: "TypeLink",
    rule: { type: "MetadataDcsMetadataValue", valueType: "TypeLink", yaml: "value" },
    value: fixtureTypeLink,
    yaml: yamlTypeLink,
    xml: "type-link.xml",
  },
  {
    id: "choiceParameterLinks",
    title: "ChoiceParameterLinks",
    rule: { type: "MetadataDcsMetadataValue", valueType: "ChoiceParameterLinks", yaml: "value" },
    value: fixtureChoiceParameterLinks,
    yaml: yamlChoiceParameterLinks,
    xml: "choice-parameter-links.xml",
  },
  {
    id: "parameter",
    title: "Parameter",
    rule: { type: "MetadataDcsMetadataValue", valueType: "Parameter", yaml: "value" },
    value: fixtureChoiceParameterDecimal,
    yaml: yamlChoiceParameterDecimal,
    xml: "parameter.xml",
  },
]

export const dcsMetadataValueYAMLFixtures: DcsMetadataValueYAMLFixture[] = [
  ...dcsMetadataValueFixtures,
  inferredAccumulationRecordTypeFixture,
  fieldRuleDecimalFixture,
  fieldRuleInferredSystemEnumerationFixture,
]

export const dcsMetadataValueXMLFixtures: DcsMetadataValueFixture[] = [
  ...dcsMetadataValueFixtures,
  colorRawRefFixture,
  emptyLocalStringFixture,
  nilFixture,
  primitiveTypeRefFixture,
  primitiveUuidFixture,
  inferredAccumulationRecordTypeFixture,
]

export const dcsMetadataValueFromXMLFixtures: DcsMetadataValueFixture[] = dcsMetadataValueXMLFixtures
