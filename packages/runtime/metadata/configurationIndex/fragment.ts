import { decodeBlockV1, encodeBlockV1 } from "./blockCodec"
import { validateConfigurationIndexProjectPath } from "./store"
import { compareConfigurationIndexUtf8, configurationIndexErrorMessage } from "./utilities"
import type {
  ConfigurationIndexBlockEntity,
  ConfigurationIndexBlockFragment,
  ConfigurationIndexChild,
  ConfigurationIndexFragmentCollection,
} from "./types"

const FRAGMENT_MAGIC = "NKDKCIF7"
const fatalUtf8Decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true })
const utf8Encoder = new TextEncoder()
const fragmentMagic = utf8Encoder.encode(FRAGMENT_MAGIC)
const MAX_U32 = 0xffff_ffff

export interface ConfigurationIndexFragmentBuilder {
  add(fragment: ConfigurationIndexBlockFragment): void
  addEncoded(buffer: ArrayBuffer): void
  metrics(): { readonly projectPaths: number; readonly entities: number; readonly retainedInputFragments: 0 }
  finish(): ConfigurationIndexFragmentCollection
}

export function createConfigurationIndexFragmentBuilder(): ConfigurationIndexFragmentBuilder {
  const blocks = new Map<string, Map<string, ConfigurationIndexBlockEntity>>()
  let finished = false
  function addValidated(fragment: ConfigurationIndexBlockFragment): void {
    if (finished) throw new Error("Builder фрагментов индекса конфигурации уже завершён")
    const block = blocks.get(fragment.targetProjectPath) ?? new Map<string, ConfigurationIndexBlockEntity>()
    blocks.set(fragment.targetProjectPath, block)
    for (const entity of fragment.entities) {
      const previous = block.get(entity.logicalAddress)
      block.set(entity.logicalAddress, previous === undefined ? structuredClone(entity) : mergeEntity(previous, entity))
    }
  }
  return {
    add(fragment) {
      addValidated(normalizeFragment(fragment))
    },
    addEncoded(buffer) {
      if (finished) throw new Error("Builder фрагментов индекса конфигурации уже завершён")
      try {
        visitConfigurationBlockFragments(buffer, addValidated)
      } catch (error) {
        blocks.clear()
        finished = true
        throw error
      }
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
  if (fragments.length > MAX_U32) throw new Error("Слишком много фрагментов индекса конфигурации")
  let length = fragmentMagic.byteLength + 4
  const encoded = fragments.map((fragment) => {
    const path = utf8Encoder.encode(validateConfigurationIndexProjectPath(fragment.targetProjectPath))
    const block = encodeBlockV1({ entities: fragment.entities })
    length += 8 + path.byteLength + block.byteLength
    if (length > MAX_U32) throw new Error("Слишком большой буфер фрагментов индекса конфигурации")
    return [path, block] as const
  })
  const buffer = new ArrayBuffer(length)
  const bytes = new Uint8Array(buffer)
  const header = new DataView(buffer)
  bytes.set(fragmentMagic)
  header.setUint32(fragmentMagic.byteLength, fragments.length, true)
  let offset = fragmentMagic.byteLength + 4
  for (const parts of encoded) {
    for (const part of parts) {
      header.setUint32(offset, part.byteLength, true)
      offset += 4
      bytes.set(part, offset)
      offset += part.byteLength
    }
  }
  return buffer
}

export function decodeConfigurationBlockFragments(buffer: ArrayBuffer): ConfigurationIndexBlockFragment[] {
  const fragments: ConfigurationIndexBlockFragment[] = []
  visitConfigurationBlockFragments(buffer, (fragment) => fragments.push(fragment))
  return fragments
}

function visitConfigurationBlockFragments(
  buffer: ArrayBuffer,
  visit: (fragment: ConfigurationIndexBlockFragment) => void,
): void {
  try {
    if (!(buffer instanceof ArrayBuffer)) throw new Error("ожидался ArrayBuffer")
    const bytes = new Uint8Array(buffer)
    if (!fragmentMagic.every((byte, index) => bytes[index] === byte)) throw new Error("неподдерживаемая версия")
    const header = new DataView(buffer)
    let offset = fragmentMagic.byteLength
    function readCount(): number {
      if (offset + 4 > buffer.byteLength) throw new Error("усечённый заголовок")
      const count = header.getUint32(offset, true)
      offset += 4
      return count
    }
    function readBytes(): Uint8Array {
      const size = readCount()
      if (size > buffer.byteLength - offset) throw new Error("усечённые данные")
      const result = bytes.subarray(offset, offset + size)
      offset += size
      return result
    }
    const count = readCount()
    if (count > (buffer.byteLength - offset) / 8) throw new Error("некорректное количество фрагментов")
    for (let index = 0; index < count; index++) {
      const targetProjectPath = validateConfigurationIndexProjectPath(fatalUtf8Decoder.decode(readBytes()))
      const block = decodeBlockV1(readBytes())
      visit({ targetProjectPath, entities: block.entities })
    }
    if (offset !== buffer.byteLength) throw new Error("лишние данные")
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
  for (const field of ["uuid", "xmlId", "xmlValue", "children"] as const) {
    const left = previous[field]
    const right = next[field]
    if (left !== undefined && right !== undefined && !equalValue(left, right)) {
      throw new Error(`Конфликт logicalAddress ${previous.logicalAddress}: поле ${field}`)
    }
    Object.assign(result, (right ?? left) === undefined ? {} : { [field]: structuredClone(right ?? left) })
  }
  return result
}

function equalValue(left: string | readonly ConfigurationIndexChild[], right: string | readonly ConfigurationIndexChild[]): boolean {
  if (typeof left === "string" || typeof right === "string") return left === right
  return left.length === right.length && left.every((child, index) =>
    child.xmlName === right[index]!.xmlName && child.name === right[index]!.name,
  )
}

function errorMessage(error: unknown): string {
  return configurationIndexErrorMessage(error)
}
