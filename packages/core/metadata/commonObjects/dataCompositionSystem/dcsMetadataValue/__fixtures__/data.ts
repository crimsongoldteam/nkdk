import type { ChoiceParameter, ChoiceParametersYAML } from "~/metadata/commonObjects/сhoiceParameters/types"
import type { ChoiceParameterLinks, ChoiceParameterLinksYAML } from "~/metadata/commonObjects/сhoiceParameterLinks/types"
import type { Color, ColorYAML } from "~/metadata/commonObjects/color/types"
import type { Font, FontYAML } from "~/metadata/commonObjects/font/types"
import type { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import type { MetadataFieldYAML } from "~/metadata/commonObjects/metadataField/types"
import type { MetadataTypedPrimitiveValue, MetadataValueYAML } from "~/metadata/commonObjects/metadataValue/types"
import type { TypeLink, TypeLinkYAML } from "~/metadata/commonObjects/typeLink/types"

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

//#region YAML (те же смыслы, что и XML-фикстуры рядом: color.xml, field.xml, …)

/** `color.xml` — внутреннее значение `fixtureColorWebRed`. */
export const yamlColorWebRed: ColorYAML = "Красный"

/** `field.xml` — `fixtureFieldPath`. */
export const yamlFieldPath: MetadataFieldYAML = "Реквизит1"

/** `boolean.xml` — `fixtureBooleanPrimitive`. */
export const yamlBooleanPrimitive: MetadataValueYAML = "Истина"

/** `localStringType.xml` — компактная строка для одной локали (`fixtureLocalStringI8n`). */
export const yamlLocalStringI8n: I8nTextYAML = "ЧЦ=3; ЧДЦ=2"

/** `horizontalAlign.xml` — `fixtureHorizontalAlign` при `typeSE: "HorizontalAlign"`. */
export const yamlHorizontalAlign = "Центр" as const

/** `font.xml` — `fixtureFontStyleExtraLarge`. */
export const yamlFontStyleExtraLarge: FontYAML = "ОченьКрупныйШрифтТекста"

/** `typeLink.xml` — `fixtureTypeLink`. */
export const yamlTypeLink: TypeLinkYAML = "Поле1(2)"

/** `choiceParameterLinks.xml` — `fixtureChoiceParameterLinks`. */
export const yamlChoiceParameterLinks: ChoiceParameterLinksYAML = "ПараметрВыбора(Поле1, НеИзменять)"

/** `choiceParameter.xml` — `fixtureChoiceParameterDecimal`. */
export const yamlChoiceParameterDecimal: ChoiceParametersYAML = {
  Параметр: 123,
}

//#endregion
