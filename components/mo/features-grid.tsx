export function FeaturesGrid() {
  const stats = [
    { value: "+5000", label: "تفعيل ناجح" },
    { value: "+1200", label: "عميل دائم" },
    { value: "100%", label: "ضمان أمان" },
  ]

  const features = [
    {
      icon: (
        <svg
          fill="none"
          height="22"
          stroke="#d4af37"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          width="22"
        >
          <line x1="22" x2="11" y1="2" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      ),
      label: "اطلب التفعيل",
    },
    {
      icon: (
        <svg
          fill="none"
          height="22"
          stroke="#d4af37"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          width="22"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      ),
      label: "تأكد من الخدمه",
    },
    {
      icon: (
        <svg
          fill="none"
          height="22"
          stroke="#d4af37"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          width="22"
        >
          <rect height="14" rx="2" width="20" x="2" y="5"></rect>
          <line x1="2" x2="22" y1="10" y2="10"></line>
        </svg>
      ),
      label: "حول المبلغ",
    },
  ]

  return (
    <div
      className="grid grid-cols-3 gap-3 mt-5"
      style={{ direction: "rtl" }}
    >
      {stats.map((stat, index) => (
        <div
          key={index}
          className="feature-card p-4 rounded-[15px] text-center"
          style={{
            background: "linear-gradient(145deg, #111, #000)",
            border: "1px solid rgba(212, 175, 55, 0.3)",
            boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
          }}
        >
          <div
            className="text-[#d4af37] text-[1.2rem] font-black"
            style={{ textShadow: "0 0 10px rgba(212, 175, 55, 0.3)" }}
          >
            {stat.value}
          </div>
          <div className="text-[#aaa] text-[0.7rem] mt-1.5 tracking-[0.5px]">
            {stat.label}
          </div>
        </div>
      ))}

      {features.map((feature, index) => (
        <div
          key={index}
          className="feature-card p-4 rounded-[15px] text-center"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(212, 175, 55, 0.2)",
          }}
        >
          <div
            className="w-[45px] h-[45px] rounded-full flex items-center justify-center mx-auto mb-2.5"
            style={{ background: "rgba(212, 175, 55, 0.1)" }}
          >
            {feature.icon}
          </div>
          <div className="text-white text-[0.75rem] font-semibold">
            {feature.label}
          </div>
        </div>
      ))}
    </div>
  )
}
