import { afterEach, describe, expect, it, vi } from "vitest"
import { normalizeSchemaCommandInput, printJSONSchema, printSchema } from "./schema"

describe("schema command", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const captureStdout = () => vi.spyOn(process.stdout, "write").mockImplementation(() => true)
  const writtenText = (stdout: ReturnType<typeof captureStdout>) => stdout.mock.calls.map(([chunk]) => String(chunk)).join("")

  it("prints YAML summary by schema name by default", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printSchema("InputField", {})

    const text = writtenText(stdout)
    expect(text).toContain("fields:")
    expect(text).toContain("key: Вид")
    expect(text).toContain("const: ПолеВвода")
    expect(text).not.toContain("enum: []")
    expect(text).not.toContain("description: null")
  })

  it("prints plain keys", async () => {
    const stdout = captureStdout()

    await printSchema("InputField", { keys: true })

    const text = writtenText(stdout)
    expect(text).toContain("Вид\n")
    expect(text).not.toContain("fields:")
  })

  it("filters plain keys by terms", async () => {
    const stdout = captureStdout()

    await printSchema("InputField", { keys: "путь|вид" })

    const text = writtenText(stdout)
    expect(text).toContain("Вид\n")
    expect(text).toContain("ПутьКДанным\n")
    expect(text).not.toContain("fields:")
  })

  it("prints required YAML summary without wrapper metadata", async () => {
    const stdout = captureStdout()

    await printSchema("InputField", { required: true })

    const text = writtenText(stdout)
    expect(text).toContain("fields:")
    expect(text).toContain("key: Вид")
    expect(text).not.toContain("schema:")
  })

  it("prints required keys only", async () => {
    const stdout = captureStdout()

    await printSchema("InputField", { required: true, keys: true })

    expect(writtenText(stdout)).toBe("Вид\n")
  })

  it("prints search YAML summary without wrapper metadata", async () => {
    const stdout = captureStdout()

    await printSchema("InputField", { search: "ПутьКДанным" })

    const text = writtenText(stdout)
    expect(text).toContain("fields:")
    expect(text).toContain("key: ПутьКДанным")
    expect(text).not.toContain("matches:")
    expect(text).not.toContain("query:")
  })

  it("prints exact search YAML summary for one field", async () => {
    const stdout = captureStdout()

    await printSchema("InputField", { search: "ПутьКДанным", exact: true })

    const text = writtenText(stdout)
    expect(text).toContain("fields:")
    expect(text).toContain("key: ПутьКДанным")
    expect(text).not.toContain("key: Вид")
  })

  it("prints exact search keys only", async () => {
    const stdout = captureStdout()

    await printSchema("InputField", { search: "ПутьКДанным", exact: true, keys: true })

    expect(writtenText(stdout)).toBe("ПутьКДанным\n")
  })

  it("prints JSON schema by schema name when requested", async () => {
    const stdout = captureStdout()

    await printSchema("InputField", { jsonSchema: true })

    const schema = JSON.parse(writtenText(stdout))
    expect(schema.properties.Вид).toEqual(expect.objectContaining({ const: "ПолеВвода" }))
  })

  it("prints inline JSON schema for project file when requested", async () => {
    const stdout = captureStdout()

    await printSchema("Справочник/Товары/Свойства.yaml", { jsonSchema: true, inline: true })

    const text = writtenText(stdout)
    expect(text).not.toContain("nkdk://schema/MetadataCatalogAttribute")
    expect(JSON.parse(text).properties).toHaveProperty("Реквизиты")
  })

  it("keeps printJSONSchema compatibility wrapper behavior", async () => {
    const stdout = captureStdout()

    await printJSONSchema("Справочник/Товары/Свойства.yaml", { inline: true })

    const text = writtenText(stdout)
    expect(text).not.toContain("nkdk://schema/MetadataCatalogAttribute")
    expect(JSON.parse(text).properties).toHaveProperty("Реквизиты")
  })

  it("prints external-ref JSON schema for project file", async () => {
    const stdout = captureStdout()

    await printSchema("Справочник/Товары/Свойства.yaml", { jsonSchema: true })

    const schema = JSON.parse(writtenText(stdout))
    expect(schema.properties.Реквизиты.additionalProperties).toEqual({ $ref: "nkdk://schema/MetadataCatalogAttribute" })
  })

  it("resolves relative file from explicit project", async () => {
    const stdout = captureStdout()

    await printSchema("Документ/Заказ/Свойства.yaml", { jsonSchema: true, project: process.cwd() })

    const text = writtenText(stdout)
    expect(JSON.parse(text).properties).toHaveProperty("СтандартныеРеквизиты")
  })

  it("does not write stdout when schema lookup fails", async () => {
    const stdout = captureStdout()

    await expect(printSchema("UnknownSchema", {})).rejects.toThrow(/Неизвестная JSON Schema/)

    expect(stdout).not.toHaveBeenCalled()
  })

  it("throws when exact search has no matching field", async () => {
    const stdout = captureStdout()

    await expect(printSchema("InputField", { search: "НесуществующееПоле", exact: true })).rejects.toThrow(
      'Поле "НесуществующееПоле" не найдено в JSON Schema',
    )

    expect(stdout).not.toHaveBeenCalled()
  })

  it("normalizes bare keys option before target", () => {
    expect(normalizeSchemaCommandInput(undefined, { keys: "InputField" })).toEqual({
      target: "InputField",
      options: { keys: true },
    })
  })

  it("keeps keys terms when target is present", () => {
    expect(normalizeSchemaCommandInput("InputField", { keys: "путь|вид" })).toEqual({
      target: "InputField",
      options: { keys: "путь|вид" },
    })
  })

  it.each([
    [{ inline: true }, "--inline можно использовать только вместе с --json-schema"],
    [
      { jsonSchema: true, keys: true },
      "--json-schema несовместим с --keys, --required, --search и --exact",
    ],
    [
      { jsonSchema: true, required: true },
      "--json-schema несовместим с --keys, --required, --search и --exact",
    ],
    [
      { jsonSchema: true, search: "Вид" },
      "--json-schema несовместим с --keys, --required, --search и --exact",
    ],
    [
      { jsonSchema: true, exact: true },
      "--json-schema несовместим с --keys, --required, --search и --exact",
    ],
    [{ required: true, search: "Вид" }, "--required и --search нельзя использовать одновременно"],
    [{ exact: true }, "--exact можно использовать только вместе с --search"],
    [{ search: "" }, "--search требует непустой запрос"],
    [{ search: " | " }, "--search требует непустой запрос"],
  ])("rejects invalid option combination %#", async (options, message) => {
    const stdout = captureStdout()

    await expect(printSchema("InputField", options)).rejects.toThrow(message)

    expect(stdout).not.toHaveBeenCalled()
  })
})
