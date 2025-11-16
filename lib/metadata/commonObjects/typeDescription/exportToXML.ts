import { TTypeDescription, TTypeDescriptionXML } from "./types"

export const exportTypeDescriptionToXML = (
  typeDescription: TTypeDescription | undefined
): TTypeDescriptionXML | undefined => {
  if (!typeDescription) return undefined

  const result: TTypeDescriptionXML = typeDescription.type.map((type) => ({
    "v8:Type": mapType(type),
  }))

  addStringQualifiers(result, typeDescription.stringQualifiers)
  addNumberQualifiers(result, typeDescription.numberQualifiers)
  addDateQualifiers(result, typeDescription.dateQualifiers)

  return result
}

const mapType = (type: string): string => {
  if (
    type === "string" ||
    type === "decimal" ||
    type === "date" ||
    type === "boolean"
  ) {
    return `xs:${type}`
  }
  if (type.startsWith("EnumRef.")) {
    return `cfg:${type}`
  }
  if (
    type.startsWith("DataProcessorObject.") ||
    type.startsWith("CatalogObject.") ||
    type.startsWith("DocumentObject.") ||
    type.startsWith("BusinessProcessObject.") ||
    type.startsWith("TaskObject.")
  ) {
    return `cfg:${type}`
  }
  return type
}

const addStringQualifiers = (
  result: NonNullable<TTypeDescriptionXML>,
  stringQualifiers: TTypeDescription["stringQualifiers"]
) => {
  if (!stringQualifiers) return
  result.push({
    "v8:StringQualifiers": {
      "v8:Length": stringQualifiers.length,
      "v8:AllowedLength": stringQualifiers.allowedLength,
    },
  })
}

const addNumberQualifiers = (
  result: NonNullable<TTypeDescriptionXML>,
  numberQualifiers: TTypeDescription["numberQualifiers"]
) => {
  if (!numberQualifiers) return
  result.push({
    "v8:NumberQualifiers": {
      "v8:Digits": numberQualifiers.digits,
      "v8:FractionDigits": numberQualifiers.fractionDigits,
      "v8:AllowedSign": numberQualifiers.allowedSign,
    },
  })
}

const addDateQualifiers = (
  result: NonNullable<TTypeDescriptionXML>,
  dateQualifiers: TTypeDescription["dateQualifiers"]
) => {
  if (!dateQualifiers) return
  result.push({
    "v8:DateQualifiers": {
      "v8:DateFractions": dateQualifiers.dateFractions,
    },
  })
}
