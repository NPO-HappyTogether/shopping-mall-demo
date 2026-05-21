export type Product = {
  id?: string
  name: string
  price: string
  originalPrice?: string
  badge?: string
  image: string
  category?: string
}

export type Brand = {
  name: string
  color: string
}

export type ServiceItem = {
  title: string
  desc: string
}

export const BRANDS: Brand[] = [
  { name: 'Zara', color: '#fce4ec' },
  { name: 'H&M', color: '#e3f2fd' },
  { name: 'Mango', color: '#fff3e0' },
  { name: 'COS', color: '#f3e5f5' },
  { name: 'Uniqlo', color: '#e8f5e9' },
  { name: 'Massimo Dutti', color: '#fff8e1' },
]

export const SERVICES: ServiceItem[] = [
  { title: 'Free Shipping', desc: 'On orders over $100' },
  { title: 'Easy Returns', desc: '30-day return policy' },
  { title: 'Secure Payment', desc: '100% secure checkout' },
  { title: '24/7 Support', desc: 'Dedicated support' },
]

export const FOOTER_LINKS = {
  help: ['FAQ', 'Shipping', 'Returns', 'Contact'],
  company: ['About', 'Careers', 'Press'],
} as const
