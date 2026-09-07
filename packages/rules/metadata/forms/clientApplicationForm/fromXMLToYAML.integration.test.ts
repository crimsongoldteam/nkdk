import { xmlElementFromTestValue } from "../../../tests/structuralXML"
import type { ConfigurationIndexBlockEntity } from "@nkdk/runtime"
import {
createConfigurationIndexCollector,createXmlAnomalyAnnotations,
createXmlImportAuditSession,importContentFromXML,
parseMetadataYaml,
parseXmlDocumentWithSaxes,
serializeYAMLDocument,
snapshotXmlAnomalyAnnotations,
withConfigurationIndexCollector,
xmlExport,
yamlScalarTagAt
} from "@nkdk/runtime"
import { bindDeferredObjectValues,createDeferredValuePathCollector } from "@nkdk/runtime/rule-kit"
import { describe,expect,it,vi } from "vitest"
import { createDirectRoundTripContexts } from "../../../tests/directConversion"
import { prepareTestXmlAnomalyAssignment } from "../../xmlAnomalies/testSupport"
import { buildPreparedAssignmentXml } from "../../fullSyncToXml/xmlAnomalyAssignment"
import { mockContextFromXML,mockXmlImportContext } from "../../../tests/mockContext"
import { readAndParseXMLFixture,readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { createLocalIndexesCollector } from "../../projectDefinition/localIndexes"
import { finalizeImportedYamlValues } from "../../ruleRuntime/property/finalizeImportedYAML"
import * as propertyImporter from "../../ruleRuntime/property/fromXMLToYAML"
import type { FormAttributeColumnsXML } from "../commonObjects/formAttribute/types"
import { fullClientApplicationFormYAML,minimalClientApplicationFormYAML } from "./__fixtures__/data"
import {
importClientApplicationFormBodyFromXML,
importClientApplicationFormFromXMLToYAML,
} from "./fromXMLToYAML"
import { convertClientApplicationFormFromYAMLToXML } from "./fromYAMLToXML"
import {
ClientApplicationFormRules,
ClientApplicationFormWithExtendedPresentationRules,
} from "./rules"
import type { ClientApplicationFormXML,ClientApplicationFormYAML,FormMetadataXML } from "./types"
import "../../../tests/metadataExecutionContext"

const emptyOwnerMetadataCache = {
  listRefs: () => [],
  get: () => ({ status: "not-found" as const, diagnostics: [] }),
}

function formFixtureInputs(formFixture: string, metadataFixture: string) {
  const read = (file: string) => parseXmlDocumentWithSaxes(
    readXMLFixtureAsString(import.meta.url, file), { preserveXsiNil: true },
  ).roots[0]!
  return { formXML: read(formFixture), metadataXML: read(metadataFixture) }
}

function emptyFormInputs(formName: string, metadataXML: FormMetadataXML) {
  return { context: mockContextFromXML(), formName,
    formXML: xmlElementFromTestValue("Form", {}),
    metadataXML: xmlElementFromTestValue("MetaDataObject", metadataXML) }
}

function currentDataImportContext() {
  return {
    ...mockContextFromXML(),
    exportToYAML: { toTyped: false, ownerMetadataCache: emptyOwnerMetadataCache },
  }
}

function finalizeImportedFormDataPaths(result: ReturnType<typeof importClientApplicationFormFromXMLToYAML>): void {
  finalizeImportedYamlValues({
    yaml: result.yaml,
    rootRule: ClientApplicationFormRules,
    deferred: bindDeferredObjectValues(result.yaml, result.deferred),
    context: currentDataImportContext(),
    formDataPathIndex: result.localIndexes.metadata.formDataPathIndex,
  })
}

function importValueTableCurrentDataForm(columns: FormAttributeColumnsXML, columnName: string) {
  return importClientApplicationFormFromXMLToYAML({
    context: currentDataImportContext(),
    formName: "Форма",
    formXML: xmlElementFromTestValue("Form", {
      Attributes: {
        Attribute: [{
          _name: "Строки",
          _id: "1",
          Type: { "v8:Type": "v8:ValueTable" },
          Columns: columns,
        }],
      },
      ChildItems: [
        { Table: { _name: "Строки", _id: "1", DataPath: "Строки" } },
        {
          InputField: {
            _name: "Поле",
            _id: "2",
            DataPath: `Items.Строки.CurrentData.${columnName}`,
          },
        },
      ],
    }),
    metadataXML: xmlElementFromTestValue("MetaDataObject", { Form: { Properties: { FormType: "Managed" } } }),
  })
}

function importStructuredForm(
  formDocument: ReturnType<typeof parseXmlDocumentWithSaxes>,
  metadataDocument: ReturnType<typeof parseXmlDocumentWithSaxes>,
  audit: ReturnType<typeof createXmlImportAuditSession>,
  annotations = createXmlAnomalyAnnotations(),
) {
  return importClientApplicationFormFromXMLToYAML({
    context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
    formName: "Форма",
    formXML: xmlElementFromTestValue("Form", formDocument.compatibility.Form as ClientApplicationFormXML),
    metadataXML: xmlElementFromTestValue("MetaDataObject", metadataDocument.compatibility.MetaDataObject as FormMetadataXML),
    formXMLNode: formDocument.roots[0]!,
    metadataXMLNode: metadataDocument.roots[0]!,
    audit,
    annotations,
  })
}

function managedFormMetadataDocument() {
  return parseXmlDocumentWithSaxes(
    `<MetaDataObject><Form><Properties><FormType>Managed</FormType></Properties></Form></MetaDataObject>`,
    { preserveXsiNil: true },
  )
}

function importAuditedStructuredForm(
  formDocument: ReturnType<typeof parseXmlDocumentWithSaxes>,
) {
  const metadataDocument = managedFormMetadataDocument()
  const audit = createXmlImportAuditSession([formDocument.roots[0]!, metadataDocument.roots[0]!])
  const annotations = createXmlAnomalyAnnotations()
  const result = importStructuredForm(formDocument, metadataDocument, audit, annotations)
  audit.finalize()
  return { result, annotations }
}

describe("importClientApplicationFormFromXMLToYAML", () => {
  it.each(["minimal", "full"])("импортирует %s только из структурных источников", (name) => {
    const form = parseXmlDocumentWithSaxes(readXMLFixtureAsString(import.meta.url, `${name}.xml`), { preserveXsiNil: true })
    const metadata = parseXmlDocumentWithSaxes(readXMLFixtureAsString(import.meta.url, `${name}Metadata.xml`), { preserveXsiNil: true })
    const options = { context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } }, formName: "Форма" }
    Object.defineProperty(form, "compatibility", { get() { throw new Error("Document compatibility must not be read") } })
    Object.defineProperty(metadata, "compatibility", { get() { throw new Error("Document compatibility must not be read") } })
    const actual = importClientApplicationFormFromXMLToYAML({
      ...options, formXML: xmlElementFromTestValue("Form", form.roots[0]!), metadataXML: xmlElementFromTestValue("MetaDataObject", metadata.roots[0]!),
    })
    expect(actual.yaml).toEqual(name === "full" ? fullClientApplicationFormYAML : minimalClientApplicationFormYAML)
    for (const [key, value] of actual.localIndexes.metadata.formDataPathIndex!.roots) {
      expect(actual.localIndexes.metadata.formDataPathIndex!.getRoot(key)).toEqual(value)
    }
  })

  it("распознаёт обычную структурную форму без Form.xml", () => {
    const metadataXML = parseXmlDocumentWithSaxes("<MetaDataObject><Form><Properties><FormType>Ordinary</FormType></Properties></Form></MetaDataObject>").roots[0]!
    expect(() => importClientApplicationFormFromXMLToYAML({ context: mockContextFromXML(), formName: "Обычная", metadataXML })).not.toThrow()
  })

  it("не отмечает восстановимый xsi:nil параметра выбора как raw", () => {
    const document = parseXmlDocumentWithSaxes(`<Form><ChildItems>
      <InputField name="ПараметрВыбораNil" id="7">
        <ChoiceParameters><app:item name="Отбор.Ссылка"><app:value xsi:nil="true"/></app:item></ChoiceParameters>
        <ContextMenu name="ПараметрВыбораNilКонтекстноеМеню" id="8"/>
        <ExtendedTooltip name="ПараметрВыбораNilРасширеннаяПодсказка" id="9"/>
      </InputField>
    </ChildItems></Form>`, { preserveXsiNil: true })

    const { result, annotations } = importAuditedStructuredForm(document)
    const text = serializeYAMLDocument(result.yaml, annotations).text

    expect(result.yaml).toMatchObject({
      Элементы: {
        ПараметрВыбораNil: {
          ПараметрыВыбора: { "Отбор.Ссылка": undefined },
        },
      },
    })
    expect(text).not.toContain("!xml/raw")
  })

  it("передаёт аннотации ролей через вложенное Использование командного интерфейса", () => {
    const uuid = "12345678-1234-4234-9234-123456789abc"
    const document = parseXmlDocumentWithSaxes(`<Form><CommandInterface><CommandBar><Item>
      <Command>0</Command><Type>Auto</Type><Visible><xr:Common>true</xr:Common>
      <xr:Value name="">false</xr:Value><xr:Value name="${uuid}">true</xr:Value>
      <xr:Value name="Role.Администратор">true</xr:Value>
      </Visible></Item></CommandBar></CommandInterface></Form>`)
    const { result, annotations } = importAuditedStructuredForm(document)
    const text = serializeYAMLDocument(result.yaml, annotations).text
    expect(text).toContain("!xml/invalid '': Ложь")
    expect(text).toContain(`!xml/uuid ${uuid}: Истина`)
    const parsed = parseMetadataYaml(text)
    const exported = convertClientApplicationFormFromYAMLToXML({
      context: createDirectRoundTripContexts().exportContext(), name: "Форма",
      yaml: parsed.data as ClientApplicationFormYAML, annotations: parsed.annotations,
    })
    const xml = xmlExport({ Form: exported.formXML })
    expect(xml).toContain('<xr:Value name="">false</xr:Value>')
    expect(xml).toContain(`name="${uuid}"`)
  })
  it.each([
    ["повторные имена", `<ChildItems>
      <Button name="ЕстьКЭП" id="11"><Type>UsualButton</Type></Button>
      <Button name="Сосед" id="12"><Type>UsualButton</Type></Button>
      <Button name="ЕстьКЭП" id="2"><Type>Hyperlink</Type><ExtendedTooltip name="Подсказка" id="3"/></Button>
      <Button name="ЕстьКЭП" id="4"><Type>UsualButton</Type></Button>
    </ChildItems>`, "!xml/invalid/2 ЕстьКЭП", ["11", "12", "2", "4"]],
    ["поле рисунка в контекстном меню", `<ChildItems><InputField name="Поле" id="1">
      <ContextMenu name="ПолеКонтекстноеМеню" id="2"><ChildItems>
        <Button name="До" id="3"><Type>UsualButton</Type></Button>
        <PictureField name="ЕстьФайлы" id="4"><ExtendedTooltip name="Подсказка" id="5"/></PictureField>
        <Button name="После" id="6"><Type>UsualButton</Type></Button>
      </ChildItems></ContextMenu>
    </InputField></ChildItems>`, "ЕстьФайлы: !xml/raw", ["3", "4", "6"]],
  ] as const)("сохраняет локальными raw %s", (_case, body, expectedTag, expectedIds) => {
    const contexts = createDirectRoundTripContexts({ logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента" })
    const document = parseXmlDocumentWithSaxes(`<Form>${body}</Form>`, { preserveXsiNil: true })
    const metadata = managedFormMetadataDocument()
    const audit = createXmlImportAuditSession([document.roots[0]!, metadata.roots[0]!])
    const annotations = createXmlAnomalyAnnotations()
    const imported = importClientApplicationFormFromXMLToYAML({
      context: contexts.importContext, formName: "ФормаЭлемента",
      formXML: xmlElementFromTestValue("Form", document.compatibility.Form as ClientApplicationFormXML),
      metadataXML: xmlElementFromTestValue("MetaDataObject", metadata.compatibility.MetaDataObject as FormMetadataXML),
      formXMLNode: document.roots[0]!, metadataXMLNode: metadata.roots[0]!, audit, annotations,
    })
    audit.finalize()
    const text = serializeYAMLDocument(imported.yaml, annotations).text
    expect(audit.rawCandidates().map(({ error }) => String(error))).toEqual([])
    expect(text).toContain(expectedTag)
    expect(text).not.toContain("Элементы: !xml/raw")
    const parsed = parseMetadataYaml(text)
    expect(parsed.syntaxErrors).toEqual([])
    const elements = (parsed.data as ClientApplicationFormYAML).Элементы!
    elements.НоваяКнопка = { Вид: "Кнопка" }
    if (_case === "повторные имена") {
      const first = (parsed.data as ClientApplicationFormYAML).Элементы?.ЕстьКЭП
      expect(first).toBeDefined()
      first!.Заголовок = "Изменённая первая кнопка"
    }
    const prepared = prepareTestXmlAnomalyAssignment({ parsed, rootRule: ClientApplicationFormRules })
    const context = contexts.exportContext()
    const ordinary = convertClientApplicationFormFromYAMLToXML({
      context, name: "ФормаЭлемента",
      yaml: prepared.preparedYamlFile.data as ClientApplicationFormYAML,
      annotations: prepared.preparedYamlFile.annotations,
    })
    const exported = buildPreparedAssignmentXml({
      context,
      document: { targetXmlPath: "Form.xml", xml: { Form: ordinary.formXML }, deferred: [],
        rootRule: ClientApplicationFormRules, rawBoundaries: prepared.rawBoundaries },
    })
    const xml = parseXmlDocumentWithSaxes(exported).compatibility.Form as ClientApplicationFormXML
    const childNodes = (form: ClientApplicationFormXML) => (
      _case === "повторные имена" ? form.ChildItems
        : (form.ChildItems as Array<{ InputField: { ContextMenu: { ChildItems: unknown } } }>)[0]!.InputField.ContextMenu.ChildItems
    ) as Array<Record<string, { _id: string }>>
    const items = childNodes(xml)
    const originalItems = childNodes(document.compatibility.Form as ClientApplicationFormXML)
    expect(items.slice(0, expectedIds.length).map(item => Object.values(item)[0]!._id)).toEqual(expectedIds)
    const ids = [...exported.matchAll(/\bid="(-?\d+)"/gu)].map(match => match[1])
    expect(new Set(ids).size).toBe(ids.length)
    expect(exported).toContain('name="НоваяКнопка"')
    for (const index of _case === "повторные имена" ? [2, 3] : [1]) {
      expect(withoutFormattingText(items[index])).toEqual(withoutFormattingText(originalItems[index]))
    }
    if (_case === "повторные имена") expect(exported).toContain("<v8:content>Изменённая первая кнопка</v8:content>")
    expect(exported).toContain('name="Подсказка"')
  })

  it("распознаёт первое имя во всей форме, а повтор в другой группе оставляет raw", () => {
    const document = parseXmlDocumentWithSaxes(`<Form><ChildItems>
      <UsualGroup name="Первая" id="1"><ChildItems><Button name="Повтор" id="2"><Type>UsualButton</Type></Button></ChildItems></UsualGroup>
      <UsualGroup name="Вторая" id="3"><ChildItems><Button name="Повтор" id="4"><Type>Hyperlink</Type></Button></ChildItems></UsualGroup>
    </ChildItems></Form>`)
    const { result, annotations } = importAuditedStructuredForm(document)
    const text = serializeYAMLDocument(result.yaml, annotations).text
    expect(text).toContain("!xml/invalid Повтор: !xml/raw")
    expect(text).toContain("Первая:")
    expect(text).toContain("Вторая:")
  })

  it("помечает UUID функциональной опции реквизита формы до контрольного экспорта", () => {
    const uuid = "6537a19c-3357-46a2-96a6-1fe4619ddbc8"
    const formDocument = parseXmlDocumentWithSaxes(`
      <Form xmlns="http://v8.1c.ru/8.3/xcf/logform">
        <Attributes>
          <Attribute name="Сумма" id="1">
            <Type/>
            <FunctionalOptions><Item>${uuid}</Item></FunctionalOptions>
          </Attribute>
        </Attributes>
      </Form>`, { preserveXsiNil: true })
    const { result, annotations } = importAuditedStructuredForm(formDocument)

    expect(serializeYAMLDocument(result.yaml, annotations).text)
      .toContain(`- !xml/uuid ${uuid}`)
    expect(() => snapshotXmlAnomalyAnnotations(result.yaml, annotations)).not.toThrow()
  })

  it("импортирует повторные AdditionalColumns через их точные XML-узлы", () => {
    const formDocument = parseXmlDocumentWithSaxes(`
      <Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config">
        <Attributes>
          <Attribute name="Объект" id="1">
            <Type><v8:Type>cfg:BusinessProcessObject.Исполнение</v8:Type></Type>
            <MainAttribute>true</MainAttribute>
            <Columns>
              <AdditionalColumns table="Объект.Строки">
                <Column name="Код" id="1"><Type><v8:Type>xs:string</v8:Type></Type></Column>
              </AdditionalColumns>
              <AdditionalColumns table="Объект.Товары">
                <Column name="Артикул" id="2"><Type><v8:Type>xs:string</v8:Type></Type></Column>
              </AdditionalColumns>
            </Columns>
          </Attribute>
        </Attributes>
      </Form>`, { preserveXsiNil: true })
    const { result, annotations } = importAuditedStructuredForm(formDocument)

    expect(result.yaml).toMatchObject({
      Реквизиты: {
        Объект: {
          ДополнительныеКолонки: {
            "Объект.Строки": { Код: expect.any(Object) },
            "Объект.Товары": { Артикул: expect.any(Object) },
          },
        },
      },
    })
    expect(() => snapshotXmlAnomalyAnnotations(result.yaml, annotations)).not.toThrow()
  })

  it("сохраняет тип обычной формы без Form.xml", () => {
    const result = importClientApplicationFormFromXMLToYAML({
      context: mockContextFromXML(),
      formName: "ОбычнаяФорма",
      formXML: undefined,
      metadataXML: xmlElementFromTestValue("MetaDataObject", { Form: { Properties: { FormType: "Ordinary" } } }),
    })

    expect(result.yaml).toEqual({ ТипФормы: "Обычная" })
  })

  it("не выводит тип управляемой формы", () => {
    const result = importClientApplicationFormFromXMLToYAML({
      context: mockContextFromXML(),
      formName: "УправляемаяФорма",
      formXML: xmlElementFromTestValue("Form", {}),
      metadataXML: xmlElementFromTestValue("MetaDataObject", { Form: { Properties: { FormType: "Managed" } } }),
    })

    expect(result.yaml).not.toHaveProperty("ТипФормы")
  })

  it("импортирует только тело формы через отдельные накопители", () => {
    const collector = createLocalIndexesCollector()
    const deferred = createDeferredValuePathCollector()
    const result = importClientApplicationFormBodyFromXML({
      context: mockContextFromXML(),
      formName: "Форма",
      formXML: xmlElementFromTestValue("Form", { Width: 12, Properties: { Comment: "Не часть тела" } }),
      rule: ClientApplicationFormRules,
      collector,
      deferred,
    })

    expect(result.yaml).toMatchObject({ Ширина: 12 })
    expect(result.yaml).not.toHaveProperty("Комментарий")
    expect(collector.finish().metadata.events.length).toBeGreaterThan(0)
    expect(deferred.finish()).toEqual([])
  })

  it("индексирует произвольные реквизиты и колонки при прямом импорте", () => {
    const result = importClientApplicationFormFromXMLToYAML({
      context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
      formName: "Форма",
      formXML: xmlElementFromTestValue("Form", {
        Attributes: {
          Attribute: [
            { _name: "ПроизвольныйРеквизит", _id: "1", Type: {} },
            {
              _name: "Таблица",
              _id: "2",
              Type: { "v8:Type": "v8:ValueTable" },
              Columns: { Column: { _name: "Значение", _id: "1", Type: {} } },
            },
          ],
        },
      }),
      metadataXML: xmlElementFromTestValue("MetaDataObject", { Form: { Properties: { FormType: "Managed" } } }),
    })

    expect(result.localIndexes.metadata.formDataPathIndex?.getRoot("ПроизвольныйРеквизит")?.typeInfo.kinds).toEqual([
      "any",
    ])
    expect(
      result.localIndexes.metadata.formDataPathIndex
        ?.getRoot("Таблица")
        ?.tableSource?.columns.get("Значение")?.typeInfo.kinds
    ).toEqual(["any"])
  })

  it("уточняет служебный путь CurrentData после построения индекса элементов", () => {
    const result = importValueTableCurrentDataForm(
      { Column: { _name: "Значение", _id: "1", Type: { "v8:Type": "xs:string" } } },
      "Значение"
    )

    finalizeImportedFormDataPaths(result)

    expect(JSON.stringify(result.yaml)).toContain("Элементы.Строки.ТекущиеДанные.Значение")
    expect(JSON.stringify(result.yaml)).not.toContain("Items.Строки.CurrentData.Значение")
  })

  it("индексирует дополнительные колонки до уточнения CurrentData", () => {
    const result = importValueTableCurrentDataForm(
      {
        AdditionalColumns: {
          _table: "Строки",
          Column: [{
            _name: "Дополнительная",
            _id: "1",
            Type: { "v8:Type": "xs:string" },
          }],
        },
      },
      "Дополнительная"
    )

    expect(
      result.localIndexes.metadata.formDataPathIndex
        ?.additionalColumnsByTablePath.get("Строки")
        ?.get("Дополнительная")
    ).toMatchObject({ name: "Дополнительная" })

    finalizeImportedFormDataPaths(result)

    expect(JSON.stringify(result.yaml)).toContain(
      "Элементы.Строки.ТекущиеДанные.Дополнительная"
    )
  })

  it.each([
    ["PlatformApplication", undefined],
    ["MobilePlatformApplication", "МобильноеПриложение"],
    [["PlatformApplication", "MobilePlatformApplication"], "ПлатформаИМобильноеПриложение"],
  ] as const)("импортирует назначение формы %s", (xmlValue, expectedYAML) => {
    const values = Array.isArray(xmlValue) ? xmlValue : [xmlValue]
    const result = importClientApplicationFormFromXMLToYAML({
      context: mockContextFromXML(),
      formName: "Форма",
      formXML: xmlElementFromTestValue("Form", {}),
      metadataXML: xmlElementFromTestValue("MetaDataObject", {
        Form: {
          Properties: {
            FormType: "Managed",
            UsePurposes: {
              "v8:Value": values.map((value) => ({
                "_xsi:type": "app:ApplicationUsePurpose",
                "#text": value,
              })),
            },
          },
        },
      }),
    })

    if (expectedYAML === undefined) expect(result.yaml).not.toHaveProperty("НазначенияИспользования")
    else expect(result.yaml).toHaveProperty("НазначенияИспользования", expectedYAML)
  })

  it("обходит правила формы один раз для двух XML-источников", () => {
    const importSpy = vi.spyOn(propertyImporter, "importPropertiesFromXMLToYAML")
    importSpy.mockClear()

    importClientApplicationFormFromXMLToYAML({
      context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
      formName: "Форма",
      ...formFixtureInputs("minimal.xml", "minimalMetadata.xml"),
    })

    const rootCalls = importSpy.mock.calls.filter(([params]) => params.rule === ClientApplicationFormRules)
    expect(rootCalls).toHaveLength(1)
    expect(rootCalls[0]?.[0].sources).toHaveLength(2)
    importSpy.mockRestore()
  })

  it("передаёт адресные XML-узлы, audit и аннотации в общий импорт Rules", () => {
    const formDocument = parseXmlDocumentWithSaxes(
      readXMLFixtureAsString(import.meta.url, "minimal.xml"),
      { preserveXsiNil: true },
    )
    const metadataDocument = parseXmlDocumentWithSaxes(
      readXMLFixtureAsString(import.meta.url, "minimalMetadata.xml"),
      { preserveXsiNil: true },
    )
    const formRoot = formDocument.roots[0]!
    const metadataRoot = metadataDocument.roots[0]!
    const audit = createXmlImportAuditSession([formRoot, metadataRoot])
    const annotations = createXmlAnomalyAnnotations()
    const importSpy = vi.spyOn(propertyImporter, "importPropertiesFromXMLToYAML")
    importSpy.mockClear()

    importStructuredForm(formDocument, metadataDocument, audit, annotations)

    expect(importSpy).toHaveBeenCalledWith(expect.objectContaining({
      sources: [
        expect.objectContaining({ xml: formRoot }),
        expect.objectContaining({ xml: metadataRoot }),
      ],
      audit,
      annotations,
    }))
    importSpy.mockRestore()
  })

  it("сохраняет адресное владение свойствами реквизита формы", () => {
    const formDocument = parseXmlDocumentWithSaxes(
      `<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config">
        <Attributes><Attribute name="Отчет" id="1"><Type><v8:Type>cfg:ReportObject.Отчет</v8:Type></Type><MainAttribute>true</MainAttribute></Attribute></Attributes>
      </Form>`,
      { preserveXsiNil: true },
    )
    const metadataDocument = parseXmlDocumentWithSaxes(
      `<MetaDataObject><Form><Properties><FormType>Managed</FormType></Properties></Form></MetaDataObject>`,
    )
    const formRoot = formDocument.roots[0]!
    const metadataRoot = metadataDocument.roots[0]!
    const audit = createXmlImportAuditSession([formRoot, metadataRoot])

    importStructuredForm(formDocument, metadataDocument, audit)
    audit.finalize()

    const type = audit.outcomes().find(({ node }) => node.path.endsWith("/Attribute[1]/Type[1]"))
    expect(type).toEqual(expect.objectContaining({
      state: "claimed",
      boundaries: [expect.objectContaining({
        itemType: "FormAttribute",
        propertyKey: "type",
        yamlPath: ["Реквизиты", "Отчет", "Тип"],
      })],
    }))
  })

  it("совпадает с действующим YAML полной формы", () => {

    const result = importClientApplicationFormFromXMLToYAML({
      context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
      formName: "Форма",
      ...formFixtureInputs("full.xml", "fullMetadata.xml"),
    })

    expect(result.yaml).toEqual(fullClientApplicationFormYAML)
    expect(result.localIndexes.metadata.formDataPathIndex?.getRoot("Объект")).toMatchObject({
      kind: "formAttribute",
      name: "Объект",
    })
  })

  it("объединяет минимальные Form XML и metadata XML без модели", () => {

    const result = importClientApplicationFormFromXMLToYAML({
      context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
      formName: "Форма",
      ...formFixtureInputs("minimal.xml", "minimalMetadata.xml"),
    })

    expect(result.yaml).toEqual(minimalClientApplicationFormYAML)
    expect(result).not.toHaveProperty("model")
    expect(result).not.toHaveProperty("xml")
  })

  it("не импортирует пустое расширенное представление ни в одном варианте формы", () => {
    const metadataXML = {
      Form: {
        Properties: {
          FormType: "Managed",
          ExtendedPresentation: "",
        },
      },
    } as FormMetadataXML

    const specialized = importClientApplicationFormFromXMLToYAML({
      ...emptyFormInputs("ФормаОтчета", metadataXML),
      rule: ClientApplicationFormWithExtendedPresentationRules,
    })
    expect(specialized.yaml).not.toHaveProperty(
      "РасширенноеПредставление"
    )

    const base = importClientApplicationFormFromXMLToYAML({
      ...emptyFormInputs("ФормаСписка", metadataXML),
      rule: ClientApplicationFormRules,
    })
    expect(base.yaml).not.toHaveProperty("РасширенноеПредставление")
  })

  it("импортирует заполненное расширенное представление только специализированной формы", () => {
    const metadataXML = {
      Form: {
        Properties: {
          FormType: "Managed",
          ExtendedPresentation: {
            "v8:item": {
              "v8:lang": "ru",
              "v8:content": "Продажи",
            },
          },
        },
      },
    } as FormMetadataXML

    const specialized = importClientApplicationFormFromXMLToYAML({
      ...emptyFormInputs("ФормаОтчета", metadataXML),
      rule: ClientApplicationFormWithExtendedPresentationRules,
    })
    expect(specialized.yaml).toMatchObject({
      РасширенноеПредставление: "Продажи",
    })

    const base = importClientApplicationFormFromXMLToYAML({
      ...emptyFormInputs("ФормаСписка", metadataXML),
      rule: ClientApplicationFormRules,
    })
    expect(base.yaml).not.toHaveProperty("РасширенноеПредставление")
  })

  it("собирает идентичности вложенной таблицы диаграммы Ганта", () => {
    const collector = createConfigurationIndexCollector()
    const logicalAddress = "Обработка.Планирование.Форма.Основная"
    const context = withConfigurationIndexCollector(mockContextFromXML(), collector, logicalAddress)

    importClientApplicationFormFromXMLToYAML({
      context,
      formName: "Основная",
      formXML: xmlElementFromTestValue("Form", {
        ChildItems: [
          {
            GanttChartField: {
              _name: "ДиаграммаГанта",
              _id: "1",
              Table: {
                _name: "Table",
                _id: "98",
                ContextMenu: { _name: "TableКонтекстноеМеню", _id: "100" },
              },
              ContextMenu: { _name: "ДиаграммаГантаКонтекстноеМеню", _id: "2" },
            },
          },
        ],
      } as ClientApplicationFormXML),
      metadataXML: xmlElementFromTestValue("MetaDataObject", { Form: { Properties: { FormType: "Managed" } } }),
    })

    expect(identityFacts(collector.fragment("Форма.yaml").entities)).toEqual(
      expect.arrayContaining([
        {
          logicalAddress: `${logicalAddress}.Элемент.ДиаграммаГанта.КонтекстноеМеню`,
          kind: "xmlId",
          value: "2",
        },
        {
          logicalAddress: `${logicalAddress}.Элемент.ДиаграммаГанта.Таблица`,
          kind: "xmlId",
          value: "98",
        },
        {
          logicalAddress: `${logicalAddress}.Элемент.ДиаграммаГанта.Таблица.КонтекстноеМеню`,
          kind: "xmlId",
          value: "100",
        },
      ])
    )
  })

  it("сохраняет в снимке только UUID и состояние пространства имён Form.xml", () => {
    const collector = createConfigurationIndexCollector()
    const logicalAddress = "Справочник.Контрагенты.Форма.ФормаЭлемента"
    const context = withConfigurationIndexCollector(mockContextFromXML(), collector, logicalAddress)

    importClientApplicationFormFromXMLToYAML({
      context,
      formName: "ФормаЭлемента",
      formXML: xmlElementFromTestValue("Form", { Title: "Форма", Width: "80" }),
      metadataXML: xmlElementFromTestValue("MetaDataObject", {
        Form: {
          _uuid: "00000000-0000-4000-8000-000000000001",
          Properties: { Name: "ФормаЭлемента", Comment: "Комментарий", FormType: "Managed" },
        },
      }),
    })

    expect(collector.fragment("Форма.yaml").entities).toEqual([
      {
        logicalAddress,
        uuid: "00000000-0000-4000-8000-000000000001",
      },
      {
        logicalAddress: `${logicalAddress}.XMLNamespace.dcssch`,
        xmlValue: "absent",
      },
    ])
  })

  it("добавляет !проверять metadata формы и сохраняет Extended Form в секции Изменять", () => {
    const collector = createConfigurationIndexCollector()
    const logicalAddress = "Справочник.Контрагенты.Форма.ФормаЭлемента"
    const baseContext = mockXmlImportContext()
    const extensionContext = {
      ...baseContext,
      fromXML: { ...baseContext.fromXML, metadataItemAugmenter: "configurationExtension" },
    }
    const context = withConfigurationIndexCollector(extensionContext, collector, logicalAddress)
    const metadataXML: FormMetadataXML & {
      Form: { InternalInfo: Record<string, unknown> }
    } = {
      Form: {
        Properties: {
          ObjectBelonging: "Adopted",
          Name: "ФормаЭлемента",
          Comment: "Комментарий",
          FormType: "Managed",
        },
        InternalInfo: {
          "xr:PropertyState": [
            { "xr:Property": "ExtendedPresentation", "xr:State": "Notify" },
            { "xr:Property": "Form", "xr:State": "Extended" },
          ],
        },
      },
    }

    const result = importClientApplicationFormFromXMLToYAML({
      context,
      formName: "ФормаЭлемента",
      formXML: xmlElementFromTestValue("Form", {}),
      metadataXML,
      rule: ClientApplicationFormWithExtendedPresentationRules,
    })

    expect(result.yaml).toMatchObject({
      Комментарий: "Комментарий",
      Изменять: ["Форма"],
    })
    expect(yamlScalarTagAt(result.yaml, "РасширенноеПредставление")).toBe("проверять")
    expect(yamlScalarTagAt(result.yaml, "Форма")).toBeUndefined()
    expect(collector.fragment("Форма.yaml").entities).not.toContainEqual(
      expect.objectContaining({ logicalAddress: `${logicalAddress}.form` })
    )
  })

  it("сохраняет пустое расширенное представление заимствованной формы", () => {
    const baseContext = mockXmlImportContext()
    const collector = createConfigurationIndexCollector()
    const extensionContext = {
      ...baseContext,
      fromXML: { ...baseContext.fromXML, metadataItemAugmenter: "configurationExtension" },
    }
    const context = withConfigurationIndexCollector(extensionContext, collector, "ОбщаяФорма.Форма")
    let keysAtProof: string[] | undefined
    const result = importClientApplicationFormFromXMLToYAML({
      context,
      formName: "Форма",
      formXML: xmlElementFromTestValue("Form", {}),
      metadataXML: xmlElementFromTestValue("MetaDataObject", {
        Form: {
          Properties: {
            ObjectBelonging: "Adopted",
            Name: "Форма",
            FormType: "Managed",
            ExtendedPresentation: "",
          },
        },
      }),
      rule: ClientApplicationFormWithExtendedPresentationRules,
      roundTrip: {
        open: ({ rule, yaml }) => ({
          ready() {},
          finish() {
            if (rule.itemType === "ClientApplicationForm") keysAtProof = Object.keys(yaml)
          },
        }),
      },
    })

    expect(result.yaml).toMatchObject({ РасширенноеПредставление: "" })
    if (result.yaml === null || typeof result.yaml !== "object") throw new Error("Ожидался YAML формы")
    expect(Object.keys(result.yaml).at(-1)).toBe("РасширенноеПредставление")
    expect(keysAtProof?.at(-1)).toBe("РасширенноеПредставление")
  })
})

function identityFacts(entities: readonly ConfigurationIndexBlockEntity[]) {
  return entities.flatMap((entity) =>
    (["uuid", "xmlId"] as const).flatMap((kind) => entity[kind] === undefined ? [] : [{
      logicalAddress: entity.logicalAddress,
      kind,
      value: entity[kind],
    }])
  )
}

describe("форма XML → YAML → XML", () => {
  it("сохраняет режимные события элемента формы", () => {
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
    })
    const formXML = {
      ChildItems: [
        {
          InputField: {
            _name: "ПолеВвода",
            _id: "1",
            Events: {
              Event: [
                { _name: "OnChange", _callType: "Before", "#text": "ПередИзменением" },
                { _name: "OnChange", _callType: "After", "#text": "ПослеИзменения" },
                { _name: "StartChoice", _callType: "Override", "#text": "ВместоВыбора" },
              ],
            },
          },
        },
      ],
    } as ClientApplicationFormXML
    const metadataXML = { Form: { Properties: { FormType: "Managed" } } } as FormMetadataXML

    const imported = importClientApplicationFormFromXMLToYAML({
      context: contexts.importContext,
      formName: "ФормаЭлемента",
      formXML: xmlElementFromTestValue("Form", formXML),
      metadataXML: xmlElementFromTestValue("MetaDataObject", metadataXML),
    })

    expect(imported.yaml).toMatchObject({
      Элементы: {
        ПолеВвода: {
          События: {
            ПриИзменении: {
              Перед: "ПередИзменением",
              После: "ПослеИзменения",
            },
            НачалоВыбора: {
              Вместо: "ВместоВыбора",
            },
          },
        },
      },
    })

    const converted = convertClientApplicationFormFromYAMLToXML({
      context: contexts.exportContext(),
      yaml: imported.yaml as ClientApplicationFormYAML,
      name: "ФормаЭлемента",
    })
    const inputField = (converted.formXML.ChildItems as Array<{ InputField: { Events?: unknown } }>)[0]?.InputField

    expect(inputField?.Events).toEqual({
      Event: [
        { _name: "OnChange", _callType: "Before", "#text": "ПередИзменением" },
        { _name: "OnChange", _callType: "After", "#text": "ПослеИзменения" },
        { _name: "StartChoice", _callType: "Override", "#text": "ВместоВыбора" },
      ],
    })
  })

  it("сохраняет порядок событий формы без reference XML", () => {
    const formXML = {
      Events: {
        Event: [
          { _name: "OnOpen", "#text": "ПриОткрытии" },
          { _name: "BeforeClose", "#text": "ПередЗакрытием" },
          { _name: "ActivationProcessing", "#text": "ОбработкаАктивизации" },
        ],
      },
    } as ClientApplicationFormXML
    const converted = roundTripFormWithoutReference(formXML)
    const events = converted.formXML.Events?.Event

    expect(Array.isArray(events) ? events.map((event) => event._name) : []).toEqual([
      "OnOpen",
      "BeforeClose",
      "ActivationProcessing",
    ])
  })

  it.each([
    ["отсутствующее", undefined, false],
    ["присутствующее", "http://v8.1c.ru/8.1/data-composition-system/schema", true],
  ] as const)("сохраняет %s пространство имён dcssch без reference XML", (_name, namespace, expected) => {
    const formXML = {
      ...(namespace === undefined ? {} : { "_xmlns:dcssch": namespace }),
    } as ClientApplicationFormXML
    const { converted, exportContext } = directFormRoundTripWithoutReference(formXML)

    expect(Object.prototype.hasOwnProperty.call(converted.formXML, "_xmlns:dcssch")).toBe(expected)
    expect(
      exportContext.exportToXML.configurationIndex?.collector.fragment("Тест.yaml").entities,
    ).toContainEqual({
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента.XMLNamespace.dcssch",
      xmlValue: expected ? "present" : "absent",
    })
  })

  it("восстанавливает идентификаторы элементов формы без reference XML", () => {
    const form = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "full.xml")
    const sourceAttributes = form.Form.Attributes?.Attribute
    const sourceAttribute = (Array.isArray(sourceAttributes) ? sourceAttributes[0] : sourceAttributes) as {
      _id: string
    }
    const sourceInputField = (
      form.Form.ChildItems as Array<{
        InputField: {
          _id: string
          ContextMenu: { _id: string; _name: string }
          ExtendedTooltip: { _id: string }
        }
      }>
    )[0]!.InputField
    const sourceCommands = form.Form.Commands?.Command
    const sourceCommand = (Array.isArray(sourceCommands) ? sourceCommands[0] : sourceCommands) as { _id: string }
    sourceAttribute._id = "11"
    sourceInputField._id = "22"
    sourceInputField.ContextMenu._id = "33"
    sourceInputField.ContextMenu._name = "СтароеИмяКонтекстногоМеню"
    sourceInputField.ExtendedTooltip._id = "44"
    sourceCommand._id = "55"
    const autoCommandBar = form.Form.AutoCommandBar as { _name?: string } | undefined
    if (autoCommandBar !== undefined) autoCommandBar._name = ""
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
    })

    const imported = importClientApplicationFormFromXMLToYAML({
      context: contexts.importContext,
      formName: "ФормаЭлемента",
      formXML: xmlElementFromTestValue("Form", form.Form),
      metadataXML: parseXmlDocumentWithSaxes(readXMLFixtureAsString(import.meta.url, "fullMetadata.xml"), { preserveXsiNil: true }).roots[0]!,
    })
    const converted = convertClientApplicationFormFromYAMLToXML({
      context: contexts.exportContext(),
      yaml: imported.yaml as ClientApplicationFormYAML,
      name: "ФормаЭлемента",
    })
    const inputField = (converted.formXML.ChildItems as Array<{ InputField: ClientApplicationFormXML }>)[0].InputField
    const serialized = serializeYAMLDocument(imported.yaml)

    expect(serialized.text).toContain("Имя: !xml/name СтароеИмяКонтекстногоМеню")
    expect(serialized.text).toContain('Имя: !xml/name ""')

    expect(converted.formXML.Attributes?.Attribute).toEqual(
      expect.arrayContaining([expect.objectContaining({ _name: "Объект", _id: "11" })])
    )
    expect(inputField).toEqual(
      expect.objectContaining({
        _name: "ПолеВвода1",
        _id: "22",
        ContextMenu: expect.objectContaining({ _name: "СтароеИмяКонтекстногоМеню", _id: "33" }),
        ExtendedTooltip: expect.objectContaining({ _name: "ПолеВвода1РасширеннаяПодсказка", _id: "44" }),
      })
    )
    expect(converted.formXML.Commands?.Command).toEqual(
      expect.arrayContaining([expect.objectContaining({ _name: "Команда1", _id: "55" })])
    )
    expect(converted.formXML.AutoCommandBar).toEqual(expect.objectContaining({ _name: "", _id: "-1" }))
  })

  it("восстанавливает порядок metadata-свойств по адресу metadata-файла", () => {
    const metadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(import.meta.url, "fullMetadata.xml")
    const sourceProperties = metadata.MetaDataObject.Form.Properties
    metadata.MetaDataObject.Form.Properties = {
      Name: sourceProperties.Name,
      Synonym: sourceProperties.Synonym,
      Comment: sourceProperties.Comment,
      FormType: sourceProperties.FormType,
      IncludeHelpInContents: sourceProperties.IncludeHelpInContents,
      UsePurposes: sourceProperties.UsePurposes,
    }
    const logicalAddress = "Справочник.Товары.Форма.ФормаСписка"
    const contexts = createDirectRoundTripContexts({ logicalAddress })

    const imported = importClientApplicationFormFromXMLToYAML({
      context: contexts.importContext,
      formName: "ФормаСписка",
      formXML: parseXmlDocumentWithSaxes(readXMLFixtureAsString(import.meta.url, "full.xml"), { preserveXsiNil: true }).roots[0]!,
      metadataXML: xmlElementFromTestValue("MetaDataObject", metadata.MetaDataObject),
    })
    const converted = convertClientApplicationFormFromYAMLToXML({
      context: contexts.exportContext(),
      yaml: imported.yaml as ClientApplicationFormYAML,
      name: "ФормаСписка",
    })

    expect(Object.keys(converted.metadataXML.Form.Properties)).toEqual([
      "Name",
      "Synonym",
      "Comment",
      "FormType",
      "IncludeHelpInContents",
      "UsePurposes",
    ])
  })

  it("восстанавливает обязательный пустой Comment формы без reference XML", () => {
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары.Форма.Минимальная",
    })

    const imported = importClientApplicationFormFromXMLToYAML({
      context: contexts.importContext,
      formName: "Минимальная",
      ...formFixtureInputs("minimal.xml", "minimalMetadata.xml"),
    })
    const converted = convertClientApplicationFormFromYAMLToXML({
      context: contexts.exportContext(),
      yaml: imported.yaml as ClientApplicationFormYAML,
      name: "Минимальная",
    })

    expect(imported.yaml).not.toHaveProperty("Комментарий")
    expect(converted.metadataXML.Form.Properties.Comment).toBe("")
  })

  const cases = [
    ["полная", "full.xml", "fullMetadata.xml"],
    ["минимальная", "minimal.xml", "minimalMetadata.xml"],
    ["каталога", "catalogFull.xml", "minimalMetadata.xml"],
    ["документа", "documentFull.xml", "minimalMetadata.xml"],
    ["без реквизитов условного оформления", "conditionalAppearanceWithoutAttributes.xml", "minimalMetadata.xml"],
    ["с шириной дочерних элементов", "childItemsWidth.xml", "minimalMetadata.xml"],
    ["с папкой пользовательских настроек", "customSettingsFolder.xml", "customSettingsFolderMetadata.xml"],
    ["отчёта", "reportForm.xml", "reportFormMetadata.xml"],
    ["с динамическим списком", "withDynamicList.xml", "minimalMetadata.xml"],
  ] as const

  it.each(cases)("сохраняет форму %s", (_title, formFixture, metadataFixture) => {
    const form = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, formFixture)
    const metadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(import.meta.url, metadataFixture)
    const logicalAddress = "Справочник.Товары.Форма.ФормаЭлемента"
    const contexts = createDirectRoundTripContexts({ logicalAddress })
    const formName = String(metadata.MetaDataObject.Form.Properties.Name)

    const imported = importClientApplicationFormFromXMLToYAML({
      context: contexts.importContext,
      formName,
      ...formFixtureInputs(formFixture, metadataFixture),
    })
    const converted = convertClientApplicationFormFromYAMLToXML({
      context: contexts.exportContext(),
      yaml: imported.yaml as ClientApplicationFormYAML,
      name: formName,
      referenceFormXML: form.Form,
      referenceMetadataXML: metadata.MetaDataObject,
    })
    const expectedMetadata = structuredClone(metadata.MetaDataObject)
    expectedMetadata.Form.Properties.UsePurposes ??= {
      "v8:Value": {
        "_xsi:type": "app:ApplicationUsePurpose",
        "#text": "PlatformApplication",
      },
    }

    expect(canonicalSnapshot13XML(xmlExport({ Form: converted.formXML }))).toEqual(
      canonicalSnapshot13XML(readXMLFixtureAsString(import.meta.url, formFixture))
    )
    expect(canonicalXML(xmlExport({ MetaDataObject: converted.metadataXML }))).toEqual(
      canonicalXML(xmlExport({ MetaDataObject: expectedMetadata }))
    )
  })

  it("сохраняет нестандартное имя singleton как компактный !xml/name", () => {
    const source = readXMLFixtureAsString(import.meta.url, "reportForm.xml")
      .replaceAll(
        "ТабличнаяЧастьВсеСвойстваСтрокаПоискаКонтекстноеМеню",
        "ТабличнаяЧастьВсеСвойстваSearchStringContextMenu",
      )
      .replaceAll(
        "ТабличнаяЧастьВсеСвойстваСтрокаПоискаРасширеннаяПодсказка",
        "ТабличнаяЧастьВсеСвойстваSearchStringExtendedTooltip",
      )
      .replaceAll(
        "ТабличнаяЧастьВсеСвойстваСтрокаПоиска",
        "ТабличнаяЧастьВсеСвойстваSearchString",
      )
    const form = (importContentFromXML(source) as { Form: ClientApplicationFormXML }).Form
    const { contexts, formName, imported } = importReportForm(form)
    const serialized = serializeYAMLDocument(imported.yaml)

    expect(serialized.text).toContain([
      "ОтображениеСтрокиПоиска:",
      "      Имя: !xml/name ТабличнаяЧастьВсеСвойстваSearchString",
    ].join("\n"))
    expect(serialized.text.match(/ТабличнаяЧастьВсеСвойстваSearchString/gu)).toHaveLength(1)

    const reparsed = parseMetadataYaml(serialized.text)
    const converted = convertClientApplicationFormFromYAMLToXML({
      context: contexts.exportContext(),
      yaml: reparsed.data as ClientApplicationFormYAML,
      name: formName,
    })
    const xml = xmlExport({ Form: converted.formXML })

    expect(xml).toContain('<SearchStringAddition name="ТабличнаяЧастьВсеСвойстваSearchString" id="11">')
    expect(xml).toContain("<AdditionSource>")
    expect(xml).toContain('<ContextMenu name="ТабличнаяЧастьВсеСвойстваSearchStringContextMenu" id="12"/>')
    expect(xml).toContain('<ExtendedTooltip name="ТабличнаяЧастьВсеСвойстваSearchStringExtendedTooltip" id="13"/>')
  })

  it("не принимает явное имя singleton без !xml/name", () => {
    const source = readXMLFixtureAsString(import.meta.url, "reportForm.xml")
      .replaceAll(
        "ТабличнаяЧастьВсеСвойстваСтрокаПоиска",
        "ТабличнаяЧастьВсеСвойстваSearchString",
    )
    const form = (importContentFromXML(source) as { Form: ClientApplicationFormXML }).Form
    const { contexts, formName, imported } = importReportForm(form)
    const yamlWithoutTag = serializeYAMLDocument(imported.yaml).text.replace("!xml/name ", "")
    const reparsed = parseMetadataYaml(yamlWithoutTag)

    expect(() => convertClientApplicationFormFromYAMLToXML({
      context: contexts.exportContext(),
      yaml: reparsed.data as ClientApplicationFormYAML,
      name: formName,
    })).toThrow("Явное XML-имя singleton должно быть помечено тегом !xml/name")
  })
})

