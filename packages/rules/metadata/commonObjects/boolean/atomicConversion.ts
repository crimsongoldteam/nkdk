import type {
  CompileAtomicConversionFunction,
  CompiledAtomicConversion,
} from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { readBooleanXML } from "./xmlValue"

const xmlTrue = Object.freeze({ metadataValue: true, representationValue: "Истина" })
const xmlFalse = Object.freeze({ metadataValue: false, representationValue: "Ложь" })
const yamlTrue = Object.freeze({ metadataValue: true, representationValue: true })
const yamlFalse = Object.freeze({ metadataValue: false, representationValue: false })
const empty = Object.freeze({ metadataValue: undefined, representationValue: undefined })

const booleanAtomicConversion: CompiledAtomicConversion = Object.freeze({
  fromXMLToYAML: ({ value }: { readonly value: unknown }) => {
    const raw = readBooleanXML(value)
    return raw === true
      ? xmlTrue
      : raw === false
        ? xmlFalse
        : empty
  },
  fromYAMLToXML: ({ value }: { readonly value: unknown }) => value === undefined
    ? empty
    : value === true || value === "Истина"
      ? yamlTrue
      : yamlFalse,
})

export const compileBooleanAtomicConversion: CompileAtomicConversionFunction = () => {
  return booleanAtomicConversion
}

export const metadataPropertyRule000 = definePropertyTypeRule(
  "boolean",
  "compileAtomicConversion",
  compileBooleanAtomicConversion,
)
