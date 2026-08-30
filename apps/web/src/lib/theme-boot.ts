/**
 * Blocking boot script: stamps data-theme / data-density / data-mode on <html>
 * before paint so theme toggles never flash (docs/jobs-redesign.md §7).
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var d=document.documentElement;var theme=localStorage.getItem('job-hunter-theme');if(!theme){var legacy=localStorage.getItem('job-hunter-design-mode');theme=legacy==='material'?'material':legacy==='fresh'?'fieldwork':'fieldwork'}if(theme==='fresh')theme='fieldwork';if(theme!=='material')theme='fieldwork';d.setAttribute('data-theme',theme);var density=localStorage.getItem('job-hunter-density');if(density!=='comfortable')density='compact';d.setAttribute('data-density',density);var t=localStorage.getItem('theme');var dark=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);d.setAttribute('data-mode',dark?'dark':'light')}catch(e){}})();`;
