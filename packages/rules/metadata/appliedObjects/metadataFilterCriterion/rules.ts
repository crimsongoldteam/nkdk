import { ownerFormLinks } from "../../commonObjects/metadataPath/formLinks"
import { metadataCommandsRule } from "../metadataAccountingRegister/builders"
import { childFormNamesRule } from "../../commonObjects/childFormNames/types"
import { internalInfoRule } from "../../commonObjects/internalInfo/types"
import { metadataItemLinksRule } from "../../commonObjects/metadataPath/types"
import { typeDescriptionRule } from "../../commonObjects/typeDescription/types"
import { booleanRule } from "../../commonObjects/boolean/types"
import { i8nTextRule } from "../../commonObjects/i8nText/types"
import { moduleRule } from "../../commonObjects/module/types"
import { stringRule } from "../../commonObjects/string/types"
import { metadataIdentityProperties } from "../../commonObjects/metadataIdentityProperties"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { MetadataCommandRules } from "../../commonObjects/metadataCommand/rules"
import { V8_MDCLASSES_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { exportDependentAdoptedDefault } from "../../ruleRuntime/property/xmlDefaultVariant"
const properties = ["Properties"]
const childObjects = ["ChildObjects"]
export const MetadataFilterCriterionRules = {
  itemType: "MetadataFilterCriterion",
  metadataTargetOwner: { kind: "self", root: "FilterCriterion" },
  itemTypePrefix: "КритерийОтбора",
  xmlDir: "FilterCriteria",
  xmlOrder: [
    "internalInfo",
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "type",
    "useStandardCommands",
    "content",
    "defaultForm",
    "auxiliaryForm",
    "listPresentation",
    "extendedListPresentation",
    "explanation",
    "forms",
    "commands",
    "uuid",
  ],
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
    ...metadataIdentityProperties,
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
      ownerFactRole: "type",
      yaml: "Тип",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    useStandardCommands: {
      ...booleanRule({
        yaml: "ИспользоватьСтандартныеКоманды",
        defaultValueXML: true,
        defaultValueAdoptedXML: true,
        implicitValueYAML: true,
        xmlParents: properties,
      }),
      toXML: (source, context) =>
        exportDependentAdoptedDefault(source, context, "useStandardCommands", ["commands"]),
    },
    content: metadataItemLinksRule({
      yaml: "Состав",
      metadataTarget: { kind: "member", owner: "explicit" },
      xml: "Content",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    defaultForm: ownerFormLinks.defaultForm,
    auxiliaryForm: { ...ownerFormLinks.auxiliaryForm, yaml: "ВспомогательнаяФорма" },
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
  childCollections: [
    { propertyKey: "commands", configurationIndexUidSegment: "Команда", itemRule: MetadataCommandRules },
  ],
} as const satisfies MetadataItemRule
