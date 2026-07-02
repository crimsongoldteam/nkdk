import { metadataExternalDataSourceFunctionsRule } from "./builders"
import { childFileItemNamesRule } from "../../commonObjects/childFileItemNames/types"
import { internalInfoRule } from "../../commonObjects/internalInfo/types"
import { i8nTextRule } from "../../commonObjects/i8nText/types"
import { stringRule } from "../../commonObjects/string/types"
import { uuidRule } from "../../commonObjects/uuid/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../orchestration/appliedObject/presets"
import type { MetadataItemRule } from "../../orchestration/property/types"
import {
  MetadataExternalDataSourceCubeCollectionRules,
  MetadataExternalDataSourceCubeRules,
} from "../../commonObjects/metadataExternalDataSourceCube/rules"
import {
  MetadataExternalDataSourceTableCollectionRules,
  MetadataExternalDataSourceTableRules,
} from "../../commonObjects/metadataExternalDataSourceTable/rules"
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
      excludeIfEqualNameYAML: true,
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
