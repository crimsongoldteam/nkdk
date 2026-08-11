import { describe, expect, it } from "vitest"
import { validateFullXmlSyncWrittenFiles } from "./validateWrittenFiles"

describe("validateFullXmlSyncWrittenFiles", () => {
  it("reports missing, unknown and conflicting actual outputs", () => {
    const diagnostics = validateFullXmlSyncWrittenFiles({
      expectedOutputs: [
        { assignmentId: "one", targetXmlPath: "Objects/One.xml" },
        { assignmentId: "two", targetXmlPath: "Objects/Two.xml" },
      ],
      writtenFiles: [
        { assignmentId: "unknown", targetXmlPath: "Unknown.xml" },
        { assignmentId: "one", targetXmlPath: "Objects/One.xml" },
      ],
      copiedFiles: [
        {
          assignmentId: "two",
          sourceProjectPath: "two.bin",
          targetXmlPath: "Objects/One.xml",
        },
      ],
    })

    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual(
      expect.arrayContaining([
        "full_xml_sync_output_missing",
        "full_xml_sync_output_unknown_assignment",
        "full_xml_sync_output_conflict",
      ])
    )
  })

  it("does not require a conditional output absent from actual expectations", () => {
    expect(
      validateFullXmlSyncWrittenFiles({
        expectedOutputs: [{ assignmentId: "one", targetXmlPath: "Objects/One.xml" }],
        writtenFiles: [{ assignmentId: "one", targetXmlPath: "Objects/One.xml" }],
        copiedFiles: [],
      })
    ).toEqual([])
  })
})
