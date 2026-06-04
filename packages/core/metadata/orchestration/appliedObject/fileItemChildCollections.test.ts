import fs from "fs"
import os from "os"
import { join } from "path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import {
  getFileItemXMLRootContainer,
  listYAMLFileItemNames,
  normalizeFileItemCollectionItems,
  orderFileItemNames,
  resolveChildCollectionDir,
  toChildObjectsXMLValue,
} from "./fileItemChildCollections"

const childRule = {
  itemType: "Child",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "DimensionTable",
      rootAttributes: {},
      forReferenceOnly: true,
    },
    name: { type: "string", xmlParents: ["Properties"], required: true },
  },
} as const satisfies MetadataItemRule

describe("fileItemChildCollections", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-file-item-children-"))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it("reads XML root container from fileItemRule", () => {
    expect(getFileItemXMLRootContainer(childRule)).toBe("DimensionTable")
  })

  it("normalizes arrays, records, strings, and empty values", () => {
    expect(normalizeFileItemCollectionItems("A")).toEqual([{ name: "A", model: { name: "A" } }])
    expect(normalizeFileItemCollectionItems([{ name: "A", value: 1 }, "B"])).toEqual([
      { name: "A", model: { name: "A", value: 1 } },
      { name: "B", model: { name: "B" } },
    ])
    expect(normalizeFileItemCollectionItems({ A: { value: 1 } })).toEqual([
      { name: "A", model: { name: "A", value: 1 } },
    ])
    expect(normalizeFileItemCollectionItems(undefined)).toEqual([])
  })

  it("lists only child folders with Свойства.yaml in ru order", async () => {
    fs.mkdirSync(join(tmpDir, "ТаблицыИзмерений", "Я"), { recursive: true })
    fs.mkdirSync(join(tmpDir, "ТаблицыИзмерений", "А"), { recursive: true })
    fs.mkdirSync(join(tmpDir, "ТаблицыИзмерений", "БезСвойств"), { recursive: true })
    fs.writeFileSync(join(tmpDir, "ТаблицыИзмерений", "Я", "Свойства.yaml"), "", "utf-8")
    fs.writeFileSync(join(tmpDir, "ТаблицыИзмерений", "А", "Свойства.yaml"), "", "utf-8")

    const names = await listYAMLFileItemNames({
      nkdkDir: tmpDir,
      childCollection: { propertyKey: "dimensionTables", nkdkDir: "ТаблицыИзмерений", xmlDir: "DimensionTables" },
      parentName: "Куб",
    })

    expect(names).toEqual(["А", "Я"])
  })

  it("keeps reference order and appends new names sorted by ru locale", () => {
    expect(orderFileItemNames({ currentNames: ["НовыйЯ", "Старый", "НовыйА"], referenceNames: ["Старый"] })).toEqual([
      "Старый",
      "НовыйА",
      "НовыйЯ",
    ])
  })

  it("returns scalar XML value for one name and array for many names", () => {
    expect(toChildObjectsXMLValue([])).toBeUndefined()
    expect(toChildObjectsXMLValue(["A"])).toBe("A")
    expect(toChildObjectsXMLValue(["A", "B"])).toEqual(["A", "B"])
  })

  it("resolves string and function child collection dirs", () => {
    expect(resolveChildCollectionDir("Tables/A", "A", "Parent")).toBe("Tables/A")
    expect(resolveChildCollectionDir(({ name, parentName }) => `${parentName}/${name}`, "A", "Parent")).toBe("Parent/A")
  })
})
