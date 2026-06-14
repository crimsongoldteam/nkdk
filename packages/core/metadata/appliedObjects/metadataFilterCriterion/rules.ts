import { MetadataCommandRules } from "~/metadata/appliedObjects/metadataCommand/rules"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const properties = ["Properties"]
const childObjects = ["ChildObjects"]

export const MetadataFilterCriterionRules = {
  itemType: "MetadataFilterCriterion",
  itemTypePrefix: "КритерийОтбора",
  xmlDir: "FilterCriteria",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "FilterCriterion",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    internalInfo: {
      type: "InternalInfo",
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "FilterCriterionManager", category: "Manager" },
        { name: "FilterCriterionList", category: "List" },
      ],
    },
    uuid: {
      type: "uuid",
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    },
    name: {
      type: "string",
      xmlParents: properties,
      required: true,
    },
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      implicitValueYAML: "Native",
      toYAML: false,
      fromYAML: false,
      xmlParents: properties,
    },
    extendedConfigurationObject: {
      yaml: "ОбъектРасширяемойКонфигурации",
      type: "string",
      runtimeOnly: true,
    },
    type: {
      yaml: "Тип",
      type: "TypeDescription",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    useStandardCommands: {
      yaml: "ИспользоватьСтандартныеКоманды",
      type: "boolean",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: properties,
    },
    content: {
      yaml: "Состав",
      type: "MetadataItemLinks",
      metadataTarget: { kind: "field", owner: "explicit" },
      xml: "Content",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    defaultForm: {
      yaml: "ОсновнаяФорма",
      type: "string",
      xmlParents: properties,
      referenceScope: { target: "this", kind: "Form" },
      defaultValueXMLRaw: "",
    },
    auxiliaryForm: {
      yaml: "ВспомогательнаяФорма",
      type: "string",
      xmlParents: properties,
      referenceScope: { target: "this", kind: "Form" },
      defaultValueXMLRaw: "",
    },
    managerModule: {
      type: "Module",
      nkdkPath: "МодульМенеджера.bsl",
      xmlPath: "Ext/ManagerModule.bsl",
    },
    listPresentation: {
      yaml: "ПредставлениеСписка",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    extendedListPresentation: {
      yaml: "РасширенноеПредставлениеСписка",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    explanation: {
      yaml: "Пояснение",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    commands: {
      yaml: "Команды",
      type: "MetadataCommands",
      xml: "Command",
      xmlParents: childObjects,
    },
    forms: {
      yaml: "Формы",
      type: "ChildFormNames",
      xml: "Form",
      folderName: "Формы",
      forReferenceOnly: true,
      xmlParents: childObjects,
    },
  },
  childCollections: [{ propertyKey: "commands", itemRule: MetadataCommandRules }],
} as const satisfies MetadataItemRule
