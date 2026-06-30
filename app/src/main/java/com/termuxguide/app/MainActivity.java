package com.termuxguide.app;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Dessiner sous les barres système pour un rendu "plein écran" propre.
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setTextZoom(100);

        webView.setWebViewClient(new WebViewClient());
        webView.addJavascriptInterface(new WebAppInterface(this), "Android");
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        // On laisse d'abord l'application web gérer le retour (fermer un détail,
        // une recherche, etc.). Si elle ne le gère pas, on quitte.
        webView.evaluateJavascript(
                "(function(){ try { return window.handleBack ? window.handleBack() : false; } catch(e){ return false; } })();",
                value -> {
                    if (!"true".equals(value)) {
                        if (webView.canGoBack()) {
                            webView.goBack();
                        } else {
                            finish();
                        }
                    }
                });
    }

    /** Pont JavaScript -> Android pour le presse-papiers et les notifications. */
    public static class WebAppInterface {
        private final Context context;

        WebAppInterface(Context c) {
            context = c;
        }

        @JavascriptInterface
        public void copy(String text) {
            ClipboardManager cb =
                    (ClipboardManager) context.getSystemService(Context.CLIPBOARD_SERVICE);
            if (cb != null) {
                cb.setPrimaryClip(ClipData.newPlainText("Commande Termux", text));
            }
        }

        @JavascriptInterface
        public void toast(String text) {
            Toast.makeText(context, text, Toast.LENGTH_SHORT).show();
        }
    }
}
