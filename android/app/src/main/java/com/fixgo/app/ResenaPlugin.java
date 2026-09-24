package com.fixgo.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.play.core.review.ReviewInfo;
import com.google.android.play.core.review.ReviewManager;
import com.google.android.play.core.review.ReviewManagerFactory;

/**
 * Pedido de reseña nativo de Google Play (la tarjetita de estrellas que aparece sobre la app).
 * Google decide si la muestra o no (tiene su propio límite de frecuencia), así que la app
 * nunca sabe si la persona calificó: solo sabe que el flujo terminó.
 */
@CapacitorPlugin(name = "Resena")
public class ResenaPlugin extends Plugin {

    @PluginMethod
    public void pedir(final PluginCall call) {
        try {
            final ReviewManager manager = ReviewManagerFactory.create(getContext());
            manager.requestReviewFlow().addOnCompleteListener(task -> {
                if (!task.isSuccessful() || getActivity() == null) {
                    JSObject ret = new JSObject();
                    ret.put("mostrado", false);
                    call.resolve(ret);
                    return;
                }
                ReviewInfo info = task.getResult();
                manager.launchReviewFlow(getActivity(), info).addOnCompleteListener(t -> {
                    JSObject ret = new JSObject();
                    ret.put("mostrado", true);
                    call.resolve(ret);
                });
            });
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("mostrado", false);
            ret.put("error", e.getMessage());
            call.resolve(ret);
        }
    }
}
