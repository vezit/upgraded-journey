import { useState, useMemo } from 'react'

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  domain: string
}

export default function ServiceIcon({ domain, alt, className, ...rest }: Props) {
  const sources = useMemo(
    () => [
      `https://logo.clearbit.com/${domain}?size=128`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      '/img/default.svg',
    ],
    [domain]
  )

  const [index, setIndex] = useState(0)

  return (
    <img
      src={sources[index]}
      alt={alt}
      className={className}
      onError={() => setIndex((i) => Math.min(i + 1, sources.length - 1))}
      {...rest}
    />
  )
}
