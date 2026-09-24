package com.fixgo.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugins propios de Fixgo (tienen que registrarse ANTES de super.onCreate)
        registerPlugin(InstallReferrerPlugin.class);
        registerPlugin(ResenaPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
