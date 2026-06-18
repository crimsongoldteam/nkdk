import {
  isMetadataRootName,
  METADATA_NAME_PATTERN,
  memberKindFromYAML,
  memberKindToYAML,
  objectPathKindFromYAML,
  objectPathKindToYAML,
  rootFromYAML,
  standardAttributeFromYAML,
} from "./roots"
import type {
  MetadataMemberKind,
  MetadataMemberSegment,
  MetadataObjectSegment,
  MetadataObjectPathKind,
  MetadataRootName,
  MetadataTargetConstraint,
  MetadataTargetOwner,
  MetadataTargetParseErrorCode,
  MetadataTargetParseResult,
  MetadataValueKind,
  ParsedMetadataTarget,
} from "./types"

export interface ParseMetadataTargetFromYAMLInput {
  value: string
  constraint: MetadataTargetConstraint
  owner?: MetadataTargetOwner
}

export interface ParseMetadataTargetFromModelInput {
  canonical: string
  constraint: MetadataTargetConstraint
  owner?: MetadataTargetOwner
}

const metadataNameRegExp = new RegExp(`^${METADATA_NAME_PATTERN}$`)
const emptyRefYAML = "ПустаяСсылка"
const emptyRefModel = "EmptyRef"
const enumValueModel = "EnumValue"
type MetadataTargetSource = "yaml" | "model"

export function parseMetadataTargetFromYAML(input: ParseMetadataTargetFromYAMLInput): MetadataTargetParseResult {
  const parts = splitTarget(input.value)

  switch (input.constraint.kind) {
    case "object": {
      const constraint = input.constraint
      return parseRootedTargetFromYAML(parts, constraint, (root, objectName, tail) =>
        parseObjectTarget(root, objectName, tail, constraint, "yaml")
      )
    }
    case "member": {
      const constraint = input.constraint
      return parseMemberTargetFromYAML(parts, constraint, input.owner)
    }
    case "value": {
      const constraint = input.constraint
      return parseRootedTargetFromYAML(parts, constraint, (root, objectName, tail) =>
        parseYAMLValueTarget(root, objectName, tail, constraint)
      )
    }
    case "type":
    case "dataPath":
      return invalidShape(`Разбор целей вида "${input.constraint.kind}" не поддержан в metadataTargets`)
  }
}

export function parseMetadataTargetFromModel(input: ParseMetadataTargetFromModelInput): MetadataTargetParseResult {
  const parts = splitTarget(input.canonical)

  switch (input.constraint.kind) {
    case "object": {
      const constraint = input.constraint
      return parseRootedTargetFromModel(parts, constraint, (root, objectName, tail) =>
        parseObjectTarget(root, objectName, tail, constraint, "model")
      )
    }
    case "member": {
      const constraint = input.constraint
      return parseMemberTargetFromModel(parts, constraint, input.owner)
    }
    case "value": {
      const constraint = input.constraint
      return parseRootedTargetFromModel(parts, constraint, (root, objectName, tail) =>
        parseModelValueTarget(root, objectName, tail, constraint)
      )
    }
    case "type":
    case "dataPath":
      return invalidShape(`Разбор целей вида "${input.constraint.kind}" не поддержан в metadataTargets`)
  }
}

function parseRootedTargetFromYAML(
  parts: readonly string[],
  constraint: Extract<MetadataTargetConstraint, { kind: "object" | "member" | "value" }>,
  parseTarget: (root: MetadataRootName, objectName: string, tail: readonly string[]) => MetadataTargetParseResult
): MetadataTargetParseResult {
  const rootToken = parts[0]
  if (rootToken === undefined || rootToken === "") {
    return invalidShape()
  }

  const root = rootFromYAML[rootToken]
  if (!root) {
    return error("unknown-root", `Неизвестный корень "${rootToken}"`)
  }

  return parseRootedTarget(root, parts, constraint.roots, parseTarget)
}

