import { metadataObjectBelongingProperties } from "../../commonObjects/metadataObjectBelongingProperties"
import { metadataIdentityProperties } from "../../commonObjects/metadataIdentityProperties"
import { stringRule } from "../../commonObjects/string/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { V8_MDCLASSES_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"

const properties = ["Properties"]

export const MetadataLanguageRules = {
  itemType: "MetadataLanguage",
  metadataTargetOwner: { kind: "self", root: "Language" },
  itemTypePrefix: "Язык",
  xmlDir: "Languages",
  xmlOrder: [
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "languageCode",
    "uuid",
  ],
  properties: {
    xmlRoot: xmlRootRule({
      container: "Language",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    uuid: metadataIdentityProperties.uuid,
    name: stringRule({
      xmlParents: properties,
      required: true,
      defaultValue: ({ name }: { name?: string }) => name,
    }),
    synonym: metadataIdentityProperties.synonym,
    comment: metadataIdentityProperties.comment,
    languageCode: stringRule({
      yaml: "КодЯзыка",
      xml: "LanguageCode",
      required: true,
      xmlParents: properties,
    }),
    objectBelonging: metadataObjectBelongingProperties.objectBelonging,
    extendedConfigurationObject: metadataObjectBelongingProperties.extendedConfigurationObject,
  },
} as const satisfies MetadataItemRule
