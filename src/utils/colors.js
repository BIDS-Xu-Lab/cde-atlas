/**
 * 19-color categorical palette for organizations.
 * Colors chosen for maximum visual distinction (Tableau-inspired).
 */
export const ORG_COLORS = {
  'NINDS':                '#7B68EE',  // medium slate blue
  'LOINC':                '#2ECC71',  // emerald green
  'NHLBI':                '#F39C12',  // orange
  'PROMIS / Neuro-QOL':   '#27AE60',  // dark green
  'ADRC':                 '#E74C3C',  // red
  'NLM':                  '#E88DA0',  // pink
  'NICHD':                '#C0392B',  // dark red
  'RADx-UP':              '#95A5A6',  // gray
  'NEI':                  '#6D4C41',  // brown
  'Project 5 (COVID-19)': '#1565C0',  // blue
  'NCI':                  '#AED6F1',  // light blue
  'NINR':                 '#F8BBD0',  // light pink
  'GRDR':                 '#CE93D8',  // light purple
  'ScHARe':               '#42A5F5',  // sky blue
  'SBE CCC':              '#FF8A65',  // light orange
  'Women\'s CRN':         '#A1887F',  // taupe
  'ONC':                  '#B0BEC5',  // blue gray
  'TEST':                 '#CFD8DC',  // silver
  'NIDA':                 '#DCE775',  // lime
}

/** Ordered list of organizations by count (descending) for legend. */
export const ORG_ORDER = [
  'NINDS', 'LOINC', 'NHLBI', 'PROMIS / Neuro-QOL', 'ADRC',
  'NLM', 'NICHD', 'RADx-UP', 'NEI', 'Project 5 (COVID-19)',
  'NCI', 'NINR', 'GRDR', 'ScHARe', 'SBE CCC',
  "Women's CRN", 'ONC', 'TEST', 'NIDA',
]

/**
 * Returns the hex color for a given organization name.
 */
export function getOrgColor(orgName) {
  return ORG_COLORS[orgName] || '#999999'
}

/**
 * Converts hex color string to RGB triple [0-1, 0-1, 0-1].
 */
export function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return [r, g, b]
}
