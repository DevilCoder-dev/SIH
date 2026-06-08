// The Evidence Layer. Five compact, sourced claims that back the project — not
// a bibliography dump. Every entry maps to a real, published source; the last
// card is an honest account of EvoComb's own measurement limits.
//
// `confidence` drives both the label and the small meter:
//   high       — strong, replicated evidence
//   moderate   — solid but context-dependent
//   limitation — a constraint of the data, stated plainly

export type EvidenceMarker = 'wave' | 'haze' | 'heat' | 'threshold' | 'grid';
export type Confidence = 'high' | 'moderate' | 'limitation';

export interface EvidenceCard {
  id: string;
  marker: EvidenceMarker;
  accent: string; // signal color, by meaning
  claim: string; // one sentence, specific
  source: string; // title
  year: number;
  institution: string; // journal / body
  confidence: Confidence;
  note: string; // confidence / limitation, one line
  detail: string; // drawer body — what the source actually establishes
  link: string; // DOI / source URL
  doi?: string; // shown as a label when present
}

export const EVIDENCE: EvidenceCard[] = [
  {
    id: 'noise-cv',
    marker: 'wave',
    accent: '#e67e22',
    claim: 'Every +10 dB of road-traffic noise raises ischaemic heart-disease risk by about 8%.',
    source: 'Environmental Noise Guidelines for the European Region',
    year: 2018,
    institution: 'WHO Regional Office for Europe',
    confidence: 'high',
    note: 'Consistent exposure–response across European cohorts above ~50 dB Lden.',
    detail:
      'The WHO guideline pools long-term cohort evidence linking chronic road-traffic noise to hypertension and ischaemic heart disease, and sets a 53 dB Lden recommendation. Mechanism (stress-hormone and blood-pressure pathways) is detailed in Münzel et al., JACC 2018.',
    link: 'https://www.who.int/europe/publications/i/item/9789289053563',
    doi: '10.1016/j.jacc.2017.12.015',
  },
  {
    id: 'air-mortality',
    marker: 'haze',
    accent: '#7f8c8d',
    claim: '1.67 million deaths in India were attributable to air pollution in 2019 — 17.8% of all deaths.',
    source: 'Health and economic impact of air pollution in the states of India, GBD 2019',
    year: 2021,
    institution: 'The Lancet Planetary Health',
    confidence: 'high',
    note: 'Modelled attributable burden; exposure estimates carry spatial uncertainty.',
    detail:
      'The Global Burden of Disease 2019 India analysis attributes 1.67M deaths and a measurable GDP loss to ambient and household air pollution, with PM2.5 the dominant driver of cardiopulmonary mortality.',
    link: 'https://pubmed.ncbi.nlm.nih.gov/33357500/',
    doi: '10.1016/S2542-5196(20)30298-9',
  },
  {
    id: 'heat-deaths',
    marker: 'heat',
    accent: '#e74c3c',
    claim: 'The 2003 European heatwave caused more than 70,000 excess deaths.',
    source: 'Death toll exceeded 70,000 in Europe during the summer of 2003',
    year: 2008,
    institution: 'Comptes Rendus Biologies',
    confidence: 'high',
    note: 'Event total is firm; urban heat-island amplification varies by city fabric.',
    detail:
      'Robine et al. reconstructed national mortality across 16 countries and found >70,000 excess deaths, concentrated in elderly and urban populations where concrete and low greenery intensify heat exposure.',
    link: 'https://doi.org/10.1016/j.crvi.2007.12.001',
    doi: '10.1016/j.crvi.2007.12.001',
  },
  {
    id: 'pm25-guideline',
    marker: 'threshold',
    accent: '#9b59b6',
    claim: 'WHO sets the safe annual PM2.5 limit at 5 µg/m³. Delhi routinely runs many times higher.',
    source: 'Global Air Quality Guidelines',
    year: 2021,
    institution: 'World Health Organization',
    confidence: 'moderate',
    note: 'Guideline value is firm; local exceedance depends on station and season.',
    detail:
      'The 2021 WHO guideline lowered the annual PM2.5 limit from 10 to 5 µg/m³. Delhi NCR winter averages frequently exceed it by an order of magnitude, which is why EvoComb treats AQI as a heavily weighted signal.',
    link: 'https://www.who.int/publications/i/item/9789240034228',
  },
  {
    id: 'exposure-limits',
    marker: 'grid',
    accent: '#27ae60',
    claim: 'Coarse, city-scale exposure data hides street-level extremes — so EvoComb states where it is modelled.',
    source: 'Mortality risk attributable to high and low ambient temperature (multicountry study)',
    year: 2015,
    institution: 'The Lancet',
    confidence: 'limitation',
    note: 'Noise and crowd layers are OSM-derived proxies; AQI and heat are ~km-grid models interpolated to cells.',
    detail:
      'Gasparrini et al. show environmental–mortality risk varies sharply with local exposure, which km-scale grids cannot resolve. EvoComb is street-level only where sensor data exists and labels every modelled cell as such, rather than implying precision it does not have.',
    link: 'https://doi.org/10.1016/S0140-6736(14)62114-0',
    doi: '10.1016/S0140-6736(14)62114-0',
  },
];

export const CONFIDENCE_META: Record<Confidence, { label: string; level: number; color: string }> = {
  high: { label: 'High confidence', level: 0.92, color: '#27ae60' },
  moderate: { label: 'Moderate confidence', level: 0.66, color: '#f1c40f' },
  limitation: { label: 'Known limitation', level: 0.4, color: '#7f8c8d' },
};
