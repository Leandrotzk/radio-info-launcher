# GOLD MÓVEL para Android

Aplicativo Android nativo e leve para orientar clientes nas opções H+, 3G, 4G/LTE e 5G. Não usa Compose, AppCompat, Material Components nem bibliotecas externas pesadas.

## Uso do cliente

- A tela inicial pede somente o código de acesso, o botão **Ativar** e o contato da GOLD MÓVEL no WhatsApp.
- Após a ativação, o cliente escolhe uma das quatro opções de rede e recebe uma orientação simples para abrir as configurações do aparelho.
- O menu também oferece **Inserir código** para ativar outro código de 8 dígitos quando a GOLD MÓVEL enviar um novo.
- A seleção final é feita manualmente pelo Android; o aplicativo não altera a rede sozinho.

Os códigos novos têm oito dígitos. Códigos antigos continuam aceitos. Cada código ativa um aparelho por 30 dias a partir da primeira ativação, com validação online.

## Build

```bash
./gradlew assembleRelease
```

O projeto usa o application ID `com.goldmovel`, `minifyEnabled true`, `shrinkResources true` e Android framework nativo. Releases precisam ser assinadas sempre com o mesmo keystore; o arquivo e a senha nunca devem ser commitados no Git.
