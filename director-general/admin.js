/* Executive director comments inside the existing platform home. */
(() => {
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const client=()=>window.alfalahSupabase||window.supabaseClient||null;
  function mount(){
    const anchor=document.getElementById('directorInbox');
    if(!anchor)return;
    const box=document.createElement('section');box.id='academyExecutiveInbox';box.className='card';
    box.style.cssText='margin:18px 0;border-right:7px solid #087e71;text-align:right;direction:rtl';
    box.innerHTML='<h2>متابعة ملاحظات المدير العام</h2><p>تظهر هنا ملاحظات الدكتور محمد العدوان بشأن المكتبات الست والتنفيذ. اكتب الرد تحت الملاحظة نفسها ليظهر في بوابته.</p><div class="actions"><button type="button" class="btn teal" id="academyExecutiveRefresh">تحديث الملاحظات</button><a class="btn outline" href="director-general/index.html">فتح بوابة المدير العام</a></div><div id="academyExecutiveStatus" role="status"></div><div id="academyExecutiveList"></div>';
    anchor.insertAdjacentElement('afterend',box);
    document.getElementById('academyExecutiveRefresh').onclick=load;
    load();
  }
  async function load(){
    const list=document.getElementById('academyExecutiveList'),status=document.getElementById('academyExecutiveStatus');
    if(!list)return;
    status.textContent='جارٍ تحميل الملاحظات...';
    try{
      const db=client();if(!db)throw Error('تعذر الاتصال بقاعدة البيانات');
      const r=await db.from('director_feedback').select('id,report_scope,comment,comment_text,admin_reply,admin_replied_at,created_at').eq('report_type','academy_execution').eq('manager_name','د. محمد العدوان').order('created_at',{ascending:false}).limit(100);
      if(r.error)throw r.error;
      const names={system:'النظام الموحد',collections:'تنمية المجموعات',cataloging:'الفهرسة',visits:'الزيارات',staff:'الكادر والتدريب',presentations:'التقارير والعروض',khb:'الخبيصي',jmi:'الجيمي',shj:'الشارقة',bny:'بني ياس',mzd:'محمد بن زايد',dan:'الدانة'};
      const rows=r.data||[];
      status.textContent=rows.length?`عدد الملاحظات: ${rows.length}، بانتظار رد: ${rows.filter(x=>!String(x.admin_reply||'').trim()).length}`:'لا توجد ملاحظات تنفيذية من المدير العام حتى الآن.';
      list.innerHTML=rows.map(x=>{
        const key=x.report_scope||'',label=key.startsWith('school:')?'مكتبة '+(names[key.slice(7)]||''):names[key]||key;
        return `<article style="margin:12px 0;padding:14px;border:1px solid #d5e3f0;border-radius:14px;background:#f8fbff"><b>${esc(label)}</b> <small>${esc(new Date(x.created_at).toLocaleString('ar-AE'))}</small><p style="white-space:pre-wrap">${esc(x.comment_text||x.comment||'')}</p>${x.admin_reply?`<div style="background:#e6f5ee;padding:10px;border-radius:10px;white-space:pre-wrap"><b>ردك:</b> ${esc(x.admin_reply)}</div>`:`<label for="executiveReply-${esc(x.id)}">الرد على هذه الملاحظة</label><textarea id="executiveReply-${esc(x.id)}" maxlength="4000" style="width:100%;min-height:80px"></textarea><button type="button" class="btn teal" data-executive-reply="${esc(x.id)}">حفظ الرد في المنصة</button>`}</article>`;
      }).join('');
      list.querySelectorAll('[data-executive-reply]').forEach(btn=>btn.onclick=()=>reply(btn));
    }catch(e){status.textContent='تعذر تحميل الملاحظات: '+e.message;list.replaceChildren()}
  }
  async function reply(button){
    const id=button.dataset.executiveReply,field=document.getElementById('executiveReply-'+id),value=field?.value.trim(),status=document.getElementById('academyExecutiveStatus');
    if(!value){status.textContent='اكتب الرد أولًا.';return}
    button.disabled=true;status.textContent='جارٍ حفظ الرد...';
    try{
      const r=await client().from('director_feedback').update({admin_reply:value,admin_replied_at:new Date().toISOString(),admin_reply_read:false}).eq('id',id).eq('report_type','academy_execution').eq('manager_name','د. محمد العدوان').is('admin_reply',null);
      if(r.error)throw r.error;
      status.textContent='حُفظ الرد في المنصة.';await load();
    }catch(e){status.textContent='تعذر حفظ الرد: '+e.message;button.disabled=false}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();

