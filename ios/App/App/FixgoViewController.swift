import UIKit
import Capacitor

// Pantalla principal de la app: es la de Capacitor más los plugins propios de Fixgo.
class FixgoViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(FixgoAppleSignInPlugin())
    }
}
