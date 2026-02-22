grammar Nkdk

terminal NEWLINE: /[\r\n]+/;

terminal GROUP: /(\=|\+|\-)\1{1,4}/;

terminal VGROUP: /\+/;
terminal HGROUP: /\-/;
terminal ABSGROUP: /\=/;

terminal PICTURE: /\[[\t ]*[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*[\t ]*\]/;
terminal NAME: /%[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*/;

terminal TEXT: /([a-zA-Zа-яА-ЯёЁ0-9_]+[a-zA-Zа-яА-ЯёЁ0-9_ ]*)/;

terminal OTHERFIELD: /\?(ПолеФорматированногоДокумента|ПолеДиаграммыГанта|ПолеГеографическойСхемы|ПолеГрафическойСхемы|ПолеHTMLДокумента|ПолеPDFДокумента|ПолеПериода|ПолеПланировщика|ПолеИндикатора|ПолеПереключателя|ПолеТабличногоДокумента|ПолеТекстовогоДокумента|ПолеПолосыПрокрутки)/;

terminal INDENT: '\*Ё';
terminal DEDENT: '\*ё';
hidden terminal WS: /[\t ]+/;

entry Form:
    (childItems+=ChildItem)*;

fragment Named:
    name=NAME;

fragment Titled:
    (title=TEXT)?;

fragment Field:
    ((Named ':') | (Titled ':' Named));

ChildItem:
      Group 
    | Pages
    |
       (PictureField
        | InputField  
        | LabelField
        | OtherField  
        | LabelDecoration 
        | PictureDecoration 
        | CheckBoxField
        | CheckBoxFieldSwitch
        | CheckBoxFieldTumbler
        | Button  
        | CommandBar  
        | Table) (NEWLINE | EOF);

OneLineGroupField:
    PictureField
    | InputField 
    | LabelField
    | OtherField  
    | LabelDecoration 
    | PictureDecoration 
    | CheckBoxField 
    | CheckBoxFieldSwitch
    | CheckBoxFieldTumbler 
    | Button  
    | CommandBar;

InputField:
    Field;

LabelField:
    '~' Field;

PictureField:
    '!' Field;

LabelDecoration:
    Titled Named;

PictureDecoration:
    '!' picture=PICTURE Named | '!' Named;

CheckBoxField:
    ((titleLeft=TEXT)? '['']' Titled Named) | (Named '['']');

CheckBoxFieldSwitch:
    ((titleLeft=TEXT)? '[''|'']' Titled Named) | (Named '[''|'']');

CheckBoxFieldTumbler:
    ((titleLeft=TEXT)? '<''|''>' Titled Named) | (Named '<''|''>');

Button:
    '<' Titled Named '>';


// command bar

CommandGroup:
    HGROUP Titled Named;

Popup:
    VGROUP Titled Named;

CommandBarButton:
    Titled Named;

CommandBarChildItem:
    CommandGroup | Popup | CommandBarButton;

fragment CommandBarChildItemFragment:
    ('|' childItems+=CommandBarChildItem )*;

CommandBar:
    '<' (( autofill?='...' CommandBarChildItemFragment) |
    (childItems+=CommandBarButton CommandBarChildItemFragment ))?
    '>' Named;

// vertical group

Group:
    group=(GROUP | HGROUP | VGROUP | ABSGROUP) Titled Named 
    (((NEWLINE | EOF) (INDENT (childItems+=ChildItem)* DEDENT)?)
    | OneLineGroupFragment);

// one-line group

fragment OneLineGroupFragment:
    childItems+=OneLineGroupField (';' childItems+=OneLineGroupField )* (NEWLINE | EOF);

// table

Table:
    '|' ( childItems+=TableField ('|' childItems+=TableField )*)? '|' Named;

TableHorizontalGroup:
    HGROUP Titled Named;

TableVerticalGroup:
   VGROUP Titled Named;

TableInCellGroup:
    ABSGROUP Titled Named;

TablePictureField:
    '!' Titled Named;

TableCheckbox:
    '['']' Titled Named;

TableInputField:
    Titled Named;

TableLabelField:
    '~' Titled Named;

TableField:
    TableHorizontalGroup 
    | TableVerticalGroup 
    | TableInCellGroup 
    | TableInputField 
    | TableLabelField 
    | TableCheckbox 
    | TablePictureField;

// pages

Pages:
    '//' Titled Named (NEWLINE | EOF)
    (INDENT (childItems+=Page)* DEDENT)?; 

Page:
    '/' Titled Named (NEWLINE | EOF)
    (INDENT (childItems+=ChildItem)* DEDENT)?;

// other

OtherField:
    type=OTHERFIELD Named;