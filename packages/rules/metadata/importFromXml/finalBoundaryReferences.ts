import type { XmlAnomalyAnnotations } from "@nkdk/runtime"
import { attachXmlImportAttemptParticipants, createXmlImportUndoLog } from "@nkdk/runtime/rule-kit"
import type { PendingMetadataTargetReference, ProjectObjectIndexEntry } from "../validation/projectReferenceIndex"
import { addressableMetadataObjectEntry } from "../validation/addressableMetadataTargets"
import type { ProjectLogicalAddressEntry } from "../projectDefinition/componentIndexFacts"
import type { buildValidationOwnerMetadata } from "../validation/projectValidationPasses"

type FinalOwnerMetadata = ReturnType<typeof buildValidationOwnerMetadata>
import type { ValidationPendingCheck } from "../validation/projectValidationPendingChecks"
import { parsedYamlFromKnownData } from "@nkdk/runtime"
import { yamlDiagnosticLocationAtPath } from "../validation/yamlLocations"
import { referenceAnnotationState, type ImportBoundaryReference } from "./boundaryReferences"
import { importedYamlValueAtPath } from "./yamlPathValue"
import { acceptFormTabularElementVisit, type FormTabularElementVisit, type FormDataPathTabularElementDeclaration, type FormDataPathIndex } from "@nkdk/runtime/rule-kit"
import { acceptClientApplicationFormElementComponent, indexClientApplicationFormNamedComponents, type FormComponentEntry } from "../forms/clientApplicationForm/formComponentIndex"
import { projectPreparedClientApplicationFormStructure } from "../forms/clientApplicationForm/formStructureProjection"

interface BoundaryFacts {
  readonly references: readonly ImportBoundaryReference[]
  readonly checks?: readonly ValidationPendingCheck[]
  readonly objectTarget?: { readonly segment: string; readonly filePath: string; readonly type?: string }
  readonly logicalTarget?: { readonly segment: string; readonly filePath: string }
  readonly ownerFacts?: Readonly<Record<string, unknown>>
  readonly ownerMetadata?: FinalOwnerMetadata
  readonly table?: FormTabularElementVisit
  readonly formIndex?: FormDataPathIndex
  readonly localizedTextPaths?: readonly (readonly (string | number)[])[]
  readonly formOwner?: { readonly kind: string; readonly name: string }
  readonly formElement?: { readonly name: string; readonly primaryDataPath?: { readonly present: boolean; readonly value: unknown } }
}

