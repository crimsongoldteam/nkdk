import type {
  CompileAtomicConversionFunction,
  CompiledAtomicConversion,
} from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { NumberPropertyRule } from "./types"
import { readNumberXML } from "./xmlValue"

const empty = Object.freeze({ metadataValue: undefined, representationValue: undefined })

export const compileNumberAtomicConversion: CompileAtomicConversionFunction = ({ rule }) => {
  const typedXML = (rule as NumberPropertyRule).typedXML
  const xsiType = typedXML === true ? "xs:decimal" : typedXML

  return Object.freeze({
    fromXMLToYAML: ({ value }) => {
      const metadataValue = readNumberXML(value)
      if (metadataValue === undefined) return empty
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
