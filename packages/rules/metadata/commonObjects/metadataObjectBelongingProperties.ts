import { stringRule } from "./string/types"
import { systemEnumerationRule } from "../systemEnumerations/types"

const properties = ["Properties"]

export const metadataObjectBelongingProperties = {
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
} as const