function parseRootedTargetFromModel(
  parts: readonly string[],
  constraint: Extract<MetadataTargetConstraint, { kind: "object" | "member" | "value" }>,
  parseTarget: (root: MetadataRootName, objectName: string, tail: readonly string[]) => MetadataTargetParseResult
): MetadataTargetParseResult {
  const rootToken = parts[0]
  if (rootToken === undefined || rootToken === "") {
    return invalidShape()
  }

  if (!isMetadataRootName(rootToken)) {
    return error("unknown-root", `Неизвестный корень "${rootToken}"`)
  }

  return parseRootedTarget(rootToken, parts, constraint.roots, parseTarget)
}

function parseRootedTarget(
  root: MetadataRootName,
  parts: readonly string[],
  allowedRoots: readonly MetadataRootName[] | undefined,
  parseTarget: (root: MetadataRootName, objectName: string, tail: readonly string[]) => MetadataTargetParseResult
): MetadataTargetParseResult {
  if (allowedRoots && !allowedRoots.includes(root)) {
    return error("disallowed-root", `Корень "${root}" не разрешён для цели метаданных`)
  }

  const objectName = parts[1]
  if (!isValidMetadataName(objectName)) {
    return invalidShape()
  }

  return parseTarget(root, objectName, parts.slice(2))
}

function parseObjectTarget(
  root: MetadataRootName,
  objectName: string,
  tail: readonly string[],
  constraint:
    | Extract<MetadataTargetConstraint, { kind: "object" }>
    | { allowNested?: boolean; allowedObjectPaths?: undefined; nestedObjectRoots?: readonly MetadataRootName[] },
  source: MetadataTargetSource
): MetadataTargetParseResult {
  if (constraint.allowedObjectPaths) {
    const exact = parseExactObjectTarget(root, objectName, tail, constraint.allowedObjectPaths, source)
    if (exact.ok || !constraint.nestedObjectRoots) return exact
    return parseNestedRootObjectTarget(root, objectName, tail, constraint.nestedObjectRoots, source)
  }

  if (tail.length === 0) {
    return success(`${root}.${objectName}`, { kind: "object", root, objectName })
  }

  if (constraint.allowNested !== true || tail.length % 2 !== 0) {
    return unknownSegment(tail[0])
  }

  const segments: MetadataObjectSegment[] = []
  for (let index = 0; index < tail.length; index += 2) {
    const rootToken = tail[index]
    const segmentRoot = parseObjectSegmentKind(rootToken, source)
    if (!segmentRoot) {
      return unknownSegment(rootToken)
    }

    const nestedObjectName = tail[index + 1]
    if (!isValidMetadataName(nestedObjectName)) {
      return invalidShape()
    }

    segments.push({ kind: segmentRoot, objectName: nestedObjectName })
  }

  const canonicalSegments = segments.flatMap((segment) => [segment.kind, segment.objectName])
  return success([root, objectName, ...canonicalSegments].join("."), {
    kind: "object",
    root,
    objectName,
    segments,
  })
}

