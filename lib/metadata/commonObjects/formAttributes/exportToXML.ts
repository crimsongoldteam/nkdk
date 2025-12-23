import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportTypeDescriptionToXML } from "~/lib/metadata/commonObjects/typeDescription/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/lib/metadata/context/types"
import { FormAttribute, FormAttributeXML } from "./types"

export default function exportAttributeToXML(
  context: Context,
  attribute: FormAttribute | undefined
): FormAttributeXML | undefined {
  if (!attribute) return undefined

  return {
    Attribute: {
      _name: attribute.name,
      _id: attribute.id,
      Title: exportI8nTextToXML(context, attribute.title),
      Type: exportTypeDescriptionToXML(context, attribute.valueType),
      MainAttribute: attribute.mainAttribute,
      StoredData: attribute.storedData,
      Use: exportUserVisibleToXML(context, attribute.use),
    },
  }
}
