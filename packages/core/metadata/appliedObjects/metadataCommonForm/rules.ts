import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const properties = ["Properties"]

export const MetadataCommonFormRules = {
  itemType: "MetadataCommonForm",
  itemTypePrefix: "ОбщаяФорма",
  xmlDir: "CommonForms",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "CommonForm",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
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
    form: {
      yaml: "Форма",
      type: "ClientApplicationForm",
      filePath: "Ext/Form.xml",
      exportReferenceFileOnMissingValue: true,
    },
    formType: {
      yaml: "ТипФормы",
      xml: "FormType",
      type: "SystemEnumeration",
      typeSE: "FormType",
      xmlParents: properties,
      defaultValueXML: "Managed",
      defaultValueYAML: "Managed",
    },
    includeHelpInContents: {
      yaml: "ВключатьСправкуВСодержание",
      xml: "IncludeHelpInContents",
      type: "boolean",
      xmlParents: properties,
      defaultValueXML: false,
      defaultValueYAML: false,
    },
    help: {
      type: "Help",
      filePath: "Ext/Help.xml",
      xmlPath: "Ext/Help.xml",
      nkdkDir: "Справка",
      toXML: false,
      fromXML: false,
    },
    usePurposes: {
      yaml: "НазначенияИспользования",
      xml: "UsePurposes",
      type: "UsePurposes",
      xmlParents: properties,
    },
    useStandardCommands: {
      yaml: "ИспользоватьСтандартныеКоманды",
      xml: "UseStandardCommands",
      type: "boolean",
      xmlParents: properties,
      defaultValueXML: true,
      defaultValueYAML: true,
    },
    extendedPresentation: {
      yaml: "РасширенноеПредставление",
      xml: "ExtendedPresentation",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    explanation: {
      yaml: "Пояснение",
      xml: "Explanation",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
  },
} as const satisfies MetadataItemRule
