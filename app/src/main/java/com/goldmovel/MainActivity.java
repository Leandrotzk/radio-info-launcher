package com.goldmovel;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class MainActivity extends Activity {
    private static final int BLACK = Color.rgb(15, 15, 15);
    private static final int CARD = Color.rgb(29, 29, 29);
    private static final int GOLD = Color.rgb(212, 175, 55);
    private static final String WHATSAPP_URL = "https://wa.me/5541984498277";
    private static final String API_BASE = "https://goldmovel-license-api.taliba.workers.dev";
    private static final String[] RADIO_INFO_COMPONENTS = {
            "com.android.settings/com.android.settings.RadioInfo",
            "com.android.phone/com.android.phone.settings.RadioInfo"
    };

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private SharedPreferences preferences;
    private LinearLayout content;
    private TextView statusText;
    private boolean requestInFlight;
    private boolean licensed;
    private boolean firstResume = true;
    private long lastValidatedAt;
    private String currentCode = "";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(BLACK);
        getWindow().setNavigationBarColor(BLACK);
        preferences = getSharedPreferences("goldmovel_access", MODE_PRIVATE);
        currentCode = preferences.getString("license_code", "");
        if (currentCode.isEmpty()) {
            showActivationScreen("", "");
        } else {
            validateSavedCode();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (firstResume) {
            firstResume = false;
            return;
        }
        if (licensed && !requestInFlight && SystemClock.elapsedRealtime() - lastValidatedAt > 60_000L) {
            validateSavedCode();
        }
    }

    private void showActivationScreen(String message, String prefilledCode) {
        licensed = false;
        makeScreen();
        addLogoAndBrand();
        addSpace(8);

        EditText codeInput = new EditText(this);
        codeInput.setSingleLine(true);
        codeInput.setHint("Código de acesso");
        codeInput.setTextColor(Color.WHITE);
        codeInput.setHintTextColor(0xFF8D8A80);
        codeInput.setTextSize(16);
        codeInput.setGravity(Gravity.CENTER);
        codeInput.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        codeInput.setInputType(android.text.InputType.TYPE_CLASS_TEXT
                | android.text.InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS
                | android.text.InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS);
        codeInput.setBackgroundTintList(ColorStateList.valueOf(GOLD));
        codeInput.setPadding(dp(12), dp(10), dp(12), dp(10));
        codeInput.setFilters(new android.text.InputFilter[]{new android.text.InputFilter.LengthFilter(24)});
        addView(codeInput, ViewGroup.LayoutParams.MATCH_PARENT, dp(58), 0, 12, 0, 2);
        codeInput.setText(prefilledCode);

        Button activate = createButton("Ativar", true);
        activate.setOnClickListener(v -> activateCode(codeInput.getText().toString()));
        addView(activate, ViewGroup.LayoutParams.MATCH_PARENT, dp(54), 0, 8, 0, 4);

        addWhatsAppButton();
        if (message != null && !message.trim().isEmpty()) {
            statusText = addText(message, 13, 0xFFE0DED8, false, Gravity.CENTER);
            statusText.setPadding(dp(8), dp(8), dp(8), dp(4));
        }
    }

    private void showCheckingScreen() {
        makeScreen();
        addLogoAndBrand();
        ProgressBarCompat.add(this, content);
        addText("Aguarde…", 14, 0xFFE0DED8, false, Gravity.CENTER);
        addWhatsAppButton();
    }

    private String simpleErrorMessage(Exception error) {
        String detail = error == null || error.getMessage() == null ? "" : error.getMessage().toLowerCase(Locale.ROOT);
        if (detail.contains("tentativa")) return "Aguarde um pouco e tente novamente.";
        if (detail.contains("conexão") || detail.contains("internet")) return "Sem internet. Tente novamente.";
        return "Código não aceito. Confira ou fale conosco no WhatsApp.";
    }

    private void showHome() {
        licensed = true;
        lastValidatedAt = SystemClock.elapsedRealtime();
        makeScreen();
        addLogoAndBrand();
        addText("Escolha uma opção", 18, Color.WHITE, true, Gravity.CENTER);
        addSpace(8);

        LinearLayout row1 = new LinearLayout(this);
        row1.setOrientation(LinearLayout.HORIZONTAL);
        Button hplus = createButton("H+", false);
        Button threeG = createButton("3G", false);
        row1.addView(hplus, weightedButtonParams());
        row1.addView(threeG, weightedButtonParams());
        addView(row1, ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT, 0, 8, 0, 0);

        LinearLayout row2 = new LinearLayout(this);
        row2.setOrientation(LinearLayout.HORIZONTAL);
        Button fourG = createButton("4G / LTE", false);
        Button fiveG = createButton("5G", false);
        row2.addView(fourG, weightedButtonParams());
        row2.addView(fiveG, weightedButtonParams());
        addView(row2, ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT, 0, 8, 0, 0);

        hplus.setOnClickListener(v -> showNetworkGuide("H+", "H+ (HSPA+) faz parte da família 3G. Se aparecer na lista do aparelho, procure uma opção que inclua HSPA, HSPA+ ou WCDMA/UMTS. Nem todo telefone mostra H+ separadamente."));
        threeG.setOnClickListener(v -> showNetworkGuide("3G", "Para usar 3G, procure uma opção que inclua WCDMA ou UMTS. A disponibilidade depende do aparelho, do chip, da operadora e da cobertura; algumas redes já encerraram o serviço 3G."));
        fourG.setOnClickListener(v -> showNetworkGuide("4G / LTE", "Para usar 4G, procure LTE ou 4G nas opções de rede. Em muitos aparelhos a seleção aparece combinada, como 5G/4G/3G automático. O nome e as opções variam por fabricante e operadora."));
        fiveG.setOnClickListener(v -> showNetworkGuide("5G", "Para usar 5G, procure NR ou 5G nas opções de rede. Isso só funcionará se o aparelho, o chip/plano e a cobertura da operadora oferecerem 5G; alguns aparelhos mostram 5G/4G/3G automático."));
        addSpace(10);
        addWhatsAppButton();
    }

    private void validateSavedCode() {
        if (requestInFlight) return;
        if (currentCode == null || currentCode.isEmpty()) {
            showActivationScreen("", "");
            return;
        }
        showCheckingScreen();
        sendLicenseRequest("/api/validate", currentCode, (response, error) -> {
            if (error != null) {
                showActivationScreen(simpleErrorMessage(error), currentCode);
                return;
            }
            lastValidatedAt = SystemClock.elapsedRealtime();
            showHome();
        });
    }

    private void activateCode(String rawCode) {
        String code = rawCode.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
        if (!code.matches("[0-9]{8}") && !code.matches("[A-Z0-9]{16}")) {
            showActivationScreen("Confira o código e tente novamente.", rawCode);
            return;
        }
        if (requestInFlight) return;
        showCheckingScreen();
        sendLicenseRequest("/api/activate", code, (response, error) -> {
            if (error != null) {
                showActivationScreen(simpleErrorMessage(error), rawCode);
                return;
            }
            currentCode = code;
            preferences.edit().putString("license_code", code).apply();
            lastValidatedAt = SystemClock.elapsedRealtime();
            showHome();
        });
    }

    private void sendLicenseRequest(String path, String code, LicenseCallback callback) {
        requestInFlight = true;
        executor.execute(() -> {
            JSONObject response = null;
            Exception failure = null;
            HttpURLConnection connection = null;
            try {
                URL url = new URL(API_BASE + path);
                connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setConnectTimeout(12_000);
                connection.setReadTimeout(12_000);
                connection.setDoOutput(true);
                connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                connection.setRequestProperty("Accept", "application/json");
                JSONObject payload = new JSONObject();
                payload.put("code", code);
                payload.put("deviceId", deviceIdHash());
                byte[] body = payload.toString().getBytes(StandardCharsets.UTF_8);
                connection.setFixedLengthStreamingMode(body.length);
                try (OutputStream output = connection.getOutputStream()) {
                    output.write(body);
                }
                int status = connection.getResponseCode();
                InputStream stream = status >= 200 && status < 300 ? connection.getInputStream() : connection.getErrorStream();
                String responseBody = readFully(stream);
                response = new JSONObject(responseBody);
                if (status < 200 || status >= 300) {
                    failure = new IllegalStateException(response.optString("message", "Não foi possível validar o código."));
                }
            } catch (Exception e) {
                failure = e;
            } finally {
                if (connection != null) connection.disconnect();
            }
            JSONObject finalResponse = response;
            Exception finalFailure = failure;
            mainHandler.post(() -> {
                requestInFlight = false;
                if (isFinishing() || isDestroyed()) return;
                if (finalFailure != null) {
                    String message = finalFailure instanceof IllegalStateException
                            ? finalFailure.getMessage()
                            : "Sem conexão com o serviço. Confira a internet e tente novamente.";
                    callback.complete(null, new IllegalStateException(message));
                } else {
                    callback.complete(finalResponse, null);
                }
            });
        });
    }

    private String deviceIdHash() throws Exception {
        String androidId = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
        if (androidId == null || androidId.trim().isEmpty()) {
            androidId = preferences.getString("fallback_device_id", null);
            if (androidId == null) {
                androidId = java.util.UUID.randomUUID().toString();
                preferences.edit().putString("fallback_device_id", androidId).apply();
            }
        }
        String input = getPackageName() + ":" + androidId;
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(input.getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder(digest.length * 2);
        for (byte value : digest) hex.append(String.format(Locale.ROOT, "%02x", value & 0xff));
        return hex.toString();
    }

    private String readFully(InputStream stream) throws Exception {
        if (stream == null) return "{}";
        try (InputStream input = stream; ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[2048];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            return output.toString("UTF-8");
        }
    }

    private void showNetworkGuide(String title, String message) {
        new AlertDialog.Builder(this)
                .setTitle(title + " · orientação")
                .setMessage(message + "\n\nNa próxima tela, selecione manualmente a opção compatível com seu aparelho.")
                .setNegativeButton("Voltar", (dialog, which) -> dialog.dismiss())
                .setPositiveButton("Abrir tela do aparelho", (dialog, which) -> openRadioInfo())
                .show();
    }

    private void openRadioInfo() {
        for (String component : RADIO_INFO_COMPONENTS) {
            try {
                Intent intent = new Intent();
                intent.setComponent(android.content.ComponentName.unflattenFromString(component));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
                return;
            } catch (ActivityNotFoundException | SecurityException | IllegalArgumentException ignored) {
                // Continue with the other component name used by Android variants.
            }
        }
        statusToast("Este aparelho bloqueou a tela avançada. Abra Configurações > Rede móvel para ver as opções disponíveis.");
    }

    private void openUrl(String url) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        } catch (ActivityNotFoundException e) {
            statusToast("Não foi possível abrir o link neste aparelho.");
        }
    }

    private void addWhatsAppButton() {
        Button whatsapp = createButton("Falar no WhatsApp", false);
        whatsapp.setOnClickListener(v -> openUrl(WHATSAPP_URL));
        addView(whatsapp, ViewGroup.LayoutParams.MATCH_PARENT, dp(54), 0, 8, 0, 0);
    }

    private void makeScreen() {
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(BLACK);
        content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setGravity(Gravity.CENTER_HORIZONTAL);
        content.setPadding(dp(22), dp(42), dp(22), dp(24));
        scroll.addView(content, new ScrollView.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        setContentView(scroll);
    }

    private void addLogoAndBrand() {
        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.goldmovel_logo);
        logo.setScaleType(ImageView.ScaleType.FIT_CENTER);
        addView(logo, dp(104), dp(104), 0, 0, 0, 8);
        TextView brand = addText("GOLD MÓVEL", 27, GOLD, true, Gravity.CENTER);
        brand.setLetterSpacing(0.12f);
        brand.setPadding(0, dp(2), 0, dp(4));
        addSpace(5);
    }

    private TextView addText(String text, int sizeSp, int color, boolean bold, int gravity) {
        TextView view = new TextView(this);
        view.setText(text);
        view.setTextSize(sizeSp);
        view.setTextColor(color);
        view.setGravity(gravity);
        if (bold) view.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        view.setLineSpacing(dp(2), 1.0f);
        addView(view, ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT, 0, 4, 0, 4);
        return view;
    }

    private Button createButton(String label, boolean primary) {
        Button button = new Button(this);
        button.setText(label);
        button.setAllCaps(false);
        button.setTextSize(15);
        button.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        button.setMinHeight(dp(50));
        button.setTextColor(primary ? Color.rgb(20, 18, 10) : GOLD);
        button.setBackgroundTintList(ColorStateList.valueOf(primary ? GOLD : CARD));
        return button;
    }

    private LinearLayout.LayoutParams weightedButtonParams() {
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(0, dp(68), 1f);
        params.setMargins(dp(4), dp(3), dp(4), dp(3));
        return params;
    }

    private void addView(View view, int width, int height, int left, int top, int right, int bottom) {
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(width, height);
        params.setMargins(dp(left), dp(top), dp(right), dp(bottom));
        content.addView(view, params);
    }

    private void addSpace(int height) {
        View space = new View(this);
        addView(space, 1, dp(height), 0, 0, 0, 0);
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private void statusToast(String message) {
        android.widget.Toast.makeText(this, message, android.widget.Toast.LENGTH_LONG).show();
    }

    private interface LicenseCallback {
        void complete(JSONObject response, Exception error);
    }

    private static final class ProgressBarCompat {
        static void add(Activity activity, LinearLayout parent) {
            android.widget.ProgressBar progress = new android.widget.ProgressBar(activity);
            int size = Math.round(48 * activity.getResources().getDisplayMetrics().density);
            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(size, size);
            params.gravity = Gravity.CENTER;
            params.topMargin = Math.round(18 * activity.getResources().getDisplayMetrics().density);
            parent.addView(progress, params);
        }
    }
}
