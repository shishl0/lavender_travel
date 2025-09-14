export default function ClimateTable({
  airC, waterC, humidity, t,
}: {
  airC: (number|null)[];
  waterC: (number|null)[];
  humidity: (number|null)[];
  t?: (key: string, fallback: string) => string;
}) {
  const _ = (key: string, fallback: string) => (t ? t(key, fallback) : fallback);

  const months = [
    _("months.jan", "Янв"),
    _("months.feb", "Фев"),
    _("months.mar", "Мар"),
    _("months.apr", "Апр"),
    _("months.may", "Май"),
    _("months.jun", "Июн"),
    _("months.jul", "Июл"),
    _("months.aug", "Авг"),
    _("months.sep", "Сен"),
    _("months.oct", "Окт"),
    _("months.nov", "Ноя"),
    _("months.dec", "Дек"),
  ];

  const fmt = (v: number | null, suffix = "") =>
    v == null ? _("common.na", "—") : `${Number(v.toFixed(1))}${suffix}`;

  // цветовые шкалы — без изменений
  const heat = (v: number | null) => {
    if (v == null) return "bg-slate-50 text-slate-400";
    if (v < 0)   return "bg-sky-50 text-sky-700";
    if (v < 10)  return "bg-teal-50 text-teal-700";
    if (v < 20)  return "bg-lime-50 text-lime-700";
    if (v < 26)  return "bg-yellow-50 text-yellow-700";
    if (v < 32)  return "bg-orange-50 text-orange-700";
    return "bg-rose-50 text-rose-700";
  };
  const aqua = (v: number | null) => {
    if (v == null) return "bg-slate-50 text-slate-400";
    if (v < 10)  return "bg-sky-50 text-sky-700";
    if (v < 18)  return "bg-cyan-50 text-cyan-700";
    if (v < 24)  return "bg-teal-50 text-teal-700";
    if (v < 28)  return "bg-emerald-50 text-emerald-700";
    if (v < 30)  return "bg-lime-50 text-lime-700";
    return "bg-yellow-50 text-yellow-700";
  };
  const humi = (v: number | null) => {
    if (v == null) return "bg-slate-50 text-slate-400";
    if (v < 40)  return "bg-blue-50 text-blue-700";
    if (v < 60)  return "bg-indigo-50 text-indigo-700";
    if (v < 75)  return "bg-violet-50 text-violet-700";
    return "bg-fuchsia-50 text-fuchsia-700";
  };

  const Cell = ({
    v, suffix = "", cls = "", title = "",
  }: { v: number|null; suffix?: string; cls?: string; title?: string }) => (
    <td className="px-1.5 py-1.5 text-center">
      <span
        className={`inline-block min-w-[3.25rem] rounded-lg px-2 py-1 tabular-nums ${cls}`}
        title={title || (v == null ? "" : `${v}${suffix}`)}
      >
        {fmt(v, suffix)}
      </span>
    </td>
  );

  return (
    <div className="overflow-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-[760px] w-full text-sm">
        <thead>
          <tr className="bg-slate-50/80">
            <th className="px-3 py-2 text-left font-semibold text-slate-700">
              {_("climate.metric", "Показатель")}
            </th>
            {months.map((mo, i) => (
              <th key={i} className="px-1.5 py-2 text-center font-semibold text-slate-600">
                {mo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            <td className="px-3 py-2 font-medium text-slate-800">
              {_("climate.air", "Воздух, °C")}
            </td>
            {airC.map((v, i) => <Cell key={i} v={v} cls={heat(v)} />)}
          </tr>
          <tr className="border-t">
            <td className="px-3 py-2 font-medium text-slate-800">
              {_("climate.water", "Вода, °C")}
            </td>
            {waterC.map((v, i) => <Cell key={i} v={v} cls={aqua(v)} />)}
          </tr>
          <tr className="border-t">
            <td className="px-3 py-2 font-medium text-slate-800">
              {_("climate.humidity", "Влажность, %")}
            </td>
            {humidity.map((v, i) => <Cell key={i} v={v} suffix="%" cls={humi(v)} />)}
          </tr>
        </tbody>
      </table>

      {/* легенда */}
      <div className="flex flex-wrap items-center gap-3 px-3 py-3 text-xs text-slate-500 border-t bg-slate-50/60">
        <span className="mr-1 font-medium text-slate-600">{_("climate.legend", "Легенда:")}</span>
        <span className="inline-flex items-center gap-1">
          <i className="inline-block h-3 w-3 rounded bg-emerald-200" />
          {_("climate.uv.low", "низкий UV")}
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="inline-block h-3 w-3 rounded bg-yellow-200" />
          {_("climate.uv.moderate", "умеренный")}
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="inline-block h-3 w-3 rounded bg-orange-200" />
          {_("climate.uv.high", "высокий")}
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="inline-block h-3 w-3 rounded bg-rose-200" />
          {_("climate.uv.veryHigh", "очень высокий+")}
        </span>
      </div>
    </div>
  );
}