import { useTranslations } from "next-intl";
import { SIZE_GUIDE, type SizeChartKey } from "@/lib/size-guide";

export function SizeGuideTable({ chart, caption }: { chart: SizeChartKey; caption?: string }) {
  const t = useTranslations("product.sizeChart");
  const g = SIZE_GUIDE[chart];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[320px] border-collapse text-left text-sm">
        {caption && <caption className="mb-3 text-left font-serif text-xl">{caption}</caption>}
        <thead>
          <tr className="border-b border-obsidian">
            {g.columns.map((c) => (
              <th key={c} scope="col" className="py-2.5 pr-4 text-2xs font-medium uppercase tracking-wide2">
                {t(c)}
                {c !== "size" && c !== "euSize" ? " (cm)" : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {g.rows.map((r) => (
            <tr key={r[0]} className="border-b border-line">
              {r.map((cell, i) =>
                i === 0 ? (
                  <th key={i} scope="row" className="py-2.5 pr-4 font-medium">{cell}</th>
                ) : (
                  <td key={i} className="py-2.5 pr-4 text-ink-soft">{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
