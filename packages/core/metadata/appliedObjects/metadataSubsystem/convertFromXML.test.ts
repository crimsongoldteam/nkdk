import fs from "fs"
import os from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"
import { mockContextFromXML } from "~/tests/mockContext"
import { MetadataSubsystemRules } from "./rules"

const commandInterfaceXML = "<CommandInterface>nested</CommandInterface>"

const subsystemXML = (params: { name: string; synonym: string; childName?: string }): string => `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<Subsystem uuid="00000000-0000-0000-0000-000000000001">
		<Properties>
			<Name>${params.name}</Name>
			<Synonym>
				<v8:item>
					<v8:lang>ru</v8:lang>
					<v8:content>${params.synonym}</v8:content>
				</v8:item>
			</Synonym>
			<Comment/>
			<IncludeHelpInContents>true</IncludeHelpInContents>
			<IncludeInCommandInterface>true</IncludeInCommandInterface>
			<UseOneCommand>false</UseOneCommand>
			<Explanation/>
			<Picture/>
			<Content/>
		</Properties>
		<ChildObjects>${params.childName ? `\n\t\t\t<Subsystem>${params.childName}</Subsystem>\n\t\t` : ""}</ChildObjects>
	</Subsystem>
</MetaDataObject>`

const writeFile = (path: string, content: string): void => {
  fs.mkdirSync(join(path, ".."), { recursive: true })
  fs.writeFileSync(path, content, "utf-8")
}

describe("convertAppliedObjectFromXML — MetadataSubsystem", () => {
  it("создаёт YAML для вложенной подсистемы и сохраняет её CommandInterface.xml", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "subsystem-convert-xml-"))
    const outputDir = fs.mkdtempSync(join(os.tmpdir(), "subsystem-convert-yaml-"))

    writeFile(join(inputDir, "Администрирование.xml"), subsystemXML({
      name: "Администрирование",
      synonym: "Администрирование",
      childName: "НастройкиПрограммы",
    }))
    writeFile(
      join(inputDir, "Администрирование", "Subsystems", "НастройкиПрограммы.xml"),
      subsystemXML({ name: "НастройкиПрограммы", synonym: "Настройки программы" })
    )
    writeFile(
      join(inputDir, "Администрирование", "Subsystems", "НастройкиПрограммы", "Ext", "CommandInterface.xml"),
      commandInterfaceXML
    )

    await convertAppliedObjectFromXML({
      rule: MetadataSubsystemRules,
      context: mockContextFromXML(),
      inputDir,
      name: "Администрирование",
      outputDir,
    })

    expect(
      fs.readFileSync(
        join(outputDir, "Администрирование", "Подсистемы", "НастройкиПрограммы", "Свойства.yaml"),
        "utf-8"
      )
    ).toContain("Синоним: Настройки программы")
    expect(
      fs.readFileSync(
        join(outputDir, "Администрирование", "Подсистемы", "НастройкиПрограммы", "CommandInterface.xml"),
        "utf-8"
      )
    ).toBe(commandInterfaceXML)
  })
})
