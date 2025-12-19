import { assert } from "typia"
import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import xmlImport from "~/lib/xml/import/importer"
import { importMetadataCatalogFromXML } from "./importFromXML"
import { MetadataCatalog, MetadataCatalogXML } from "./types"

describe("importMetadataCatalogFromXML", () => {
  it("should import metadata catalog from XML", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:cmi="http://v8.1c.ru/8.2/managed-application/cmi" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xen="http://v8.1c.ru/8.3/xcf/enums" xmlns:xpr="http://v8.1c.ru/8.3/xcf/predef" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<Catalog uuid="d31edcfb-c254-4df6-813c-45d97556c9a4">
		<InternalInfo>
			<xr:GeneratedType name="CatalogObject.Контрагенты" category="Object">
				<xr:TypeId>26b3549b-c3c7-4670-85ac-1f213210cc50</xr:TypeId>
				<xr:ValueId>f7beb6fa-01b7-42d5-af21-8426469fbf3b</xr:ValueId>
			</xr:GeneratedType>
			<xr:GeneratedType name="CatalogRef.Контрагенты" category="Ref">
				<xr:TypeId>b692a3bc-f9d8-4bec-836e-67bb38767199</xr:TypeId>
				<xr:ValueId>0fd40096-7bec-4145-9be5-5a464e0589ab</xr:ValueId>
			</xr:GeneratedType>
			<xr:GeneratedType name="CatalogSelection.Контрагенты" category="Selection">
				<xr:TypeId>86d68206-17c5-4f8b-9f1e-cb83bb32bd18</xr:TypeId>
				<xr:ValueId>f7046d6d-ecfe-464d-9cc7-2de3fdfe9900</xr:ValueId>
			</xr:GeneratedType>
			<xr:GeneratedType name="CatalogList.Контрагенты" category="List">
				<xr:TypeId>b2b1e80f-b136-4c2e-b770-ed32334a060a</xr:TypeId>
				<xr:ValueId>ca26fb8a-8414-468c-a0f8-f574ca1906b8</xr:ValueId>
			</xr:GeneratedType>
			<xr:GeneratedType name="CatalogManager.Контрагенты" category="Manager">
				<xr:TypeId>e87aa731-0f4b-482e-80c5-6d9e80b04a4c</xr:TypeId>
				<xr:ValueId>444ed280-0682-4349-8215-a9a08dc04009</xr:ValueId>
			</xr:GeneratedType>
		</InternalInfo>
		<Properties>
			<Name>Контрагенты</Name>
			<Synonym>
				<v8:item>
					<v8:lang>ru</v8:lang>
					<v8:content>Контрагенты</v8:content>
				</v8:item>
			</Synonym>
		</Properties>
	</Catalog>
</MetaDataObject>`

    const expectedResult: MetadataCatalog = {
      name: "Контрагенты",
      synonym: { items: { ru: "Контрагенты" } },
    }

    const xmlData = xmlImport<{ MetaDataObject: MetadataCatalogXML }>(xml)

    expect(assert<MetadataCatalog>(xmlData.MetaDataObject)).toEqual(xmlData.MetaDataObject)

    const result = importMetadataCatalogFromXML(xmlData.MetaDataObject, mockConfigurationSettings)

    expect(result).toEqual(expectedResult)
  })
})
