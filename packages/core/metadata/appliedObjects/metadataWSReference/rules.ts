import { internalInfoRule } from "../../commonObjects/internalInfo/types"
import { templateRule } from "../../commonObjects/module/types"
import { wSDefinitionSchemasRule } from "../../commonObjects/wsDefinitionSchemas/types"
import { i8nTextRule } from "../../commonObjects/i8nText/types"
import { stringRule } from "../../commonObjects/string/types"
import { uuidRule } from "../../commonObjects/uuid/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../orchestration/appliedObject/presets"
import type { MetadataItemRule } from "../../orchestration/property/types"
const properties = ["Properties"]
export const MetadataWSReferenceRules = {
  itemType: "MetadataWSReference",
  metadataTargetOwner: { kind: "self", root: "WSReference" },
  itemTypePrefix: "WSСсылка",
  xmlDir: "WSReferences",
  properties: {
    xmlRoot: xmlRootRule({
      container: "WSReference",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
      items: [{ name: "WSReferenceManager", category: "Manager" }],
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
    locationURL: stringRule({
      yaml: "URL",
      xml: "LocationURL",
      xmlParents: properties,
    }),
    wsDefinition: templateRule({
      nkdkPath: "WSDefinition.xml",
      xmlPath: "Ext/WSDefinition.xml",
    }),
    wsDefinitionSchemas: wSDefinitionSchemasRule({
      syncExternalOnly: true,
    }),
  },
} as const satisfies MetadataItemRule
