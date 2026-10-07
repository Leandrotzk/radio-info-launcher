# Radio Info Launcher

Aplicativo Android nativo mínimo que tenta abrir `com.android.settings.RadioInfo`. Em aparelhos que não disponibilizam ou bloqueiam essa tela, exibe um aviso e encerra.

## Build

```bash
./gradlew assembleRelease
```

O APK otimizado fica em `app/build/outputs/apk/release/app-release.apk`. O release usa R8 (`minifyEnabled`) e redução de recursos (`shrinkResources`), sem bibliotecas Android externas. O artefato da GitHub Action é gerado em cada push para `main` e também pode ser iniciado manualmente pela aba **Actions**.

> Compatibilidade depende da versão e do fabricante: `RadioInfo` é uma Activity interna e pode não estar exportada ou disponível no aparelho. O APK release está assinado com a chave de debug do Gradle para instalação direta de teste; não é uma chave adequada para distribuição comercial.
