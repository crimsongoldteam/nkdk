# round-trip: FillValue реквизита ТипХраненияФайла xsi:nil заменяется на xsi:type="xs:string" (АвансовыйОтчетПрисоединенныеФайлы.xml)

_Перенесено из GitHub-issue #71 (2026-04-16)._

## Контекст
Файл: `Catalogs/АвансовыйОтчетПрисоединенныеФайлы.xml`
Узел: `FillValue` реквизита `ТипХраненияФайла` (тип `EnumRef.ТипыХраненияФайлов`, `FillChecking=ShowError`) справочника `АвансовыйОтчетПрисоединенныеФайлы`
XPath: `MetaDataObject/Catalog/ChildObjects/Attribute[Properties/Name='ТипХраненияФайла']/Properties/FillValue`

## XML до round-trip
```xml
<Attribute uuid="...">
    <Properties>
        <Name>ТипХраненияФайла</Name>
        <!-- ... -->
        <Type>
            <v8:Type>cfg:EnumRef.ТипыХраненияФайлов</v8:Type>
        </Type>
        <!-- ... -->
        <MinValue xsi:nil="true"/>
        <MaxValue xsi:nil="true"/>
        <FillFromFillingValue>false</FillFromFillingValue>
        <FillValue xsi:nil="true"/>
        <FillChecking>ShowError</FillChecking>
        <!-- ... -->
    </Properties>
</Attribute>
```

## XML после round-trip
```xml
<Attribute uuid="...">
    <Properties>
        <!-- ... -->
        <FillFromFillingValue>false</FillFromFillingValue>
        <FillValue xsi:type="xs:string"/>
        <FillChecking>ShowError</FillChecking>
        <!-- ... -->
    </Properties>
</Attribute>
```

## Описание отклонения
То же поведение, что и в issue #70, но на реквизите с типом `EnumRef` и `FillChecking=ShowError`. Исходное `<FillValue xsi:nil="true"/>` (значение заполнения отсутствует) заменяется на `<FillValue xsi:type="xs:string"/>` (пустая строка), что меняет семантику и не соответствует типу реквизита (перечисление). Сосед `FillChecking>ShowError` подтверждает, что узел действительно требует осмысленной обработки пустого значения.

Этот узел вынесен в отдельный issue, потому что:
1. Тип реквизита (`EnumRef`) отличается от `DocumentRef` из #70 — потенциально дефект может проявляться в зависимости от типа.
2. `FillChecking=ShowError` — здесь значение действительно проверяется платформой при заполнении, а не просто игнорируется, поэтому неверный `xs:string` критичнее.

## Предполагаемая причина
Та же, что и в #70:
- `packages/core/metadata/commonObjects/metadataAttribute/rules.ts:134-142` — `defaultValueXMLRaw: { "_xsi:type": "xs:string" }`
- `packages/core/metadata/commonObjects/metadataValue/fromXML.ts` — не сохраняет `xsi:nil` в модели, при экспорте используется фиксированный дефолт правила

Возможный путь исправления: при импорте `xsi:nil` помечать значение специальной меткой (или возвращать объект `{ _xsi:nil: true }` в модель), чтобы экспортер мог отличить «не задано» от «строка по умолчанию» и сериализовать обратно `xsi:nil="true"`.
