import { minMaxValueRule } from "../minMaxValue/types"
import { typeDescriptionRule } from "../typeDescription/types"
import { typeLinkRule } from "../typeLink/types"
import { choiceParameterLinksRule } from "../\u0441hoiceParameterLinks/types"
import { choiceParametersRule } from "../\u0441hoiceParameters/types"
import { booleanRule } from "../boolean/types"
import { i8nTextRule } from "../i8nText/types"
import { metadataValueRule } from "../metadataValue/types"
import { stringRule } from "../string/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { StandartAttributeNameFromYAML } from "./standartAttributeNames"
import { getDataPathOwnerKindByItemType } from "../../validation/dataPath/registry"
import { getStandardMembers } from "../../standardMembers/declarations"
import { implicitStandardMemberFillValue } from "../fillValue/effectiveType"
import type { ConfigurationContext } from "@nkdk/runtime"
export const StandardAttributeDescriptionRules = {
  itemType: "StandardAttributeDescription",
  xmlOrder: [
    "linkByType",
    "fillChecking",
    "multiLine",
    "fillFromFillingValue",
    "createOnInput",
    "typeReductionMode",
    "maxValue",
    "toolTip",
    "extendedEdit",
    "format",
    "choiceForm",
    "quickChoice",
    "choiceHistoryOnInput",
    "editFormat",
    "passwordMode",
    "dataHistory",
    "markNegatives",
    "minValue",
    "synonym",
    "comment",
    "fullTextSearch",
    "choiceParameterLinks",
    "fillValue",
    "mask",
    "choiceParameters",
    "name",
  ],
  properties: {
    name: stringRule({
      xml: "_name",
      defaultValue: ({ name }: { name?: string }) => (name ? StandartAttributeNameFromYAML(name) : undefined),
    }),
    choiceForm: stringRule({
      yaml: "ФормаВыбора",
      xml: "xr:ChoiceForm",
      metadataTarget: { kind: "member", owner: "explicit", memberKinds: ["Form"] },
      defaultValueXMLRaw: "",
    }),
    choiceHistoryOnInput: systemEnumerationRule({
      yaml: "ИсторияВыбораПриВводе",
      xml: "xr:ChoiceHistoryOnInput",
      typeSE: "ChoiceHistoryOnInput",
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
    }),
    choiceParameterLinks: choiceParameterLinksRule({
      yaml: "СвязиПараметровВыбора",
      xml: "xr:ChoiceParameterLinks",
      defaultValueXMLRaw: "",
    }),
    choiceParameters: choiceParametersRule({
      yaml: "ПараметрыВыбора",
      xml: "xr:ChoiceParameters",
      defaultValueXMLRaw: "",
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xml: "xr:Comment",
      defaultValueXMLRaw: "",
      defaultValueAdoptedXML: "",
    }),
    createOnInput: systemEnumerationRule({
      yaml: "СозданиеПриВводе",
      xml: "xr:CreateOnInput",
      typeSE: "CreateOnInput",
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
    }),
    dataHistory: systemEnumerationRule({
      yaml: "ИсторияДанных",
      xml: "xr:DataHistory",
      typeSE: "DataHistoryUse",
      defaultValueXML: "Use",
      implicitValueYAML: "Use",
    }),
    editFormat: i8nTextRule({
      yaml: "ФорматРедактирования",
      xml: "xr:EditFormat",
      defaultValueXMLRaw: "",
    }),
    extendedEdit: booleanRule({
      yaml: "РасширенноеРедактирование",
      xml: "xr:ExtendedEdit",
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    fillChecking: systemEnumerationRule({
      yaml: "ПроверкаЗаполнения",
      xml: "xr:FillChecking",
      typeSE: "FillChecking",
      defaultValueXML: "DontCheck",
      implicitValueYAML: "DontCheck",
    }),
    fillFromFillingValue: booleanRule({
      yaml: "ЗаполнятьИзДанныхЗаполнения",
      xml: "xr:FillFromFillingValue",
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    fillValue: metadataValueRule({
      yaml: "ЗначениеЗаполнения",
      xml: "xr:FillValue",
      defaultValue: ({ context, name }: { context: ConfigurationContext; name?: string }) =>
        implicitFillValueForStandardMember(context, name),
      defaultValueXMLRaw: { "_xsi:nil": true },
      exportNilValue: true,
      preserveUnknownReferenceXML: false,
    }),
    format: i8nTextRule({
      yaml: "Формат",
      xml: "xr:Format",
      defaultValueXMLRaw: "",
    }),
    fullTextSearch: systemEnumerationRule({
      yaml: "ПолнотекстовыйПоиск",
      xml: "xr:FullTextSearch",
      typeSE: "UseFullTextSearch",
      defaultValueXML: "Use",
      implicitValueYAML: "Use",
    }),
    linkByType: typeLinkRule({
      yaml: "СвязьПоТипу",
      xml: "xr:LinkByType",
      defaultValueXMLRaw: "",
    }),
    markNegatives: booleanRule({
      yaml: "ВыделятьОтрицательные",
      xml: "xr:MarkNegatives",
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    mask: stringRule({
      yaml: "Маска",
      xml: "xr:Mask",
      defaultValueXMLRaw: "",
    }),
    maxValue: minMaxValueRule({
      yaml: "МаксимальноеЗначение",
      xml: "xr:MaxValue",
      defaultValueXMLRaw: { "_xsi:nil": true },
    }),
    minValue: minMaxValueRule({
      yaml: "МинимальноеЗначение",
      xml: "xr:MinValue",
      defaultValueXMLRaw: { "_xsi:nil": true },
    }),
    multiLine: booleanRule({
      yaml: "МногострочныйРежим",
      xml: "xr:MultiLine",
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    passwordMode: booleanRule({
      yaml: "РежимПароля",
      xml: "xr:PasswordMode",
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    quickChoice: systemEnumerationRule({
      yaml: "БыстрыйВыбор",
      xml: "xr:QuickChoice",
      typeSE: "UseQuickChoice",
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xml: "xr:Synonym",
      defaultValueXMLRaw: "",
      implicitValueYAML: "",
    }),
    toolTip: i8nTextRule({
      yaml: "Подсказка",
      xml: "xr:ToolTip",
      defaultValueXMLRaw: "",
    }),
    type: typeDescriptionRule({
      yaml: "Тип",
      xml: "xr:Type",
    }),
    typeReductionMode: systemEnumerationRule({
      yaml: "РежимСокращенияТипа",
      xml: "xr:TypeReductionMode",
      typeSE: "TypeReductionMode",
      defaultValueXML: "TransformValues",
      implicitValueYAML: "TransformValues",
    }),
  },
} as const satisfies MetadataItemRule

function implicitFillValueForStandardMember(
  context: ConfigurationContext,
  internalName: string | undefined,
) {
  const member = standardMemberContext(context, internalName)
  if (member === undefined) return undefined
  if (
    context.exportToXML?.componentKind === "configurationExtension"
    && member.declaration.fillValue?.policy === "ownerReference"
  ) return undefined
  const owner = context.importFromYAML?.ownerMetadataCache?.get({
    kind: member.ownerKind,
    name: member.ownerName,
  })
  if (owner?.status !== "ok") return undefined
  return implicitStandardMemberFillValue({
    declaration: member.declaration,
    ownerProperties: { ...owner.owner.facts },
  })
}

function standardMemberContext(
  context: ConfigurationContext,
  internalName: string | undefined,
) {
  if (internalName === undefined) return undefined
  const ownerContexts = context.importFromYAML?.metadataTargetOwners ?? []
  for (let index = ownerContexts.length - 1; index >= 0; index -= 1) {
    const ownerContext = ownerContexts[index]!
    const ownerKind = getDataPathOwnerKindByItemType(ownerContext.itemType)
    if (ownerKind === undefined) continue
    const declaration = getStandardMembers(ownerKind.kind).find(
      ({ names }) => names.internal === internalName,
    )
    if (declaration === undefined) return undefined
    return {
      declaration,
      ownerKind: ownerKind.kind,
      ownerName: ownerContext.name,
    }
  }
  return undefined
}
