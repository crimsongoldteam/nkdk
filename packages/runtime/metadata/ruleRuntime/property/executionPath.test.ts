import { describe, expect, it } from "vitest"
import { ExecutionPath } from "./executionPath"

describe("компактный путь исполнения", () => {
  it("читает позицию ребёнка без материализации полного пути", () => {
    const root = ExecutionPath.from<string | number>(["Элементы"])
    expect(ExecutionPath.from([]).last).toBeUndefined()
    expect(root.last).toBe("Элементы")
    expect(root.child(0).last).toBe(0)
  })

  it("сохраняет независимые ветви без повторного чтения префикса при спуске", () => {
    let reads = 0
    const prefix = ["Корень"]
    Object.defineProperty(prefix, 0, { get() { reads++; return "Корень" } })
    const root = ExecutionPath.from(prefix)
    const initialReads = reads
    let path = root
    for (let index = 0; index < 1000; index++) path = path.child(String(index))
    const sibling = root.child("Сосед")
    expect(reads).toBe(initialReads)
    expect(sibling.toArray()).toEqual(["Корень", "Сосед"])
    expect(path.length).toBe(1001)
    expect(path.toArray().slice(-2)).toEqual(["998", "999"])
    expect(root.toArray()).toEqual(["Корень"])
  })

  it("отделяет исходный и возвращаемый массивы от сохраняемого пути", () => {
    const source: (string | number)[] = ["Элементы"]
    const path = ExecutionPath.from(source).child(0)
    source[0] = "Изменено"
    path.toArray()[0] = "Также изменено"
    expect(path.toArray()).toEqual(["Элементы", 0])
  })

  it("уточняет последний сегмент и ищет ближайшего владельца без изменения соседней ветви", () => {
    const root = ExecutionPath.from(["a", "b"])
    const path = root.child("c").child("d")
    const changed = path.withLast("e")
    expect(changed.toArray()).toEqual(["a", "b", "c", "e"])
    expect(path.last).toBe("d")
    expect(changed.findLast(value => value === "a" || value === "c")).toBe("c")
    expect(changed.findLast(value => value === "b")).toBe("b")
    expect(changed.findLast(value => value === "missing")).toBeUndefined()
    expect(root.withLast("z").toArray()).toEqual(["a", "z"])
    expect(root.toArray()).toEqual(["a", "b"])
  })
})
