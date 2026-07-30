import { copyFile, lstat, mkdir, readdir, realpath, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

function comparablePath(filePath) {
  const normalized = path.normalize(filePath)
  return process.platform === "win32" ? normalized.toLowerCase() : normalized
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate)
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
}

function resolveRequiredPath(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} path must be a non-empty string`)
  }
  return path.resolve(value)
}

async function resolveCanonicalPath(filePath) {
  const missingSegments = []
  let currentPath = filePath

  while (true) {
    try {
      const existingPath = await realpath(currentPath)
      return path.join(existingPath, ...missingSegments.reverse())
    } catch (error) {
      if (!(error instanceof Error) || error.code !== "ENOENT") {
        throw error
      }

      const parentPath = path.dirname(currentPath)
      if (parentPath === currentPath) {
        throw error
      }
      missingSegments.push(path.basename(currentPath))
      currentPath = parentPath
    }
  }
}

function assertSeparateTrees(input, output) {
  if (comparablePath(input) === comparablePath(output)) {
    throw new Error("Input and output paths must differ")
  }
  if (isInside(input, output)) {
    throw new Error("Output directory must not be inside input directory")
  }
  if (isInside(output, input)) {
    throw new Error("input directory must not be inside output directory")
  }
}

async function scanDirectory(inputRoot) {
  const entries = []

  async function visit(relativeDirectory) {
    const absoluteDirectory = path.join(inputRoot, relativeDirectory)
    const children = await readdir(absoluteDirectory, { withFileTypes: true })
    children.sort((left, right) => left.name.localeCompare(right.name))

    for (const child of children) {
      const relativePath = path.join(relativeDirectory, child.name)
      const absolutePath = path.join(inputRoot, relativePath)
      const info = await lstat(absolutePath)

      if (info.isSymbolicLink()) {
        throw new Error(`Unsupported symbolic link: ${absolutePath}`)
      }
      if (info.isDirectory()) {
        entries.push({ kind: "directory", relativePath })
        await visit(relativePath)
        continue
      }
      if (info.isFile()) {
        entries.push({ kind: "file", relativePath, size: info.size })
        continue
      }

      throw new Error(`Unsupported special entry: ${absolutePath}`)
    }
  }

  await visit("")
  return entries
}

export async function compactXmlCatalog(inputPath, outputPath) {
  const input = resolveRequiredPath(inputPath, "Input")
  const output = resolveRequiredPath(outputPath, "Output")

  let inputInfo
  try {
    inputInfo = await lstat(input)
  } catch (error) {
    if (!(error instanceof Error) || error.code !== "ENOENT") {
      throw error
    }
  }
  if (!inputInfo?.isDirectory()) {
    throw new Error(`Invalid input directory: ${input}`)
  }

  assertSeparateTrees(input, output)
  const canonicalInput = await realpath(input)
  const canonicalOutput = await resolveCanonicalPath(output)
  assertSeparateTrees(canonicalInput, canonicalOutput)

  const entries = await scanDirectory(input)

  await rm(output, { recursive: true, force: true })
  await mkdir(output, { recursive: true })

  const result = {
    inputPath: input,
    outputPath: output,
    xmlFiles: 0,
    emptiedFiles: 0,
    excludedFiles: 0,
    directories: 1,
    inputBytes: 0,
    outputBytes: 0,
  }

  for (const entry of entries) {
    const target = path.join(output, entry.relativePath)

    if (entry.kind === "directory") {
      await mkdir(target, { recursive: true })
      result.directories += 1
      continue
    }

    result.inputBytes += entry.size
    const fileName = path.basename(entry.relativePath).toLowerCase()
    if (fileName === "configdumpinfo.xml") {
      result.excludedFiles += 1
    } else if (fileName === "template.xml") {
      await writeFile(target, Buffer.alloc(0))
      result.emptiedFiles += 1
    } else if (path.extname(entry.relativePath).toLowerCase() === ".xml") {
      await copyFile(path.join(input, entry.relativePath), target)
      result.xmlFiles += 1
      result.outputBytes += entry.size
    } else {
      await writeFile(target, Buffer.alloc(0))
      result.emptiedFiles += 1
    }
  }

  return result
}

async function runCli() {
  if (process.argv.length !== 4) {
    console.error("Usage: node compact-xml-catalog.mjs <input-directory> <output-directory>")
    process.exitCode = 1
    return
  }

  try {
    const result = await compactXmlCatalog(process.argv[2], process.argv[3])
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

const isDirectRun =
  process.argv[1] && comparablePath(path.resolve(process.argv[1])) === comparablePath(fileURLToPath(import.meta.url))

if (isDirectRun) {
  await runCli()
}
