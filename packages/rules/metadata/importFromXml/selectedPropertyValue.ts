import { copyYAMLRuntimeMetadata, markYAMLScalarTag, type YAMLScalarTag } from "@nkdk/runtime"

/** Строит только одно заранее выбранное значение, не дерево YAML документа. */
export function createSelectedPropertyValue() {
  let value: unknown
  const owned = new WeakSet<object>()
  const copyContainer = (source: object): object => {
    const result = Array.isArray(source) ? [...source] : { ...source }
    owned.add(result)
    copyYAMLRuntimeMetadata(source, result)
    return result
  }
  const copy = (source: unknown): unknown => isContainer(source) ? copyContainer(source) : source
  return {
    accept(path: readonly (string | number)[], next: unknown, scalarTag?: YAMLScalarTag): void {
      if (path.length === 0) {
        value = copy(next)
        return
      }
      let parent: object = isContainer(value) ? value : typeof path[0] === "number" ? [] : {}
      value = parent
      owned.add(parent)
      for (let index = 0; index < path.length - 1; index++) {
        const key = path[index]!
        const current: unknown = Object.hasOwn(parent, key) ? Reflect.get(parent, key) : undefined
        const child = isContainer(current)
          ? owned.has(current) ? current : copyContainer(current)
          : typeof path[index + 1] === "number" ? [] : {}
        owned.add(child)
        Object.defineProperty(parent, key, { value: child, enumerable: true, writable: true, configurable: true })
        parent = child
      }
      Object.defineProperty(parent, path.at(-1)!, {
        value: copy(next), enumerable: true, writable: true, configurable: true,
      })
      if (scalarTag !== undefined) markYAMLScalarTag(parent, path.at(-1)!, scalarTag)
    },
    finish(): unknown {
      const result = value
      value = undefined
      return result
    },
  }
}

function isContainer(value: unknown): value is object {
  return value !== null && typeof value === "object"
}
