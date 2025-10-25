import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock, Briefcase, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface JobListing {
  id: string;
  title: string;
  company: string;
  description: string;
  type: 'stage' | 'job-etudiant' | 'freelance' | 'cours-particuliers' | 'babysitting';
  contract: 'cdi' | 'cdd' | 'stage' | 'interim' | 'freelance';
  salary: {
    min: number;
    max: number;
    period: 'hour' | 'month' | 'year';
  };
  location: {
    city: string;
    remote: boolean;
    university?: string;
  };
  requirements: {
    level: 'licence' | 'master' | 'doctorat' | 'tous-niveaux';
    experience: string;
    skills: string[];
  };
  schedule: {
    hours: string;
    flexible: boolean;
  };
  contact: {
    email: string;
    phone?: string;
    website?: string;
  };
  postedAt: Date;
  deadline?: Date;
}

export const JobSearchPage: React.FC = () => {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    contract: '',
    level: '',
    city: '',
    remote: '',
  });

  // Données d'exemple pour le développement
  const mockJobs: JobListing[] = [
    {
      id: '1',
      title: 'Développeur Frontend React - Stage',
      company: 'TechStart Paris',
      description: 'Rejoins notre équipe pour développer des interfaces modernes avec React et TypeScript. Formation et mentoring assurés.',
      type: 'stage',
      contract: 'stage',
      salary: {
        min: 600,
        max: 800,
        period: 'month'
      },
      location: {
        city: 'Paris',
        remote: true,
        university: 'Sorbonne Université'
      },
      requirements: {
        level: 'master',
        experience: 'Débutant accepté',
        skills: ['React', 'TypeScript', 'CSS']
      },
      schedule: {
        hours: '35h/semaine',
        flexible: true
      },
      contact: {
        email: 'stage@techstart.fr',
        website: 'techstart.fr'
      },
      postedAt: new Date(),
      deadline: new Date('2025-02-28')
    },
    {
      id: '2',
      title: 'Cours particuliers Mathématiques',
      company: 'Particulier',
      description: 'Recherche étudiant en Master Maths pour donner des cours à domicile niveau lycée.',
      type: 'cours-particuliers',
      contract: 'freelance',
      salary: {
        min: 20,
        max: 25,
        period: 'hour'
      },
      location: {
        city: 'Paris 16e',
        remote: false
      },
      requirements: {
        level: 'master',
        experience: 'Première expérience souhaitée',
        skills: ['Mathématiques', 'Pédagogie']
      },
      schedule: {
        hours: '2h/semaine',
        flexible: true
      },
      contact: {
        email: 'marie.martin@example.com',
        phone: '06.12.34.56.78'
      },
      postedAt: new Date(),
      deadline: new Date('2025-01-30')
    },
    {
      id: '3',
      title: 'Assistant Marketing Digital',
      company: 'Agence Digital Plus',
      description: 'Job étudiant flexible. Gestion réseaux sociaux et création de contenu pour nos clients.',
      type: 'job-etudiant',
      contract: 'cdd',
      salary: {
        min: 12,
        max: 15,
        period: 'hour'
      },
      location: {
        city: 'Lyon',
        remote: true
      },
      requirements: {
        level: 'licence',
        experience: 'Débutant accepté',
        skills: ['Réseaux sociaux', 'Canva', 'Communication']
      },
      schedule: {
        hours: '15h/semaine',
        flexible: true
      },
      contact: {
        email: 'recrutement@digitalplus.fr'
      },
      postedAt: new Date()
    }
  ];

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        // Utiliser la vraie recherche Algolia si disponible, sinon les données mock
        if (searchQuery || Object.keys(filters).length > 0) {
          // Ici vous pouvez importer et utiliser searchJobs d'algoliaConfig
          // const { searchJobs } = await import('../components/ui/algoliaConfig');
          // const results = await searchJobs(searchQuery, filters);
          // setJobs(results.hits);
        }
        
        // Pour l'instant, utiliser les données mock
        setTimeout(() => {
          setJobs(mockJobs);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erreur recherche emplois:', error);
        setLoading(false);
      }
    };

    fetchJobs();
  }, [searchQuery, filters]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stage': return <GraduationCap className="w-4 h-4" />;
      case 'job-etudiant': return <Briefcase className="w-4 h-4" />;
      case 'cours-particuliers': return <GraduationCap className="w-4 h-4" />;
      case 'babysitting': return <Briefcase className="w-4 h-4" />;
      default: return <Briefcase className="w-4 h-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'stage': return 'bg-blue-100 text-blue-800';
      case 'job-etudiant': return 'bg-green-100 text-green-800';
      case 'cours-particuliers': return 'bg-purple-100 text-purple-800';
      case 'babysitting': return 'bg-pink-100 text-pink-800';
      case 'freelance': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSalary = (salary: JobListing['salary']) => {
    const { min, max, period } = salary;
    const periodText = period === 'hour' ? '/h' : period === 'month' ? '/mois' : '/an';
    
    if (min === max) {
      return `${min}€${periodText}`;
    }
    return `${min}-${max}€${periodText}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Jobs & Stages étudiants
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Trouvez l'opportunité parfaite compatible avec vos études
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Rechercher par poste, entreprise, compétences..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 py-3 text-lg"
            />
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          <Select onValueChange={(value) => handleFilterChange('type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Type d'emploi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stage">Stages</SelectItem>
              <SelectItem value="job-etudiant">Jobs étudiants</SelectItem>
              <SelectItem value="cours-particuliers">Cours particuliers</SelectItem>
              <SelectItem value="babysitting">Baby-sitting</SelectItem>
              <SelectItem value="freelance">Freelance</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => handleFilterChange('level', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Niveau d'études" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous-niveaux">Tous niveaux</SelectItem>
              <SelectItem value="licence">Licence</SelectItem>
              <SelectItem value="master">Master</SelectItem>
              <SelectItem value="doctorat">Doctorat</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="text"
            placeholder="Ville"
            value={filters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
          />

          <Select onValueChange={(value) => handleFilterChange('remote', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Modalité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Télétravail</SelectItem>
              <SelectItem value="false">Présentiel</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => handleFilterChange('contract', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Contrat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stage">Stage</SelectItem>
              <SelectItem value="cdd">CDD</SelectItem>
              <SelectItem value="freelance">Freelance</SelectItem>
              <SelectItem value="interim">Intérim</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Résultats */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{job.title}</h3>
                        <Badge className={getTypeBadgeColor(job.type)}>
                          {getTypeIcon(job.type)}
                          <span className="ml-1 capitalize">{job.type.replace('-', ' ')}</span>
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
                        {job.company}
                      </p>
                      
                      <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                        {job.description}
                      </p>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-primary mb-1">
                        {formatSalary(job.salary)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {job.schedule.hours}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {job.location.city}
                      {job.location.remote && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Télétravail possible
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <GraduationCap className="w-4 h-4 mr-1" />
                      {job.requirements.level}
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Publié il y a {Math.floor((Date.now() - job.postedAt.getTime()) / (1000 * 60 * 60 * 24))} jours
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.requirements.skills.slice(0, 4).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {job.requirements.skills.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{job.requirements.skills.length - 4} autres
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {job.deadline && (
                        <span>
                          Candidature avant le {job.deadline.toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Sauvegarder
                      </Button>
                      <Button size="sm">
                        Postuler
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};