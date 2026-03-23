import type { Color, ColorYAML } from "~/metadata/commonObjects/color/types"
import type { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import type {
  ChoiceParameterLinks,
  ChoiceParameterLinksYAML,
} from "~/metadata/commonObjects/сhoiceParameterLinks/types"
import type { ChoiceParameter, ChoiceParametersYAML } from "~/metadata/commonObjects/сhoiceParameters/types"
import { fixtureTypeLink } from "../../dcsMetadataValue/__fixtures__/data"
import type { ParameterValue, SettingsParameterValue } from "../types"

export const fixtureColorWebRed: Color = {
  type: "WebColor",
  value: "Red",
}

export const fixtureColorWebRedYAML: ColorYAML = "Красный"

export const fixtureFormatLocalString: I8nText = {
  items: {
    ru: "ЧЦ=3; ЧДЦ=2",
  },
}

export const fixtureFormatLocalStringYAML: I8nTextYAML = "ЧЦ=3; ЧДЦ=2"

export const fixtureChoiceParameterDecimal: ChoiceParameter = {
  name: "Параметр",
  value: {
    type: "decimal",
    value: 123,
  },
}

export const fixtureChoiceParameterDecimalYAML: ChoiceParametersYAML = {
  Параметр: 123,
}

export const fixtureChoiceParameterLinks: ChoiceParameterLinks = [
  {
    name: "ПараметрВыбора",
    dataPath: "Поле1",
    valueChange: "DontChange",
  },
]

export const fixtureChoiceParameterLinksYAML: ChoiceParameterLinksYAML = "ПараметрВыбора(Поле1, НеИзменять)"

/** `full.xml` — `dcsset:SettingsParameterValue`, LocalStringType. */
export const fixtureFullSettingsParameter: SettingsParameterValue = {
  parameter: "Формат",
  value: fixtureFormatLocalString,
}

/** `useFalse.xml` */
export const fixtureUseFalseColor: SettingsParameterValue = {
  use: false,
  parameter: "ЦветФона",
  value: fixtureColorWebRed,
}

/** `typeLink.xml` — базовый `dcscor:item` без `xsi:type`. */
export const fixtureTypeLinkParameter: ParameterValue = {
  parameter: "СвязьПоТипу",
  value: fixtureTypeLink,
}

/** `choiceParameters.xml` — `importChoiceParameterFromDcsXML` возвращает первый `dcscor:item`. */
export const fixtureChoiceParametersRoot: ParameterValue = {
  parameter: "ПараметрыВыбора",
  value: fixtureChoiceParameterDecimal,
}

/** `choiceParameterLinks.xml` */
export const fixtureChoiceParameterLinksRoot: ParameterValue = {
  parameter: "СвязиПараметровВыбора",
  value: fixtureChoiceParameterLinks,
}

/** `systemEnumeration.xml` — `ent:FoldersAndItemsUse`. */
export const fixtureFoldersAndItemsRoot: ParameterValue = {
  parameter: "ВыборГруппИЭлементов",
  value: "Items",
}

/** `fewValues.xml` — два `v8:LocalStringType` (как при экспорте DesignTimeValue). */
export const fixtureFewDesignTimeValues: SettingsParameterValue = {
  use: false,
  parameter: "ИмяПараметра",
  value: [
    { items: { ru: "Перечисление.ИмяПеречисления.Значение1" } },
    { items: { ru: "Перечисление.ИмяПеречисления.Значение2" } },
  ],
}
