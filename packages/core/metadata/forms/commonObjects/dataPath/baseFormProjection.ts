import { resolveDataPathCore } from "../../../validation/dataPath/coreResolver"
import type { FormDataPathIndex } from "../../../validation/dataPath/formIndex"
import type { OwnerMetadataCache } from "../../../validation/dataPath/ownerCache"
import type { FormDataPathSource } from "../../../validation/dataPath/types"
import {
  registerBaseFormPropertyProjector,
  registerBaseFormReferenceProjector,
  type BaseFormReferenceProjector,
} from "../../clientApplicationForm/baseFormProjectionRegistry"

const unusedOwnerCache: OwnerMetadataCache = {
  get: () => {
    throw new Error("BaseForm DataPath projection only resolves a form attribute root")
  },
  listRefs: () => [],
}

const dataPathReferenceProjector = {
  project: ({ baseValue, context }) => {
    if (typeof baseValue !== "string" || baseValue === "" || baseValue === "0") {
      return { kind: "include", value: baseValue }
    }
    return isBaseFormDataPathRootAvailable(baseValue, context.attributeNames)
      ? { kind: "include", value: baseValue }
      : { kind: "omit" }
  },
} satisfies BaseFormReferenceProjector

registerBaseFormReferenceProjector(
  "DataPath",
  dataPathReferenceProjector
)
registerBaseFormPropertyProjector(
  "DataPath",
  dataPathReferenceProjector
)

function isBaseFormDataPathRootAvailable(value: string, attributeNames: ReadonlySet<string>): boolean {
  const rootIndex = createBaseFormDataPathRootIndex(attributeNames)
  const result = resolveDataPathCore({
    value,
    nameMode: "yaml",
    index: rootIndex.index,
    ownerCache: unusedOwnerCache,
  })
  return result.status !== "error" && rootIndex.didResolveAvailableRoot()
}

function createBaseFormDataPathRootIndex(attributeNames: ReadonlySet<string>): {
  readonly index: FormDataPathIndex
  didResolveAvailableRoot(): boolean
} {
  const roots = new Map<string, FormDataPathSource>()
  let resolvedAvailableRoot = false
  for (const name of attributeNames) {
    roots.set(name, {
      kind: "formAttribute",
      name,
      typeInfo: {
        kinds: ["platformSource"],
        nextTypes: [],
      },
    })
  }
  return {
    index: {
      roots,
      additionalColumnsByTablePath: new Map(),
      tableDataPathByElementName: new Map(),
      duplicateDiagnostics: [],
      getRoot(name) {
        const root = roots.get(name)
        resolvedAvailableRoot ||= root !== undefined
        return root
      },
    },
    didResolveAvailableRoot: () => resolvedAvailableRoot,
  }
}