/** Сохраняет ссылки и адреса; journal освобождает отменённые ветви сразу при rollback. */
export function createFinalBoundaryReferences() {
  const undo = createXmlImportUndoLog()
  const remember = undo.remember
  interface PathNode { readonly children: Map<string | number, PathNode>; key?: string | number; addressSegment?: string; objectSegment?: string; logicalSegment?: string; tableDataPath?: string; tableName?: string; elementYaml?: object }
  const paths: PathNode = { children: new Map() }
  function* orderedPaths(): Generator<PathNode> {
    const stack = [{ node: paths, children: paths.children.values() }]
    yield paths
    while (stack.length !== 0) {
      const frame = stack.at(-1)!
      const next = frame.children.next()
      if (next.done) {
        stack.pop()
      } else {
        stack.push({ node: next.value, children: next.value.children.values() })
        yield next.value
      }
    }
  }
  const pathNode = (path: readonly (string | number)[]) => {
    let node = paths
    for (const segment of path) {
      let child = node.children.get(segment)
      if (child === undefined) {
        const parent = node
        remember(() => { parent.children.delete(segment) })
        node.children.set(segment, child = { children: new Map() })
      }
      node = child
    }
    return node
  }
  const setKey = (node: PathNode, key: string | number | undefined) => {
    if (node.key === key) return
    const previous = node.key
    remember(() => { node.key = previous })
    node.key = key
  }
  const resolvePath = (path: readonly (string | number)[]) => {
    let node: PathNode | undefined = paths
    return path.map(segment => {
      node = node?.children.get(segment)
      return node?.key ?? segment
    })
  }
  const resolveAddress = (path: readonly (string | number)[], field: "addressSegment" | "objectSegment" | "logicalSegment" = "addressSegment") => {
    let node: PathNode | undefined = paths
    const segments = paths[field] === undefined ? [] : [paths[field]]
    for (const key of path) {
      node = node?.children.get(key)
      if (node?.[field] !== undefined) segments.push(node[field])
    }
    return segments.join(".")
  }
  const parentTableValue = (path: readonly (string | number)[], field: "tableDataPath" | "tableName") => {
    let node: PathNode | undefined = paths
    let value: string | undefined
    for (const segment of path.slice(0, -1)) {
      node = node?.children.get(segment)
      if (node?.[field] !== undefined) value = field === "tableName" ? String(node.key ?? segment) : node[field]
    }
    return value
  }
  let boundaries = new WeakMap<object, BoundaryFacts & {
    readonly path: readonly (string | number)[]
    readonly checks: readonly ValidationPendingCheck[]
  }>()
  const referenced = new Set<object>()
  const tables = new Set<object>()
  const collector = {
    accept(params: BoundaryFacts & {
      readonly yaml: Record<string, unknown>
      readonly sourcePath: readonly (string | number)[]
      readonly finalPath: readonly (string | number)[]
      readonly addressSegment?: string
      readonly tableDataPath?: string
    }) {
      for (let index = 0; index < params.sourcePath.length; index += 1) {
        const node = pathNode(params.sourcePath.slice(0, index + 1))
        if (node.key === undefined) setKey(node, params.finalPath[index])
      }
      if (params.sourcePath.length !== 0) {
        setKey(pathNode(params.sourcePath), params.finalPath.at(-1))
      }
      const node = pathNode(params.sourcePath)
      const previousSegment = node.addressSegment
      remember(() => { node.addressSegment = previousSegment })
      node.addressSegment = params.addressSegment
      const previousObjectSegment = node.objectSegment
      remember(() => { node.objectSegment = previousObjectSegment })
      node.objectSegment = params.objectTarget?.segment
      const previousLogicalSegment = node.logicalSegment
      remember(() => { node.logicalSegment = previousLogicalSegment })
      node.logicalSegment = params.logicalTarget?.segment
      const previousTablePath = node.tableDataPath
      remember(() => { node.tableDataPath = previousTablePath })
      node.tableDataPath = params.tableDataPath
      const previousTableName = node.tableName
      const previousElement = node.elementYaml
      remember(() => { node.tableName = previousTableName; node.elementYaml = previousElement })
      node.tableName = params.table?.name
      node.elementYaml = params.formElement === undefined ? undefined : params.yaml
      const previous = boundaries.get(params.yaml)
      const wasReferenced = referenced.has(params.yaml)
      const wasTable = tables.has(params.yaml)
      remember(() => {
        if (previous === undefined) boundaries.delete(params.yaml)
        else boundaries.set(params.yaml, previous)
        if (wasReferenced) referenced.add(params.yaml)
        else referenced.delete(params.yaml)
        if (wasTable) tables.add(params.yaml)
        else tables.delete(params.yaml)
      })
      if (params.table === undefined) tables.delete(params.yaml)
      else tables.add(params.yaml)
      if (params.references.length !== 0 || (params.checks?.length ?? 0) !== 0 || params.objectTarget !== undefined || params.logicalTarget !== undefined || params.ownerFacts !== undefined || params.formIndex !== undefined || (params.localizedTextPaths?.length ?? 0) !== 0) referenced.add(params.yaml)
      else referenced.delete(params.yaml)
      boundaries.set(params.yaml, {
        path: [...params.sourcePath],
        references: params.references,
        checks: params.checks ?? [],
        objectTarget: params.objectTarget,
        logicalTarget: params.logicalTarget,
        ownerFacts: params.ownerFacts,
        ownerMetadata: params.ownerMetadata,
        table: params.table,
        formIndex: params.formIndex,
        localizedTextPaths: params.localizedTextPaths,
        formOwner: params.formOwner,
        formElement: params.formElement,
      })
    },
    tabularElements(root: Record<string, unknown>, annotations: XmlAnomalyAnnotations) {
      const result = new Map<string, FormDataPathTabularElementDeclaration>()
      if (annotations.root() !== undefined) return result
      for (const yaml of tables) {
        const boundary = boundaries.get(yaml)
        if (boundary?.table === undefined) continue
        const path = resolvePath(boundary.path)
        if (importedYamlValueAtPath(root, path) !== yaml
          || referenceAnnotationState({ yaml: root, yamlPath: [], annotations }, path) === "raw") continue
        const key = path.at(-1)
        acceptFormTabularElementVisit(result, { ...boundary.table, name: typeof key === "string" ? key : boundary.table.name })
      }
      return result
    },
    place(parent: Record<string, unknown>, key: string, sourceYamlPath?: readonly (string | number)[]) {
      if (sourceYamlPath !== undefined) { setKey(pathNode(sourceYamlPath), key); return }
      const child = parent[key]
      if (typeof child !== "object" || child === null) return
      const boundary = boundaries.get(child)
      if (boundary === undefined || boundary.path.length === 0) return
      setKey(pathNode(boundary.path), key)
    },
    finish(root: Record<string, unknown>, annotations: XmlAnomalyAnnotations) {
      const result: PendingMetadataTargetReference[] = []
      const dependencies = new Set<string>()
      const checks: ValidationPendingCheck[] = []
      const objectIndexEntries: ProjectObjectIndexEntry[] = []
      const logicalAddresses: ProjectLogicalAddressEntry[] = []
      let ownerFacts: Readonly<Record<string, unknown>> | undefined
      let ownerMetadata: FinalOwnerMetadata | undefined
      let formIndex: FormDataPathIndex | undefined
      let localizedTextProperties = 0
      let formOwner: BoundaryFacts["formOwner"]
      const parsed = parsedYamlFromKnownData("", root, annotations)
      undo.assertIdle()
      if (annotations.root() === undefined) {
        for (const yaml of referenced) {
          const boundary = boundaries.get(yaml)
          if (boundary === undefined) continue
          if (importedYamlValueAtPath(root, resolvePath(boundary.path)) !== yaml) continue
          if (boundary.ownerFacts !== undefined) ownerFacts = boundary.ownerFacts
          if (boundary.ownerMetadata !== undefined) ownerMetadata = boundary.ownerMetadata
          if (boundary.formIndex !== undefined) formIndex = boundary.formIndex
          if (boundary.formOwner !== undefined) formOwner = boundary.formOwner
          for (const sourcePath of boundary.localizedTextPaths ?? []) {
            const path = resolvePath(sourcePath)
            if (referenceAnnotationState({ yaml: root, yamlPath: [], annotations }, path) !== "raw"
              && importedYamlValueAtPath(root, path) !== undefined) localizedTextProperties += 1
          }
          if (boundary.logicalTarget !== undefined
            && referenceAnnotationState({ yaml: root, yamlPath: [], annotations }, resolvePath(boundary.path)) !== "raw") {
            logicalAddresses.push({ logicalAddress: resolveAddress(boundary.path, "logicalSegment"), sourceProjectPath: boundary.logicalTarget.filePath })
          }
          if (boundary.objectTarget !== undefined
            && referenceAnnotationState({ yaml: root, yamlPath: [], annotations }, resolvePath(boundary.path)) !== "raw") {
            objectIndexEntries.push(addressableMetadataObjectEntry({
              canonical: resolveAddress(boundary.path, "objectSegment"), filePath: boundary.objectTarget.filePath,
              ...(boundary.objectTarget.type === undefined ? {} : { type: boundary.objectTarget.type }),
            }))
          }
          for (const source of boundary.references) {
            const reference = { ...source, yamlPath: resolvePath(source.yamlPath) }
            const state = referenceAnnotationState({ yaml: root, yamlPath: [], annotations }, reference.yamlPath, reference.annotationKind)
            if (state === "raw" || importedYamlValueAtPath(root, reference.yamlPath) === undefined) continue
            const { xmlAnomaly: _previousState, annotationKind: _annotationKind, ...value } = reference
            result.push(state === "pending" ? { ...value, xmlAnomaly: "pending" } : value)
            dependencies.add(value.canonical)
          }
          for (const source of boundary.checks) {
            const yamlPath = resolvePath(source.yamlPath)
            const state = referenceAnnotationState({ yaml: root, yamlPath: [], annotations }, yamlPath)
            if (state === "raw") continue
            let check = { ...source, yamlPath, location: yamlDiagnosticLocationAtPath({
              filePath: source.location.filePath, parsed, path: yamlPath,
            }) }
            if (check.kind === "dataPath" && check.policyInput.yaml === "ПутьКДанным") {
              const { tableContext: _sourceContext, ...value } = check
              const dataPath = parentTableValue(boundary.path, "tableDataPath")
              check = dataPath === undefined ? value : { ...value, tableContext: { dataPath } }
            }
            if (check.kind === "fillValue" || check.kind === "dataPath") {
              const { xmlAnomaly: _previousState, ...value } = check
              checks.push(state === "pending" ? { ...value, xmlAnomaly: "pending" } : value)
            } else checks.push(check.kind === "addressableRequired"
              ? { ...check, canonicalTarget: resolveAddress(boundary.path) } : check)
          }
        }
      }
      const elements = new Map<string, FormComponentEntry>()
      const elementPaths = new Map<string, { present: boolean; value: unknown; tableOwnerName?: string }>()
      if (formOwner !== undefined) {
        for (const node of orderedPaths()) {
          const yaml = node.elementYaml
          const boundary = yaml === undefined ? undefined : boundaries.get(yaml)
          if (boundary?.formElement === undefined) continue
          const path = resolvePath(boundary.path)
          if (importedYamlValueAtPath(root, path) !== yaml
            || referenceAnnotationState({ yaml: root, yamlPath: [], annotations }, path) === "raw") continue
          const { primaryDataPath } = boundary.formElement
          const key = path.at(-1)
          const name = typeof key === "string" ? key : boundary.formElement.name
          acceptClientApplicationFormElementComponent(elements, name, path.map(String).join("."))
          if (primaryDataPath !== undefined) {
            const tableOwnerName = parentTableValue(boundary.path, "tableName")
            elementPaths.set(name, { ...primaryDataPath, ...(tableOwnerName === undefined ? {} : { tableOwnerName }) })
          }
        }
      }
      const structuredComponents = formOwner === undefined ? undefined : projectPreparedClientApplicationFormStructure({
        yaml: root, owner: formOwner, annotations,
        index: { elements, ...indexClientApplicationFormNamedComponents(root) }, elementsByName: elementPaths,
        occurrences: checks.flatMap(check => check.kind === "dataPath" ? [{ value: check.value, yamlPath: check.yamlPath }] : []),
      })
      boundaries = new WeakMap()
      referenced.clear()
      tables.clear()
      paths.children.clear()
      delete paths.addressSegment
      delete paths.objectSegment
      delete paths.logicalSegment
      delete paths.elementYaml
      return { references: result, dependencies: [...dependencies], localizedTextProperties, checks, objectIndexEntries, logicalAddresses,
        ...(ownerFacts === undefined ? {} : { ownerFacts }), ...(ownerMetadata === undefined ? {} : { ownerMetadata }),
        ...(formIndex === undefined ? {} : { formIndex }),
        ...(structuredComponents === undefined ? {} : { structuredComponents }),
      }
    },
  }
  attachXmlImportAttemptParticipants(collector, [undo])
  return collector
}
