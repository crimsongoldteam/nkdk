# userSettingPresentation short XML без reference

## Контекст

`round-trip-yaml-1c` остановился на каталоге `small` при загрузке XML без reference в 1С.

Файл:

`/tmp/round-trip-yaml-1c-xml/small/InformationRegisters/ЖурналДействийКассира/Forms/ФормаСписка/Ext/Form.xml`

Путь XML:

`ListSettings -> dcsset:dataParameters -> dcscor:item -> dcsset:userSettingPresentation`

Исходный XML хранит значение в короткой форме:

```xml
<dcsset:userSettingPresentation xsi:type="xs:string">по</dcsset:userSettingPresentation>
```

При `XML -> YAML -> XML` без reference значение экспортируется как обычный `I8nText`:

```xml
<dcsset:userSettingPresentation>
  <v8:item>
    <v8:lang>ru</v8:lang>
    <v8:content>по</v8:content>
  </v8:item>
</dcsset:userSettingPresentation>
```

`ibcmd` отвергает такой XML с XDTO ошибкой на `{http://v8.1c.ru/8.1/data/core}item`.

## Цель

Сделать XML без reference валидным для 1С: одноязычное `dcsset:userSettingPresentation` должно экспортироваться в короткой форме `xsi:type="xs:string"`.

## Решение

Изменить `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/userSettingPresentationXML.ts`.

Правило экспорта:

- если `data` отсутствует, узел не экспортируется;
- если есть `referenceData` с короткой формой и значение не изменилось, сохранить существующее поведение;
- если `data.items` содержит ровно один язык, экспортировать `{ "_xsi:type": "xs:string", "#text": <content> }`;
- если языков несколько, оставить обычный `I8nText` XML.

Это решение локально для `SettingsParameterValue.userSettingPresentation` и не меняет общий `I8nText`.

## Проверки

- Добавить тест в `userSettingPresentationXML.test.ts`: без `referenceData` одноязычное значение экспортируется как `xs:string`.
- Сохранить существующие тесты короткой формы с reference.
- Запустить:
  - `pnpm --dir packages/core exec vitest run metadata/commonObjects/dataCompositionSystem/parameterValue/userSettingPresentationXML.test.ts`
  - `round-trip-yaml-1c` на `/home/codexwsl/round-trip/small`
  - затем продолжить batch `round-trip-yaml-1c` от `small` к большим конфигурациям, если `small` пройдёт.
  - финально `pnpm test`.

## Не входит в задачу

- Не менять YAML-договор.
- Не добавлять reference в `round-trip-yaml-1c`.
- Не исправлять другие возможные ошибки 1С-загрузки, которые могут появиться после прохождения `small`.
