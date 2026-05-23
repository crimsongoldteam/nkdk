import { afterEach, describe, expect, it, vi } from "vitest"
import { printJSONSchema } from "./schema"

describe("schema command", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("prints pretty JSON schema to stdout", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printJSONSchema("Справочник/Товары/Свойства.yaml", {})

    expect(stdout).toHaveBeenCalledOnce()
    const text = String(stdout.mock.calls[0]?.[0])
    expect(() => JSON.parse(text)).not.toThrow()
    expect(text).toContain("\n  ")
    expect(text).toContain("\"Синоним\"")
  })

  it("resolves relative file from explicit project", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printJSONSchema("Документ/Заказ/Свойства.yaml", { project: process.cwd() })

    const text = String(stdout.mock.calls[0]?.[0])
    expect(JSON.parse(text).properties).toHaveProperty("СтандартныеРеквизиты")
  })

  it("does not write stdout when schema lookup fails", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await expect(printJSONSchema("Справочник/Товары/Команды/Команда.yaml", {})).rejects.toThrow(
      /Ожидались пути вида/,
    )

    expect(stdout).not.toHaveBeenCalled()
  })
})