function parseMemberTargetFromYAML(
  parts: readonly string[],
  constraint: Extract<MetadataTargetConstraint, { kind: "member" }>,
  owner: MetadataTargetOwner | undefined
): MetadataTargetParseResult {
  if (constraint.owner === "this") {
    const objectModel = parseMemberObjectTargetFromModel(parts, constraint)
    if (objectModel.ok) return objectModel

    const exactModel = parseExactMemberTarget(parts, constraint, "model")
    if (exactModel.ok) return ensureCurrentOwner(exactModel.target, owner)

    const fullModel = parseFullModelMemberCompatibility(parts, constraint)
    if (fullModel.ok) return ensureCurrentOwner(fullModel.target, owner)

    const objectYaml = parseMemberObjectTargetFromYAML(parts, constraint)
    if (objectYaml.ok) return objectYaml

    const exactYaml = parseExactMemberTarget(parts, constraint, "yaml")
    if (exactYaml.ok) return ensureCurrentOwner(exactYaml.target, owner)

    if (constraint.allowedMemberPaths) return exactYaml

    const fullYaml = parseRootedTargetFromYAML(parts, constraint, (root, objectName, tail) =>
      parseMemberOrOwnerTarget(root, objectName, tail, constraint, "yaml")
    )
    if (fullYaml.ok) return ensureCurrentOwner(fullYaml.target, owner)

    if (!owner) return missingOwnerContext()
    return parseLocalOwnerMember(parts, constraint, owner)
  }

  const objectModel = parseMemberObjectTargetFromModel(parts, constraint)
  if (objectModel.ok) return objectModel

  const exactModel = parseExactMemberTarget(parts, constraint, "model")
  if (exactModel.ok) return exactModel

  const fullModel = parseFullModelMemberCompatibility(parts, constraint)
  if (fullModel.ok) return fullModel

  const objectYaml = parseMemberObjectTargetFromYAML(parts, constraint)
  if (objectYaml.ok) return objectYaml

  const exactYaml = parseExactMemberTarget(parts, constraint, "yaml")
  if (exactYaml.ok) return exactYaml

  if (constraint.allowedMemberPaths) return exactYaml

  return parseRootedTargetFromYAML(parts, constraint, (root, objectName, tail) =>
    parseMemberOrOwnerTarget(root, objectName, tail, constraint, "yaml")
  )
}

function parseMemberTargetFromModel(
  parts: readonly string[],
  constraint: Extract<MetadataTargetConstraint, { kind: "member" }>,
  owner: MetadataTargetOwner | undefined
): MetadataTargetParseResult {
  const objectTarget = parseMemberObjectTargetFromModel(parts, constraint)
  if (objectTarget.ok) return objectTarget

  const exactMember = parseExactMemberTarget(parts, constraint, "model")
  if (exactMember.ok) return exactMember

  if (constraint.allowedMemberPaths) return exactMember

  if (constraint.owner === "this" && owner) {
    const ownerPrefixed = parseOwnerPrefixedModelMember(parts, constraint, owner)
    if (ownerPrefixed.ok) return ownerPrefixed
  }

  const parsed = parseRootedTargetFromModel(parts, constraint, (root, objectName, tail) =>
    parseMemberOrOwnerTarget(root, objectName, tail, constraint, "model")
  )
  if (!parsed.ok || constraint.owner !== "this") return parsed
  return ensureCurrentOwner(parsed.target, owner)
}

function parseMemberObjectTargetFromYAML(
  parts: readonly string[],
  constraint: Extract<MetadataTargetConstraint, { kind: "member" }>
): MetadataTargetParseResult {
  const rootToken = parts[0]
  const root = rootToken === undefined ? undefined : rootFromYAML[rootToken]
  if (!root) return invalidShape()

  return parseMemberObjectTarget(root, parts, constraint, "yaml")
}

function parseMemberObjectTargetFromModel(
  parts: readonly string[],
  constraint: Extract<MetadataTargetConstraint, { kind: "member" }>
): MetadataTargetParseResult {
  const rootToken = parts[0]
  if (rootToken === undefined || !isMetadataRootName(rootToken)) return invalidShape()

  return parseMemberObjectTarget(rootToken, parts, constraint, "model")
}

function parseMemberObjectTarget(
  root: MetadataRootName,
  parts: readonly string[],
  constraint: Extract<MetadataTargetConstraint, { kind: "member" }>,
  source: "yaml" | "model"
): MetadataTargetParseResult {
  const objectRoots = constraint.objectRoots ?? []
  const nestedObjectRoots = constraint.nestedObjectRoots ?? []
  const tail = parts.slice(2)

  if (constraint.allowedObjectPaths) {
    const objectName = parts[1]
    if (!isValidMetadataName(objectName)) return invalidShape()
    const exact = parseExactObjectTarget(root, objectName, tail, constraint.allowedObjectPaths, source)
    if (exact.ok || !constraint.nestedObjectRoots) return exact
    return parseNestedRootObjectTarget(root, objectName, tail, constraint.nestedObjectRoots, source)
  }

  if (tail.length === 0) {
    if (!objectRoots.includes(root) && !nestedObjectRoots.includes(root)) return invalidShape()
    const objectName = parts[1]
    if (!isValidMetadataName(objectName)) return invalidShape()
    return parseObjectTarget(root, objectName, tail, { allowNested: false }, source)
  }

  if (!nestedObjectRoots.includes(root)) return invalidShape()

  const objectName = parts[1]
  if (!isValidMetadataName(objectName)) return invalidShape()
  return parseObjectTarget(root, objectName, tail, { allowNested: true }, source)
}

