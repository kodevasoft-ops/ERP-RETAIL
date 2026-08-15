import type { CartItem } from "./cart.store";

function money(n: number) {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

/** Arma el texto del pedido tal como lo recibirá el vendedor por WhatsApp. */
export function construirMensajePedido(items: CartItem[], nombreTienda: string): string {
  const lineas = items.map(
    (i) => `• ${i.cantidad}x ${i.productoNombre} (${i.talla}/${i.color}) — ${money(i.precioVenta * i.cantidad)}`,
  );
  const total = items.reduce((sum, i) => sum + i.precioVenta * i.cantidad, 0);

  return [
    `¡Hola! Quiero hacer este pedido en *${nombreTienda}*:`,
    "",
    ...lineas,
    "",
    `*Total: ${money(total)}*`,
  ].join("\n");
}

/**
 * Abre WhatsApp (app nativa en móvil, WhatsApp Web en desktop) con el
 * mensaje del pedido precargado — el cliente solo tiene que presionar
 * enviar. `wa.me` es el deep link oficial de Meta, funciona sin API
 * de negocio ni credenciales especiales.
 */
export function abrirPedidoPorWhatsApp(numeroWhatsapp: string, items: CartItem[], nombreTienda: string) {
  const mensaje = construirMensajePedido(items, nombreTienda);
  const numeroLimpio = numeroWhatsapp.replace(/\D/g, ""); // solo dígitos, formato E.164 sin '+'
  const url = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
