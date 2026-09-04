import {
  formXmlIdReservation,
  readXmlAnomalyRawItemXml,
  type FormXmlIdReservation,
  type FormXmlIdSpace,
} from "@nkdk/runtime"

interface Candidate {
  readonly node: Record<string, unknown>
  readonly reference: Record<string, unknown> | undefined
  readonly reservation: FormXmlIdReservation
  id?: string
}

export interface FormXmlIdAssignmentSession {
  readonly idsByLogicalAddress: Map<string, string>
  readonly occupiedBySpace: Map<FormXmlIdSpace, Set<string>>
}

const FORM_XML_ID_SPACES: readonly FormXmlIdSpace[] = ["elements", "attributes", "commands", "parameters"]

export function createFormXmlIdAssignmentSession(
  params: { readonly references?: readonly unknown[] } = {},
): FormXmlIdAssignmentSession {
  const occupiedBySpace = new Map<FormXmlIdSpace, Set<string>>(
    FORM_XML_ID_SPACES.map((space) => [space, new Set<string>()]),
  )
  for (const reference of params.references ?? []) collectReferenceIds(reference, occupiedBySpace)
  return { idsByLogicalAddress: new Map(), occupiedBySpace }
}

export function assignFormXmlIds(
  generated: unknown,
  reference?: unknown,
  session: FormXmlIdAssignmentSession = createFormXmlIdAssignmentSession(),
): void {
  const candidates: Candidate[] = []
  collectCandidates(generated, reference, candidates)
  collectReferenceIds(reference, session.occupiedBySpace)
  collectReferenceIds(generated, session.occupiedBySpace)
  collectSnapshotIds(candidates, session.occupiedBySpace)

  for (const candidate of candidates) {
    const logicalAddress = sessionLogicalAddress(candidate)
    const sessionId = logicalAddress === undefined || candidate.reservation.space !== "attributes"
      ? undefined
      : session.idsByLogicalAddress.get(logicalAddress)
    const snapshotId = validXmlId(candidate.reservation.runtime?.identity("xmlId"))
    const assignedId = validXmlId(stringId(candidate.node._id))
    const referenceId = validXmlId(stringId(candidate.reference?._id))
    // A shared session coordinates current/base-form projections from different snapshots.
    // Their historical IDs may differ; identity conflicts within one snapshot are
    // rejected by its collector, not by comparing these independent sources.
    candidate.id = candidate.reservation.specialId ?? sessionId ?? snapshotId ?? assignedId ?? referenceId
    if (candidate.id !== undefined) {
      reserveSession(candidate, session)
    }
  }

  const nextBySpace = new Map<FormXmlIdSpace, number>()
  for (const candidate of candidates) {
    if (candidate.id === undefined) {
      let next = nextBySpace.get(candidate.reservation.space) ?? firstAvailableXmlId(candidate)
      const used = session.occupiedBySpace.get(candidate.reservation.space)
      while (used?.has(String(next)) === true) next++
      candidate.id = String(next)
      nextBySpace.set(candidate.reservation.space, next + 1)
      reserveSession(candidate, session)
    }
    candidate.node._id = candidate.id
    const runtime = candidate.reservation.runtime
    if (runtime !== undefined) runtime.collector.setIdentity(runtime.logicalAddress, "xmlId", candidate.id)
  }
}

function reserveSession(candidate: Candidate, session: FormXmlIdAssignmentSession): void {
  const id = candidate.id
  const runtime = candidate.reservation.runtime
  if (id === undefined) return
  if (!isXmlId(id)) throw new Error(`Некорректный ID формы: ${id}`)
  if (candidate.reservation.specialId !== undefined) return
  if (runtime !== undefined && candidate.reservation.space === "attributes") {
    const logicalAddress = sessionLogicalAddress(candidate)
    if (logicalAddress === undefined) return
    const previousId = session.idsByLogicalAddress.get(logicalAddress)
    if (previousId !== undefined && previousId !== id) {
      throw new Error(`Логическому адресу ${logicalAddress} назначены разные ID: ${previousId} и ${id}`)
    }
    session.idsByLogicalAddress.set(logicalAddress, id)
  }
  const occupied = session.occupiedBySpace.get(candidate.reservation.space) ?? new Set<string>()
  occupied.add(id)
  session.occupiedBySpace.set(candidate.reservation.space, occupied)
}

