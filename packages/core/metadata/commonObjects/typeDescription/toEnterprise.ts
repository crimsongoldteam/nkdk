import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { TypeDescription, TypeDescriptionEnterprise, TypeDescriptionRules } from "./types"

export const exportTypeDescriptionToEnterprise = (params: {
  value: TypeDescription | undefined
}): TypeDescriptionEnterprise | undefined => {
  const { value: typeDescription } = params
  if (!typeDescription) return undefined

  if (!typeDescription) return undefined

  const nonIgnoredTypes = typeDescription.type.filter(
    (type) => !TypeDescriptionRules[type as keyof typeof TypeDescriptionRules]?.ignoreInEnterprise
  )

  if (nonIgnoredTypes.length === 0) return undefined

  const result: TypeDescriptionEnterprise = {
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

registerTypeRule("TypeDescription", "exportToEnterprise", exportTypeDescriptionToEnterprise)
