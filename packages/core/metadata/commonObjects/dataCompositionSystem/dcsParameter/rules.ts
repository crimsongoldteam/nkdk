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
      type: "DcsLocalStringType",
      xml: "dcssch:title",
      yaml: "Заголовок",
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
      exportNilValue: true,
      preserveFromReferenceXML: true,
    },
    useRestriction: {
      type: "boolean",
      xml: "dcssch:useRestriction",
      yaml: "ОграничениеИспользования",
      order: 5,
      implicitValueYAML: false,
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
      implicitValueYAML: false,
    },
    includeInAvailableFields: {
      type: "boolean",
      xml: "dcssch:availableAsField",
      yaml: "ВключатьВДоступныеПоля",
      order: 8,
      implicitValueYAML: true,
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
      implicitValueYAML: false,
    },
    use: {
      type: "SystemEnumeration",
      typeSE: "DCSParameterUse",
      xml: "dcssch:use",
      yaml: "Использование",
      implicitValueYAML: "Auto",
      order: 12,
    },
  },
} as const satisfies MetadataItemRule
