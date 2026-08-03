export type TableSourceProfile = "dynamicList" | "rowFilter" | "none"

interface TableSourceIndex {
  getRoot(name: string):
    | { readonly typeInfo: { readonly table?: { readonly kind: string } } }
    | undefined
}

interface TableSourceResolution {
  readonly status: "ok" | "warning" | "error"
  readonly target?: {
    readonly segments: readonly string[]
    readonly source: { readonly kind: string }
    readonly typeInfo: {
      readonly isComposite?: boolean
      readonly nextTypes: readonly unknown[]
      readonly table?: { readonly kind: string }
    }
  }
}

export function classifyTableSource(params: {
  dataPath: unknown
  index: TableSourceIndex
  resolve?: (value: string) => TableSourceResolution
}): TableSourceProfile {
  if (typeof params.dataPath !== "string" || params.dataPath.trim().length === 0) return "rowFilter"
  const resolved = params.resolve?.(params.dataPath)
  if (resolved === undefined) return classifyDirectRoot(params.dataPath, params.index)
  if (resolved.status === "error") return "rowFilter"
  const target = resolved.target
  if (target === undefined || target.typeInfo.isComposite === true || target.typeInfo.nextTypes.length > 1) return "none"

  const kind = target.typeInfo.table?.kind
  if (kind === "DynamicList" && target.source.kind === "formAttribute" && target.segments.length === 1) {
    return "dynamicList"
  }
  if (kind === "ValueTable" || kind === "TabularSection" || kind === "RegisterRecordSet") return "rowFilter"
  return "none"
}

function classifyDirectRoot(dataPath: string, index: TableSourceIndex): TableSourceProfile {
  const kind = index.getRoot(dataPath)?.typeInfo.table?.kind
  if (kind === "DynamicList") return "dynamicList"
  if (kind === "ValueTable" || kind === "TabularSection" || kind === "RegisterRecordSet") return "rowFilter"
  return "none"
}
