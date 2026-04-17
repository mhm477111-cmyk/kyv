export function Ticker() {
  const tickerText =
    "⚡ أهلاً بك في MO CONTROL | BLACK GOLD - التفعيل أولاً والدفع لاحقاً - أسرع خدمة تفعيل باقات في مصر ⚡"

  return (
    <div className="mo-ticker-wrap">
      <div className="mo-ticker">
        <div className="mo-ticker-item">{tickerText}</div>
        <div className="mo-ticker-item">{tickerText}</div>
        <div className="mo-ticker-item">{tickerText}</div>
      </div>
    </div>
  )
}
