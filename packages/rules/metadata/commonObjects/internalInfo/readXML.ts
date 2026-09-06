import { isEmptyXmlElement, isXmlElementNode, xmlAttributeValue, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import type { InternalInfoRootXML, InternalInfoXML, InternalInfoContainedObjectXML } from "./types"

interface InternalInfoReader {
  generatedType(name: string, typeId: string | undefined, valueId: string | undefined): void
  thisNode(value: string): void
  containedObject(classId: string | undefined, objectId: string | undefined): void
}

/** Передаёт только факты идентичности; одинаковое чтение для модели и индекса. */
export function readInternalInfoXML(xml: InternalInfoRootXML | XmlElementNode, reader: InternalInfoReader): boolean {
  const generated = isXmlElementNode(xml) ? nonEmptyCollection(xml, "xr:GeneratedType") : xml["xr:GeneratedType"]
  const thisNode = isXmlElementNode(xml) ? childText(xml, "xr:ThisNode") : xml["xr:ThisNode"]
  const contained = isXmlElementNode(xml) ? nonEmptyCollection(xml, "xr:ContainedObject") : xml["xr:ContainedObject"]
  const present = Boolean(generated || thisNode || contained)

  for (const item of asArray<InternalInfoXML | XmlElementNode>(generated)) {
    // Категория определяется правилом; старый путь чтения ещё отмечает её для аудита.
    if (isXmlElementNode(item)) {
      const name = xmlAttributeValue(item, "name")
      if (name === undefined) throw new TypeError("GeneratedType: отсутствует name")
      reader.generatedType(name.split(".")[0]!, childText(item, "xr:TypeId"), childText(item, "xr:ValueId"))
    } else {
      void item._category
      reader.generatedType(item._name.split(".")[0]!, item["xr:TypeId"], item["xr:ValueId"])
    }
  }
  if (thisNode !== undefined) reader.thisNode(thisNode)
  for (const item of asArray<InternalInfoContainedObjectXML | XmlElementNode>(contained)) {
    if (isXmlElementNode(item) && isEmptyXmlElement(item)) throw new TypeError("Пустой ContainedObject")
    reader.containedObject(
      isXmlElementNode(item) ? childText(item, "xr:ClassId") : item["xr:ClassId"],
      isXmlElementNode(item) ? childText(item, "xr:ObjectId") : item["xr:ObjectId"],
    )
  }
  return present
}

function childText(node: XmlElementNode, name: string): string | undefined {
  const child = xmlElementChildren(node, name)[0]
  return child === undefined ? undefined : xmlTextValue(child) || undefined
}

function nonEmptyCollection(node: XmlElementNode, name: string): XmlElementNode[] | undefined {
  const children = xmlElementChildren(node, name)
  return children.length === 0 || children.length === 1 && isEmptyXmlElement(children[0]!) ? undefined : children
}

function asArray<T>(value: T | T[] | undefined): T[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value]
}
