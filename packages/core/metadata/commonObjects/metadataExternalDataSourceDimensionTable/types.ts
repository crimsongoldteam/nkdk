import { registerMetadataItemCollectionRule, registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import {
  MetadataExternalDataSourceDimensionTableCollectionRules,
  MetadataExternalDataSourceDimensionTableRules,
} from "./rules"

export type MetadataExternalDataSourceDimensionTable = MetadataTypeByRule<
  typeof MetadataExternalDataSourceDimensionTableRules
>
export type MetadataExternalDataSourceDimensionTableYAML = YAMLTypeByRule<
  typeof MetadataExternalDataSourceDimensionTableRules
>

export type MetadataExternalDataSourceDimensionTables = MetadataExternalDataSourceDimensionTable[]
export type MetadataExternalDataSourceDimensionTablesYAML = Record<
  string,
  MetadataExternalDataSourceDimensionTableYAML
>

registerMetadataItemRule({
  propertyType: "MetadataExternalDataSourceDimensionTable",
  itemRule: MetadataExternalDataSourceDimensionTableRules,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataExternalDataSourceDimensionTables",
  itemRule: MetadataExternalDataSourceDimensionTableCollectionRules,
  xmlElement: "DimensionTable",
  keyField: "name",
  graphChild: {
    idFrom: "name",
    edgeKind: "EXTERNAL_DATA_SOURCE_DIMENSION_TABLE",
    edgeYaml: "ТаблицаИзмеренияКубаВнешнегоИсточникаДанных",
    nodeSegment: "DimensionTable",
  },
})
