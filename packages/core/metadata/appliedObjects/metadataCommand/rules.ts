import { metadataCommandGroupRule } from "~/metadata/commonObjects/metadataCommandGroup/types"
import { pictureRule } from "~/metadata/commonObjects/metadataTargets/types"
import { typeDescriptionRule } from "~/metadata/commonObjects/typeDescription/types"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { moduleRule } from "~/metadata/commonObjects/module/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
export const MetadataCommandRules = {
  itemType: "MetadataCommand",
  externalMetadata: { segment: "Command", placement: "ownerChild" },
  properties: {
    uuid: uuidPropertyRule,
    name: stringRule({
      xml: "Name",
      required: true,
      xmlParents: ["Properties"],
      order: 1,
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xml: "Synonym",
      excludeIfEqualNameYAML: true,
      xmlParents: ["Properties"],
      order: 2,
      defaultValueXMLRaw: "",
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xml: "Comment",
      xmlParents: ["Properties"],
      order: 3,
      defaultValueXMLRaw: "",
    }),
    group: metadataCommandGroupRule({
      yaml: "Группа",
      xml: "Group",
      xmlParents: ["Properties"],
      order: 4,
    }),
    commandParameterType: typeDescriptionRule({
      yaml: "ТипПараметраКоманды",
      xml: "CommandParameterType",
      xmlParents: ["Properties"],
      order: 5,
      defaultValueXMLRaw: "",
    }),
    parameterUseMode: systemEnumerationRule({
      yaml: "РежимИспользованияПараметра",
      xml: "ParameterUseMode",
      typeSE: "CommandParameterUseMode",
      xmlParents: ["Properties"],
      order: 6,
      defaultValueXML: "Single",
      implicitValueYAML: "Single",
    }),
    modifiesData: booleanRule({
      yaml: "ИзменяетДанные",
      xml: "ModifiesData",
      xmlParents: ["Properties"],
      order: 7,
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
      order: 8,
    }),
    toolTip: i8nTextRule({
      yaml: "Подсказка",
      xml: "ToolTip",
      xmlParents: ["Properties"],
      order: 9,
      defaultValueXMLRaw: "",
    }),
    picture: pictureRule({
      yaml: "Картинка",
      xml: "Picture",
      metadataTarget: { kind: "object", roots: ["CommonPicture"] },
      xmlParents: ["Properties"],
      order: 10,
      defaultValueXMLRaw: "",
    }),
    shortcut: stringRule({
      yaml: "СочетаниеКлавиш",
      xml: "Shortcut",
      xmlParents: ["Properties"],
      order: 11,
      defaultValueXMLRaw: "",
    }),
    onMainServerUnavalableBehavior: systemEnumerationRule({
      yaml: "ПоведениеПриНедоступностиОсновногоСервера",
      xml: "OnMainServerUnavalableBehavior",
      typeSE: "OnMainServerUnavalableBehavior",
      implicitValueYAML: "Auto",
      defaultValueXML: "Auto",
      xmlParents: ["Properties"],
      order: 12,
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
