import type {
  CompileAtomicConversionFunction,
  CompiledAtomicConversion,
} from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { NumberPropertyRule } from "./types"

const empty = Object.freeze({ metadataValue: undefined, representationValue: undefined })

export const compileNumberAtomicConversion: CompileAtomicConversionFunction = ({ rule }) => {
  const typedXML = (rule as NumberPropertyRule).typedXML
  const xsiType = typedXML === true ? "xs:decimal" : typedXML

  return Object.freeze({
    fromXMLToYAML: ({ value }) => {
      if (value === undefined) return empty
      if (typeof value === "object" && value !== null) {
        const xsiType = (value as Record<string, unknown>)["_xsi:type"]
        if (
          (xsiType === "xs:decimal" || xsiType === "xs:integer" ||
            xsiType === "xs:double" || xsiType === "xs:float") &&
          (value as Record<string, unknown>)["#text"] === undefined
        ) return empty
      }
      const raw = typeof value === "object" && value !== null && "#text" in value
        ? (value as Record<string, unknown>)["#text"]
        : value
      if (raw === undefined || raw === "") return empty
      const metadataValue = typeof raw === "number" ? raw : Number(raw)
      return { metadataValue, representationValue: metadataValue }
    },
    fromYAMLToXML: ({ value }) => {
      if (value === undefined) return empty
      return {
        metadataValue: value,
        representationValue: xsiType === undefined
          ? value
          : { "_xsi:type": xsiType, "#text": String(value) },
      }
    },
  } satisfies CompiledAtomicConversion)
}

export const metadataPropertyRule000 = definePropertyTypeRule(
  "number",
  "compileAtomicConversion",
  compileNumberAtomicConversion,
)
