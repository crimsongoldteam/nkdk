import { isXmlElementNode, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import type { FormMetadataXML } from "./types"

export function formMetadataSource(xml: FormMetadataXML | XmlElementNode): FormMetadataXML["Form"] | XmlElementNode | undefined {
  return isXmlElementNode(xml) ? xmlElementChildren(xml, "Form")[0] : xml.Form
}

export function formTypeFromMetadataXML(xml: FormMetadataXML | XmlElementNode): string | undefined {
  const source = formMetadataSource(xml)
  if (!isXmlElementNode(source)) return source?.Properties.FormType
  const properties = xmlElementChildren(source, "Properties")[0]
  const type = properties === undefined ? undefined : xmlElementChildren(properties, "FormType")[0]
  return type === undefined ? undefined : xmlTextValue(type) || undefined
}
