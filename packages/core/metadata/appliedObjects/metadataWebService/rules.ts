import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const properties = ["Properties"]
const childObjects = ["ChildObjects"]

export const MetadataWebServiceRules = {
  itemType: "MetadataWebService",
  itemTypePrefix: "WebСервис",
  xmlDir: "WebServices",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "WebService",
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
    namespace: {
      yaml: "ПространствоИмен",
      xml: "Namespace",
      type: "string",
      xmlParents: properties,
    },
    xdtoPackages: {
      yaml: "ПакетыXDTO",
      xml: "XDTOPackages",
      type: "XDTOPackages",
      xmlParents: properties,
      defaultValueXMLRaw: {},
    },
    descriptorFileName: {
      yaml: "ИмяФайлаДескриптора",
      xml: "DescriptorFileName",
      type: "string",
      xmlParents: properties,
    },
    reuseSessions: {
      yaml: "ПовторноеИспользованиеСеансов",
      xml: "ReuseSessions",
      type: "SystemEnumeration",
      typeSE: "SessionReuseMode",
      xmlParents: properties,
      defaultValueXML: "AutoUse",
      defaultValueYAML: "AutoUse",
    },
    sessionMaxAge: {
      yaml: "ВремяЖизниСеанса",
      xml: "SessionMaxAge",
      type: "number",
      xmlParents: properties,
      defaultValueXML: 20,
      defaultValueYAML: 20,
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      toYAML: false,
      fromYAML: false,
      defaultValueYAML: "Native",
    },
    extendedConfigurationObject: {
      xml: "ExtendedConfigurationObject",
      type: "string",
      xmlParents: properties,
      runtimeOnly: true,
    },
    operations: {
      yaml: "Операции",
      xml: "Operation",
      type: "MetadataWebServiceOperations",
      xmlParents: childObjects,
      defaultValue: [],
      defaultValueXMLRaw: {},
    },
    module: {
      type: "Module",
      nkdkPath: "Модуль.bsl",
      xmlPath: "Ext/Module.bsl",
      toXML: false,
      fromXML: false,
    },
  },
} as const satisfies MetadataItemRule
