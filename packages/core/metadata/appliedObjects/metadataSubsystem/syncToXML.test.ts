import fs from "fs"
import os from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { XmlSyncManifest } from "../configuration/migrations/xmlManifest"
import { syncAppliedObjectToXML } from "../../orchestration/appliedObject/syncToXML"
import { testSyncAppliedObjectToXML } from "../../../tests/appliedObject"
import { mockContextToXML } from "../../../tests/mockContext"
import { MetadataSubsystemRules } from "./rules"

const normalizeXML = (value: string): string => value.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n")
const commandInterfaceYAML = `КомандныйИнтерфейс:
  ПорядокГрупп:
    - ПанельНавигацииОбычное
`
const commandInterfaceXML = `<?xml version="1.0" encoding="UTF-8"?>
<CommandInterface xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<GroupsOrder>
		<Group>NavigationPanelOrdinary</Group>
	</GroupsOrder>
</CommandInterface>`
const emptyCommandInterfaceXML = `<?xml version="1.0" encoding="UTF-8"?>
<CommandInterface xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20"/>`

describe("syncAppliedObjectToXML — MetadataSubsystem", () => {
  it("читает YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataSubsystemRules,
      name: "ПодсистемаВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: ["ПодсистемаВсеСвойства.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeXML(result), path).toBe(normalizeXML(expected))
    }
  })

  it("восстанавливает вложенную подсистему и добавляет файлы в manifest", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "subsystem-sync-yaml-"))
    const referenceDir = fs.mkdtempSync(join(os.tmpdir(), "subsystem-sync-ref-"))
    const outputDir = fs.mkdtempSync(join(os.tmpdir(), "subsystem-sync-xml-"))
    const xmlManifest = new XmlSyncManifest(outputDir)

    writeFile(
      join(inputDir, "Администрирование", "Свойства.yaml"),
      `Синоним: Администрирование
Подсистемы:
  - НастройкиПрограммы
`
    )
    writeFile(
      join(inputDir, "Администрирование", "Подсистемы", "НастройкиПрограммы", "Свойства.yaml"),
      `Синоним: Настройки программы
${commandInterfaceYAML}`
    )
    writeFile(
      join(referenceDir, "Администрирование.xml"),
      subsystemXML({
        name: "Администрирование",
        synonym: "Администрирование",
        childName: "НастройкиПрограммы",
      })
    )
    writeFile(
      join(referenceDir, "Администрирование", "Subsystems", "НастройкиПрограммы.xml"),
      subsystemXML({ name: "НастройкиПрограммы", synonym: "Настройки программы" })
    )

    await syncAppliedObjectToXML({
      rule: MetadataSubsystemRules,
      context: mockContextToXML(),
      inputDir,
      name: "Администрирование",
      outputDir,
      referenceDir,
      xmlManifest,
    })

    expect(fs.existsSync(join(outputDir, "Администрирование", "Subsystems", "НастройкиПрограммы.xml"))).toBe(true)
    expect(
      normalizeXML(
        fs.readFileSync(
          join(outputDir, "Администрирование", "Subsystems", "НастройкиПрограммы", "Ext", "CommandInterface.xml"),
          "utf-8"
        )
      )
    ).toBe(commandInterfaceXML)
    expect(xmlManifest.expectedFiles()).toContain("Администрирование/Subsystems/НастройкиПрограммы.xml")
    expect(xmlManifest.expectedFiles()).toContain(
      "Администрирование/Subsystems/НастройкиПрограммы/Ext/CommandInterface.xml"
    )
  })

  it("синхронизирует дочерние подсистемы без referenceDir", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-subsystem-no-reference-"))
    const yamlDir = join(tmp, "yaml", "Подсистема")
    const outDir = join(tmp, "xml", "Subsystems")

    try {
      writeFile(
        join(yamlDir, "Администрирование", "Свойства.yaml"),
        `Синоним: Администрирование
Подсистемы:
  - НастройкиПрограммы
`
      )
      writeFile(
        join(yamlDir, "Администрирование", "Подсистемы", "НастройкиПрограммы", "Свойства.yaml"),
        `Синоним: Настройки программы
`
      )
      writeFile(
        join(outDir, "Администрирование", "Subsystems", "НастройкиПрограммы.xml"),
        subsystemXML({
          name: "НастройкиПрограммы",
          synonym: "Настройки программы",
          childName: "СтараяВложеннаяПодсистема",
        })
      )

      await syncAppliedObjectToXML({
        rule: MetadataSubsystemRules,
        context: mockContextToXML(),
        inputDir: yamlDir,
        name: "Администрирование",
        outputDir: outDir,
      })

      const childXmlPath = join(outDir, "Администрирование", "Subsystems", "НастройкиПрограммы.xml")
      expect(fs.existsSync(join(outDir, "Администрирование.xml"))).toBe(true)
      expect(fs.existsSync(childXmlPath)).toBe(true)
      expect(fs.readFileSync(childXmlPath, "utf-8")).not.toContain("СтараяВложеннаяПодсистема")
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })

  it("сохраняет пустой CommandInterface.xml дочерней подсистемы из reference", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "subsystem-sync-empty-command-interface-yaml-"))
    const referenceDir = fs.mkdtempSync(join(os.tmpdir(), "subsystem-sync-empty-command-interface-ref-"))
    const outputDir = fs.mkdtempSync(join(os.tmpdir(), "subsystem-sync-empty-command-interface-xml-"))
    const xmlManifest = new XmlSyncManifest(outputDir)

    writeFile(
      join(inputDir, "Отчеты", "Свойства.yaml"),
      `Синоним: Отчеты
Подсистемы:
  - БухгалтерскийУчет
`
    )
    writeFile(
      join(inputDir, "Отчеты", "Подсистемы", "БухгалтерскийУчет", "Свойства.yaml"),
      `Синоним: Бухгалтерский учет
`
    )
    writeFile(
      join(referenceDir, "Отчеты.xml"),
      subsystemXML({
        name: "Отчеты",
        synonym: "Отчеты",
        childName: "БухгалтерскийУчет",
      })
    )
    writeFile(
      join(referenceDir, "Отчеты", "Subsystems", "БухгалтерскийУчет.xml"),
      subsystemXML({ name: "БухгалтерскийУчет", synonym: "Бухгалтерский учет" })
    )
    writeFile(
      join(referenceDir, "Отчеты", "Subsystems", "БухгалтерскийУчет", "Ext", "CommandInterface.xml"),
      emptyCommandInterfaceXML
    )

    await syncAppliedObjectToXML({
      rule: MetadataSubsystemRules,
      context: mockContextToXML(),
      inputDir,
      name: "Отчеты",
      outputDir,
      referenceDir,
      xmlManifest,
    })

    const commandInterfacePath = join(
      outputDir,
      "Отчеты",
      "Subsystems",
      "БухгалтерскийУчет",
      "Ext",
      "CommandInterface.xml"
    )
    expect(normalizeXML(fs.readFileSync(commandInterfacePath, "utf-8"))).toBe(emptyCommandInterfaceXML)
    expect(xmlManifest.expectedFiles()).toContain("Отчеты/Subsystems/БухгалтерскийУчет/Ext/CommandInterface.xml")
  })

  it("не дублирует имя родителя для подсистем второго уровня", async () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "subsystem-sync-yaml-"))
    const referenceDir = fs.mkdtempSync(join(os.tmpdir(), "subsystem-sync-ref-"))
    const outputDir = fs.mkdtempSync(join(os.tmpdir(), "subsystem-sync-xml-"))
    const xmlManifest = new XmlSyncManifest(outputDir)

    writeFile(
      join(inputDir, "Администрирование", "Свойства.yaml"),
      `Синоним: Администрирование
Подсистемы:
  - НастройкиПрограммы
`
    )
    writeFile(
      join(inputDir, "Администрирование", "Подсистемы", "НастройкиПрограммы", "Свойства.yaml"),
      `Синоним: Настройки программы
Подсистемы:
  - Интерфейс
`
    )
    writeFile(
      join(
        inputDir,
        "Администрирование",
        "Подсистемы",
        "НастройкиПрограммы",
        "Подсистемы",
        "Интерфейс",
        "Свойства.yaml"
      ),
      `Синоним: Интерфейс
${commandInterfaceYAML}`
    )
    writeFile(
      join(referenceDir, "Администрирование.xml"),
      subsystemXML({
        name: "Администрирование",
        synonym: "Администрирование",
        childName: "НастройкиПрограммы",
      })
    )
    writeFile(
      join(referenceDir, "Администрирование", "Subsystems", "НастройкиПрограммы.xml"),
      subsystemXML({ name: "НастройкиПрограммы", synonym: "Настройки программы", childName: "Интерфейс" })
    )
    writeFile(
      join(referenceDir, "Администрирование", "Subsystems", "НастройкиПрограммы", "Subsystems", "Интерфейс.xml"),
      subsystemXML({ name: "Интерфейс", synonym: "Интерфейс" })
    )

    await syncAppliedObjectToXML({
      rule: MetadataSubsystemRules,
      context: mockContextToXML(),
      inputDir,
      name: "Администрирование",
      outputDir,
      referenceDir,
      xmlManifest,
    })

    expect(
      fs.existsSync(
        join(outputDir, "Администрирование", "Subsystems", "НастройкиПрограммы", "Subsystems", "Интерфейс.xml")
      )
    ).toBe(true)
    expect(
      fs.existsSync(
        join(
          outputDir,
          "Администрирование",
          "Subsystems",
          "НастройкиПрограммы",
          "НастройкиПрограммы",
          "Subsystems",
          "Интерфейс.xml"
        )
      )
    ).toBe(false)
    expect(
      normalizeXML(
        fs.readFileSync(
          join(
            outputDir,
            "Администрирование",
            "Subsystems",
            "НастройкиПрограммы",
            "Subsystems",
            "Интерфейс",
            "Ext",
            "CommandInterface.xml"
          ),
          "utf-8"
        )
      )
    ).toBe(commandInterfaceXML)
    expect(xmlManifest.expectedFiles()).toContain(
      "Администрирование/Subsystems/НастройкиПрограммы/Subsystems/Интерфейс.xml"
    )
    expect(xmlManifest.expectedFiles()).toContain(
      "Администрирование/Subsystems/НастройкиПрограммы/Subsystems/Интерфейс/Ext/CommandInterface.xml"
    )
  })
})

const writeFile = (path: string, content: string): void => {
  fs.mkdirSync(join(path, ".."), { recursive: true })
  fs.writeFileSync(path, content, "utf-8")
}

const subsystemXML = (params: {
  name: string
  synonym: string
  childName?: string
}): string => `<?xml version="1.0" encoding="UTF-8"?>
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
