type PathNode<T> =
  | { readonly kind: "root"; readonly values: readonly T[] }
  | { readonly kind: "child"; readonly parent: ExecutionPath<T>; readonly value: T }

/** Спуск сохраняет одну ссылку; массив нужен только потребителю готового пути. */
export class ExecutionPath<T> {
  readonly length: number

  private constructor(private readonly node: PathNode<T>) {
    this.length = node.kind === "root" ? node.values.length : node.parent.length + 1
  }

  static from<T>(values: readonly T[]): ExecutionPath<T> {
    return new ExecutionPath({ kind: "root", values: [...values] })
  }

  child(value: T): ExecutionPath<T> {
    return new ExecutionPath({ kind: "child", parent: this, value })
  }

  get last(): T | undefined {
    return this.node.kind === "child" ? this.node.value : this.node.values.at(-1)
  }

  withLast(value: T): ExecutionPath<T> {
    return this.node.kind === "child"
      ? this.node.parent.child(value)
      : ExecutionPath.from([...this.node.values.slice(0, -1), value])
  }

  findLast(predicate: (value: T) => boolean): T | undefined {
    let current: ExecutionPath<T> = this
    while (current.node.kind === "child") {
      if (predicate(current.node.value)) return current.node.value
      current = current.node.parent
    }
    return current.node.values.findLast(predicate)
  }

  toArray(): T[] {
    const result = new Array<T>(this.length)
    let current: ExecutionPath<T> = this
    while (current.node.kind === "child") {
      result[current.length - 1] = current.node.value
      current = current.node.parent
    }
    for (let index = 0; index < current.node.values.length; index++) result[index] = current.node.values[index]!
    return result
  }
}
