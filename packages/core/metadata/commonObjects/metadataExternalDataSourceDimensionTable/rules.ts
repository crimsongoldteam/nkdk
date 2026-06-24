import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { MetadataCommandRules } from "~/metadata/appliedObjects/metadataCommand/rules"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { externalDataSourceObjectServiceProperties } from "../metadataExternalDataSourceField/rules"

const properties = ["Properties"]
const childObjects = ["ChildObjects"]
const root: string[] = []

const MetadataExternalDataSourceDimensionTableCommandRules = {
  ...MetadataCommandRules,
  properties: {
    ...MetadataCommandRules.properties,
    commandModule: {
      ...MetadataCommandRules.properties.commandModule,
      xmlPath: ({ name, parentName }: { name: string; parentName?: string }) =>
        parentName === undefined || parentName === ""
          ? `Commands/${name}/Ext/CommandModule.bsl`
          : `DimensionTables/${parentName}/Commands/${name}/Ext/CommandModule.bsl`,
    },
  },
} as const satisfies MetadataItemRule

const dimensionTableProperties = {
  xmlRoot: {
    type: "XMLRoot",
    container: "DimensionTable",
    rootAttributes: V8_MDCLASSES_ROOT,
    forReferenceOnly: true,
    toYAML: false,
    fromYAML: false,
  },
  internalInfo: {
    type: "InternalInfo",
    xmlParents: root,
    forReferenceOnly: true,
    toYAML: false,
    fromYAML: false,
    getName: (params: { context: ConfigurationContextWithExportToXML; metadata: { name: string } }) => {
      const externalDataSource = getParentFromContext(params.context, ["MetadataExternalDataSource"])
      const cube = getParentFromContext(params.context, ["MetadataExternalDataSourceCube"])
      return [externalDataSource.name, cube.name, params.metadata.name].filter(Boolean).join(".")
    },
    items: [
      { name: "ExternalDataSourceCubeDimensionTableManager", category: "Manager" },
      { name: "ExternalDataSourceCubeDimensionTableObject", category: "Object" },
      { name: "ExternalDataSourceCubeDimensionTableRef", category: "Ref" },
      { name: "ExternalDataSourceCubeDimensionTableList", category: "List" },
    ] as { name: string; category: string }[],
  },
  uuid: {
    type: "uuid",
    xml: "_uuid",
    forReferenceOnly: true,
    xmlParents: root,
  },
  name: {
    type: "string",
    xmlParents: properties,
    required: true,
  },
  synonym: {
    yaml: "Синоним",
    type: "I8nText",
    xmlParents: properties,
    defaultValueXMLRaw: "",
  },
  comment: {
    yaml: "Комментарий",
    type: "string",
    xmlParents: properties,
    defaultValueXMLRaw: "",
  },
  nameInDataSource: {
    yaml: "ИмяВИсточникеДанных",
    xml: "NameInDataSource",
    type: "string",
    xmlParents: properties,
    required: true,
  },
  presentationField: {
    yaml: "ПолеПредставления",
    xml: "PresentationField",
    type: "string",
    xmlParents: properties,
    defaultValueXMLRaw: "",
  },
  hierarchyNameInDataSource: {
    yaml: "ИмяИерархииВИсточникеДанных",
    xml: "HierarchyNameInDataSource",
    type: "string",
    xmlParents: properties,
    defaultValueXMLRaw: "",
  },
  levelNumber: {
    yaml: "НомерУровня",
    xml: "LevelNumber",
    type: "number",
    xmlParents: properties,
    defaultValueXML: 0,
    implicitValueYAML: 0,
  },
  hierarchical: {
    yaml: "Иерархический",
    xml: "Hierarchical",
    type: "boolean",
    xmlParents: properties,
    defaultValueXML: false,
    implicitValueYAML: false,
  },
  unfilledParentValue: {
    yaml: "НезаполненноеЗначениеРодителя",
    xml: "UnfilledParentValue",
    type: "MetadataValue",
    xmlParents: properties,
    defaultValueXMLRaw: { "_xsi:nil": true },
  },
  useStandardCommands: {
    yaml: "ИспользоватьСтандартныеКоманды",
    xml: "UseStandardCommands",
    type: "boolean",
    xmlParents: properties,
    defaultValueXML: false,
    implicitValueYAML: false,
  },
  quickChoice: {
    yaml: "БыстрыйВыбор",
    xml: "QuickChoice",
    type: "boolean",
    xmlParents: properties,
    defaultValueXML: false,
    implicitValueYAML: false,
  },
  defaultObjectForm: {
    yaml: "ОсновнаяФормаОбъекта",
    xml: "DefaultObjectForm",
    type: "string",
    xmlParents: properties,
    metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
    defaultValueXMLRaw: "",
  },
  defaultListForm: {
    yaml: "ОсновнаяФормаСписка",
    xml: "DefaultListForm",
    type: "string",
    xmlParents: properties,
    metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
    defaultValueXMLRaw: "",
  },
  defaultChoiceForm: {
    yaml: "ОсновнаяФормаВыбора",
    xml: "DefaultChoiceForm",
    type: "string",
    xmlParents: properties,
    metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"], objectRoots: ["CommonForm"] },
    defaultValueXMLRaw: "",
  },
  objectPresentation: {
    yaml: "ПредставлениеОбъекта",
    xml: "ObjectPresentation",
    type: "I8nText",
    xmlParents: properties,
    defaultValueXMLRaw: "",
  },
  extendedObjectPresentation: {
    yaml: "РасширенноеПредставлениеОбъекта",
    xml: "ExtendedObjectPresentation",
    type: "I8nText",
    xmlParents: properties,
    defaultValueXMLRaw: "",
  },
  listPresentation: {
    yaml: "ПредставлениеСписка",
    xml: "ListPresentation",
    type: "I8nText",
    xmlParents: properties,
    defaultValueXMLRaw: "",
  },
  extendedListPresentation: {
    yaml: "РасширенноеПредставлениеСписка",
    xml: "ExtendedListPresentation",
    type: "I8nText",
    xmlParents: properties,
    defaultValueXMLRaw: "",
  },
  explanation: {
    yaml: "Пояснение",
    xml: "Explanation",
    type: "I8nText",
    xmlParents: properties,
    defaultValueXMLRaw: "",
  },
  includeHelpInContents: {
    yaml: "ВключатьСправкуВСодержание",
    xml: "IncludeHelpInContents",
    type: "boolean",
    xmlParents: properties,
    defaultValueXML: false,
    implicitValueYAML: false,
  },
  fields: {
    yaml: "Поля",
    xml: "Field",
    type: "MetadataExternalDataSourceFields",
    xmlParents: childObjects,
  },
  forms: {
    yaml: "Формы",
    xml: "Form",
    type: "ChildFormNames",
    xmlParents: childObjects,
    folderName: "Формы",
    forReferenceOnly: true,
    toYAML: false,
    fromYAML: false,
  },
  commands: {
    yaml: "Команды",
    xml: "Command",
    type: "MetadataCommands",
    xmlParents: childObjects,
  },
  templates: {
    yaml: "Макеты",
    xml: "Template",
    type: "ChildTemplateNames",
    xmlParents: childObjects,
    folderName: "Макеты",
    forReferenceOnly: true,
    toYAML: false,
    fromYAML: false,
  },
  managerModule: {
    type: "Module",
    externalMetadata: { segment: "ManagerModule", placement: "derivedEntry" },
    nkdkPath: "МодульМенеджера.bsl",
    xmlPath: "Ext/ManagerModule.bsl",
  },
  help: {
    type: "Help",
    externalMetadata: { segment: "Help", placement: "derivedEntry" },
    filePath: "Ext/Help.xml",
    xmlPath: "Ext/Help.xml",
    nkdkDir: "Справка",
  },
  ...externalDataSourceObjectServiceProperties,
} as const

const { xmlRoot: _xmlRoot, ...dimensionTableCollectionProperties } = dimensionTableProperties

export const MetadataExternalDataSourceDimensionTableRules = {
  itemType: "MetadataExternalDataSourceDimensionTable",
  externalMetadata: { segment: "DimensionTable", placement: "ownedEntry" },
  properties: dimensionTableProperties,
  childCollections: [{ propertyKey: "commands", itemRule: MetadataExternalDataSourceDimensionTableCommandRules }],
} as const satisfies MetadataItemRule

export const MetadataExternalDataSourceDimensionTableCollectionRules = {
  itemType: "MetadataExternalDataSourceDimensionTable",
  properties: dimensionTableCollectionProperties,
  childCollections: [{ propertyKey: "commands", itemRule: MetadataExternalDataSourceDimensionTableCommandRules }],
} as const satisfies MetadataItemRule
