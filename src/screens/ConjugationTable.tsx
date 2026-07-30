import { IRREGULAR_TABLE } from '../content'
import { ScreenHeader } from '../components/ui'

export interface ConjugationTableProps {
  onBack: () => void
}

/** Quick three-column reference for the fourteen irregular verbs in the
 * Irregular verbs deck — base · past · past participle, with the Portuguese
 * gloss sitting under each base form so she can scan without leaving the
 * table to look a word up. */
export function ConjugationTable({ onBack }: ConjugationTableProps) {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <ScreenHeader title="Irregular verbs" onBack={onBack} />
      <p className="px-1 text-sm text-muted">
        Base form, past tense and past participle, side by side.
      </p>

      {/* overflow-x-auto keeps this table from forcing the whole page to
       * scroll sideways on a narrow phone screen. */}
      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full min-w-[420px] border-collapse text-left text-sm">
          <thead>
            <tr className="bg-card2">
              <th scope="col" className="p-3 font-bold text-ink">Base</th>
              <th scope="col" className="p-3 font-bold text-ink">Past</th>
              <th scope="col" className="p-3 font-bold text-ink">Past participle</th>
            </tr>
          </thead>
          <tbody>
            {IRREGULAR_TABLE.map(row => (
              <tr key={row.base} className="border-t border-line">
                <td className="p-3 align-top">
                  <span className="block font-bold text-ink">{row.base}</span>
                  <span className="block text-xs text-muted">{row.pt}</span>
                </td>
                <td className="p-3 align-top text-ink">{row.past}</td>
                <td className="p-3 align-top text-ink">{row.participle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
