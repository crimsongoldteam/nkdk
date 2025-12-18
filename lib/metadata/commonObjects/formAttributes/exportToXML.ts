import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportTypeDescriptionToXML } from "~/lib/metadata/commonObjects/typeDescription/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { FormAttribute, FormAttributeXML } from "./types"

export default function exportAttributeToXML(
  attribute: FormAttribute | undefined,
  configurationSettings: ConfigurationSettings
): FormAttributeXML | undefined {
  if (!attribute) return undefined

  return {
    Attribute: {
      _name: attribute.name,
      _id: attribute.id,
      Title: exportI8nTextToXML(attribute.title, configurationSettings),
      Type: exportTypeDescriptionToXML(attribute.valueType, configurationSettings),
      MainAttribute: attribute.mainAttribute,
      StoredData: attribute.storedData,
      Use: exportUserVisibleToXML(attribute.use, configurationSettings),
    },
  }
}
