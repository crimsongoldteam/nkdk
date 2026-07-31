import { dcsLocalStringTypeRule } from "../dcsLocalStringType/types"
import { metadataDcsMetadataValueRule } from "../dcsMetadataValue/types"
import { settingsParameterValueRule } from "../parameterValue/types"
import { settingsParameterValueCollectionRule } from "../settingsParameterValueCollection/types"
import { typeDescriptionRule } from "../../typeDescription/types"
import { booleanRule } from "../../boolean/types"
import { stringRule } from "../../string/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { MetadataItemRule } from "../../../orchestration"
export const DCSParameterRules = {
  itemType: "DCSParameter",
  xmlOrder: [
    "name",
    "title",
    "valueType",
    "value",
    "useRestriction",
    "expression",
    "valueListAllowed",
    "includeInAvailableFields",
    "editParameters",
    "use",
  ],
  properties: {
    name: stringRule({
      xml: "dcssch:name",
      yaml: "Имя",
      toYAML: false,
    }),
    title: dcsLocalStringTypeRule({
      xml: "dcssch:title",
      yaml: "Заголовок",
    }),
    valueType: typeDescriptionRule({
      xml: "dcssch:valueType",
      yaml: "ТипЗначения",
    }),
    value: metadataDcsMetadataValueRule({
      valueType: "Primitive",
      xml: "dcssch:value",
      yaml: "Значение",
      exportNilValue: true,
      preserveUnknownReferenceXML: false,
    }),
    useRestriction: booleanRule({
      xml: "dcssch:useRestriction",
      yaml: "ОграничениеИспользования",
      implicitValueYAML: false,
      defaultValueXML: false,
    }),
    expression: stringRule({
      xml: "dcssch:expression",
      yaml: "Выражение",
    }),
    valueListAllowed: booleanRule({
      xml: "dcssch:valueListAllowed",
      yaml: "ДоступенСписокЗначений",
      implicitValueYAML: false,
    }),
    includeInAvailableFields: booleanRule({
      xml: "dcssch:availableAsField",
      yaml: "ВключатьВДоступныеПоля",
      implicitValueYAML: true,
    }),
    functionalOptionsParameter: stringRule({
      xml: "dcssch:functionalOptionsParameter",
      yaml: "ПараметрФункциональныхОпций",
    }),
    editParameters: settingsParameterValueCollectionRule({
      defaultItemRule: settingsParameterValueRule({
        valueType: "Primitive",
        exportSettingsXsiType: false,
      }),
      parameterRules: {
        ВыборГруппИЭлементов: settingsParameterValueRule({
          valueType: "SystemEnumeration",
          typeSE: "FoldersAndItemsUse",
          exportSettingsXsiType: false,
        }),
        СвязиПараметровВыбора: settingsParameterValueRule({
          valueType: "ChoiceParameterLinks",
          exportSettingsXsiType: false,
        }),
        ПараметрыВыбора: settingsParameterValueRule({
          valueType: "Parameter",
          exportSettingsXsiType: false,
        }),
        СвязьПоТипу: settingsParameterValueRule({
          valueType: "TypeLink",
          exportSettingsXsiType: false,
        }),
      },
      xml: "dcscor:item",
      xmlParents: ["dcssch:inputParameters"],
      yaml: "ПараметрыРедактирования",
    }),
    denyIncompleteValues: booleanRule({
      xml: "dcssch:denyIncompleteValues",
      yaml: "ЗапрещатьНезаполненныеЗначения",
      implicitValueYAML: false,
    }),
    use: systemEnumerationRule({
      typeSE: "DCSParameterUse",
      xml: "dcssch:use",
      yaml: "Использование",
      implicitValueYAML: "Auto",
    }),
  },
} as const satisfies MetadataItemRule