function parseFullModelMemberCompatibility(
  parts: readonly string[],
  constraint: Extract<MetadataTargetConstraint, { kind: "member" }>
): MetadataTargetParseResult {
  return parseRootedTargetFromModel(parts, constraint, (root, objectName, tail) =>
    parseMemberOrOwnerTarget(root, objectName, tail, constraint, "model")
  )
}

function parseOwnerPrefixedModelMember(
  parts: readonly string[],
  constraint: Extract<MetadataTargetConstraint, { kind: "member" }>,
  owner: MetadataTargetOwner
): MetadataTargetParseResult {
  const ownerParts = [owner.root, ...owner.objectName.split(".")]
  if (!hasPrefix(parts, ownerParts)) return invalidShape()

  return parseMemberSegments(owner.root, owner.objectName, parts.slice(ownerParts.length), constraint, "model")
}

function hasPrefix(parts: readonly string[], prefix: readonly string[]): boolean {
  return prefix.every((part, index) => parts[index] === part)
}

function parseMemberOrOwnerTarget(
  root: MetadataRootName,
  objectName: string,
  tail: readonly string[],
  constraint: Extract<MetadataTargetConstraint, { kind: "member" }>,
  source: "yaml" | "model"
): MetadataTargetParseResult {
  if (tail.length === 0 && constraint.allowOwner === true) {
    return success(`${root}.${objectName}`, { kind: "object", root, objectName })
  }

  return parseMemberSegments(root, objectName, tail, constraint, source)
}

function parseExactObjectTarget(
  root: MetadataRootName,
  objectName: string,
  tail: readonly string[],
  allowedObjectPaths: readonly (readonly [MetadataRootName, ...MetadataObjectPathKind[]])[],
  source: MetadataTargetSource
): MetadataTargetParseResult {
  if (tail.length % 2 !== 0) {
    return unknownSegment(tail[0])
  }

  const segments: MetadataObjectSegment[] = []
  for (let index = 0; index < tail.length; index += 2) {
    const kindToken = tail[index]
    const segmentKind = parseObjectPathKind(kindToken, source)
    if (!segmentKind) {
      return unknownSegment(kindToken)
    }

    const nestedObjectName = tail[index + 1]
    if (!isValidMetadataName(nestedObjectName)) {
      return invalidShape()
    }

    segments.push({ kind: segmentKind, objectName: nestedObjectName })
  }

  const path = [root, ...segments.map((segment) => segment.kind)] as const
  if (!isExactObjectPathAllowed(path, allowedObjectPaths)) {
    return disallowedKind(path.join("."))
  }

  const canonicalSegments = segments.flatMap((segment) => [segment.kind, segment.objectName])
  return success([root, objectName, ...canonicalSegments].join("."), {
    kind: "object",
    root,
    objectName,
    ...(segments.length > 0 ? { segments } : {}),
  })
}

