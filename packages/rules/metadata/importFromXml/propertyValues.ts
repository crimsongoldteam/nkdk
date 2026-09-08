type Path = readonly (string | number)[]

interface Node<T> {
  children?: Map<string | number, Node<T>>
  values?: Map<string, T>
}

/** Только выбранные свойства; чтение не создаёт строкового адреса или копии пути. */
export class ImportPropertyValues<T extends object> {
  private readonly root: Node<T> = {}
  private count = 0

  get size(): number { return this.count }

  get(path: Path, key: string): T | undefined {
    return this.nodeAt(path)?.values?.get(key)
  }

  keys(path: Path): Iterable<string> {
    return this.nodeAt(path)?.values?.keys() ?? []
  }

  private nodeAt(path: Path): Node<T> | undefined {
    let node: Node<T> | undefined = this.root
    for (const segment of path) {
      node = node?.children?.get(segment)
      if (node === undefined) return undefined
    }
    return node
  }

  /** Ближайший непустой префикс, исключая сам путь и корень документа. */
  nearestParent(path: Path, key: string): T | undefined {
    let node: Node<T> | undefined = this.root
    let parent: T | undefined
    for (let index = 0; index < path.length - 1; index++) {
      node = node?.children?.get(path[index]!)
      if (node === undefined) break
      const value = node.values?.get(key)
      if (value !== undefined) parent = value
    }
    return parent
  }

  set(path: Path, key: string, value: T): void {
    let node = this.root
    for (const segment of path) {
      const children: Map<string | number, Node<T>> = node.children ??= new Map()
      let child = children.get(segment)
      if (child === undefined) { child = {}; children.set(segment, child) }
      node = child
    }
    const values = node.values ??= new Map()
    if (!values.has(key)) this.count++
    values.set(key, value)
  }

  *values(): IterableIterator<T> {
    const pending = [this.root]
    for (let index = 0; index < pending.length; index++) {
      const node = pending[index]!
      if (node.values !== undefined) yield* node.values.values()
      if (node.children !== undefined) for (const child of node.children.values()) pending.push(child)
    }
  }
}
