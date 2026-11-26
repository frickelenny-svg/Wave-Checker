/* js/ui/kopfzeile.js – Kopfzeile: Design hell/dunkel (isDark, themeBtn), Knöpfe Lernen und „Zurück zum Regelwerk“.
   Aufgeteilt aus index.html am 26.11.2026 (Lenny). */
// Hell/Dunkel umschalten (Knopf oben in der Kopfzeile). Ohne Wahl gilt die Systemeinstellung; die Wahl bleibt im Browser gespeichert.
const isDark=()=>document.documentElement.dataset.theme?document.documentElement.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;
function themeBtn(){const d=isDark(),b=$('#theme');
 b.innerHTML=d?ico('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'):ico('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>');
 b.setAttribute('aria-label',d?'Zu hellem Design wechseln':'Zu dunklem Design wechseln');b.title=b.getAttribute('aria-label');}
$('#theme').onclick=()=>{const t=isDark()?'light':'dark',h=document.documentElement;h.classList.add('notr');h.dataset.theme=t;setTimeout(()=>h.classList.remove('notr'),50);try{localStorage.setItem('waveChecker.theme',t)}catch(_){}themeBtn()};
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',themeBtn);themeBtn();
$('#learn').onclick=()=>learn();
// „← Zurück zum Regelwerk“: nur sichtbar, wenn man über „Jetzt üben“ in „Chart durchzählen“ gekommen ist
$('#tolearn').onclick=()=>learn($('#tolearn').dataset.kap);
