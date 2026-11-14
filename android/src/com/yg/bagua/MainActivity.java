package com.yg.bagua;

import android.app.Activity;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private static final String BG = "#0e1210";
    private WebView web;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        try {
            getWindow().setStatusBarColor(Color.parseColor(BG));
            getWindow().setNavigationBarColor(Color.parseColor(BG));
        } catch (Throwable ignored) { }

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor(BG));
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(false);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        try {
            s.setAllowFileAccessFromFileURLs(true);
            s.setAllowUniversalAccessFromFileURLs(true);
        } catch (Throwable ignored) { }

        web.addJavascriptInterface(new Chrome(), "Android");
        web.setWebViewClient(new WebViewClient());
        setContentView(web);
        web.loadUrl("file:///android_asset/index.html");
    }

    /** 供页面调用：配色切换时同步系统栏颜色与图标明暗 */
    private class Chrome {
        @JavascriptInterface
        public void setChrome(final String color, final boolean lightIcons) {
            runOnUiThread(new Runnable() {
                public void run() {
                    try {
                        int c = Color.parseColor(color);
                        getWindow().setStatusBarColor(c);
                        getWindow().setNavigationBarColor(c);
                        View dv = getWindow().getDecorView();
                        int flags = dv.getSystemUiVisibility();
                        if (lightIcons) flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                        else flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                        if (Build.VERSION.SDK_INT >= 26) {
                            if (lightIcons) flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                            else flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                        }
                        dv.setSystemUiVisibility(flags);
                    } catch (Throwable ignored) { }
                }
            });
        }
    }

    @Override
    public boolean onKeyDown(int code, KeyEvent e) {
        if (code == KeyEvent.KEYCODE_BACK && web != null && web.canGoBack()) {
            web.goBack();
            return true;
        }
        return super.onKeyDown(code, e);
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.setVisibility(View.GONE);
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
