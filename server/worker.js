const LICENSE_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const ADMIN_HTML = String.raw`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GOLD MÓVEL · Códigos</title>
<style>
:root{color-scheme:dark;--gold:#d4af37;--bg:#101010;--card:#1c1c1c;--muted:#b9b5a8}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:#f6f3e8;font:16px system-ui,-apple-system,Segoe UI,sans-serif}.wrap{max-width:640px;margin:0 auto;padding:26px 18px}.brand{color:var(--gold);font-weight:800;letter-spacing:.12em;font-size:14px}.card{margin-top:18px;padding:22px;background:var(--card);border:1px solid #353126;border-radius:18px}h1{margin:7px 0 8px;font-size:25px}.muted{color:var(--muted);line-height:1.5}label{display:block;margin:18px 0 7px;font-weight:650}input,button{width:100%;border-radius:11px;padding:13px 14px;font:inherit}input{background:#111;border:1px solid #555;color:white}button{margin-top:13px;border:0;background:var(--gold);color:#17140a;font-weight:800;cursor:pointer}button.secondary{background:#302b1c;color:var(--gold);border:1px solid #6a5720}.out{white-space:pre-wrap;overflow-wrap:anywhere;background:#101010;border:1px solid #403820;border-radius:12px;padding:14px;margin-top:16px;font:600 16px ui-monospace,monospace;color:var(--gold)}.small{font-size:13px}.error{color:#ff9388}.ok{color:#a8dfa8}hr{border:0;border-top:1px solid #403c31;margin:22px 0}
</style></head><body><main class="wrap"><div class="brand">GOLD MÓVEL</div><section class="card"><h1>Gerador de acessos</h1><p class="muted">Cada código ativa um aparelho e começa a valer por 30 dias na primeira ativação. Guarde os códigos: eles são mostrados somente uma vez.</p>
<label for="key">Chave privada do administrador</label><input id="key" type="password" autocomplete="current-password" placeholder="Cole sua chave de administrador"><label for="count">Quantidade de códigos</label><input id="count" type="number" min="1" max="100" value="1"><button id="generate">Gerar códigos</button><button id="status" class="secondary">Ver resumo dos últimos códigos</button><div id="message" class="muted small" role="status"></div><div id="codes" class="out" hidden></div><hr><p class="muted small">Por segurança, não compartilhe sua chave administrativa. O app consulta a validade online sempre que é aberto.</p></section></main>
<script>
const keyEl=document.getElementById('key'), msg=document.getElementById('message'), out=document.getElementById('codes');
async function admin(path,body){const key=keyEl.value.trim();if(!key)throw new Error('Informe a chave privada.');const r=await fetch(path,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+key},body:JSON.stringify(body||{})});const d=await r.json();if(!r.ok)throw new Error(d.message||'Falha na solicitação.');return d}
document.getElementById('generate').onclick=async()=>{msg.textContent='Gerando…';msg.className='muted small';out.hidden=true;try{const d=await admin('/admin/generate',{count:Number(document.getElementById('count').value)});out.textContent=d.codes.join('\n');out.hidden=false;msg.textContent='Copie e entregue cada código individualmente. A validade começa no primeiro uso.';msg.className='ok small'}catch(e){msg.textContent=e.message;msg.className='error small'}};
document.getElementById('status').onclick=async()=>{msg.textContent='Consultando…';msg.className='muted small';out.hidden=true;try{const d=await admin('/admin/list');out.textContent=d.items.map(x=>new Date(x.createdAt).toLocaleString('pt-BR')+' · '+x.status+' · '+(x.expiresAt?('expira '+new Date(x.expiresAt).toLocaleDateString('pt-BR')):'ainda não ativado')).join('\n')||'Nenhum código.';out.hidden=false;msg.textContent='Resumo sem exibir códigos já emitidos.';msg.className='ok small'}catch(e){msg.textContent=e.message;msg.className='error small'}};
</script></body></html>`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "x-content-type-options": "nosniff"
    }
  });
}

function normalizeCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}

function randomCode() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const raw = Array.from(bytes, b => CODE_ALPHABET[b & 31]).join("");
  return raw.match(/.{4}/g).join("-");
}

async function readBody(request) {
  const text = await request.text();
  if (text.length > 4096) throw new Error("Solicitação muito grande.");
  return JSON.parse(text || "{}");
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
    const codes = Array.from({ length: count }, randomCode);
    const statements = [];
    for (const code of codes) {
      statements.push(env.DB.prepare(
        "INSERT INTO licenses (code_hash, created_at, status) VALUES (?, ?, 'active')"
      ).bind(await sha256Hex(normalizeCode(code)), Date.now()));
    }
    await env.DB.batch(statements);
    return json({ codes, count, validityDays: 30 });
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
    if (code.length !== 16) return json({ message: "Código inválido." }, 400);
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
  const body = await readBody(request);
  const code = normalizeCode(body.code);
  const deviceId = String(body.deviceId || "").toLowerCase();
  if (code.length !== 16 || !/^[a-f0-9]{64}$/.test(deviceId)) {
    return json({ message: "Código ou identificador do aparelho inválido." }, 400);
  }

  const codeHash = await sha256Hex(code);
  const deviceHash = await sha256Hex(deviceId);
  let row = await env.DB.prepare(
    "SELECT device_hash, activated_at, expires_at, status FROM licenses WHERE code_hash=?"
  ).bind(codeHash).first();
  if (!row || row.status !== "active") return json({ message: "Código inválido ou bloqueado." }, 403);

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

  if (!row.device_hash || !row.activated_at || !row.expires_at) {
    return json({ message: "Código ainda não ativado. Toque em Ativar acesso." }, 409);
  }
  if (row.device_hash !== deviceHash) {
    return json({ message: "Este código já foi ativado em outro aparelho." }, 409);
  }
  if (Number(row.expires_at) <= Date.now()) {
    return json({ message: "A validade deste código terminou. Solicite outro à GOLD MÓVEL." }, 410);
  }

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
