import type {
  XmlAttributeNode,
  XmlContentNode,
  XmlElementNode,
} from "../../../xml/import/document"
import type { YamlPath } from "../../diagnostics/types"
import type { DeferredRulePathSegment } from "../property/localFacts"

export type XmlImportAuditedNode = XmlContentNode | XmlAttributeNode

export interface XmlImportAuditBoundary {
  readonly itemType: string
  readonly propertyKey?: string
  readonly propertyType?: string
  readonly yamlPath?: YamlPath
  readonly rulePath?: readonly DeferredRulePathSegment[]
}

export type XmlImportAuditState =
  | "unclaimed"
  | "claimed"
  | "semanticallyElided"
  | "externallyPersisted"
  | "structurallyClaimed"
  | "structurallyCovered"
  | "ambiguous"
  | "duplicate"
  | "unknown"

export interface XmlImportAuditOutcome {
  readonly node: XmlImportAuditedNode
  readonly state: XmlImportAuditState
  readonly boundaries: readonly XmlImportAuditBoundary[]
}

export interface XmlImportRawCandidate {
  readonly node: XmlImportAuditedNode
  readonly boundary: XmlImportAuditBoundary
  readonly error: unknown
}

export interface XmlImportAuditSession {
  outcomes(): readonly XmlImportAuditOutcome[]
  getOutcome(node: XmlImportAuditedNode): XmlImportAuditOutcome
  forEachOutcome(visitor: (outcome: XmlImportAuditOutcome) => void): void
  rekeyYamlPath(
    sourcePrefix: readonly (string | number)[],
    targetPrefix: readonly (string | number)[],
    root?: XmlElementNode,
  ): void
  selectPropertyBoundary(
    root: XmlElementNode,
    boundary: XmlImportAuditBoundary,
  ): void
  claim(node: XmlImportAuditedNode, boundary: XmlImportAuditBoundary): void
  elideSubtree(node: XmlElementNode, boundary: XmlImportAuditBoundary): boolean
  persistExternalSubtree(node: XmlElementNode, boundary: XmlImportAuditBoundary): boolean
  claimStructuralSubtree(
    node: XmlElementNode,
    boundary: XmlImportAuditBoundary,
  ): boolean
  ambiguous(
    node: XmlImportAuditedNode,
    boundaries: readonly XmlImportAuditBoundary[],
  ): void
  duplicate(node: XmlImportAuditedNode, boundary: XmlImportAuditBoundary): void
  rawCandidate(
    node: XmlImportAuditedNode,
    boundary: XmlImportAuditBoundary,
    error: unknown,
  ): void
  finalize(): void
  rawCandidates(): readonly XmlImportRawCandidate[]
}

interface MutableOutcome {
  readonly node: XmlImportAuditedNode
  state: XmlImportAuditState
  boundaries: XmlImportAuditBoundary[]
  compactOwner?: MutableOutcome
}

