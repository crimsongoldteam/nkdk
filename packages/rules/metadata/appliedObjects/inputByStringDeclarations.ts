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
    metadataTarget: {
      kind: "member",
      owner: "this",
      memberKinds: ["Attribute", "StandardAttribute"],
      filters: [{ kind: "inputByStringField" }],
    },
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
