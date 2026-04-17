# round-trip: потеря xsi:type="xr:DesignTimeRef" в FillValue StandardAttribute Owner (АвансовыйОтчетПрисоединенныеФайлы.xml)

_Перенесено из GitHub-issue #69 (2026-04-16)._

## Контекст
Файл: `Catalogs/АвансовыйОтчетПрисоединенныеФайлы.xml`
Узел: `xr:FillValue` стандартного реквизита `Owner` справочника `АвансовыйОтчетПрисоединенныеФайлы`
XPath: `MetaDataObject/Catalog/Properties/StandardAttributes/xr:StandardAttribute[@name='Owner']/xr:FillValue`

## XML до round-trip
```xml
<xr:StandardAttribute name="Owner">
    <!-- ... -->
    <xr:ChoiceParameterLinks/>
    <xr:FillValue xsi:type="xr:DesignTimeRef"/>
    <xr:Mask/>
    <xr:ChoiceParameters/>
</xr:StandardAttribute>
```

## XML после round-trip
```xml
<xr:StandardAttribute name="Owner">
    <!-- ... -->
    <xr:ChoiceParameterLinks/>
    <xr:FillValue xsi:nil="true"/>
    <xr:Mask/>
    <xr:ChoiceParameters/>
</xr:StandardAttribute>
```

## Описание отклонения
Атрибут `xsi:type="xr:DesignTimeRef"` у пустого элемента `xr:FillValue` теряется при round-trip и заменяется на `xsi:nil="true"`. То есть форма «пусто, но с типом DesignTimeRef» (валидная для значения-ссылки без присвоенного значения) преобразуется в «пусто без типа». Информация о типе значения заполнения утрачивается.

## Предполагаемая причина
Правило `fillValue` для стандартных реквизитов:
- `packages/core/metadata/commonObjects/standardAttributeDescription/rules.ts:97-104` — `defaultValueXMLRaw: { "_xsi:nil": true }`

Импортер `importMetadataValueFromXML` (`packages/core/metadata/commonObjects/metadataValue/fromXML.ts`) при `<xr:FillValue xsi:type="xr:DesignTimeRef"/>` без `#text` возвращает `undefined` (или падает на строке 28 при отсутствии `_xsi:type`, что подтверждает, что узел доходит без `_xsi:type`). Далее экспортер использует `defaultValueXMLRaw` рулсета, который равен `{ "_xsi:nil": true }`, и пишет именно эту форму, теряя `xsi:type`. Нужно либо сохранять исходный `xsi:type` в модели, либо в `exportMetadataValueToXML` для `value === undefined` возвращать `{ "_xsi:type": rule.defaultType }` при наличии информации о типе у правила (по аналогии с веткой `rule.valueType !== undefined` в `metadataValue/toXML.ts:26-37`).
