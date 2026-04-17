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
    subscriptionType: "new", // new or renewal
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

  useEffect(() => {
    // Save name to localStorage
    if (formData.name.length > 2) {
      localStorage.setItem("moCustomerName", formData.name)
    }
  }, [formData.name])

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
      formData.subscriptionType === "new" ? "اشتراك جديد" : "تجديد اشتراك"

    const msg = `🚀 حجز جديد - MO CONTROL
━━━━━━━━━━━━━━━
📋 نوع الطلب: ${subscriptionTypeText}
👤 الاسم: ${formData.name}
📞 واتساب: ${formData.whatsapp}
📱 رقم الشحن: ${formData.target}
📦 الباقة: ${formData.package}
📅 التجديد: يوم ${formData.renewalDate}
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
          `أهلاً MO CONTROL، أنا ${formData.name} طلبت باقة (${formData.package}) وتجديدي يوم ${formData.renewalDate} متاح المراجعه الان☺️`
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
    <div className="mo-modal-overlay" onClick={onClose}>
      <div className="mo-form-card" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-5 left-4 text-white text-2xl cursor-pointer z-10 bg-transparent border-none"
        >
          X
        </button>

        {!showSuccess ? (
          <div>
            <div className="text-center mb-3">
              <h2 className="text-[#ffcc00] m-0 font-black text-[35px]">
                MO CONTROL
              </h2>
              <p className="text-[#aaa] text-[10px] my-0.5">
                عالم من السرعة.. تفعيل باقاتك بالضمان 😊
              </p>
            </div>

            {/* Payment Options */}
            <div className="flex gap-2 mb-3" style={{ direction: "rtl" }}>
              <button
                type="button"
                onClick={copyVodaNum}
                className="flex-1 flex flex-col items-center justify-center h-[55px] rounded-xl cursor-pointer transition-all"
                style={{
                  background: "#0a0a0a",
                  border: "1.5px solid #d4af37",
                  boxShadow: "0 0 10px rgba(212, 175, 55, 0.1)",
                }}
              >
                <span className="text-[#aaa] text-[11px] mb-0.5">محفظة كاش</span>
                <b className="text-[#f9e29d] text-[12px] tracking-[0.5px]">
                  01282608730
                </b>
                <span className="text-[8px] text-[#d4af37] mt-0.5 font-bold tracking-[0.5px]">
                  اضغط لنسخ الرقم ✨
                </span>
              </button>
              <a
                href="https://ipn.eg/S/hamoibrahim212/instapay/8Waki0"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 no-underline"
              >
                <div
                  className="h-[55px] p-2 flex flex-col items-center justify-center rounded-xl transition-all"
                  style={{
                    background: "#0a0a0a",
                    border: "1.5px solid #d4af37",
                    boxShadow: "0 0 10px rgba(212, 175, 55, 0.1)",
                  }}
                >
                  <Image
                    src="https://c.top4top.io/p_3752uliqp1.png"
                    alt="InstaPay"
                    width={60}
                    height={30}
                    style={{
                      objectFit: "contain",
                      filter: "drop-shadow(0px 0px 5px rgba(212, 175, 55, 0.3))",
                    }}
                  />
                  <span className="text-[#aaa] text-[8px] mt-1">دفع سريع آمن</span>
                  <span className="text-[8px] text-[#d4af37] font-bold tracking-[0.5px]">
                    اضغط للدفع عبر انستا باي 🔗
                  </span>
                </div>
              </a>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Subscription Type Selection */}
              <div className="mb-2 text-right">
                <label className="block text-[#eee] text-[14px] mb-1">
                  نوع الطلب
                </label>
                <div className="flex gap-4" style={{ direction: "rtl" }}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="subscriptionType"
                      value="new"
                      checked={formData.subscriptionType === "new"}
                      onChange={(e) =>
                        setFormData({ ...formData, subscriptionType: e.target.value })
                      }
                      className="accent-[#ffcc00]"
                    />
                    <span className="text-white text-[13px]">اشتراك جديد</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="subscriptionType"
                      value="renewal"
                      checked={formData.subscriptionType === "renewal"}
                      onChange={(e) =>
                        setFormData({ ...formData, subscriptionType: e.target.value })
                      }
                      className="accent-[#ffcc00]"
                    />
                    <span className="text-white text-[13px]">تجديد اشتراك</span>
                  </label>
                </div>
              </div>

              <div className="mb-1.5 text-right">
                <label className="block text-[#eee] text-[14px] mb-0.5">
                  الاسم بالكامل
                </label>
                <input
                  type="text"
                  placeholder="اكتب اسمك"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full p-2 bg-[#111] border border-[#333] text-white rounded-[10px] text-[11px] outline-none"
                />
              </div>

              <div className="mb-1.5 text-right">
                <label className="block text-[#eee] text-[14px] mb-0.5">
                  رقم الواتساب للتواصل
                </label>
                <input
                  type="tel"
                  placeholder="01xxxxxxxxx"
                  required
                  maxLength={11}
                  inputMode="numeric"
                  value={formData.whatsapp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      whatsapp: e.target.value.replace(/[^0-9]/g, ""),
                    })
                  }
                  className="w-full p-2 bg-[#111] border border-[#333] text-white rounded-[10px] text-[11px] outline-none"
                />
              </div>

              <div className="mb-1.5 text-right">
                <label className="block text-[#ffcc00] text-[14px] mb-0.5">
                  الرقم المراد تفعيله
                </label>
                <input
                  type="tel"
                  placeholder="01xxxxxxxxx"
                  required
                  maxLength={11}
                  inputMode="numeric"
                  value={formData.target}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      target: e.target.value.replace(/[^0-9]/g, ""),
                    })
                  }
                  className="w-full p-2 bg-[#111] border border-[#ffcc00] text-white rounded-[10px] text-[11px] outline-none"
                />
              </div>

              <div className="mb-1.5 text-right">
                <label className="block text-[#eee] text-[14px] mb-0.5">
                  اختر الشبكة والباقة
                </label>
                <select
                  required
                  value={formData.package}
                  onChange={(e) =>
                    setFormData({ ...formData, package: e.target.value })
                  }
                  className="w-full p-2 bg-[#111] border border-[#333] text-white rounded-[10px] text-[11px] outline-none"
                >
                  <option value="" disabled>
                    -- اضغط لاختيار باقتك --
                  </option>
                  <optgroup label="🟢 ETISALAT EMERALD">
                    <option value="Eti_20GB_260">EMERALD - 20GB [260 LE]</option>
                    <option value="Eti_25GB_300">EMERALD - 25GB [300 LE]</option>
                    <option value="Eti_30GB_340">EMERALD - 30GB [340 LE]</option>
                    <option value="Eti_40GB_420">EMERALD - 40GB [420 LE]</option>
                    <option value="Eti_50GB_500">EMERALD - 50GB [500 LE]</option>
                    <option value="Eti_60GB_640">EMERALD - 60GB [640 LE]</option>
                  </optgroup>
                  <optgroup label="🔴 VODAFONE RED">
                    <option value="Voda_20GB_300">VODA - 20GB [300 LE]</option>
                    <option value="Voda_25GB_340">VODA - 25GB [340 LE]</option>
                    <option value="Voda_30GB_380">VODA - 30GB [380 LE]</option>
                    <option value="Voda_40GB_460">VODA - 40GB [460 LE]</option>
                    <option value="Voda_50GB_520">VODA - 50GB [520 LE]</option>
                    <option value="Voda_60GB_580">VODA - 60GB [580 LE]</option>
                  </optgroup>
                  <optgroup label="🟣 WE GOLD">
                    <option value="WE_20GB_260">WE GOLD - 20GB [260 LE]</option>
                    <option value="WE_25GB_300">WE GOLD - 25GB [300 LE]</option>
                    <option value="WE_30GB_330">WE GOLD - 30GB [330 LE]</option>
                    <option value="WE_40GB_390">WE GOLD - 40GB [390 LE]</option>
                    <option value="WE_50GB_450">WE GOLD - 50GB [450 LE]</option>
                    <option value="WE_60GB_530">WE GOLD - 60GB [530 LE]</option>
                  </optgroup>
                </select>
              </div>

              <div className="mb-1.5 text-right">
                <label className="block text-[#eee] text-[14px] mb-0.5">
                  موعد تجديد الباقة شهرياً
                </label>
                <select
                  required
                  value={formData.renewalDate}
                  onChange={(e) =>
                    setFormData({ ...formData, renewalDate: e.target.value })
                  }
                  className="w-full p-2 bg-[#111] border border-[#333] text-white rounded-[10px] text-[11px] outline-none"
                >
                  <option value="" disabled>
                    -- اختر موعد التجديد --
                  </option>
                  <option value="1">يوم 1 من كل شهر</option>
                  <option value="15">يوم 15 من كل شهر</option>
                </select>
              </div>

{/* قسم اختيار نوع الاشتراك - مريح للموبايل */}
<div className="flex flex-col gap-3 my-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
  <p className="text-right text-sm font-bold text-gray-700 mb-1">نوع الطلب:</p>
  <div className="flex justify-around items-center">
    <label className="flex items-center gap-2 cursor-pointer group">
      <input type="radio" name="subType" value="new" className="w-5 h-5 accent-blue-600" defaultChecked />
      <span className="text-gray-800 font-medium">اشتراك جديد</span>
    </label>
    <label className="flex items-center gap-2 cursor-pointer group">
      <input type="radio" name="subType" value="renew" className="w-5 h-5 accent-blue-600" />
      <span className="text-gray-800 font-medium">تجديد اشتراك</span>
    </label>
  </div>

              
              <div className="mb-1.5 text-right">
                <label className="block text-[#eee] text-[14px] mb-0.5">
                  إرفاق اسكرين تحويل الفلوس (اختياري)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full p-2 bg-[#0d0d0d] text-[#f9e29d] rounded-[10px] cursor-pointer"
                  style={{ border: "1px dashed #d4af37" }}
                />
                {status && (
                  <p className="text-[#ffcc00] text-[10px] my-1.5">{status}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full p-2.5 bg-[#ffcc00] text-black border-none rounded-xl font-black cursor-pointer mt-1.5 disabled:opacity-50"
              >
                {isSubmitting ? "جاري الحجز..." : "تأكيد الطلب"}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-5">
            <div className="text-[50px] text-[#ffcc00] mb-2.5">✔</div>
            <h2 className="text-white text-lg">تم استلام طلبك!</h2>
            <p className="text-[#aaa] text-[12px]">
              سيتم توجيهك الآن للواتساب لمتابعة العملية فوراً وبشكل آلي 😊
            </p>
            <button
              onClick={onClose}
              className="bg-[#ffcc00] border-none px-6 py-2.5 rounded-[10px] cursor-pointer font-bold mt-4"
            >
              إغلاق
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
