import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importTypeDescriptionFromXML } from "~/metadata/commonObjects/typeDescription/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { importBooleanFromXML } from "../boolean/importFromXML"
import { getDefaultsFormAttribute } from "./defaults"
import { ConditionalAppearanceXML, FormAttribute, FormAttributes, FormAttributesXML, FormAttributeXML } from "./types"

export const importFormAttributesFromXML = (
  context: ConfigurationContext,
  xml: FormAttributesXML | undefined
): FormAttributes | undefined => {
  if (!xml) return undefined

  return xml
    .map((item: FormAttributeXML | ConditionalAppearanceXML) => {
      if ("Attribute" in item) {
        return importFormAttributeFromXML(context, item as FormAttributeXML)
      }
      return undefined
    })
    .filter((item): item is FormAttribute => item !== undefined)
}

const importFormAttributeFromXML = (context: ConfigurationContext, xml: FormAttributeXML): FormAttribute => {
  const props = xml.Attribute

  const result: FormAttribute = {} as FormAttribute

  result.name = props._name
  result.id = props._id

  const title = importI8nTextFromXML(context, props.Title)
  if (title !== undefined) result.title = title

  const valueType = importTypeDescriptionFromXML(context, props.Type)
  if (valueType !== undefined) result.valueType = valueType

  const mainAttribute = importBooleanFromXML(context, props.MainAttribute)
  if (mainAttribute !== undefined) result.mainAttribute = mainAttribute

  const storedData = importBooleanFromXML(context, props.StoredData)
  if (storedData !== undefined) result.storedData = storedData

  const use = importUserVisibleFromXML(context, props.Use)
  if (use !== undefined) result.use = use

  const defaults = getDefaultsFormAttribute(context, result)

  return removeDefaults(result, defaults)
}
