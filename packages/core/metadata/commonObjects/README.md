# О работе с ссылками

- Тип значения
- Поле метаданного (в том числе путь к данным)
- Метаданное
- Значение

- **Тип значения (TypeDescription)**
  - Тип: `TypeDescription` (массив типов + опциональные qualifiers).
  - Пример XML:

    ```xml
    <TypeDescription>
    	<v8:Type>cfg:CatalogRef.Контрагенты</v8:Type>
    </TypeDescription>
    ```

    С qualifiers:

    ```xml
    <TypeDescription>
    	<v8:Type>xs:dateTime</v8:Type>
    	<v8:DateQualifiers>
    		<v8:DateFractions>DateTime</v8:DateFractions>
    	</v8:DateQualifiers>
    </TypeDescription>
    ```

- **Поле метаданного / Метаданное (MetadataField, MetadataFields)**
  - Тип: `MetadataField` (string), `MetadataFields` (массив).
  - Пример XML:

    ```xml
    <InputByString>
    	<xr:Field>Catalog.Контрагенты.StandardAttribute.Description</xr:Field>
    	<xr:Field>Catalog.Контрагенты.StandardAttribute.Code</xr:Field>
    </InputByString>
    ```

- **Путь к данным (MetadataPath)**
  - Тип: `DataPathYAML` (string). Используется в правилах и в `xr:DataPath`.
  - Пример XML (внутри TypeLink):

    ```xml
    <TypeLink>
    	<xr:DataPath>AccountingRegister.Международный.StandardAttribute.Account</xr:DataPath>
    	<xr:LinkItem>1</xr:LinkItem>
    </TypeLink>
    ```

- **Ссылка на объект метаданных (MetadataRef)**
  - Тип: `MetadataItemLink`, `MetadataItemLinks`.
  - Пример XML:

    ```xml
    <Value xsi:type="xr:MDObjectRef">ChartOfCharacteristicTypes.ДополнительныеРеквизитыИСведения</Value>
    ```

- **Значение метаданного (MetadataValue)**
  - Тип: `MetadataValue` (варианты: `string`, `decimal`, `dateTime`, `boolean`, `ref`, `objectRef`, `fixedArray`, `formChoiceListDesTimeValue`).
  - Примеры XML:

    ```xml
    <Value xsi:type="xs:string">Текстовое значение</Value>
    ```

    ```xml
    <Value xsi:type="xs:dateTime">2025-12-24T12:00:00</Value>
    ```

    ```xml
    <Value xsi:type="v8:FixedArray">
    	<v8:Value xsi:type="xr:DesignTimeRef">Enum.ТипыСчетов.EnumValue.КосвенныеЗатраты</v8:Value>
    	<v8:Value xsi:type="xr:DesignTimeRef">Enum.ТипыСчетов.EnumValue.Расходы</v8:Value>
    </Value>
    ```

- **Коллекция значений метаданных (MetadataValueCollection)**
  - Тип: `MetadataValueCollection` (массив строк), `MetadataValueCollectionItem` (string).
  - Пример XML:

    ```xml
    <BasedOn>
    	<xr:Item xsi:type="xr:MDObjectRef">Catalog.Контрагенты</xr:Item>
    	<xr:Item xsi:type="xr:MDObjectRef">Document.ПриемНаРаботу</xr:Item>
    </BasedOn>
    ```

- **Ссылка на тип (TypeLink)**
  - Тип: `TypeLink` (`dataPath` + `linkItem`).
  - Пример XML:

    ```xml
    <TypeLink>
    	<xr:DataPath>AccountingRegister.Международный.StandardAttribute.Account</xr:DataPath>
    	<xr:LinkItem>1</xr:LinkItem>
    </TypeLink>
    ```

    С `xsi:type` у DataPath:

    ```xml
    <TypeLink>
    	<xr:DataPath xsi:type="xs:string">Catalog.КакойТоСправочник.TabularSection.КакаяТоТаблица.Attribute.КакойТоРеквизит</xr:DataPath>
    	<xr:LinkItem>1</xr:LinkItem>
    </TypeLink>
    ```

- **Список полей (FieldsList)**
  - Тип: `FieldsList` (string[]), `FieldsListYAML`.
  - Пример XML:

    ```xml
    <UseAlways>
    	<Field>Список.РеквизитДопУпорядочивания</Field>
    	<Field>Список.Ссылка</Field>
    </UseAlways>
    ```
