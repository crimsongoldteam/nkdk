import { addDefaultLanguageNameToSynonym } from "~/metadata/helpers/synonymHelpers"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const MetadataCommandRules = {
  itemType: "MetadataCommand",
  properties: {
    commandParameterType: {
      yaml: "ТипПараметраКоманды",
      xml: "CommandParameterType",
      type: "TypeDescription",
    },
    comment: {
      yaml: "Комментарий",
      xml: "Comment",
      type: "string",
    },
    group: {
      yaml: "Группа",
      xml: "Group",
      type: "MetadataCommandGroup",
      useAsShortValueYAML: true,
    },
    modifiesData: {
      yaml: "ИзменяетДанные",
      xml: "ModifiesData",
      type: "boolean",
    },
    name: {
      xml: "Name",
      type: "string",
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
    },
    parameterUseMode: {
      yaml: "РежимИспользованияПараметра",
      xml: "ParameterUseMode",
      type: "SystemEnumeration",
      typeSE: "CommandParameterUseMode",
    },
    picture: {
      yaml: "Картинка",
      xml: "Picture",
      type: "Picture",
    },
    representation: {
      yaml: "Отображение",
      xml: "Representation",
      type: "SystemEnumeration",
      typeSE: "ButtonRepresentation",
    },
    shortcut: {
      yaml: "СочетаниеКлавиш",
      xml: "Shortcut",
      type: "string",
    },
    synonym: {
      yaml: "Синоним",
      xml: "Synonym",
      type: "I8nText",
      excludeIfEqualNameYAML: true,
      defaultValue: ({ context, name }) =>
        addDefaultLanguageNameToSynonym(context, undefined, name ?? ""),
    },
    toolTip: {
      yaml: "Подсказка",
      xml: "ToolTip",
      type: "I8nText",
    },
    onMainServerUnavalableBehavior: {
      yaml: "ПоведениеПриНедоступностиОсновногоСервера",
      xml: "OnMainServerUnavalableBehavior",
      type: "SystemEnumeration",
      typeSE: "OnMainServerUnavalableBehavior",
    },
  },
} as const satisfies MetadataItemRule
