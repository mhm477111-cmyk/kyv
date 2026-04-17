"use client"

interface PackageCardProps {
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
  onSubscribe: (packageId: string) => void
}

export function PackageCard({
  data,
  minutes,
  messages,
  international,
  price,
  oldPrice,
  color,
  badge,
  badgeGradient,
  packageId,
  onSubscribe,
}: PackageCardProps) {
  return (
    <div
      className={`package-card ${oldPrice ? "package-card-discount" : ""}`}
      style={{
        borderColor: color,
        boxShadow: `0 0 15px ${color}33`,
      }}
    >
      {badge && (
        <div
          className="sale-badge"
          style={{ background: badgeGradient || `linear-gradient(45deg, ${color}, ${color}aa)` }}
        >
          {badge}
        </div>
      )}
      <h3 style={{ color, margin: "0 0 5px" }}>{data} 🌐</h3>
      <div className="text-[2.2rem] font-black text-gold-bright my-1.5">
        {oldPrice && (
          <span className="text-[#ff4d4d] line-through text-[0.85em] ml-2 opacity-70 font-normal">
            {oldPrice}ج
          </span>
        )}
        {price}
        <span className="text-[0.9rem] text-white">ج.م</span>
      </div>
      <div
        className="rounded-[10px] p-2.5 mb-3 text-[0.8rem] leading-relaxed text-[#ccc]"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        <div>📞 {minutes}</div>
        <div>📩 {messages}</div>
        {international && <div>🌍 {international}</div>}
      </div>
      <button
        onClick={() => onSubscribe(packageId)}
        className="w-full py-3 rounded-[10px] font-black text-[0.9rem] transition-all cursor-pointer border-none"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          color: color === "#ff3131" || color === "#9b51e0" ? "#fff" : "#000",
        }}
      >
        اشترك الآن
      </button>
    </div>
  )
}
