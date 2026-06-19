import fs from "fs"
import os from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { roundTripYAMLFast } from "./roundTripYAMLFast"

const enumXml = (params: { name: string; choiceMode?: string }): string => `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<Enum uuid="d381585b-33ee-4f3e-9362-ae06f761f29d">
		<Properties>
			<Name>${params.name}</Name>
			<Synonym>
				<v8:item>
					<v8:lang>ru</v8:lang>
					<v8:content>${params.name}</v8:content>
				</v8:item>
			</Synonym>
			<Comment/>
			<UseStandardCommands>false</UseStandardCommands>
			<QuickChoice>true</QuickChoice>
			${params.choiceMode === undefined ? "" : `<ChoiceMode>${params.choiceMode}</ChoiceMode>`}
			<DefaultListForm/>
			<DefaultChoiceForm/>
			<AuxiliaryListForm/>
			<AuxiliaryChoiceForm/>
			<ListPresentation/>
			<ExtendedListPresentation/>
			<Explanation/>
			<ChoiceHistoryOnInput>Auto</ChoiceHistoryOnInput>
			<Characteristics/>
		</Properties>
		<ChildObjects/>
		<InternalInfo>
			<xr:GeneratedType name="EnumRef.${params.name}" category="Ref">
				<xr:TypeId>b84bb78b-3bc6-4473-9d76-c7e109b970b2</xr:TypeId>
				<xr:ValueId>b6de8d44-cfa0-4f70-a89f-9f3098045cd4</xr:ValueId>
			</xr:GeneratedType>
			<xr:GeneratedType name="EnumManager.${params.name}" category="Manager">
				<xr:TypeId>ad948a32-45c8-4cc2-9d79-da7d96fd1e19</xr:TypeId>
				<xr:ValueId>d32b60ed-b5c6-47a3-aa22-f16a7415e1da</xr:ValueId>
			</xr:GeneratedType>
			<xr:GeneratedType name="EnumList.${params.name}" category="List">
				<xr:TypeId>5a2f483e-6883-4f5e-8784-bc2d5e96c4ba</xr:TypeId>
				<xr:ValueId>976deee1-c599-4271-a10a-ee31d333e68d</xr:ValueId>
			</xr:GeneratedType>
		</InternalInfo>
	</Enum>
</MetaDataObject>`

const makeXmlProject = (xml: string): string => {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-round-trip-yaml-fast-"))
  fs.mkdirSync(join(dir, "Enums"), { recursive: true })
  fs.writeFileSync(join(dir, "Enums", "ВидыСервисовЭДО.xml"), xml, "utf-8")
  return dir
}

describe("roundTripYAMLFast", () => {
  it("returns no diffs for stable metadata xml", async () => {
    const xmlDir = makeXmlProject(enumXml({ name: "ВидыСервисовЭДО", choiceMode: "BothWays" }))
    try {
      const result = await roundTripYAMLFast({ inputDir: xmlDir })

      expect(result.errors).toEqual([])
      expect(result.diffs).toEqual([])
      expect(result.checked).toBe(1)
    } finally {
      fs.rmSync(xmlDir, { recursive: true, force: true })
    }
  })

  it("reports a diff produced by yaml text round-trip", async () => {
    const xmlDir = makeXmlProject(enumXml({ name: "ВидыСервисовЭДО" }))
    try {
      const result = await roundTripYAMLFast({ inputDir: xmlDir })

      expect(result.errors).toEqual([])
      expect(result.diffs).toHaveLength(1)
      expect(result.diffs[0]?.file).toBe("Enums/ВидыСервисовЭДО.xml")
      expect(result.diffs[0]?.xmlFileAbs).toBe(join(xmlDir, "Enums", "ВидыСервисовЭДО.xml"))
      expect(result.diffs[0]?.diffText).toContain("--- Enums/ВидыСервисовЭДО.xml")
      expect(result.diffs[0]?.diffText).toContain("+++ Enums/ВидыСервисовЭДО.xml.fast")
    } finally {
      fs.rmSync(xmlDir, { recursive: true, force: true })
    }
  })

  it("keeps going and records per-file errors", async () => {
    const xmlDir = makeXmlProject("<MetaDataObject><Enum><Properties><Name>Bad</Name>")
    try {
      const result = await roundTripYAMLFast({ inputDir: xmlDir })

      expect(result.checked).toBe(1)
      expect(result.diffs).toEqual([])
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.file).toBe("Enums/ВидыСервисовЭДО.xml")
      expect(result.errors[0]?.message.length).toBeGreaterThan(0)
    } finally {
      fs.rmSync(xmlDir, { recursive: true, force: true })
    }
  })
})
