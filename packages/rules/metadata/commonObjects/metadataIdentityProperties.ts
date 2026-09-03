import { i8nTextRule } from "./i8nText/types"
import { stringRule } from "./string/types"
import { uuidRule } from "./uuid/types"

const properties = ["Properties"]

/** Идентичность и описание объекта с UUID, сохраняемым только в снимке. */
export const metadataIdentityProperties = {
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
    defaultValueAdoptedXML: "",
  }),
} as const
