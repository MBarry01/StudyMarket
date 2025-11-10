export interface UniversityInfo {
  name: string;
  slug: string;
  campus: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

const UNIVERSITIES_RAW: UniversityInfo[] = [
  {
    name: 'Sorbonne Université',
    slug: 'sorbonne',
    campus: 'Campus Pierre et Marie Curie',
    location: 'Paris, France',
    coordinates: { lat: 48.8463, lng: 2.3551 },
  },
  {
    name: 'Université Paris 3 Sorbonne',
    slug: 'sorbonne-nouvelle',
    campus: 'Campus Censier',
    location: 'Paris, France',
    coordinates: { lat: 48.8403, lng: 2.3566 },
  },
  {
    name: 'Université Paris-Dauphine',
    slug: 'dauphine',
    campus: 'Campus Dauphine - Porte Dauphine',
    location: 'Paris, France',
    coordinates: { lat: 48.8688, lng: 2.2768 },
  },
  {
    name: 'Université Paris-Saclay',
    slug: 'paris-saclay',
    campus: 'Campus Orsay-Bures',
    location: 'Gif-sur-Yvette, France',
    coordinates: { lat: 48.7068, lng: 2.1742 },
  },
  {
    name: 'École Polytechnique',
    slug: 'polytechnique',
    campus: 'Campus de Palaiseau',
    location: 'Palaiseau, France',
    coordinates: { lat: 48.712, lng: 2.205 },
  },
  {
    name: 'ENS Paris',
    slug: 'ens',
    campus: 'Campus Ulm',
    location: 'Paris, France',
    coordinates: { lat: 48.8415, lng: 2.3445 },
  },
  {
    name: 'CentraleSupélec',
    slug: 'centrale',
    campus: 'Campus Paris-Saclay',
    location: 'Gif-sur-Yvette, France',
    coordinates: { lat: 48.7095, lng: 2.1719 },
  },
  {
    name: 'MINES ParisTech',
    slug: 'mines-paristech',
    campus: 'Campus Mines Paris PSL',
    location: 'Paris, France',
    coordinates: { lat: 48.8456, lng: 2.3449 },
  },
  {
    name: 'HEC Paris',
    slug: 'hec-paris',
    campus: 'Campus Jouy-en-Josas',
    location: 'Jouy-en-Josas, France',
    coordinates: { lat: 48.7592, lng: 2.1643 },
  },
  {
    name: 'ESSEC',
    slug: 'essec',
    campus: 'Campus Cergy',
    location: 'Cergy, France',
    coordinates: { lat: 49.0356, lng: 2.0709 },
  },
  {
    name: 'ESCP',
    slug: 'escp',
    campus: 'Campus Paris République',
    location: 'Paris, France',
    coordinates: { lat: 48.866, lng: 2.3911 },
  },
  {
    name: 'Université Paris 1 Panthéon-Sorbonne',
    slug: 'paris-1',
    campus: 'Campus Panthéon',
    location: 'Paris, France',
    coordinates: { lat: 48.847, lng: 2.3444 },
  },
  {
    name: 'Université Paris Cité',
    slug: 'paris-cite',
    campus: 'Campus Grands Moulins',
    location: 'Paris, France',
    coordinates: { lat: 48.8275, lng: 2.3791 },
  },
  {
    name: 'Sciences Po Paris',
    slug: 'sciences-po',
    campus: "Campus Saint-Thomas d'Aquin",
    location: 'Paris, France',
    coordinates: { lat: 48.851, lng: 2.3266 },
  },
  {
    name: 'Université de Lyon',
    slug: 'lyon',
    campus: 'Campus LyonTech-La Doua',
    location: 'Villeurbanne, France',
    coordinates: { lat: 45.7811, lng: 4.8784 },
  },
  {
    name: 'Université de Marseille',
    slug: 'marseille',
    campus: 'Campus Saint-Charles',
    location: 'Marseille, France',
    coordinates: { lat: 43.3025, lng: 5.3806 },
  },
  {
    name: 'Université de Toulouse',
    slug: 'toulouse',
    campus: 'Campus Rangueil',
    location: 'Toulouse, France',
    coordinates: { lat: 43.5606, lng: 1.4676 },
  },
  {
    name: 'Université de Bordeaux',
    slug: 'bordeaux',
    campus: 'Campus Talence-Pessac',
    location: 'Talence, France',
    coordinates: { lat: 44.804, lng: -0.5967 },
  },
  {
    name: 'Université de Lille',
    slug: 'lille',
    campus: 'Campus Cité Scientifique',
    location: "Villeneuve-d'Ascq, France",
    coordinates: { lat: 50.6091, lng: 3.139 },
  },
  {
    name: 'Université de Strasbourg',
    slug: 'strasbourg',
    campus: 'Campus Esplanade',
    location: 'Strasbourg, France',
    coordinates: { lat: 48.5793, lng: 7.7656 },
  },
  {
    name: 'Université de Nantes',
    slug: 'nantes',
    campus: 'Campus Tertre',
    location: 'Nantes, France',
    coordinates: { lat: 47.2445, lng: -1.5616 },
  },
  {
    name: 'Université de Montpellier',
    slug: 'montpellier',
    campus: 'Campus Triolet',
    location: 'Montpellier, France',
    coordinates: { lat: 43.6314, lng: 3.8703 },
  },
  {
    name: 'Autre université',
    slug: 'autre-universite',
    campus: '',
    location: '',
  },
];

export const UNIVERSITIES: UniversityInfo[] = UNIVERSITIES_RAW;

export const UNIVERSITY_NAMES = UNIVERSITIES.map((uni) => uni.name);

export const UNIVERSITY_METADATA_BY_NAME: Record<
  string,
  { campus: string; location: string; slug: string; coordinates?: { lat: number; lng: number } }
> = UNIVERSITIES.reduce((acc, uni) => {
  acc[uni.name] = {
    campus: uni.campus,
    location: uni.location,
    slug: uni.slug,
    coordinates: uni.coordinates,
  };
  return acc;
}, {} as Record<string, { campus: string; location: string; slug: string; coordinates?: { lat: number; lng: number } }>);

export const UNIVERSITY_NAME_BY_SLUG: Record<string, string> = UNIVERSITIES.reduce(
  (acc, uni) => {
    acc[uni.slug] = uni.name;
    return acc;
  },
  {} as Record<string, string>
);

export const UNIVERSITY_SELECT_OPTIONS = UNIVERSITIES.map((uni) => ({
  value: uni.name,
  label: uni.name,
}));

export const UNIVERSITY_FILTER_OPTIONS = [
  { value: 'all', label: 'Toutes universités' },
  ...UNIVERSITIES.filter((uni) => uni.slug !== 'autre-universite').map((uni) => ({
    value: uni.slug,
    label: uni.name,
  })),
];

export const getUniversityMetadata = (name: string | null | undefined) => {
  if (!name) {
    return { campus: '', location: '', slug: '', coordinates: undefined };
  }
  return (
    UNIVERSITY_METADATA_BY_NAME[name] || {
      campus: '',
      location: '',
      slug: '',
      coordinates: undefined,
    }
  );
};

