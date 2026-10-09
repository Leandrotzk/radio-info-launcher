# GOLD MÓVEL para Android

Aplicativo Android nativo e leve para orientar clientes na escolha de H+, 3G, 4G/LTE ou 5G e abrir a tela de rádio do aparelho. Não usa Compose, AppCompat, Material Components nem bibliotecas externas pesadas.

## O que o app faz

- Exibe quatro guias curtos para H+, 3G, 4G/LTE e 5G.
- Ao confirmar um guia, tenta abrir `com.android.settings.RadioInfo` e usa `com.android.phone.settings.RadioInfo` como fallback para Android AOSP atual.
- O cliente escolhe a opção manualmente na tela do sistema. O Android reserva a alteração direta do modo de rádio a componentes privilegiados/operadoras; o app não promete mudar a rede sozinho. H+ é uma variante de 3G e as opções dependem do aparelho, SIM, cobertura e operadora.
- Abre atendimento no WhatsApp oficial: https://wa.me/5541984498277.
- Oferece um atalho para as versões publicadas em [GitHub Releases](https://github.com/Leandrotzk/radio-info-launcher/releases).

## Acesso por código de 30 dias

Cada código individual ativa um aparelho e começa a valer por 30 dias na primeira ativação. O app precisa de internet ao abrir para validar o código. O serviço armazena hashes dos códigos e do identificador técnico do aparelho, não o número de telefone do cliente.

O botão **Gerar códigos · administrador**, disponível no app, aceita a chave administrativa e gera de 1 a 100 códigos. A chave é enviada ao serviço somente por HTTPS, não é gravada no aplicativo e é limpa do campo após a solicitação. Os códigos são mostrados uma única vez e podem ser copiados.

Painel web alternativo: https://goldmovel-license-api.taliba.workers.dev/admin

Guarde a chave administrativa em local privado. Ela nunca deve ser incluída no APK nem no repositório.

## Build local

```bash
./gradlew assembleRelease
```

O projeto usa o application ID `com.goldmovel`, `minifyEnabled true`, `shrinkResources true` e Android framework nativo. Releases precisam ser assinadas sempre com o mesmo keystore; o arquivo e a senha nunca devem ser commitados no Git.

## Atualizações

As versões destinadas a clientes devem ser publicadas como releases versionadas do GitHub, assinadas com a chave estável GOLD MÓVEL. O Android pode pedir confirmação ao instalar uma atualização e, na primeira migração da antiga instalação, será necessário instalar a nova versão assinada. O sistema não permite instalar APKs em silêncio a partir de um app comum.
