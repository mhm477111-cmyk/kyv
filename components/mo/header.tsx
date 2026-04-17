"use client"

import { useEffect, useState } from "react"

export function Header() {
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    const savedName = localStorage.getItem("moCustomerName")
    if (savedName) {
      const parts = savedName.trim().split(/\s+/)
      setUserName(parts.slice(0, 2).join(" "))
    }
  }, [])

  const handleLogout = () => {
    if (confirm("هل تريد تسجيل الخروج؟")) {
      localStorage.removeItem("moCustomerName")
      setUserName(null)
      window.location.reload()
    }
  }

  return (
    <>
      {/* Brand Header */}
      <header
        className="bg-black py-8 text-center relative overflow-hidden"
        style={{ direction: "ltr" }}
      >
        {/* Floating Particles */}
        <div className="absolute inset-0">
          <div
            className="absolute w-[3px] h-[3px] bg-[#e0c770]/40 rounded-full"
            style={{
              top: "10%",
              left: "20%",
              animation: "particle_float 6s infinite",
            }}
          />
          <div
            className="absolute w-[2px] h-[2px] bg-[#e0c770]/30 rounded-full"
            style={{
              top: "40%",
              left: "70%",
              animation: "particle_float 8s infinite",
            }}
          />
          <div
            className="absolute w-[4px] h-[4px] bg-[#e0c770]/50 rounded-full"
            style={{
              top: "80%",
              left: "30%",
              animation: "particle_float 7s infinite",
            }}
          />
        </div>

        {/* Core Pulse */}
        <div
          className="absolute top-1/2 left-1/2 w-[200px] h-[90px] rounded-full"
          style={{
            background: "rgba(224, 199, 112, 0.15)",
            filter: "blur(45px)",
            animation: "core_pulse 4s ease-in-out infinite",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          <div className="inline-block relative mb-4">
            <h1
              className="m-0 text-[3.2rem] font-black text-white tracking-[5px] uppercase leading-tight"
              style={{ filter: "drop-shadow(0 0 10px rgba(224, 199, 112, 0.2))" }}
            >
              MO <span className="text-[#e0c770]">CONTROL</span>
            </h1>
            <div
              className="absolute top-0 left-0 w-full h-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                animation: "sweep_animation 3.5s infinite",
                transform: "skewX(-25deg)",
              }}
            />
          </div>

          <div className="flex flex-col items-center gap-2.5">
            <div
              className="h-px w-[180px]"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #e0c770, transparent)",
              }}
            />
            <div
              className="flex gap-4 font-bold text-sm text-white flex-wrap justify-center"
              style={{ direction: "rtl" }}
            >
              <div
                className="flex items-center gap-2 border px-3 py-1.5 rounded-[10px]"
                style={{
                  borderColor: "rgba(224, 199, 112, 0.1)",
                  background: "rgba(224, 199, 112, 0.03)",
                  animation: "border_glow 3s infinite",
                }}
              >
                <span className="text-[#e0c770] text-base">⚡</span>
                <span style={{ textShadow: "0 0 5px rgba(224, 199, 112, 0.3)" }}>
                  تفعيل فوري
                </span>
              </div>
              <span className="text-white/20">•</span>
              <div
                className="flex items-center gap-2 border px-3 py-1.5 rounded-[10px]"
                style={{
                  borderColor: "rgba(224, 199, 112, 0.1)",
                  background: "rgba(224, 199, 112, 0.03)",
                  animation: "border_glow 3s infinite",
                }}
              >
                <span className="text-[#e0c770] text-base">🛡️</span>
                <span style={{ textShadow: "0 0 5px rgba(224, 199, 112, 0.3)" }}>
                  حماية فائقة
                </span>
              </div>
              <span className="text-white/20">•</span>
              <span
                className="text-[#e0c770]"
                style={{ textShadow: "0 0 5px rgba(224, 199, 112, 0.3)" }}
              >
                إصدار 2026
              </span>
            </div>

            {/* Laser Line */}
            <div
              className="absolute top-0 left-0 w-full h-0.5 opacity-40"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #e0c770, transparent)",
                animation: "laser_move 4s linear infinite",
                zIndex: 5,
              }}
            />

            <div
              className="w-full h-[3px] mt-5 relative z-20"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #e0c770, transparent)",
                boxShadow: "0px 5px 20px rgba(224, 199, 112, 0.5)",
              }}
            />
          </div>
        </div>
      </header>

      {/* Status Container */}
      <div
        className="w-full flex justify-center items-center gap-2.5 my-5 flex-wrap text-center"
        style={{ direction: "rtl" }}
      >
        <div
          className="flex items-center backdrop-blur-[10px] px-5 py-2.5 rounded-full border mx-1.5"
          style={{
            background: "rgba(0, 0, 0, 0.6)",
            borderColor: "rgba(255, 255, 255, 0.1)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          }}
        >
          <div
            className="flex items-center gap-2 border-l pl-3 ml-3"
            style={{
              borderColor: "rgba(255,255,255,0.1)",
              direction: "ltr",
            }}
          >
            <div className="relative w-2 h-2">
              <span className="absolute w-full h-full bg-[#7eba27] rounded-full z-[2]" />
              <span
                className="absolute w-full h-full bg-[#7eba27] rounded-full opacity-60 z-[1]"
                style={{ animation: "status-pulse 2s infinite" }}
              />
            </div>
            <span className="text-white/60 text-[0.7rem] tracking-[1px] font-semibold font-sans">
              SYSTEM LIVE
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-white text-[0.95rem] font-extrabold">
              التفعيل متاح وفوري الآن{" "}
              <span style={{ filter: "drop-shadow(0 0 5px #ff4500)" }}>🔥</span>
            </span>
          </div>
        </div>

        {userName && (
          <div
            className="flex items-center backdrop-blur-[10px] px-5 py-2.5 rounded-full border mx-1.5"
            style={{
              background: "rgba(212, 175, 55, 0.1)",
              borderColor: "#d4af37",
              boxShadow: "0 4px 15px rgba(212, 175, 55, 0.2)",
              direction: "rtl",
            }}
          >
            <div className="flex items-center gap-2.5">
              <i className="fas fa-crown text-[#d4af37] text-[0.9rem]" />
              <span
                className="text-white text-[0.9rem] font-bold border-l pl-2.5 ml-1.5"
                style={{ borderColor: "rgba(212,175,55,0.3)" }}
              >
                اهلا يا {userName} ☺️
              </span>
              <button
                onClick={handleLogout}
                className="cursor-pointer text-[#ff4444] text-[0.8rem] flex items-center gap-1"
              >
                <i className="fas fa-power-off" />
                <span className="font-extrabold text-[0.7rem]">خروج</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
