import { metadataObjectBelongingProperties } from "../../commonObjects/metadataObjectBelongingProperties"
import { metadataIdentityProperties } from "../../commonObjects/metadataIdentityProperties"
import { templateRule } from "../../commonObjects/module/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
const properties = ["Properties"]
export const MetadataCommonTemplateRules = {
  itemType: "MetadataCommonTemplate",
  metadataTargetOwner: { kind: "self", root: "CommonTemplate" },
  itemTypePrefix: "ОбщийМакет",
  xmlDir: "CommonTemplates",
  xmlOrder: [
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "templateType",
    "uuid",
  ],
  properties: {
    xmlRoot: xmlRootRule({
      container: "CommonTemplate",
      rootAttributes: V8_MDCLASSES_ROOT,
      xmlOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    ...metadataIdentityProperties,
    templateType: systemEnumerationRule({
      yaml: "ВидМакета",
      xml: "TemplateType",
      typeSE: "TemplateType",
      xmlParents: properties,
      defaultValueXML: "SpreadsheetDocument",
      defaultValueAdoptedXML: "SpreadsheetDocument",
      implicitValueYAML: "SpreadsheetDocument",
    }),
    template: templateRule({
      nkdkPath: "Template.xml",
      xmlPath: "Ext/Template.xml",
      toXML: false,
      fromXML: false,
    }),
    objectBelonging: metadataObjectBelongingProperties.objectBelonging,
    extendedConfigurationObject: metadataObjectBelongingProperties.extendedConfigurationObject,
  },
} as const satisfies MetadataItemRule
