import { metadataIdentityProperties } from "../../commonObjects/metadataIdentityProperties"
import { ownerFormLinks } from "../../commonObjects/metadataPath/formLinks"
import { childFormNamesRule } from "../../commonObjects/childFormNames/types"
import { childTemplateNamesRule } from "../../commonObjects/childTemplateNames/types"
import { internalInfoRule } from "../../commonObjects/internalInfo/types"
import { moduleRule } from "../../commonObjects/module/types"
import { stringRule } from "../../commonObjects/string/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
const properties = ["Properties"]
const childObjects = ["ChildObjects"]
export const MetadataSettingsStorageRules = {
  itemType: "MetadataSettingsStorage",
  metadataTargetOwner: { kind: "self", root: "SettingsStorage" },
  itemTypePrefix: "ХранилищеНастроек",
  xmlDir: "SettingsStorages",
  xmlOrder: [
    "internalInfo",
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "defaultSaveForm",
    "defaultLoadForm",
    "auxiliarySaveForm",
    "auxiliaryLoadForm",
    "forms",
    "templates",
    "uuid",
  ],
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
    uuid: metadataIdentityProperties.uuid,
    name: metadataIdentityProperties.name,
    defaultSaveForm: ownerFormLinks.defaultSaveForm,
    synonym: metadataIdentityProperties.synonym,
    comment: metadataIdentityProperties.comment,
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
    defaultLoadForm: ownerFormLinks.defaultLoadForm,
    auxiliarySaveForm: ownerFormLinks.auxiliarySaveForm,
    auxiliaryLoadForm: ownerFormLinks.auxiliaryLoadForm,
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