function parseNestedRootObjectTarget(
  root: MetadataRootName,
  objectName: string,
  tail: readonly string[],
  nestedObjectRoots: readonly MetadataRootName[],
  source: MetadataTargetSource
): MetadataTargetParseResult {
  if (!nestedObjectRoots.includes(root)) return unknownSegment(tail[0])
  if (tail.length === 0 || tail.length % 2 !== 0) return unknownSegment(tail[0])

  const segments: MetadataObjectSegment[] = []
  for (let index = 0; index < tail.length; index += 2) {
    const kindToken = tail[index]
    const segmentRoot = source === "yaml" ? parseObjectRootFromYAML(kindToken) : parseObjectRootFromModel(kindToken)
    if (!segmentRoot || !nestedObjectRoots.includes(segmentRoot)) return unknownSegment(kindToken)

    const nestedObjectName = tail[index + 1]
    if (!isValidMetadataName(nestedObjectName)) return invalidShape()

    segments.push({ kind: segmentRoot, objectName: nestedObjectName })
  }

  const canonicalSegments = segments.flatMap((segment) => [segment.kind, segment.objectName])
  return success([root, objectName, ...canonicalSegments].join("."), {
    kind: "object",
    root,
    objectName,
    segments,
  })
}

function parseExactMemberTarget(
  parts: readonly string[],
  constraint: Extract<MetadataTargetConstraint, { kind: "member" }>,
  source: MetadataTargetSource
): MetadataTargetParseResult {
  if (!constraint.allowedMemberPaths) return invalidShape()

  const rootToken = parts[0]
  const root = source === "yaml" ? parseObjectRootFromYAML(rootToken) : parseObjectRootFromModel(rootToken)
  if (!root) return invalidShape()
  if (constraint.roots && !constraint.roots.includes(root)) {
    return error("disallowed-root", `Корень "${root}" не разрешён для цели метаданных`)
  }

  const objectName = parts[1]
  if (!isValidMetadataName(objectName)) return invalidShape()

  const tail = parts.slice(2)
  if (tail.length === 0 || tail.length % 2 !== 0) {
    return invalidShape()
  }

  const firstUnknown = findUnknownExactPathKind(tail, source)
  if (firstUnknown !== undefined) {
    return unknownSegment(firstUnknown)
  }

  for (const allowedPath of constraint.allowedMemberPaths) {
    const parsed = parseExactMemberPath(root, objectName, tail, allowedPath, source)
    if (parsed.ok) return parsed
  }

  return disallowedKind([root, ...extractExactPathKinds(tail, source)].join("."))
}

function parseExactMemberPath(
  root: MetadataRootName,
  objectName: string,
  tail: readonly string[],
  allowedPath: readonly [MetadataRootName, ...(MetadataObjectPathKind | MetadataMemberKind)[]],
  source: MetadataTargetSource
): MetadataTargetParseResult {
  if (allowedPath[0] !== root) return invalidShape()

  const expectedKinds = allowedPath.slice(1)
  if (expectedKinds.length === 0 || tail.length !== expectedKinds.length * 2) {
    return invalidShape()
  }

  const objectSegments: MetadataObjectSegment[] = []
  const memberSegments: MetadataMemberSegment[] = []

  for (let index = 0; index < expectedKinds.length; index += 1) {
    const expectedKind = expectedKinds[index]
    const kindToken = tail[index * 2]
    const name = tail[index * 2 + 1]
    if (!isValidMetadataName(name)) {
      return invalidShape()
    }

    if (isMetadataObjectPathKind(expectedKind)) {
      const actualKind = parseObjectPathKind(kindToken, source)
      if (actualKind !== expectedKind) return invalidShape()
      objectSegments.push({ kind: actualKind, objectName: name })
      continue
    }

    const actualKind = source === "yaml" ? parseMemberKindFromYAML(kindToken) : parseMemberKindFromModel(kindToken)
    if (actualKind !== expectedKind) return invalidShape()
    memberSegments.push({ kind: actualKind, name: normalizeMemberSegmentName(actualKind, name, source) })
  }

  if (memberSegments.length === 0) {
    return invalidShape()
  }

  const canonical = [
    root,
    objectName,
    ...objectSegments.flatMap((segment) => [segment.kind, segment.objectName]),
    ...memberSegments.flatMap((segment) => [segment.kind, segment.name]),
  ].join(".")

  return success(canonical, {
    kind: "member",
    root,
    objectName,
    ...(objectSegments.length > 0 ? { objectSegments } : {}),
    segments: memberSegments,
  })
}

