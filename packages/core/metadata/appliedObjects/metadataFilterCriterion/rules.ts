import { metadataCommandsRule } from "~/metadata/appliedObjects/metadataAccountingRegister/builders"
import { childFormNamesRule } from "~/metadata/commonObjects/childFormNames/types"
import { internalInfoRule } from "~/metadata/commonObjects/internalInfo/types"
import { metadataItemLinksRule } from "~/metadata/commonObjects/metadataPath/types"
import { typeDescriptionRule } from "~/metadata/commonObjects/typeDescription/types"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { moduleRule } from "~/metadata/commonObjects/module/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { uuidRule } from "~/metadata/commonObjects/uuid/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { MetadataCommandRules } from "~/metadata/appliedObjects/metadataCommand/rules"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
const properties = ["Properties"]
const childObjects = ["ChildObjects"]
export const MetadataFilterCriterionRules = {
  itemType: "MetadataFilterCriterion",
  metadataTargetOwner: { kind: "self", root: "FilterCriterion" },
  itemTypePrefix: "КритерийОтбора",
  xmlDir: "FilterCriteria",
  properties: {
    xmlRoot: xmlRootRule({
      container: "FilterCriterion",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "FilterCriterionManager", category: "Manager" },
        { name: "FilterCriterionList", category: "List" },
      ],
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
      excludeIfEqualNameYAML: true,
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
    type: typeDescriptionRule({
      yaml: "Тип",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    useStandardCommands: booleanRule({
      yaml: "ИспользоватьСтандартныеКоманды",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: properties,
    }),
    content: metadataItemLinksRule({
      yaml: "Состав",
      metadataTarget: { kind: "member", owner: "explicit" },
      xml: "Content",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    defaultForm: stringRule({
      yaml: "ОсновнаяФорма",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    auxiliaryForm: stringRule({
      yaml: "ВспомогательнаяФорма",
      xmlParents: properties,
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
      defaultValueXMLRaw: "",
    }),
    managerModule: moduleRule({
      externalMetadata: { segment: "ManagerModule", placement: "derivedEntry" },
      nkdkPath: "МодульМенеджера.bsl",
      xmlPath: "Ext/ManagerModule.bsl",
    }),
    listPresentation: i8nTextRule({
      yaml: "ПредставлениеСписка",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    extendedListPresentation: i8nTextRule({
      yaml: "РасширенноеПредставлениеСписка",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    explanation: i8nTextRule({
      yaml: "Пояснение",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    commands: metadataCommandsRule({
      yaml: "Команды",
      xml: "Command",
      xmlParents: childObjects,
    }),
    forms: childFormNamesRule({
      yaml: "Формы",
      xml: "Form",
      folderName: "Формы",
      forReferenceOnly: true,
      xmlParents: childObjects,
    }),
  },
  childCollections: [{ propertyKey: "commands", itemRule: MetadataCommandRules }],
} as const satisfies MetadataItemRule
