"use client"

import Image from "next/image"
import { PackageCard } from "./package-card"

interface Package {
  data: string
  minutes: string
  messages: string
  international?: string
  price: number
  oldPrice?: number
  color: string
  badge?: string
  badgeGradient?: string
  packageId: string
}

interface ProviderSectionProps {
  name: string
  subName: string
  logo: string
  color: string
  packages: Package[]
  notice?: string
  noticeColor?: string
  onFeaturesClick: () => void
  onSubscribe: (packageId: string) => void
}

export function ProviderSection({
  name,
  subName,
  logo,
  color,
  packages,
  notice,
  noticeColor,
  onFeaturesClick,
  onSubscribe,
}: ProviderSectionProps) {
  return (
    <section className="mt-16">
      {/* Provider Header */}
      <div className="flex justify-center items-center mb-5 px-1.5">
        <div
          className="relative p-[3px] rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}, #fff, ${color})`,
            backgroundSize: "200% auto",
            animation: "glow-move 3s linear infinite",
            boxShadow: `0 0 40px ${color}80`,
          }}
        >
          <div className="bg-black py-3 px-8 rounded-full flex items-center gap-4 whitespace-nowrap">
            <Image
              src={logo}
              alt={`${name} Logo`}
              width={40}
              height={40}
              className="rounded-full border-2"
              style={{ borderColor: color }}
            />
            <h3
              className="m-0 text-[clamp(1.2rem,5vw,2.2rem)] font-black text-white uppercase tracking-[1px]"
              style={{ textShadow: "0 0 20px rgba(255,255,255,0.4)" }}
            >
              {name}{" "}
              <span style={{ color, textShadow: `0 0 15px ${color}e6` }}>
                {subName}
              </span>
            </h3>
          </div>
        </div>
      </div>

      {/* Features Button */}
      <button
        onClick={onFeaturesClick}
        className="cursor-pointer w-full bg-black py-3 text-center my-6 transition-all"
        style={{
          borderTop: `1px solid ${color}`,
          borderBottom: `1px solid ${color}`,
          boxShadow: `0 0 20px ${color}4d`,
        }}
      >
        <span
          className="text-white font-bold text-[13px] whitespace-nowrap"
          style={{ textShadow: `0 0 5px ${color}` }}
        >
          اضغط هنا لمعرفة مميزات وشروط الاشتراك ({subName}) 💡
        </span>
      </button>

      {/* Package Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {packages.map((pkg, index) => (
          <PackageCard key={index} {...pkg} onSubscribe={onSubscribe} />
        ))}
      </div>

      {/* Notice */}
      {notice && (
        <div
          className="mx-auto max-w-[420px] p-3 rounded-r-[10px] border-r-4"
          style={{
            background: `${noticeColor || color}0d`,
            borderColor: noticeColor || color,
            direction: "rtl",
          }}
        >
          <p
            className="m-0 text-[13px] font-semibold leading-relaxed"
            style={{ color: noticeColor || color }}
          >
            {notice}
          </p>
        </div>
      )}
    </section>
  )
}
