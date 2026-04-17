const reviews = [
  {
    text: "بصراحة كنت خايفة في الأول بس التفعيل تم في ثواني والباقة حقيقية جداً.. شكراً ليكم ✨",
    name: "سارة كامل 🌸",
    color: "#ff69b4",
  },
  {
    text: "أحلى حاجة إنهم محترمين جداً في التعامل والنت بقى سريع وموفر معايا أوي 🎀",
    name: "نور الهدى",
    color: "#ff69b4",
  },
  {
    text: "أهم حاجة المصداقية، فعلت الأول وبعدين دفعت، شغل عالي يا وحوش ⚡",
    name: "إبراهيم سعد.",
    color: "#d4af37",
  },
  {
    text: "جربت شركات كتير بس MO CONTROL فعلاً أسرع وأرخص باقات جربتها 💗",
    name: "مريم محمود",
    color: "#ff69b4",
  },
  {
    text: "نظام التفعيل أولاً ده بجد يطمن أي حد، تسلم ايديكوا يا رجالة 👍",
    name: "عمر حسن",
    color: "#d4af37",
  },
]

export function Reviews() {
  return (
    <div
      className="my-6 p-4 rounded-[20px]"
      style={{
        background: "#000",
        border: "1px solid #d4af37",
        direction: "rtl",
        boxShadow: "inset 0 0 15px rgba(212, 175, 55, 0.1)",
      }}
    >
      <div className="text-center text-[#f9e29d] font-black text-[1.3rem] mb-4">
        ⭐ تجارب عملائنا الحقيقية
      </div>
      <div className="reviews-scroll-box flex overflow-x-auto gap-3 pb-4">
        {reviews.map((review, index) => (
          <div
            key={index}
            className="min-w-[220px] p-4 rounded-[15px] flex-shrink-0"
            style={{
              background: "#0d0d0d",
              border: `1px solid ${review.color}70`,
            }}
          >
            <div className="text-[#f9e29d] text-[0.8rem]">⭐⭐⭐⭐⭐</div>
            <p className="text-white text-[0.85rem] my-2.5 leading-relaxed">
              {review.text}
            </p>
            <div
              className="text-[0.75rem] font-bold text-left"
              style={{ color: review.color }}
            >
              - {review.name}
            </div>
          </div>
        ))}
      </div>
      <div className="text-center text-[#d4af37] text-[0.75rem] mt-1.5">
        👉 اسحب لمشاهدة المزيد من التجارب 👈
      </div>
    </div>
  )
}
