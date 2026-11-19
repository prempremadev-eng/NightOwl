package in.nightowl.app;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(BatteryHelpPlugin.class);
        super.onCreate(savedInstanceState);
        WebView web = getBridge() != null ? getBridge().getWebView() : null;

        // A new app version: forget the cached web pages once, so the new screens load (Prem, 13 Nov:
        // v1.1 still showed the old pages without the login).
        try {
            int build = getPackageManager().getPackageInfo(getPackageName(), 0).versionCode;
            SharedPreferences prefs = getSharedPreferences("nightowl", MODE_PRIVATE);
            if (prefs.getInt("cleared_for", 0) != build && web != null) {
                web.clearCache(true);
                prefs.edit().putInt("cleared_for", build).apply();
                web.reload();
            }
        } catch (Exception ignored) { }

        // Phone back button: inside the app go back a page; on a first page (login, the guard's own page,
        // the office Today page) close the app instead of going back to the empty start page.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView w = getBridge() != null ? getBridge().getWebView() : null;
                String url = w != null && w.getUrl() != null ? w.getUrl() : "";
                int i = url.indexOf('#');
                String hash = i >= 0 ? url.substring(i) : "";
                boolean first = hash.isEmpty() || hash.equals("#") || hash.startsWith("#guard/") || hash.equals("#applogin")
                        || hash.equals("#home") || hash.startsWith("#qr/");
                if (w != null && !first && w.canGoBack()) {
                    w.goBack();
                } else {
                    finish();
                }
            }
        });
    }
}
