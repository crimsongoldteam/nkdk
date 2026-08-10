import { ConfigurationContextWithExportToXML } from "../../context/types"
import { PropertyRule, definePropertyTypeRule } from "../../ruleRuntime"
import { XDTOTypeName, XDTOTypeNameXML } from "./types"

const XML_SCHEMA_NAMESPACE = "http://www.w3.org/2001/XMLSchema"
const V8_DATA_CORE_NAMESPACE = "http://v8.1c.ru/8.1/data/core"

const prefixForNamespace = (namespace: string, rule: PropertyRule | undefined): string => {
  if (namespace === XML_SCHEMA_NAMESPACE) return "xs"
  if (namespace === V8_DATA_CORE_NAMESPACE) return "v8"
  return rule?.xml === "XDTOValueType" ? "d8p1" : "d6p1"
}

const isBuiltInPrefix = (prefix: string): boolean => prefix === "xs" || prefix === "v8"

export const exportXDTOTypeNameToXML = (
  _context: ConfigurationContextWithExportToXML,
  rule: PropertyRule | undefined,
  value: XDTOTypeName | undefined,
  _referenceValue?: XDTOTypeName | XDTOTypeNameXML
): string | XDTOTypeNameXML | undefined => {
  if (value === undefined) return undefined

  const prefix = prefixForNamespace(value.namespace, rule)
  const text = `${prefix}:${value.name}`

  if (isBuiltInPrefix(prefix)) return text

  return {
    "#text": text,
    [`_xmlns:${prefix}`]: value.namespace,
  }
}

export const metadataPropertyRule000 = definePropertyTypeRule("XDTOTypeName", "exportToXML", exportXDTOTypeNameToXML)
