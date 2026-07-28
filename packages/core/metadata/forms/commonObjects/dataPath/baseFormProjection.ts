import { resolveDataPathCore } from "../../../validation/dataPath/coreResolver"
import type { FormDataPathIndex } from "../../../validation/dataPath/formIndex"
import type { OwnerMetadataCache } from "../../../validation/dataPath/ownerCache"
import type { FormDataPathSource } from "../../../validation/dataPath/types"
import { registerBaseFormPropertyProjector } from "../../clientApplicationForm/baseFormProjectionRegistry"

const unusedOwnerCache: OwnerMetadataCache = {
  get: () => {
    throw new Error("BaseForm DataPath projection only resolves a form attribute root")
  },
  listRefs: () => [],
}

registerBaseFormPropertyProjector("DataPath", {
  project: ({ baseValue, context }) => {
    if (typeof baseValue !== "string" || baseValue === "" || baseValue === "0") {
      return { kind: "include", value: baseValue }
    }
    return isBaseFormDataPathRootAvailable(baseValue, context.attributeNames)
      ? { kind: "include", value: baseValue }
      : { kind: "omit" }
  },
})

function isBaseFormDataPathRootAvailable(value: string, attributeNames: ReadonlySet<string>): boolean {
  const index = projectionDataPathIndex(attributeNames)
  const result = resolveDataPathCore({
    value,
    nameMode: "yaml",
    index,
    ownerCache: unusedOwnerCache,
  })
  return result.status !== "error"
}

function projectionDataPathIndex(attributeNames: ReadonlySet<string>): FormDataPathIndex {
  const roots = new Map<string, FormDataPathSource>()
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
    roots,
    additionalColumnsByTablePath: new Map(),
    duplicateDiagnostics: [],
    getRoot: (name) => roots.get(name),
  }
}
