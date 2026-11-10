(function(){
  var q = new URLSearchParams(location.search).get('lang') || '';
  var saved = ''; try { saved = localStorage.getItem('tc-policy-lang') || ''; } catch (e) {}
  var nav = (navigator.language || 'ko').toLowerCase();
  var lang = q ? (q === 'ko' ? 'ko' : 'en') : (saved || (nav.indexOf('ko') === 0 ? 'ko' : 'en'));
  function set(l){ lang = l; document.documentElement.lang = l;
    document.querySelectorAll('[data-l]').forEach(function(el){ el.classList.toggle('show', el.getAttribute('data-l') === l); });
    document.querySelectorAll('.lang button').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-set') === l); });
    try { localStorage.setItem('tc-policy-lang', l); } catch (e) {}
    var t = document.querySelector('[data-l="' + l + '"] h1'); if (t) document.title = t.textContent + ' · Total Calendar'; }
  document.addEventListener('click', function(e){ var b = e.target.closest('[data-set]'); if (b) set(b.getAttribute('data-set')); });
  set(lang);
})();
