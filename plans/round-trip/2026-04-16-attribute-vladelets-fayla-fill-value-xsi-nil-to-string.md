# round-trip: FillValue реквизита ВладелецФайла xsi:nil заменяется на xsi:type="xs:string" (АвансовыйОтчетПрисоединенныеФайлы.xml)

_Перенесено из GitHub-issue #70 (2026-04-16)._

## Контекст
Файл: `Catalogs/АвансовыйОтчетПрисоединенныеФайлы.xml`
Узел: `FillValue` реквизита `ВладелецФайла` (тип `DocumentRef.АвансовыйОтчет`) справочника `АвансовыйОтчетПрисоединенныеФайлы`
XPath: `MetaDataObject/Catalog/ChildObjects/Attribute[Properties/Name='ВладелецФайла']/Properties/FillValue`

## XML до round-trip
```xml
<Attribute uuid="...">
    <Properties>
        <Name>ВладелецФайла</Name>
        <!-- ... -->
        <Type>
            <v8:Type>cfg:DocumentRef.АвансовыйОтчет</v8:Type>
        </Type>
        <!-- ... -->
        <MinValue xsi:nil="true"/>
        <MaxValue xsi:nil="true"/>
        <FillFromFillingValue>false</FillFromFillingValue>
        <FillValue xsi:nil="true"/>
        <FillChecking>DontCheck</FillChecking>
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
        <FillChecking>DontCheck</FillChecking>
        <!-- ... -->
    </Properties>
</Attribute>
```

## Описание отклонения
Пустое значение заполнения `<FillValue xsi:nil="true"/>` после round-trip заменяется на `<FillValue xsi:type="xs:string"/>`. Это семантически другое: вместо «значение отсутствует» подставляется «значение пустой строки». Для реквизита-ссылки (`DocumentRef`) `xs:string` тем более некорректен — тип `FillValue` должен соответствовать типу самого реквизита, либо сохраняться `xsi:nil`.

В этом же файле тот же дефект воспроизводится ещё в 9 регулярных реквизитах (`ДатаЗаема`, `ДатаМодификацииУниверсальная`, `ДатаСоздания`, `Зашифрован`, `ПодписанЭП`, `ТекстХранилище`, `Том`, `ФайлХранилище`, `ХранитьВерсии`) — это отдельные узлы с тем же корнем проблемы.

## Предполагаемая причина
Правило `fillValue` для регулярных реквизитов:
- `packages/core/metadata/commonObjects/metadataAttribute/rules.ts:134-142`
  ```ts
  fillValue: {
    yaml: "ЗначениеЗаполнения",
    xml: "FillValue",
    type: "MetadataValue",
    withType: true,
    xmlParents: ["Properties"],
    order: 16,
    defaultValueXMLRaw: { "_xsi:type": "xs:string" },
  },
  ```

`defaultValueXMLRaw` жёстко зашит как `xs:string`, и при импорте `<FillValue xsi:nil="true"/>` (см. `packages/core/metadata/commonObjects/metadataValue/fromXML.ts:24` — `if (!data) return undefined`, при этом `data` для `xsi:nil` парсится в объект `{ _xsi:nil: "true" }` без `_xsi:type`, поэтому код падает на строке 28 либо value уходит в `undefined`) значение становится «default», и при экспорте вместо исходного `xsi:nil` подставляется этот `xs:string`-дефолт. Нужно либо различать «нет значения» (`xsi:nil`) и «значение строкового типа по умолчанию» в самой модели, либо вычислять корректный дефолт по типу реквизита (`Properties/Type`), а не использовать литерал `xs:string`.
