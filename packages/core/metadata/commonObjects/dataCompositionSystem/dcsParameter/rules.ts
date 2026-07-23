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
  properties: {
    name: stringRule({
      xml: "dcssch:name",
      yaml: "Имя",
      order: 1,
      toYAML: false,
    }),
    title: dcsLocalStringTypeRule({
      xml: "dcssch:title",
      yaml: "Заголовок",
      order: 2,
    }),
    valueType: typeDescriptionRule({
      xml: "dcssch:valueType",
      yaml: "ТипЗначения",
      order: 3,
    }),
    value: metadataDcsMetadataValueRule({
      valueType: "Primitive",
      xml: "dcssch:value",
      yaml: "Значение",
      order: 4,
      exportNilValue: true,
      preserveFromReferenceXML: true,
      preserveUnknownReferenceXML: false,
    }),
    useRestriction: booleanRule({
      xml: "dcssch:useRestriction",
      yaml: "ОграничениеИспользования",
      order: 5,
      implicitValueYAML: false,
      defaultValueXML: false,
    }),
    expression: stringRule({
      xml: "dcssch:expression",
      yaml: "Выражение",
      order: 6,
    }),
    valueListAllowed: booleanRule({
      xml: "dcssch:valueListAllowed",
      yaml: "ДоступенСписокЗначений",
      order: 7,
      implicitValueYAML: false,
    }),
    includeInAvailableFields: booleanRule({
      xml: "dcssch:availableAsField",
      yaml: "ВключатьВДоступныеПоля",
      order: 8,
      implicitValueYAML: true,
    }),
    functionalOptionsParameter: stringRule({
      xml: "dcssch:functionalOptionsParameter",
      yaml: "ПараметрФункциональныхОпций",
      order: 9,
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
      order: 10,
    }),
    denyIncompleteValues: booleanRule({
      xml: "dcssch:denyIncompleteValues",
      yaml: "ЗапрещатьНезаполненныеЗначения",
      order: 11,
      implicitValueYAML: false,
    }),
    use: systemEnumerationRule({
      typeSE: "DCSParameterUse",
      xml: "dcssch:use",
      yaml: "Использование",
      implicitValueYAML: "Auto",
      order: 12,
    }),
  },
} as const satisfies MetadataItemRule
