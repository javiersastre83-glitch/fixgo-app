import { registerPlugin } from '@capacitor/core'

// "Continuar con Apple": plugin propio de Fixgo, solo existe en iPhone
// (ios/App/App/FixgoAppleSignInPlugin.swift). Lo usan el ingreso (Login.tsx) y
// "Eliminar cuenta" (App.tsx): Apple exige que al borrar la cuenta se corte también
// el acceso de Apple, y para eso hace falta un código de autorización recién pedido.
export const FixgoAppleSignIn = registerPlugin<{
  authorize(opciones: { nonce?: string }): Promise<{
    identityToken: string
    authorizationCode?: string
    givenName?: string
    familyName?: string
    email?: string
  }>
}>('FixgoAppleSignIn')
