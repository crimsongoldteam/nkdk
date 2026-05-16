const MIN_MAX_VALUE_XSI_TYPE: unique symbol = Symbol("minMaxValueXsiType")

export type MinMaxValueXsiType = "xs:string" | "xs:decimal"

export type MinMaxValueReference = Number & { [MIN_MAX_VALUE_XSI_TYPE]?: MinMaxValueXsiType }

export const attachMinMaxValueXsiType = (value: number, xsiType: MinMaxValueXsiType): MinMaxValueReference => {
  const referenceValue = new Number(value) as MinMaxValueReference

  Object.defineProperty(referenceValue, MIN_MAX_VALUE_XSI_TYPE, {
    value: xsiType,
    enumerable: false,
  })

  return referenceValue
}

export const getMinMaxValueXsiType = (value: unknown): MinMaxValueXsiType | undefined => {
  if (value === undefined || value === null) return undefined
  if (typeof value !== "object") return undefined

  return (value as MinMaxValueReference)[MIN_MAX_VALUE_XSI_TYPE]
}
