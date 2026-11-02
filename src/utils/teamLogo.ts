/** 5E merge_* images contain two 300px theme variants side by side. */
export function teamLogoUrl(logo: string | null | undefined): string {
  if (!logo) return ''
  try {
    const url = new URL(logo)
    if (url.protocol !== 'https:' || url.hostname !== 'oss.5eplay.com' ||
        !/\/merge_[^/]+\.(png|webp|jpe?g)$/i.test(url.pathname)) return logo
    // The schedule and follow list use light cards: choose the dark variant.
    url.searchParams.set('x-oss-process', 'image/indexcrop,x_300,i_0/resize,h_150,m_lfit')
    return url.toString()
  } catch {
    return logo
  }
}
