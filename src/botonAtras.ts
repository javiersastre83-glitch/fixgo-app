// Botón "atrás" de Android (la flecha o el gesto del sistema).
// La app es una sola página, así que Android no sabe a dónde volver: se lo decimos acá.
// Orden:
//   1) Si hay algo abierto encima (hoja, cartel, foto ampliada), lo cierra.
//   2) Si la pantalla tiene su propia flecha de volver, hace lo mismo que esa flecha.
//   3) Si no estás en Inicio (Urgencias, Perfil), va a Inicio.
//   4) En Inicio, minimiza la app (queda abierta en segundo plano, con la sesión iniciada).
// Las pantallas marcan sus controles con atributos:
//   data-capa    → algo abierto encima; tocar su fondo lo cierra (o su hijo data-cerrar)
//   data-volver  → la flecha de volver de la pantalla
//   data-tab-inicio (+ data-activa="1") → el botón Inicio de la barra de abajo
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'

const visible = (el: Element) => (el as HTMLElement).getClientRects().length > 0

function capaDeArriba(): HTMLElement | null {
  const capas = Array.from(document.querySelectorAll<HTMLElement>('[data-capa]')).filter(visible)
  let mejor: HTMLElement | null = null
  let mejorZ = -Infinity
  for (const c of capas) {
    const z = parseInt(getComputedStyle(c).zIndex, 10)
    const zi = Number.isNaN(z) ? 0 : z
    if (zi >= mejorZ) { mejorZ = zi; mejor = c } // a igual altura, gana la última
  }
  return mejor
}

// Devuelve qué hizo (sirve para probar). No depende de Android.
export function volverAtras(): 'capa' | 'volver' | 'inicio' | 'salir' {
  const capa = capaDeArriba()
  if (capa) {
    const cerrar = capa.querySelector<HTMLElement>('[data-cerrar]')
    ;(cerrar || capa).click()
    return 'capa'
  }
  const flechas = Array.from(document.querySelectorAll<HTMLElement>('[data-volver]')).filter(visible)
  if (flechas.length > 0) {
    flechas[flechas.length - 1].click()
    return 'volver'
  }
  const inicio = Array.from(document.querySelectorAll<HTMLElement>('[data-tab-inicio]')).filter(visible)[0]
  if (inicio && inicio.getAttribute('data-activa') !== '1') {
    inicio.click()
    return 'inicio'
  }
  return 'salir'
}

let iniciado = false
export function iniciarBotonAtras() {
  if (iniciado || !Capacitor.isNativePlatform()) return
  iniciado = true
  CapacitorApp.addListener('backButton', () => {
    try {
      if (volverAtras() === 'salir') CapacitorApp.minimizeApp()
    } catch (e) {
      console.error('Botón atrás:', e)
    }
  })
}

// Para pruebas automáticas (no hace nada por sí solo).
if (typeof window !== 'undefined') (window as any).__fixgoVolverAtras = volverAtras
