import { MetadataWSReference, MetadataWSReferenceYAML } from "../types"

export const minimal: MetadataWSReference = {
  itemType: "MetadataWSReference",
  name: "WSСсылкаПоУмолчанию",
  synonym: { items: { ru: "WSСсылка по умолчанию" } },
  locationURL: "http://www.dneonline.com/calculator.asmx?wsdl",
}

export const minimalYAML: MetadataWSReferenceYAML = {
  Синоним: "WSСсылка по умолчанию",
  URL: "http://www.dneonline.com/calculator.asmx?wsdl",
}
