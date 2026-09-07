type Path = readonly (string | number)[]

interface Node<T> {
  children?: Map<string | number, Node<T>>
  value?: T
}

/** Только выбранные свойства; чтение не создаёт строкового адреса или копии пути. */
export class ImportPropertyValues<T extends object> {
  private readonly roots = new Map<string, Node<T>>()
  private count = 0

  get size(): number { return this.count }

  get(path: Path, key: string): T | undefined {
    let node = this.roots.get(key)
    for (const segment of path) {
      node = node?.children?.get(segment)
      if (node === undefined) return undefined
    }
    return node?.value
  }

  set(path: Path, key: string, value: T): void {
    let node = this.roots.get(key)
    if (node === undefined) { node = {}; this.roots.set(key, node) }
    for (const segment of path) {
      const children: Map<string | number, Node<T>> = node.children ??= new Map()
      let child = children.get(segment)
      if (child === undefined) { child = {}; children.set(segment, child) }
      node = child
    }
    if (node.value === undefined) this.count++
    node.value = value
  }

  *values(): IterableIterator<T> {
    const pending = [...this.roots.values()]
    for (let index = 0; index < pending.length; index++) {
      const node = pending[index]!
      if (node.value !== undefined) yield node.value
      if (node.children !== undefined) for (const child of node.children.values()) pending.push(child)
    }
  }
}
