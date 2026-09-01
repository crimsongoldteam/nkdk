import {
  createConfigurationLanguages,
  type ConfigurationContextFromXML,
} from "@nkdk/runtime"
import type {
  FillValueAlternative,
  FillValueClassification,
  FillValueEffectiveType,
  MetadataItemRule,
  PropertyRule,
  StandardMemberDeclaration,
} from "@nkdk/runtime/rule-kit"
import { importPropertyFromXML } from "@nkdk/runtime/rule-kit"
import { classifyStandardMemberFillValue } from "../../metadata/commonObjects/fillValue/effectiveType"
import { isMetadataRootName } from "../../metadata/commonObjects/metadataTargets/roots"
import { createMetadataExecutionRegistrySets, withMetadataExecutionRegistrySets } from "../../metadata/composition/metadataExecutionContext"
import { metadataRules } from "../../metadata/composition/metadataRules"
import type { MetadataExecutionRegistrySets } from "../../metadata/composition/metadataExecutionContext"
import type { StandardAttributeEnricher, StandardAttributeEnrichment } from "./xmlScanner"
import { normalizeEffectiveType } from "./valueClassification"

type XmlRecord = Record<string, unknown>

interface OwnerBinding {
  readonly ownerKind: string
  readonly rule: MetadataItemRule
}

const context: ConfigurationContextFromXML = {
  version: "2.20",
  languages: createConfigurationLanguages({ default: "ru", registered: ["ru"] }),
  fromXML: { forReference: false },
}

export function createStandardAttributeEnricher(): StandardAttributeEnricher {
  const registries = createMetadataExecutionRegistrySets(metadataRules)
  const ownerBindings = buildOwnerBindings(registries)
  return (params) => withMetadataExecutionRegistrySets(
    registries,
    () => enrichStandardAttribute(params, registries, ownerBindings),
  )
}

function enrichStandardAttribute(
  params: Parameters<StandardAttributeEnricher>[0],
  registries: MetadataExecutionRegistrySets,
  ownerBindings: ReadonlyMap<string, OwnerBinding>,
): StandardAttributeEnrichment {
  const binding = ownerBindings.get(params.ownerXmlKind)
  if (binding === undefined) {
    return unresolvedEnrichment(params.ownerXmlKind, `неизвестный XML-владелец ${params.ownerXmlKind}`)
  }
  const declaration = registries.validation.dataPaths
    .getStandardMembers(binding.ownerKind)
    .find((candidate) => candidate.memberKind === "standardAttribute" && candidate.names.internal === params.internalName)
  if (declaration === undefined || declaration.memberKind !== "standardAttribute") {
    return unresolvedEnrichment(
      binding.ownerKind,
      `для ${binding.ownerKind}.${params.internalName} отсутствует декларация стандартного реквизита`,
    )
  }

  const ownerProperties = importRequiredOwnerProperties(
    params.ownerXml,
    binding.rule,
    declaration,
    registries,
  )
  const effectiveType = effectiveTypeFromDeclaration({
    declaration,
    ownerProperties: ownerProperties.values,
    ownerName: params.ownerName,
    ownerRule: binding.rule,
  })
  const rulesClassification = params.typedValue === undefined
    ? ({ kind: ownerProperties.errors.length === 0 ? "notSpecified" : "unresolved", ...(ownerProperties.errors.length === 0 ? {} : { reason: ownerProperties.errors.join("; ") }) } as FillValueClassification)
    : classifyStandardMemberFillValue({
        declaration,
        value: params.typedValue,
        ownerProperties: ownerProperties.values,
      })

  return {
    ownerKind: binding.ownerKind,
    effectiveType,
    type: normalizeEffectiveType(effectiveType, "rules", declaration),
    rulesClassification,
    rulesEvidence: {
      declaration,
      ...(Object.keys(ownerProperties.values).length === 0 ? {} : { ownerProperties: ownerProperties.values }),
    },
  }
}

