export function dashboardHtml(){
return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>8ORA Agent OS</title>
<style>body{font-family:system-ui;background:#071018;color:#e8f4f7;margin:0;padding:32px}h1{font-size:28px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}.card{background:#0e1c26;border:1px solid #1e3b48;border-radius:14px;padding:18px}code{color:#69d6cf}.muted{color:#91a8b3}a{color:#69d6cf}</style></head>
<body><h1>8ORA Agent OS</h1><p class="muted">Standalone Phase 1 operator view — production 8ORA is not connected.</p>
<div class="grid"><div class="card"><h3>Health</h3><pre id="health">loading</pre></div><div class="card"><h3>Agents</h3><pre id="agents">loading</pre></div><div class="card"><h3>Jobs</h3><pre id="jobs">loading</pre></div><div class="card"><h3>Audit</h3><pre id="audit">loading</pre></div></div>
<script>async function j(u){return fetch(u).then(r=>r.json())} async function load(){const [h,a,jb,au]=await Promise.all([j('/health'),j('/v1/agents'),j('/v1/jobs'),j('/v1/audit')]);health.textContent=JSON.stringify(h,null,2);agents.textContent=a.length+' registered';jobs.textContent=JSON.stringify(jb.slice(0,5),null,2);audit.textContent=JSON.stringify(au.slice(0,5),null,2)}load()</script></body></html>`;
}
