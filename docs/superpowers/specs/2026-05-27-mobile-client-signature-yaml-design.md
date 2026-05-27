# Mobile Client Signature YAML Design

## Цель

Сохранять корневую подпись мобильного клиента при полном `XML -> YAML -> XML` round-trip.

Текущее расхождение:

- `Ext/MobileClientSignature.bin` удаляется.

## Источники

- `model.xdtobackend_root.res`: у `ConfigurationProperties` есть внешнее свойство `MobileClientSignature` типа `ExternalProperty`, `lowerBound="0"`.
- `model.xdtobackend_root.res`: рядом есть внешнее свойство `MobileClientSign`, но текущая диагностическая пачка не содержит соответствующего файла.
- `ru-en-map`: `ПодписьМобильногоКлиента` -> `MobileClientSignature`.
- `/Users/nikita/git/round-trip-source/acc/Ext/MobileClientSignature.bin`: файл подписи размером 396996 байт.
- `/Users/nikita/git/clean_cf`: чистая конфигурация без `Ext/MobileClientSignature.bin`.
- Существующий тип `ExternalFile`, используемый для непрозрачного копирования одиночных внешних файлов.

## Принятые решения

`MobileClientSignature.bin` не разбирается в YAML-поля.
Файл хранится рядом с `Конфигурация.yaml`:

```text
ПодписьМобильногоКлиента.bin
```

Соответствие путей:

- `ПодписьМобильногоКлиента.bin` -> `Ext/MobileClientSignature.bin`.

Содержимое копируется байт-в-байт.
Нельзя добавлять завершающий перевод строки, перекодировать файл или нормализовать его как текст.

`MobileClientSign` в этой работе не добавляется в YAML-договор, потому что нет подтвержденного русского имени и нет текущего round-trip расхождения с таким файлом.
Если такой файл появится в фикстуре или реальной конфигурации, его нужно разобрать отдельным расхождением.

## Поведение по умолчанию

`ПодписьМобильногоКлиента.bin` является необязательным внешним файлом.
Если в XML-выгрузке нет `Ext/MobileClientSignature.bin`, YAML-файл не создается.
Если в YAML нет файла и нет reference-файла, экспорт не создает новый XML-файл.

Если YAML-файл отсутствует, но reference содержит `Ext/MobileClientSignature.bin`, экспорт сохраняет reference только в сценарии сохранения существующего XML без изменения этой части модели.
Если YAML-файл присутствует, XML строится из YAML-файла.

## Архитектура

Добавить в `MetadataConfigurationRules` внешнее свойство типа `ExternalFile` для корневой конфигурации.
Это такой же внешний файл объекта конфигурации, как `Package.bin` у XDTO-пакета, но `nkdkPath` лежит в корне YAML-проекта, а `xmlPath` лежит в `Ext/`.

Предпочтительный путь реализации:

- переиспользовать существующий `ExternalFile`;
- расширить его так, чтобы `syncExternalToXML` корректно писал корневой файл без обязательного `name`;
- не вводить отдельный разборщик для подписи мобильного клиента.

Ожидаемое правило:

```ts
mobileClientSignature: {
  type: "ExternalFile",
  nkdkPath: "ПодписьМобильногоКлиента.bin",
  xmlPath: "Ext/MobileClientSignature.bin",
  syncExternalOnly: true,
}
```

`syncExternalOnly` должен исключать свойство из обычного YAML-вывода значений.
Наличие файла является YAML-представлением свойства.

## Проверка

План проверки для будущей реализации:

1. XML -> YAML для `/Users/nikita/git/round-trip-source/acc`: появляется файл `ПодписьМобильногоКлиента.bin`.
2. `ПодписьМобильногоКлиента.bin` совпадает с `Ext/MobileClientSignature.bin` байт-в-байт.
3. YAML -> XML с reference восстанавливает `Ext/MobileClientSignature.bin`.
4. XML/YAML цикл для `/Users/nikita/git/clean_cf`: файл отсутствует, новый XML-файл не создается.
5. Полный `round-trip-yaml --diff-index 10` больше не показывает удаление `Ext/MobileClientSignature.bin`.
