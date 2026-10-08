/* أكاديمية الفلاح — بوابة الدخول بالكود (access-gate.js)
 * الاستخدام: FHGate.require(['director','owner']).then(function(user){ ... })
 * - يُدخل كل شخص كوده مرة واحدة على جهازه، ويبقى مسجّلًا عليه.
 * - الكود يُتحقق منه داخل قاعدة البيانات (مشفّر)، ولا يوجد أي كود داخل هذا الملف.
 */
(function(){
  'use strict';
  var HINTS={owner:'منسق المكتبات',adwan:'د. محمد العدوان',afifi:'د. أمل العفيفي',hammadi:'السيدة/ أسماء الحمادي',darmaki:'السيدة/ فاطمة الدرمكي'};
  var ROLE_LABEL={owner:'منسق المكتبات',director:'المدير العام',executive:'المتابعة الإدارية'};
  var HOME={director:'director-general/',executive:'management/',owner:''};

  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function client(){
    var c=window.alfalahSupabase||window.supabaseClient;
    if(c&&c.auth&&typeof c.rpc==='function')return c;
    if(window.supabase&&window.supabase.createClient&&window.ALFALAH_SUPABASE_URL){window.alfalahSupabase=window.supabase.createClient(window.ALFALAH_SUPABASE_URL,window.ALFALAH_SUPABASE_KEY);window.supabaseClient=window.supabaseClient||window.alfalahSupabase;return window.alfalahSupabase}
    return null;
  }
  function waitClient(){return new Promise(function(res){var n=0;(function t(){var c=client();if(c||n++>40)return res(c);setTimeout(t,150)})()})}
  function unlock(){document.documentElement.classList.remove('fh-locked');var g=document.getElementById('fhGate');if(g)g.remove()}
  function base(){var p=location.pathname;var i=p.search(/\/(director-general|management|executive-management)\//);return location.origin+(i>=0?p.slice(0,i+1):p.replace(/[^/]*$/,''))}

  function screen(html){
    var g=document.getElementById('fhGate');
    if(!g){g=document.createElement('div');g.id='fhGate';document.body.appendChild(g)}
    g.innerHTML='<div class="fhg-card">'+html+'</div>';return g;
  }
  function style(){
    if(document.getElementById('fhg-style'))return;
    var s=document.createElement('style');s.id='fhg-style';
    s.textContent='#fhGate{position:fixed;inset:0;z-index:10000;background:linear-gradient(135deg,#0c447c,#185fa5 55%,#0f9d8a);display:flex;align-items:center;justify-content:center;padding:18px;direction:rtl;font-family:inherit;visibility:visible!important}'+
    '.fhg-card{background:#fff;border-radius:22px;padding:26px 22px;width:min(100%,420px);box-shadow:0 18px 50px rgba(0,0,0,.25);text-align:center;color:#0c2a4a}'+
    '.fhg-card h1{font-size:22px;margin:6px 0 4px;color:#0c447c}.fhg-card p{color:#5a7fa8;line-height:1.8;margin:6px 0 14px;font-size:15px}'+
    '.fhg-logo{font-size:40px}.fhg-in{width:100%;box-sizing:border-box;font-size:20px;letter-spacing:2px;text-align:center;direction:ltr;padding:14px;border:2px solid #c6d9ef;border-radius:14px;text-transform:uppercase}'+
    '.fhg-in:focus{outline:none;border-color:#0f9d8a}.fhg-btn{width:100%;margin-top:12px;border:0;border-radius:14px;padding:14px;font:inherit;font-size:17px;font-weight:800;background:#0f9d8a;color:#fff;cursor:pointer}'+
    '.fhg-btn[disabled]{opacity:.6}.fhg-msg{min-height:24px;margin-top:10px;font-weight:700;font-size:14px}.fhg-msg.err{color:#c0392b}.fhg-msg.ok{color:#0f6e56}'+
    '.fhg-note{font-size:12px;color:#8aa0b8;margin-top:14px;line-height:1.7}.fhg-card a{color:#185fa5;font-weight:800}';
    document.head.appendChild(s);
  }

  function ask(allowed,resolve,c){
    var hint=HINTS[new URLSearchParams(location.search).get('u')||'']||'';
    var g=screen('<div class="fhg-logo">📚</div><h1>'+(hint?'أهلًا '+esc(hint):'منصة مكتبات أكاديمية الفلاح')+'</h1><p>أدخل كود الدخول الخاص بك. يُطلب مرة واحدة فقط على هذا الجهاز.</p><input class="fhg-in" id="fhgCode" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXXX-XXXX-XXXX" inputmode="text"><button class="fhg-btn" id="fhgGo" type="button">دخول</button><div class="fhg-msg" id="fhgMsg" role="status"></div><div class="fhg-note">الكود شخصي وباسمك؛ تُنسب إليك كل ملاحظة تكتبها. لا تشاركه مع أحد.</div><div class="fhg-note"><a href="'+esc(base())+'">منسق المكتبات؟ ادخل بالبريد من هنا</a></div>');
    var inp=g.querySelector('#fhgCode'),btn=g.querySelector('#fhgGo'),msg=g.querySelector('#fhgMsg');
    setTimeout(function(){inp.focus()},50);
    function go(){
      var code=inp.value.trim();if(code.length<8){msg.className='fhg-msg err';msg.textContent='اكتب الكود كاملًا.';return}
      btn.disabled=true;msg.className='fhg-msg';msg.textContent='جارٍ التحقق...';
      c.rpc('falah_redeem_code',{p_code:code}).then(function(r){
        btn.disabled=false;
        if(r.error){msg.className='fhg-msg err';msg.textContent=/too_many/.test(r.error.message)?'محاولات خاطئة كثيرة. انتظر ١٥ دقيقة ثم أعد المحاولة.':'تعذر التحقق: '+r.error.message;return}
        var u=r.data;if(!u){msg.className='fhg-msg err';msg.textContent='الكود غير صحيح. تأكد منه وأعد المحاولة.';return}
        if(allowed.indexOf(u.role)<0){msg.className='fhg-msg err';msg.innerHTML='هذا الكود لا يفتح هذه الصفحة. <a href="'+esc(base()+HOME[u.role])+'">افتح صفحتك</a>';return}
        msg.className='fhg-msg ok';msg.textContent='أهلًا '+u.name;window.FH_USER=u;setTimeout(function(){unlock();resolve(u)},400);
      });
    }
    btn.onclick=go;inp.addEventListener('keydown',function(e){if(e.key==='Enter')go()});
  }

  /* وضع الانتقال: الروابط القديمة (بدون ?u=) تعمل كما كانت حتى تفعيل الإلزام للجميع.
     الروابط الجديدة الشخصية (?u=...) تطلب الكود دائمًا. للتفعيل الكامل: اجعل ENFORCE_ALL = true */
  var ENFORCE_ALL=false;
  function require(allowed){
    style();
    var qs=new URLSearchParams(location.search);
    if(!ENFORCE_ALL&&!qs.has('u')&&!qs.has('gate')){unlock();return Promise.resolve(null)}
    return new Promise(function(resolve){
      waitClient().then(function(c){
        if(!c){screen('<h1>تعذر الاتصال</h1><p>تحقق من الإنترنت ثم أعد تحميل الصفحة.</p>');return}
        c.auth.getSession().then(function(s){
          return s.data&&s.data.session?null:c.auth.signInAnonymously();
        }).then(function(r){
          if(r&&r.error)throw r.error;
          return c.rpc('falah_whoami');
        }).then(function(r){
          var u=r&&r.data;
          if(u&&allowed.indexOf(u.role)>=0){window.FH_USER=u;unlock();resolve(u);return}
          if(u&&allowed.indexOf(u.role)<0){screen('<div class="fhg-logo">🔒</div><h1>هذه الصفحة غير متاحة لحسابك</h1><p>أنت مسجّل باسم '+esc(u.name)+' ('+esc(ROLE_LABEL[u.role]||u.role)+').</p><a class="fhg-btn" style="display:block;text-decoration:none" href="'+esc(base()+HOME[u.role])+'">افتح صفحتك</a><button class="fhg-btn" type="button" style="background:#fff;color:#0c447c;border:2px solid #c6d9ef" onclick="FHGate.logout()">الدخول بحساب آخر</button>');return}
          ask(allowed,resolve,c);
        }).catch(function(e){screen('<h1>تعذر بدء الجلسة</h1><p>'+esc(e.message||e)+'</p><button class="fhg-btn" onclick="location.reload()">إعادة المحاولة</button>')});
      });
    });
  }

  /* صفحة المالك: دخول بالبريد الإلكتروني وكلمة المرور فقط (نفس حساب المكتبة الذكية) */
  function requireOwner(){
    style();
    return new Promise(function(resolve){
      waitClient().then(function(c){
        if(!c){screen('<h1>تعذر الاتصال</h1><p>تحقق من الإنترنت ثم أعد تحميل الصفحة.</p>');return}
        function check(){
          return c.rpc('falah_whoami').then(function(r){
            var u=r&&r.data;
            if(u&&u.role==='owner'){window.FH_USER=u;unlock();ownerBar(c);resolve(u);return true}
            return false;
          });
        }
        c.auth.getSession().then(function(s){
          var ses=s.data&&s.data.session;
          if(ses&&ses.user&&!ses.user.is_anonymous)return check();
          return false;
        }).then(function(ok){if(!ok)login(c,check)})
        .catch(function(e){screen('<h1>تعذر بدء الجلسة</h1><p>'+esc(e.message||e)+'</p><button class="fhg-btn" onclick="location.reload()">إعادة المحاولة</button>')});
      });
    });
  }
  function login(c,check){
    var g=screen('<div class="fhg-logo">🔐</div><h1>صفحة منسق المكتبات</h1><p>سجّل الدخول بحساب Google أو بالبريد وكلمة المرور.</p>'+
      '<button class="fhg-btn" id="fhgGoogle" type="button" style="background:#fff;color:#1f1f1f;border:2px solid #c6d9ef;margin:0 0 14px"><span style="font-weight:900;color:#4285f4">G</span>&nbsp; الدخول بحساب Google</button>'+
      '<div style="color:#8aa0b8;font-size:13px;margin-bottom:10px">— أو —</div>'+
      '<input class="fhg-in fhg-em" id="fhgEmail" type="email" autocomplete="username" placeholder="البريد الإلكتروني" style="text-transform:none;letter-spacing:0;font-size:17px">'+
      '<input class="fhg-in fhg-em" id="fhgPass" type="password" autocomplete="current-password" placeholder="كلمة المرور" style="text-transform:none;letter-spacing:0;font-size:17px;margin-top:10px">'+
      '<button class="fhg-btn" id="fhgGo" type="button">دخول</button><div class="fhg-msg" id="fhgMsg" role="status"></div>'+
      '<div class="fhg-note"><a href="#" id="fhgForgot">نسيت كلمة المرور؟</a></div>');
    var em=g.querySelector('#fhgEmail'),pw=g.querySelector('#fhgPass'),btn=g.querySelector('#fhgGo'),msg=g.querySelector('#fhgMsg');
    g.querySelector('#fhgGoogle').onclick=function(){
      msg.className='fhg-msg';msg.textContent='جارٍ التحويل إلى Google...';
      c.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname,queryParams:{prompt:'select_account'}}}).then(function(r){
        if(r.error)bad(/not enabled|Unsupported provider/i.test(r.error.message)?'الدخول بـ Google غير مفعّل بعد في إعدادات قاعدة البيانات.':'تعذر: '+r.error.message);
      });
    };
    setTimeout(function(){em.focus()},50);
    function bad(t){btn.disabled=false;msg.className='fhg-msg err';msg.textContent=t}
    function go(){
      var e=em.value.trim(),p=pw.value;
      if(!e||!p)return bad('اكتب البريد وكلمة المرور.');
      btn.disabled=true;msg.className='fhg-msg';msg.textContent='جارٍ التحقق...';
      c.auth.signInWithPassword({email:e,password:p}).then(function(r){
        if(r.error)return bad(/invalid/i.test(r.error.message)?'البريد أو كلمة المرور غير صحيحة.':'تعذر الدخول: '+r.error.message);
        return check().then(function(ok){
          if(!ok){c.auth.signOut();bad('هذا الحساب ليس حساب منسق المكتبات.')}
        });
      }).catch(function(x){bad('تعذر الدخول: '+(x.message||x))});
    }
    btn.onclick=go;pw.addEventListener('keydown',function(e){if(e.key==='Enter')go()});
    g.querySelector('#fhgForgot').onclick=function(ev){
      ev.preventDefault();var e=em.value.trim();
      if(!e)return bad('اكتب بريدك أولًا ثم اضغط «نسيت كلمة المرور».');
      c.auth.resetPasswordForEmail(e,{redirectTo:location.origin+location.pathname}).then(function(r){
        if(r.error)return bad('تعذر الإرسال: '+r.error.message);
        msg.className='fhg-msg ok';msg.textContent='أُرسل رابط إعادة التعيين إلى بريدك.';
      });
    };
  }
  function ownerBar(c){
    if(document.getElementById('fhOwnerBar'))return;
    var b=document.createElement('button');b.id='fhOwnerBar';b.type='button';b.textContent='🔓 تسجيل الخروج';
    b.style.cssText='position:fixed;bottom:14px;left:14px;z-index:9999;border:0;border-radius:999px;padding:9px 15px;font:inherit;font-weight:800;background:#0c447c;color:#fff;box-shadow:0 6px 18px rgba(0,0,0,.2);cursor:pointer';
    b.onclick=function(){if(confirm('تسجيل الخروج من صفحة المنسق على هذا الجهاز؟'))c.auth.signOut().then(function(){location.reload()})};
    document.body.appendChild(b);
  }
  function logout(){var c=client();if(!c)return;c.auth.signOut().then(function(){location.reload()})}
  window.FHGate={require:require,requireOwner:requireOwner,logout:logout,ROLE_LABEL:ROLE_LABEL};
})();
