import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { resolveXMLDefaultVariant, type YAMLPropertySource } from "@nkdk/runtime/rule-kit"
import type { InputByStringStandardField } from "../commonObjects/inputByStringFields/types"
import { inputByStringFieldsRule } from "../commonObjects/inputByStringFields/types"
import { booleanRule } from "../commonObjects/boolean/types"
import { systemEnumerationRule } from "../systemEnumerations/types"

export const NUMERIC_LENGTH_HINT = "При значении Число максимальная длина — 38."

export function inputByStringStandardField(
  name: "Код" | "Наименование" | "Номер",
  propertyKey: string,
  lengthYAML: string,
  implicitValue: number
): InputByStringStandardField {
  return {
    yaml: `СтандартныйРеквизит.${name}`,
    length: { propertyKey, yaml: lengthYAML, implicitValue },
  }
}

export function appliedObjectInputByStringRule(params: {
  xmlParents: string[]
  standardFields: readonly InputByStringStandardField[]
  defaultValue?: []
  defaultValueXMLRaw?: {}
}) {
  return inputByStringFieldsRule({
    yaml: "ВводПоСтроке",
    description: `Поля, пригодные для ввода по строке. Стандартное значение: ${params.standardFields
      .map(({ yaml }) => yaml)
      .join(", ")}. Нулевая длина исключает стандартное поле. Порядок полей значим. `
      + "Полный вычисляемый список нельзя задавать явно.",
    metadataTarget: {
      kind: "member",
      owner: "this",
      memberKinds: ["Attribute", "StandardAttribute"],
      filters: [{ kind: "inputByStringField" }],
    },
    toXML: (source: YAMLPropertySource, context?: ConfigurationContextWithExportToXML) =>
      source.has("inputByString") ||
      context === undefined ||
      resolveXMLDefaultVariant(context) !== "adopted",
    ...params,
  })
}

export function commonInputChoiceRules(xmlParents: string[]) {
  return {
    editType: systemEnumerationRule({
      yaml: "СпособРедактирования",
      typeSE: "EditType",
      defaultValueXML: "InDialog",
      implicitValueYAML: "InDialog",
      xmlParents,
    }),
    quickChoice: booleanRule({
      yaml: "БыстрыйВыбор",
      defaultValueXML: false,
      implicitValueYAML: false,
      xmlParents,
    }),
    choiceMode: systemEnumerationRule({
      yaml: "РежимВыбора",
      typeSE: "ChoiceMode",
      defaultValueXML: "BothWays",
      implicitValueYAML: "BothWays",
      xmlParents,
    }),
  }
}
