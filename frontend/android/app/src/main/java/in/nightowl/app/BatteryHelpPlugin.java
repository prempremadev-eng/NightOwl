package in.nightowl.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// 🔋 v3 (Prem, 19 Nov): battery savers (Xiaomi, Oppo, Vivo, Realme…) hold back notifications.
// status(): is NightOwl already free from battery saving, and which phone brand.
// open(): Android's "Allow NightOwl to run in background?" box; if a phone does not have it, the app's settings page.
@CapacitorPlugin(name = "BatteryHelp")
public class BatteryHelpPlugin extends Plugin {
    @PluginMethod
    public void status(PluginCall call) {
        JSObject r = new JSObject();
        boolean free = true;
        try {
            PowerManager pm = (PowerManager) getContext().getSystemService(android.content.Context.POWER_SERVICE);
            if (pm != null && Build.VERSION.SDK_INT >= 23) free = pm.isIgnoringBatteryOptimizations(getContext().getPackageName());
        } catch (Exception ignored) { }
        r.put("free", free);
        r.put("brand", String.valueOf(Build.MANUFACTURER).toLowerCase());
        call.resolve(r);
    }

    @PluginMethod
    public void open(PluginCall call) {
        String pkg = getContext().getPackageName();
        try {
            Intent i = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + pkg));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        } catch (Exception e) {
            try {
                Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + pkg));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
            } catch (Exception ignored) { }
        }
        call.resolve();
    }

    @PluginMethod
    public void appSettings(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        } catch (Exception ignored) { }
        call.resolve();
    }
}