function parseLocalOwnerMember(
  parts: readonly string[],
  constraint: Extract<MetadataTargetConstraint, { kind: "member" }>,
  owner: MetadataTargetOwner
): MetadataTargetParseResult {
  if (constraint.roots && !constraint.roots.includes(owner.root)) {
    return error("disallowed-root", `Корень "${owner.root}" не разрешён для цели метаданных`)
  }

  const memberKinds = constraint.memberKinds ?? allMemberKinds()
  const canOmitKind = memberKinds.length === 1

  if (canOmitKind && parts.length === 1) {
    return parseMemberSegments(owner.root, owner.objectName, [memberKindToYAML[memberKinds[0]], parts[0]], constraint, "yaml")
  }

  if (canOmitKind && parts.length === 2) {
    return invalidShape()
  }

  return parseMemberSegments(owner.root, owner.objectName, parts, constraint, "yaml")
}

function parseMemberSegments(
  root: MetadataRootName,
  objectName: string,
  tail: readonly string[],
  constraint: Extract<MetadataTargetConstraint, { kind: "member" }>,
  source: "yaml" | "model"
): MetadataTargetParseResult {
  if (tail.length === 0 || tail.length % 2 !== 0) {
    return invalidShape()
  }

  const segments: MetadataMemberSegment[] = []
  const allowedMemberKinds = constraint.memberKinds ?? allMemberKinds()

  for (let index = 0; index < tail.length; index += 2) {
    const kindToken = tail[index]
    const segmentKind = source === "yaml" ? parseMemberKindFromYAML(kindToken) : parseMemberKindFromModel(kindToken)
    const isTerminalSegment = index + 2 >= tail.length

    if (!segmentKind) {
      return unknownSegment(kindToken)
    }

    if (!isTerminalSegment && segmentKind !== "TabularSection") {
      return disallowedKind(segmentKind)
    }

    if (isTerminalSegment && !allowedMemberKinds.includes(segmentKind)) {
      return disallowedKind(segmentKind)
    }

    const name = tail[index + 1]
    if (!isValidMetadataName(name)) {
      return invalidShape()
    }

    segments.push({ kind: segmentKind, name: normalizeMemberSegmentName(segmentKind, name, source) })
  }

  const canonicalSegments = segments.flatMap((segment) => [segment.kind, segment.name])
  return success([root, objectName, ...canonicalSegments].join("."), { kind: "member", root, objectName, segments })
}

function ensureCurrentOwner(
  target: ParsedMetadataTarget,
  owner: MetadataTargetOwner | undefined
): MetadataTargetParseResult {
  if (target.kind !== "member" && target.kind !== "object") return success(formatCanonicalTarget(target), target)
  if (!owner) return missingOwnerContext()
  if (target.root !== owner.root || target.objectName !== owner.objectName) {
    return error("disallowed-root", `Цель "${formatCanonicalTarget(target)}" не принадлежит текущему объекту`)
  }
  return success(formatCanonicalTarget(target), target)
}

function missingOwnerContext(): MetadataTargetParseResult {
  return invalidShape('Для metadataTarget kind "member" owner "this" требуется контекст текущего объекта')
}

function formatCanonicalTarget(target: ParsedMetadataTarget): string {
  switch (target.kind) {
    case "object":
      return [
        target.root,
        target.objectName,
        ...(target.segments ?? []).flatMap((segment) => [segment.kind, segment.objectName]),
      ].join(".")
    case "member":
      return [
        target.root,
        target.objectName,
        ...(target.objectSegments ?? []).flatMap((segment) => [segment.kind, segment.objectName]),
        ...target.segments.flatMap((segment) => [segment.kind, segment.name]),
      ].join(".")
    case "value":
      if (target.valueKind === "enumValue") return `${target.root}.${target.objectName}.${enumValueModel}.${target.valueName}`
      if (target.valueKind === "emptyRef") return `${target.root}.${target.objectName}.${emptyRefModel}`
      return `${target.root}.${target.objectName}.${target.valueName}`
  }
}

