const REFERENCE_NAME_MODE = Symbol("referenceNameMode")

export type SingletonNameStyle = {
  canonicalSuffix: string
  referenceSuffixes: readonly string[]
}

export type ReferenceNameMode = { kind: "suffix"; suffix: string } | { kind: "exact"; name: string }

type ReferenceNameModeCarrier = {
  [REFERENCE_NAME_MODE]?: ReferenceNameMode
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
