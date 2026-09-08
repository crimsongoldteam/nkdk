export interface UniqueNameConflict {
  readonly name: string
  readonly collectionPath: readonly string[]
  readonly previousCollectionPath: readonly string[]
}

/** Один договор для проверки YAML и имён, собранных из XML. */
export function collectUniqueNameConflicts(params: {
  readonly scopes: readonly { readonly collections: readonly string[] }[]
  readonly collectionPath: (modelKey: string) => readonly string[] | undefined
  readonly names: (path: readonly string[]) => Iterable<string>
}): UniqueNameConflict[] {
  const conflicts: UniqueNameConflict[] = []
  for (const scope of params.scopes) {
    const seen = new Map<string, readonly string[]>()
    for (const modelKey of scope.collections) {
      const collectionPath = params.collectionPath(modelKey)
      if (collectionPath === undefined) continue
      for (const name of new Set(params.names(collectionPath))) {
        const previousCollectionPath = seen.get(name)
        if (previousCollectionPath === undefined) seen.set(name, collectionPath)
        else conflicts.push({ name, collectionPath, previousCollectionPath })
      }
    }
  }
  return conflicts
}

export function uniqueNameConflictMessage(conflict: UniqueNameConflict): string {
  return `Имя "${conflict.name}" должно быть уникальным в коллекциях ${conflict.previousCollectionPath.join("/")}, ${conflict.collectionPath.join("/")}`
}
