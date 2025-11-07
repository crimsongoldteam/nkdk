import { exportTypeDescriptionToXML } from "~/lib/metadata/commonObjects/typeDescription/exportToXML"
import { TAttribute, TAttributeXML } from "../types"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportI8nTextToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"

export default function exportAttributeToXML(attribute: TAttribute | undefined): TAttributeXML | undefined {
  if (!attribute) return undefined

  return {
    Attribute: {
      _name: attribute.name,
      _id: attribute.id,
      Title: exportI8nTextToXML(attribute.title),
      Type: exportTypeDescriptionToXML(attribute.type),
      MainAttribute: attribute.mainAttribute,
      StoredData: attribute.storedData,
      Use: exportUserVisibleToXML(attribute.use),
    },
  }
}

