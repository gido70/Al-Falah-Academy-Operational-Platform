/* أكاديمية الفلاح — وحدة الردود والعروض التقديمية (feedback-hub.js)
 * 1) FH.presentations(el, {viewer})  : العرض الشامل أولًا ثم المكتبات الست بترتيب ثابت
 * 2) FH.ownerInbox(el)               : صندوق المنسق — كل تعليقات المدير والإدارة مع الرد عليها
 * 3) FH.myReplies(el, {people,title}): صندوق المستلم — تعليقاته وردود المنسق عليها
 * مسار الرد: ① أُرسل التعليق ← ② اطّلع المنسق ← ③ ردّ المنسق ← ④ قرأ صاحب التعليق الرد
 */
(function(){
  'use strict';
  var SCHOOL_ORDER=['الخبيصي','الجيمي','الشارقة','بني ياس','محمد بن زايد','الدانة'];
  var DIRECTOR='د. محمد العدوان';
  var EXEC=['د. أمل العفيفي','السيدة/ أسماء الحمادي','السيدة/ فاطمة الدرمكي'];
  var TYPE_LABEL={academy_execution:'متابعة التنفيذ',evaluation:'تقييم المكتبات',eval:'تقييم المكتبات',work:'الدوام والزيارات',all:'تقرير شامل',weekly:'أسبوعي',monthly:'شهري',special:'موضوع خاص',executive_report:'تقرير تنفيذي'};
  var SCOPE_LABEL={system:'نظام إدارة المكتبات',collections:'تنمية المجموعات',cataloging:'الفهرسة والجرد',visits:'الزيارات التنفيذية',staff:'الكادر والتدريب',presentations:'التقارير والعروض'};
  var STEPS=['أُرسل التعليق','اطّلع المنسق','ردّ المنسق','قُرئ الرد'];

  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function norm(n){return String(n||'').replace(/^\s*(السيدة|السيد|الدكتورة|الدكتور|الأستاذة|الأستاذ|د\.|أ\.)\s*\/?\s*/,'').replace(/\s+-\s+.*$/,'').replace(/\s+/g,' ').trim()}
  function who(r){return r.manager_name||r.director_name||'غير محدد'}
  function fmt(v){if(!v)return '—';try{return new Date(v).toLocaleString('ar-AE',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(e){return String(v)}}
  function text(r){return r.comment_text||r.comment||''}
  function topic(r){var t=TYPE_LABEL[r.report_type]||r.report_type||'تعليق';var s=SCOPE_LABEL[r.report_scope]||(r.report_type==='executive_report'?(r.metadata&&r.metadata.report_title)||'':r.report_scope)||'';return s&&s!=='all'?t+' — '+s:t}
  function step(r){return r.admin_reply_read&&hasReply(r)?4:hasReply(r)?3:r.is_read?2:1}
  function hasReply(r){return String(r.admin_reply||'').trim().length>0}

  function client(){
    var c=window.alfalahSupabase||window.supabaseClient||window.falahSupabase||window.sb;
    if(c&&typeof c.from==='function')return c;
    if(window.supabase&&window.supabase.createClient&&window.ALFALAH_SUPABASE_URL){
      window.alfalahSupabase=window.supabase.createClient(window.ALFALAH_SUPABASE_URL,window.ALFALAH_SUPABASE_KEY);return window.alfalahSupabase;
    }
    return null;
  }
  function waitClient(){return new Promise(function(res){var n=0;(function t(){var c=client();if(c||n++>30)return res(c);setTimeout(t,200)})()})}

  function css(){
    if(document.getElementById('fh-style'))return;
    var s=document.createElement('style');s.id='fh-style';
    s.textContent=[
      '.fh{--fn:var(--navy,#0c447c);--ft:var(--teal,#0f9d8a);--fg:var(--gold,#d69b00);--fb:var(--border,#c6d9ef);--fm:var(--muted,#5a7fa8);direction:rtl;text-align:right;margin:18px 0}',
      '.fh-card{background:#fff;border:1px solid var(--fb);border-radius:18px;padding:18px;box-shadow:0 6px 20px rgba(12,68,124,.07);margin-bottom:16px}',
      '.fh h2{margin:0 0 6px;color:var(--fn);font-size:22px}.fh h3{margin:0 0 6px;color:var(--fn);font-size:17px}',
      '.fh-sub{color:var(--fm);font-size:14px;line-height:1.8;margin:0 0 12px}',
      '.fh-path{display:flex;flex-wrap:wrap;gap:6px;align-items:center;background:#f3f8fe;border:1px dashed var(--fb);border-radius:14px;padding:10px 12px;margin:8px 0 14px;font-size:13px;font-weight:700;color:var(--fn)}',
      '.fh-path b{background:#fff;border:1px solid var(--fb);border-radius:999px;padding:3px 10px}.fh-path i{font-style:normal;color:var(--fm)}',
      '.fh-hero{display:block;background:linear-gradient(135deg,var(--fn),#185fa5 55%,var(--ft));color:#fff;border-radius:18px;padding:22px;margin-bottom:14px}',
      '.fh-hero h3{color:#fff;font-size:21px}.fh-hero p{opacity:.92;margin:4px 0 14px;line-height:1.8}',
      '.fh-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}',
      '.fh-pres{border:1px solid var(--fb);border-right:5px solid var(--ft);border-radius:14px;padding:14px;background:#fff;display:flex;flex-direction:column;gap:8px}',
      '.fh-pres.miss{border-right-color:#c9d6e6;background:#f7f9fc;color:var(--fm)}',
      '.fh-num{display:inline-flex;width:28px;height:28px;border-radius:50%;background:#e1f5ee;color:var(--ft);font-weight:900;align-items:center;justify-content:center;margin-left:6px}',
      '.fh-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto}',
      '.fh-btn{display:inline-flex;align-items:center;gap:6px;border:0;border-radius:12px;padding:9px 14px;font:inherit;font-weight:800;font-size:14px;cursor:pointer;text-decoration:none;background:var(--ft);color:#fff}',
      '.fh-btn.gold{background:var(--fg)}.fh-btn.out{background:#fff;color:var(--fn);border:1px solid var(--fb)}.fh-hero .fh-btn{background:#fff;color:var(--fn)}.fh-hero .fh-btn.gold{background:var(--fg);color:#fff}',
      '.fh-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}',
      '.fh-chip{border:1px solid var(--fb);background:#fff;border-radius:999px;padding:6px 12px;font:inherit;font-size:13px;font-weight:800;color:var(--fn);cursor:pointer}',
      '.fh-chip.on{background:var(--fn);color:#fff;border-color:var(--fn)}.fh-chip span{background:#e8f0fa;color:var(--fn);border-radius:999px;padding:0 7px;margin-right:4px}.fh-chip.on span{background:#fff}',
      '.fh-item{border:1px solid var(--fb);border-radius:14px;padding:14px;margin-bottom:10px;background:#fff}',
      '.fh-item.s1,.fh-item.s2{border-right:5px solid var(--fg)}.fh-item.s3{border-right:5px solid #185fa5}.fh-item.s4{border-right:5px solid var(--ft)}',
      '.fh-meta{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;font-size:12px}.fh-pill{background:#f0f5fb;border:1px solid var(--fb);border-radius:999px;padding:3px 10px;font-weight:800;color:var(--fn)}',
      '.fh-pill.new{background:#fdecea;border-color:#f5b7b1;color:#c0392b}',
      '.fh-msg{background:#f7f9fc;border-radius:10px;padding:10px;line-height:1.9;white-space:pre-wrap}',
      '.fh-reply{background:#e1f5ee;border-radius:10px;padding:10px;line-height:1.9;margin-top:8px;white-space:pre-wrap}',
      '.fh-steps{display:flex;gap:4px;margin:10px 0 4px;flex-wrap:wrap}.fh-steps span{flex:1;min-width:90px;text-align:center;font-size:12px;font-weight:800;padding:5px 4px;border-radius:8px;background:#eef2f7;color:#8aa0b8}',
      '.fh-steps span.done{background:#e1f5ee;color:var(--ft)}.fh-steps span.now{background:var(--fn);color:#fff}',
      '.fh textarea{width:100%;box-sizing:border-box;min-height:80px;border:1px solid var(--fb);border-radius:12px;padding:10px;font:inherit;margin-top:8px;resize:vertical}',
      '.fh-empty{padding:14px;border-radius:12px;background:#f3f8fe;color:var(--fm);text-align:center;font-weight:700}',
      '.fh-status{font-size:13px;color:var(--fm);margin-top:6px}',
      '.fh details{margin-top:10px}.fh summary{cursor:pointer;font-weight:800;color:var(--fm)}'
    ].join('\n');
    document.head.appendChild(s);
  }
  function pathHtml(){return '<div class="fh-path">'+STEPS.map(function(s,i){return '<b>'+(i+1)+'. '+s+'</b>'}).join('<i>←</i>')+'</div>'}
  function stepsHtml(r){var k=step(r);return '<div class="fh-steps">'+STEPS.map(function(s,i){return '<span class="'+(i+1<k?'done':i+1===k?'now':'')+'">'+(i+1<=k?'✓ ':'')+s+'</span>'}).join('')+'</div>'}


  /* ================= 0) عارض الملفات داخل المنصة (مثل صفحة المدير) ================= */
  var vBlob=null,vTok=0;
  function viewerCss(){
    if(document.getElementById('fh-vstyle'))return;
    var s=document.createElement('style');s.id='fh-vstyle';
    s.textContent='.fh-viewer[hidden]{display:none}.fh-viewer{position:fixed;inset:0;z-index:9999;background:#102c45db;display:flex;align-items:center;justify-content:center;padding:12px;direction:rtl}'+
      '.fh-vpanel{background:#fff;border-radius:16px;width:min(100%,1100px);max-height:96vh;display:flex;flex-direction:column;overflow:hidden}'+
      '.fh-vbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 16px;border-bottom:1px solid #c6d9ef}'+
      '.fh-vbar h2{font-size:17px;margin:0;flex:1;overflow-wrap:anywhere;color:#0c447c}'+
      '.fh-vbtn{border:1px solid #c6d9ef;background:#fff;color:#0c447c;border-radius:12px;padding:8px 14px;font:inherit;font-weight:800;cursor:pointer;text-decoration:none}'+
      '.fh-vbody{min-height:240px;height:78vh;overflow:auto;display:grid;place-items:center;background:#eef3f9;padding:8px}'+
      '.fh-vbody iframe,.fh-vbody img,.fh-vbody video{width:100%;height:100%;border:0;object-fit:contain}'+
      '.fh-vnote{max-width:620px;background:#fff;border:1px solid #c6d9ef;border-radius:12px;padding:16px;line-height:1.9;text-align:center}';
    document.head.appendChild(s);
  }
  function viewerEl(){
    var v=document.getElementById('fhViewer');if(v)return v;viewerCss();
    v=document.createElement('div');v.id='fhViewer';v.className='fh-viewer';v.hidden=true;v.setAttribute('role','dialog');v.setAttribute('aria-modal','true');
    v.innerHTML='<div class="fh-vpanel"><div class="fh-vbar"><button type="button" class="fh-vbtn" data-close>← رجوع</button><h2 class="fh-vtitle"></h2><a class="fh-vbtn fh-vdl" href="#" download hidden>تنزيل اختياري</a></div><div class="fh-vbody"></div></div>';
    document.body.appendChild(v);
    function close(){v.hidden=true;document.body.style.overflow='';v.querySelector('.fh-vbody').replaceChildren();if(vBlob){URL.revokeObjectURL(vBlob);vBlob=null}}
    v.querySelector('[data-close]').onclick=close;v.addEventListener('click',function(e){if(e.target===v)close()});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!v.hidden)close()});
    return v;
  }
  function openViewer(url,name){
    if(!url)return;var v=viewerEl(),tok=++vTok,body=v.querySelector('.fh-vbody'),dl=v.querySelector('.fh-vdl');
    name=name||decodeURIComponent(String(url).split('/').pop().split('?')[0]).replace(/^\d{10,}_/,'')||'ملف';
    v.querySelector('.fh-vtitle').textContent=name;v.hidden=false;document.body.style.overflow='hidden';dl.hidden=true;
    body.innerHTML='<div class="fh-vnote">جارٍ تجهيز المعاينة...</div>';
    if(vBlob){URL.revokeObjectURL(vBlob);vBlob=null}
    fetch(url,{mode:'cors'}).then(function(r){if(!r.ok)throw Error('fetch');return r.blob()}).then(function(blob){
      if(tok!==vTok)return;var type=String(blob.type||'').toLowerCase(),path=String(url).toLowerCase().split('?')[0],node;
      vBlob=URL.createObjectURL(blob);dl.href=vBlob;dl.download=name;dl.hidden=false;body.replaceChildren();
      if(type.indexOf('pdf')>=0||/\.pdf$/.test(path)){node=document.createElement('iframe');node.title=name;node.src=vBlob}
      else if(type.indexOf('image/')===0||/\.(png|jpe?g|gif|webp|svg)$/.test(path)){node=document.createElement('img');node.alt=name;node.src=vBlob}
      else if(type.indexOf('video/')===0){node=document.createElement('video');node.controls=true;node.src=vBlob}
      else{node=document.createElement('div');node.className='fh-vnote';node.textContent=/\.pptx?$/.test(path)?'ملفات PowerPoint لا يعرضها المتصفح داخل الصفحة. افتح نسخة PDF من العرض، أو نزّل الملف اختياريًا من الزر أعلاه.':'هذا النوع من الملفات لا يدعم المتصفح عرضه داخل الصفحة. يمكنك تنزيله اختياريًا من الزر أعلاه.'}
      body.append(node);
    }).catch(function(){if(tok!==vTok)return;body.innerHTML='<div class="fh-vnote">تعذرت المعاينة داخل المنصة لهذا الملف. لم يبدأ أي تنزيل تلقائي.</div>'});
  }
  /* يحوّل روابط ملفات التخزين التي تفتح في نافذة جديدة إلى العارض الداخلي */
  function interceptLinks(){
    document.addEventListener('click',function(e){
      var a=e.target.closest&&e.target.closest('a[href]');if(!a)return;
      var h=a.getAttribute('href')||'';if(!/\/storage\/v1\/object\//.test(h))return;
      if(a.hasAttribute('download')&&a.closest('.fh-viewer'))return;
      e.preventDefault();e.stopPropagation();
      if(typeof a.onclick==='function'){try{a.onclick.call(a,e)}catch(x){}}
      openViewer(h,(a.dataset&&a.dataset.fhName)||'');
    },true);
  }

  /* ================= 1) العروض التقديمية ================= */
  function presentations(el,opt){
    opt=opt||{};css();if(!el)return;
    el.classList.add('fh');
    el.innerHTML='<div class="fh-card"><h2>🎞️ العروض التقديمية</h2><p class="fh-sub">العرض الشامل للمكتبات الست أولًا، ثم عرض كل مكتبة على حدة.</p><div class="fh-body"><div class="fh-empty">جارٍ تحميل العروض...</div></div></div>';
    var body=el.querySelector('.fh-body');
    waitClient().then(function(c){
      if(!c){body.innerHTML='<div class="fh-empty">تعذر الاتصال بقاعدة البيانات.</div>';return}
      return c.from('management_presentations').select('id,title,school_name,description,presentation_url,pdf_url,ppt_url,created_at,viewed_by').eq('is_active',true).order('created_at',{ascending:false}).then(function(res){
        if(res.error)throw res.error;
        var rows=res.data||[],pick={};
        rows.forEach(function(r){var k=String(r.school_name||'').trim().toLowerCase()==='all'?'all':String(r.school_name||'').trim();if(!pick[k])pick[k]=r});
        function btns(r){var u=r.pdf_url||r.presentation_url;return '<div class="fh-btns">'+(u?'<a class="fh-btn" data-fh-view="'+esc(r.id)+'" data-fh-name="'+esc(r.title||'عرض تقديمي')+'" href="'+esc(u)+'">▶️ فتح العرض</a>':'')+(r.ppt_url?'<a class="fh-btn gold" data-fh-name="'+esc((r.title||'عرض')+'.pptx')+'" href="'+esc(r.ppt_url)+'">PowerPoint</a>':'')+'</div>'}
        var all=pick.all,h='';
        h+=all?'<div class="fh-hero"><h3>العرض الشامل: مقارنة تقييم المكتبات الست</h3><p>'+esc(all.description||all.title)+' · '+esc(fmt(all.created_at))+'</p>'+btns(all)+'</div>':'<div class="fh-empty" style="margin-bottom:14px">لم يُنشر العرض الشامل بعد.</div>';
        h+='<div class="fh-grid">'+SCHOOL_ORDER.map(function(n,i){var r=pick[n];return r?'<div class="fh-pres"><h3><span class="fh-num">'+(i+1)+'</span>فرع '+esc(n)+'</h3><div class="fh-sub" style="margin:0">'+esc(fmt(r.created_at))+'</div>'+btns(r)+'</div>':'<div class="fh-pres miss"><h3><span class="fh-num">'+(i+1)+'</span>فرع '+esc(n)+'</h3><div>لم يُنشر عرض هذه المكتبة بعد.</div></div>'}).join('')+'</div>';
        body.innerHTML=h;
        body.querySelectorAll('a.fh-btn').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();openViewer(a.getAttribute('href'),a.dataset.fhName)})});
        if(opt.viewer){body.querySelectorAll('[data-fh-view]').forEach(function(a){a.addEventListener('click',function(){var r=rows.filter(function(x){return x.id===a.dataset.fhView})[0];if(!r)return;var arr=Array.isArray(r.viewed_by)?r.viewed_by.slice():[];if(arr.indexOf(opt.viewer)<0){arr.push(opt.viewer);c.from('management_presentations').update({viewed_by:arr}).eq('id',r.id).then(function(){})}})})}
      });
    }).catch(function(e){body.innerHTML='<div class="fh-empty">تعذر تحميل العروض: '+esc(e.message||e)+'</div>'});
  }

  /* ================= 2) صندوق المنسق ================= */
  function ownerInbox(el){
    css();if(!el)return;el.classList.add('fh');
    var state={rows:[],legacy:[],status:'pending',person:'all'};
    el.innerHTML='<div class="fh-card"><h2>💬 صندوق الردود: تعليقات المدير والإدارة</h2><p class="fh-sub">كل تعليق يمر بأربع مراحل. حين تكتب ردك هنا يظهر فورًا في صفحة صاحب التعليق داخل قسم «ردود المنسق»، مع علامة «رد جديد» حتى يقرأه، ثم تتحول المرحلة هنا إلى «قُرئ الرد».</p>'+pathHtml()+'<div class="fh-chips fh-st"></div><div class="fh-chips fh-pp"></div><div class="fh-list"><div class="fh-empty">جارٍ التحميل...</div></div><div class="fh-legacy"></div><div class="fh-status"></div><div class="fh-btns" style="margin-top:8px"><button class="fh-btn out fh-refresh" type="button">🔄 تحديث</button></div></div>';
    var list=el.querySelector('.fh-list'),st=el.querySelector('.fh-st'),pp=el.querySelector('.fh-pp'),msg=el.querySelector('.fh-status');
    el.querySelector('.fh-refresh').onclick=load;
    function personKey(r){var n=norm(who(r));if(n===norm(DIRECTOR))return 'dir';for(var i=0;i<EXEC.length;i++)if(n===norm(EXEC[i]))return 'e'+i;return 'other'}
    var PEOPLE=[['all','الجميع'],['dir','المدير العام'],['e0',norm(EXEC[0])],['e1',norm(EXEC[1])],['e2',norm(EXEC[2])],['other','آخرون']];
    var STAT=[['pending','ينتظر ردّك',function(r){return !hasReply(r)}],['sent','بانتظار قراءة ردّك',function(r){return hasReply(r)&&!r.admin_reply_read}],['done','مكتمل',function(r){return hasReply(r)&&r.admin_reply_read}],['all','الكل',function(){return true}]];
    function render(){
      var byP=state.rows.filter(function(r){return state.person==='all'||personKey(r)===state.person});
      st.innerHTML=STAT.map(function(s){return '<button type="button" class="fh-chip'+(state.status===s[0]?' on':'')+'" data-s="'+s[0]+'">'+s[1]+'<span>'+byP.filter(s[2]).length+'</span></button>'}).join('');
      pp.innerHTML=PEOPLE.map(function(p){var n=state.rows.filter(function(r){return p[0]==='all'||personKey(r)===p[0]}).length;return n||p[0]==='all'?'<button type="button" class="fh-chip'+(state.person===p[0]?' on':'')+'" data-p="'+p[0]+'">'+esc(p[1])+'<span>'+n+'</span></button>':''}).join('');
      st.querySelectorAll('[data-s]').forEach(function(b){b.onclick=function(){state.status=b.dataset.s;render()}});
      pp.querySelectorAll('[data-p]').forEach(function(b){b.onclick=function(){state.person=b.dataset.p;render()}});
      var f=STAT.filter(function(s){return s[0]===state.status})[0][2],rows=byP.filter(f);
      list.innerHTML=rows.length?rows.map(item).join(''):'<div class="fh-empty">لا توجد تعليقات في هذه الحالة.</div>';
      list.querySelectorAll('[data-seen]').forEach(function(b){b.onclick=function(){upd(b.dataset.seen,{is_read:true})}});
      list.querySelectorAll('[data-send]').forEach(function(b){b.onclick=function(){var t=list.querySelector('[data-ta="'+b.dataset.send+'"]').value.trim();if(!t){msg.textContent='اكتب الرد أولًا.';return}upd(b.dataset.send,{admin_reply:t,admin_replied_at:new Date().toISOString(),admin_reply_read:false,is_read:true})}});
      list.querySelectorAll('[data-edit]').forEach(function(b){b.onclick=function(){var box=list.querySelector('[data-editbox="'+b.dataset.edit+'"]');box.style.display=box.style.display==='none'?'block':'none'}});
    }
    function item(r){
      var k=step(r),id=esc(r.id);
      var h='<div class="fh-item s'+k+'"><div class="fh-meta"><span class="fh-pill">👤 '+esc(who(r))+'</span>'+(r.manager_role?'<span class="fh-pill">'+esc(r.manager_role)+'</span>':'')+'<span class="fh-pill">🏷️ '+esc(topic(r))+'</span>'+(r.decision?'<span class="fh-pill">'+esc(r.decision)+'</span>':'')+(r.importance?'<span class="fh-pill">'+esc(r.importance)+'</span>':'')+'<span class="fh-pill">'+esc(fmt(r.created_at))+'</span>'+(k===1?'<span class="fh-pill new">جديد</span>':'')+'</div>';
      h+='<div class="fh-msg">'+esc(text(r)||'لا يوجد نص.')+'</div>'+stepsHtml(r);
      if(hasReply(r)){
        h+='<div class="fh-reply"><b>ردّك ('+esc(fmt(r.admin_replied_at))+'):</b><br>'+esc(r.admin_reply)+'</div><div class="fh-btns" style="margin-top:8px"><button class="fh-btn out" type="button" data-edit="'+id+'">✏️ تعديل الرد</button></div><div data-editbox="'+id+'" style="display:none"><textarea data-ta="'+id+'">'+esc(r.admin_reply)+'</textarea><div class="fh-btns" style="margin-top:6px"><button class="fh-btn" type="button" data-send="'+id+'">حفظ التعديل وإعادة الإرسال</button></div></div>';
      }else{
        h+='<textarea data-ta="'+id+'" placeholder="اكتب ردك على '+esc(norm(who(r)))+'..."></textarea><div class="fh-btns" style="margin-top:6px"><button class="fh-btn" type="button" data-send="'+id+'">📨 إرسال الرد</button>'+(r.is_read?'':'<button class="fh-btn out" type="button" data-seen="'+id+'">👁️ اطّلعت (بدون رد الآن)</button>')+'</div>';
      }
      return h+'</div>';
    }
    function upd(id,patch){
      var c=client();if(!c){msg.textContent='لا يوجد اتصال.';return}
      msg.textContent='جارٍ الحفظ...';
      c.from('director_feedback').update(patch).eq('id',id).then(function(r){if(r.error){msg.textContent='تعذر الحفظ: '+r.error.message;return}msg.textContent=patch.admin_reply?'تم إرسال الرد. سيظهر لصاحب التعليق في قسم «ردود المنسق» بصفحته.':'تم التحديث.';load()});
    }
    function load(){
      waitClient().then(function(c){
        if(!c){list.innerHTML='<div class="fh-empty">تعذر الاتصال بقاعدة البيانات.</div>';return}
        return Promise.all([
          c.from('director_feedback').select('*').order('created_at',{ascending:false}).limit(300),
          c.from('management_comments').select('*').order('created_at',{ascending:false}).limit(50)
        ]).then(function(res){
          if(res[0].error)throw res[0].error;
          state.rows=(res[0].data||[]).filter(function(r){return !r.is_deleted});
          state.legacy=res[1].error?[]:(res[1].data||[]);
          render();
          var lg=el.querySelector('.fh-legacy');
          lg.innerHTML=state.legacy.length?'<details><summary>تعليقات قديمة من جدول سابق لم تكن تظهر في المنصة ('+state.legacy.length+') — للاطلاع فقط</summary>'+state.legacy.map(function(r){return '<div class="fh-item"><div class="fh-meta"><span class="fh-pill">👤 '+esc(r.manager_name)+'</span><span class="fh-pill">'+esc(topic(r))+'</span><span class="fh-pill">'+esc(fmt(r.created_at))+'</span></div><div class="fh-msg">'+esc(r.comment_text||'')+'</div></div>'}).join('')+'</details>':'';
          var badge=document.getElementById('directorInboxBadge');if(badge){var n=state.rows.filter(function(r){return !hasReply(r)}).length;badge.textContent=n;badge.classList.toggle('zero',!n)}
        });
      }).catch(function(e){list.innerHTML='<div class="fh-empty">تعذر التحميل: '+esc(e.message||e)+'</div>'});
    }
    load();
  }

  /* ================= 3) صندوق المستلم: ردود المنسق ================= */
  function myReplies(el,opt){
    opt=opt||{};css();if(!el)return;el.classList.add('fh');
    var people=(opt.people||[]).map(norm),state={rows:[],person:(opt.me&&people.indexOf(norm(opt.me))>=0&&people.length>1)?norm(opt.me):'all'};
    el.innerHTML='<div class="fh-card"><h2>📬 '+esc(opt.title||'ردود المنسق على تعليقاتك')+'</h2><p class="fh-sub">كل تعليق تكتبه يصل إلى منسق المكتبات في صندوق الردود. حين يرد، يظهر الرد هنا بعلامة «رد جديد». اضغط «اطّلعت على الرد» ليعرف المنسق أنك قرأته.</p>'+pathHtml()+'<div class="fh-chips fh-pp"></div><div class="fh-list"><div class="fh-empty">جارٍ التحميل...</div></div><div class="fh-status"></div></div>';
    var list=el.querySelector('.fh-list'),pp=el.querySelector('.fh-pp'),msg=el.querySelector('.fh-status');
    function render(){
      if(people.length>1){pp.innerHTML=[['all','الجميع']].concat(people.map(function(p){return [p,p]})).map(function(p){var n=state.rows.filter(function(r){return p[0]==='all'||norm(who(r))===p[0]}).length;return '<button type="button" class="fh-chip'+(state.person===p[0]?' on':'')+'" data-p="'+esc(p[0])+'">'+esc(p[1])+'<span>'+n+'</span></button>'}).join('');pp.querySelectorAll('[data-p]').forEach(function(b){b.onclick=function(){state.person=b.dataset.p;render()}})}
      var rows=state.rows.filter(function(r){return state.person==='all'||norm(who(r))===state.person});
      rows.sort(function(a,b){var na=hasReply(a)&&!a.admin_reply_read?1:0,nb=hasReply(b)&&!b.admin_reply_read?1:0;return nb-na||new Date(b.admin_replied_at||b.created_at)-new Date(a.admin_replied_at||a.created_at)});
      list.innerHTML=rows.length?rows.map(function(r){
        var nw=hasReply(r)&&!r.admin_reply_read,k=step(r);
        return '<div class="fh-item s'+k+'"><div class="fh-meta">'+(people.length>1?'<span class="fh-pill">👤 '+esc(who(r))+'</span>':'')+'<span class="fh-pill">🏷️ '+esc(topic(r))+'</span><span class="fh-pill">'+esc(fmt(r.created_at))+'</span>'+(nw?'<span class="fh-pill new">🔴 رد جديد</span>':'')+'</div><div class="fh-msg"><b>تعليقك:</b><br>'+esc(text(r)||'—')+'</div>'+stepsHtml(r)+(hasReply(r)?'<div class="fh-reply"><b>رد المنسق ('+esc(fmt(r.admin_replied_at))+'):</b><br>'+esc(r.admin_reply)+'</div>'+(nw?'<div class="fh-btns" style="margin-top:8px"><button class="fh-btn" type="button" data-read="'+esc(r.id)+'">✅ اطّلعت على الرد</button></div>':''):'<div class="fh-empty" style="margin-top:8px">بانتظار رد المنسق.</div>')+'</div>'}).join(''):'<div class="fh-empty">لا توجد تعليقات مسجلة بعد.</div>';
      list.querySelectorAll('[data-read]').forEach(function(b){b.onclick=function(){var c=client();c.from('director_feedback').update({admin_reply_read:true}).eq('id',b.dataset.read).then(function(r){msg.textContent=r.error?'تعذر الحفظ: '+r.error.message:'تم. سيظهر للمنسق أنك قرأت الرد.';load()})}});
      if(opt.badge){var b=document.getElementById(opt.badge);if(b){var n=state.rows.filter(function(r){return hasReply(r)&&!r.admin_reply_read}).length;b.textContent=n;b.style.display=n?'':'none'}}
    }
    function load(){
      waitClient().then(function(c){
        if(!c){list.innerHTML='<div class="fh-empty">تعذر الاتصال بقاعدة البيانات.</div>';return}
        return c.from('director_feedback').select('*').order('created_at',{ascending:false}).limit(300).then(function(res){
          if(res.error)throw res.error;
          state.rows=(res.data||[]).filter(function(r){return !r.is_deleted&&people.indexOf(norm(who(r)))>=0});render();
        });
      }).catch(function(e){list.innerHTML='<div class="fh-empty">تعذر التحميل: '+esc(e.message||e)+'</div>'});
    }
    load();
  }


  /* ================= 4) الدليل السريع ================= */
  var GUIDES={
    director:{t:'دليل سريع لاستخدام الصفحة',s:[
      ['النظرة العامة','صورة مختصرة عن المكتبات الست والقرارات المطلوبة: النظام، والمجموعات، والفهرسة.'],
      ['المكتبات الست','افتح أي مكتبة لترى تقييمها وصورها وشهادات أمين مكتبتها ووثائقها.'],
      ['العروض التقديمية','العرض الشامل أولًا، ثم عرض كل مكتبة. تُفتح داخل المنصة، والتنزيل اختياري.'],
      ['التقارير والملفات','العروض الفنية والمالية وتقارير الأنظمة والمجموعات في تصنيفاتها.'],
      ['ملاحظاتك وردود المنسق','من «متابعة التنفيذ والردود» اختر الموضوع واكتب ملاحظتك. يظهر رد المنسق أعلى الصفحة بعلامة «رد جديد»؛ اضغط «اطّلعت على الرد».']]},
    management:{t:'دليل سريع لاستخدام المنصة',s:[
      ['الرئيسية','حالة الإجازات وردود المنسق على تعليقاتكم في أعلى الصفحة.'],
      ['التقارير التفصيلية','اختر نوع التقرير والمدرسة والفترة، ثم اقرأ النتائج.'],
      ['ملفات المدارس','صور المكتبات والنماذج والشهادات لكل مدرسة. تُفتح داخل المنصة، والتنزيل اختياري.'],
      ['العروض التقديمية','العرض الشامل أولًا، ثم عروض المكتبات الست.'],
      ['التعليق والرد','اكتبي تعليقك باسمك من «تعليق الإدارة». يظهر رد المنسق أعلى الرئيسية بعلامة «رد جديد»؛ اضغطي «اطّلعت على الرد».']]},
    executive:{t:'دليل سريع لصفحة التقارير التنفيذية',s:[
      ['العروض التقديمية','في الأعلى: العرض الشامل ثم عروض المكتبات الست، تُفتح داخل الصفحة.'],
      ['التقارير','اختر التصنيف (المدارس، الشركات، الأنظمة، المجموعات، المشاريع) ثم «فتح التقرير».'],
      ['التعليق','اكتب اسمك وصفتك وتعليقك أسفل التقرير ثم احفظ. الاسم ضروري ليصلك الرد.'],
      ['ردود المنسق','تظهر أعلى الصفحة بعلامة «رد جديد»؛ اضغط «اطّلعت على الرد».']]}
  };
  function quickGuide(el,role){
    css();var g=GUIDES[role];if(!el||!g)return;el.classList.add('fh');
    var key='fh_guide_closed_'+role,closed=false;try{closed=localStorage.getItem(key)==='1'}catch(e){}
    el.innerHTML='<details class="fh-card"'+(closed?'':' open')+'><summary style="font-size:19px;color:var(--fn)">🧭 '+esc(g.t)+' <span class="fh-sub" style="font-size:13px">(اضغط للفتح أو الإغلاق)</span></summary><ol style="margin:12px 0 0;padding-right:22px;line-height:2">'+g.s.map(function(x){return '<li><b>'+esc(x[0])+':</b> '+esc(x[1])+'</li>'}).join('')+'</ol></details>';
    el.querySelector('details').addEventListener('toggle',function(){try{localStorage.setItem(key,this.open?'0':'1')}catch(e){}});
  }


  function applyIdentity(u){
    if(!u)return;
    ['fbName','replyManagerName'].forEach(function(id){
      var el=document.getElementById(id);if(!el)return;
      if(el.tagName==='SELECT'){for(var i=0;i<el.options.length;i++){if(norm(el.options[i].text)===norm(u.name)||norm(el.options[i].value)===norm(u.name)){el.selectedIndex=i;el.dispatchEvent(new Event('change'));break}}}
      else{el.value=u.name;}
      el.setAttribute('disabled','disabled');el.title='الاسم مرتبط بكود الدخول';
    });
    try{localStorage.setItem('director_manager_name',u.name)}catch(e){}
  }
  window.FH={applyIdentity:applyIdentity,openViewer:openViewer,interceptLinks:interceptLinks,quickGuide:quickGuide,presentations:presentations,ownerInbox:ownerInbox,myReplies:myReplies,DIRECTOR:DIRECTOR,EXEC:EXEC,norm:norm,client:client};
})();
