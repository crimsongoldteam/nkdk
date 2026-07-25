import type { PropertyRuleType } from "../property/registry"
import type { MetadataItemRule } from "../property/types"
import type { CompiledMetadataResourceTopology } from "../../resourceTopology/types"
import { compileRegisteredMetadataResourceTopology } from "../../resourceTopology/registry"
import { expandMetadataPathPattern } from "../../resourceTopology/patterns"
import { resolveMetadataProjectChangeImpact } from "../../resourceTopology/xmlExportProjection"

export type XmlSyncArea =
  | {
      kind: "owner"
      itemType: MetadataItemRule["itemType"]
      itemTypePrefix: string
      itemName: string
      xmlDir: string
    }
  | {
      kind: "fileItem"
      itemType: MetadataItemRule["itemType"]
      itemTypePrefix: string
      itemName: string
      xmlDir: string
      xmlPath: string
      propertyName: string
      propertyType: PropertyRuleType
      routeParams: Record<string, string>
      compositionImpact: "none" | "configurationComposition"
      dumpInfoNames: string[]
    }
  | {
      kind: "externalFile"
      itemType: MetadataItemRule["itemType"]
      itemTypePrefix: string
      itemName: string
      xmlDir: string
      xmlPath: string
      propertyName?: string
      propertyType?: PropertyRuleType
      routeParams: Record<string, string>
      deleteParentAreaBeforeWrite?: boolean
      dumpInfoNames: string[]
    }

export type SyncAreaDeclaration =
  | { kind: "objectModule"; yamlFile: string; xmlPath: string }
  | { kind: "formModule"; yamlFile: string; xmlPath: string }
  | { kind: "formHelp"; yamlDir: string; xmlBasePath: string }
  | { kind: "templateContent"; yamlFile: string; xmlPath: string }
  | { kind: "commandModule"; yamlFile: string; xmlPath: string }

export function resolveXmlSyncAreaForProjectPath(
  projectPath: string,
  topologyOrLegacyRules?: CompiledMetadataResourceTopology | readonly MetadataItemRule[]
): XmlSyncArea | undefined {
  const topology =
    topologyOrLegacyRules !== undefined && isCompiledTopology(topologyOrLegacyRules)
      ? topologyOrLegacyRules
      : compileRegisteredMetadataResourceTopology()
  const impact = resolveMetadataProjectChangeImpact(topology, projectPath)
  const assignment = impact?.assignment
  if (impact === undefined || assignment === undefined) return undefined
  const itemTypePrefix = assignment.projectPattern.split("/")[0] ?? ""
  const itemName = impact.values.ownerName ?? impact.values.itemName ?? ""
  const itemType = assignment.itemRule.itemType
  const ownerAssignment =
    assignment.ownerProjectPattern === undefined
      ? undefined
      : topology.assignments.find((candidate) => candidate.projectPattern === assignment.ownerProjectPattern)
  const dumpRule = ownerAssignment?.itemRule ?? assignment.itemRule

  if (impact.externalFile !== undefined) {
    const source = propertySource(impact.externalFile.source.description)
    const xmlPath = expandMetadataPathPattern(impact.externalFile.xmlPattern, impact.values)
    return {
      kind: "externalFile",
      itemType,
      itemTypePrefix,
      itemName,
      xmlDir: xmlPath.split("/")[0] ?? "",
      xmlPath,
      ...(source === undefined ? {} : source),
      routeParams: localRouteParams(impact.values),
      dumpInfoNames: expandDumpInfoNames(
        impact.externalFile.dumpInfoNamePatterns ?? [],
        dumpRule,
        impact.values
      ),
    }
  }

  if (assignment.role === "fileItem") {
    const output = impact.outputs.find((document) => document.role === "metadata") ?? impact.outputs[0]
    if (output === undefined) return undefined
    const source = propertySource(assignment.source.description)
    if (source === undefined) return undefined
    const xmlPath = expandMetadataPathPattern(output.xmlPattern, impact.values)
    return {
      kind: "fileItem",
      itemType: ownerAssignment?.itemRule.itemType ?? itemType,
      itemTypePrefix,
      itemName,
      xmlDir: xmlPath.split("/")[0] ?? "",
      xmlPath,
      ...source,
      routeParams: localRouteParams(impact.values),
      compositionImpact: impact.compositionImpact,
      dumpInfoNames: expandDumpInfoNames(assignment.dumpInfoNamePatterns ?? [], dumpRule, impact.values),
    }
  }

  const metadata = impact.outputs.find((document) => document.role === "metadata")
  const xmlPath = metadata === undefined ? "" : expandMetadataPathPattern(metadata.xmlPattern, impact.values)
  return {
    kind: "owner",
    itemType,
    itemTypePrefix,
    itemName: lastAssignmentName(assignment.projectPattern, impact.values, itemName),
    xmlDir: xmlPath.split("/")[0] ?? "",
  }
}

function isCompiledTopology(
  value: CompiledMetadataResourceTopology | readonly MetadataItemRule[]
): value is CompiledMetadataResourceTopology {
  return "projectIndex" in value
}

function localRouteParams(values: Readonly<Record<string, string>>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter(([key]) => key !== "ownerName"))
}

function propertySource(
  description: string
): { propertyName: string; propertyType: PropertyRuleType } | undefined {
  const separator = description.lastIndexOf(":")
  if (separator <= 0 || separator === description.length - 1) return undefined
  return {
    propertyName: description.slice(0, separator),
    propertyType: description.slice(separator + 1) as PropertyRuleType,
  }
}

function expandDumpInfoNames(
  patterns: readonly string[],
  rule: MetadataItemRule,
  values: Readonly<Record<string, string>>
): string[] {
  const dumpRoot = metadataDumpRoot(rule)
  return patterns.map((pattern) =>
    expandMetadataPathPattern(pattern, { ...values, dumpRoot })
  )
}

function metadataDumpRoot(rule: MetadataItemRule): string {
  if (rule.externalMetadata?.segment) return rule.externalMetadata.segment
  for (const propertyRule of Object.values(rule.properties)) {
    if (
      propertyRule.type === "XMLRoot" &&
      "container" in propertyRule &&
      typeof propertyRule.container === "string"
    ) {
      return propertyRule.container
    }
  }
  return String(rule.itemType).replace(/^Metadata/, "")
}

function lastAssignmentName(
  pattern: string,
  values: Readonly<Record<string, string>>,
  fallback: string
): string {
  const parameters = [...pattern.matchAll(/\{([^}.]+)(?:\.\.\.)?\}/g)].map((match) => match[1]!)
  for (const parameter of parameters.reverse()) {
    const value = values[parameter]
    if (value !== undefined) return value
  }
  return fallback
}
