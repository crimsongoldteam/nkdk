import type {
  CompileAtomicConversionFunction,
  CompiledAtomicConversion,
} from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { readStringXML } from "./xmlValue"

const empty = Object.freeze({ metadataValue: undefined, representationValue: undefined })

export const compileStringAtomicConversion: CompileAtomicConversionFunction = () => Object.freeze({
  fromXMLToYAML: ({ value }) => {
    const metadataValue = readStringXML(value)
    if (metadataValue === undefined) return empty
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
