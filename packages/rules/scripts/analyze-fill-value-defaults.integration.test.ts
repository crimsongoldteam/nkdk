import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  analyzeFillValueCatalog,
  parseAnalyzeFillValueArgs,
} from "./analyze-fill-value-defaults"

const temporaryRoots: string[] = []

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe("CLI-исследование FillValue", () => {
  it("создаёт воспроизводимые JSON и Markdown для нескольких конфигураций", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "fill-value-catalog-"))
    temporaryRoots.push(root)
    const catalogRoot = path.join(root, "catalog")
    const outputDir = path.join(root, "output")
    await mkdir(path.join(catalogRoot, "doc", "CommonAttributes"), { recursive: true })
    await mkdir(path.join(catalogRoot, "acc", "CommonAttributes"), { recursive: true })
    await writeFile(
      path.join(catalogRoot, "doc", "CommonAttributes", "Дата.xml"),
      commonAttributeXml("Дата", "xs:dateTime", '<FillValue xsi:type="xs:dateTime">0001-01-01T00:00:00</FillValue>'),
    )
    await writeFile(
      path.join(catalogRoot, "acc", "CommonAttributes", "Контрагент.xml"),
      commonAttributeXml(
        "Контрагент",
        "cfg:CatalogRef.Контрагенты",
        '<FillValue xsi:type="xr:DesignTimeRef">Catalog.Контрагенты.EmptyRef</FillValue>',
      ),
    )

    const result = await analyzeFillValueCatalog({
      catalogRoot,
      outputDir,
      concurrency: 2,
      examples: 2,
      configurations: [],
    })
    const json = await readFile(result.jsonPath, "utf8")
    const markdown = await readFile(result.markdownPath, "utf8")

    expect(JSON.parse(json)).toMatchObject({
      formatVersion: 1,
      parameters: { configurations: ["acc", "doc"], examples: 2 },
      counts: { observations: 2, configurations: 2 },
    })
    expect(json).not.toContain(root)
    expect(json).toContain("doc/CommonAttributes/Дата.xml")
    expect(markdown).toContain("## Дата и время")
    expect(markdown).toContain("## Ссылки")
  })

  it("разбирает фильтры и справку, отклоняя неполный запуск", () => {
    expect(parseAnalyzeFillValueArgs(["--help"])).toEqual({ kind: "help" })
    expect(() => parseAnalyzeFillValueArgs([])).toThrow(/не указан каталог конфигураций/)
    expect(() => parseAnalyzeFillValueArgs(["/tmp/catalog", "--output", "/tmp/out", "--concurrency", "0"]))
      .toThrow(/положительным целым/)
  })
})

function commonAttributeXml(name: string, type: string, fillValue: string): string {
  return `<MetaDataObject xmlns:v8="v8" xmlns:xr="xr" xmlns:xsi="xsi">
    <CommonAttribute><Properties><Name>${name}</Name><Type><v8:Type>${type}</v8:Type></Type>${fillValue}</Properties></CommonAttribute>
  </MetaDataObject>`
}