function roundTripFormWithoutReference(formXML: ClientApplicationFormXML) {
  return directFormRoundTripWithoutReference(formXML).converted
}

function directFormRoundTripWithoutReference(formXML: ClientApplicationFormXML) {
  const contexts = createDirectRoundTripContexts({
    logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
  })
  const metadataXML = { Form: { Properties: { FormType: "Managed" } } } as FormMetadataXML
  const imported = importClientApplicationFormFromXMLToYAML({
    context: contexts.importContext,
    formName: "ФормаЭлемента",
    formXML,
    metadataXML,
  })
  const exportContext = contexts.exportContext()
  const converted = convertClientApplicationFormFromYAMLToXML({
    context: exportContext,
    yaml: imported.yaml as ClientApplicationFormYAML,
    name: "ФормаЭлемента",
  })
  return { converted, exportContext }
}

function importReportForm(form: ClientApplicationFormXML) {
  const metadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
    import.meta.url,
    "reportFormMetadata.xml",
  )
  const contexts = createDirectRoundTripContexts({
    logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
  })
  const formName = String(metadata.MetaDataObject.Form.Properties.Name)
  const imported = importClientApplicationFormFromXMLToYAML({
    context: contexts.importContext,
    formName,
    formXML: xmlElementFromTestValue("Form", form),
    metadataXML: parseXmlDocumentWithSaxes(readXMLFixtureAsString(import.meta.url, "reportFormMetadata.xml"), { preserveXsiNil: true }).roots[0]!,
  })
  return { contexts, formName, imported }
}

