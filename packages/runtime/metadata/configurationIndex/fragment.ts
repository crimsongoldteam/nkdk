import { decodeBlockV1, encodeBlockV1 } from "./blockCodec"
import { validateConfigurationIndexProjectPath } from "./store"
import { compareConfigurationIndexUtf8, configurationIndexErrorMessage } from "./utilities"
import type {
  ConfigurationIndexBlockEntity,
  ConfigurationIndexBlockFragment,
  ConfigurationIndexFragmentCollection,
} from "./types"

const FRAGMENT_MAGIC = "NKDKCIF5"
const fatalUtf8Decoder = new TextDecoder("utf-8", { fatal: true })
const utf8Encoder = new TextEncoder()

interface FragmentEnvelope {
  readonly magic: typeof FRAGMENT_MAGIC
  readonly version: 5
  readonly fragments: readonly ConfigurationIndexBlockFragment[]
}

export interface ConfigurationIndexFragmentBuilder {
  add(fragment: ConfigurationIndexBlockFragment): void
  addEncoded(buffer: ArrayBuffer): void
  metrics(): { readonly projectPaths: number; readonly entities: number; readonly retainedInputFragments: 0 }
  finish(): ConfigurationIndexFragmentCollection
}

export function createConfigurationIndexFragmentBuilder(): ConfigurationIndexFragmentBuilder {
  const blocks = new Map<string, Map<string, ConfigurationIndexBlockEntity>>()
  let finished = false
  return {
    add(fragment) {
      if (finished) throw new Error("Builder фрагментов индекса конфигурации уже завершён")
      const normalized = normalizeFragment(fragment)
      const block = blocks.get(normalized.targetProjectPath) ?? new Map<string, ConfigurationIndexBlockEntity>()
      blocks.set(normalized.targetProjectPath, block)
      for (const entity of normalized.entities) {
        const previous = block.get(entity.logicalAddress)
        block.set(entity.logicalAddress, previous === undefined ? structuredClone(entity) : mergeEntity(previous, entity))
      }
    },
    addEncoded(buffer) {
      for (const fragment of decodeConfigurationBlockFragments(buffer)) this.add(fragment)
    },
    metrics() {
      return {
        projectPaths: blocks.size,
        entities: [...blocks.values()].reduce((sum, entities) => sum + entities.size, 0),
        retainedInputFragments: 0,
      }
    },
    finish() {
      if (finished) throw new Error("Builder фрагментов индекса конфигурации уже завершён")
      finished = true
      const fragments = [...blocks]
        .sort(([left], [right]) => compareConfigurationIndexUtf8(left, right))
        .map(([targetProjectPath, entities]) => ({
          targetProjectPath,
          entities: [...entities.values()].sort((left, right) => compareConfigurationIndexUtf8(left.logicalAddress, right.logicalAddress)),
        }))
      blocks.clear()
      return { fragments }
    },
  }
}

export function encodeConfigurationBlockFragments(
  fragments: readonly ConfigurationIndexBlockFragment[],
): ArrayBuffer {
  const envelope: FragmentEnvelope = {
    magic: FRAGMENT_MAGIC,
    version: 5,
    fragments: fragments.map(normalizeFragment),
  }
  const bytes = utf8Encoder.encode(JSON.stringify(envelope))
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}

export function decodeConfigurationBlockFragments(buffer: ArrayBuffer): ConfigurationIndexBlockFragment[] {
  try {
    if (!(buffer instanceof ArrayBuffer)) throw new Error("ожидался ArrayBuffer")
    const parsed: unknown = JSON.parse(fatalUtf8Decoder.decode(new Uint8Array(buffer)))
    if (!isRecord(parsed)) throw new Error("конверт должен быть объектом")
    assertExactKeys(parsed, ["magic", "version", "fragments"], "конверт")
    if (parsed.magic !== FRAGMENT_MAGIC || parsed.version !== 5) throw new Error("неподдерживаемая версия")
    if (!Array.isArray(parsed.fragments)) throw new Error("fragments должен быть массивом")
    return parsed.fragments.map(decodeFragment)
  } catch (error) {
    throw new Error(`Некорректный буфер фрагментов индекса конфигурации: ${errorMessage(error)}`, { cause: error })
  }
}

