import { join } from "node:path"
import type { Diagnostic } from "@nkdk/runtime"
import type { MetadataRootName, ParsedMetadataTarget } from "@nkdk/runtime/rule-kit"
import type { ProjectStateQueryPort } from "../projectState/contracts/dependencyValidation"
import type { ProjectStateNamedTypeItems, ProjectStateOwnerFacts } from "../projectState/fileUpdate"
import { ownerMetadataFromFacts } from "./dataPath/ownerCache"
import { projectStateFieldIndex } from "./dataPath/projectStateFieldIndex"
import { getOwnerKindByMetadataLinkPrefix } from "./dataPath/registry"
import type { OwnerTypeRef } from "./dataPath/types"
import type { ProjectReferenceValueContributor } from "./projectReferenceIndexRegistry"

export interface ProjectValueTargetRequest {
  readonly requestId: string
  readonly componentPath: string
  readonly target: Extract<ParsedMetadataTarget, { kind: "value" }>
}

export type ProjectValueTargetResolution =
  | { readonly requestId: string; readonly status: "found" }
  | { readonly requestId: string; readonly status: "missing" | "ambiguous" }
  | {
      readonly requestId: string
      readonly status: "invalid"
      readonly diagnostics: readonly Diagnostic[]
    }

export function resolveProjectValueTargets(params: {
  readonly requests: readonly ProjectValueTargetRequest[]
  readonly projectDir: string
  readonly queryPort: Pick<ProjectStateQueryPort, "readOwners">
  readonly getContributor: (root: MetadataRootName) => ProjectReferenceValueContributor | undefined
}): readonly ProjectValueTargetResolution[] {
  const ownerResults = params.queryPort.readOwners(params.requests.map((request) => ({
    requestId: request.requestId,
    componentPath: request.componentPath,
    owner: valueTargetOwner(request.target),
  })))
  const ownerByRequestId = new Map(ownerResults.map((result) => [result.requestId, result]))
  const extensionRequests = params.requests.filter(({ componentPath }) => isExtensionComponent(componentPath))
  const baseOwnerResults = extensionRequests.length === 0
    ? []
    : params.queryPort.readOwners(extensionRequests.map((request) => ({
        requestId: request.requestId,
        componentPath: "cf",
        owner: valueTargetOwner(request.target),
      })))
  const baseOwnerByRequestId = new Map(baseOwnerResults.map((result) => [result.requestId, result]))

  return params.requests.map((request) => {
    const ownerResult = ownerByRequestId.get(request.requestId)
    if (ownerResult?.status === "ambiguous") {
      return { requestId: request.requestId, status: "ambiguous" }
    }
    if (ownerResult?.status !== "found") {
      return { requestId: request.requestId, status: "missing" }
    }
    if (request.target.valueKind === "emptyRef") {
      return { requestId: request.requestId, status: "found" }
    }
    const baseOwnerResult = baseOwnerByRequestId.get(request.requestId)
    if (baseOwnerResult?.status === "ambiguous") {
      return { requestId: request.requestId, status: "ambiguous" }
    }
    const facts = baseOwnerResult?.status === "found"
      ? mergeOwnerFacts(baseOwnerResult.facts, ownerResult.facts)
      : ownerResult.facts

    const ownerRef = valueTargetOwner(request.target)
    const owner = ownerMetadataFromFacts({
      projectDir: join(params.projectDir, request.componentPath),
      ref: ownerRef,
      facts,
      fieldIndex: projectStateFieldIndex(ownerRef, []),
    })
    if (owner.status !== "ok") {
      return { requestId: request.requestId, status: "missing" }
    }
    const contributed = params.getContributor(request.target.root)?.({
      owner: owner.owner,
      target: request.target,
    })
    if (contributed?.ok === true) {
      return { requestId: request.requestId, status: "found" }
    }
    if (contributed?.ok === false) {
      return {
        requestId: request.requestId,
        status: "invalid",
        diagnostics: contributed.diagnostics,
      }
    }
    return { requestId: request.requestId, status: "missing" }
  })
}

function isExtensionComponent(componentPath: string): boolean {
  return componentPath.startsWith("cfe/") && componentPath.length > "cfe/".length
}

function mergeOwnerFacts(
  base: ProjectStateOwnerFacts,
  extension: ProjectStateOwnerFacts,
): ProjectStateOwnerFacts {
  const predefined = mergeNamedItems(base.predefined, extension.predefined)
  const enumValues = mergeNamedItems(base.enumValues, extension.enumValues)
  return {
    ...base,
    ...extension,
    ...(predefined === undefined ? {} : { predefined }),
    ...(enumValues === undefined ? {} : { enumValues }),
  }
}

function mergeNamedItems(
  base: ProjectStateNamedTypeItems | undefined,
  extension: ProjectStateNamedTypeItems | undefined,
): ProjectStateNamedTypeItems | undefined {
  if (base === undefined) return extension
  if (extension === undefined) return base
  const items = new Map(base.map((item) => [item.name, item]))
  extension.forEach((item) => items.set(item.name, item))
  return [...items.values()]
}

function valueTargetOwner(
  target: Extract<ParsedMetadataTarget, { kind: "value" }>,
): OwnerTypeRef {
  return {
    kind: getOwnerKindByMetadataLinkPrefix(target.root) ?? target.root,
    name: target.objectName,
  }
}