function buildOwnerBindings(registries: MetadataExecutionRegistrySets): Map<string, OwnerBinding> {
  const result = new Map<string, OwnerBinding>()
  const rules = Object.values(metadataRules.projectSpecs).map(({ rule }) => rule)
  for (const rule of rules) {
    const xmlRoot = rule.properties.xmlRoot as { readonly container?: unknown } | undefined
    if (typeof xmlRoot?.container !== "string") continue
    const ownerKind = registries.validation.dataPaths.getOwnerKindByItemType(rule.itemType)?.kind
    if (ownerKind !== undefined && !result.has(xmlRoot.container)) {
      result.set(xmlRoot.container, { ownerKind, rule })
    }
  }
  return result
}

function importRequiredOwnerProperties(
  ownerXml: XmlRecord,
  ownerRule: MetadataItemRule,
  declaration: Extract<StandardMemberDeclaration, { memberKind: "standardAttribute" }>,
  registries: MetadataExecutionRegistrySets,
): { readonly values: Record<string, unknown>; readonly errors: readonly string[] } {
  const values: Record<string, unknown> = {}
  const errors: string[] = []
  for (const key of requiredOwnerPropertyKeys(declaration)) {
    const propertyRule = ownerRule.properties[key]
    if (propertyRule === undefined) {
      errors.push(`у ${ownerRule.itemType} отсутствует свойство ${key}`)
      continue
    }
    const raw = valueAtPath(ownerXml, xmlPath(key, propertyRule))
    if (raw === undefined) {
      if (typeof propertyRule.implicitValueYAML !== "function" && propertyRule.implicitValueYAML !== undefined) {
        values[key] = propertyRule.implicitValueYAML
      }
      continue
    }
    const compiled = registries.rules.execution
      .propertyPlan(ownerRule)
      .propertiesByKey.get(key)
    if (
      compiled === undefined ||
      (compiled.atomicConversion === undefined && compiled.operations.importFromXML === undefined)
    ) {
      errors.push(`для ${propertyRule.type} отсутствует XML-преобразователь`)
      continue
    }
    try {
      const imported = importPropertyFromXML({
        context,
        rule: propertyRule,
        value: raw,
        execution: registries.rules.execution,
        compiled,
      })
      if (imported !== undefined) values[key] = imported
    } catch (error) {
      errors.push(`${key}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  return { values, errors }
}

function requiredOwnerPropertyKeys(
  declaration: Extract<StandardMemberDeclaration, { memberKind: "standardAttribute" }>,
): readonly string[] {
  const result = new Set<string>()
  if ("property" in declaration && typeof declaration.property === "string") result.add(declaration.property)
  const policy = declaration.fillValue
  if (policy?.policy === "codeFromOwner") {
    result.add(policy.typeProperty)
    result.add(policy.lengthProperty)
    result.add(policy.allowedLengthProperty)
  } else if (policy?.policy === "stringFromOwner") {
    result.add(policy.lengthProperty)
  } else if (policy?.policy === "ownerReference") {
    result.add(policy.ownersProperty)
  }
  return [...result]
}

function effectiveTypeFromDeclaration(params: {
  readonly declaration: Extract<StandardMemberDeclaration, { memberKind: "standardAttribute" }>
  readonly ownerProperties: Readonly<Record<string, unknown>>
  readonly ownerName?: string
  readonly ownerRule: MetadataItemRule
}): FillValueEffectiveType {
  const { declaration, ownerProperties } = params
  const policy = declaration.fillValue
  if (policy?.policy === "codeFromOwner") {
    return codeEffectiveType(
      ownerProperties[policy.typeProperty],
      ownerProperties[policy.lengthProperty],
      ownerProperties[policy.allowedLengthProperty],
    )
  }
  if (policy?.policy === "stringFromOwner") {
    const length = ownerProperties[policy.lengthProperty]
    return typeof length === "number"
      ? known({ kind: "string", length, allowedLength: "Variable" })
      : unresolved(`не определена длина строки ${policy.lengthProperty}`)
  }
  if (policy?.policy === "ownerReference") {
    return referenceAlternatives(ownerProperties[policy.ownersProperty])
  }

  switch (declaration.family) {
    case "primitive": return primitiveEffectiveType(declaration.kind)
    case "sameOwnerObject": {
      const root = metadataRoot(params.ownerRule)
      return root === undefined || params.ownerName === undefined
        ? unresolved("не удалось определить ссылочный тип владельца")
        : known(referenceAlternative(root, params.ownerName))
    }
    case "codeByProperty":
    case "numberByProperty":
      return scalarTypeFromOwnerProperty(ownerProperties[declaration.property])
    case "objectRefFromProperty":
    case "objectRefsFromProperty":
      return referenceAlternatives(ownerProperties[declaration.property])
    case "unsupported": return unresolved(declaration.reason)
    default: return unresolved(`тип стандартного реквизита семейства ${declaration.family} пока не поддержан исследованием`)
  }
}

function primitiveEffectiveType(kind: "boolean" | "string" | "dateTime" | "number"): FillValueEffectiveType {
  switch (kind) {
    case "string": return known({ kind: "string" })
    case "number": return known({ kind: "number" })
    case "boolean": return known({ kind: "boolean" })
    case "dateTime": return known({ kind: "dateTime", dateFractions: "DateTime" })
  }
}

function codeEffectiveType(type: unknown, length: unknown, allowedLength: unknown): FillValueEffectiveType {
  if (typeof length !== "number") return unresolved("не определена длина кода или номера")
  if (type === "String" || type === "Строка") {
    return known({
      kind: "string",
      length,
      allowedLength: allowedLength === "Fixed" || allowedLength === "Фиксированная" ? "Fixed" : "Variable",
    })
  }
  if (type === "Number" || type === "Число") {
    return known({ kind: "number", digits: length, fractionDigits: 0, allowedSign: "Nonnegative" })
  }
  return unresolved("не определён тип кода или номера")
}

function scalarTypeFromOwnerProperty(value: unknown): FillValueEffectiveType {
  if (value === "String" || value === "Строка") return known({ kind: "string" })
  if (value === "Number" || value === "Число") return known({ kind: "number" })
  return unresolved("не определён скалярный тип из свойства владельца")
}

function referenceAlternatives(value: unknown): FillValueEffectiveType {
  const links = Array.isArray(value) ? value : [value]
  const alternatives = links.flatMap((link): FillValueAlternative[] => {
    if (typeof link !== "string") return []
    const separator = link.indexOf(".")
    if (separator < 1) return []
    const root = link.slice(0, separator)
    const objectName = link.slice(separator + 1)
    return isMetadataRootName(root) && objectName !== ""
      ? [referenceAlternative(root, objectName)]
      : []
  })
  return alternatives.length === 0
    ? unresolved("не удалось определить ссылочные типы из свойства владельца")
    : { status: "known", alternatives, composite: alternatives.length > 1 }
}

function referenceAlternative(
  root: Parameters<typeof isMetadataRootName>[0] & string,
  objectName: string,
): FillValueAlternative {
  if (!isMetadataRootName(root)) throw new Error(`Неизвестный корень metadata ${root}`)
  return {
    kind: "reference",
    constraint: {
      kind: "value",
      roots: [root],
      valueKinds: ["predefinedValue", "enumValue", "emptyRef"],
      allowEmptyRef: true,
    },
    objectName,
  }
}

function metadataRoot(rule: MetadataItemRule): ReturnType<typeof metadataRootValue> {
  return metadataRootValue(rule.metadataTargetOwner)
}

function metadataRootValue(value: MetadataItemRule["metadataTargetOwner"]): import("../../metadata/commonObjects/metadataTargets/types").MetadataRootName | undefined {
  return value?.kind === "self" ? value.root : undefined
}

function known(alternative: FillValueAlternative): FillValueEffectiveType {
  return { status: "known", alternatives: [alternative], composite: false }
}

function unresolved(reason: string): FillValueEffectiveType {
  return { status: "unresolved", reason }
}

function unresolvedEnrichment(ownerKind: string, reason: string): StandardAttributeEnrichment {
  const effectiveType = unresolved(reason)
  return {
    ownerKind,
    effectiveType,
    type: normalizeEffectiveType(effectiveType, "unresolved"),
    rulesClassification: { kind: "unresolved", reason },
  }
}

function xmlPath(key: string, rule: PropertyRule): readonly string[] {
  return [...(rule.xmlParents ?? []), rule.xml ?? `${key.charAt(0).toUpperCase()}${key.slice(1)}`]
}

function valueAtPath(source: unknown, path: readonly string[]): unknown {
  let current = source
  for (const segment of path) {
    if (typeof current !== "object" || current === null || Array.isArray(current)) return undefined
    current = (current as XmlRecord)[segment]
  }
  return current
}
