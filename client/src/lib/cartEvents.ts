export const CART_UPDATED_EVENT = 'cart-updated'

export function notifyCartUpdated() {
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT))
}
