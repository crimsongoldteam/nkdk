import { childFormNamesRule } from "~/metadata/commonObjects/childFormNames/types"
import { childTemplateNamesRule } from "~/metadata/commonObjects/childTemplateNames/types"
import { internalInfoRule } from "~/metadata/commonObjects/internalInfo/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { moduleRule } from "~/metadata/commonObjects/module/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { uuidRule } from "~/metadata/commonObjects/uuid/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
const properties = ["Properties"]
const childObjects = ["ChildObjects"]
export const MetadataSettingsStorageRules = {
  itemType: "MetadataSettingsStorage",
  metadataTargetOwner: { kind: "self", root: "SettingsStorage" },
  itemTypePrefix: "ХранилищеНастроек",
  xmlDir: "SettingsStorages",
  properties: {
    xmlRoot: xmlRootRule({
      container: "SettingsStorage",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      items: [{ name: "SettingsStorageManager", category: "Manager" }],
    }),
    uuid: uuidRule({
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    }),
    name: stringRule({
      xmlParents: properties,
      required: true,
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      typeSE: "ObjectBelonging",
      implicitValueYAML: "Native",
      toYAML: false,
      fromYAML: false,
      xmlParents: properties,
    }),
    extendedConfigurationObject: stringRule({
      yaml: "ОбъектРасширяемойКонфигурации",
      runtimeOnly: true,
    }),
    defaultSaveForm: stringRule({
      yaml: "ОсновнаяФормаСохранения",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    defaultLoadForm: stringRule({
      yaml: "ОсновнаяФормаЗагрузки",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    auxiliarySaveForm: stringRule({
      yaml: "ВспомогательнаяФормаСохранения",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    auxiliaryLoadForm: stringRule({
      yaml: "ВспомогательнаяФормаЗагрузки",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    managerModule: moduleRule({
      externalMetadata: { segment: "ManagerModule", placement: "derivedEntry" },
      nkdkPath: "МодульМенеджера.bsl",
      xmlPath: "Ext/ManagerModule.bsl",
    }),
    forms: childFormNamesRule({
      yaml: "Формы",
      xml: "Form",
      folderName: "Формы",
      forReferenceOnly: true,
      xmlParents: childObjects,
    }),
    templates: childTemplateNamesRule({
      yaml: "Шаблоны",
      xml: "Template",
      folderName: "Шаблоны",
      forReferenceOnly: true,
      xmlParents: childObjects,
    }),
  },
} as const satisfies MetadataItemRule
