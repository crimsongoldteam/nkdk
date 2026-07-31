import { readdir, stat } from "node:fs/promises"
import { isAbsolute, join, resolve, sep } from "node:path"

const XML_METADATA = Symbol.for("metadata")
const MAX_SMALL_XML_BYTES = 65_536

export function parseXmlParserArguments(argv) {
  const args = argv[0] === "--" ? argv.slice(1) : [...argv]
  const options = { xmlDir: undefined, largePaths: [], sampleSize: 5000, runs: 3 }

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    const value = args[index + 1]
    if (argument === "--xml-dir") {
      options.xmlDir = requiredAbsolutePath(argument, value)
      index += 1
    } else if (argument === "--large") {
      options.largePaths.push(requiredAbsolutePath(argument, value))
      index += 1
    } else if (argument === "--sample-size") {
      const sampleSize = Number(value)
      if (!Number.isSafeInteger(sampleSize) || sampleSize <= 0) {
        throw new Error("--sample-size должен быть положительным целым числом")
      }
      options.sampleSize = sampleSize
      index += 1
    } else {
      throw new Error(`Неизвестный параметр XML benchmark: ${argument}`)
    }
  }

  return options
}

export async function collectXmlCorpus(coreDir, options) {
  const absoluteCoreDir = resolve(coreDir)
  const coreXmlPaths = await collectXmlPaths(absoluteCoreDir)
  const fixturePaths = sortAndDeduplicate(
    coreXmlPaths.filter((path) => {
      const parts = path.slice(absoluteCoreDir.length + 1).split(sep)
      return parts.includes("fixtures") || parts.includes("__fixtures__")
    })
  )

  let smallPaths = []
  if (options.xmlDir !== undefined) {
    if (!isAbsolute(options.xmlDir)) throw new Error("--xml-dir должен быть абсолютным путём")
    const candidates = []
    for (const path of await collectXmlPaths(options.xmlDir)) {
      const file = await stat(path)
      if (file.size > 0 && file.size <= MAX_SMALL_XML_BYTES) candidates.push(resolve(path))
    }
    const sortedCandidates = sortAndDeduplicate(candidates)
    smallPaths = selectEvenly(sortedCandidates, options.sampleSize)
  }

  const largePaths = []
  for (const path of options.largePaths) {
    if (!isAbsolute(path)) throw new Error(`Путь крупного XML должен быть абсолютным: ${path}`)
    const file = await stat(path)
    if (!file.isFile()) throw new Error(`Крупный XML не является файлом: ${path}`)
    largePaths.push(resolve(path))
  }

  return {
    fixturePaths,
    smallPaths,
    largePaths: sortAndDeduplicate(largePaths),
    allPaths: deduplicate([...fixturePaths, ...smallPaths, ...largePaths]),
  }
}

export function comparableXml(value) {
  if (Array.isArray(value)) {
    const copy = value.map(comparableXml)
    for (const key of Object.keys(value)) {
      if (isArrayIndex(key, value.length)) continue
      copy[key] = comparableXml(value[key])
    }
    appendComparableMetadata(value, copy)
    return copy
  }
  if (typeof value !== "object" || value === null) return value

  const copy = {}
  for (const [key, child] of Object.entries(value)) copy[key] = comparableXml(child)
  appendComparableMetadata(value, copy)
  return copy
}

export function firstDifferencePath(left, right, path = "$") {
  if (Object.is(left, right)) return undefined
  if (typeof left !== typeof right || left === null || right === null) return path
  if (typeof left !== "object") return path
  if (Array.isArray(left) !== Array.isArray(right)) return path

  if (Array.isArray(left) && Array.isArray(right)) {
    const commonLength = Math.min(left.length, right.length)
    for (let index = 0; index < commonLength; index += 1) {
      const difference = firstDifferencePath(left[index], right[index], `${path}[${index}]`)
      if (difference !== undefined) return difference
    }
    if (left.length !== right.length) return `${path}[${commonLength}]`
  }

  const ignoredArrayKeys = Array.isArray(left) ? new Set(Array.from({ length: left.length }, (_, i) => String(i))) : undefined
  const leftKeys = Object.keys(left).filter((key) => !ignoredArrayKeys?.has(key)).sort(compareUtf8)
  const rightKeys = Object.keys(right).filter((key) => !ignoredArrayKeys?.has(key)).sort(compareUtf8)
  const allKeys = [...new Set([...leftKeys, ...rightKeys])].sort(compareUtf8)
  for (const key of allKeys) {
    if (!Object.prototype.hasOwnProperty.call(left, key) || !Object.prototype.hasOwnProperty.call(right, key)) {
      return `${path}.${key}`
    }
    const difference = firstDifferencePath(left[key], right[key], `${path}.${key}`)
    if (difference !== undefined) return difference
  }
  return undefined
}

async function collectXmlPaths(directory) {
  const paths = []
  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) paths.push(...(await collectXmlPaths(path)))
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".xml")) paths.push(resolve(path))
  }
  return paths
}

function selectEvenly(paths, sampleSize) {
  if (paths.length <= sampleSize) return paths
  return Array.from({ length: sampleSize }, (_, index) => paths[Math.floor((index * paths.length) / sampleSize)])
}

function appendComparableMetadata(source, target) {
  const childOrder = source[XML_METADATA]?.childOrder
  if (childOrder !== undefined) target["@@childOrder"] = comparableXml(childOrder)
}

function requiredAbsolutePath(argument, value) {
  if (value === undefined || !isAbsolute(value)) throw new Error(`${argument} требует абсолютный путь`)
  return value
}

function isArrayIndex(key, length) {
  const index = Number(key)
  return Number.isInteger(index) && index >= 0 && index < length && String(index) === key
}

function deduplicate(paths) {
  return [...new Set(paths.map((path) => resolve(path)))]
}

function sortAndDeduplicate(paths) {
  return deduplicate(paths).sort(compareUtf8)
}

function compareUtf8(left, right) {
  return Buffer.from(left).compare(Buffer.from(right))
}
