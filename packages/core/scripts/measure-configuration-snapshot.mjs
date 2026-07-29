import fs from "node:fs"
import path from "node:path"
import { tsImport } from "tsx/esm/api"

const HEADER_CHECKSUM_BYTES = 16
const SECTION_CHECKSUM_BYTES = 16
const STRING_OWNER_NAMES = ["container", "files", "entityBase", "identities", "omittedChildren", "xml"]

try {
  const snapshotPath = commandSnapshotPath(process.argv.slice(2))
  const input = await fs.promises.readFile(snapshotPath)
  const { decodeConfigurationIndex } = await tsImport("../metadata/configurationIndex/index.ts", import.meta.url)
  const snapshot = decodeConfigurationIndex(input)
  if (snapshot.specificationVersion !== "1.3") {
    throw new Error(`Неподдерживаемая версия снимка: ${snapshot.specificationVersion}`)
  }
  process.stdout.write(`${JSON.stringify(measureConfigurationSnapshot(input, snapshot), null, 2)}\n`)
} catch (caught) {
  process.stderr.write(`${caught instanceof Error ? caught.message : String(caught)}\n`)
  process.exitCode = 1
}

function commandSnapshotPath(args) {
  const normalized = args[0] === "--" ? args.slice(1) : args
  if (normalized.length !== 1) {
    throw new Error(
      "Использование: node scripts/measure-configuration-snapshot.mjs /absolute/path/configuration-index.bin"
    )
  }
  const [snapshotPath] = normalized
  if (!path.isAbsolute(snapshotPath)) throw new Error("Путь к configuration-index.bin должен быть абсолютным")
  return snapshotPath
}

function measureConfigurationSnapshot(input, snapshot) {
  const container = inspectContainer(input)
  const strings = measureStrings(container.stringValues, snapshot)
  const measurement = {
    fileBytes: input.length,
    files: {
      records: snapshot.files.length,
      payloadBytes: snapshot.files.length * 12,
    },
    entities: measureEntities(snapshot.entities),
    strings,
    physical: container.physical,
  }
  if (measurement.physical.totalBytes !== measurement.fileBytes) {
    throw new Error(
      `Физическая разбивка ${measurement.physical.totalBytes} не совпадает с размером файла ${measurement.fileBytes}`
    )
  }
  return measurement
}

function measureEntities(entities) {
  let identitiesPayloadBytes = 0
  let omittedChildrenPayloadBytes = 0
  let xmlPayloadBytes = 0
  for (const entity of entities) {
    if (entity.identities?.uuid !== undefined) identitiesPayloadBytes += 16
    if (entity.identities?.xmlId !== undefined) identitiesPayloadBytes += 4
    if (entity.identities?.xmlName !== undefined) identitiesPayloadBytes += 4

    if (entity.omittedChildren?.kind === "names") {
      omittedChildrenPayloadBytes += 4 + entity.omittedChildren.names.length * 4
    } else if (entity.omittedChildren?.kind === "typedNames") {
      omittedChildrenPayloadBytes += 4 + entity.omittedChildren.items.length * 8
    }

    if (entity.xml?.xsiType !== undefined) xmlPayloadBytes += 4
    if (entity.xml?.xmlText !== undefined) xmlPayloadBytes += 4
    if (entity.xml?.xmlPrefix !== undefined) xmlPayloadBytes += 4
  }
  return {
    records: entities.length,
    basePayloadBytes: entities.length * 12,
    identitiesPayloadBytes,
    omittedChildrenPayloadBytes,
    xmlPayloadBytes,
  }
}

function measureStrings(values, snapshot) {
  const ownersByValue = collectStringOwners(snapshot)
  const byOwner = Object.fromEntries(STRING_OWNER_NAMES.map((owner) => [owner, 0]))
  let totalBytes = 0
  let sharedBytes = 0
  for (const value of values) {
    const bytes = Buffer.byteLength(value, "utf8")
    totalBytes += bytes
    const owners = ownersByValue.get(value)
    if (owners?.size === 1) {
      const [owner] = owners
      if (STRING_OWNER_NAMES.includes(owner)) {
        byOwner[owner] += bytes
        continue
      }
    }
    sharedBytes += bytes
  }
  return { totalBytes, sharedBytes, byOwner }
}

