import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const properties = ["Properties"]
const childObjects = ["ChildObjects"]

export const MetadataSettingsStorageRules = {
  itemType: "MetadataSettingsStorage",
  itemTypePrefix: "ХранилищеНастроек",
  xmlDir: "SettingsStorages",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "SettingsStorage",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    internalInfo: {
      type: "InternalInfo",
      xmlParents: [],
      forReferenceOnly: true,
      items: [{ name: "SettingsStorageManager", category: "Manager" }],
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
    defaultSaveForm: {
      yaml: "ОсновнаяФормаСохранения",
      type: "string",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"] },
      defaultValueXMLRaw: "",
    },
    defaultLoadForm: {
      yaml: "ОсновнаяФормаЗагрузки",
      type: "string",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"] },
      defaultValueXMLRaw: "",
    },
    auxiliarySaveForm: {
      yaml: "ВспомогательнаяФормаСохранения",
      type: "string",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"] },
      defaultValueXMLRaw: "",
    },
    auxiliaryLoadForm: {
      yaml: "ВспомогательнаяФормаЗагрузки",
      type: "string",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"] },
      defaultValueXMLRaw: "",
    },
    managerModule: {
      type: "Module",
      nkdkPath: "МодульМенеджера.bsl",
      xmlPath: "Ext/ManagerModule.bsl",
    },
    forms: {
      yaml: "Формы",
      type: "ChildFormNames",
      xml: "Form",
      folderName: "Формы",
      forReferenceOnly: true,
      xmlParents: childObjects,
    },
    templates: {
      yaml: "Шаблоны",
      type: "ChildTemplateNames",
      xml: "Template",
      folderName: "Шаблоны",
      forReferenceOnly: true,
      xmlParents: childObjects,
    },
  },
} as const satisfies MetadataItemRule
