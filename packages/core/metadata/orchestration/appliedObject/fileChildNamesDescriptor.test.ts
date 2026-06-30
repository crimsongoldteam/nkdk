import { describe, expect, it } from "vitest"
import "~/metadata/commonObjects/childFormNames/syncExternalToXML"
import "~/metadata/commonObjects/childTemplateNames/syncExternalToXML"
import { getTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"

describe("fileChildNamesDescriptor", () => {
  it("describes child forms without appliedObject knowing ChildFormNames", () => {
    const descriptor = getTypeRule(
      "ChildFormNames",
      "fileChildNamesDescriptor"
    )?.({
      propertyRule: {
        type: "ChildFormNames",
        xml: "Form",
        folderName: "Формы",
        forReferenceOnly: true,
      },
    })

    expect(descriptor).toEqual({
      folderName: "Формы",
      xmlFolderName: "Forms",
      xmlItemName: "Form",
      useOwnerDirectoryForExternalSync: true,
      preserveReferenceXmlFolder: true,
      expectedNames: expect.any(Function),
    })
  })

  it("describes child templates without appliedObject knowing ChildTemplateNames", () => {
    const descriptor = getTypeRule(
      "ChildTemplateNames",
      "fileChildNamesDescriptor"
    )?.({
      propertyRule: {
        type: "ChildTemplateNames",
        xml: "Template",
        folderName: "Макеты",
        forReferenceOnly: true,
      },
    })

    expect(descriptor).toMatchObject({
      folderName: "Макеты",
      xmlFolderName: "Templates",
      xmlItemName: "Template",
      useOwnerDirectoryForExternalSync: true,
      preserveReferenceXmlFolder: true,
    })
  })
})
