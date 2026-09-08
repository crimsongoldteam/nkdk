import { metadataIdentityProperties } from "../../commonObjects/metadataIdentityProperties"
import { booleanRule } from "../../commonObjects/boolean/types"
import { templateRule } from "../../commonObjects/module/types"
import { metadataObjectBelongingProperties } from "../../commonObjects/metadataObjectBelongingProperties"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { V8_MDCLASSES_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"

const properties = ["Properties"]

export const MetadataInterfaceRules = {
  itemType: "MetadataInterface",
  metadataTargetOwner: { kind: "self", root: "Interface" },
  itemTypePrefix: "Интерфейс",
  xmlDir: "Interfaces",
  properties: {
    xmlRoot: xmlRootRule({ container: "Interface", rootAttributes: V8_MDCLASSES_ROOT, xmlOnly: true, toYAML: false, fromYAML: false }),
    ...metadataIdentityProperties,
    interface: templateRule({ nkdkPath: "Interface.bin", xmlPath: "Ext/Interface.bin", toXML: false, fromXML: false }),
    switchable: booleanRule({
      xml: "Switchable", yaml: "Переключаемый", xmlParents: properties, implicitValueYAML: true,
      evaluateWhenYAMLMissing: true,
      defaultValue: ({ operation }: { operation: string }) => operation === "importFromYAML" ? true : undefined,
    }),
    ...metadataObjectBelongingProperties,
  },
} as const satisfies MetadataItemRule
