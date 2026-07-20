import { beforeEach, describe, expect, it } from "vitest"
import { TopLevelMetadataItemRules } from "../appliedObjects/configuration/topLevelRules"
import { registerCoreMetadata } from "../register"
import {
  describeMetadataRuleProjectResources,
  describeMetadataRuleXmlSyncRoutes,
  matchProjectPattern,
} from "../project/ruleResources"
import type { ProjectResourceDescriptor, XmlSyncRoute } from "../orchestration/property/fn"
import type { MetadataItemRule } from "../orchestration/property/types"

describe("full XML sync route coverage", () => {
  beforeEach(() => {
    registerCoreMetadata()
  })

  it("has an XML sync decision for every declared project resource", () => {
    const uncovered = TopLevelMetadataItemRules.flatMap((rule) => uncoveredResources(rule))

    expect(uncovered).toEqual([])
  })
})

function uncoveredResources(rule: MetadataItemRule): string[] {
  const routes = describeMetadataRuleXmlSyncRoutes(rule)
  return describeMetadataRuleProjectResources(rule)
    .filter((resource) => !isCovered(resource, routes))
    .map((resource) => `${rule.itemType}:${resource.kind}:${resource.role}:${resource.projectPattern}`)
}

function isCovered(resource: ProjectResourceDescriptor, routes: readonly XmlSyncRoute[]): boolean {
  if (resource.kind === "yaml" && resource.role === "configuration") return true
  if (resource.kind === "yaml" && resource.role === "properties") {
    return routes.some((route) => route.kind === "owner" && route.yamlPattern === resource.projectPattern)
  }
  if (resource.kind === "yaml" && resource.role === "resourceOnly") {
    return routes.some((route) => route.kind !== "owner" && patternsCompatible(resource.projectPattern, route.yamlPattern))
  }
  if (resource.kind === "directory" && resource.role === "resourceOnly") {
    return routes.some((route) => route.kind !== "owner" && patternsCompatible(resource.projectPattern, route.yamlPattern))
  }
  return routes.some((route) => route.kind !== "owner" && patternsCompatible(resource.projectPattern, route.yamlPattern))
}

function patternsCompatible(resourcePattern: string, routePattern: string): boolean {
  return (
    resourcePattern === routePattern ||
    matchProjectPattern(routePattern, samplePath(resourcePattern)) !== undefined ||
    matchProjectPattern(resourcePattern, samplePath(routePattern)) !== undefined
  )
}

function samplePath(pattern: string): string {
  return pattern.replace(/\{([^}]+)\}/g, (_match, name: string) => `__${name}__`)
}
