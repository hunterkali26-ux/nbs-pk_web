const code = `(function(){try{var t=localStorage.getItem('vexis-theme');var r=document.documentElement;function apply(d){r.classList[d?'add':'remove']('dark');r.setAttribute('data-theme',d?'dark':'light')}if(t==='dark'||t==='light'){apply(t==='dark')}else{apply(window.matchMedia('(prefers-color-scheme: dark)').matches}}}catch(e){}})();`;

/**
 * Server component (no "use client"): renders the pre-hydration theme
 * bootstrap as a plain inline <script> so it executes before first paint
 * without going through the client runtime.
 */
export function ThemeScript() {
  return (
    <script
      id="vexis-theme-script"
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
}