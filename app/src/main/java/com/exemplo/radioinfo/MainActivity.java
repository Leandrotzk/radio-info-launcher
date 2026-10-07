package com.exemplo.radioinfo;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

public final class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            Intent intent = new Intent();
            intent.setClassName("com.android.settings", "com.android.settings.RadioInfo");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        } catch (ActivityNotFoundException | SecurityException | IllegalArgumentException e) {
            Toast.makeText(
                    this,
                    "Não foi possível abrir as configurações de rádio neste aparelho.",
                    Toast.LENGTH_LONG
            ).show();
        } finally {
            finish();
        }
    }
}
