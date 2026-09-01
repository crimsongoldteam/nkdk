import {
  formXmlIdReservation,
  type FormXmlIdReservation,
  type FormXmlIdSpace,
} from "@nkdk/runtime"

interface Candidate {
  readonly node: Record<string, unknown>
  readonly reference: Record<string, unknown> | undefined
  readonly reservation: FormXmlIdReservation
  readonly scope: object
  id?: string
}

export interface FormXmlIdAssignmentSession {
  readonly idsByLogicalAddress: Map<string, string>
  readonly occupiedBySpace: Map<FormXmlIdSpace, Set<string>>
}

const FORM_XML_ID_SPACES: readonly FormXmlIdSpace[] = ["elements", "attributes", "commands", "parameters"]
const sessionOwners = new WeakMap<FormXmlIdAssignmentSession, Map<FormXmlIdSpace, Map<string, string>>>()

export function createFormXmlIdAssignmentSession(
  params: { readonly references?: readonly unknown[] } = {},
): FormXmlIdAssignmentSession {
  const occupiedBySpace = new Map<FormXmlIdSpace, Set<string>>(
    FORM_XML_ID_SPACES.map((space) => [space, new Set<string>()]),
  )
  for (const reference of params.references ?? []) collectReferenceIds(reference, occupiedBySpace)
  const session = { idsByLogicalAddress: new Map(), occupiedBySpace }
  sessionOwners.set(session, new Map())
  return session
}

export function assignFormXmlIds(
  generated: unknown,
  reference?: unknown,
  session: FormXmlIdAssignmentSession = createFormXmlIdAssignmentSession(),
): void {
  const candidates: Candidate[] = []
  collectCandidates(generated, reference, candidates, rootScope(generated))

  const occupied = new Map<object, Map<string, Candidate>>()
  for (const candidate of candidates) {
    const logicalAddress = candidate.reservation.runtime?.logicalAddress
    const sessionId = logicalAddress === undefined ? undefined : session.idsByLogicalAddress.get(logicalAddress)
    const snapshotId = validXmlId(candidate.reservation.runtime?.identity("xmlId"))
    const referenceId = validXmlId(stringId(candidate.reference?._id))
    candidate.id = candidate.reservation.specialId ?? sessionId ?? snapshotId ?? referenceId
    if (candidate.id !== undefined) {
      reserve(candidate, occupied)
      reserveSession(candidate, session)
    }
  }

  const nextBySpace = new Map<FormXmlIdSpace, number>()
  for (const candidate of candidates) {
    if (candidate.id === undefined) {
      let next = nextBySpace.get(candidate.reservation.space) ?? 1
      const used = session.occupiedBySpace.get(candidate.reservation.space)
      while (used?.has(String(next)) === true) next++
      candidate.id = String(next)
      nextBySpace.set(candidate.reservation.space, next + 1)
      reserve(candidate, occupied)
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
  if (id === undefined || runtime === undefined || candidate.reservation.specialId !== undefined) return
  const logicalAddress = runtime.logicalAddress
  const bySpace = sessionOwners.get(session) ?? new Map<FormXmlIdSpace, Map<string, string>>()
  const owners = bySpace.get(candidate.reservation.space) ?? new Map<string, string>()
  const previousAddress = owners.get(id)
  if (previousAddress !== undefined && previousAddress !== logicalAddress) {
    throw new Error(`Повторный ID ${id} в XML-контейнере (${candidate.reservation.space})`)
  }
  const previousId = session.idsByLogicalAddress.get(logicalAddress)
  if (previousId !== undefined && previousId !== id) {
    throw new Error(`Логическому адресу ${logicalAddress} назначены разные ID: ${previousId} и ${id}`)
  }
  owners.set(id, logicalAddress)
  bySpace.set(candidate.reservation.space, owners)
  sessionOwners.set(session, bySpace)
  session.idsByLogicalAddress.set(logicalAddress, id)
  const occupied = session.occupiedBySpace.get(candidate.reservation.space) ?? new Set<string>()
  occupied.add(id)
  session.occupiedBySpace.set(candidate.reservation.space, occupied)
}

function collectCandidates(generated: unknown, reference: unknown, result: Candidate[], scope: object): void {
  if (Array.isArray(generated)) {
    const references = Array.isArray(reference) ? reference : []
    for (const [index, item] of generated.entries()) {
      collectCandidates(item, findReferenceNode(item, references) ?? references[index], result, generated)
    }
    return
  }
  if (!isRecord(generated)) return
  const referenceRecord = isRecord(reference) ? reference : undefined
  const reservation = formXmlIdReservation(generated)
  if (reservation !== undefined) result.push({ node: generated, reference: referenceRecord, reservation, scope })
  const childScope = reservation === undefined ? scope : generated
  for (const [key, child] of Object.entries(generated)) {
    collectCandidates(child, referenceRecord?.[key], result, childScope)
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

function reserve(
  candidate: Candidate,
  occupied: Map<object, Map<string, Candidate>>,
): void {
  const id = candidate.id
  if (id === undefined) return
  if (!isXmlId(id)) throw new Error(`Некорректный ID формы: ${id}`)
  if (candidate.reservation.specialId !== undefined) return
  const byId = occupied.get(candidate.scope) ?? new Map<string, Candidate>()
  const previous = byId.get(id)
  if (previous !== undefined && previous !== candidate) {
    throw new Error(`Повторный ID ${id} в XML-контейнере (${candidate.reservation.space})`)
  }
  byId.set(id, candidate)
  occupied.set(candidate.scope, byId)
}

function rootScope(value: unknown): object {
  return value !== null && typeof value === "object" ? value : {}
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
  const id = validXmlId(stringId(value._id))
  if (id !== undefined) result.get(inheritedSpace)?.add(id)
  for (const [key, child] of Object.entries(value)) {
    collectReferenceIds(child, result, referenceSpace(key) ?? inheritedSpace)
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
