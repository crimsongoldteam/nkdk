import { describe, expect, it } from "vitest"
import { MetadataCatalog } from "../appliedObjects/metadataCatalog/types"
import { MetadataAttribute } from "../commonObjects/metadataAttribute/types"
import { addRelation } from "./addRelation"
import { autocompletePath } from "./autocompletePath"
import { existsPath } from "./existPath"

describe("addRelation", () => {
  it("should add a relation between two items", () => {
    const catalog1: MetadataCatalog = { itemType: "MetadataCatalog", name: "Catalog1" }
    const catalog2: MetadataCatalog = { itemType: "MetadataCatalog", name: "Catalog2" }
    addRelation({ from: catalog1, to: catalog2, relationType: "parent" })

    const attribute1: MetadataAttribute = { itemType: "MetadataAttribute", name: "Attribute1" }

    addRelation({ from: catalog1, to: attribute1, relationType: "attribute" })

    const path = "Catalog1.Реквизит.Attribute1"

    const existRelation = existsPath({ path })

    expect(existRelation).toBe(true)
  })

  it("should autocomplete", () => {
    const catalog1: MetadataCatalog = { itemType: "MetadataCatalog", name: "Catalog1" }
    const catalog2: MetadataCatalog = { itemType: "MetadataCatalog", name: "Catalog2" }
    addRelation({ from: catalog1, to: catalog2, relationType: "parent" })

    const attribute1: MetadataAttribute = { itemType: "MetadataAttribute", name: "Attribute1" }

    addRelation({ from: catalog1, to: attribute1, relationType: "attribute" })

    const path = "Catalog1.Реквизит"

    const result = autocompletePath({ path })

    expect(result).toEqual(["Catalog1.Реквизит.Attribute1"])
  })
})
