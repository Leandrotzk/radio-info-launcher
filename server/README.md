# GOLD MÓVEL — licenças

## Painel do responsável

Acesse <https://goldmovel-license-api.taliba.workers.dev/admin> pelo navegador. Os novos códigos têm oito dígitos; códigos legados de 16 caracteres continuam aceitos. Cada código é exibido uma única vez, fica vinculado ao primeiro aparelho em que for ativado e vence 30 dias após a ativação.

O painel pode lembrar a chave administrativa apenas no armazenamento local do navegador, mediante a opção **Lembrar neste navegador**. Use essa opção somente em aparelho pessoal; qualquer pessoa com acesso ao mesmo perfil do navegador poderá gerar códigos. **Esquecer chave** remove a cópia local. A chave não é gravada no Worker nem embutida no APK.

O aplicativo valida a licença online ao iniciar e exige internet. O serviço armazena o hash do código e um hash do identificador técnico do aparelho; não pede nome nem telefone do cliente. A API limita tentativas por endereço de origem; códigos curtos não devem ser usados sem esse controle.

## Serviço

- Cloudflare Worker: `goldmovel-license-api`
- D1: `goldmovel-license-db`
- Esquema base: `schema.sql`
- Migração para limite de tentativas: `migrations/0002_auth_rate_limits.sql`
- Worker: `worker.js`
- API pública do app: `/api/activate` e `/api/validate`
- Painel do responsável: `/admin` (operações administrativas protegidas pela secret `ADMIN_KEY` do Worker)

Para publicar código atualizado, use a integração/credencial Cloudflare autorizada e rode a migração D1 e `npx wrangler deploy`. O ID da base está no `wrangler.toml`. Não inclua a secret do painel, tokens Cloudflare ou keystore em commits. O token Cloudflare é diferente da chave administrativa do gerador.