function sessionLogicalAddress(candidate: Candidate): string | undefined {
  const logicalAddress = candidate.reservation.runtime?.logicalAddress
  if (logicalAddress === undefined || candidate.reservation.space !== "attributes") return logicalAddress
  return logicalAddress.replace(/\.ОсноваФормы(?=\.|$)/u, "")
}

function firstAvailableXmlId(candidate: Candidate): number {
  return candidate.reservation.runtime?.logicalAddress.includes(".ОсноваФормы.") === true
    ? 1_000_001
    : 1
}

function collectCandidates(generated: unknown, reference: unknown, result: Candidate[]): void {
  if (Array.isArray(generated)) {
    const references = Array.isArray(reference) ? reference : []
    for (const [index, item] of generated.entries()) {
      collectCandidates(item, findReferenceNode(item, references) ?? references[index], result)
    }
    return
  }
  if (!isRecord(generated)) return
  const referenceRecord = isRecord(reference) ? reference : undefined
  const reservation = formXmlIdReservation(generated)
  if (reservation !== undefined) result.push({ node: generated, reference: referenceRecord, reservation })
  for (const [key, child] of Object.entries(generated)) {
    collectCandidates(child, referenceRecord?.[key], result)
  }
}

function findReferenceNode(value: unknown, references: unknown[]): unknown {
  const name = nestedName(value)
  if (name === undefined) return undefined
  return references.find((item) => nestedName(item) === name)
}

function nestedName(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined
  if (typeof value._name === "string") return value._name
  const nested = Object.values(value).filter(isRecord)
  return nested.length === 1 && typeof nested[0]?._name === "string" ? nested[0]._name : undefined
}

function collectSnapshotIds(candidates: readonly Candidate[], occupied: Map<FormXmlIdSpace, Set<string>>): void {
  const visited = new Map<object, Set<string>>()
  for (const { reservation: { runtime } } of candidates) {
    const root = runtime?.formElementRootLogicalAddress
    if (runtime === undefined || root === undefined) continue
    const sourceRoot = runtime.referencePathByCurrentPath?.get(root) ?? root
    const roots = visited.get(runtime.source) ?? new Set<string>()
    if (roots.has(sourceRoot)) continue
    roots.add(sourceRoot)
    visited.set(runtime.source, roots)
    const prefix = `${sourceRoot}.`
    for (const entity of runtime.source.entities()) {
      if (!entity.logicalAddress.startsWith(prefix)) continue
      const id = validXmlId(entity.xmlId)
      if (id === undefined) continue
      const relative = entity.logicalAddress.slice(prefix.length).replace(/^ОсноваФормы\./u, "")
      const segment = relative.split(".", 1)[0]
      const space = segment === "Элемент" ? "elements"
        : segment === "Атрибут" ? "attributes"
        : segment === "Команда" ? "commands"
        : segment === "Параметр" ? "parameters" : undefined
      if (space !== undefined) occupied.get(space)?.add(id)
    }
  }
}

function stringId(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function validXmlId(value: string | undefined): string | undefined {
  return value !== undefined && isXmlId(value) ? value : undefined
}

function collectReferenceIds(
  value: unknown,
  result: Map<FormXmlIdSpace, Set<string>>,
  inheritedSpace: FormXmlIdSpace = "elements",
): void {
  if (Array.isArray(value)) {
    for (const item of value) collectReferenceIds(item, result, inheritedSpace)
    return
  }
  if (!isRecord(value)) return
  // Raw items are materialized after ID assignment. Their opaque XML travels
  // with the placeholder so its IDs can be reserved without exporting it early.
  const raw = readXmlAnomalyRawItemXml(value)
  if (raw !== undefined) collectReferenceIds(raw, result, inheritedSpace)
  const space = typeof value["#name"] === "string"
    ? referenceSpace(value["#name"]) ?? inheritedSpace
    : inheritedSpace
  const id = validXmlId(stringId(value._id))
  if (id !== undefined) result.get(space)?.add(id)
  for (const [key, child] of Object.entries(value)) {
    collectReferenceIds(child, result, referenceSpace(key) ?? space)
  }
}

function referenceSpace(key: string): FormXmlIdSpace | undefined {
  if (key === "Attributes" || key === "Attribute" || key === "Columns" || key === "Column") return "attributes"
  if (key === "Commands" || key === "Command") return "commands"
  if (key === "Parameters" || key === "Parameter") return "parameters"
  return undefined
}

function isXmlId(value: string): boolean {
  return /^(?:0|[1-9]\d*|-[1-9]\d*)$/.test(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
