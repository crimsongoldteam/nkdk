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

export const fixtureFieldPath = "Реквизит1"

export const fixtureBooleanPrimitive: MetadataTypedPrimitiveValue = {
  type: "boolean",
  value: true,
}

export const fixtureLocalStringI8n: I8nText = {
  items: {
    ru: "ЧЦ=3; ЧДЦ=2",
  },
}

export const fixtureHorizontalAlign = "Center"

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
export const yamlBooleanPrimitive: MetadataValueYAML = "Истина"
export const yamlLocalStringI8n: I8nTextYAML = "ЧЦ=3; ЧДЦ=2"
export const yamlHorizontalAlign = "Центр" as const
export const yamlFontStyleExtraLarge: FontYAML = "ОченьКрупныйШрифтТекста"
export const yamlTypeLink: TypeLinkYAML = "Поле1(2)"
export const yamlChoiceParameterLinks: ChoiceParameterLinksYAML = "ПараметрВыбора(Поле1, НеИзменять)"
export const yamlChoiceParameterDecimal: ChoiceParametersYAML = {
  Параметр: 123,
}

const xmlColor = `<dcscor:value xsi:type="v8ui:Color">web:Red</dcscor:value>`
const xmlField = `<dcscor:value xsi:type="dcscor:Field">Реквизит1</dcscor:value>`
const xmlBoolean = `<dcscor:value xsi:type="xs:boolean">true</dcscor:value>`
const xmlLocalStringType = `<dcscor:value xsi:type="v8:LocalStringType">
    <v8:item>
        <v8:lang>ru</v8:lang>
        <v8:content>ЧЦ=3; ЧДЦ=2</v8:content>
    </v8:item>
</dcscor:value>`
const xmlHorizontalAlign = `<dcscor:value xsi:type="v8ui:HorizontalAlign">Center</dcscor:value>`
const xmlFont = `<dcscor:value xsi:type="v8ui:Font" ref="style:ExtraLargeTextFont" kind="StyleItem"/>`
const xmlTypeLink = `<dcscor:value xsi:type="dcscor:TypeLink">
    <dcscor:field>Поле1</dcscor:field>
    <dcscor:linkItem>2</dcscor:linkItem>
</dcscor:value>`
const xmlChoiceParameterLinks = `<dcscor:value xsi:type="dcscor:ChoiceParameterLinks">
    <dcscor:item>
        <dcscor:choiceParameter>ПараметрВыбора</dcscor:choiceParameter>
        <dcscor:value>Поле1</dcscor:value>
        <dcscor:mode xsi:type="ent:LinkedValueChangeMode">DontChange</dcscor:mode>
    </dcscor:item>
</dcscor:value>`
const xmlChoiceParameter = `<dcscor:value xsi:type="dcscor:ChoiceParameters">
	<dcscor:item>
		<dcscor:choiceParameter>Параметр</dcscor:choiceParameter>
		<dcscor:value xsi:type="xs:decimal">123</dcscor:value>
	</dcscor:item>
</dcscor:value>`

export type DcsMetadataValueFixture = {
  id: string
  title: string
  rule: DcsMetadataValuePropertyRule
  value: MetadataDcsMetadataValue
  yaml: MetadataDcsMetadataValueYAML
  xml: string
}

export const dcsMetadataValueFixtures: DcsMetadataValueFixture[] = [
  {
    id: "color",
    title: "Color",
    rule: { type: "MetadataDcsMetadataValue", valueType: "Color", yaml: "value" },
    value: fixtureColorWebRed,
    yaml: yamlColorWebRed,
    xml: xmlColor,
  },
  {
    id: "field",
    title: "Field",
    rule: { type: "MetadataDcsMetadataValue", valueType: "Field", yaml: "value" },
    value: fixtureFieldPath,
    yaml: yamlFieldPath,
    xml: xmlField,
  },
  {
    id: "primitiveBoolean",
    title: "Primitive boolean",
    rule: { type: "MetadataDcsMetadataValue", valueType: "Primitive", yaml: "value" },
    value: fixtureBooleanPrimitive,
    yaml: yamlBooleanPrimitive,
    xml: xmlBoolean,
  },
  {
    id: "designTimeValue",
    title: "DesignTimeValue (LocalStringType)",
    rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
    value: fixtureLocalStringI8n,
    yaml: yamlLocalStringI8n,
    xml: xmlLocalStringType,
  },
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
    xml: xmlHorizontalAlign,
  },
  {
    id: "font",
    title: "Font",
    rule: { type: "MetadataDcsMetadataValue", valueType: "Font", yaml: "value" },
    value: fixtureFontStyleExtraLarge,
    yaml: yamlFontStyleExtraLarge,
    xml: xmlFont,
  },
  {
    id: "typeLink",
    title: "TypeLink",
    rule: { type: "MetadataDcsMetadataValue", valueType: "TypeLink", yaml: "value" },
    value: fixtureTypeLink,
    yaml: yamlTypeLink,
    xml: xmlTypeLink,
  },
  {
    id: "choiceParameterLinks",
    title: "ChoiceParameterLinks",
    rule: { type: "MetadataDcsMetadataValue", valueType: "ChoiceParameterLinks", yaml: "value" },
    value: fixtureChoiceParameterLinks,
    yaml: yamlChoiceParameterLinks,
    xml: xmlChoiceParameterLinks,
  },
  {
    id: "parameter",
    title: "Parameter",
    rule: { type: "MetadataDcsMetadataValue", valueType: "Parameter", yaml: "value" },
    value: fixtureChoiceParameterDecimal,
    yaml: yamlChoiceParameterDecimal,
    xml: xmlChoiceParameter,
  },
]
