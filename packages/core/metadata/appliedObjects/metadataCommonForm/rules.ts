import { helpRule } from "../../commonObjects/help/types"
import { usePurposesRule } from "../../commonObjects/usePurposes/types"
import { clientApplicationFormRule } from "../../forms/clientApplicationForm/builders"
import { booleanRule } from "../../commonObjects/boolean/types"
import { i8nTextRule } from "../../commonObjects/i8nText/types"
import { moduleRule } from "../../commonObjects/module/types"
import { stringRule } from "../../commonObjects/string/types"
import { uuidRule } from "../../commonObjects/uuid/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import "../../forms/clientApplicationForm/propertyRules"
import { V8_MDCLASSES_ROOT } from "../../orchestration/appliedObject/presets"
import type { MetadataItemRule } from "../../orchestration/property/types"
const properties = ["Properties"]
export const MetadataCommonFormRules = {
  itemType: "MetadataCommonForm",
  metadataTargetOwner: { kind: "self", root: "CommonForm" },
  itemTypePrefix: "ОбщаяФорма",
  xmlDir: "CommonForms",
  properties: {
    xmlRoot: xmlRootRule({
      container: "CommonForm",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
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
    form: clientApplicationFormRule({
      yaml: "Форма",
      filePath: "Ext/Form.xml",
      exportReferenceFileOnMissingValue: true,
    }),
    module: moduleRule({
      nkdkPath: "Модуль.bsl",
      xmlPath: "Ext/Form/Module.bsl",
      toXML: false,
      fromXML: false,
    }),
    formType: systemEnumerationRule({
      yaml: "ТипФормы",
      xml: "FormType",
      typeSE: "FormType",
      xmlParents: properties,
      defaultValueXML: "Managed",
      implicitValueYAML: "Managed",
    }),
    includeHelpInContents: booleanRule({
      yaml: "ВключатьСправкуВСодержание",
      xml: "IncludeHelpInContents",
      xmlParents: properties,
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    help: helpRule({
      externalMetadata: { segment: "Help", placement: "derivedEntry" },
      filePath: "Ext/Help.xml",
      xmlPath: "Ext/Help.xml",
      nkdkDir: "Справка",
      toXML: false,
      fromXML: false,
    }),
    usePurposes: usePurposesRule({
      yaml: "НазначенияИспользования",
      xml: "UsePurposes",
      xmlParents: properties,
    }),
    useStandardCommands: booleanRule({
      yaml: "ИспользоватьСтандартныеКоманды",
      xml: "UseStandardCommands",
      xmlParents: properties,
      defaultValueXML: true,
      implicitValueYAML: true,
    }),
    extendedPresentation: i8nTextRule({
      yaml: "РасширенноеПредставление",
      xml: "ExtendedPresentation",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    explanation: i8nTextRule({
      yaml: "Пояснение",
      xml: "Explanation",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
  },
} as const satisfies MetadataItemRule
