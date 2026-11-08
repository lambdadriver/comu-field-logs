package app.comufieldlogs;

/* COMU Field Logs by lambdadriver. GPL-3.0, no warranty; see LICENSE.
   ICS 214 Activity Log, ICS 309 Communications Log and T-Card Tracker.
   All pages are bundled in assets/www and served from one https origin
   (appassets.androidplatform.net) so they share storage (My Info, theme). */

import android.Manifest;
import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends Activity {
    static final String HOST = "appassets.androidplatform.net";
    static final String BASE = "https://" + HOST + "/assets/www/";
    static final String FOLDER = "COMU Field Logs";
    static final int REQ_FILE = 11, REQ_LOC = 12, REQ_STORAGE = 13;

    FrameLayout root;
    WebView web;
    ValueCallback<Uri[]> fileCallback;
    GeolocationPermissions.Callback geoCallback;
    String geoOrigin;
    String[] pendingSave;

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.WHITE);
        setContentView(root);
        setupWebView();

        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
                @Override public WindowInsets onApplyWindowInsets(View v, WindowInsets in) {
                    Insets i = in.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                    v.setPadding(i.left, i.top, i.right, i.bottom);
                    return WindowInsets.CONSUMED;
                }
            });
        }
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,
                new android.window.OnBackInvokedCallback() { @Override public void onBackInvoked() { handleBack(); } });
        }

        if (saved != null) web.restoreState(saved);
        if (web.getUrl() == null) web.loadUrl(BASE + "index.html");
    }

    void setupWebView() {
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setGeolocationEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setSupportZoom(false);
        s.setTextZoom(100);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        web.addJavascriptInterface(new Bridge(), "ComuAndroid");
        web.setWebViewClient(new LocalClient());
        web.setWebChromeClient(new Chrome());

    }

    @Override protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }

    /* ---------- back: dialog -> app main view -> home screen -> exit ---------- */
    void handleBack() {
        web.evaluateJavascript("(window.comuBack?comuBack():'exit')", new ValueCallback<String>() {
            @Override public void onReceiveValue(String v) { if (v == null || v.contains("exit")) finish(); }
        });
    }
    @SuppressWarnings("deprecation")
    @Override public void onBackPressed() { handleBack(); }

    /* ---------- serve bundled assets from one https origin; block everything else ---------- */
    static final Map<String, String> MIME = new HashMap<String, String>();
    static {
        MIME.put("html", "text/html"); MIME.put("js", "text/javascript"); MIME.put("css", "text/css");
        MIME.put("png", "image/png"); MIME.put("svg", "image/svg+xml"); MIME.put("json", "application/json");
        MIME.put("ico", "image/x-icon");
    }
    class LocalClient extends WebViewClient {
        @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
            Uri u = r.getUrl();
            String scheme = u.getScheme();
            if ("data".equals(scheme) || "blob".equals(scheme)) return null;
            if (HOST.equals(u.getHost()) && u.getPath() != null && u.getPath().startsWith("/assets/")) {
                String path = u.getPath().substring("/assets/".length());
                if (path.endsWith("/")) path += "index.html";
                String ext = path.contains(".") ? path.substring(path.lastIndexOf('.') + 1).toLowerCase() : "";
                String mime = MIME.containsKey(ext) ? MIME.get(ext) : "application/octet-stream";
                try {
                    InputStream in = getAssets().open(path);
                    WebResourceResponse res = new WebResourceResponse(mime, "utf-8", in);
                    Map<String, String> h = new HashMap<String, String>();
                    h.put("Cache-Control", "no-cache");
                    res.setResponseHeaders(h);
                    return res;
                } catch (Exception e) { /* fall through to 404 */ }
            }
            WebResourceResponse nf = new WebResourceResponse("text/plain", "utf-8", new ByteArrayInputStream(new byte[0]));
            nf.setStatusCodeAndReasonPhrase(404, "Not found (offline app)");
            return nf;
        }
        @Override public boolean onRenderProcessGone(WebView v, android.webkit.RenderProcessGoneDetail d) {
            /* The page renderer was killed (low memory) or crashed: rebuild the WebView instead of closing the app. */
            String url = v.getUrl();
            root.removeView(v); v.destroy();
            setupWebView();
            web.loadUrl(url != null && url.startsWith(BASE) ? url : BASE + "index.html");
            return true;
        }
        @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
            Uri u = r.getUrl();
            return !HOST.equals(u.getHost()); /* stay inside the bundled app */
        }
    }

    /* ---------- file chooser (Import JSON) and location prompt (ICS 214 GPS beta) ---------- */
    class Chrome extends WebChromeClient {
        @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
            if (fileCallback != null) fileCallback.onReceiveValue(null);
            fileCallback = cb;
            try {
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                startActivityForResult(Intent.createChooser(i, "Import JSON"), REQ_FILE);
            } catch (Exception e) { fileCallback = null; cb.onReceiveValue(null); return false; }
            return true;
        }
        @Override public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback cb) {
            if (hasLocation()) { cb.invoke(origin, true, false); return; }
            geoOrigin = origin; geoCallback = cb;
            requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, REQ_LOC);
        }
    }
    boolean hasLocation() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
            || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    @Override protected void onActivityResult(int req, int res, Intent data) {
        if (req == REQ_FILE && fileCallback != null) {
            Uri[] r = null;
            if (res == RESULT_OK && data != null && data.getData() != null) r = new Uri[]{data.getData()};
            fileCallback.onReceiveValue(r);
            fileCallback = null;
            return;
        }
        super.onActivityResult(req, res, data);
    }

    @Override public void onRequestPermissionsResult(int req, String[] perms, int[] results) {
        if (req == REQ_LOC && geoCallback != null) {
            geoCallback.invoke(geoOrigin, hasLocation(), false);
            geoCallback = null;
        } else if (req == REQ_STORAGE && pendingSave != null) {
            String[] p = pendingSave; pendingSave = null;
            writeFile(p[0], p[1], p[2]);
        }
    }

    /* ---------- exports: save to Downloads/COMU Field Logs ---------- */
    void writeFile(String name, String mime, String b64) {
        try {
            byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
            String clean = name.replaceAll("[\\\\/:*?\"<>|]", "_");
            String type = mime == null ? "application/octet-stream" : mime.split(";")[0].trim();
            if (Build.VERSION.SDK_INT >= 29) {
                ContentResolver cr = getContentResolver();
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.MediaColumns.DISPLAY_NAME, clean);
                cv.put(MediaStore.MediaColumns.MIME_TYPE, type);
                cv.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/" + FOLDER);
                Uri uri = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                OutputStream os = cr.openOutputStream(uri);
                os.write(bytes); os.close();
                toast("Saved to Downloads/" + FOLDER + "/" + clean);
            } else {
                File dir;
                if (checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED) {
                    dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), FOLDER);
                } else {
                    dir = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), FOLDER);
                }
                dir.mkdirs();
                File f = new File(dir, clean);
                FileOutputStream os = new FileOutputStream(f);
                os.write(bytes); os.close();
                toast("Saved to " + f.getAbsolutePath());
            }
        } catch (Exception e) {
            toast("Could not save " + name + ": " + e.getMessage());
        }
    }
    void toast(final String msg) {
        runOnUiThread(new Runnable() { @Override public void run() { Toast.makeText(MainActivity.this, msg, Toast.LENGTH_LONG).show(); } });
    }

    /* ---------- bridge used by shell.js ---------- */
    class Bridge {
        @JavascriptInterface public void print(final String title) {
            runOnUiThread(new Runnable() { @Override public void run() {
                try {
                    PrintManager pm = (PrintManager) getSystemService(PRINT_SERVICE);
                    String job = (title == null || title.isEmpty()) ? "COMU Field Logs" : title;
                    PrintDocumentAdapter ad = web.createPrintDocumentAdapter(job);
                    pm.print(job, ad, new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.NA_LETTER).build());
                } catch (Exception e) { toast("Printing is not available: " + e.getMessage()); }
            }});
        }
        @JavascriptInterface public void saveFile(final String name, final String mime, final String b64) {
            runOnUiThread(new Runnable() { @Override public void run() {
                if (Build.VERSION.SDK_INT < 29 && checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                    pendingSave = new String[]{name, mime, b64};
                    requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, REQ_STORAGE);
                } else writeFile(name, mime, b64);
            }});
        }
        @JavascriptInterface public void keepScreenOn(final boolean on) {
            runOnUiThread(new Runnable() { @Override public void run() {
                if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            }});
        }
        @JavascriptInterface public void setBars(final String color) {
            runOnUiThread(new Runnable() { @Override public void run() {
                try {
                    int c = Color.parseColor(color.trim());
                    root.setBackgroundColor(c);
                    boolean light = (0.299 * Color.red(c) + 0.587 * Color.green(c) + 0.114 * Color.blue(c)) > 150;
                    if (Build.VERSION.SDK_INT >= 30) {
                        WindowInsetsController wic = getWindow().getInsetsController();
                        if (wic != null) {
                            int m = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                            wic.setSystemBarsAppearance(light ? m : 0, m);
                        }
                    } else {
                        getWindow().setStatusBarColor(c);
                        if (Build.VERSION.SDK_INT >= 23) {
                            View d = getWindow().getDecorView();
                            int f = d.getSystemUiVisibility();
                            f = light ? (f | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR) : (f & ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
                            d.setSystemUiVisibility(f);
                        }
                    }
                } catch (Exception e) { /* ignore bad colors */ }
            }});
        }
        @JavascriptInterface public String appVersion() { return "1.1"; }
    }
}
