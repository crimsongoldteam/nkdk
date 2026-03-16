import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { fullCalendarField } from "../../../tests/fixtures/forms/calendarField/data"
import { fullChartField } from "../../../tests/fixtures/forms/chartField/data"
import { fullCheckBoxField } from "../../../tests/fixtures/forms/checkBoxField/data"
import { fullDendrogramField } from "../../../tests/fixtures/forms/dendrogramField/data"
import { fullFormattedDocumentField } from "../../../tests/fixtures/forms/formattedDocumentField/data"
import { fullGanttChartField } from "../../../tests/fixtures/forms/ganttChartField/data"
import { fullGeographicalSchemaField } from "../../../tests/fixtures/forms/geographicalSchemaField/data"
import { fullGraphicalSchemaField } from "../../../tests/fixtures/forms/graphicalSchemaField/data"
import { fullHtmlDocumentField } from "../../../tests/fixtures/forms/htmlDocumentField/data"
import { fullInputField } from "../../../tests/fixtures/forms/inputField/data"
import { fullLabelField } from "../../../tests/fixtures/forms/labelField/data"
import { fullPDFDocumentField } from "../../../tests/fixtures/forms/pdfDocumentField/data"
import { fullPeriodField } from "../../../tests/fixtures/forms/periodField/data"
import { fullPictureField } from "../../../tests/fixtures/forms/pictureField/data"
import { fullPlannerField } from "../../../tests/fixtures/forms/plannerField/data"
import { fullProgressBarField } from "../../../tests/fixtures/forms/progressBarField/data"
import { fullRadioButtonField } from "../../../tests/fixtures/forms/radioButtonField/data"
import { fullSpreadSheetDocumentField } from "../../../tests/fixtures/forms/spreadSheetDocumentField/data"
import { fullTextDocumentField } from "../../../tests/fixtures/forms/textDocumentField/data"
import { fullTrackBarField } from "../../../tests/fixtures/forms/trackBarField/data"
import { mockContextToXML } from "../../../tests/mockContext"
import { getElementRule } from "../../orchestration/formElement/ruleFactory"
import { PropertyRule } from "../../orchestration/property/types"
import { xmlExport } from "../../../xml/export/exporter"
import { importContentFromXML } from "../../../xml/import/importer"
import { createEmptyClientApplicationForm } from "./createEmpty"
import { exportClientApplicationFormToXML } from "./toXML"

const COMMON_FORMS_ROOT = "/Users/nikita/git/roundTripElements/CommonForms"
const ROUNDTRIP_ROOT = "/Users/nikita/git/roundTripElements"
const COMMON_FORM_NAME = "Форма"
const CONFIGURATION_FILE_PATH = join(ROUNDTRIP_ROOT, "Configuration.xml")
const COMMON_FORM_METADATA_XML = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:cmi="http://v8.1c.ru/8.2/managed-application/cmi" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xen="http://v8.1c.ru/8.3/xcf/enums" xmlns:xpr="http://v8.1c.ru/8.3/xcf/predef" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<CommonForm uuid="d67447f0-f15f-4b58-a6c0-b7fa3f088aaa">
		<Properties>
			<Name>Форма</Name>
			<Synonym>
				<v8:item>
					<v8:lang>ru</v8:lang>
					<v8:content>Форма</v8:content>
				</v8:item>
			</Synonym>
			<Comment/>
			<FormType>Managed</FormType>
			<IncludeHelpInContents>false</IncludeHelpInContents>
			<UsePurposes>
				<v8:Value xsi:type="app:ApplicationUsePurpose">PlatformApplication</v8:Value>
				<v8:Value xsi:type="app:ApplicationUsePurpose">MobilePlatformApplication</v8:Value>
			</UsePurposes>
			<UseStandardCommands>false</UseStandardCommands>
			<ExtendedPresentation/>
			<Explanation/>
		</Properties>
	</CommonForm>
