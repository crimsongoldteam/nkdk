import type { ImportAssignmentRole, XmlImportRoute } from "./types"
import type { ProjectResourceSource } from "../orchestration/property/fn"
import { getTypeRule } from "../orchestration/property/typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "../orchestration/property/types"
import { configurationMetadataProjectSpec, metadataProjectSpecs, type MetadataProjectSpec } from "../project/specs"

interface CompileContext {
  xmlBase: string
  targetBase: string
  assignmentTargetPattern: string
  assignmentRole: ImportAssignmentRole
  itemType: string
  currentNameParameter: string
  parentNameParameter: string | undefined
  nextNameIndex: number
}

export function describeRegisteredXmlImportRoutes(): readonly XmlImportRoute[] {
  const routes: XmlImportRoute[] = []
  collectSpecRoutes(routes, configurationMetadataProjectSpec)
  for (const spec of metadataProjectSpecs) collectSpecRoutes(routes, spec)
  return deduplicateRoutes(routes)
}

export function matchImportPattern(pattern: string, path: string): Record<string, string> | undefined {
  const patternParts = pattern.split("/")
  const pathParts = path.split("/")
  const values: Record<string, string> = {}
  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index]
    const rest = patternPart.match(/^\{([^}]+)\.\.\.\}$/)
    if (rest !== null) {
      if (index !== patternParts.length - 1 || index >= pathParts.length) return undefined
      values[rest[1]] = pathParts.slice(index).join("/")
      return values
    }
    if (index >= pathParts.length) return undefined
    const segmentValues = matchPatternSegment(patternPart, pathParts[index])
    if (segmentValues === undefined) {
      return undefined
    }
    for (const [key, value] of Object.entries(segmentValues)) {
      const previous = values[key]
      if (previous !== undefined && previous !== value) return undefined
      values[key] = value
    }
  }
  return patternParts.length === pathParts.length ? values : undefined
}

function matchPatternSegment(pattern: string, value: string): Record<string, string> | undefined {
  const keys = [...pattern.matchAll(/\{([^}]+)\}/g)].map((match) => match[1])
  if (keys.length === 0) return pattern === value ? {} : undefined
  const expression = new RegExp(
    `^${pattern
      .split(/\{[^}]+\}/g)
      .map(escapeRegExp)
      .join("(.+)")}$`
  )
  const match = value.match(expression)
  if (match === null) return undefined
  return Object.fromEntries(keys.map((key, index) => [key, match[index + 1]]))
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function expandImportPattern(pattern: string, values: Readonly<Record<string, string>>): string {
  return pattern.replace(/\{([^}]+?)(?:\.\.\.)?\}/g, (placeholder, key: string) => values[key] ?? placeholder)
}

function collectSpecRoutes(routes: XmlImportRoute[], spec: MetadataProjectSpec): void {
  if (spec.dir === "") {
    const assignmentTargetPattern = "Конфигурация.yaml"
    routes.push({
      kind: "assignment",
      xmlPattern: "Configuration.xml",
      targetPattern: assignmentTargetPattern,
      role: "configuration",
      itemType: spec.rule.itemType,
      source: itemRuleSource(spec.rule),
    })
    collectRuleRoutes(routes, spec.rule, {
      xmlBase: "",
      targetBase: "",
      assignmentTargetPattern,
      assignmentRole: "configuration",
      itemType: spec.rule.itemType,
      currentNameParameter: "ownerName",
      parentNameParameter: undefined,
      nextNameIndex: 1,
    })
    return
  }

  if (typeof spec.rule.xmlDir !== "string") return
  const xmlBase = `${spec.rule.xmlDir}/{ownerName}`
  const targetBase = `${spec.dir}/{ownerName}`
  const assignmentTargetPattern = `${targetBase}/Свойства.yaml`
  routes.push({
    kind: "assignment",
    xmlPattern: `${xmlBase}.xml`,
    targetPattern: assignmentTargetPattern,
    role: "properties",
    itemType: spec.rule.itemType,
    source: itemRuleSource(spec.rule),
  })
  collectRuleRoutes(routes, spec.rule, {
    xmlBase,
    targetBase,
    assignmentTargetPattern,
    assignmentRole: "properties",
    itemType: spec.rule.itemType,
    currentNameParameter: "ownerName",
    parentNameParameter: undefined,
    nextNameIndex: 1,
  })
}

