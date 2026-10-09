const LICENSE_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const CODE_8_DIGITS = /^[0-9]{8}$/;
const LEGACY_CODE_16 = /^[A-Z0-9]{16}$/;

const ADMIN_HTML = String.raw`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>GOLD MÓVEL · Gerador de códigos</title>
<style>
:root{color-scheme:dark;--gold:#d4af37;--bg:#101010;--card:#1c1c1c;--muted:#b9b5a8}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:#f6f3e8;font:16px system-ui,-apple-system,Segoe UI,sans-serif}.wrap{max-width:640px;margin:0 auto;padding:30px 18px}.brand{color:var(--gold);font-weight:800;letter-spacing:.12em;font-size:14px}.card{margin-top:18px;padding:22px;background:var(--card);border:1px solid #353126;border-radius:18px}h1{margin:7px 0 8px;font-size:25px}.muted{color:var(--muted);line-height:1.5}label{display:block;margin:18px 0 7px;font-weight:650}input,button{width:100%;border-radius:11px;padding:13px 14px;font:inherit}input{background:#111;border:1px solid #555;color:white}input[type=checkbox]{width:auto;padding:0;margin:0;accent-color:var(--gold)}label.remember{display:flex;align-items:center;gap:10px;margin:13px 0 4px;font-weight:500}button{margin-top:13px;border:0;background:var(--gold);color:#17140a;font-weight:800;cursor:pointer}button.secondary{background:#302b1c;color:var(--gold);border:1px solid #6a5720}.out{white-space:pre-wrap;overflow-wrap:anywhere;background:#101010;border:1px solid #403820;border-radius:12px;padding:14px;margin-top:16px;font:600 16px ui-monospace,monospace;color:var(--gold)}.small{font-size:13px}.error{color:#ff9388}.ok{color:#a8dfa8}hr{border:0;border-top:1px solid #403c31;margin:22px 0}[hidden]{display:none!important}
</style>
</head>
<body><main class="wrap"><div class="brand">GOLD MÓVEL</div><section class="card">
<h1>Gerador de acessos</h1>
<p class="muted">Os novos códigos têm 8 dígitos. Cada código ativa um aparelho e vale por 30 dias a partir da primeira ativação. Códigos antigos continuam válidos.</p>
<label for="key">Chave privada do administrador</label>
<input id="key" type="password" autocomplete="current-password" placeholder="Cole sua chave de administrador">
<label class="remember"><input id="remember" type="checkbox">Lembrar neste navegador</label>
<p class="muted small">Se marcar, a chave fica salva somente neste navegador. Faça isso apenas em aparelho privado; qualquer pessoa com acesso a ele poderá gerar códigos.</p>
<button id="forget" class="secondary" type="button">Apagar chave salva</button>
<label for="count">Quantidade de códigos</label>
<input id="count" type="number" min="1" max="100" value="1">
<button id="generate" type="button">Gerar códigos</button>
<button id="copy" class="secondary" type="button" hidden>Copiar códigos</button>
<button id="status" class="secondary" type="button">Ver resumo dos últimos códigos</button>
<div id="message" class="muted small" role="status"></div>
<div id="codes" class="out" hidden></div>
<hr>
<p class="muted small">Não compartilhe a chave administrativa com clientes. O app valida os códigos online e limita tentativas de ativação.</p>
</section></main>
<script>
const keyEl=document.getElementById('key'),rememberEl=document.getElementById('remember'),msg=document.getElementById('message'),out=document.getElementById('codes'),copyButton=document.getElementById('copy');
const STORAGE_KEY='goldmovel_admin_key_v1';
try{const saved=localStorage.getItem(STORAGE_KEY);if(saved){keyEl.value=saved;rememberEl.checked=true}}catch(e){}
function syncStoredKey(){try{if(rememberEl.checked&&keyEl.value.trim())localStorage.setItem(STORAGE_KEY,keyEl.value.trim());else if(!rememberEl.checked)localStorage.removeItem(STORAGE_KEY)}catch(e){}}
keyEl.addEventListener('input',syncStoredKey);rememberEl.addEventListener('change',syncStoredKey);
document.getElementById('forget').onclick=()=>{try{localStorage.removeItem(STORAGE_KEY)}catch(e){}keyEl.value='';rememberEl.checked=false;msg.textContent='Chave removida deste navegador.';msg.className='muted small'};
async function admin(path,body){const key=keyEl.value.trim();if(!key)throw new Error('Informe a chave privada.');const r=await fetch(path,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+key},body:JSON.stringify(body||{})});const d=await r.json();if(!r.ok)throw new Error(d.message||'Falha na solicitação.');return d}
document.getElementById('generate').onclick=async()=>{msg.textContent='Gerando…';msg.className='muted small';out.hidden=true;copyButton.hidden=true;try{const count=Number(document.getElementById('count').value);if(!Number.isInteger(count)||count<1||count>100)throw new Error('Escolha entre 1 e 100 códigos.');const d=await admin('/admin/generate',{count});out.textContent=d.codes.join('\n');out.hidden=false;copyButton.hidden=false;msg.textContent='Copie e entregue cada código individualmente. A validade começa no primeiro uso.';msg.className='ok small'}catch(e){msg.textContent=e.message;msg.className='error small'}};
copyButton.onclick=async()=>{try{await navigator.clipboard.writeText(out.textContent);msg.textContent='Códigos copiados. Guarde e entregue cada um individualmente.';msg.className='ok small'}catch(e){msg.textContent='Selecione e copie os códigos exibidos.';msg.className='muted small'}};
document.getElementById('status').onclick=async()=>{msg.textContent='Consultando…';msg.className='muted small';out.hidden=true;copyButton.hidden=true;try{const d=await admin('/admin/list');out.textContent=d.items.map(x=>new Date(x.createdAt).toLocaleString('pt-BR')+' · '+x.status+' · '+(x.expiresAt?('expira '+new Date(x.expiresAt).toLocaleDateString('pt-BR')):'ainda não ativado')).join('\n')||'Nenhum código.';out.hidden=false;msg.textContent='Resumo sem exibir códigos já emitidos.';msg.className='ok small'}catch(e){msg.textContent=e.message;msg.className='error small'}};
</script></body></html>`;

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "x-content-type-options": "nosniff",
      ...extraHeaders
    }
  });
}

function normalizeCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function isSupportedCode(code) {
  return CODE_8_DIGITS.test(code) || LEGACY_CODE_16.test(code);
}

function displayCode(code) {
  return code.slice(0, 4) + "-" + code.slice(4);
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}

function randomCode() {
  let digits = "";
  const bytes = new Uint8Array(32);
  while (digits.length < 8) {
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte < 250) {
        digits += String(byte % 10);
        if (digits.length === 8) break;
      }
    }
  }
  return displayCode(digits);
}

async function readBody(request) {
  const text = await request.text();
  if (text.length > 4096) throw new Error("Solicitação muito grande.");
  return JSON.parse(text || "{}");
}

async function checkRateLimit(request, env, action) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const rateKey = await sha256Hex(action + ":" + ip);
  const now = Date.now();
  const windowStart = Math.floor(now / RATE_WINDOW_MS) * RATE_WINDOW_MS;
  const row = await env.DB.prepare(
    "INSERT INTO auth_rate_limits (rate_key, window_start, attempts) VALUES (?, ?, 1) " +
    "ON CONFLICT(rate_key) DO UPDATE SET " +
    "attempts = CASE WHEN auth_rate_limits.window_start = excluded.window_start " +
    "THEN auth_rate_limits.attempts + 1 ELSE 1 END, " +
    "window_start = excluded.window_start RETURNING attempts"
  ).bind(rateKey, windowStart).first();
  const limit = action === "activate" ? 12 : 300;
  const retryAfter = Math.max(1, Math.ceil((windowStart + RATE_WINDOW_MS - now) / 1000));
  return { allowed: !!row && Number(row.attempts) <= limit, retryAfter };
}

async function adminAuthorized(request, env) {
  if (!env.ADMIN_KEY) return false;
  const header = request.headers.get("authorization") || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (supplied.length !== env.ADMIN_KEY.length) return false;
  return (await sha256Hex(supplied)) === (await sha256Hex(env.ADMIN_KEY));
}

