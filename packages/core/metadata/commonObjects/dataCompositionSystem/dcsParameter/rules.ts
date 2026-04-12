import { MetadataItemRule } from "~/metadata/orchestration"

export const DCSParameterRules = {
  itemType: "DCSParameter",
  properties: {
    name: {
      type: "string",
      xml: "dcssch:name",
      yaml: "Имя",
      order: 1,
      toYAML: false,
    },
    title: {
      type: "I8nText",
      xml: "dcssch:title",
      yaml: "Заголовок",
      typedXML: true,
      order: 2,
    },
    valueType: {
      type: "TypeDescription",
      xml: "dcssch:valueType",
      yaml: "ТипЗначения",
      order: 3,
    },
    value: {
      type: "MetadataDcsMetadataValue",
      valueType: "Primitive",
      xml: "dcssch:value",
      yaml: "Значение",
      order: 4,
    },
    useRestriction: {
      type: "boolean",
      xml: "dcssch:useRestriction",
      yaml: "ОграничениеИспользования",
      order: 5,
      defaultValueYAML: false,
      defaultValueXML: false,
    },
    expression: {
      type: "string",
      xml: "dcssch:expression",
      yaml: "Выражение",
      order: 6,
    },
    valueListAllowed: {
      type: "boolean",
      xml: "dcssch:valueListAllowed",
      yaml: "ДоступенСписокЗначений",
      order: 7,
      defaultValueYAML: false,
    },
    includeInAvailableFields: {
      type: "boolean",
      xml: "dcssch:availableAsField",
      yaml: "ВключатьВДоступныеПоля",
      order: 8,
      defaultValueYAML: true,
    },
    functionalOptionsParameter: {
      type: "string",
      xml: "dcssch:functionalOptionsParameter",
      yaml: "ПараметрФункциональныхОпций",
      order: 9,
    },
    editParameters: {
      type: "SettingsParameterValueCollection",
      defaultItemRule: {
        type: "SettingsParameterValue",
        valueType: "Primitive",
        exportSettingsXsiType: false,
      },
      parameterRules: {
        ВыборГруппИЭлементов: {
          type: "SettingsParameterValue",
          valueType: "SystemEnumeration",
          typeSE: "FoldersAndItemsUse",
          exportSettingsXsiType: false,
        },
        СвязиПараметровВыбора: {
          type: "SettingsParameterValue",
          valueType: "ChoiceParameterLinks",
          exportSettingsXsiType: false,
        },
        ПараметрыВыбора: {
          type: "SettingsParameterValue",
          valueType: "Parameter",
          exportSettingsXsiType: false,
        },
        СвязьПоТипу: {
          type: "SettingsParameterValue",
          valueType: "TypeLink",
          exportSettingsXsiType: false,
        },
      },
      xml: "dcscor:item",
      xmlParents: ["dcssch:inputParameters"],
      yaml: "ПараметрыРедактирования",
      order: 10,
    },
    denyIncompleteValues: {
      type: "boolean",
      xml: "dcssch:denyIncompleteValues",
      yaml: "ЗапрещатьНезаполненныеЗначения",
      order: 11,
    },
    use: {
      type: "SystemEnumeration",
      typeSE: "DCSParameterUse",
      xml: "dcssch:use",
      yaml: "Использование",
      defaultValueYAML: "Auto",
      order: 12,
    },
  },
} as const satisfies MetadataItemRule
