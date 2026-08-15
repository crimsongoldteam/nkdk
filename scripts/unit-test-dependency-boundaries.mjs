const forbiddenModules = new Map([
  ["child_process", "process"],
  ["fs", "filesystem"],
  ["fs/promises", "filesystem"],
  ["http", "network"],
  ["https", "network"],
  ["lmdb", "database"],
  ["net", "network"],
  ["node:child_process", "process"],
  ["node:dgram", "network"],
  ["node:dns", "network"],
  ["node:fs", "filesystem"],
  ["node:fs/promises", "filesystem"],
  ["node:http", "network"],
  ["node:https", "network"],
  ["node:net", "network"],
  ["node:sqlite", "database"],
  ["node:tls", "network"],
  ["node:worker_threads", "worker"],
  ["piscina", "worker"],
  ["ssh2", "network"],
  ["tls", "network"],
  ["undici", "network"],
  ["worker_threads", "worker"],
  ["ws", "network"],
])

const unitTestPattern = /\.test\.(?:[cm]?[jt]sx?)$/u
const integrationTestPattern = /\.integration\.test\.(?:[cm]?[jt]sx?)$/u

export function findForbiddenUnitTestDependencies(files) {
  return files
    .filter(({ file }) => unitTestPattern.test(file) && !integrationTestPattern.test(file))
    .flatMap(findFileViolations)
    .sort((left, right) => compareText(left.file, right.file) || compareText(left.specifier, right.specifier))
}

function findFileViolations({ file, source }) {
  const tokens = tokenize(source)
  const localBindings = collectLocalBindings(tokens)
  const violations = new Map()

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token.kind !== "identifier") continue

    if (token.value === "import") {
      addModuleViolation(violations, file, importSpecifier(tokens, index))
    } else if (token.value === "export") {
      addModuleViolation(violations, file, exportSpecifier(tokens, index))
    } else if (token.value === "require" && tokens[index + 1]?.value === "(" &&
      tokens[index + 2]?.kind === "string") {
      addModuleViolation(violations, file, tokens[index + 2].value)
    } else if (token.value === "fetch" && tokens[index + 1]?.value === "(" && !localBindings.has("fetch")) {
      addViolation(violations, file, "fetch", "network")
    } else if (token.value === "WebSocket" && tokens[index + 1]?.value === "(" &&
      !localBindings.has("WebSocket")) {
      addViolation(violations, file, "WebSocket", "network")
    }
  }

  return [...violations.values()]
}

function importSpecifier(tokens, start) {
  if (tokens[start + 1]?.value === "(" && tokens[start + 2]?.kind === "string") {
    return tokens[start + 2].value
  }
  for (let index = start + 1; index < tokens.length && tokens[index].value !== ";"; index += 1) {
    if (tokens[index].kind === "string") return tokens[index].value
  }
  return undefined
}

function exportSpecifier(tokens, start) {
  for (let index = start + 1; index < tokens.length && tokens[index].value !== ";"; index += 1) {
    if (tokens[index].value === "from" && tokens[index + 1]?.kind === "string") return tokens[index + 1].value
  }
  return undefined
}

function collectLocalBindings(tokens) {
  const bindings = new Set()
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token.kind !== "identifier") continue
    if (["const", "let", "var", "function", "class"].includes(token.value) &&
      tokens[index + 1]?.kind === "identifier") {
      bindings.add(tokens[index + 1].value)
    }
    if (token.value === "import" && tokens[index + 1]?.value !== "(" && tokens[index + 1]?.kind !== "string") {
      for (let cursor = index + 1; cursor < tokens.length && tokens[cursor].kind !== "string"; cursor += 1) {
        if (tokens[cursor].kind === "identifier" && !["as", "from", "type"].includes(tokens[cursor].value)) {
          bindings.add(tokens[cursor].value)
        }
      }
    }
  }
  return bindings
}

function addModuleViolation(violations, file, specifier) {
  const category = forbiddenModules.get(specifier)
  if (category !== undefined) addViolation(violations, file, specifier, category)
}

function addViolation(violations, file, specifier, category) {
  violations.set(`${specifier}\0${category}`, { file, specifier, category })
}

function tokenize(source) {
  const tokens = []
  let index = 0
  while (index < source.length) {
    const character = source[index]
    if (/\s/u.test(character)) {
      index += 1
      continue
    }
    if (character === "/" && source[index + 1] === "/") {
      index = skipUntil(source, index + 2, "\n")
      continue
    }
    if (character === "/" && source[index + 1] === "*") {
      index = skipUntil(source, index + 2, "*/")
      continue
    }
    if (character === '"' || character === "'" || character === "`") {
      const string = readString(source, index, character)
      tokens.push({ kind: "string", value: string.value })
      index = string.end
      continue
    }
    if (/[A-Za-z_$]/u.test(character)) {
      const start = index
      index += 1
      while (index < source.length && /[A-Za-z0-9_$]/u.test(source[index])) index += 1
      tokens.push({ kind: "identifier", value: source.slice(start, index) })
      continue
    }
    tokens.push({ kind: "punctuation", value: character })
    index += 1
  }
  return tokens
}

function readString(source, start, quote) {
  let value = ""
  let index = start + 1
  while (index < source.length) {
    const character = source[index]
    if (character === "\\") {
      if (index + 1 < source.length) value += source[index + 1]
      index += 2
      continue
    }
    if (character === quote) return { value, end: index + 1 }
    value += character
    index += 1
  }
  return { value, end: index }
}

function skipUntil(source, start, marker) {
  const end = source.indexOf(marker, start)
  return end === -1 ? source.length : end + marker.length
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0
}
