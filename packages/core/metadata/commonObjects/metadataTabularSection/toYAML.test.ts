import { describe, expect, it } from "vitest"
import {
  fullTabularSections,
  fullTabularSectionsYAML,
  minimalTabularSections,
  minimalTabularSectionsYAML,
} from "./__fixtures__/data"
import { mockContext } from "../../../tests/mockContext"
import { exportMetadataTabularSectionsToYAML } from "./register"

describe("export MetadataTabularSections to YAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportMetadataTabularSectionsToYAML(mockContext, undefined, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportMetadataTabularSectionsToYAML(mockContext, undefined, fullTabularSections)
    expect(result).toEqual(fullTabularSectionsYAML)
  })

  it("should export minimal", () => {
    const result = exportMetadataTabularSectionsToYAML(mockContext, undefined, minimalTabularSections)
    expect(result).toEqual(minimalTabularSectionsYAML)
  })
})
