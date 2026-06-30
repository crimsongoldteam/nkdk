import { metadataExternalDataSourceFunctionsRule } from "~/metadata/appliedObjects/metadataExternalDataSource/builders"
import { childFileItemNamesRule } from "~/metadata/commonObjects/childFileItemNames/types"
import { internalInfoRule } from "~/metadata/commonObjects/internalInfo/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { uuidRule } from "~/metadata/commonObjects/uuid/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
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
  metadataTargetOwner: { kind: "self", root: "ExternalDataSource" },
  itemTypePrefix: "ВнешнийИсточникДанных",
  xmlDir: "ExternalDataSources",
  properties: {
    xmlRoot: xmlRootRule({
      container: "ExternalDataSource",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
      items: [
        { name: "ExternalDataSourceManager", category: "Manager" },
        { name: "ExternalDataSourceTablesManager", category: "TablesManager" },
        { name: "ExternalDataSourceCubesManager", category: "CubesManager" },
      ],
    }),
    uuid: uuidRule({
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    }),
    name: stringRule({
      xmlParents: properties,
      required: true,
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    dataLockControlMode: systemEnumerationRule({
      yaml: "РежимУправленияБлокировкойДанных",
      xml: "DataLockControlMode",
      typeSE: "DefaultDataLockControlMode",
      xmlParents: properties,
      defaultValueXML: "Automatic",
      implicitValueYAML: "Automatic",
    }),
    tables: childFileItemNamesRule({
      yaml: "Таблицы",
      xml: "Table",
      xmlParents: childObjects,
      forReferenceOnly: true,
    }),
    cubes: childFileItemNamesRule({
      yaml: "Кубы",
      xml: "Cube",
      xmlParents: childObjects,
      forReferenceOnly: true,
    }),
    functions: metadataExternalDataSourceFunctionsRule({
      yaml: "Функции",
      xml: "Function",
      xmlParents: childObjects,
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      implicitValueYAML: "Native",
      toYAML: false,
      fromYAML: false,
    }),
    extendedConfigurationObject: stringRule({
      xml: "ExtendedConfigurationObject",
      xmlParents: properties,
      runtimeOnly: true,
    }),
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
