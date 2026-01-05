import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportTypeDescriptionToXML } from "~/metadata/commonObjects/typeDescription/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { FormAttribute, FormAttributeXML } from "./types"

export default function exportAttributeToXML(
  context: ConfigurationContext,
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
