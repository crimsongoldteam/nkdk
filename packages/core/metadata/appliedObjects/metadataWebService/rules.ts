import { metadataWebServiceOperationsRule } from "~/metadata/appliedObjects/metadataWebService/builders"
import { xDTOPackagesRule } from "~/metadata/commonObjects/xDTOPackages/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { moduleRule } from "~/metadata/commonObjects/module/types"
import { numberRule } from "~/metadata/commonObjects/number/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { uuidRule } from "~/metadata/commonObjects/uuid/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
const properties = ["Properties"]
const childObjects = ["ChildObjects"]
export const MetadataWebServiceRules = {
  itemType: "MetadataWebService",
  metadataTargetOwner: { kind: "self", root: "WebService" },
  itemTypePrefix: "WebСервис",
  xmlDir: "WebServices",
  properties: {
    xmlRoot: xmlRootRule({
      container: "WebService",
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
      defaultValue: ({ name }: { name?: string }) => name,
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
    namespace: stringRule({
      yaml: "ПространствоИмен",
      xml: "Namespace",
      xmlParents: properties,
    }),
    xdtoPackages: xDTOPackagesRule({
      yaml: "ПакетыXDTO",
      xml: "XDTOPackages",
      xmlParents: properties,
      defaultValueXMLRaw: {},
    }),
    descriptorFileName: stringRule({
      yaml: "ИмяФайлаДескриптора",
      xml: "DescriptorFileName",
      xmlParents: properties,
    }),
    reuseSessions: systemEnumerationRule({
      yaml: "ПовторноеИспользованиеСеансов",
      xml: "ReuseSessions",
      typeSE: "SessionReuseMode",
      xmlParents: properties,
      defaultValueXML: "AutoUse",
      implicitValueYAML: "AutoUse",
    }),
    sessionMaxAge: numberRule({
      yaml: "ВремяЖизниСеанса",
      xml: "SessionMaxAge",
      xmlParents: properties,
      defaultValueXML: 20,
      implicitValueYAML: 20,
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    }),
    extendedConfigurationObject: stringRule({
      xml: "ExtendedConfigurationObject",
      xmlParents: properties,
      runtimeOnly: true,
    }),
    operations: metadataWebServiceOperationsRule({
      yaml: "Операции",
      xml: "Operation",
      xmlParents: childObjects,
      defaultValue: [],
      defaultValueXMLRaw: {},
    }),
    module: moduleRule({
      nkdkPath: "Модуль.bsl",
      xmlPath: "Ext/Module.bsl",
      toXML: false,
      fromXML: false,
    }),
  },
} as const satisfies MetadataItemRule
