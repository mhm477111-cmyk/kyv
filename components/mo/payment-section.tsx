"use client"

export function PaymentSection() {
  const copyPay = (text: string, name: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        alert(
          `تم نسخ رقم ${name} بنجاح:\n${text}\n\nاستخدم الرقم الآن في تطبيقك لإتمام الدفع.`
        )
      },
      () => {
        alert(`رقم ${name} هو: ${text}`)
      }
    )
  }

  const shareSite = () => {
    if (navigator.share) {
      navigator.share({
        title: "MO CONTROL - باقات الاتصالات",
        text: "لقيت لك موقع بيعمل عروض على باقات (اتصالات_فودافون_وي)تحفة والدفع بعد التفعيل! جربه من هنا:",
        url: "https://mocontrol.online",
      })
    } else {
      navigator.clipboard.writeText("https://mocontrol.online")
      alert("تم نسخ رابط الموقع بنجاح، تقدر تبعته لصحابك دلوقتي! ✅")
    }
  }

  return (
    <section
      className="py-10 px-4 border-t-2"
      style={{
        background: "#000",
        borderColor: "rgba(212, 175, 55, 0.2)",
      }}
    >
      <div className="flex flex-wrap gap-6 max-w-[1100px] mx-auto justify-center items-stretch">
        {/* Share Card */}
        <div
          className="flex-1 min-w-[300px] p-8 rounded-[20px] text-center flex flex-col justify-center"
          style={{
            background: "#000",
            border: "1.5px solid #d4af37",
            boxShadow: "0 0 25px rgba(212, 175, 55, 0.1)",
          }}
        >
          <div
            className="text-[1.4rem] text-[#f9e29d] mb-2.5 font-black"
            style={{ textShadow: "0 0 10px rgba(212, 175, 55, 0.3)" }}
          >
            🚀 شارك العروض مع صحابك!
          </div>
          <p className="text-[#bbb] text-[13px] mb-6 leading-relaxed">
            عجبتك باقات MO CONTROL؟ متبخلش على حبايبك وخليهم يستفيدوا بأقوى
            التخفيضات والدفع بعد التفعيل.
          </p>
          <button
            onClick={shareSite}
            className="inline-flex items-center justify-center gap-2.5 px-10 py-3.5 rounded-full font-black cursor-pointer transition-all text-base text-black border-none"
            style={{
              background: "linear-gradient(45deg, #d4af37, #f9e29d)",
              boxShadow: "0 8px 20px rgba(212, 175, 55, 0.3)",
            }}
          >
            <span className="text-xl">🔗</span> شارك الموقع الآن
          </button>
        </div>

        {/* Payment Methods Card */}
        <div
          className="flex-1 min-w-[300px] p-8 rounded-[20px] text-center flex flex-col justify-center"
          style={{
            background: "#000",
            border: "1.5px solid #d4af37",
            boxShadow: "0 0 25px rgba(212, 175, 55, 0.1)",
          }}
        >
          <div className="text-[1.2rem] text-[#f9e29d] mb-1.5 font-extrabold">
            💳 طرق الدفع المعتمدة
          </div>
          <p className="text-[#888] text-[11px] mb-5">
            اضغط على أي وسيلة لنسخ البيانات والدفع فوراً 👇
          </p>
          <div
            className="flex flex-wrap justify-center gap-2.5"
            style={{ direction: "rtl" }}
          >
            <a
              href="https://ipn.eg/S/hamoibrahim212/instapay/8Waki0"
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline"
            >
              <div
                className="pay-chip-final px-4 py-2.5 rounded-xl font-bold text-[13px]"
                style={{
                  background: "#4a148c",
                  color: "#fff",
                  border: "1px solid #f9e29d",
                }}
              >
                انستا باي 💸
              </div>
            </a>
            <button
              onClick={() => copyPay("01282608730", "فودافون كاش")}
              className="pay-chip-final px-4 py-2.5 rounded-xl font-bold text-[13px]"
              style={{
                background: "#e60000",
                color: "#fff",
                border: "1px solid #f9e29d",
              }}
            >
              فودافون كاش 📱
            </button>
            <button
              onClick={() => copyPay("01282608730", "اتصالات كاش")}
              className="pay-chip-final px-4 py-2.5 rounded-xl font-bold text-[13px]"
              style={{
                background: "#008130",
                color: "#fff",
                border: "1px solid #f9e29d",
              }}
            >
              اتصالات كاش 💰
            </button>
            <button
              onClick={() => copyPay("01282608730", "أورنج كاش")}
              className="pay-chip-final px-4 py-2.5 rounded-xl font-bold text-[13px]"
              style={{
                background: "#ff6600",
                color: "#fff",
                border: "1px solid #f9e29d",
              }}
            >
              أورنج كاش 💎
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
