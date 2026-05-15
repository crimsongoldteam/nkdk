# Round-Trip Picture Raw Ref

## Контекст

Short round-trip для `acc/Documents/ПлатежноеПоручение/Forms/ФормаДокумента/Ext/Form.xml` меняет ссылку картинки:

```xml
<Picture>
  <xr:Ref>0:05f4dd91-2d70-4f80-accc-4f1980cba51a</xr:Ref>
  <xr:LoadTransparent>false</xr:LoadTransparent>
</Picture>
```

После XML -> модель -> XML она становится:

```xml
<xr:Ref>CommonPicture.undefined</xr:Ref>
```

Причина: текущий импорт `Picture` разбирает `xr:Ref` через `split(".")` и знает только `StdPicture.*` и `CommonPicture.*`. Ссылка вида `0:guid` не содержит точки, поэтому `ref` теряется.

## Решение

Добавить в модель `Picture` отдельный тип для сырой XML-ссылки, например `RawPictureRef`.

Контракт модели:

```ts
{
  type: "RawPictureRef",
  ref: "0:05f4dd91-2d70-4f80-accc-4f1980cba51a",
  loadTransparent: false
}
```

Правила XML:

- `StdPicture.*` импортируется как `StandardPicture`;
- `CommonPicture.*` импортируется как `CommonPicture`;
- `xr:Abs` импортируется как `AbsolutePicture`;
- остальные значения `xr:Ref`, включая `0:guid`, импортируются как `RawPictureRef`;
- `RawPictureRef` экспортируется обратно в `xr:Ref` без добавления префикса.

## YAML

Короткая форма используется, когда дополнительных свойств нет или они равны умолчанию для этого типа:

```yaml
Картинка: "0:05f4dd91-2d70-4f80-accc-4f1980cba51a"
```

Полная форма используется, когда надо сохранить флаги картинки:

```yaml
Картинка:
  Ссылка: "0:05f4dd91-2d70-4f80-accc-4f1980cba51a"
  ПрозрачныйФон: Ложь
```

Для `RawPictureRef` значение `ПрозрачныйФон` по умолчанию считается `Ложь`, как для пользовательских и абсолютных картинок. Поэтому XML из примера может быть представлен короткой формой, но полная форма остается доступной.

## Границы

Не нужно пытаться разрешать `0:guid` в имя общей картинки. Это ссылка из XML reference, и для round-trip ее надо сохранить буквально. Существующее поведение для `StdPicture.*`, `CommonPicture.*` и `xr:Abs` не меняется.

## Проверка

Нужен тест `Picture` XML -> модель -> XML для `xr:Ref` вида `0:guid` и YAML-тест для короткой и полной формы.
