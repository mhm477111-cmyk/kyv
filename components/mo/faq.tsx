const faqs = [
  {
    question: "هل التفعيل آمن؟ 🛡️",
    answer: "نعم، التفعيل رسمي وآمن تماماً على خطك وضمان MO CONTROL.",
  },
  {
    question: "متى يتم الدفع؟ 💰",
    answer: "يتم الدفع بعد التأكد من وصول الباقة وتجربة سرعة الإنترنت بنفسك.",
  },
]

export function FAQ() {
  return (
    <section className="my-8">
      <div className="text-[1.8rem] font-extrabold text-[#f9e29d] text-center mb-4 flex items-center justify-center gap-2.5">
        ❓ الأسئلة الشائعة
      </div>
      <div className="max-w-[600px] mx-auto">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="p-3 rounded-xl mb-2.5 text-right"
            style={{
              background: "#0d0d0d",
              border: "1px solid rgba(212, 175, 55, 0.2)",
            }}
          >
            <h4 className="text-[#f9e29d] m-0 mb-1.5 text-base">{faq.question}</h4>
            <p
              className="text-[#ccc] text-[0.85rem] m-0 pr-2.5"
              style={{ borderRight: "2px solid #d4af37" }}
            >
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
