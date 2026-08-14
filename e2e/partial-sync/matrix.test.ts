import { cp, mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { isAbsolute, join, resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { createRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { TopLevelMetadataItemRules } from "../../packages/rules/metadata/appliedObjects/configuration/topLevelRules"
import { metadataRules } from "../../packages/rules/metadata/composition/metadataRules"
import {
  childCapabilityExclusions,
  childDeclarations,
} from "./matrix/children"
import { formDeclarations } from "./matrix/forms"
import { partialSyncMatrix } from "./matrix"
import { rootObjectDeclarations } from "./matrix/root-objects"
import { buildScenarioPlan } from "./plan"
import { applyScenarioOperation } from "./operation"
import { compareFileTrees } from "../support/file-tree"

describe("partial sync matrix", () => {
  it("covers every registered top-level metadata type exactly once", () => {
    expect(new Set(rootObjectDeclarations.map(({ itemType }) => itemType))).toEqual(
      new Set(TopLevelMetadataItemRules.map(({ itemType }) => itemType)),
    )
    expect(rootObjectDeclarations).toHaveLength(47)
  })

  it("uses unique stable identities and project-relative file paths", () => {
    expect(unique(rootObjectDeclarations.map(({ key }) => key))).toBe(true)
    expect(unique(rootObjectDeclarations.map(({ name }) => name))).toBe(true)

    for (const declaration of rootObjectDeclarations) {
      const paths = declaration.changes.map(({ path }) => path)
      expect(unique(paths), declaration.key).toBe(true)
      for (const path of paths) {
        expect(isAbsolute(path), path).toBe(false)
        expect(path.split("/")).not.toContain("..")
        expect(path).not.toContain("\\")
      }
    }
  })

  it("declares every reachable owner-child capability", () => {
    expect(childCapabilityExclusions).toEqual([])
    const ownerItemTypes = new Map(
      rootObjectDeclarations.map(({ key, itemType }) => [key, itemType]),
    )
    const declared = new Set<string>()
    for (const child of childDeclarations) {
      const ownerItemType = ownerItemTypes.get(child.ownerKey)
      expect(ownerItemType, child.key).toBeDefined()
      declared.add(`${ownerItemType}:${child.propertyKey}:${child.childItemType}`)
      ownerItemTypes.set(child.key, child.childItemType)
    }
    const discovered = collectRuleChildCapabilities()
    const exclusions = new Set(childCapabilityExclusions.map(({ capability }) => capability))

    for (const exclusion of childCapabilityExclusions) {
      expect(exclusion.reason.trim(), exclusion.capability).not.toBe("")
      expect(discovered.has(exclusion.capability), exclusion.capability).toBe(true)
    }
    expect(new Set([...declared, ...exclusions])).toEqual(discovered)
    expect(childDeclarations).toHaveLength(discovered.size - exclusions.size)
    expect(unique(childDeclarations.map(({ key }) => key))).toBe(true)
  })

  it("declares exactly one form for every top-level owner that supports forms", () => {
    const ownerItemTypes = new Map(
      rootObjectDeclarations.map(({ key, itemType }) => [key, itemType]),
    )
    const declared = formDeclarations.map(({ ownerKey }) => ownerItemTypes.get(ownerKey))
    const discovered = TopLevelMetadataItemRules
      .filter((rule) => Object.values(rule.properties).some(({ type }) => type === "ChildFormNames"))
      .map(({ itemType }) => itemType)

    expect(declared.every((itemType) => itemType !== undefined)).toBe(true)
    expect(new Set(declared)).toEqual(new Set(discovered))
    expect(declared).toHaveLength(discovered.length)
    expect(unique(formDeclarations.map(({ key }) => key))).toBe(true)
  })

  it("forms one continuous and reversible transition for every declared path", () => {
    const files = new Map<string, string | Uint8Array>()

    for (const operation of buildScenarioPlan(partialSyncMatrix)) {
      for (const change of operation.changes) {
        expect(files.get(change.path) ?? null, `${operation.key}: ${change.path}`)
          .toEqual(change.before)
        if (change.after === null) files.delete(change.path)
        else files.set(change.path, change.after)
      }
    }

    expect(files).toEqual(new Map())
  })

  it("returns a real NKDK fixture tree to its initial state after the full plan", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "nkdk-matrix-reversible-"))
    const source = resolve(import.meta.dirname, "../fixtures/nkdk")
    const projectDir = join(temporaryRoot, "project")
    await cp(source, projectDir, { recursive: true })

    for (const operation of buildScenarioPlan(partialSyncMatrix)) {
      await applyScenarioOperation(projectDir, operation)
    }

    const comparison = await compareFileTrees({
      expectedDir: source,
      actualDir: projectDir,
      reportDir: join(temporaryRoot, "report"),
    })
    expect(comparison).toMatchObject({ equal: true })
  })
})

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length
}

function collectRuleChildCapabilities(): Set<string> {
  const execution = createRuleRegistrySet(metadataRules).execution
  const capabilities = new Set<string>()
  const visited = new Set<string>()

  function visit(rule: (typeof TopLevelMetadataItemRules)[number]): void {
    if (visited.has(rule.itemType)) return
    visited.add(rule.itemType)
    for (const [propertyKey, propertyRule] of Object.entries(rule.properties)) {
      const nested = execution.getTypeRule(propertyRule.type, "nestedItemRule")
      const childRule = execution.resolvePropertyItemRule(propertyRule)
        ?? (nested !== undefined && "itemRule" in nested ? nested.itemRule : undefined)
      if (childRule === undefined || childRule.itemType === "ClientApplicationForm") continue
      if (!childRule.itemType.startsWith("Metadata") && childRule.itemType !== "Predefined") continue
      capabilities.add(`${rule.itemType}:${propertyKey}:${childRule.itemType}`)
      visit(childRule)
    }
    for (const collection of rule.childCollections ?? []) {
      const childRule = collection.fileItemRule ?? collection.itemRule
      capabilities.add(`${rule.itemType}:${collection.propertyKey}:${childRule.itemType}`)
      visit(childRule)
    }
  }

  for (const rule of TopLevelMetadataItemRules) visit(rule)
  return capabilities
}
