import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { MetadataCommandRules } from "~/metadata/appliedObjects/metadataCommand/rules"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { externalDataSourceObjectServiceProperties } from "../metadataExternalDataSourceField/rules"
import {
  MetadataExternalDataSourceDimensionTableCollectionRules,
  MetadataExternalDataSourceDimensionTableRules,
} from "../metadataExternalDataSourceDimensionTable/rules"

const properties = ["Properties"]
const childObjects = ["ChildObjects"]
const root: string[] = []

const MetadataExternalDataSourceCubeCommandRules = {
  ...MetadataCommandRules,
  properties: {
    ...MetadataCommandRules.properties,
    commandModule: {
      ...MetadataCommandRules.properties.commandModule,
      xmlPath: ({ name, parentName }: { name: string; parentName?: string }) =>
        parentName === undefined || parentName === ""
          ? `Commands/${name}/Ext/CommandModule.bsl`
          : `Cubes/${parentName}/Commands/${name}/Ext/CommandModule.bsl`,
    },
  },
} as const satisfies MetadataItemRule

const cubeProperties = {
  xmlRoot: {
    type: "XMLRoot",
    container: "Cube",
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
      const parent = getParentFromContext(params.context, ["MetadataExternalDataSource"])
      return parent.name ? `${parent.name}.${params.metadata.name}` : params.metadata.name
    },
    items: [
      { name: "ExternalDataSourceCubeManager", category: "Manager" },
      { name: "ExternalDataSourceCubeList", category: "List" },
      { name: "ExternalDataSourceCubeRecordSet", category: "RecordSet" },
      { name: "ExternalDataSourceCubeRecord", category: "Record" },
      { name: "ExternalDataSourceCubeRecordKey", category: "RecordKey" },
      { name: "ExternalDataSourceCubeRecordManager", category: "RecordManager" },
      { name: "ExternalDataSourceCubeDimensionsTablesManager", category: "DimensionTables" },
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
  characteristics: {
    yaml: "Характеристики",
    xml: "Characteristics",
    type: "CharacteristicsDescriptions",
    xmlParents: properties,
    defaultValueXMLRaw: "",
  },
  useStandardCommands: {
    yaml: "ИспользоватьСтандартныеКоманды",
    xml: "UseStandardCommands",
    type: "boolean",
    xmlParents: properties,
    defaultValueXML: false,
    defaultValueYAML: false,
  },
  defaultRecordForm: {
    yaml: "ОсновнаяФормаЗаписи",
    xml: "DefaultRecordForm",
    type: "string",
    xmlParents: properties,
    referenceScope: { target: "this", kind: "Form" },
    defaultValueXMLRaw: "",
  },
  defaultListForm: {
    yaml: "ОсновнаяФормаСписка",
    xml: "DefaultListForm",
    type: "string",
    xmlParents: properties,
    referenceScope: { target: "this", kind: "Form" },
    defaultValueXMLRaw: "",
  },
  recordPresentation: {
    yaml: "ПредставлениеЗаписи",
    xml: "RecordPresentation",
    type: "I8nText",
    xmlParents: properties,
    defaultValueXMLRaw: "",
  },
  extendedRecordPresentation: {
    yaml: "РасширенноеПредставлениеЗаписи",
    xml: "ExtendedRecordPresentation",
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
    defaultValueYAML: false,
  },
  dimensionTables: {
    yaml: "ТаблицыИзмерений",
    xml: "DimensionTable",
    type: "MetadataExternalDataSourceDimensionTables",
    xmlParents: childObjects,
    fromXML: false,
  },
  dimensions: {
    yaml: "Измерения",
    xml: "Dimension",
    type: "MetadataExternalDataSourceCubeDimensions",
    xmlParents: childObjects,
  },
  resources: {
    yaml: "Ресурсы",
    xml: "Resource",
    type: "MetadataExternalDataSourceCubeResources",
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
  recordSetModule: {
    type: "Module",
    nkdkPath: "МодульНабораЗаписей.bsl",
    xmlPath: "Ext/RecordSetModule.bsl",
  },
  help: {
    type: "Help",
    filePath: "Ext/Help.xml",
    xmlPath: "Ext/Help.xml",
    nkdkDir: "Справка",
  },
  ...externalDataSourceObjectServiceProperties,
} as const

const { xmlRoot: _xmlRoot, ...cubeCollectionProperties } = cubeProperties

export const MetadataExternalDataSourceCubeRules = {
  itemType: "MetadataExternalDataSourceCube",
  properties: cubeProperties,
  childCollections: [
    {
      propertyKey: "dimensionTables",
      itemRule: MetadataExternalDataSourceDimensionTableCollectionRules,
      fileItemRule: MetadataExternalDataSourceDimensionTableRules,
      nkdkDir: ({ name }: { name: string }) => `ТаблицыИзмерений/${name}`,
      xmlDir: ({ name }: { name: string }) => `DimensionTables/${name}`,
    },
    { propertyKey: "commands", itemRule: MetadataExternalDataSourceCubeCommandRules },
  ],
} as const satisfies MetadataItemRule

export const MetadataExternalDataSourceCubeCollectionRules = {
  itemType: "MetadataExternalDataSourceCube",
  properties: cubeCollectionProperties,
  childCollections: [
    {
      propertyKey: "dimensionTables",
      itemRule: MetadataExternalDataSourceDimensionTableCollectionRules,
      fileItemRule: MetadataExternalDataSourceDimensionTableRules,
      nkdkDir: ({ name }: { name: string }) => `ТаблицыИзмерений/${name}`,
      xmlDir: ({ name }: { name: string }) => `DimensionTables/${name}`,
    },
    { propertyKey: "commands", itemRule: MetadataExternalDataSourceCubeCommandRules },
  ],
} as const satisfies MetadataItemRule
