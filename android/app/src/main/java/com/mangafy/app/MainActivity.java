package com.mangafy.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        try {
            if (this.bridge != null && this.bridge.getWebView() != null) {
                WebSettings settings = this.bridge.getWebView().getSettings();
                settings.setJavaScriptCanOpenWindowsAutomatically(true);
                settings.setSupportMultipleWindows(true);
                
                // Remove WebView signature so Google OAuth allows in-app login
                String userAgent = settings.getUserAgentString();
                if (userAgent != null) {
                    String cleanUserAgent = userAgent
                        .replaceAll(";\\s*wv", "")
                        .replaceAll("Version\\/[0-9\\.]+\\s*", "");
                    settings.setUserAgentString(cleanUserAgent);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