export function createXmlImportAuditSession(
  roots: readonly XmlElementNode[],
): XmlImportAuditSession {
  const outcomes = new Map<XmlImportAuditedNode, MutableOutcome>()
  for (const root of roots) collectOutcomes(root, outcomes)
  const candidates: XmlImportRawCandidate[] = []

  const outcome = (node: XmlImportAuditedNode): MutableOutcome => {
    const current = outcomes.get(node)
    if (current === undefined) {
      throw new Error(`XML-узел ${node.path} не принадлежит сеансу аудита`)
    }
    return current
  }

  const compactClaimedSubtree = (
    node: XmlElementNode,
    boundary: XmlImportAuditBoundary,
    state: "semanticallyElided" | "externallyPersisted",
  ): boolean => {
    const subtree = collectSubtreeOutcomes(node, outcomes)
    const subtreeNodes = new Set(subtree.map((current) => current.node))
    if (
      subtree.some((current) => current.state !== "claimed")
      || candidates.some((candidate) => subtreeNodes.has(candidate.node))
    ) return false
    const [root, ...descendants] = subtree
    if (root === undefined) return false
    root.state = state
    root.boundaries = [copyBoundary(boundary)]
    root.compactOwner = root
    for (const current of descendants) {
      current.state = state
      current.boundaries = []
      current.compactOwner = root
    }
    return true
  }

  return {
    outcomes: () => [...outcomes.values()].map(copyOutcome),
    getOutcome: outcome,
    forEachOutcome(visitor) {
      for (const current of outcomes.values()) visitor(current)
    },
    rekeyYamlPath(sourcePrefix, targetPrefix, root) {
      const scopedOutcomes = root === undefined
        ? outcomes.values()
        : collectSubtreeOutcomes(root, outcomes)
      const scopedNodes = root === undefined
        ? undefined
        : new Set(Array.from(scopedOutcomes, ({ node }) => node))
      for (const current of scopedOutcomes) {
        current.boundaries = uniqueBoundaries(
          current.boundaries.map((boundary) =>
            rekeyBoundaryYamlPath(boundary, sourcePrefix, targetPrefix),
          ),
        )
      }
      for (let index = 0; index < candidates.length; index += 1) {
        const candidate = candidates[index]!
        if (scopedNodes !== undefined && !scopedNodes.has(candidate.node)) continue
        candidates[index] = {
          ...candidate,
          boundary: rekeyBoundaryYamlPath(candidate.boundary, sourcePrefix, targetPrefix),
        }
      }
    },
    selectPropertyBoundary(root, boundary) {
      const alternatives = outcome(root).boundaries
      if (!alternatives.some((candidate) => sameBoundaries([candidate], [boundary]))) return
      for (const current of collectSubtreeOutcomes(root, outcomes)) {
        if (current.boundaries.length === 0) continue
        const owners = current.boundaries.map((candidate) => alternatives.filter(
          (alternative) => boundaryBelongsToAlternative(candidate, alternative),
        ))
        if (owners.some((candidates) => candidates.length === 0)) continue
        const selected = current.boundaries.filter((_, index) =>
          owners[index]!.some((owner) => sameBoundaries([owner], [boundary])),
        )
        if (selected.length > 1) continue
        current.state = selected.length === 1 ? "claimed" : "unclaimed"
        current.boundaries = selected.map(copyBoundary)
        current.compactOwner = undefined
      }
    },
    claim(node, boundary) {
      const current = outcome(node)
      if (current.state === "unclaimed" || current.state === "unknown") {
        current.state = "claimed"
        current.boundaries = [copyBoundary(boundary)]
        return
      }
      if (
        (
          current.state === "semanticallyElided"
          || current.state === "externallyPersisted"
          || current.state === "structurallyClaimed"
          || current.state === "structurallyCovered"
        )
        && compactBoundary(current) !== undefined
      ) {
        const owner = current.compactOwner ?? current
        const ownerBoundary = compactBoundary(current)!
        if (sameBoundaries([ownerBoundary], [boundary])) return
        owner.state = "ambiguous"
        owner.boundaries = uniqueBoundaries([...owner.boundaries, boundary])
        current.state = "ambiguous"
        current.boundaries = uniqueBoundaries([ownerBoundary, boundary])
        current.compactOwner = undefined
        return
      }
      if (sameBoundaries(current.boundaries, [boundary])) return
      current.state = "ambiguous"
      current.boundaries = uniqueBoundaries([...current.boundaries, boundary])
    },
    elideSubtree(node, boundary) {
      return compactClaimedSubtree(node, boundary, "semanticallyElided")
    },
    persistExternalSubtree(node, boundary) {
      return compactClaimedSubtree(node, boundary, "externallyPersisted")
    },
    claimStructuralSubtree(node, boundary) {
      const subtree = collectSubtreeOutcomes(node, outcomes)
      const [root, ...descendants] = subtree
      if (root === undefined) return false
      if (
        root.state === "structurallyClaimed"
        && sameBoundaries(root.boundaries, [boundary])
        && descendants.every((current) =>
          current.state === "structurallyCovered"
          && (current.compactOwner ?? root) === root
        )
      ) return true
      const subtreeNodes = new Set(subtree.map((current) => current.node))
      const rootClaimedByBoundary = root.state === "claimed"
        && sameBoundaries(root.boundaries, [boundary])
      const descendantsAvailable = descendants.every((current) =>
        current.state === "unclaimed"
        || (
          current.state === "claimed"
          && sameBoundaries(current.boundaries, [boundary])
        )
      )
      if (
        !rootClaimedByBoundary
        || !descendantsAvailable
        || candidates.some((candidate) => subtreeNodes.has(candidate.node))
      ) return false
      root.state = "structurallyClaimed"
      root.boundaries = [copyBoundary(boundary)]
      root.compactOwner = root
      for (const current of descendants) {
        current.state = "structurallyCovered"
        current.boundaries = []
        current.compactOwner = root
      }
      return true
    },
    ambiguous(node, boundaries) {
      const current = outcome(node)
      current.state = "ambiguous"
      current.boundaries = uniqueBoundaries([...current.boundaries, ...boundaries])
    },
    duplicate(node, boundary) {
      const current = outcome(node)
      current.state = "duplicate"
      current.boundaries = [copyBoundary(boundary)]
    },
    rawCandidate(node, boundary, error) {
      outcome(node)
      candidates.push({ node, boundary: copyBoundary(boundary), error })
    },
    finalize() {
      for (const current of outcomes.values()) {
        if (current.state === "unclaimed") current.state = "unknown"
      }
    },
    rawCandidates: () => [...candidates],
  }
}

