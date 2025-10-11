export type ZapisnicaCommissionMember = {
  roleLabel: string
  name: string
  position?: string | null
}

export type ZapisnicaApplicant = {
  fullName: string
  identifier: string
  totalPoints?: string
  rank?: string
  statusLabel?: string
}

export type ZapisnicaFormResult = {
  title: string
  description: string
  pointsInfo: string
  notes?: string
  applicants: Array<{
    fullName: string
    identifier: string
    value: string
    secondaryValue?: string
  }>
}

export type ZapisnicaData = {
  header: {
    identifier: string
    institutionName: string
    institutionAddress: string
    serviceType: string
    selectionType: string
    positionsCount: string
    functionName: string
    leadingFunction: string
    serviceField: string
    organisationalUnit: string
    meetingDate: string
    meetingPlace: string
  }
  commission: ZapisnicaCommissionMember[]
  commissionerTrainingNote?: string
  applicantsApplied: ZapisnicaApplicant[]
  applicantsRejected: ZapisnicaApplicant[]
  applicantsNotPresent: ZapisnicaApplicant[]
  forms: ZapisnicaFormResult[]
  ranking: ZapisnicaApplicant[]
  resultLabel: string
  signatures: ZapisnicaCommissionMember[]
  cityAndDate: string
  preparedBy: string
}

const styles = `
  * { box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', serif;
    font-size: 12pt;
    color: #1f2937;
    line-height: 1.5;
    margin: 32px 48px;
  }
  h1 {
    font-size: 20pt;
    text-transform: uppercase;
    text-align: center;
    margin-bottom: 24px;
    letter-spacing: 1px;
  }
  h2 {
    font-size: 14pt;
    margin: 24px 0 12px;
    font-weight: 700;
  }
  h3 {
    font-size: 13pt;
    margin: 20px 0 8px;
    font-weight: 600;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
  }
  table.meta td {
    vertical-align: top;
    padding: 4px 8px;
  }
  table.meta td.label {
    width: 32%;
    font-weight: 600;
    color: #111827;
    padding-right: 12px;
  }
  table.meta td.value {
    width: 68%;
  }
  ul { list-style-type: disc; margin: 8px 0 8px 24px; }
  .section { margin-top: 16px; }
  .commission-list div,
  .applicants-list div {
    margin-bottom: 6px;
  }
  .note {
    margin-top: 12px;
    font-style: italic;
    color: #4b5563;
  }
  .form-table {
    border: 1px solid #d1d5db;
  }
  .form-table th,
  .form-table td {
    border: 1px solid #d1d5db;
    padding: 6px 8px;
    text-align: left;
  }
  .form-table th {
    background: #f9fafb;
    font-weight: 600;
  }
  .signature-grid {
    margin-top: 24px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 24px;
  }
  .signature-slot { text-align: center; }
  .signature-slot div.line {
    margin-top: 48px;
    border-top: 1px solid #9ca3af;
    padding-top: 4px;
  }
  .result-box {
    margin-top: 12px;
    padding: 12px;
    border: 1px solid #d1d5db;
    background: #f9fafb;
    display: inline-block;
  }
`

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatMultiline(value: string) {
  return escapeHtml(value).replace(/\n/g, '<br />')
}

function renderCommission(commission: ZapisnicaCommissionMember[]) {
  if (!commission.length) {
    return '<p>-</p>'
  }

  return commission
    .map((member) => {
      const parts = [
        `<strong>${escapeHtml(member.roleLabel)}:</strong>`,
        `<span>${escapeHtml(member.name)}</span>`,
      ]
      if (member.position) {
        parts.push(`<span>${escapeHtml(member.position)}</span>`)
      }
      return `<div>${parts.join('<br />')}</div>`
    })
    .join('')
}

function renderApplicantsList(title: string, applicants: ZapisnicaApplicant[]) {
  if (!applicants.length) {
    return `<div><h2>${escapeHtml(title)}</h2><p>-</p></div>`
  }

  const body = applicants
    .map((applicant) => {
      const lines = [
        `<strong>${escapeHtml(applicant.fullName)}</strong>`,
        `<span>${escapeHtml(applicant.identifier)}</span>`,
      ]
      if (applicant.statusLabel) {
        lines.push(`<span>${escapeHtml(applicant.statusLabel)}</span>`)
      }
      return `<div>${lines.join('<br />')}</div>`
    })
    .join('')

  return `<div><h2>${escapeHtml(title)}</h2><div class="applicants-list">${body}</div></div>`
}

function renderFormTable(form: ZapisnicaFormResult) {
  const hasSecondary = form.applicants.some((applicant) => Boolean(applicant.secondaryValue))
  const headerCols = [
    '<th>Uchádzač</th>',
    '<th>Identifikátor</th>',
    '<th>Výsledok</th>',
  ]
  if (hasSecondary) {
    headerCols.push('<th>Počet bodov / %</th>')
  }

  const rows = form.applicants
    .map((applicant) => {
      const cols = [
        `<td>${escapeHtml(applicant.fullName)}</td>`,
        `<td>${escapeHtml(applicant.identifier)}</td>`,
        `<td>${escapeHtml(applicant.value)}</td>`,
      ]
      if (hasSecondary) {
        cols.push(`<td>${escapeHtml(applicant.secondaryValue ?? '-')}</td>`)
      }
      return `<tr>${cols.join('')}</tr>`
    })
    .join('')

  const note = form.notes ? `<p class="note">${escapeHtml(form.notes)}</p>` : ''

  return `
    <div class="section">
      <h3>${escapeHtml(form.title)}</h3>
      <p>${escapeHtml(form.description)}</p>
      <p>${escapeHtml(form.pointsInfo)}</p>
      ${note}
      <table class="form-table">
        <thead><tr>${headerCols.join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `
}

