const REFERENCE_NAME_SUFFIX = Symbol("referenceNameSuffix")

export type SingletonNameStyle = {
  canonicalSuffix: string
  referenceSuffixes: readonly string[]
}

type ReferenceNameSuffixCarrier = {
  [REFERENCE_NAME_SUFFIX]?: string
}

export const attachReferenceNameSuffix = <T extends object>(params: {
  model: T
  xmlName: string | undefined
  nameStyle: SingletonNameStyle | undefined
}): T => {
  const { model, xmlName, nameStyle } = params
  const referenceSuffix = getKnownSuffix(xmlName, nameStyle)
  if (referenceSuffix === undefined) return model

  Object.defineProperty(model, REFERENCE_NAME_SUFFIX, {
    value: referenceSuffix,
    enumerable: false,
    configurable: true,
  })

  return model
}

export const getReferenceNameSuffix = (referenceElement: unknown): string | undefined => {
  if (referenceElement === null || referenceElement === undefined || typeof referenceElement !== "object") {
    return undefined
  }

  return (referenceElement as ReferenceNameSuffixCarrier)[REFERENCE_NAME_SUFFIX]
}

export const applyReferenceNameSuffix = (params: {
  generatedName: string
  referenceElement: unknown
  nameStyle: SingletonNameStyle | undefined
}): string => {
  const { generatedName, referenceElement, nameStyle } = params
  if (nameStyle === undefined) return generatedName

  const referenceSuffix = getReferenceNameSuffix(referenceElement)
  if (referenceSuffix === undefined) return generatedName
  if (!generatedName.endsWith(nameStyle.canonicalSuffix)) return generatedName

  const baseName = generatedName.slice(0, generatedName.length - nameStyle.canonicalSuffix.length)
  return `${baseName}${referenceSuffix}`
}

const getKnownSuffix = (
  xmlName: string | undefined,
  nameStyle: SingletonNameStyle | undefined
): string | undefined => {
  if (xmlName === undefined || nameStyle === undefined) return undefined

  return [...nameStyle.referenceSuffixes]
    .sort((left, right) => right.length - left.length)
    .find((suffix) => xmlName.endsWith(suffix))
}
