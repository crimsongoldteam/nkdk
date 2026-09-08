import type {
  CompileAtomicConversionFunction,
  CompiledAtomicConversion,
} from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../ruleRuntime/property/typeRuleRegistry"
import * as SE from "./types"
import { systemEnumerationXMLAliases } from "./xmlAliases"
import { readSystemEnumerationXMLText } from "./xmlValue"

type EnumerationTables = Record<string, Readonly<Record<string, string>> | undefined>
type XMLAliases = Record<string, {
  readonly toXML?: Readonly<Record<string, string>>
  readonly fromXML?: Readonly<Record<string, string>>
} | undefined>

const tables = SE as unknown as EnumerationTables
const aliases = systemEnumerationXMLAliases as unknown as XMLAliases
const empty = Object.freeze({ metadataValue: undefined, representationValue: undefined })

export const compileSystemEnumerationAtomicConversion: CompileAtomicConversionFunction = ({ rule }) => {
  const type = (rule as SE.SystemEnumerationPropertyRule).typeSE
  const fromYAML = tables[`${type}FromYAML`]
  const toYAML = tables[`${type}ToYAML`]
  if (fromYAML === undefined || toYAML === undefined) {
    throw new Error(`Enumeration ${type} not found`)
  }
  const fromXMLAlias = aliases[type]?.fromXML
  const toXMLAlias = aliases[type]?.toXML

  return Object.freeze({
    fromXMLToYAML: ({ value }) => {
      const raw = readSystemEnumerationXMLText(value)
      if (raw === undefined) return empty
      const metadataValue = fromXMLAlias?.[raw] ?? raw
      return {
        metadataValue,
        representationValue: toYAML[metadataValue],
      }
    },
    fromYAMLToXML: ({ value }) => {
      if (typeof value !== "string") return empty
      const metadataValue = fromYAML[value] ?? (
        Object.prototype.hasOwnProperty.call(toYAML, value) ? value : undefined
      )
      if (metadataValue === undefined) return empty
      return {
        metadataValue,
        representationValue: toXMLAlias?.[metadataValue] ?? metadataValue,
      }
    },
  } satisfies CompiledAtomicConversion)
}

export const metadataPropertyRule000 = definePropertyTypeRule(
  "SystemEnumeration",
  "compileAtomicConversion",
  compileSystemEnumerationAtomicConversion,
)
