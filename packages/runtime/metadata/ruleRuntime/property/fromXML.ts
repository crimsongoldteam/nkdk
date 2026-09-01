import type { ConfigurationContextFromXML } from "../../context/types"
import { getValueOrDefault } from "./helpers"
import { getTypeRule } from "./typeRuleRegistry"
import type { PropertyRule } from "./types"
import type { ImportFromXMLFunction, PropertyRuleExecution } from "./fn"
import type { CompiledProperty } from "./compiledPropertyPlan"
import { resolveAtomicConversion } from "./atomicConversion"

export const importPropertyFromXML = (params: {
  context: ConfigurationContextFromXML
  rule: PropertyRule
  value: unknown
  name?: string
  ownerXmlName?: string
  execution?: PropertyRuleExecution
  compiled?: CompiledProperty
}): unknown => {
  const { context, rule, value, name, ownerXmlName, execution, compiled } = params
  if (compiled === undefined && execution !== undefined) {
    const conversion = resolveAtomicConversion({ rule, execution, getTypeRule })
    if (conversion !== undefined) {
      return getValueOrDefault({
        context,
        rule,
        value: conversion.fromXMLToYAML({ context, value }).metadataValue,
        name,
        operation: "importFromXML",
      })
    }
    return execution.fromXML({ context, rule, value, name, ownerXmlName })
  }
  const conversion = resolveAtomicConversion({ rule, execution, compiled, getTypeRule })
  if (conversion !== undefined) {
    return getValueOrDefault({
      context,
      rule,
      value: conversion.fromXMLToYAML({ context, value }).metadataValue,
      name,
      operation: "importFromXML",
    })
  }
  const handler: ImportFromXMLFunction | undefined = compiled === undefined
    ? getTypeRule(rule.type, "importFromXML")
    : compiled.operations.importFromXML
  if (handler === undefined) {
    return getValueOrDefault({ context, rule, value, name, operation: "importFromXML" })
  }
  return getValueOrDefault({
    context,
    rule,
    value: handler(context, rule, value, ownerXmlName, execution),
    name,
    operation: "importFromXML",
  })
}
