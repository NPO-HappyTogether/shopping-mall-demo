import { useCallback, useEffect, useState } from 'react'
import { CART_UPDATED_EVENT } from '@/lib/cartEvents'
import { fetchCart } from '@/lib/cartApi'
import { isLoggedIn } from '@/lib/authStorage'

export function useCart() {
  const [itemCount, setItemCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!isLoggedIn()) {
      setItemCount(0)
      return
    }
    setLoading(true)
    try {
      const cart = await fetchCart()
      setItemCount(cart.itemCount)
    } catch {
      setItemCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onUpdate = () => {
      void refresh()
    }
    window.addEventListener(CART_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(CART_UPDATED_EVENT, onUpdate)
  }, [refresh])

  return { itemCount, loading, refresh }
}
