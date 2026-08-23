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

interface ConfigurationIndexUndoEntry {
  readonly address: string
  readonly field: "uuid" | "xmlId" | "children"
  readonly previous: string | readonly ConfigurationIndexChild[] | undefined
  readonly entityExisted: boolean
}

class InMemoryConfigurationIndexCollector implements ConfigurationIndexCollector {
  private readonly entities = new Map<string, MutableEntity>()
  private readonly undoLog: ConfigurationIndexUndoEntry[] = []
  private readonly attemptCheckpoints: number[] = []

  setIdentity(address: string, kind: IdentityKind, value: string): void {
    if (kind === "uuid" && !isUuid(value)) throw new Error("Некорректный UUID")
    if (kind === "xmlId" && value.length === 0) throw new Error("Пустой xmlId")
    const entityExisted = this.entities.has(address)
    const entity = this.entity(address)
    const previous = entity[kind]
    if (previous !== undefined) {
      assertEqualValues(address, kind, previous, value)
      return
    }
    this.recordUndo(address, kind, previous, entityExisted)
    entity[kind] = value
  }

  setChildren(address: string, value: readonly ConfigurationIndexChild[]): void {
    assertChildren(value)
    const entityExisted = this.entities.has(address)
    const entity = this.entity(address)
    if (entity.children !== undefined) {
      assertEqualValues(address, "children", entity.children, value, equalChildren)
      return
    }
    this.recordUndo(address, "children", undefined, entityExisted)
    entity.children = value.map((child) => ({ ...child }))
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
        const checkpoint = this.undoLog.length
        this.attemptCheckpoints.push(checkpoint)
        return checkpoint
      },
      commit: (checkpoint) => {
        this.closeAttempt(checkpoint)
        if (this.attemptCheckpoints.length === 0) this.undoLog.length = 0
      },
      rollback: (checkpoint) => {
        const index = this.closeAttempt(checkpoint)
        for (let position = this.undoLog.length - 1; position >= index; position -= 1) {
          this.restore(this.undoLog[position]!)
        }
        this.undoLog.length = index
      },
    }
  }

  private recordUndo(
    address: string,
    field: ConfigurationIndexUndoEntry["field"],
    previous: ConfigurationIndexUndoEntry["previous"],
    entityExisted: boolean,
  ): void {
    if (this.attemptCheckpoints.length === 0) return
    this.undoLog.push({
      address,
      field,
      previous,
      entityExisted,
    })
  }

  private closeAttempt(checkpoint: unknown): number {
    const expected = this.attemptCheckpoints.at(-1)
    if (typeof checkpoint !== "number" || expected !== checkpoint) {
      throw new Error("Нарушен порядок XML-import attempts configuration index")
    }
    this.attemptCheckpoints.pop()
    return checkpoint
  }

  private restore(entry: ConfigurationIndexUndoEntry): void {
    const entity = this.entities.get(entry.address)
    if (entity === undefined) return
    if (entry.previous === undefined) delete entity[entry.field]
    else if (entry.field === "children") {
      entity.children = (entry.previous as readonly ConfigurationIndexChild[]).map((child) => ({ ...child }))
    } else {
      entity[entry.field] = entry.previous as string
    }
    if (!entry.entityExisted && entity.uuid === undefined && entity.xmlId === undefined && entity.children === undefined) {
      this.entities.delete(entry.address)
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
