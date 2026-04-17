# round-trip: перестановка StandardAttribute IsFolder↔Parent (АвансовыйОтчетПрисоединенныеФайлы.xml)

_Перенесено из GitHub-issue #68 (2026-04-16)._

## Контекст
Файл: `Catalogs/АвансовыйОтчетПрисоединенныеФайлы.xml`
Узел: Стандартные реквизиты `IsFolder` и `Parent` справочника `АвансовыйОтчетПрисоединенныеФайлы`
XPath: `MetaDataObject/Catalog/Properties/StandardAttributes/xr:StandardAttribute[@name='IsFolder' | 'Parent']`

В исходном XML три стандартных реквизита идут в порядке `IsFolder`, `Owner`, `Parent`. После round-trip `IsFolder` и `Parent` меняются местами: получается `Parent`, `Owner`, `IsFolder` (Owner остаётся посередине). Каждый реквизит везёт с собой свои значения (`FillFromFillingValue`, `Synonym` «Родитель» и т.д.), поэтому в diff видно перенос синонима и булева значения вместе с переименованием тега.

## XML до round-trip
```xml
<xr:StandardAttribute name="IsFolder">
    <xr:LinkByType/>
    <xr:FillChecking>DontCheck</xr:FillChecking>
    <xr:MultiLine>false</xr:MultiLine>
    <xr:FillFromFillingValue>false</xr:FillFromFillingValue>
    <xr:CreateOnInput>Auto</xr:CreateOnInput>
    <xr:TypeReductionMode>TransformValues</xr:TypeReductionMode>
    <xr:MaxValue xsi:nil="true"/>
    <xr:ToolTip/>
    <xr:ExtendedEdit>false</xr:ExtendedEdit>
    <xr:Format/>
    <xr:ChoiceForm/>
    <xr:QuickChoice>Auto</xr:QuickChoice>
    <xr:ChoiceHistoryOnInput>Auto</xr:ChoiceHistoryOnInput>
    <xr:EditFormat/>
    <xr:PasswordMode>false</xr:PasswordMode>
    <xr:DataHistory>Use</xr:DataHistory>
    <xr:MarkNegatives>false</xr:MarkNegatives>
    <xr:MinValue xsi:nil="true"/>
    <xr:Synonym/>
    <xr:Comment/>
    <xr:FullTextSearch>Use</xr:FullTextSearch>
    <xr:ChoiceParameterLinks/>
    <xr:FillValue xsi:nil="true"/>
    <xr:Mask/>
    <xr:ChoiceParameters/>
</xr:StandardAttribute>
<xr:StandardAttribute name="Owner">
    <!-- ... -->
</xr:StandardAttribute>
<xr:StandardAttribute name="Parent">
    <xr:LinkByType/>
    <xr:FillChecking>DontCheck</xr:FillChecking>
    <xr:MultiLine>false</xr:MultiLine>
    <xr:FillFromFillingValue>true</xr:FillFromFillingValue>
    <xr:CreateOnInput>Auto</xr:CreateOnInput>
    <xr:TypeReductionMode>TransformValues</xr:TypeReductionMode>
    <xr:MaxValue xsi:nil="true"/>
    <xr:ToolTip/>
    <xr:ExtendedEdit>false</xr:ExtendedEdit>
    <xr:Format/>
    <xr:ChoiceForm/>
    <xr:QuickChoice>Auto</xr:QuickChoice>
    <xr:ChoiceHistoryOnInput>Auto</xr:ChoiceHistoryOnInput>
    <xr:EditFormat/>
    <xr:PasswordMode>false</xr:PasswordMode>
    <xr:DataHistory>Use</xr:DataHistory>
    <xr:MarkNegatives>false</xr:MarkNegatives>
    <xr:MinValue xsi:nil="true"/>
    <xr:Synonym>
        <v8:item>
            <v8:lang>ru</v8:lang>
            <v8:content>Родитель</v8:content>
        </v8:item>
    </xr:Synonym>
    <xr:Comment/>
    <xr:FullTextSearch>Use</xr:FullTextSearch>
    <xr:ChoiceParameterLinks/>
    <xr:FillValue xsi:nil="true"/>
    <xr:Mask/>
    <xr:ChoiceParameters/>
</xr:StandardAttribute>
```

## XML после round-trip
```xml
<xr:StandardAttribute name="Parent">
    <!-- содержимое реквизита Parent (с FillFromFillingValue=true и Синонимом «Родитель») -->
</xr:StandardAttribute>
<xr:StandardAttribute name="Owner">
    <!-- ... -->
</xr:StandardAttribute>
<xr:StandardAttribute name="IsFolder">
    <!-- содержимое реквизита IsFolder (с FillFromFillingValue=false и пустым Synonym) -->
</xr:StandardAttribute>
```

## Описание отклонения
Порядок стандартных реквизитов внутри `StandardAttributes` изменился: `IsFolder` и `Parent` поменялись местами. `Owner` остался на своём месте (между ними), что подтверждает, что это именно перестановка двух конкретных узлов, а не общая сортировка. Все вторичные изменения в diff (`FillFromFillingValue`, наполнение `Synonym`) — следствие того, что соответствующие свойства «уехали» вместе со своим реквизитом.

## Предполагаемая причина
Скорее всего проблема в правиле коллекции `StandardAttributeDescriptions` или в её регистрации через `registerCollectionRule`:
- `packages/core/metadata/commonObjects/standardAttributeDescription/registerCollectionRule.ts`
- `packages/core/metadata/commonObjects/standardAttributeDescription/rules.ts`
- список имён `MetadataCatalogStandardAttributeNames` в `packages/core/metadata/appliedObjects/metadataCatalog/types.ts`

Похоже на алфавитную (или по другому критерию) сортировку при экспорте в XML, при этом исходный порядок не сохраняется. Нужно проверить, восстанавливается ли порядок из исходного файла или формируется заново по словарю стандартных имён.
