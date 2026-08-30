import type { ProjectStateYamlPath } from "../projectState/fileUpdate"
import type {
  CompiledMetadataAssignmentNode,
  CompiledMetadataResourceTopology,
  MetadataResourceRole,
} from "@nkdk/runtime/rule-kit"

type XmlDocumentRole = Extract<MetadataResourceRole, "metadata" | "body" | "property">

export interface PartialXmlAssignmentPolicy {
  readonly assignmentPattern: string
  readonly loadDocumentRoles: readonly XmlDocumentRole[]
  readonly structural?: {
    readonly includeOwnerAssignment: boolean
    readonly includeCurrentMemberSubtree: boolean
    readonly stopAtOwner: boolean
  }
  readonly companionDocuments?: readonly {
    readonly xmlPattern: string
    readonly loadTarget: boolean
  }[]
  readonly companionReferences?: readonly {
    readonly yamlPath: ProjectStateYamlPath
    readonly include: "targetAssignment"
    readonly loadTarget: boolean
    readonly required?: boolean
  }[]
  readonly yamlCompanionInputs?: readonly { readonly projectPattern: string }[]
}

export interface PartialXmlExternalFilePolicy {
  readonly projectPattern: string
  readonly loadTarget: boolean
}

export interface PartialXmlPackagePolicyRegistration {
  readonly assignment: PartialXmlAssignmentPolicy
  readonly externalFiles?: readonly PartialXmlExternalFilePolicy[]
}

export interface ResolvedPartialXmlAssignmentPolicy {
  readonly assignmentId: string
  readonly loadDocumentIds: readonly string[]
  readonly structural?: PartialXmlAssignmentPolicy["structural"]
  readonly companionDocuments: readonly {
    readonly documentId: string
    readonly loadTarget: boolean
  }[]
  readonly companionReferences: NonNullable<PartialXmlAssignmentPolicy["companionReferences"]>
  readonly yamlCompanionInputIds: readonly string[]
}

export interface ResolvedPartialXmlExternalFilePolicy {
  readonly externalFileId: string
  readonly loadTarget: boolean
}

export interface ResolvedPartialXmlPackagePolicies {
  readonly assignments: ReadonlyMap<string, ResolvedPartialXmlAssignmentPolicy>
  readonly externalFiles: ReadonlyMap<string, ResolvedPartialXmlExternalFilePolicy>
}

export interface PartialXmlPackagePolicyRegistry {
  register(registration: PartialXmlPackagePolicyRegistration): void
  resolve(topology: CompiledMetadataResourceTopology): ResolvedPartialXmlPackagePolicies
}

export function createPartialXmlPackagePolicyRegistry(): PartialXmlPackagePolicyRegistry {
  const registrations = new Map<string, PartialXmlPackagePolicyRegistration>()

  return {
    register(registration) {
      const pattern = registration.assignment.assignmentPattern
      if (registrations.has(pattern)) {
        throw new Error(`Политика частичного XML-пакета уже зарегистрирована: ${pattern}`)
      }
      registrations.set(pattern, freezeRegistration(registration))
    },
    resolve(topology) {
      return resolveRegistrations([...registrations.values()], topology)
    },
  }
}

const defaultRegistry = createPartialXmlPackagePolicyRegistry()

export function registerPartialXmlPackagePolicy(registration: PartialXmlPackagePolicyRegistration): void {
  defaultRegistry.register(registration)
}

export function resolvePartialXmlPackagePolicy(
  topology: CompiledMetadataResourceTopology,
): ResolvedPartialXmlPackagePolicies {
  return defaultRegistry.resolve(topology)
}