function collectRuleRoutes(routes: XmlImportRoute[], rule: MetadataItemRule, context: CompileContext): void {
  for (const [propertyName, propertyRule] of Object.entries(rule.properties) as Array<[string, PropertyRule]>) {
    const declarations = getTypeRule(propertyRule.type, "xmlImportRoutes")?.({ propertyRule }) ?? []
    for (const declaration of declarations) {
      routes.push(compilePropertyRoute(declaration, propertyName, propertyRule, context))
    }
  }

  for (const childCollection of rule.childCollections ?? []) {
    const childNameParameter = nameParameter(context.nextNameIndex)
    if (childCollection.fileItemRule && childCollection.xmlDir && childCollection.nkdkDir) {
      const childXmlBase = joinPattern(
        context.xmlBase,
        pathValueToPattern(childCollection.xmlDir, childNameParameter, context.currentNameParameter)
      )
      const childTargetBase = joinPattern(
        context.targetBase,
        pathValueToPattern(childCollection.nkdkDir, childNameParameter, context.currentNameParameter)
      )
      const childAssignmentTarget = `${childTargetBase}/Свойства.yaml`
      routes.push({
        kind: "assignment",
        xmlPattern: `${childXmlBase}.xml`,
        targetPattern: childAssignmentTarget,
        role: "fileItem",
        itemType: childCollection.fileItemRule.itemType,
        source: itemRuleSource(childCollection.fileItemRule),
      })
      collectRuleRoutes(routes, childCollection.itemRule, {
        xmlBase: childXmlBase,
        targetBase: childTargetBase,
        assignmentTargetPattern: childAssignmentTarget,
        assignmentRole: "fileItem",
        itemType: childCollection.fileItemRule.itemType,
        currentNameParameter: childNameParameter,
        parentNameParameter: context.currentNameParameter,
        nextNameIndex: context.nextNameIndex + 1,
      })
      continue
    }

    collectRuleRoutes(routes, childCollection.itemRule, {
      ...context,
      currentNameParameter: childNameParameter,
      parentNameParameter: context.currentNameParameter,
      nextNameIndex: context.nextNameIndex + 1,
    })
  }
}

function compilePropertyRoute(
  declaration: XmlImportRoute,
  propertyName: string,
  propertyRule: PropertyRule,
  context: CompileContext
): XmlImportRoute {
  const xmlPattern = joinPatternWithOverlap(context.xmlBase, substituteLocalParameters(declaration.xmlPattern, context))
  const source = propertySource(declaration.source, propertyName, propertyRule)
  if (declaration.kind === "ignore") return { ...declaration, xmlPattern, source }

  const targetPattern =
    declaration.targetPattern === ""
      ? context.assignmentTargetPattern
      : joinPattern(context.targetBase, substituteLocalParameters(declaration.targetPattern, context))
  if (declaration.kind === "assignment") {
    return {
      ...declaration,
      xmlPattern,
      targetPattern,
      role: declaration.targetPattern === "" ? context.assignmentRole : declaration.role,
      itemType: declaration.itemType === "" ? context.itemType : declaration.itemType,
      source,
    }
  }

  const assignmentTargetPattern =
    declaration.assignmentTargetPattern === ""
      ? context.assignmentTargetPattern
      : joinPattern(context.targetBase, substituteLocalParameters(declaration.assignmentTargetPattern, context))
  return { ...declaration, xmlPattern, targetPattern, assignmentTargetPattern, source }
}

function substituteLocalParameters(pattern: string, context: CompileContext): string {
  return pattern.replace(/\{(ownerName|itemName|currentName|parentName)(\.\.\.)?\}/g, (_placeholder, key, rest) => {
    const parameter =
      key === "itemName"
        ? nameParameter(context.nextNameIndex)
        : key === "parentName"
          ? (context.parentNameParameter ?? context.currentNameParameter)
          : context.currentNameParameter
    return `{${parameter}${rest ?? ""}}`
  })
}

function pathValueToPattern(
  value: string | ((params: { name: string; parentName?: string }) => string),
  nameKey: string,
  parentNameKey: string
): string {
  if (typeof value === "string") return value
  const nameSentinel = "__NKDK_IMPORT_NAME__"
  const parentSentinel = "__NKDK_IMPORT_PARENT_NAME__"
  return value({ name: nameSentinel, parentName: parentSentinel })
    .split(nameSentinel)
    .join(`{${nameKey}}`)
    .split(parentSentinel)
    .join(`{${parentNameKey}}`)
}

function propertySource(
  source: ProjectResourceSource,
  propertyName: string,
  propertyRule: PropertyRule
): ProjectResourceSource {
  return source.kind === "propertyType" ? { kind: "property", propertyName, propertyType: propertyRule.type } : source
}

function itemRuleSource(rule: MetadataItemRule): ProjectResourceSource {
  return { kind: "itemRule", itemType: rule.itemType }
}

function nameParameter(index: number): string {
  return index === 1 ? "itemName" : `itemName${index}`
}

function joinPattern(...parts: string[]): string {
  return parts
    .filter((part) => part.length > 0)
    .join("/")
    .replace(/\/{2,}/g, "/")
}

function joinPatternWithOverlap(base: string, relativePath: string): string {
  const baseParts = base.split("/").filter((part) => part.length > 0)
  const relativeParts = relativePath.split("/").filter((part) => part.length > 0)
  const maxOverlap = Math.min(baseParts.length, relativeParts.length)
  for (let overlap = maxOverlap; overlap > 0; overlap -= 1) {
    if (baseParts.slice(-overlap).every((part, index) => part === relativeParts[index])) {
      return [...baseParts, ...relativeParts.slice(overlap)].join("/")
    }
  }
  return [...baseParts, ...relativeParts].join("/")
}

function deduplicateRoutes(routes: readonly XmlImportRoute[]): XmlImportRoute[] {
  const seen = new Set<string>()
  return routes.filter((route) => {
    const key = JSON.stringify(route)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
