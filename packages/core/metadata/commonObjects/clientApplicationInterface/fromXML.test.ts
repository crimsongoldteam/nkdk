import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { importMetadataItemFromXML } from "../../orchestration"
import { mockContextFromXML } from "../../../tests/mockContext"
import { ClientApplicationInterfaceRules } from "./rules"

import "./register"

const fixturesDir = join(__dirname, "__fixtures__")
const clientInterfaceXmlPath = join(fixturesDir, "ClientApplicationInterface.xml")

const importClientApplicationInterface = (path: string) =>
  importMetadataItemFromXML({
    context: mockContextFromXML(),
    rule: ClientApplicationInterfaceRules,
    xmlString: readFileSync(path, "utf-8"),
  })

describe("import ClientApplicationInterface from XML", () => {
  it("imports sections, panels, groups and panel definitions", () => {
    const result = importClientApplicationInterface(clientInterfaceXmlPath)

    expect(result).toMatchObject({
      itemType: "ClientApplicationInterface",
      top: [
        { kind: "panel", uuid: "c933ac92-92cd-459d-81cc-e0c8a83ced99" },
        { kind: "panel", uuid: "cbab57f2-a0f3-4f0a-89ea-4cb19570ab75" },
        { kind: "panel", uuid: "00000000-0000-0000-0000-000000000000" },
      ],
      left: [{ kind: "panel", uuid: "b553047f-c9aa-4157-978d-448ecad24248", height: 1 }, { kind: "group" }],
      bottom: [{ kind: "panel", uuid: "13322b22-3960-4d68-93a6-fe2dd7f28ca3" }],
      panelDefs: expect.arrayContaining([{ id: "b553047f-c9aa-4157-978d-448ecad24248", spr: "PictureOnLeftAndText" }]),
    })
  })
})