async function adminRoute(request, env, path) {
  if (!(await adminAuthorized(request, env))) return json({ message: "Chave administrativa inválida." }, 401);
  if (request.method !== "POST") return json({ message: "Método não permitido." }, 405);

  const body = await readBody(request);
  if (path === "/admin/generate") {
    const count = Number(body.count);
    if (!Number.isInteger(count) || count < 1 || count > 100) {
      return json({ message: "Escolha entre 1 e 100 códigos." }, 400);
    }
    const codes = [];
    for (let i = 0; i < count; i++) {
      let inserted = false;
      for (let attempt = 0; attempt < 12 && !inserted; attempt++) {
        const code = randomCode();
        const codeHash = await sha256Hex(normalizeCode(code));
        const result = await env.DB.prepare(
          "INSERT INTO licenses (code_hash, created_at, status) VALUES (?, ?, 'active') " +
          "ON CONFLICT(code_hash) DO NOTHING RETURNING code_hash"
        ).bind(codeHash, Date.now()).first();
        if (result) {
          codes.push(code);
          inserted = true;
        }
      }
      if (!inserted) throw new Error("Não foi possível reservar um código único.");
    }
    await env.DB.prepare("DELETE FROM auth_rate_limits WHERE window_start < ?")
      .bind(Date.now() - 7 * 24 * 60 * 60 * 1000).run();
    return json({ codes, count, validityDays: 30, digits: 8 });
  }

  if (path === "/admin/list") {
    const result = await env.DB.prepare(
      "SELECT created_at, activated_at, expires_at, status FROM licenses ORDER BY created_at DESC LIMIT 100"
    ).all();
    return json({ items: (result.results || []).map(row => ({
      createdAt: row.created_at,
      activatedAt: row.activated_at,
      expiresAt: row.expires_at,
      status: row.status
    })) });
  }

  if (path === "/admin/revoke" || path === "/admin/reset") {
    const code = normalizeCode(body.code);
    if (!isSupportedCode(code)) return json({ message: "Código inválido." }, 400);
    const codeHash = await sha256Hex(code);
    const sql = path === "/admin/revoke"
      ? "UPDATE licenses SET status='revoked' WHERE code_hash=?"
      : "UPDATE licenses SET status='active', device_hash=NULL, activated_at=NULL, expires_at=NULL WHERE code_hash=?";
    const result = await env.DB.prepare(sql).bind(codeHash).run();
    if (!result.meta || result.meta.changes !== 1) return json({ message: "Código não encontrado." }, 404);
    return json({ ok: true });
  }
  return json({ message: "Rota não encontrada." }, 404);
}

async function activateOrValidate(request, env, action) {
  if (request.method !== "POST") return json({ message: "Método não permitido." }, 405);
  const rate = await checkRateLimit(request, env, action);
  if (!rate.allowed) {
    return json({ message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." }, 429, { "retry-after": String(rate.retryAfter) });
  }

  const body = await readBody(request);
  const code = normalizeCode(body.code);
  const deviceId = String(body.deviceId || "").toLowerCase();
  if (!isSupportedCode(code) || !/^[a-f0-9]{64}$/.test(deviceId)) {
    return json({ message: "Código ou identificador do aparelho inválido." }, 400);
  }

  const codeHash = await sha256Hex(code);
  const deviceHash = await sha256Hex(deviceId);
  let row = await env.DB.prepare(
    "SELECT device_hash, activated_at, expires_at, status FROM licenses WHERE code_hash=?"
  ).bind(codeHash).first();
  const genericReject = () => json({ message: "Código inválido, expirado ou já utilizado. Confira e fale com a GOLD MÓVEL se precisar." }, 403);
  if (!row || row.status !== "active") return genericReject();

  if (action === "activate" && !row.device_hash && !row.activated_at) {
    const now = Date.now();
    const expiresAt = now + LICENSE_DAYS_MS;
    const update = await env.DB.prepare(
      "UPDATE licenses SET device_hash=?, activated_at=?, expires_at=? WHERE code_hash=? AND device_hash IS NULL AND activated_at IS NULL AND status='active'"
    ).bind(deviceHash, now, expiresAt, codeHash).run();
    if (update.meta && update.meta.changes === 1) {
      return json({ valid: true, expiresAt, daysRemaining: 30, activated: true });
    }
    row = await env.DB.prepare(
      "SELECT device_hash, activated_at, expires_at, status FROM licenses WHERE code_hash=?"
    ).bind(codeHash).first();
  }

  if (!row.device_hash || !row.activated_at || !row.expires_at) return genericReject();
  if (row.device_hash !== deviceHash || Number(row.expires_at) <= Date.now()) return genericReject();

  const remaining = Math.ceil((Number(row.expires_at) - Date.now()) / (24 * 60 * 60 * 1000));
  return json({ valid: true, expiresAt: Number(row.expires_at), daysRemaining: remaining, activated: false });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (request.method === "GET" && url.pathname === "/health") {
        return json({ ok: true, service: "goldmovel-license" });
      }
      if (request.method === "GET" && url.pathname === "/admin") {
        return new Response(ADMIN_HTML, {
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store, max-age=0",
            "x-content-type-options": "nosniff",
            "x-frame-options": "DENY",
            "referrer-policy": "no-referrer",
            "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
          }
        });
      }
      if (url.pathname.startsWith("/admin/")) return await adminRoute(request, env, url.pathname);
      if (url.pathname === "/api/activate") return await activateOrValidate(request, env, "activate");
      if (url.pathname === "/api/validate") return await activateOrValidate(request, env, "validate");
      return json({ message: "Não encontrado." }, 404);
    } catch (error) {
      return json({ message: error instanceof SyntaxError ? "JSON inválido." : "Erro temporário no serviço. Tente novamente." }, 500);
    }
  }
};
