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
  var SCHOOL_NAME={khb:'مكتبة الخبيصي',jmi:'مكتبة الجيمي',shj:'مكتبة الشارقة',bny:'مكتبة بني ياس',mzd:'مكتبة محمد بن زايد',dan:'مكتبة الدانة'};
  function scopeName(v){v=String(v||'');var m=v.match(/^school:(\w+)$/);return m?(SCHOOL_NAME[m[1]]||v):''}
  function topic(r){var t=TYPE_LABEL[r.report_type]||r.report_type||'تعليق';var s=SCOPE_LABEL[r.report_scope]||scopeName(r.report_scope)||(r.report_type==='executive_report'?(r.metadata&&r.metadata.report_title)||'':r.report_scope)||'';return s&&s!=='all'?t+' — '+s:t}
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

  /* ================= محادثات الردود (2 و 3) =================
   * كل تعليق = محادثة: تعليق ← رد المنسق ← رد صاحب التعليق ← ... حتى يُنهيها أحد الطرفين.
   * الرسائل في falah_feedback_messages، وحالة المحادثة في director_feedback:
   *   is_read=false        → رسالة جديدة من صاحب التعليق لم يطّلع عليها المنسق
   *   admin_reply_read=false → رد جديد من المنسق لم يطّلع عليه صاحب التعليق
   *   thread_status        → open / closed
   */
  var OWNER_NAME='منسق المكتبات';
  function threadMsgs(r,byId){
    var m=[{side:'member',name:who(r),body:text(r)||'—',at:r.created_at}];
    return m.concat((byId[r.id]||[]).map(function(x){return {side:x.author_side,name:x.author_name||(x.author_side==='owner'?OWNER_NAME:who(r)),body:x.body,at:x.created_at}}));
  }
  function lastSide(r,byId){var m=threadMsgs(r,byId);return m[m.length-1].side}
  function closed(r){return r.thread_status==='closed'}
  function bubbles(r,byId,me){
    return '<div class="fh-thread">'+threadMsgs(r,byId).map(function(x){var mine=x.side===me;return '<div class="fh-bub '+(x.side==='owner'?'own':'mem')+(mine?' mine':'')+'"><div class="fh-bh"><b>'+esc(mine?'أنت':x.name)+'</b> · '+esc(fmt(x.at))+'</div>'+esc(x.body)+'</div>'}).join('')+'</div>';
  }
  function statusPill(r,byId,me){
    if(closed(r))return '<span class="fh-pill">🔒 مغلقة'+(r.closed_by?' — أنهاها '+esc(r.closed_by===OWNER_NAME&&me==='owner'?'أنت':r.closed_by):'')+'</span>';
    var turn=lastSide(r,byId)==='member'?'owner':'member';
    return turn===me?'<span class="fh-pill new">✍️ الدور عليك</span>':'<span class="fh-pill">⏳ بانتظار '+(me==='owner'?'ردّه':'رد المنسق')+'</span>';
  }
  function threadCss(){
    if(document.getElementById('fh-tstyle'))return;var s=document.createElement('style');s.id='fh-tstyle';
    s.textContent='.fh-thread{display:flex;flex-direction:column;gap:8px;margin:8px 0}.fh-bub{max-width:88%;padding:10px 12px;border-radius:14px;line-height:1.9;white-space:pre-wrap;border:1px solid #c6d9ef}'+
    '.fh-bub.mem{align-self:flex-start;background:#f7f9fc}.fh-bub.own{align-self:flex-end;background:#e1f5ee;border-color:#b8e6d8}.fh-bh{font-size:12px;color:#5a7fa8;margin-bottom:2px}'+
    '.fh-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}';
    document.head.appendChild(s);
  }
  function loadThreads(c){
    return c.from('director_feedback').select('*').order('created_at',{ascending:false}).limit(300).then(function(res){
      if(res.error)throw res.error;
      var rows=(res.data||[]).filter(function(r){return !r.is_deleted});
      var ids=rows.map(function(r){return r.id});
      if(!ids.length)return {rows:rows,byId:{}};
      return c.from('falah_feedback_messages').select('*').in('feedback_id',ids).order('created_at',{ascending:true}).limit(3000).then(function(m){
        var byId={};(m.error?[]:(m.data||[])).forEach(function(x){(byId[x.feedback_id]=byId[x.feedback_id]||[]).push(x)});
        return {rows:rows,byId:byId};
      });
    });
  }
  function act(side,r,kind,body,name,done){
    var c=client();if(!c)return done('لا يوجد اتصال.');
    var now=new Date().toISOString(),p=Promise.resolve({}),patch;
    if(kind==='send'){
      p=c.from('falah_feedback_messages').insert({feedback_id:r.id,author_side:side,author_name:name,body:body});
      patch=side==='owner'?{admin_reply:body,admin_replied_at:now,admin_reply_read:false,is_read:true,thread_status:'open'}:{is_read:false,admin_reply_read:true,thread_status:'open'};
    }else if(kind==='seen'){patch=side==='owner'?{is_read:true}:{admin_reply_read:true}}
    else if(kind==='close'){patch={thread_status:'closed',closed_by:name,closed_at:now};if(side==='owner')patch.is_read=true;else patch.admin_reply_read=true}
    p.then(function(x){if(x&&x.error)throw x.error;return c.from('director_feedback').update(patch).eq('id',r.id)}).then(function(x){if(x&&x.error)throw x.error;done(null)}).catch(function(e){done(e.message||String(e))});
  }
  function threadPath(){return '<div class="fh-path"><b>تعليق</b><i>←</i><b>ردّ المنسق</b><i>←</i><b>ردّ صاحب التعليق</b><i>←</i><b>…</b><i>←</i><b>🔒 إنهاء المحادثة</b></div>'}

  /* ---------- صندوق المنسق ---------- */
  function ownerInbox(el){
    css();threadCss();if(!el)return;el.classList.add('fh');
    var st={rows:[],byId:{},legacy:[],status:'mine',person:'all'};
    el.innerHTML='<div class="fh-card"><h2>💬 صندوق الردود: محادثاتك مع المدير العام والمتابعة الإدارية</h2><p class="fh-sub">كل تعليق محادثة مستقلة. ردّك يظهر فورًا في صفحة صاحب التعليق داخل «ردود المنسق» بعلامة «رد جديد»، ويستطيع أن يرد عليك، فيعود إليك هنا في «الدور عليك». تستمر المحادثة حتى يضغط أحدكما «إنهاء المحادثة».</p>'+threadPath()+'<div class="fh-chips fh-st"></div><div class="fh-chips fh-pp"></div><div class="fh-list"><div class="fh-empty">جارٍ التحميل...</div></div><div class="fh-legacy"></div><div class="fh-status"></div><div class="fh-btns" style="margin-top:8px"><button class="fh-btn out fh-refresh" type="button">🔄 تحديث</button></div></div>';
    var list=el.querySelector('.fh-list'),chS=el.querySelector('.fh-st'),chP=el.querySelector('.fh-pp'),msg=el.querySelector('.fh-status');
    el.querySelector('.fh-refresh').onclick=load;
    function pk(r){var n=norm(who(r));if(n===norm(DIRECTOR))return 'dir';for(var i=0;i<EXEC.length;i++)if(n===norm(EXEC[i]))return 'e'+i;return 'other'}
    var PEOPLE=[['all','الجميع'],['dir','المدير العام'],['e0',norm(EXEC[0])],['e1',norm(EXEC[1])],['e2',norm(EXEC[2])],['other','آخرون']];
    var STAT=[['mine','الدور عليك',function(r){return !closed(r)&&lastSide(r,st.byId)==='member'}],['theirs','بانتظار ردّهم',function(r){return !closed(r)&&lastSide(r,st.byId)==='owner'}],['closed','مغلقة',closed],['all','الكل',function(){return true}]];
    function render(){
      var byP=st.rows.filter(function(r){return st.person==='all'||pk(r)===st.person});
      chS.innerHTML=STAT.map(function(s){return '<button type="button" class="fh-chip'+(st.status===s[0]?' on':'')+'" data-s="'+s[0]+'">'+s[1]+'<span>'+byP.filter(s[2]).length+'</span></button>'}).join('');
      chP.innerHTML=PEOPLE.map(function(p){var n=st.rows.filter(function(r){return p[0]==='all'||pk(r)===p[0]}).length;return n||p[0]==='all'?'<button type="button" class="fh-chip'+(st.person===p[0]?' on':'')+'" data-p="'+p[0]+'">'+esc(p[1])+'<span>'+n+'</span></button>':''}).join('');
      chS.querySelectorAll('[data-s]').forEach(function(b){b.onclick=function(){st.status=b.dataset.s;render()}});
      chP.querySelectorAll('[data-p]').forEach(function(b){b.onclick=function(){st.person=b.dataset.p;render()}});
      var f=STAT.filter(function(s){return s[0]===st.status})[0][2],rows=byP.filter(f);
      list.innerHTML=rows.length?rows.map(function(r){
        var id=esc(r.id),isNew=!r.is_read&&lastSide(r,st.byId)==='member'&&!closed(r);
        return '<div class="fh-item'+(isNew?' s1':closed(r)?' s4':' s3')+'"><div class="fh-meta"><span class="fh-pill">👤 '+esc(who(r))+'</span>'+(r.manager_role?'<span class="fh-pill">'+esc(r.manager_role)+'</span>':'')+'<span class="fh-pill">🏷️ '+esc(topic(r))+'</span>'+statusPill(r,st.byId,'owner')+(isNew?'<span class="fh-pill new">جديد</span>':'')+'</div>'+bubbles(r,st.byId,'owner')+
          '<textarea data-ta="'+id+'" placeholder="'+(closed(r)?'المحادثة مغلقة — الكتابة تعيد فتحها':'اكتب ردك على '+esc(norm(who(r))))+'..."></textarea><div class="fh-acts"><button class="fh-btn" type="button" data-send="'+id+'">📨 إرسال الرد</button>'+(isNew?'<button class="fh-btn out" type="button" data-seen="'+id+'">👁️ اطّلعت</button>':'')+(closed(r)?'':'<button class="fh-btn out" type="button" data-close="'+id+'">🔒 إنهاء المحادثة</button>')+'</div></div>'}).join(''):'<div class="fh-empty">لا توجد محادثات في هذه الحالة.</div>';
      function rowOf(id){return st.rows.filter(function(x){return x.id===id})[0]}
      function after(ok){return function(err){msg.textContent=err?'تعذر الحفظ: '+err:ok;load()}}
      list.querySelectorAll('[data-send]').forEach(function(b){b.onclick=function(){var t=list.querySelector('[data-ta="'+b.dataset.send+'"]').value.trim();if(!t){msg.textContent='اكتب الرد أولًا.';return}b.disabled=true;act('owner',rowOf(b.dataset.send),'send',t,OWNER_NAME,after('تم إرسال الرد، وسيظهر لصاحب التعليق في «ردود المنسق».'))}});
      list.querySelectorAll('[data-seen]').forEach(function(b){b.onclick=function(){act('owner',rowOf(b.dataset.seen),'seen','',OWNER_NAME,after('تم.'))}});
      list.querySelectorAll('[data-close]').forEach(function(b){b.onclick=function(){if(!confirm('إنهاء هذه المحادثة؟ يمكن إعادة فتحها بأي رد جديد.'))return;act('owner',rowOf(b.dataset.close),'close','',OWNER_NAME,after('أُنهيت المحادثة.'))}});
      var badge=document.getElementById('directorInboxBadge');if(badge){var n=st.rows.filter(STAT[0][2]).length;badge.textContent=n;badge.classList.toggle('zero',!n)}
    }
    function load(){
      waitClient().then(function(c){
        if(!c){list.innerHTML='<div class="fh-empty">تعذر الاتصال بقاعدة البيانات.</div>';return}
        return Promise.all([loadThreads(c),c.from('management_comments').select('*').order('created_at',{ascending:false}).limit(50)]).then(function(res){
          st.rows=res[0].rows;st.byId=res[0].byId;st.legacy=res[1].error?[]:(res[1].data||[]);render();
          el.querySelector('.fh-legacy').innerHTML=st.legacy.length?'<details><summary>تعليقات قديمة من جدول سابق لم تكن تظهر في المنصة ('+st.legacy.length+') — للاطلاع فقط</summary>'+st.legacy.map(function(r){return '<div class="fh-item"><div class="fh-meta"><span class="fh-pill">👤 '+esc(r.manager_name)+'</span><span class="fh-pill">'+esc(topic(r))+'</span><span class="fh-pill">'+esc(fmt(r.created_at))+'</span></div><div class="fh-msg">'+esc(r.comment_text||'')+'</div></div>'}).join('')+'</details>':'';
        });
      }).catch(function(e){list.innerHTML='<div class="fh-empty">تعذر التحميل: '+esc(e.message||e)+'</div>'});
    }
    load();
  }

  /* ---------- صندوق المستلم (المدير / الإدارة) ---------- */
  function myReplies(el,opt){
    opt=opt||{};css();threadCss();if(!el)return;el.classList.add('fh');
    var people=(opt.people||[]).map(norm),st={rows:[],byId:{},person:(opt.me&&people.indexOf(norm(opt.me))>=0&&people.length>1)?norm(opt.me):'all'};
    el.innerHTML='<div class="fh-card"><h2>📬 '+esc(opt.title||'ردود المنسق على تعليقاتك')+'</h2><p class="fh-sub">كل تعليق تكتبه يصل إلى المنسق. ردّه يظهر هنا بعلامة «رد جديد»، ويمكنك الرد عليه مباشرة تحت المحادثة، أو الضغط على «إنهاء المحادثة» إذا اكتمل الموضوع.</p>'+threadPath()+'<div class="fh-chips fh-pp"></div><div class="fh-list"><div class="fh-empty">جارٍ التحميل...</div></div><div class="fh-status"></div></div>';
    var list=el.querySelector('.fh-list'),chP=el.querySelector('.fh-pp'),msg=el.querySelector('.fh-status');
    function isNew(r){return !closed(r)&&lastSide(r,st.byId)==='owner'&&!r.admin_reply_read}
    function render(){
      if(people.length>1){chP.innerHTML=[['all','الجميع']].concat(people.map(function(p){return [p,p]})).map(function(p){var n=st.rows.filter(function(r){return p[0]==='all'||norm(who(r))===p[0]}).length;return '<button type="button" class="fh-chip'+(st.person===p[0]?' on':'')+'" data-p="'+esc(p[0])+'">'+esc(p[1])+'<span>'+n+'</span></button>'}).join('');chP.querySelectorAll('[data-p]').forEach(function(b){b.onclick=function(){st.person=b.dataset.p;render()}})}
      var rows=st.rows.filter(function(r){return st.person==='all'||norm(who(r))===st.person});
      rows.sort(function(a,b){return (isNew(b)?1:0)-(isNew(a)?1:0)||(closed(a)?1:0)-(closed(b)?1:0)});
      list.innerHTML=rows.length?rows.map(function(r){
        var id=esc(r.id),nw=isNew(r);
        return '<div class="fh-item'+(nw?' s3':closed(r)?' s4':' s1')+'"><div class="fh-meta">'+(people.length>1?'<span class="fh-pill">👤 '+esc(who(r))+'</span>':'')+'<span class="fh-pill">🏷️ '+esc(topic(r))+'</span>'+statusPill(r,st.byId,'member')+(nw?'<span class="fh-pill new">🔴 رد جديد</span>':'')+'</div>'+bubbles(r,st.byId,'member')+
          '<textarea data-ta="'+id+'" placeholder="'+(closed(r)?'المحادثة مغلقة — الكتابة تعيد فتحها':'اكتب ردك على المنسق')+'..."></textarea><div class="fh-acts"><button class="fh-btn" type="button" data-send="'+id+'">📨 إرسال</button>'+(nw?'<button class="fh-btn out" type="button" data-seen="'+id+'">✅ اطّلعت على الرد</button>':'')+(closed(r)?'':'<button class="fh-btn out" type="button" data-close="'+id+'">🔒 إنهاء المحادثة</button>')+'</div></div>'}).join(''):'<div class="fh-empty">لا توجد تعليقات مسجلة بعد.</div>';
      function rowOf(id){return st.rows.filter(function(x){return x.id===id})[0]}
      function nameFor(r){return (window.FH_USER&&window.FH_USER.name)||who(r)}
      function after(ok){return function(err){msg.textContent=err?'تعذر الحفظ: '+err:ok;load()}}
      list.querySelectorAll('[data-send]').forEach(function(b){b.onclick=function(){var r=rowOf(b.dataset.send),t=list.querySelector('[data-ta="'+b.dataset.send+'"]').value.trim();if(!t){msg.textContent='اكتب الرد أولًا.';return}b.disabled=true;act('member',r,'send',t,nameFor(r),after('تم إرسال ردك إلى المنسق.'))}});
      list.querySelectorAll('[data-seen]').forEach(function(b){var r=rowOf(b.dataset.seen);b.onclick=function(){act('member',r,'seen','',nameFor(r),after('تم. سيظهر للمنسق أنك قرأت الرد.'))}});
      list.querySelectorAll('[data-close]').forEach(function(b){var r=rowOf(b.dataset.close);b.onclick=function(){if(!confirm('إنهاء هذه المحادثة؟'))return;act('member',r,'close','',nameFor(r),after('أُنهيت المحادثة.'))}});
      if(opt.badge){var bd=document.getElementById(opt.badge);if(bd){var n=st.rows.filter(isNew).length;bd.textContent=n;bd.style.display=n?'':'none'}}
    }
    function load(){
      waitClient().then(function(c){
        if(!c){list.innerHTML='<div class="fh-empty">تعذر الاتصال بقاعدة البيانات.</div>';return}
        return loadThreads(c).then(function(d){st.rows=d.rows.filter(function(r){return people.indexOf(norm(who(r)))>=0});st.byId=d.byId;render()});
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

  /* ================= 5) لوحة روابط وأكواد الدخول (للمالك فقط) ================= */
  var PAGE_OF={director:'director-general/',executive:'management/',owner:'director-general/'};
  function siteBase(){var p=location.pathname;var i=p.search(/\/(director-general|management|executive-management)\//);return location.origin+(i>=0?p.slice(0,i+1):p.replace(/[^/]*$/,''))}
  function linkFor(r){return siteBase()+PAGE_OF[r.role]+'?u='+encodeURIComponent(r.person_key)}
  function msgFor(r){return 'السلام عليكم '+r.name+'،\n\nرابط منصة مكتبات أكاديمية الفلاح الخاص بكم:\n'+linkFor(r)+'\n\nكود الدخول (شخصي، يُطلب مرة واحدة على الجهاز):\n'+r.code+'\n\nلتثبيتها على الهاتف كتطبيق:\n• آيفون: افتح الرابط في Safari ← زر المشاركة ← «إضافة إلى الشاشة الرئيسية».\n• أندرويد: افتح الرابط في Chrome ← اضغط «تثبيت التطبيق» أو القائمة ⋮ ← «إضافة إلى الشاشة الرئيسية».\n\nمع التحية'}
  function copy(t,btn){function ok(){var o=btn.textContent;btn.textContent='✓ تم النسخ';setTimeout(function(){btn.textContent=o},1600)}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(ok,function(){prompt('انسخ:',t)})}else{prompt('انسخ:',t)}}
  function accessPanel(el){
    css();if(!el)return;el.classList.add('fh');
    el.innerHTML='<details class="fh-card fh-acc"><summary style="cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:10px"><h2 style="margin:0">🔑 روابط وأكواد الدخول</h2><span class="fh-acc-sum fh-pill">اضغط للفتح ▾</span></summary><p class="fh-sub" style="margin-top:10px">لكل شخص رابطه وكوده. اضغط «نسخ الرسالة» وأرسلها له برسالة خاصة؛ تحتوي الرابط والكود وطريقة التثبيت على الهاتف. هذه اللوحة تظهر لك وحدك بعد تسجيل دخولك بالبريد.</p><div class="fh-body"><div class="fh-empty">جارٍ التحقق...</div></div><div class="fh-status"></div></details>';
    var body=el.querySelector('.fh-body'),msg=el.querySelector('.fh-status'),c,det=el.querySelector('details'),sum=el.querySelector('.fh-acc-sum');
    det.addEventListener('toggle',function(){sum.textContent=det.open?'اضغط للطي ▴':sum.dataset.closed||'اضغط للفتح ▾'});
    function locked(){
      body.innerHTML='<div class="fh-item"><b>هذه اللوحة لحساب منسق المكتبات فقط.</b><div class="fh-btns" style="margin-top:8px"><button class="fh-btn fh-og" type="button">تسجيل الدخول بالبريد</button></div></div>';
      body.querySelector('.fh-og').onclick=function(){c.auth.signOut().then(function(){location.reload()})};
    }
    function list(){
      c.rpc('falah_owner_list').then(function(r){
        if(r.error){if(/owner_only/.test(r.error.message))return locked();body.innerHTML='<div class="fh-empty">تعذر التحميل: '+esc(r.error.message)+'</div>';return}
        var rows=(r.data||[]).filter(function(x){return x.role!=='owner'}),own=(r.data||[]).filter(function(x){return x.role==='owner'})[0];
        var RL={director:'المدير العام',executive:'المتابعة الإدارية'};
        body.innerHTML=rows.map(function(x){var k=esc(x.person_key);return '<div class="fh-item'+(x.active?'':' s1')+'"><div class="fh-meta"><span class="fh-pill">👤 '+esc(x.name)+'</span><span class="fh-pill">'+esc(RL[x.role]||x.role)+'</span>'+(x.active?(x.devices?'<span class="fh-pill">✅ دخل من '+x.devices+' جهاز</span>':'<span class="fh-pill new">لم يدخل بعد</span>'):'<span class="fh-pill new">⛔ موقوف</span>')+(x.last_used_at?'<span class="fh-pill">آخر تفعيل: '+esc(fmt(x.last_used_at))+'</span>':'')+'</div>'+
          '<div style="line-height:2;overflow-wrap:anywhere"><b>الرابط:</b> <code style="direction:ltr;display:inline-block">'+esc(linkFor(x))+'</code><br><b>الكود:</b> <code style="direction:ltr;display:inline-block;font-size:17px;font-weight:800;letter-spacing:1px">'+esc(x.code||'—')+'</code></div>'+
          '<div class="fh-btns" style="margin-top:8px"><button class="fh-btn" type="button" data-msg="'+k+'">📋 نسخ الرسالة كاملة</button><button class="fh-btn out" type="button" data-link="'+k+'">نسخ الرابط</button><button class="fh-btn out" type="button" data-code="'+k+'">نسخ الكود</button><button class="fh-btn out" type="button" data-reset="'+k+'">🔄 كود جديد</button><button class="fh-btn out" type="button" data-act="'+k+'" data-on="'+(x.active?'0':'1')+'">'+(x.active?'⛔ إيقاف':'✅ تفعيل')+'</button></div></div>'}).join('');
        var inn=rows.filter(function(x){return x.active&&x.devices}).length;sum.dataset.closed=inn+' من '+rows.length+' دخلوا ▾';if(!det.open)sum.textContent=sum.dataset.closed;
        function rowOf(k){return rows.filter(function(x){return x.person_key===k})[0]}
        body.querySelectorAll('[data-msg]').forEach(function(b){b.onclick=function(){copy(msgFor(rowOf(b.dataset.msg)),b)}});
        body.querySelectorAll('[data-link]').forEach(function(b){b.onclick=function(){copy(linkFor(rowOf(b.dataset.link)),b)}});
        body.querySelectorAll('[data-code]').forEach(function(b){b.onclick=function(){copy(rowOf(b.dataset.code).code,b)}});
        body.querySelectorAll('[data-reset]').forEach(function(b){b.onclick=function(){if(!confirm('إنشاء كود جديد لـ '+rowOf(b.dataset.reset).name+'؟ الكود القديم يتوقف للأجهزة الجديدة، والأجهزة المسجلة تبقى تعمل.'))return;c.rpc('falah_owner_reset_code',{p_key:b.dataset.reset}).then(function(r){msg.textContent=r.error?'تعذر: '+r.error.message:'تم إنشاء كود جديد. انسخ الرسالة وأرسلها.';list()})}});
        body.querySelectorAll('[data-act]').forEach(function(b){b.onclick=function(){var on=b.dataset.on==='1';if(!on&&!confirm('إيقاف دخول '+rowOf(b.dataset.act).name+'؟ سيُخرج من كل أجهزته فورًا.'))return;c.rpc('falah_owner_set_active',{p_key:b.dataset.act,p_active:on}).then(function(r){msg.textContent=r.error?'تعذر: '+r.error.message:(on?'تم التفعيل.':'تم الإيقاف.');list()})}});
      });
    }
    waitClient().then(function(cl){
      c=cl;if(!c||!c.auth){body.innerHTML='<div class="fh-empty">تعذر الاتصال.</div>';return}
      c.auth.getSession().then(function(s){return s.data&&s.data.session?null:c.auth.signInAnonymously()}).then(function(){return c.rpc('falah_whoami')}).then(function(r){if(r.data&&r.data.role==='owner')list();else locked()}).catch(function(e){body.innerHTML='<div class="fh-empty">'+esc(e.message||e)+'</div>'});
    });
  }

  /* ================= 6) بطاقة تثبيت التطبيق على الهاتف ================= */
  var deferredPrompt=null;
  window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferredPrompt=e;var b=document.querySelector('.fh-install-btn');if(b)b.style.display=''});
  function installCard(el){
    css();if(!el)return;
    var standalone=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone;
    if(standalone){el.innerHTML='';return}
    var ios=/iphone|ipad|ipod/i.test(navigator.userAgent),hid=false;try{hid=localStorage.getItem('fh_install_hide:'+location.pathname.replace(/[^/]*$/,''))==='1'}catch(e){}
    if(hid){el.innerHTML='';return}
    el.classList.add('fh');
    el.innerHTML='<div class="fh-card" style="border-right:5px solid var(--ft)"><h3>📲 ثبّت المنصة على هاتفك</h3><p class="fh-sub" style="margin:4px 0 8px">'+(ios?'في Safari: اضغط زر المشاركة ⬆️ ثم «إضافة إلى الشاشة الرئيسية».':'اضغط «تثبيت» لتظهر المنصة كتطبيق على شاشتك. إن لم يظهر الزر: من قائمة المتصفح ⋮ اختر «إضافة إلى الشاشة الرئيسية».')+'</p><div class="fh-btns"><button class="fh-btn fh-install-btn" type="button" style="'+(deferredPrompt?'':'display:none')+'">⬇️ تثبيت</button><button class="fh-btn out fh-install-x" type="button">إخفاء</button></div></div>';
    el.querySelector('.fh-install-btn').onclick=function(){if(!deferredPrompt)return;deferredPrompt.prompt();deferredPrompt.userChoice.then(function(){deferredPrompt=null;el.innerHTML=''})};
    el.querySelector('.fh-install-x').onclick=function(){try{localStorage.setItem('fh_install_hide:'+location.pathname.replace(/[^/]*$/,''),'1')}catch(e){}el.innerHTML=''};
  }

  window.FH={accessPanel:accessPanel,installCard:installCard,applyIdentity:applyIdentity,openViewer:openViewer,interceptLinks:interceptLinks,quickGuide:quickGuide,presentations:presentations,ownerInbox:ownerInbox,myReplies:myReplies,DIRECTOR:DIRECTOR,EXEC:EXEC,norm:norm,client:client};
})();