function normalizeMemberSegmentName(
  kind: MetadataMemberKind,
  name: string,
  source: "yaml" | "model"
): string {
  if (kind !== "StandardAttribute" || source !== "yaml") return name
  return standardAttributeFromYAML[name] ?? name
}

function parseYAMLValueTarget(
  root: MetadataRootName,
  objectName: string,
  tail: readonly string[],
  constraint: Extract<MetadataTargetConstraint, { kind: "value" }>
): MetadataTargetParseResult {
  if (tail.length !== 1) {
    return tail.length > 1 ? unknownSegment(tail[1]) : invalidShape()
  }

  const valueToken = tail[0]
  if (!isValidMetadataName(valueToken)) {
    return invalidShape()
  }

  if (valueToken === emptyRefYAML) {
    return parseEmptyRefTarget(root, objectName, constraint)
  }

  const valueKind: MetadataValueKind = root === "Enum" ? "enumValue" : "predefinedValue"
  if (!isValueKindAllowed(valueKind, constraint)) {
    return disallowedKind(valueKind)
  }

  const canonical =
    valueKind === "enumValue"
      ? `${root}.${objectName}.${enumValueModel}.${valueToken}`
      : `${root}.${objectName}.${valueToken}`
  return success(canonical, { kind: "value", root, objectName, valueKind, valueName: valueToken })
}

function parseModelValueTarget(
  root: MetadataRootName,
  objectName: string,
  tail: readonly string[],
  constraint: Extract<MetadataTargetConstraint, { kind: "value" }>
): MetadataTargetParseResult {
  if (tail.length === 1 && tail[0] === emptyRefModel) {
    return parseEmptyRefTarget(root, objectName, constraint)
  }

  if (root === "Enum") {
    if (tail[0] !== enumValueModel) {
      return tail.length > 0 ? unknownSegment(tail[0]) : invalidShape()
    }

    if (tail.length !== 2) {
      return tail.length > 2 ? unknownSegment(tail[2]) : invalidShape()
    }

    const valueName = tail[1]
    if (!isValidMetadataName(valueName)) {
      return invalidShape()
    }

    if (!isValueKindAllowed("enumValue", constraint)) {
      return disallowedKind("enumValue")
    }

    return success(`${root}.${objectName}.${enumValueModel}.${valueName}`, {
      kind: "value",
      root,
      objectName,
      valueKind: "enumValue",
      valueName,
    })
  }

  if (tail.length !== 1) {
    if (tail.length === 0) {
      return invalidShape()
    }

    return unknownSegment(tail[0] === "PredefinedData" ? tail[0] : tail[1])
  }

  const valueName = tail[0]
  if (!isValidMetadataName(valueName)) {
    return invalidShape()
  }

  if (!isValueKindAllowed("predefinedValue", constraint)) {
    return disallowedKind("predefinedValue")
  }

  return success(`${root}.${objectName}.${valueName}`, {
    kind: "value",
    root,
    objectName,
    valueKind: "predefinedValue",
    valueName,
  })
}

function parseEmptyRefTarget(
  root: MetadataRootName,
  objectName: string,
  constraint: Extract<MetadataTargetConstraint, { kind: "value" }>
): MetadataTargetParseResult {
  if (!constraint.allowEmptyRef || !isValueKindAllowed("emptyRef", constraint)) {
    return disallowedKind("emptyRef")
  }

  return success(`${root}.${objectName}.${emptyRefModel}`, { kind: "value", root, objectName, valueKind: "emptyRef" })
}

function parseMemberKindFromYAML(value: string | undefined): MetadataMemberKind | undefined {
  return value === undefined ? undefined : memberKindFromYAML[value]
}

function parseMemberKindFromModel(value: string | undefined): MetadataMemberKind | undefined {
  return value !== undefined && Object.prototype.hasOwnProperty.call(memberKindToYAML, value)
    ? (value as MetadataMemberKind)
    : undefined
}

