import { metadataCommandGroupRule } from "../../commonObjects/metadataCommandGroup/types"
import { pictureRule } from "../../commonObjects/picture/types"
import { typeDescriptionRule } from "../../commonObjects/typeDescription/types"
import { booleanRule } from "../../commonObjects/boolean/types"
import { i8nTextRule } from "../../commonObjects/i8nText/types"
import { moduleRule } from "../../commonObjects/module/types"
import { stringRule } from "../../commonObjects/string/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { uuidPropertyRule } from "../../commonObjects/uuid/rule"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
export const MetadataCommandRules = {
  itemType: "MetadataCommand",
  externalMetadata: { segment: "Command", placement: "ownerChild" },
  xmlOrder: [
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "group",
    "commandParameterType",
    "parameterUseMode",
    "modifiesData",
    "representation",
    "toolTip",
    "picture",
    "shortcut",
    "onMainServerUnavalableBehavior",
    "uuid",
  ],
  properties: {
    uuid: uuidPropertyRule,
    name: stringRule({
      xml: "Name",
      required: true,
      xmlParents: ["Properties"],
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xml: "Synonym",
      excludeIfEqualNameYAML: true,
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xml: "Comment",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
      defaultValueAdoptedXML: "",
    }),
    group: metadataCommandGroupRule({
      yaml: "Группа",
      xml: "Group",
      xmlParents: ["Properties"],
    }),
    commandParameterType: typeDescriptionRule({
      yaml: "ТипПараметраКоманды",
      xml: "CommandParameterType",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    }),
    parameterUseMode: systemEnumerationRule({
      yaml: "РежимИспользованияПараметра",
      xml: "ParameterUseMode",
      typeSE: "CommandParameterUseMode",
      xmlParents: ["Properties"],
      defaultValueXML: "Single",
      implicitValueYAML: "Single",
    }),
    modifiesData: booleanRule({
      yaml: "ИзменяетДанные",
      xml: "ModifiesData",
      xmlParents: ["Properties"],
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    representation: systemEnumerationRule({
      yaml: "Отображение",
      xml: "Representation",
      typeSE: "ButtonRepresentation",
      implicitValueYAML: "Auto",
      defaultValueXML: "Auto",
      xmlParents: ["Properties"],
    }),
    toolTip: i8nTextRule({
      yaml: "Подсказка",
      xml: "ToolTip",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    }),
    picture: pictureRule({
      yaml: "Картинка",
      xml: "Picture",
      metadataTarget: { kind: "object", roots: ["CommonPicture"] },
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    }),
    shortcut: stringRule({
      yaml: "СочетаниеКлавиш",
      xml: "Shortcut",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    }),
    onMainServerUnavalableBehavior: systemEnumerationRule({
      yaml: "ПоведениеПриНедоступностиОсновногоСервера",
      xml: "OnMainServerUnavalableBehavior",
      typeSE: "OnMainServerUnavalableBehavior",
      implicitValueYAML: "Auto",
      defaultValueXML: "Auto",
      xmlParents: ["Properties"],
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      typeSE: "ObjectBelonging",
      implicitValueYAML: "Native",
      toYAML: false,
      fromYAML: false,
      xmlParents: ["Properties"],
    }),
    commandModule: moduleRule({
      externalMetadata: { segment: "CommandModule", placement: "derivedEntry" },
      nkdkPath: ({ name }: { name: string }) => "Команды/" + name + ".bsl",
      xmlPath: ({ name }: { name: string }) => "Commands/" + name + "/Ext/CommandModule.bsl",
      toXML: false,
      fromXML: false,
    }),
  },
} as const satisfies MetadataItemRule
