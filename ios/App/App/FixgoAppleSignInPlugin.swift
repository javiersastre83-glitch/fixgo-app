import Foundation
import UIKit
import Capacitor
import AuthenticationServices

// "Continuar con Apple" — plugin propio de Fixgo (solo iPhone).
// La pantalla de ingreso (src/Login.tsx) lo llama como FixgoAppleSignIn.authorize({ nonce }).
// Devuelve el identityToken de Apple, que la app le pasa a Supabase para abrir la sesión,
// y el authorizationCode, que se usa al eliminar la cuenta para cortar el acceso de Apple.
@objc(FixgoAppleSignInPlugin)
public class FixgoAppleSignInPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FixgoAppleSignInPlugin"
    public let jsName = "FixgoAppleSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "authorize", returnType: CAPPluginReturnPromise)
    ]

    private var llamadaEnCurso: CAPPluginCall?

    @objc func authorize(_ call: CAPPluginCall) {
        let request = ASAuthorizationAppleIDProvider().createRequest()
        request.requestedScopes = [.fullName, .email]
        request.nonce = call.getString("nonce")

        call.keepAlive = true
        llamadaEnCurso = call

        DispatchQueue.main.async {
            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }
    }

    private func terminar(_ accion: (CAPPluginCall) -> Void) {
        guard let call = llamadaEnCurso else { return }
        llamadaEnCurso = nil
        accion(call)
        bridge?.releaseCall(call)
    }
}

extension FixgoAppleSignInPlugin: ASAuthorizationControllerDelegate {
    public func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let credencial = authorization.credential as? ASAuthorizationAppleIDCredential,
              let tokenData = credencial.identityToken,
              let token = String(data: tokenData, encoding: .utf8) else {
            terminar { $0.reject("Apple no devolvió los datos de la cuenta.", "SIN_TOKEN") }
            return
        }
        var datos: [String: Any] = [
            "identityToken": token,
            "user": credencial.user
        ]
        if let codigoData = credencial.authorizationCode,
           let codigo = String(data: codigoData, encoding: .utf8) { datos["authorizationCode"] = codigo }
        if let email = credencial.email { datos["email"] = email }
        if let nombre = credencial.fullName?.givenName { datos["givenName"] = nombre }
        if let apellido = credencial.fullName?.familyName { datos["familyName"] = apellido }
        terminar { $0.resolve(datos) }
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        let codigo = (error as? ASAuthorizationError)?.code
        if codigo == .canceled {
            terminar { $0.reject("La persona canceló el ingreso.", "CANCELADO") }
        } else {
            terminar { $0.reject(error.localizedDescription, "ERROR_APPLE") }
        }
    }
}

extension FixgoAppleSignInPlugin: ASAuthorizationControllerPresentationContextProviding {
    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        return self.bridge?.viewController?.view.window ?? UIWindow()
    }
}
