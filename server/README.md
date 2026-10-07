# GOLD MÓVEL — licenças

## Painel do responsável

Acesse <https://goldmovel-license-api.taliba.workers.dev/admin> pelo navegador. Informe a chave administrativa entregue separadamente, escolha uma quantidade (1 a 100) e gere os códigos. Cada código é exibido uma única vez, fica vinculado ao primeiro aparelho em que for ativado e vence 30 dias depois dessa ativação.

O aplicativo valida a licença online ao iniciar e exige internet. O serviço armazena o hash do código e um hash de identificador técnico do dispositivo; não pede nome nem telefone do cliente. Mantenha a chave administrativa e os códigos em local privado.

## Serviço

- Cloudflare Worker: `goldmovel-license-api`
- D1: `goldmovel-license-db`
- Esquema: `schema.sql`
- Worker: `worker.js`
- API pública do app: `/api/activate` e `/api/validate`
- Painel privado: `/admin` (operações protegidas pela secret `ADMIN_KEY` do Worker)

Para publicar código atualizado, configure `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` no ambiente autorizado e rode `npx wrangler deploy`. O ID da base está no `wrangler.toml`; não coloque a secret do painel ou o token Cloudflare em commits.