export function renderZapisnicaHtml(data: ZapisnicaData) {
  const formsHtml = data.forms.map(renderFormTable).join('')
  const rankingRows = data.ranking
    .map((applicant) => `
      <tr>
        <td>${escapeHtml(applicant.fullName)}</td>
        <td>${escapeHtml(applicant.identifier)}</td>
        <td>${escapeHtml(applicant.totalPoints ?? '-')}</td>
        <td>${escapeHtml(applicant.rank ?? '-')}</td>
      </tr>
    `)
    .join('')

  const signaturesHtml = data.signatures
    .map((member) => `
      <div class="signature-slot">
        <div>${escapeHtml(member.name)}</div>
        ${member.position ? `<div class="text-sm text-gray-500">${escapeHtml(member.position)}</div>` : ''}
        <div class="line" />
      </div>
    `)
    .join('')

  const html = `
    <!DOCTYPE html>
    <html lang="sk">
      <head>
        <meta charSet="utf-8" />
        <title>Zápisnica o priebehu a výsledku výberového konania</title>
        <style>${styles}</style>
      </head>
      <body>
        <h1>Zápisnica o priebehu a výsledku výberového konania</h1>
        <table class="meta">
          <tbody>
            <tr><td class="label">Identifikátor výberového konania:</td><td class="value">${escapeHtml(data.header.identifier)}</td></tr>
            <tr><td class="label">Názov a sídlo služobného úradu:</td><td class="value">${formatMultiline(data.header.institutionName)}<br />${formatMultiline(data.header.institutionAddress)}</td></tr>
            <tr><td class="label">Druh štátnej služby:</td><td class="value">${formatMultiline(data.header.serviceType)}</td></tr>
            <tr><td class="label">Druh výberového konania:</td><td class="value">${formatMultiline(data.header.selectionType)}</td></tr>
            <tr><td class="label">Počet obsadzovaných miest:</td><td class="value">${escapeHtml(data.header.positionsCount)}</td></tr>
            <tr><td class="label">Obsadzovaná funkcia:</td><td class="value">${escapeHtml(data.header.functionName)}</td></tr>
            <tr><td class="label">Štátnozamestnanecké miesto vedúceho zamestnanca:</td><td class="value">${escapeHtml(data.header.leadingFunction)}</td></tr>
            <tr><td class="label">Odbor štátnej služby:</td><td class="value">${escapeHtml(data.header.serviceField)}</td></tr>
            <tr><td class="label">Organizačný útvar:</td><td class="value">${escapeHtml(data.header.organisationalUnit)}</td></tr>
            <tr><td class="label">Dátum a čas uskutočnenia:</td><td class="value">${escapeHtml(data.header.meetingDate)}</td></tr>
            <tr><td class="label">Miesto výberového konania:</td><td class="value">${escapeHtml(data.header.meetingPlace)}</td></tr>
          </tbody>
        </table>

        <div class="section">
          <h2>Zloženie výberovej komisie:</h2>
          <div class="commission-list">${renderCommission(data.commission)}</div>
          ${data.commissionerTrainingNote ? `<p class="note">${escapeHtml(data.commissionerTrainingNote)}</p>` : ''}
        </div>

        ${renderApplicantsList('Uchádzač/i, ktorý/í sa prihlásil/i do výberového konania:', data.applicantsApplied)}
        ${renderApplicantsList('Uchádzač/i nezaradený/í do výberového konania a dôvod nezaradenia uchádzača/ov do výberového konania:', data.applicantsRejected)}
        ${renderApplicantsList('Uchádzač/i, ktorý/í sa nezúčastnil/i výberového konania:', data.applicantsNotPresent)}

        <div class="section">
          <h2>Priebeh výberového konania:</h2>
          <p>
            Formy overenia, z ktorých pozostávalo výberové konanie, meno, priezvisko a identifikátor uchádzača/ov s výsledkom,
            ktorý bol dosiahnutý v jednotlivých formách overenia, spolu s počtom získaných bodov (ak je možné vo forme overenia získať body),
            určené poradie úspešnosti uchádzača/ov sú podrobne uvedené v dokumente "Záverečné hodnotenie", ktorý tvorí prílohu zápisnice.
          </p>
        </div>

        ${formsHtml}

        <div class="section">
          <h2>Z posúdenia a vyhodnotenia</h2>
          <p>Z posúdenia požadovaných dokumentov uchádzača/ov a vyhodnotenia výberového konania, na základe súčtu bodového hodnotenia jednotlivých častí výberového konania, výberová komisia určila nasledovné poradie úspešnosti uchádzača/ov:</p>
          <table class="form-table">
            <thead>
              <tr>
                <th>Uchádzač</th>
                <th>Identifikátor</th>
                <th>Body</th>
                <th>Poradie</th>
              </tr>
            </thead>
            <tbody>${rankingRows}</tbody>
          </table>
          <div class="result-box">
            Výsledok výberového konania: <strong>${escapeHtml(data.resultLabel)}</strong>
          </div>
        </div>

        <div class="section">
          <div class="signature-grid">${signaturesHtml}</div>
        </div>

        <div class="section">
          <div>${escapeHtml(data.cityAndDate)}</div>
          <div class="mt-2">Zápisnicu vyhotovil: ${escapeHtml(data.preparedBy)}</div>
        </div>
      </body>
    </html>
  `

  return html
}