function collectStringOwners(snapshot) {
  const result = new Map()
  addOwner(result, snapshot.componentPath, "container")
  for (const file of snapshot.files) addOwner(result, file.projectPath, "files")
  for (const entity of snapshot.entities) {
    addOwner(result, entity.logicalAddress, "entityBase")
    addOwner(result, entity.sourceProjectPath, "entityBase")
    addOptionalOwner(result, entity.identities?.xmlId, "identities")
    addOptionalOwner(result, entity.identities?.xmlName, "identities")
    if (entity.omittedChildren?.kind === "names") {
      for (const name of entity.omittedChildren.names) addOwner(result, name, "omittedChildren")
    } else if (entity.omittedChildren?.kind === "typedNames") {
      for (const item of entity.omittedChildren.items) {
        addOwner(result, item.xmlName, "omittedChildren")
        addOwner(result, item.name, "omittedChildren")
      }
    }
    addOptionalOwner(result, entity.xml?.xsiType, "xml")
    addOptionalOwner(result, entity.xml?.xmlText, "xml")
    addOptionalOwner(result, entity.xml?.xmlPrefix, "xml")
  }
  return result
}

function addOptionalOwner(ownersByValue, value, owner) {
  if (value !== undefined) addOwner(ownersByValue, value, owner)
}

function addOwner(ownersByValue, value, owner) {
  const owners = ownersByValue.get(value)
  if (owners === undefined) ownersByValue.set(value, new Set([owner]))
  else owners.add(owner)
}

function inspectContainer(input) {
  const headerBytesOnDisk = input.readUInt32LE(12)
  const directoryEntryBytes = input.readUInt32LE(20)
  const sectionCount = input.readUInt32LE(24)
  const directoryOffset = safeNumber(input.readBigUInt64LE(32), "directoryOffset")
  const directoryBytesOnDisk = directoryEntryBytes * sectionCount
  const entries = []
  for (let index = 0; index < sectionCount; index += 1) {
    const entryOffset = directoryOffset + index * directoryEntryBytes
    entries.push({
      type: input.readUInt32LE(entryOffset),
      offset: safeNumber(input.readBigUInt64LE(entryOffset + 16), "sectionOffset"),
      length: safeNumber(input.readBigUInt64LE(entryOffset + 24), "sectionLength"),
      records: safeNumber(input.readBigUInt64LE(entryOffset + 40), "recordCount"),
    })
  }

  let paddingBytes = 0
  let previousEnd = directoryOffset + directoryBytesOnDisk
  const sectionPayloadBytes = { snapshot: 0, strings: 0, files: 0, entities: 0 }
  let stringValues = []
  for (const entry of entries) {
    paddingBytes += entry.offset - previousEnd
    const section = input.subarray(entry.offset, entry.offset + entry.length)
    if (entry.type === 1) sectionPayloadBytes.snapshot = section.length
    else if (entry.type === 2) {
      const inspected = inspectVariableRecords(section, entry.records, true)
      sectionPayloadBytes.strings = inspected.payloadBytes
      paddingBytes += inspected.paddingBytes
      stringValues = inspected.values
    } else if (entry.type === 3) sectionPayloadBytes.files = section.length
    else if (entry.type === 4) {
      const inspected = inspectVariableRecords(section, entry.records, false)
      sectionPayloadBytes.entities = inspected.payloadBytes
      paddingBytes += inspected.paddingBytes
    }
    previousEnd = entry.offset + entry.length
  }

  const headerBytes = headerBytesOnDisk - HEADER_CHECKSUM_BYTES
  const directoryBytes = directoryBytesOnDisk - sectionCount * SECTION_CHECKSUM_BYTES
  const checksumBytes = HEADER_CHECKSUM_BYTES + sectionCount * SECTION_CHECKSUM_BYTES
  const sectionBytes = Object.values(sectionPayloadBytes).reduce((total, bytes) => total + bytes, 0)
  const totalBytes = headerBytes + directoryBytes + checksumBytes + sectionBytes + paddingBytes
  return {
    stringValues,
    physical: {
      headerBytes,
      directoryBytes,
      checksumBytes,
      sectionPayloadBytes,
      paddingBytes,
      totalBytes,
    },
  }
}

function inspectVariableRecords(section, recordCount, decodeStrings) {
  const values = []
  let payloadBytes = 0
  let paddingBytes = 0
  let offset = 0
  for (let index = 0; index < recordCount; index += 1) {
    const byteLength = section.readUInt32LE(offset)
    const unalignedLength = 4 + byteLength
    const alignedLength = align8(unalignedLength)
    payloadBytes += unalignedLength
    paddingBytes += alignedLength - unalignedLength
    if (decodeStrings) values.push(section.subarray(offset + 4, offset + unalignedLength).toString("utf8"))
    offset += alignedLength
  }
  if (offset !== section.length) throw new Error("Физический обход секции не совпал с её длиной")
  return { values, payloadBytes, paddingBytes }
}

function align8(value) {
  return Math.ceil(value / 8) * 8
}

function safeNumber(value, label) {
  const number = Number(value)
  if (!Number.isSafeInteger(number)) throw new Error(`${label} вне безопасного диапазона`)
  return number
}
