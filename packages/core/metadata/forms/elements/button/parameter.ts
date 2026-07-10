import { importMetadataItemLinkFromXML } from "../../../commonObjects/metadataRef/fromXML"
import { importMetadataItemLinkFromYAML } from "../../../commonObjects/metadataRef/fromYAML"
import { exportMetadataItemLinkToYAML } from "../../../commonObjects/metadataRef/toYAML"
import {
  MetadataItemLinkJSONSchema,
  type MetadataItemLinkXML,
  type MetadataItemLinkYAML,
} from "../../../commonObjects/metadataRef/types"
import { importTypeDescriptionFromXML } from "../../../commonObjects/typeDescription/fromXML"
import { exportTypeDescriptionToXML } from "../../../commonObjects/typeDescription/toXML"
import type { TypeDescription, TypeDescriptionXMLWithAttribute } from "../../../commonObjects/typeDescription/types"
import type { ConfigurationContext } from "../../../context/types"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import type { PropertyRule } from "../../../orchestration/property/types"

export type ButtonParameter =
  | string
  | {
      typeDescription: TypeDescription
    }

type ButtonParameterXML =
  | MetadataItemLinkXML
  | (TypeDescriptionXMLWithAttribute & {
      "#text"?: string
    })

const isTypeDescriptionParameterXML = (xml: ButtonParameterXML | undefined): xml is TypeDescriptionXMLWithAttribute =>
  typeof xml === "object" && xml?.["_xsi:type"] === "v8:TypeDescription"

const isTypeDescriptionParameter = (
  value: ButtonParameter | undefined
): value is { typeDescription: TypeDescription } =>
  typeof value === "object" && value !== null && "typeDescription" in value

export const importButtonParameterFromXML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  xml: ButtonParameterXML | undefined
): ButtonParameter | undefined => {
  if (xml === undefined) return undefined

  if (isTypeDescriptionParameterXML(xml)) {
    const typeDescription = importTypeDescriptionFromXML(context, rule, xml)
    return typeDescription === undefined ? undefined : { typeDescription }
  }

  return importMetadataItemLinkFromXML(context, rule, xml)
}

export const exportButtonParameterToXML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  value: ButtonParameter | undefined
): ButtonParameterXML | undefined => {
  if (value === undefined) return undefined

  if (isTypeDescriptionParameter(value)) {
    const typeDescription = exportTypeDescriptionToXML(context, rule, value.typeDescription)
    return typeDescription === undefined
      ? undefined
      : {
          "_xsi:type": "v8:TypeDescription",
          ...typeDescription,
        }
  }

  return { "_xsi:type": "xr:MDObjectRef", "#text": value }
}

export const importButtonParameterFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  value: MetadataItemLinkYAML | undefined
): ButtonParameter | undefined => importMetadataItemLinkFromYAML(context, rule, value)

export const exportButtonParameterToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  value: ButtonParameter | undefined
): MetadataItemLinkYAML | undefined =>
  typeof value === "string" ? exportMetadataItemLinkToYAML(context, rule, value) : undefined

registerTypeRule("ButtonParameter", "importFromXML", importButtonParameterFromXML)
registerTypeRule("ButtonParameter", "exportToXML", exportButtonParameterToXML)
registerTypeRule("ButtonParameter", "importFromYAML", importButtonParameterFromYAML)
registerTypeRule("ButtonParameter", "exportToYAML", exportButtonParameterToYAML)
registerTypeRule("ButtonParameter", "exportToJSONSchema", () => MetadataItemLinkJSONSchema)
