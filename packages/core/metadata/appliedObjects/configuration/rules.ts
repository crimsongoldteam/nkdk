import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"

const configurationProperties = ["Properties"]

export const MetadataConfigurationRules = {
  itemType: "MetadataConfiguration",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "Configuration",
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
      yaml: "Имя",
      type: "string",
      xmlParents: configurationProperties,
      required: true,
    },
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
      xmlParents: configurationProperties,
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
      xmlParents: configurationProperties,
    },
  },
} satisfies MetadataItemRule
