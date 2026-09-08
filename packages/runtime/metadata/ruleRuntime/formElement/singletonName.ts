import type {
  ConfigurationContextFromXML,
  ConfigurationContextWithExportToXML,
} from "../../context/types"
import { markYAMLScalarTag, yamlScalarTagAt } from "../../../yaml/scalarTags"

declare module "../../context/types" {
  interface FromXMLConfigurationContext {
    formElementNameVariant?: number
  }

  interface ToXMLConfigurationContext {
    formElementNameVariant?: number
  }
}

export type SingletonNameStyle = {
  canonicalSuffix: string
  referenceSuffixes: readonly string[]
  canonicalNameMode: "fixed" | "ownerSuffix"
  explicitXMLName?: true
}

export const getCanonicalSingletonName = (params: {
  ownerLogicalAddress: string
  nameStyle: SingletonNameStyle | undefined
}): string | undefined => {
  return getSingletonName({ ...params, variant: 0 })
}

export const getSingletonName = (params: {
  ownerLogicalAddress: string
  nameStyle: SingletonNameStyle | undefined
  variant: number | undefined
}): string | undefined => {
  const { ownerLogicalAddress, nameStyle, variant } = params
  if (nameStyle === undefined) return undefined
  const suffix = nameStyle.referenceSuffixes[variant ?? 0] ?? nameStyle.canonicalSuffix
  if (nameStyle.canonicalNameMode === "fixed") return suffix

  const ownerName = ownerLogicalAddress.slice(ownerLogicalAddress.lastIndexOf(".") + 1)
  if (ownerName.length === 0 || /^.+\[\d+\]$/.test(ownerName)) return undefined
  return `${ownerName}${suffix}`
}

export const getSingletonNameVariant = (params: {
  xmlName: string | undefined
  ownerXmlName: string | undefined
  nameStyle: SingletonNameStyle | undefined
}): number => {
  const { xmlName, ownerXmlName, nameStyle } = params
  if (xmlName === undefined || nameStyle === undefined) return 0

  const index = nameStyle.referenceSuffixes.findIndex((suffix) =>
    nameStyle.canonicalNameMode === "fixed"
      ? xmlName === suffix
      : ownerXmlName !== undefined && xmlName === `${ownerXmlName}${suffix}`,
  )
  return index < 0 ? 0 : index
}

export const withSingletonNameVariantFromXML = (
  context: ConfigurationContextFromXML,
  variant: number,
): ConfigurationContextFromXML => ({
  ...context,
  fromXML: { ...context.fromXML, formElementNameVariant: variant },
})

export const withSingletonNameVariantToXML = (
  context: ConfigurationContextWithExportToXML,
  variant: number,
): ConfigurationContextWithExportToXML => ({
  ...context,
  exportToXML: { ...context.exportToXML, formElementNameVariant: variant },
})

export const attachExplicitSingletonName = (params: {
  yaml: Record<string, unknown>
  xmlName: string | undefined
  generatedName: string | undefined
  nameStyle: SingletonNameStyle | undefined
}): void => {
  const { yaml, xmlName, generatedName, nameStyle } = params
  if (nameStyle?.explicitXMLName !== true || xmlName === undefined || xmlName === generatedName) return

  yaml.Имя = xmlName
  markYAMLScalarTag(yaml, "Имя", "xml/name")
}

export const resolveExplicitSingletonName = (params: {
  yaml: unknown
  generatedName: string | undefined
  nameStyle: SingletonNameStyle | undefined
}): string | undefined => {
  const { yaml, generatedName, nameStyle } = params
  if (nameStyle?.explicitXMLName !== true || yaml === null || typeof yaml !== "object") return generatedName
  if (!("Имя" in yaml)) return generatedName

  const name = (yaml as Record<string, unknown>).Имя
  if (yamlScalarTagAt(yaml, "Имя") !== "xml/name") {
    throw new TypeError("Явное XML-имя singleton должно быть помечено тегом !xml/name")
  }
  if (typeof name !== "string") throw new TypeError("Тег !xml/name поддерживает только строковое значение")
  return name
}
