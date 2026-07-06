// إعدادات Supabase النهائية
window.ALFALAH_SUPABASE_URL = "https://nmbbahzzogspuuvpsxud.supabase.co";
window.ALFALAH_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tYmJhaHp6b2dzcHV1dnBzeHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MTY1MTYsImV4cCI6MjA5MzA5MjUxNn0.6yZNxZ_2ONQ-wyQSJtdvYpdJAxZfB-7C00ezEepUiqY";

(function(){
  function init(){
    try{
      if(window.alfalahSupabase && typeof window.alfalahSupabase.from === 'function'){
        window.supabaseClient = window.alfalahSupabase;
        return true;
      }
      if(window.supabase && typeof window.supabase.createClient === 'function'){
        window.alfalahSupabase = window.supabase.createClient(
          window.ALFALAH_SUPABASE_URL,
          window.ALFALAH_SUPABASE_KEY
        );
        window.supabaseClient = window.alfalahSupabase;
        console.log('Alfalah Supabase connected');
        return true;
      }
      return false;
    }catch(e){
      console.error('Supabase init error', e);
      return false;
    }
  }

  if(!init()){
    document.addEventListener('DOMContentLoaded', init);
    window.addEventListener('load', init);
    setTimeout(init, 300);
    setTimeout(init, 800);
    setTimeout(init, 1500);
  }
})();