function resolveRegistrations(
  registrations: readonly PartialXmlPackagePolicyRegistration[],
  topology: CompiledMetadataResourceTopology,
): ResolvedPartialXmlPackagePolicies {
  const matchesByRegistration = new Map<PartialXmlPackagePolicyRegistration, CompiledMetadataAssignmentNode[]>()
  const registrationsByAssignmentId = new Map<string, PartialXmlPackagePolicyRegistration[]>()

  for (const registration of registrations) {
    const matches = topology.assignments.filter((assignment) =>
      matchesTopologyPattern(registration.assignment.assignmentPattern, assignment.projectPattern)
    )
    if (matches.length === 0) {
      throw new Error(`Шаблон задания частичного XML-пакета не найден: ${registration.assignment.assignmentPattern}`)
    }
    matchesByRegistration.set(registration, matches)
    for (const assignment of matches) {
      const policies = registrationsByAssignmentId.get(assignment.id) ?? []
      policies.push(registration)
      registrationsByAssignmentId.set(assignment.id, policies)
    }
  }

  for (const [assignmentId, policies] of registrationsByAssignmentId) {
    if (policies.length > 1) {
      throw new Error(`Заданию ${assignmentId} соответствуют несколько политик частичного XML-пакета`)
    }
  }

  const assignments = new Map<string, ResolvedPartialXmlAssignmentPolicy>()
  const externalFiles = new Map<string, ResolvedPartialXmlExternalFilePolicy>()
  for (const registration of registrations) {
    const matchedAssignments = matchesByRegistration.get(registration)!
    const matchedExternalPolicies = new Set<PartialXmlExternalFilePolicy>()
    for (const assignment of matchedAssignments) {
      assignments.set(assignment.id, resolveAssignmentPolicy(assignment, registration.assignment))
      for (const external of assignment.externalFiles) {
        const matchingPolicies = (registration.externalFiles ?? []).filter((policy) =>
          matchesTopologyPattern(policy.projectPattern, external.projectPattern)
        )
        if (matchingPolicies.length > 1) {
          throw new Error(`Внешнему файлу ${external.projectPattern} соответствуют несколько политик`)
        }
        const policy = matchingPolicies[0]
        if (policy === undefined) continue
        matchedExternalPolicies.add(policy)
        externalFiles.set(external.id, Object.freeze({ externalFileId: external.id, loadTarget: policy.loadTarget }))
      }
    }
    for (const policy of registration.externalFiles ?? []) {
      if (!matchedExternalPolicies.has(policy)) {
        throw new Error(`Шаблон внешнего файла частичного XML-пакета не найден: ${policy.projectPattern}`)
      }
    }
  }

  return Object.freeze({
    assignments: immutableLookup(assignments),
    externalFiles: immutableLookup(externalFiles),
  })
}

function resolveAssignmentPolicy(
  assignment: CompiledMetadataAssignmentNode,
  policy: PartialXmlAssignmentPolicy,
): ResolvedPartialXmlAssignmentPolicy {
  const loadDocumentIds = policy.loadDocumentRoles.map((role) => {
    const matches = assignment.xmlDocuments.filter((document) => document.role === role)
    if (matches.length !== 1) {
      throw new Error(`Роль ${role} задания ${assignment.projectPattern} разрешилась в ${matches.length} документов`)
    }
    return matches[0]!.id
  })
  const companionDocuments = (policy.companionDocuments ?? []).map((companion) => {
    const matches = assignment.xmlDocuments.filter((document) =>
      matchesTopologyPattern(companion.xmlPattern, document.xmlPattern)
    )
    if (matches.length !== 1) {
      throw new Error(
        `Спутник ${companion.xmlPattern} задания ${assignment.projectPattern} разрешился в ${matches.length} документов`
      )
    }
    return Object.freeze({ documentId: matches[0]!.id, loadTarget: companion.loadTarget })
  })
  const companionReferences = (policy.companionReferences ?? []).map((reference) =>
    Object.freeze({ ...reference, yamlPath: Object.freeze([...reference.yamlPath]) })
  )
  const yamlCompanionInputIds = (policy.yamlCompanionInputs ?? []).map((input) => {
    const matches = assignment.yamlCompanions.filter((companion) =>
      matchesTopologyPattern(input.projectPattern, companion.projectPattern)
    )
    if (matches.length !== 1) {
      throw new Error(
        `YAML-вход ${input.projectPattern} задания ${assignment.projectPattern} разрешился в ${matches.length} спутников`
      )
    }
    return matches[0]!.id
  })
  return Object.freeze({
    assignmentId: assignment.id,
    loadDocumentIds: Object.freeze(loadDocumentIds),
    ...(policy.structural === undefined ? {} : { structural: policy.structural }),
    companionDocuments: Object.freeze(companionDocuments),
    companionReferences: Object.freeze(companionReferences),
    yamlCompanionInputIds: Object.freeze(yamlCompanionInputIds),
  })
}

