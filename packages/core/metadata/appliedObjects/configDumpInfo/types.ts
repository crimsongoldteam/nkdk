export type ConfigDumpInfoIdMap = Map<string, Map<string, string>>
export type ConfigDumpInfoConfigVersionMap = Map<string, string>

//#region XML

export interface ConfigDumpInfoMetadataXML {
  _name: string
  _id: string
  _configVersion: string
  Metadata?: ConfigDumpInfoMetadataInnerXML | ConfigDumpInfoMetadataInnerXML[]
}

export interface ConfigDumpInfoMetadataInnerXML {
  _name: string
  _id: string
}

export interface ConfigDumpInfoXML {
  _format: "Hierarchical"
  _version: string
  _xmlns: "http://v8.1c.ru/8.3/xcf/dumpinfo"
  "_xmlns:xen": "http://v8.1c.ru/8.3/xcf/enums"
  "_xmlns:xs": "http://www.w3.org/2001/XMLSchema"
  "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
  ConfigVersions: {
    Metadata: ConfigDumpInfoMetadataXML | ConfigDumpInfoMetadataXML[]
  }
}

//#endregion
