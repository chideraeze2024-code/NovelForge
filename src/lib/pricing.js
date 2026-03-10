export const PACKAGES = [
  { chapters: 30, price: 10000, label: 'Starter' },
  { chapters: 40, price: 15000, label: 'Writer' },
  { chapters: 50, price: 20000, label: 'Author' },
  { chapters: 60, price: 25000, label: 'Pro' },
  { chapters: 70, price: 30000, label: 'Master' },
]

export function getPackage(chapters) {
  return PACKAGES.find(p => p.chapters === chapters)
}

export function calculatePrice(chapters, discountPercent = 0) {
  const pkg = getPackage(chapters)
  if (!pkg) return null
  const discount = Math.round(pkg.price * (discountPercent / 100))
  return {
    original: pkg.price,
    discount,
    final: pkg.price - discount,
    discountPercent,
  }
}

export const GENRES = [
  { id: 'billionaire', label: 'Billionaire Romance', emoji: '💎', color: '#C9A84C' },
  { id: 'werewolf', label: 'Werewolf', emoji: '🐺', color: '#7B5EA7' },
  { id: 'mafia', label: 'Mafia Romance', emoji: '🔫', color: '#C0392B' },
  { id: 'dark', label: 'Dark Romance', emoji: '🖤', color: '#6B3A5A' },
  { id: 'fantasy', label: 'Fantasy Romance', emoji: '✨', color: '#1A6B5A' },
  { id: 'ceo', label: 'CEO Romance', emoji: '👔', color: '#1A4A7A' },
  { id: 'campus', label: 'Campus Romance', emoji: '🎓', color: '#C0784A' },
]