function freezeRegistration(
  registration: PartialXmlPackagePolicyRegistration,
): PartialXmlPackagePolicyRegistration {
  const assignment = registration.assignment
  return Object.freeze({
    assignment: Object.freeze({
      ...assignment,
      loadDocumentRoles: Object.freeze([...assignment.loadDocumentRoles]),
      ...(assignment.structural === undefined ? {} : { structural: Object.freeze({ ...assignment.structural }) }),
      ...(assignment.companionDocuments === undefined
        ? {}
        : { companionDocuments: Object.freeze(assignment.companionDocuments.map((value) => Object.freeze({ ...value }))) }),
      ...(assignment.companionReferences === undefined
        ? {}
        : {
            companionReferences: Object.freeze(assignment.companionReferences.map((value) =>
              Object.freeze({ ...value, yamlPath: Object.freeze([...value.yamlPath]) })
            )),
          }),
      ...(assignment.yamlCompanionInputs === undefined
        ? {}
        : {
            yamlCompanionInputs: Object.freeze(
              assignment.yamlCompanionInputs.map((value) => Object.freeze({ ...value }))
            ),
          }),
    }),
    ...(registration.externalFiles === undefined
      ? {}
      : { externalFiles: Object.freeze(registration.externalFiles.map((value) => Object.freeze({ ...value }))) }),
  })
}

function matchesTopologyPattern(policyPattern: string, topologyPattern: string): boolean {
  const policySegments = splitPattern(policyPattern)
  const topologySegments = splitPattern(topologyPattern)
  const memo = new Map<string, boolean>()

  function visit(policyIndex: number, topologyIndex: number): boolean {
    const key = `${policyIndex}:${topologyIndex}`
    const cached = memo.get(key)
    if (cached !== undefined) return cached
    if (policyIndex === policySegments.length) return topologyIndex === topologySegments.length
    const segment = policySegments[policyIndex]!
    if (isRemainingParameter(segment)) {
      for (let next = topologyIndex + 1; next <= topologySegments.length; next += 1) {
        if (visit(policyIndex + 1, next)) {
          memo.set(key, true)
          return true
        }
      }
      memo.set(key, false)
      return false
    }
    const matches = topologyIndex < topologySegments.length &&
      (isSingleParameter(segment) || segment === topologySegments[topologyIndex]) &&
      visit(policyIndex + 1, topologyIndex + 1)
    memo.set(key, matches)
    return matches
  }

  return visit(0, 0)
}

function splitPattern(pattern: string): readonly string[] {
  return pattern.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean)
}

function isSingleParameter(segment: string): boolean {
  return /^\{[^}]+\}$/.test(segment)
}

function isRemainingParameter(segment: string): boolean {
  return /^\{[^}]+\.\.\.\}$/.test(segment)
}

function immutableLookup<Key, Value>(source: ReadonlyMap<Key, Value>): ReadonlyMap<Key, Value> {
  return Object.freeze(new ImmutableLookup(source))
}

class ImmutableLookup<Key, Value> implements ReadonlyMap<Key, Value> {
  readonly #source: ReadonlyMap<Key, Value>

  constructor(source: ReadonlyMap<Key, Value>) {
    this.#source = new Map(source)
  }

  get size(): number {
    return this.#source.size
  }

  get(key: Key): Value | undefined {
    return this.#source.get(key)
  }

  has(key: Key): boolean {
    return this.#source.has(key)
  }

  entries(): MapIterator<[Key, Value]> {
    return this.#source.entries()
  }

  keys(): MapIterator<Key> {
    return this.#source.keys()
  }

  values(): MapIterator<Value> {
    return this.#source.values()
  }

  forEach(
    callbackfn: (value: Value, key: Key, map: ReadonlyMap<Key, Value>) => void,
    thisArg?: unknown,
  ): void {
    this.#source.forEach((value, key) => callbackfn.call(thisArg, value, key, this))
  }

  [Symbol.iterator](): MapIterator<[Key, Value]> {
    return this.entries()
  }
}
