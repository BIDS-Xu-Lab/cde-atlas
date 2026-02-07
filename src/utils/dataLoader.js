/**
 * Fetches and parses the CDE TSV file.
 * Returns an array of objects with typed fields.
 */
export async function loadCdeData() {
  const response = await fetch('/data/cde-20250123.tsv')
  const text = await response.text()
  const lines = text.split('\n')

  const data = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    const fields = line.split('\t')
    if (fields.length < 7) continue

    const year = parseInt(fields[2], 10)
    const x = parseFloat(fields[5])
    const y = parseFloat(fields[6])

    if (isNaN(x) || isNaN(y) || isNaN(year)) continue

    data.push({
      id: i,
      tinyid: fields[0],
      name: fields[1],
      year,
      description: fields[3] || '',
      organization: fields[4],
      x,
      y,
    })
  }

  return data
}
