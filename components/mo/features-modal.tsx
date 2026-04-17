"use client"

import { useState } from "react"

interface FeaturesModalProps {
  isOpen: boolean
  onClose: () => void
  provider: "eti" | "voda" | "we" | null
}

export function FeaturesModal({ isOpen, onClose, provider }: FeaturesModalProps) {
  const [copyText, setCopyText] = useState("*339#")

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyText("تم النسخ بنجاح ✅")
      setTimeout(() => setCopyText("*339#"), 2000)
    })
  }

  if (!isOpen || !provider) return null

  return (
    <div
      className="fixed inset-0 z-[100000] flex justify-center items-center"
      style={{
        background: "rgba(0,0,0,0.95)",
        backdropFilter: "blur(10px)",
      }}
      onClick={onClose}
    >
      <div
        className="mo-scroll-gold w-[90%] max-w-[450px] rounded-[20px] p-5 relative max-h-[85vh] overflow-y-auto"
        style={{
          background: "#0a0a0a",
          border: "1.5px solid #d4af37",
          boxShadow: "0 0 40px rgba(212, 175, 55, 0.2)",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-[#d4af37] cursor-pointer text-[22px] font-bold z-10 bg-transparent border-none"
        >
          ✕
        </button>

        {/* Etisalat Content */}
        {provider === "eti" && (
          <div>
            <h3 className="text-[#a2d400] text-center border-b border-[#333] pb-2.5">
              Etisalat Emerald
            </h3>
            <p className="text-[#d4af37] font-bold text-[15px] mb-2">
              💎 المميزات:
            </p>
            <ul
              className="list-none p-0 text-[#eee] text-[13px] leading-[1.8] mb-5"
              style={{ direction: "rtl" }}
            >
              <li>✅ مكالمة خدمة العملاء مجاناً (بدون رصيد) 📱</li>
              <li>✅ 10,000 دقيقة مجانية بين الخطوط المشتركة 🤝</li>
              <li>✅ لو مشترك معايا بخطين او اكتر هيكلموا بعض ببلاش😉</li>
              <li>✅ إمكانية اضافة حتي 7 خطوط يكلموا بعض ببلاش.</li>
            </ul>
            <p className="text-[#ffcc00] font-bold text-[15px] mb-2">
              ⚠️ شروط الاشتراك:
            </p>
            <div
              className="p-4 rounded-xl text-[12px] text-[#aaa] leading-relaxed"
              style={{
                background: "rgba(255,255,255,0.05)",
                direction: "rtl",
              }}
            >
              <p className="my-1">• مدة الباقة 28 يوم في حالة عدم التجديد</p>
              <p className="my-1">
                • الخط بيتحول لـ (فاتورة) وللرجوع لكارت تتوجه للفرع بالبطاقة
              </p>
              <p className="my-1">• يفضل أن يكون الخط باسمك لعدم فقدانه 🫡.</p>
              <p className="text-white mt-2.5 pt-2.5 border-t border-[#333]">
                • لازم الخط يبقي علي نظام 15 قرش ولو عليه اي باقه، الغيها وحوله 15
                قرش بالكود اللي تحت ده👇🏻 (اضغط عليه للنسخ)
              </p>
              <button
                onClick={() => copyCode("*339#")}
                className="w-full mt-1.5 p-2.5 rounded-lg cursor-pointer font-bold text-lg bg-[#111] text-[#d4af37] border border-dashed border-[#d4af37]"
                style={{ transition: "color 0.3s" }}
              >
                {copyText}
              </button>
              <div
                className="mx-auto max-w-[95%] mt-3 p-2.5 rounded-lg text-center"
                style={{
                  background: "rgba(162, 212, 0, 0.05)",
                  border: "1px dashed #a2d400",
                }}
              >
                <p className="m-0 text-white text-[13px] leading-relaxed">
                  <span className="text-[#a2d400] font-bold">⚠️ تنبيه هام:</span>{" "}
                  يجب توافر{" "}
                  <span className="text-[#a2d400] font-black">5 جنيه رصيد صافي</span>{" "}
                  وعدم وجود أي مبالغ مستحقة (سلف) لضمان إتمام عملية تحويل النظام
                  بنجاح.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Vodafone Content */}
        {provider === "voda" && (
          <div>
            <h3 className="text-[#ff0000] text-center border-b border-[#333] pb-2.5">
              Vodafone Red
            </h3>
            <p className="text-[#d4af37] font-bold text-[15px] mb-2">
              💎 المميزات:
            </p>
            <ul
              className="list-none p-0 text-[#eee] text-[13px] leading-[1.8] mb-5"
              style={{ direction: "rtl" }}
            >
              <li>✅ أقوى تغطية إنترنت في مصر (4G/5G).</li>
              <li>✅ استقرار تام في جودة المكالمات والشبكة.</li>
              <li>✅ خدمة عملاء VIP مخصصة لعملاء Red.</li>
            </ul>
            <p className="text-[#ffcc00] font-bold text-[15px] mb-2">
              ⚠️ شروط الاشتراك:
            </p>
            <div
              className="p-4 rounded-xl text-[12px] text-[#aaa] leading-relaxed"
              style={{
                background: "rgba(255,255,255,0.05)",
                direction: "rtl",
              }}
            >
              <p className="my-1">• مدة الباقة 28 يوم في حالة عدم التجديد.</p>
              <p
                className="text-white font-bold p-1.5 rounded"
                style={{ background: "rgba(255,0,0,0.2)" }}
              >
                • يجب تحويل كامل المبلغ المطلوب قبل البدء 💸.
              </p>
              <p className="my-1">
                • يتم التفعيل بعد إرسال لقطة شاشة (Screenshot) للتحويل.
              </p>
            </div>
          </div>
        )}

        {/* WE Gold Content */}
        {provider === "we" && (
          <div>
            <h3 className="text-[#8e44ad] text-center border-b border-[#333] pb-2.5">
              WE GOLD
            </h3>
            <p className="text-[#d4af37] font-bold text-[15px] mb-2">
              💎 المميزات:
            </p>
            <ul
              className="list-none p-0 text-[#eee] text-[13px] leading-[1.8] mb-5"
              style={{ direction: "rtl" }}
            >
              <li>✅ أرخص سعر للجيجابايت وباقات توفيرية جداً.</li>
              <li>✅ نظام وحدات مرن (دقائق وميجابايت).</li>
              <li>✅ عروض حصرية لعملاء جولد عبر التطبيق.</li>
            </ul>
            <p className="text-[#ffcc00] font-bold text-[15px] mb-2">
              ⚠️ شروط الاشتراك:
            </p>
            <div
              className="p-4 rounded-xl text-[12px] text-[#aaa] leading-relaxed"
              style={{
                background: "rgba(255,255,255,0.05)",
                direction: "rtl",
              }}
            >
              <p className="my-1">• مدة الباقة 28 يوم في حالة عدم التجديد.</p>
              <p className="my-1">• متابعة الاستهلاك تتم عبر تطبيق (My WE).</p>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full p-3 rounded-xl mt-5 font-black cursor-pointer text-base text-black border-none"
          style={{ background: "linear-gradient(90deg, #d4af37, #f9e29d)" }}
        >
          موافق
        </button>
      </div>
    </div>
  )
}
