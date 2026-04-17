"use client"

import { useEffect, useState } from "react"

export function Preloader() {
  const [progress, setProgress] = useState(0)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 20)

    const timeout = setTimeout(() => {
      setHidden(true)
    }, 500)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  if (hidden) return null

  return (
    <div
      className={`mo-elite-preloader ${hidden ? "mo-elite-hidden" : ""}`}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "#000",
        backgroundImage:
          "linear-gradient(rgba(255, 204, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 204, 0, 0.05) 1px, transparent 1px)",
        backgroundSize: "30px 30px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 100000,
        transition: "0.4s cubic-bezier(0.8, 0, 0.2, 1)",
      }}
    >
      <div className="flex flex-col items-center relative">
        {/* Tech Circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className="w-[250px] h-[250px] border-2 border-dashed rounded-full"
            style={{
              borderColor: "rgba(255, 204, 0, 0.2)",
              animation: "rotate 5s linear infinite",
            }}
          />
          <div
            className="absolute top-[25px] left-[25px] w-[200px] h-[200px] border rounded-full"
            style={{
              borderColor: "rgba(255, 255, 255, 0.1)",
              borderTopColor: "#ffcc00",
              borderTopWidth: "2px",
              animation: "rotate 1s reverse linear infinite",
            }}
          />
        </div>

        {/* Logo */}
        <div className="relative text-center z-10">
          <h1
            className="m-0 text-5xl font-black text-white tracking-[8px]"
            style={{ textShadow: "0 0 20px rgba(255, 204, 0, 0.5)" }}
          >
            MO CONTROL
          </h1>
          <div
            className="absolute top-0 left-0 w-full h-1 bg-[#ffcc00]"
            style={{
              boxShadow: "0 0 15px #ffcc00",
              animation: "scan 0.8s linear infinite",
            }}
          />
        </div>

        {/* Loading Bar */}
        <div className="w-[280px] mt-10">
          <div className="h-1 bg-white/5 relative overflow-hidden">
            <div
              className="h-full bg-[#ffcc00]"
              style={{
                width: `${progress}%`,
                boxShadow: "0 0 10px #ffcc00",
                transition: "width 0.1s ease-out",
              }}
            />
          </div>
          <div className="flex justify-between mt-2.5 text-[#ffcc00] font-mono text-[10px]">
            <span>SYSTEM READY</span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
