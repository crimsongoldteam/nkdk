import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
import {
  MetadataExternalDataSourceCubeCollectionRules,
  MetadataExternalDataSourceCubeRules,
} from "~/metadata/commonObjects/metadataExternalDataSourceCube/rules"
import {
  MetadataExternalDataSourceTableCollectionRules,
  MetadataExternalDataSourceTableRules,
} from "~/metadata/commonObjects/metadataExternalDataSourceTable/rules"

const properties = ["Properties"]
const childObjects = ["ChildObjects"]

export const MetadataExternalDataSourceRules = {
  itemType: "MetadataExternalDataSource",
  itemTypePrefix: "ВнешнийИсточникДанных",
  xmlDir: "ExternalDataSources",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "ExternalDataSource",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    internalInfo: {
      type: "InternalInfo",
      xmlParents: [],
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
      items: [
        { name: "ExternalDataSourceManager", category: "Manager" },
        { name: "ExternalDataSourceTablesManager", category: "TablesManager" },
        { name: "ExternalDataSourceCubesManager", category: "CubesManager" },
      ],
    },
    uuid: {
      type: "uuid",
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
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
    dataLockControlMode: {
      yaml: "РежимУправленияБлокировкойДанных",
      xml: "DataLockControlMode",
      type: "SystemEnumeration",
      typeSE: "DefaultDataLockControlMode",
      xmlParents: properties,
      defaultValueXML: "Automatic",
      implicitValueYAML: "Automatic",
    },
    tables: {
      yaml: "Таблицы",
      xml: "Table",
      type: "MetadataExternalDataSourceTables",
      xmlParents: childObjects,
    },
    cubes: {
      yaml: "Кубы",
      xml: "Cube",
      type: "MetadataExternalDataSourceCubes",
      xmlParents: childObjects,
    },
    functions: {
      yaml: "Функции",
      xml: "Function",
      type: "MetadataExternalDataSourceFunctions",
      xmlParents: childObjects,
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      implicitValueYAML: "Native",
      toYAML: false,
      fromYAML: false,
    },
    extendedConfigurationObject: {
      xml: "ExtendedConfigurationObject",
      type: "string",
      xmlParents: properties,
      runtimeOnly: true,
    },
  },
  childCollections: [
    {
      propertyKey: "tables",
      itemRule: MetadataExternalDataSourceTableCollectionRules,
      fileItemRule: MetadataExternalDataSourceTableRules,
      nkdkDir: ({ name }: { name: string }) => `Таблицы/${name}`,
      xmlDir: ({ name }: { name: string }) => `Tables/${name}`,
    },
    {
      propertyKey: "cubes",
      itemRule: MetadataExternalDataSourceCubeCollectionRules,
      fileItemRule: MetadataExternalDataSourceCubeRules,
      nkdkDir: ({ name }: { name: string }) => `Кубы/${name}`,
      xmlDir: ({ name }: { name: string }) => `Cubes/${name}`,
    },
  ],
} as const satisfies MetadataItemRule
