const collator=new Intl.Collator('ru');
const priority=key=>key==='Заголовок'||key==='Синоним'?0:key==='Вид'?1:key==='Тип'?2:3;

export const compareYamlKeys=(left,right)=>priority(left)-priority(right)||collator.compare(left,right);
