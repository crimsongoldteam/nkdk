export interface XMLImportViewFilter {
  readonly tags?: readonly string[]
  readonly includeAllTags: boolean
}

interface ViewNode<T> {
  children?: Map<string, ViewNode<T>>
  value?: T
}

/** Кэш вариантов одного правила без сериализации фильтра и коллизий его состояний. */
export class XMLImportViews<T extends object> {
  private readonly all: ViewNode<T> = {}
  private readonly untagged: ViewNode<T> = {}
  private readonly filtered: ViewNode<T> = {}

  constructor(private readonly create: (filter: XMLImportViewFilter) => T) {}

  get(filter: XMLImportViewFilter): T {
    let node = filter.includeAllTags ? this.all : filter.tags === undefined ? this.untagged : this.filtered
    if (!filter.includeAllTags && filter.tags !== undefined) {
      const tags = filter.tags.length < 2 ? filter.tags : [...filter.tags].sort()
      let previous: string | undefined
      for (const tag of tags) {
        if (tag === previous) continue
        previous = tag
        const children: Map<string, ViewNode<T>> = node.children ??= new Map()
        let child = children.get(tag)
        if (child === undefined) { child = {}; children.set(tag, child) }
        node = child
      }
    }
    return node.value ??= this.create(filter)
  }
}