function rekeyBoundaryYamlPath(
  boundary: XmlImportAuditBoundary,
  sourcePrefix: readonly (string | number)[],
  targetPrefix: readonly (string | number)[],
): XmlImportAuditBoundary {
  if (
    boundary.yamlPath === undefined ||
    sourcePrefix.length > boundary.yamlPath.length ||
    !sourcePrefix.every((segment, index) => boundary.yamlPath?.[index] === segment)
  ) return boundary
  return {
    ...boundary,
    yamlPath: [...targetPrefix, ...boundary.yamlPath.slice(sourcePrefix.length)],
  }
}

function collectOutcomes(
  node: XmlImportAuditedNode,
  outcomes: Map<XmlImportAuditedNode, MutableOutcome>,
): void {
  if (outcomes.has(node)) throw new Error(`Повторный XML-узел ${node.path}`)
  outcomes.set(node, { node, state: "unclaimed", boundaries: [] })
  if (!("type" in node)) return
  if (node.type === "text") return
  for (const attribute of node.attributes) collectOutcomes(attribute, outcomes)
  if (node.type === "processingInstruction") return
  for (const child of node.content) collectOutcomes(child, outcomes)
}

function collectSubtreeOutcomes(
  root: XmlElementNode,
  outcomes: ReadonlyMap<XmlImportAuditedNode, MutableOutcome>,
): MutableOutcome[] {
  const result: MutableOutcome[] = []
  const visit = (node: XmlImportAuditedNode): void => {
    const current = outcomes.get(node)
    if (current === undefined) {
      throw new Error(`XML-узел ${node.path} не принадлежит сеансу аудита`)
    }
    result.push(current)
    if (!("type" in node) || node.type === "text") return
    for (const attribute of node.attributes) visit(attribute)
    if (node.type === "processingInstruction") return
    for (const child of node.content) visit(child)
  }
  visit(root)
  return result
}

function compactBoundary(outcome: MutableOutcome): XmlImportAuditBoundary | undefined {
  return (outcome.compactOwner ?? outcome).boundaries[0]
}

function copyOutcome(outcome: MutableOutcome): XmlImportAuditOutcome {
  return {
    node: outcome.node,
    state: outcome.state,
    boundaries: outcome.boundaries.map(copyBoundary),
  }
}

function copyBoundary(boundary: XmlImportAuditBoundary): XmlImportAuditBoundary {
  return {
    itemType: boundary.itemType,
    ...(boundary.propertyKey === undefined ? {} : { propertyKey: boundary.propertyKey }),
    ...(boundary.propertyType === undefined ? {} : { propertyType: boundary.propertyType }),
    ...(boundary.yamlPath === undefined ? {} : { yamlPath: [...boundary.yamlPath] }),
    ...(boundary.rulePath === undefined
      ? {}
      : { rulePath: boundary.rulePath.map((segment) => ({ ...segment })) }),
  }
}

function uniqueBoundaries(
  boundaries: readonly XmlImportAuditBoundary[],
): XmlImportAuditBoundary[] {
  const result: XmlImportAuditBoundary[] = []
  for (const boundary of boundaries) {
    if (!result.some((candidate) => boundaryKey(candidate) === boundaryKey(boundary))) {
      result.push(copyBoundary(boundary))
    }
  }
  return result
}

function sameBoundaries(
  left: readonly XmlImportAuditBoundary[],
  right: readonly XmlImportAuditBoundary[],
): boolean {
  return left.length === right.length && left.every(
    (boundary, index) => boundaryKey(boundary) === boundaryKey(right[index]!),
  )
}

function boundaryKey(boundary: XmlImportAuditBoundary): string {
  return JSON.stringify([
    boundary.itemType,
    boundary.propertyKey,
    boundary.propertyType,
    boundary.yamlPath,
    boundary.rulePath,
  ])
}

function boundaryBelongsToAlternative(
  candidate: XmlImportAuditBoundary,
  alternative: XmlImportAuditBoundary,
): boolean {
  return pathStartsWith(candidate.yamlPath, alternative.yamlPath)
    && rulePathStartsWith(candidate.rulePath, alternative.rulePath)
}

function pathStartsWith<T>(
  candidate: readonly T[] | undefined,
  prefix: readonly T[] | undefined,
): boolean {
  if (prefix === undefined) return true
  return candidate !== undefined
    && prefix.length <= candidate.length
    && prefix.every((segment, index) => segment === candidate[index])
}

function rulePathStartsWith(
  candidate: readonly DeferredRulePathSegment[] | undefined,
  prefix: readonly DeferredRulePathSegment[] | undefined,
): boolean {
  if (prefix === undefined) return true
  return candidate !== undefined
    && prefix.length <= candidate.length
    && prefix.every((segment, index) =>
      segment.propertyKey === candidate[index]?.propertyKey
      && segment.nestedItemType === candidate[index]?.nestedItemType,
    )
}