function canonicalXML(xml: string): unknown {
  return withoutFormattingText(importContentFromXML(xml))
}

const SNAPSHOT_13_XML_NAMES: Readonly<Record<string, string>> = {
  ChildItemsHorizontalAlign: "HorizontalAlign",
  ChildItemsVerticalAlign: "VerticalAlign",
  SlaveItemsWidth: "ChildItemsWidth",
  ItemsAndTitlesAlign: "ChildrenAlign",
  CollapseItemsByImportance: "CollapseItemsByImportanceVariant",
}

function canonicalSnapshot13XML(xml: string): unknown {
  return normalizeSnapshot13XML(canonicalXML(xml))
}

function normalizeSnapshot13XML(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeSnapshot13XML)
  }
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => {
      const normalizedKey = SNAPSHOT_13_XML_NAMES[key] ?? key
      const normalizedChild = normalizeSnapshot13XML(child)
      return [normalizedKey, normalizedKey === "Table" ? withCanonicalTableDefaults(normalizedChild) : normalizedChild]
    })
  )
}

function withCanonicalTableDefaults(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withCanonicalTableDefaults)
  if (value === null || typeof value !== "object") return value
  const table = value as Record<string, unknown>
  return {
    ...table,
    Period: table.Period ?? {
      "v8:variant": { "#text": "Custom", "_xsi:type": "v8:StandardPeriodVariant" },
      "v8:startDate": "0001-01-01T00:00:00",
      "v8:endDate": "0001-01-01T00:00:00",
    },
    TopLevelParent: table.TopLevelParent ?? { "_xsi:nil": "true" },
    RowFilter: table.RowFilter ?? { "_xsi:nil": "true" },
  }
}

function withoutFormattingText(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutFormattingText)
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, child]) => key !== "#text" || typeof child !== "string" || child.trim().length > 0)
      .map(([key, child]) => [key, withoutFormattingText(child)])
  )
}
