import Image from 'next/image'

export function Logo() {
  return (
    <Image
      src="/logo/grow-plus-lockup-dark-bg.svg"
      alt="GROW+"
      width={110}
      height={30}
      priority
    />
  )
}
