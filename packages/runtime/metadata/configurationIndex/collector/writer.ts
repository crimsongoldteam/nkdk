import type {
  ConfigurationIndexBlockEntity,
  ConfigurationIndexBlockFragment,
  ConfigurationIndexChild,
} from "../types"
import { copyConfigurationIndexBlockEntity } from "../blockCodec"
import {
  attachXmlImportAttemptAdapter,
  type XmlImportAttemptAdapter,
} from "../../ruleRuntime/xmlAnomaly/attempt"

type IdentityKind = "uuid" | "xmlId"

export interface ConfigurationIndexCollector {
  setIdentity(address: string, kind: IdentityKind, value: string): void
  setChildren(address: string, value: readonly ConfigurationIndexChild[]): void
  fragment(targetProjectPath: string): ConfigurationIndexBlockFragment
}

interface MutableEntity {
  readonly logicalAddress: string
  uuid?: string
  xmlId?: string
  children?: readonly ConfigurationIndexChild[]
}

interface ConfigurationIndexWrite {
  readonly address: string
  readonly field: "uuid" | "xmlId" | "children"
  readonly value: string | readonly ConfigurationIndexChild[]
}

interface ConfigurationIndexCheckpoint {
  readonly position: number
  state: "active" | "committed"
}

class InMemoryConfigurationIndexCollector implements ConfigurationIndexCollector {
  private readonly entities = new Map<string, MutableEntity>()
  private readonly writes: ConfigurationIndexWrite[] = []
  private readonly attemptCheckpoints: ConfigurationIndexCheckpoint[] = []

  setIdentity(address: string, kind: IdentityKind, value: string): void {
    if (kind === "uuid" && !isUuid(value)) throw new Error("Некорректный UUID")
    if (kind === "xmlId" && value.length === 0) throw new Error("Пустой xmlId")
    const entity = this.entity(address)
    const current = entity[kind]
    if (current !== undefined) {
      assertEqualValues(address, kind, current, value)
      return
    }
    this.writes.push({ address, field: kind, value })
    entity[kind] = value
  }

  setChildren(address: string, value: readonly ConfigurationIndexChild[]): void {
    assertChildren(value)
    const entity = this.entity(address)
    if (entity.children !== undefined) {
      assertEqualValues(address, "children", entity.children, value, equalChildren)
      return
    }
    const children = value.map((child) => ({ ...child }))
    this.writes.push({ address, field: "children", value: children })
    entity.children = children
  }

  fragment(targetProjectPath: string): ConfigurationIndexBlockFragment {
    return {
      targetProjectPath,
      entities: [...this.entities.values()]
        .map(normalizeEntity)
        .sort((left, right) => compareUtf8(left.logicalAddress, right.logicalAddress)),
    }
  }

  private entity(logicalAddress: string): MutableEntity {
    if (logicalAddress.length === 0) throw new Error("Пустой logicalAddress")
    const existing = this.entities.get(logicalAddress)
    if (existing !== undefined) return existing
    const entity: MutableEntity = { logicalAddress }
    this.entities.set(logicalAddress, entity)
    return entity
  }

  attemptAdapter(): XmlImportAttemptAdapter {
    return {
      begin: () => {
        const checkpoint: ConfigurationIndexCheckpoint = {
          position: this.writes.length,
          state: "active",
        }
        this.attemptCheckpoints.push(checkpoint)
        return checkpoint
      },
      prepare: (checkpoint) => {
        this.currentAttempt(checkpoint, "active")
      },
      commit: (checkpoint) => {
        this.currentAttempt(checkpoint, "active").state = "committed"
      },
      release: (checkpoint) => {
        this.currentAttempt(checkpoint, "committed")
        this.attemptCheckpoints.pop()
      },
      rollback: (checkpoint) => {
        const current = this.currentAttempt(checkpoint)
        this.writes.length = current.position
        this.rebuildEntities()
        this.attemptCheckpoints.pop()
      },
    }
  }

  private currentAttempt(
    checkpoint: unknown,
    state?: ConfigurationIndexCheckpoint["state"],
  ): ConfigurationIndexCheckpoint {
    const expected = this.attemptCheckpoints.at(-1)
    if (expected === undefined || expected !== checkpoint || (state !== undefined && expected.state !== state)) {
      throw new Error("Нарушен порядок XML-import attempts configuration index")
    }
    return expected
  }

  private rebuildEntities(): void {
    this.entities.clear()
    for (const write of this.writes) {
      const entity = this.entity(write.address)
      if (write.field === "children") {
        entity.children = (write.value as readonly ConfigurationIndexChild[]).map((child) => ({ ...child }))
      } else {
        entity[write.field] = write.value as string
      }
    }
  }
}

export function createConfigurationIndexCollector(): ConfigurationIndexCollector {
  const collector = new InMemoryConfigurationIndexCollector()
  attachXmlImportAttemptAdapter(collector, collector.attemptAdapter())
  return collector
}

export function createDiscardingConfigurationIndexCollector(): ConfigurationIndexCollector {
  const discard = (): void => undefined
  return {
    setIdentity: discard,
    setChildren: discard,
    fragment(targetProjectPath) {
      return { targetProjectPath, entities: [] }
    },
  }
}

function normalizeEntity(entity: MutableEntity): ConfigurationIndexBlockEntity {
  return copyConfigurationIndexBlockEntity({
    logicalAddress: entity.logicalAddress,
    uuid: entity.uuid,
    xmlId: entity.xmlId,
    children: entity.children?.map((child) => ({ ...child })),
  })
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(value)
}

function assertChildren(value: readonly ConfigurationIndexChild[]): void {
  if (value.length === 0) throw new Error("Пустой список children")
  for (const child of value) {
    if (child.xmlName.length === 0 || child.name.length === 0) throw new Error("Пустое поле children")
  }
}

function equalChildren(left: readonly ConfigurationIndexChild[], right: readonly ConfigurationIndexChild[]): boolean {
  return left.length === right.length && left.every(
    (item, index) => item.xmlName === right[index]?.xmlName && item.name === right[index]?.name,
  )
}

function assertEqualValues<T>(
  address: string,
  field: string,
  previous: T,
  next: T,
  equals: (left: T, right: T) => boolean = Object.is,
): void {
  if (!equals(previous, next)) {
    throw new Error(
      `Конфликт logicalAddress ${address}: несовпадающие значения ${field} ${JSON.stringify(previous)} и ${JSON.stringify(next)}`,
    )
  }
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
}
