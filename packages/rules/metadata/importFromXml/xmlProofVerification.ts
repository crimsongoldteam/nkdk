import {
  applyXmlPatch,
  decodeXmlRawValue,
  mergeXmlRawFragments,
  xmlElementRawValue,
  type XmlDocument,
  type XmlRawMergeBoundary,
  type XmlRawValue,
} from "@nkdk/runtime"

export interface XmlProofTransformation {
  readonly sourcePath: string
  readonly side: "source" | "exported"
  readonly xmlPath: string
  readonly value: XmlRawValue
  readonly hasSemanticValue: boolean
  readonly terminal?: "order"
}

export function transformedXmlRootsAreExact(params: {
  readonly sourcePath: string
  readonly source: XmlDocument
  readonly exported: XmlDocument
  readonly transformations: readonly XmlProofTransformation[]
}): boolean {
  const sourceRoots = transformedRoots(params.source.roots, params, "source")
  const exportedRoots = transformedRoots(params.exported.roots, params, "exported")
  if (sourceRoots.length !== exportedRoots.length) return false
  return sourceRoots.every((root, index) => {
    const exported = exportedRoots[index]
    return exported !== undefined
      && root.name === exported.name
      && root.path === exported.path
      && root.structuralHash === exported.structuralHash
  })
}

function transformedRoots(
  roots: XmlDocument["roots"],
  params: Parameters<typeof transformedXmlRootsAreExact>[0],
  side: XmlProofTransformation["side"],
): XmlDocument["roots"] {
  const transformations = params.transformations
    .filter((transformation) =>
      transformation.sourcePath === params.sourcePath && transformation.side === side
    )
  const nestedTransformations = transformations
    .filter((transformation) => concreteXmlPathSegments(transformation.xmlPath).length > 1)
    .sort((left, right) =>
      concreteXmlPathSegments(right.xmlPath).length - concreteXmlPathSegments(left.xmlPath).length
    )
  let result = roots
  for (const transformation of nestedTransformations) {
    result = mergeXmlRawFragments(result, [transformationBoundary(transformation)])
  }
  for (const transformation of transformations) {
    if (concreteXmlPathSegments(transformation.xmlPath).length !== 1) continue
    result = applyRootSemanticPatch(result, transformation)
  }
  return result
}

function applyRootSemanticPatch(
  roots: XmlDocument["roots"],
  transformation: XmlProofTransformation,
): XmlDocument["roots"] {
  if (
    transformation.hasSemanticValue !== true
    || transformation.terminal !== undefined
    || !isXmlMapping(transformation.value)
  ) {
    throw new Error(`Точечное proof-преобразование не может заменять корень XML-документа: ${transformation.xmlPath}`)
  }
  const rootIndex = roots.findIndex(({ path }) => path === transformation.xmlPath)
  if (rootIndex < 0) throw new Error(`Не найден корень XML-документа: ${transformation.xmlPath}`)
  const root = roots[rootIndex]!
  const rootValue = xmlElementRawValue(root)
  if (rootValue === null) throw new Error(`Корень XML-документа не может быть null: ${transformation.xmlPath}`)
  const patched = applyXmlPatch(rootValue, transformation.value)
  const decoded = decodeXmlRawValue(patched, { elementName: root.name }).nodes
  if (decoded.length !== 1 || decoded[0]?.name !== root.name) {
    throw new Error(`Поправка порядка изменила корень XML-документа: ${transformation.xmlPath}`)
  }
  return roots.map((candidate, index) => index === rootIndex ? decoded[0]! : candidate)
}

function isXmlMapping(value: XmlRawValue): boolean {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function transformationBoundary(
  transformation: XmlProofTransformation,
): XmlRawMergeBoundary {
  const segments = concreteXmlPathSegments(transformation.xmlPath)
  if (segments.length === 1) {
    throw new Error(`Точечное proof-преобразование не может заменять корень XML-документа: ${transformation.xmlPath}`)
  }
  const nested = segments.slice(1)
  const terminal = transformation.terminal === "order"
    ? [...nested, { name: "#order", occurrence: null }]
    : nested
  return {
    path: terminal.map(({ name }) => name).join("\\"),
    occurrencePath: terminal.map(({ occurrence }) => occurrence),
    value: transformation.value,
    suppressOrdinaryOutput: !transformation.hasSemanticValue,
    ...(transformation.terminal === "order"
      ? {}
      : { hasSemanticValue: transformation.hasSemanticValue }),
  }
}

function concreteXmlPathSegments(
  xmlPath: string,
): readonly { readonly name: string; readonly occurrence: number }[] {
  const parts = xmlPath.split("/").filter((part) => part.length > 0)
  if (parts.length === 0) throw new Error(`Пустой physical XML-путь: ${xmlPath}`)
  return parts.map((part) => {
    const match = /^(.*)\[(\d+)\]$/u.exec(part)
    if (match === null || match[1] === undefined || match[1].length === 0 || match[2] === undefined) {
      throw new Error(`Некорректный physical XML-путь: ${xmlPath}`)
    }
    const occurrence = Number(match[2])
    if (!Number.isSafeInteger(occurrence) || occurrence < 1) {
      throw new Error(`Некорректный occurrence в physical XML-пути: ${xmlPath}`)
    }
    return { name: match[1], occurrence }
  })
}