</MetaDataObject>
`

const formFieldFixtures = [
  fullCalendarField,
  fullChartField,
  fullCheckBoxField,
  fullDendrogramField,
  fullFormattedDocumentField,
  fullGanttChartField,
  fullGeographicalSchemaField,
  fullGraphicalSchemaField,
  fullHtmlDocumentField,
  fullInputField,
  fullLabelField,
  fullPDFDocumentField,
  fullPeriodField,
  fullPictureField,
  fullPlannerField,
  fullProgressBarField,
  fullRadioButtonField,
  fullSpreadSheetDocumentField,
  fullTextDocumentField,
  fullTrackBarField,
] as const

describe("Roundtrip XML export for form-field fixtures", () => {
  it.each(formFieldFixtures.map((fixture) => [fixture.itemType, fixture] as const))(
    "should generate XML form for %s",
    (itemType, fixture) => {
      const form = createEmptyClientApplicationForm()
      form.childItems = [fixture]
      const expectedAttributes = getFixtureDataPathAttributes(fixture as Record<string, unknown>)
      form.attributes = expectedAttributes.map((attribute) => ({
        name: attribute.name,
        value: attribute.type,
        itemType: "FormAttribute",
        columns: [],
        type: { type: [attribute.type] },
      })) as any

      const xmlData = exportClientApplicationFormToXML({
        context: mockContextToXML(),
        form,
        referenceForm: undefined,
      })

      const resultXML = xmlExport({ Form: xmlData })
      writeFormXMLToRoundtripFolder(itemType, resultXML)
      const parsedData = importContentFromXML<{ Form: Record<string, unknown> }>(resultXML)
      const formFieldNode = findFirstNodeByTag(parsedData.Form, itemType)

      expect(resultXML.length).toBeGreaterThan(0)
      expect(resultXML).toMatch(/<Form(?:\s|>)/)
      expect(formFieldNode).toBeDefined()
      if (expectedAttributes.length > 0) {
        expect(resultXML).toContain("<Attributes>")
        for (const expectedAttribute of expectedAttributes) {
          expect(resultXML).toContain(`<Attribute name="${expectedAttribute.name}"`)
        }
      }
    }
  )
})

const getFixtureDataPathAttributes = (fixture: Record<string, unknown>): Array<{ name: string; type: string }> => {
  const elementRule = getElementRule(fixture.itemType as any)
  const result: Array<{ name: string; type: string }> = []
  const names = new Set<string>()

  for (const [propertyName, propertyRule] of Object.entries(elementRule.properties) as [string, PropertyRule][]) {
    if (!propertyName.toLowerCase().endsWith("datapath")) continue
    const rawName = fixture[propertyName]
    if (typeof rawName !== "string") continue
    const name = rawName.trim()
    if (name.length === 0 || names.has(name)) continue

    const type =
      "defaultType" in propertyRule && typeof propertyRule.defaultType === "string" && propertyRule.defaultType.length > 0
        ? propertyRule.defaultType
        : propertyRule.type

    result.push({ name, type })
    names.add(name)
  }

  return result
}

const writeFormXMLToRoundtripFolder = (itemType: string, formXML: string): void => {
  const legacyRootFormPath = join(COMMON_FORMS_ROOT, `${COMMON_FORM_NAME}.xml`)
  const legacyCommonFormDirPath = join(COMMON_FORMS_ROOT, COMMON_FORM_NAME)
  if (fs.existsSync(legacyRootFormPath)) {
    fs.unlinkSync(legacyRootFormPath)
  }
  if (fs.existsSync(legacyCommonFormDirPath)) {
    fs.rmSync(legacyCommonFormDirPath, { recursive: true, force: true })
  }

  const formPath = join(COMMON_FORMS_ROOT, itemType, "Ext", "Form.xml")
  const rootFormPath = join(COMMON_FORMS_ROOT, `${itemType}.xml`)
  fs.mkdirSync(join(COMMON_FORMS_ROOT, itemType, "Ext"), { recursive: true })
  fs.writeFileSync(formPath, formXML, "utf-8")
  const legacyFormAliasPath = join(COMMON_FORMS_ROOT, itemType, `${COMMON_FORM_NAME}.xml`)
  if (fs.existsSync(legacyFormAliasPath)) {
    fs.unlinkSync(legacyFormAliasPath)
  }
  fs.writeFileSync(rootFormPath, COMMON_FORM_METADATA_XML, "utf-8")
  ensureConfigurationIncludesCommonForm(itemType)
}

const ensureConfigurationIncludesCommonForm = (commonFormName: string): void => {
  if (!fs.existsSync(CONFIGURATION_FILE_PATH)) {
    return
  }

  const commonFormTag = `<CommonForm>${commonFormName}</CommonForm>`
  const configurationXML = fs.readFileSync(CONFIGURATION_FILE_PATH, "utf-8")
  if (configurationXML.includes(commonFormTag)) {
    return
  }

  const childObjectsCloseTag = "</ChildObjects>"
  if (!configurationXML.includes(childObjectsCloseTag)) {
    return
  }

  const updatedConfigurationXML = configurationXML.replace(
    childObjectsCloseTag,
    `\t\t\t${commonFormTag}\n\t\t${childObjectsCloseTag}`
  )

  fs.writeFileSync(CONFIGURATION_FILE_PATH, updatedConfigurationXML, "utf-8")
}

const findFirstNodeByTag = (value: unknown, tagName: string): Record<string, unknown> | undefined => {
  if (!value || typeof value !== "object") {
    return undefined
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = findFirstNodeByTag(item, tagName)
      if (nested) {
        return nested
      }
    }
    return undefined
  }

  const recordValue = value as Record<string, unknown>
  if (tagName in recordValue) {
    const found = recordValue[tagName]
    if (found && typeof found === "object" && !Array.isArray(found)) {
      return found as Record<string, unknown>
    }
  }

  for (const nestedValue of Object.values(recordValue)) {
    const nested = findFirstNodeByTag(nestedValue, tagName)
    if (nested) {
      return nested
    }
  }

  return undefined
}
