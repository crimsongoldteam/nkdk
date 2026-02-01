import { ConfigurationContext } from "../../context/types"
import { TypeDescription, TypeDescriptionPreview, TypeDescriptionRules } from "./types"

export const exportTypeDescriptionToPreview = (
  _context: ConfigurationContext,
  typeDescription: TypeDescription | undefined
): TypeDescriptionPreview | undefined => {
  if (!typeDescription) return undefined

  // Filter out ignored types (complex types like CatalogRef, DocumentRef, etc.)
  const nonIgnoredTypes = typeDescription.type.filter(
    (type) => !TypeDescriptionRules[type as keyof typeof TypeDescriptionRules]?.ignoreInPreview
  )

  // If all types were ignored, return undefined
  if (nonIgnoredTypes.length === 0) return undefined

  const result: TypeDescriptionPreview = {
    Type: nonIgnoredTypes,
  }

  if (typeDescription.stringQualifiers) {
    result.StringQualifiers = {
      Length: typeDescription.stringQualifiers.length,
      AllowedLength: typeDescription.stringQualifiers.allowedLength,
    }
  }

  if (typeDescription.numberQualifiers) {
    result.NumberQualifiers = {
      Digits: typeDescription.numberQualifiers.digits,
      FractionDigits: typeDescription.numberQualifiers.fractionDigits,
      AllowedSign: typeDescription.numberQualifiers.allowedSign,
    }
  }

  if (typeDescription.dateQualifiers) {
    result.DateQualifiers = {
      DateFractions: typeDescription.dateQualifiers.dateFractions,
    }
  }

  return result
}