function parseObjectPathKind(value: string | undefined, source: MetadataTargetSource): MetadataObjectPathKind | undefined {
  if (value === undefined) return undefined
  if (source === "yaml") return objectPathKindFromYAML[value]
  return Object.prototype.hasOwnProperty.call(objectPathKindToYAML, value) ? (value as MetadataObjectPathKind) : undefined
}

function parseObjectSegmentKind(
  value: string | undefined,
  source: MetadataTargetSource
): MetadataRootName | MetadataObjectPathKind | undefined {
  return source === "yaml"
    ? parseObjectRootFromYAML(value) ?? parseObjectPathKind(value, source)
    : parseObjectRootFromModel(value) ?? parseObjectPathKind(value, source)
}

function isMetadataObjectPathKind(value: string): value is MetadataObjectPathKind {
  return Object.prototype.hasOwnProperty.call(objectPathKindToYAML, value)
}

function allMemberKinds(): readonly MetadataMemberKind[] {
  return Object.keys(memberKindToYAML) as MetadataMemberKind[]
}

function parseObjectRootFromYAML(value: string | undefined): MetadataRootName | undefined {
  return value === undefined ? undefined : rootFromYAML[value]
}

function parseObjectRootFromModel(value: string | undefined): MetadataRootName | undefined {
  return value !== undefined && isMetadataRootName(value) ? value : undefined
}

function isExactObjectPathAllowed(
  path: readonly (MetadataRootName | MetadataObjectPathKind)[],
  allowedObjectPaths: readonly (readonly [MetadataRootName, ...MetadataObjectPathKind[]])[]
): boolean {
  return allowedObjectPaths.some((allowedPath) => arePathsEqual(path, allowedPath))
}

function arePathsEqual(
  left: readonly (MetadataRootName | MetadataObjectPathKind | MetadataMemberKind)[],
  right: readonly (MetadataRootName | MetadataObjectPathKind | MetadataMemberKind)[]
): boolean {
  return left.length === right.length && left.every((part, index) => part === right[index])
}

function findUnknownExactPathKind(tail: readonly string[], source: MetadataTargetSource): string | undefined {
  for (let index = 0; index < tail.length; index += 2) {
    const kindToken = tail[index]
    const objectKind = parseObjectPathKind(kindToken, source)
    const memberKind = source === "yaml" ? parseMemberKindFromYAML(kindToken) : parseMemberKindFromModel(kindToken)
    if (!objectKind && !memberKind) return kindToken
  }
  return undefined
}

function extractExactPathKinds(
  tail: readonly string[],
  source: MetadataTargetSource
): (MetadataObjectPathKind | MetadataMemberKind)[] {
  return tail.flatMap((part, index) => {
    if (index % 2 !== 0) return []
    return parseObjectPathKind(part, source) ?? (source === "yaml" ? parseMemberKindFromYAML(part) : parseMemberKindFromModel(part)) ?? []
  })
}

function isValueKindAllowed(
  valueKind: MetadataValueKind,
  constraint: Extract<MetadataTargetConstraint, { kind: "value" }>
): boolean {
  return constraint.valueKinds === undefined || constraint.valueKinds.includes(valueKind)
}

function splitTarget(value: string): string[] {
  return value.split(".")
}

function isValidMetadataName(value: string | undefined): value is string {
  return value !== undefined && metadataNameRegExp.test(value)
}

function success(canonical: string, target: ParsedMetadataTarget): MetadataTargetParseResult {
  return { ok: true, canonical, target }
}

function error(code: MetadataTargetParseErrorCode, message: string): MetadataTargetParseResult {
  return { ok: false, code, message }
}

function unknownSegment(segment: string | undefined): MetadataTargetParseResult {
  return error("unknown-segment", `Неизвестный сегмент "${segment ?? ""}"`)
}

function disallowedKind(kind: string): MetadataTargetParseResult {
  return error("disallowed-kind", `Вид цели "${kind}" не разрешён`)
}

function invalidShape(message = "Некорректный формат цели метаданных"): MetadataTargetParseResult {
  return error("invalid-shape", message)
}
