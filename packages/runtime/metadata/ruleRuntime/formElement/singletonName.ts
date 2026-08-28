import type {
  ConfigurationContextFromXML,
  ConfigurationContextWithExportToXML,
} from "../../context/types"
import { markYAMLScalarTag, yamlScalarTagAt } from "../../../yaml/scalarTags"

const REFERENCE_NAME_MODE = Symbol("referenceNameMode")

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

export type ReferenceNameMode = { kind: "suffix"; suffix: string } | { kind: "exact"; name: string }

type ReferenceNameModeCarrier = {
  [REFERENCE_NAME_MODE]?: ReferenceNameMode
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

export const attachReferenceNameMode = <T extends object>(params: {
  model: T
  xmlName: string | undefined
  ownerXmlName?: string
  nameStyle: SingletonNameStyle | undefined
}): T => {
  const { model, xmlName, ownerXmlName, nameStyle } = params
  const mode = getModeFromXML({ xmlName, ownerXmlName, nameStyle })
  if (mode === undefined) return model

  Object.defineProperty(model, REFERENCE_NAME_MODE, {
    value: mode,
    enumerable: false,
    configurable: true,
  })

  return model
}

export const attachReferenceNameSuffix = <T extends object>(params: {
  model: T
  xmlName: string | undefined
  nameStyle: SingletonNameStyle | undefined
}): T => attachReferenceNameMode(params)

export const getReferenceNameMode = (referenceElement: unknown): ReferenceNameMode | undefined => {
  if (referenceElement === null || referenceElement === undefined || typeof referenceElement !== "object") {
    return undefined
  }

  return (referenceElement as ReferenceNameModeCarrier)[REFERENCE_NAME_MODE]
}

export const getReferenceNameSuffix = (referenceElement: unknown): string | undefined => {
  const mode = getReferenceNameMode(referenceElement)
  return mode?.kind === "suffix" ? mode.suffix : undefined
}

export const applyReferenceNameMode = (params: {
  generatedName: string
  referenceElement: unknown
  nameStyle: SingletonNameStyle | undefined
}): string => {
  const { generatedName, referenceElement, nameStyle } = params
  if (nameStyle === undefined) return generatedName

  const mode = getReferenceNameMode(referenceElement)
  if (mode === undefined) return generatedName
  if (mode.kind === "exact") return mode.name
  if (!generatedName.endsWith(nameStyle.canonicalSuffix)) return generatedName

  const baseName = generatedName.slice(0, generatedName.length - nameStyle.canonicalSuffix.length)
  return `${baseName}${mode.suffix}`
}

export const applyReferenceNameSuffix = applyReferenceNameMode

const getModeFromXML = (params: {
  xmlName: string | undefined
  ownerXmlName: string | undefined
  nameStyle: SingletonNameStyle | undefined
}): ReferenceNameMode | undefined => {
  const { xmlName, ownerXmlName, nameStyle } = params
  if (xmlName === undefined || nameStyle === undefined) return undefined
  if (xmlName === "") return { kind: "exact", name: "" }

  const suffixes = [...nameStyle.referenceSuffixes].sort((left, right) => right.length - left.length)

  if (ownerXmlName !== undefined) {
    const standardSuffix = suffixes.find((suffix) => xmlName === `${ownerXmlName}${suffix}`)
    return standardSuffix !== undefined ? { kind: "suffix", suffix: standardSuffix } : { kind: "exact", name: xmlName }
  }

  const suffix = suffixes.find((candidate) => xmlName.endsWith(candidate))
  return suffix === undefined ? undefined : { kind: "suffix", suffix }
}
