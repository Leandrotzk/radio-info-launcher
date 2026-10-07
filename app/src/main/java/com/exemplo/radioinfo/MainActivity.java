package com.exemplo.radioinfo;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

public final class MainActivity extends Activity {
    private static final String[][] RADIO_INFO_COMPONENTS = {
            {"com.android.settings", "com.android.settings.RadioInfo"},
            {"com.android.phone", "com.android.phone.settings.RadioInfo"}
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        boolean launched = false;
        for (String[] component : RADIO_INFO_COMPONENTS) {
            try {
                Intent intent = new Intent();
                intent.setClassName(component[0], component[1]);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
                launched = true;
                break;
            } catch (ActivityNotFoundException | SecurityException | IllegalArgumentException ignored) {
                // Try the next known RadioInfo component used by Android variants.
            }
        }

        if (!launched) {
            Toast.makeText(
                    this,
                    "Não foi possível abrir as configurações de rádio neste aparelho.",
                    Toast.LENGTH_LONG
            ).show();
        }
        finish();
    }
}
