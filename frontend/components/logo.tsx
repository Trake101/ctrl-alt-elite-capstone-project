import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

export function Logo({
  className,
  theme,
  href = "/dashboard",
}: {
  className?: string
  theme?: "dark" | "light"
  href?: string
}) {
  const width = 103
  const height = 18
  const alt = "Logo Forecastr"

  return (
    <Link href={href} className={cn("flex flex-shrink-0", className)}>
      <Image
        width={width}
        height={height}
        src="/assets/logo.svg"
        className={cn(
          !theme && "block dark:hidden w-auto h-full",
          theme === "dark" && "hidden"
        )}
        alt={alt}
      />
      <Image
        width={width}
        height={height}
        src="/assets/logo-white.svg"
        className={cn(
          !theme && "hidden dark:block w-auto h-full",
          theme === "light" && "hidden"
        )}
        alt={alt}
      />
    </Link>
  )
}

