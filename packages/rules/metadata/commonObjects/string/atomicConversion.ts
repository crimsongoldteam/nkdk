import type {
  CompileAtomicConversionFunction,
  CompiledAtomicConversion,
} from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"

const empty = Object.freeze({ metadataValue: undefined, representationValue: undefined })

export const compileStringAtomicConversion: CompileAtomicConversionFunction = () => Object.freeze({
  fromXMLToYAML: ({ value }) => {
    if (value === undefined) return empty
    if (typeof value === "object" && value !== null) {
      if (!("#text" in value)) return empty
      const text = (value as Record<string, unknown>)["#text"]
      if (text === undefined) return empty
      const metadataValue = String(text)
      return { metadataValue, representationValue: metadataValue }
    }
    const metadataValue = String(value)
    return { metadataValue, representationValue: metadataValue }
  },
  fromYAMLToXML: ({ value }) => ({
    metadataValue: value,
    representationValue: value,
  }),
} satisfies CompiledAtomicConversion)

export const metadataPropertyRule000 = definePropertyTypeRule(
  "string",
  "compileAtomicConversion",
  compileStringAtomicConversion,
)
