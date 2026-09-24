package com.fixgo.app;

import com.android.installreferrer.api.InstallReferrerClient;
import com.android.installreferrer.api.InstallReferrerStateListener;
import com.android.installreferrer.api.ReferrerDetails;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Devuelve el "referrer" con el que se instaló Fixgo desde Google Play.
 * Ej: si la persona tocó https://play.google.com/store/apps/details?id=ar.fixgo.app&referrer=invitacion%3DABC
 * este plugin devuelve "invitacion=ABC". Así un invitado que instala la app por primera vez
 * entra directo a la obra, sin tener que volver a tocar el link.
 */
@CapacitorPlugin(name = "InstallReferrer")
public class InstallReferrerPlugin extends Plugin {

    @PluginMethod
    public void obtener(final PluginCall call) {
        final InstallReferrerClient client = InstallReferrerClient.newBuilder(getContext()).build();
        try {
            client.startConnection(new InstallReferrerStateListener() {
                private boolean respondido = false;

                @Override
                public void onInstallReferrerSetupFinished(int responseCode) {
                    if (respondido) return;
                    respondido = true;
                    JSObject ret = new JSObject();
                    try {
                        if (responseCode == InstallReferrerClient.InstallReferrerResponse.OK) {
                            ReferrerDetails det = client.getInstallReferrer();
                            ret.put("referrer", det.getInstallReferrer());
                            ret.put("instalacionSeg", det.getInstallBeginTimestampSeconds());
                        } else {
                            ret.put("referrer", "");
                            ret.put("codigoRespuesta", responseCode);
                        }
                    } catch (Exception e) {
                        ret.put("referrer", "");
                        ret.put("error", e.getMessage());
                    } finally {
                        try { client.endConnection(); } catch (Exception ignored) {}
                    }
                    call.resolve(ret);
                }

                @Override
                public void onInstallReferrerServiceDisconnected() {
                    if (respondido) return;
                    respondido = true;
                    JSObject ret = new JSObject();
                    ret.put("referrer", "");
                    ret.put("error", "desconectado");
                    call.resolve(ret);
                }
            });
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("referrer", "");
            ret.put("error", e.getMessage());
            call.resolve(ret);
        }
    }
}
