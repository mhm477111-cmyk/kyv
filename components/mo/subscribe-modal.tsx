"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface SubscribeModalProps {
  isOpen: boolean
  onClose: () => void
  selectedPackage?: string
}

export function SubscribeModal({
  isOpen,
  onClose,
  selectedPackage,
}: SubscribeModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    target: "",
    package: selectedPackage || "",
    renewalDate: "",
    subscriptionType: "new", // 'new' أو 'renewal'
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [status, setStatus] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (selectedPackage) {
      setFormData((prev) => ({ ...prev, package: selectedPackage }))
    }
  }, [selectedPackage])

  const copyVodaNum = () => {
    navigator.clipboard.writeText("01282608730")
    alert("تم نسخ الرقم بنجاح ✅\n01282608730")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const botToken = "8623372347:AAGCq4fkye4GqUEzK5uaK4xv4rOlYYgfiCU"
    const chatId = "6800873609"

    const subscriptionTypeText =
      formData.subscriptionType === "new" ? "✅ اشتراك جديد (أول مرة)" : "🔄 تجديد باقة حالية"

    const msg = `🚀 حجز جديد - MO CONTROL
━━━━━━━━━━━━━━━
📋 نوع الطلب: ${subscriptionTypeText}
👤 الاسم: ${formData.name}
📞 واتساب: ${formData.whatsapp}
📱 رقم الشحن: ${formData.target}
📦 الباقة: ${formData.package}
📅 موعد التجديد: ${formData.renewalDate}
━━━━━━━━━━━━━━━
💬 شات الواتساب:
https://wa.me/2${formData.whatsapp}`

    try {
      if (imageFile) {
        setStatus("⏳ جاري رفع الوصل...")
        const fd = new FormData()
        fd.append("chat_id", chatId)
        fd.append("caption", msg)
        fd.append("photo", imageFile)
        await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
          method: "POST",
          body: fd,
        })
      } else {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: msg }),
        })
      }

      window.open(
        `https://wa.me/201112893086?text=${encodeURIComponent(
          `أهلاً MO CONTROL، أنا ${formData.name} طلبت (${subscriptionTypeText}) لباقة (${formData.package}) وتجديدي يوم ${formData.renewalDate} متاح المراجعه الان☺️`
        )}`,
        "_blank"
      )

      setShowSuccess(true)
    } catch {
      alert("حدث خطأ، حاول مجدداً")
    }

    setIsSubmitting(false)
  }

  if (!isOpen) return null

  return (
    <div className="mo-modal-overlay" onClick={onClose} style={{ direction: "rtl" }}>
      <div className="mo-form-card" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-white text-xl cursor-pointer z-10 bg-transparent border-none"
        >
          ✕
        </button>

        {!showSuccess ? (
          <div className="p-1">
            <div className="text-center mb-4">
              <h2 className="text-[#ffcc00] m-0 font-black text-[28px] tracking-tight">MO CONTROL</h2>
              <p className="text-[#aaa] text-[11px]">عالم من السرعة.. تفعيل باقاتك بالضمان 😊</p>
            </div>

            {/* Payment Options */}
            <div className="flex gap-2 mb-4">
              <button type="button" onClick={copyVodaNum} className="flex-1 flex flex-col items-center justify-center py-2 rounded-xl bg-[#0a0a0a] border border-[#d4af37]/30 hover:border-[#d4af37] transition-all">
                <span className="text-[#aaa] text-[10px]">محفظة كاش</span>
                <b className="text-[#f9e29d] text-[13px]">01282608730</b>
                <span className="text-[8px] text-[#d4af37] font-bold">نسخ الرقم ✨</span>
              </button>
              <a href="https://ipn.eg/S/hamoibrahim212/instapay/8Waki0" target="_blank" className="flex-1 no-underline">
                <div className="flex flex-col items-center justify-center py-2 rounded-xl bg-[#0a0a0a] border border-[#d4af37]/30 hover:border-[#d4af37] transition-all h-full">
                  <Image src="https://c.top4top.io/p_3752uliqp1.png" alt="InstaPay" width={50} height={25} style={{ objectFit: "contain" }} />
                  <span className="text-[8px] text-[#d4af37] font-bold mt-1">عبر انستا باي 🔗</span>
                </div>
              </a>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              
              {/* التعديل الجديد: نوع الطلب بشكل احترافي للموبايل */}
              <div className="bg-[#111] p-2 rounded-2xl border border-[#333]">
                <label className="block text-[#ffcc00] text-[13px] font-bold mb-2 text-center">ما هو نوع طلبك؟</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`flex items-center justify-center p-2.5 rounded-xl cursor-pointer transition-all border ${formData.subscriptionType === 'new' ? 'bg-[#ffcc00] border-[#ffcc00] text-black' : 'bg-transparent border-[#333] text-gray-400'}`}>
                    <input type="radio" name="subType" value="new" className="hidden" checked={formData.subscriptionType === 'new'} onChange={() => setFormData({...formData, subscriptionType: 'new'})} />
                    <span className="text-[12px] font-bold italic">اشتراك أول مرة</span>
                  </label>
                  <label className={`flex items-center justify-center p-2.5 rounded-xl cursor-pointer transition-all border ${formData.subscriptionType === 'renewal' ? 'bg-[#ffcc00] border-[#ffcc00] text-black' : 'bg-transparent border-[#333] text-gray-400'}`}>
                    <input type="radio" name="subType" value="renewal" className="hidden" checked={formData.subscriptionType === 'renewal'} onChange={() => setFormData({...formData, subscriptionType: 'renewal'})} />
                    <span className="text-[12px] font-bold italic">تجديد باقة</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="text-right">
                  <label className="block text-[#eee] text-[13px] mb-1 mr-1">الاسم بالكامل</label>
                  <input type="text" placeholder="اكتب اسمك الحقيقي" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 bg-[#111] border border-[#333] text-white rounded-xl text-[13px] outline-none focus:border-[#ffcc00]" />
                </div>

                <div className="text-right">
                  <label className="block text-[#eee] text-[13px] mb-1 mr-1">رقم الواتساب</label>
                  <input type="tel" placeholder="01xxxxxxxxx" required maxLength={11} value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value.replace(/[^0-9]/g, "") })} className="w-full p-3 bg-[#111] border border-[#333] text-white rounded-xl text-[13px] outline-none focus:border-[#ffcc00]" />
                </div>

                <div className="text-right">
                  <label className="block text-[#ffcc00] text-[13px] font-bold mb-1 mr-1">الرقم المراد تفعيله</label>
                  <input type="tel" placeholder="01xxxxxxxxx" required maxLength={11} value={formData.target} onChange={(e) => setFormData({ ...formData, target: e.target.value.replace(/[^0-9]/g, "") })} className="w-full p-3 bg-[#111] border border-[#ffcc00]/50 text-white rounded-xl text-[13px] outline-none focus:border-[#ffcc00]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="text-right">
                  <label className="block text-[#eee] text-[12px] mb-1">الشبكة والباقة</label>
                  <select required value={formData.package} onChange={(e) => setFormData({ ...formData, package: e.target.value })} className="w-full p-3 bg-[#111] border border-[#333] text-white rounded-xl text-[11px] outline-none">
                    <option value="" disabled>اختر الباقة</option>
                    <optgroup label="🟢 ETISALAT">
                      <option value="Eti_20GB">EMERALD - 20GB</option>
                      <option value="Eti_40GB">EMERALD - 40GB</option>
                    </optgroup>
                    <optgroup label="🔴 VODAFONE">
                      <option value="Voda_20GB">VODA - 20GB</option>
                      <option value="Voda_40GB">VODA - 40GB</option>
                    </optgroup>
                  </select>
                </div>
                <div className="text-right">
                  <label className="block text-[#eee] text-[12px] mb-1">يوم التجديد</label>
                  <select required value={formData.renewalDate} onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })} className="w-full p-3 bg-[#111] border border-[#333] text-white rounded-xl text-[11px] outline-none">
                    <option value="" disabled>اختر اليوم</option>
                    {[...Array(31)].map((_, i) => (
                      <option key={i+1} value={i+1}>يوم {i+1}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-right">
                <label className="block text-[#eee] text-[12px] mb-1">إرفاق صورة التحويل (اختياري)</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full p-2 bg-[#0d0d0d] text-[#f9e29d] rounded-xl text-[11px] border border-dashed border-[#d4af37]" />
                {status && <p className="text-[#ffcc00] text-[10px] mt-1">{status}</p>}
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-[#ffcc00] text-black rounded-2xl font-black text-[16px] shadow-lg shadow-[#ffcc00]/20 active:scale-95 transition-all disabled:opacity-50">
                {isSubmitting ? "جاري الحجز..." : "تأكيد الحجز الآن 🔥"}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="text-[60px] mb-4">✅</div>
            <h2 className="text-white text-xl font-bold">تم استلام طلبك!</h2>
            <p className="text-[#aaa] text-[13px] px-6 mt-2">سيتم توجيهك الآن للواتساب لمتابعة العملية فوراً 😊</p>
            <button onClick={onClose} className="bg-[#ffcc00] px-10 py-3 rounded-xl font-bold mt-6">إغلاق</button>
          </div>
        )}
      </div>
    </div>
  )
}