export function mergeConfigurationIndexFragments(
  workerBuffers: readonly ArrayBuffer[],
): ConfigurationIndexFragmentCollection {
  const builder = createConfigurationIndexFragmentBuilder()
  for (const buffer of workerBuffers) builder.addEncoded(buffer)
  return builder.finish()
}

function decodeFragment(value: unknown): ConfigurationIndexBlockFragment {
  if (!isRecord(value)) throw new Error("фрагмент должен быть объектом")
  assertExactKeys(value, ["targetProjectPath", "entities"], "фрагмент")
  if (typeof value.targetProjectPath !== "string") throw new Error("targetProjectPath должен быть строкой")
  if (!Array.isArray(value.entities)) throw new Error("entities должен быть массивом")
  return normalizeFragment({
    targetProjectPath: value.targetProjectPath,
    entities: value.entities.map(decodeEntity),
  })
}

function decodeEntity(value: unknown): ConfigurationIndexBlockEntity {
  if (!isRecord(value)) throw new Error("entity должна быть объектом")
  assertExactKeys(value, ["logicalAddress", "uuid", "xmlId", "children"], "entity")
  if (typeof value.logicalAddress !== "string") throw new Error("logicalAddress должен быть строкой")
  if (value.uuid !== undefined && typeof value.uuid !== "string") throw new Error("uuid должен быть строкой")
  if (value.xmlId !== undefined && typeof value.xmlId !== "string") throw new Error("xmlId должен быть строкой")
  if (value.children !== undefined && !Array.isArray(value.children)) throw new Error("children должен быть массивом")
  const children = value.children?.map((child) => {
    if (!isRecord(child)) throw new Error("children item должен быть объектом")
    assertExactKeys(child, ["xmlName", "name"], "children item")
    if (typeof child.xmlName !== "string" || typeof child.name !== "string") throw new Error("children item содержит не строку")
    return { xmlName: child.xmlName, name: child.name }
  })
  return {
    logicalAddress: value.logicalAddress,
    ...(value.uuid === undefined ? {} : { uuid: value.uuid }),
    ...(value.xmlId === undefined ? {} : { xmlId: value.xmlId }),
    ...(children === undefined ? {} : { children }),
  }
}

function normalizeFragment(fragment: ConfigurationIndexBlockFragment): ConfigurationIndexBlockFragment {
  const targetProjectPath = validateConfigurationIndexProjectPath(fragment.targetProjectPath)
  const block = decodeBlockV1(encodeBlockV1({ entities: fragment.entities }))
  return { targetProjectPath, entities: block.entities }
}

function mergeEntity(
  previous: ConfigurationIndexBlockEntity,
  next: ConfigurationIndexBlockEntity,
): ConfigurationIndexBlockEntity {
  const result: ConfigurationIndexBlockEntity = { logicalAddress: previous.logicalAddress }
  for (const field of ["uuid", "xmlId", "children"] as const) {
    const left = previous[field]
    const right = next[field]
    if (left !== undefined && right !== undefined && !equalValue(left, right)) {
      throw new Error(`Конфликт logicalAddress ${previous.logicalAddress}: поле ${field}`)
    }
    Object.assign(result, (right ?? left) === undefined ? {} : { [field]: structuredClone(right ?? left) })
  }
  return result
}

function equalValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function assertExactKeys(value: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const unknown = Object.keys(value).find((key) => !allowed.includes(key))
  if (unknown !== undefined) throw new Error(`${label} содержит неизвестное поле ${unknown}`)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function errorMessage(error: unknown): string {
  return configurationIndexErrorMessage(error)
}
