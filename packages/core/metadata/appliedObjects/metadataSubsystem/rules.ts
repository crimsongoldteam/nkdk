import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import "~/metadata/commonObjects/rootCommandInterface/register"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const properties = ["Properties"]
const childObjects = ["ChildObjects"]

export const MetadataSubsystemRules = {
  itemType: "MetadataSubsystem",
  itemTypePrefix: "Подсистема",
  xmlDir: "Subsystems",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "Subsystem",
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
      defaultValue: ({ name }: { name?: string }) => name,
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
    includeHelpInContents: {
      yaml: "ВключатьСправкуВСодержание",
      xml: "IncludeHelpInContents",
      type: "boolean",
      xmlParents: properties,
      defaultValueXML: true,
      implicitValueYAML: true,
    },
    includeInCommandInterface: {
      yaml: "ВключатьВКомандныйИнтерфейс",
      xml: "IncludeInCommandInterface",
      type: "boolean",
      xmlParents: properties,
      defaultValueXML: true,
      implicitValueYAML: true,
    },
    useOneCommand: {
      yaml: "ИспользоватьОднуКоманду",
      xml: "UseOneCommand",
      type: "boolean",
      xmlParents: properties,
      defaultValueXML: false,
      implicitValueYAML: false,
    },
    explanation: {
      yaml: "Пояснение",
      xml: "Explanation",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    picture: {
      yaml: "Картинка",
      xml: "Picture",
      type: "Picture", metadataTarget: { kind: "object", roots: ["CommonPicture"] },
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    content: {
      yaml: "Состав",
      xml: "Content",
      type: "MetadataItemLinks",
      xmlParents: properties,
      defaultValueXMLRaw: {},
    },
    subsystems: {
      yaml: "Подсистемы",
      xml: "Subsystem",
      type: "ChildSubsystemNames",
      xmlParents: childObjects,
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    },
    extendedConfigurationObject: {
      xml: "ExtendedConfigurationObject",
      type: "string",
      xmlParents: properties,
      runtimeOnly: true,
    },
    commandInterface: {
      yaml: "КомандныйИнтерфейс",
      type: "RootCommandInterface",
      filePath: "Ext/CommandInterface.xml",
    },
    help: {
      type: "Help",
      filePath: "Ext/Help.xml",
      xmlPath: "Ext/Help.xml",
      nkdkDir: "Справка",
      toXML: false,
      fromXML: false,
    },
  },
} as const satisfies MetadataItemRule
