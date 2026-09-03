import { i8nTextRule } from "../i8nText/types"

const properties = ["Properties"]

export const externalDataSourceObjectPresentationProperties = {
  objectPresentation: i8nTextRule({
    yaml: "ПредставлениеОбъекта",
    xml: "ObjectPresentation",
    xmlParents: properties,
    defaultValueXMLRaw: "",
  }),
  extendedObjectPresentation: i8nTextRule({
    yaml: "РасширенноеПредставлениеОбъекта",
    xml: "ExtendedObjectPresentation",
    xmlParents: properties,
    defaultValueXMLRaw: "",
  }),
} as const
