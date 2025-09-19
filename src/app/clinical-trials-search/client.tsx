

// src/app/clinical-trials-search/client.tsx
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useActionState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, ServerCrash, PackageOpen, ExternalLink, Printer, Share2, Mail as MailIcon, Twitter, Linkedin, FilterX, X, Calendar as CalendarIcon, ChevronDown, Info, FolderPlus, LayoutGrid, List, Download, Bookmark } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import type { ClinicalTrial, Folder } from '@/lib/types';
import { FormattedCriteria } from '@/components/formatted-criteria';
import { OutcomeMeasures } from '@/components/outcome-measures';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { format, parseISO, isValid } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DateRange } from "react-day-picker"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { handleCreateFolder, handleGetFolders, handleSaveStudyToFolders } from '../actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import type { AuthenticatedUser } from '@/lib/types';

const phaseColors: { [key: string]: string } = {
  'Early Phase 1': 'bg-purple-500 text-white',
  'Phase 1': 'bg-blue-500 text-white',
  'Phase 2': 'bg-yellow-500 text-white',
  'Phase 3': 'bg-orange-500 text-white',
  'Phase 4': 'bg-green-500 text-white',
  'Not Applicable': 'bg-gray-400 text-white',
  'N/A': 'bg-gray-400 text-white',
};

const renderFormattedText = (text: string | null | undefined) => {
    if (!text) return null;
    return text.replace(/\\n/g, '\n').split('\n').map((line, index) => {
        const trimmedLine = line.trim();
        // Handle double asterisks (nested lists)
        if (trimmedLine.startsWith('**')) {
            return (
                <div key={index} className="flex items-start gap-2 pl-8 mb-2 last:mb-0">
                    <span className="mt-1 font-bold">&bull;</span>
                    <span>{trimmedLine.substring(2).trim()}</span>
                </div>
            );
        }
        // Handle single asterisks (primary lists)
        if (trimmedLine.startsWith('*')) {
             const content = trimmedLine.substring(1).trim();
             return (
                 <div key={index} className="flex items-start gap-2 pl-4 mb-2 last:mb-0">
                     <span className="mt-1 font-bold">&bull;</span>
                     <span>{content}</span>
                 </div>
             );
        }
        return (
            <p key={index} className="mb-2 last:mb-0">{line || '\u00A0'}</p>
        );
    });
};

const ModalDetailRow = ({ label, value, isHtml = false, condenseShortHtml = false }: { label: string; value?: string | React.ReactNode | null; isHtml?: boolean, condenseShortHtml?: boolean }) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;

  const uniqueArrayValues = Array.isArray(value) ? [...new Set(value as string[])] : null;

  if (uniqueArrayValues) {
     return (
        <div className="grid grid-cols-[150px_1fr] items-start gap-4">
            <Label className="text-right font-semibold text-muted-foreground pt-1">{label}</Label>
            <div className="text-sm space-y-1">
                {uniqueArrayValues.map((item, index) => (
                    <div key={index}>{item}</div>
                ))}
            </div>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-[150px_1fr] items-start gap-4">
      <Label className="text-right font-semibold text-muted-foreground pt-1">{label}</Label>
      {isHtml && typeof value === 'string' ? (
         <div className="text-sm">
           {condenseShortHtml && value.trim().split(/\s+/).length <= 500
             ? <p>{value.replace(/\\n/g, ' ')}</p>
             : renderFormattedText(value)}
         </div>
      ) : (
        <div className="text-sm">{value}</div>
      )}
    </div>
  );
};

const parseAge = (ageString: string | null): number | null => {
    if (!ageString) return null;
    const match = ageString.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : null;
};

const ageRanges = {
    child: { min: 0, max: 17 },
    adult: { min: 18, max: 64 },
    older: { min: 65, max: Infinity },
};

function CreateFolderForm({ onFolderCreated }: { onFolderCreated: (folder: Folder) => void }) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction] = useActionState(handleCreateFolder, { success: false, message: null, folder: undefined });
    
    useEffect(() => {
        if (state.success && state.folder) {
            toast({ title: "Success", description: state.message });
            onFolderCreated(state.folder);
            formRef.current?.reset();
        } else if (state.message) {
            toast({ variant: 'destructive', title: "Creation Failed", description: state.message });
        }
    }, [state, onFolderCreated, toast]);
    
    return (
        <form action={formAction} ref={formRef} className="space-y-2">
            <Label htmlFor="new-folder">Create New Folder</Label>
            <div className="flex gap-2">
                <Input
                    id="new-folder"
                    name="folderName"
                    placeholder="e.g., Oncology Research"
                    required
                />
                <Button type="submit" variant="outline">
                    Create
                </Button>
            </div>
        </form>
    );
}

function SaveToFolderDialog({ trials, onOpenChange }: { trials: ClinicalTrial[], onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
    const [isSaving, startSavingTransition] = React.useTransition();

    React.useEffect(() => {
        if (trials.length > 0) {
            handleGetFolders().then(setFolders);
        }
    }, [trials]);

    const handleSelectFolder = (folderId: string, checked: boolean) => {
        setSelectedFolders(prev => {
            const newSet = new Set(prev);
            if (checked) newSet.add(folderId);
            else newSet.delete(folderId);
            return newSet;
        });
    };

    const handleFolderCreated = (newFolder: Folder) => {
        setFolders(currentFolders => [newFolder, ...currentFolders]);
        // Automatically select the newly created folder
        setSelectedFolders(prev => new Set(prev).add(newFolder.id));
    };
    
    const handleSave = () => {
        if (!trials || trials.length === 0 || selectedFolders.size === 0) return;
        startSavingTransition(async () => {
            const results = await Promise.all(
                trials.map(trial => handleSaveStudyToFolders(trial, Array.from(selectedFolders)))
            );
            
            const failures = results.filter(r => !r.success);
            if (failures.length > 0) {
                toast({ variant: 'destructive', title: "Some studies failed to save", description: failures.map(f => f.message).join(', ') });
            } else {
                 toast({ title: `Saved ${trials.length} studies to ${selectedFolders.size} folder(s).` });
            }
            onOpenChange(false);
        });
    };

    if (!trials || trials.length === 0) return null;
    
    const trialTitle = trials.length === 1 ? `"${trials[0].briefTitle}"` : `${trials.length} studies`;

    return (
        <Dialog open={trials.length > 0} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Save to Folder</DialogTitle>
                    <DialogDescription>Select folders to save {trialTitle}.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Existing Folders</Label>
                        <div className="max-h-40 overflow-y-auto space-y-2 rounded-md border p-2">
                            {folders.length > 0 ? folders.map(folder => (
                                <div key={folder.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`folder-${folder.id}`}
                                        onCheckedChange={(c) => handleSelectFolder(folder.id, !!c)}
                                        checked={selectedFolders.has(folder.id)}
                                    />
                                    <Label htmlFor={`folder-${folder.id}`} className="font-normal">{folder.name}</Label>
                                </div>
                            )) : <p className="text-sm text-muted-foreground">No folders created yet.</p>}
                        </div>
                    </div>
                    <CreateFolderForm onFolderCreated={handleFolderCreated} />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={selectedFolders.size === 0 || isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CardView({ studies, onTrialSelect, onSaveToFolder }: { studies: ClinicalTrial[], onTrialSelect: (trial: ClinicalTrial) => void, onSaveToFolder: (trial: ClinicalTrial) => void }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {studies.map((study: ClinicalTrial, index: number) => (
                <Card key={study.nctId || index} className="flex flex-col h-full">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold leading-snug line-clamp-3">
                            {study.briefTitle || 'No Title Provided'}
                        </CardTitle>
                        <CardDescription className="text-xs pt-1 line-clamp-2">
                            {study.condition || 'No condition specified'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto flex flex-col gap-4">
                        <div className="flex flex-wrap gap-2 text-xs items-center">
                            <Badge variant="outline">{study.nctId}</Badge>
                            <div
                                className={cn(
                                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                                    phaseColors[study.phase as keyof typeof phaseColors] || 'bg-gray-200 text-gray-800'
                                )}
                                >
                                {study.phase || 'N/A'}
                            </div>
                            <div 
                                style={study.overallStatus === 'ACTIVE_NOT_RECRUITING' ? { backgroundColor: '#CA8A03' } : {}}
                                className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-white', {
                                    'bg-green-600': ['RECRUITING', 'ENROLLING_BY_INVITATION'].includes(study.overallStatus as string),
                                    'bg-yellow-500': study.overallStatus === 'NOT_YET_RECRUITING',
                                    'bg-blue-600': study.overallStatus === 'COMPLETED',
                                    'bg-destructive': ['TERMINATED', 'WITHDRAWN'].includes(study.overallStatus as string),
                                    'bg-gray-500': !['RECRUITING', 'ENROLLING_BY_INVITATION', 'NOT_YET_RECRUITING', 'COMPLETED', 'TERMINATED', 'WITHDRAWN', 'ACTIVE_NOT_RECRUITING'].includes(study.overallStatus as string),
                                })}
                            >
                                {study.overallStatus.replace(/_/g, ' ')}
                            </div>
                            <Badge variant="outline">Start: {study.startDate ? format(parseISO(study.startDate), 'LLL yyyy') : 'N/A'}</Badge>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => onTrialSelect(study)}>View Details</Button>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={() => onSaveToFolder(study)}>
                                            <FolderPlus className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Save to folder</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function TableView({
  studies,
  onTrialSelect,
  selectedTrials,
  onSelectAll,
  onSelectRow,
}: {
  studies: ClinicalTrial[];
  onTrialSelect: (trial: ClinicalTrial) => void;
  selectedTrials: Set<string>;
  onSelectAll: (checked: boolean) => void;
  onSelectRow: (nctId: string, checked: boolean) => void;
}) {
  const renderList = (items: string[] | null) => {
    if (!items || items.length === 0) return null;
    return (
      <ul className="list-disc pl-4">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
  };

  return (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead className="w-[50px]">
            <Checkbox
              checked={studies.length > 0 && selectedTrials.size === studies.length}
              onCheckedChange={(checked) => onSelectAll(!!checked)}
              aria-label="Select all rows"
            />
          </TableHead>
          <TableHead className="font-semibold text-foreground">Study Title</TableHead>
          <TableHead className="font-semibold text-foreground">NCT Number</TableHead>
          <TableHead className="font-semibold text-foreground">Status</TableHead>
          <TableHead className="font-semibold text-foreground">Conditions</TableHead>
          <TableHead className="font-semibold text-foreground">Interventions</TableHead>
          <TableHead className="font-semibold text-foreground">Sponsor</TableHead>
          <TableHead className="font-semibold text-foreground">Study Type</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {studies.map((study, index) => (
          <TableRow key={study.nctId}>
            <TableCell>
              <div className="flex flex-col items-center">
                <Checkbox
                  checked={selectedTrials.has(study.nctId)}
                  onCheckedChange={(checked) => onSelectRow(study.nctId, !!checked)}
                  aria-label={`Select row ${index + 1}`}
                />
              </div>
            </TableCell>
            <TableCell>
              <Button variant="link" className="p-0 h-auto text-left whitespace-normal" onClick={() => onTrialSelect(study)}>
                {study.briefTitle}
              </Button>
            </TableCell>
            <TableCell>{study.nctId}</TableCell>
            <TableCell>
              <div className="flex flex-col items-start gap-1">
                <div
                  className={cn(
                    'inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold text-white',
                    {
                      'bg-green-600': ['RECRUITING', 'ENROLLING_BY_INVITATION'].includes(study.overallStatus),
                      'bg-red-600': ['TERMINATED', 'WITHDRAWN'].includes(study.overallStatus),
                      'bg-yellow-500': ['NOT_YET_RECRUITING', 'ACTIVE_NOT_RECRUITING'].includes(study.overallStatus),
                      'bg-blue-600': study.overallStatus === 'COMPLETED',
                      'bg-gray-500': !['RECRUITING', 'ENROLLING_BY_INVITATION', 'NOT_YET_RECRUITING', 'ACTIVE_NOT_RECRUITING', 'COMPLETED', 'TERMINATED', 'WITHDRAWN'].includes(study.overallStatus),
                    }
                  )}
                >
                  {study.overallStatus.replace(/_/g, ' ')}
                </div>
                {study.hasResults && (
                  <a href={`${study.url}?view=results`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                    WITH RESULTS
                  </a>
                )}
              </div>
            </TableCell>
            <TableCell>{renderList(study.condition ? study.condition.split(/,\s*|\s+and\s+/) : [])}</TableCell>
            <TableCell>{renderList(study.interventionNames)}</TableCell>
            <TableCell>{study.leadSponsorName}</TableCell>
            <TableCell>{study.studyType}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const escapeCSV = (field: any): string => {
    if (field === null || field === undefined) {
        return '';
    }
    let str = String(field);
    // If the field contains a comma, double quote, or newline, wrap it in double quotes.
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        // Escape existing double quotes by doubling them.
        str = str.replace(/"/g, '""');
        return `"${str}"`;
    }
    return str;
};


const convertToCSV = (data: ClinicalTrial[]): string => {
    if (!data || data.length === 0) {
        return '';
    }

    const headers = [
        'NCT ID', 'Brief Title', 'Official Title', 'Status', 'Phase',
        'Conditions', 'Intervention Names', 'Sponsor', 'Study Type', 'Enrollment',
        'Start Date', 'Completion Date', 'URL'
    ];

    const rows = data.map(trial => [
        escapeCSV(trial.nctId),
        escapeCSV(trial.briefTitle),
        escapeCSV(trial.officialTitle),
        escapeCSV(trial.overallStatus),
        escapeCSV(trial.phase),
        escapeCSV(trial.condition),
        escapeCSV(trial.interventionNames?.join('; ')), // Join array elements
        escapeCSV(trial.leadSponsorName),
        escapeCSV(trial.studyType),
        escapeCSV(trial.enrollmentCount),
        escapeCSV(trial.startDate),
        escapeCSV(trial.completionDate),
        escapeCSV(trial.url),
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
};

const downloadCSV = (csvString: string, filename: string) => {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

export default function ClinicalTrialsSearchClient({ user }: { user: AuthenticatedUser | null }) {
  const [query, setQuery] = useState('');
  const [studies, setStudies] = useState<ClinicalTrial[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawErrorData, setRawErrorData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [selectedTrial, setSelectedTrial] = useState<ClinicalTrial | null>(null);
  const [trialsToSaveFolder, setTrialsToSaveFolder] = useState<ClinicalTrial[]>([]);
  const [studiesPerPage, setStudiesPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [selectedTrials, setSelectedTrials] = useState(new Set<string>());

  // Filter states
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  const [selectedPhases, setSelectedPhases] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [locationFilter, setLocationFilter] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedGender, setSelectedGender] = useState<'All' | 'Female' | 'Male'>('All');
  const [ageFilterMode, setAgeFilterMode] = useState<'ranges' | 'manual'>('ranges');
  const [selectedAgeRanges, setSelectedAgeRanges] = useState<Set<string>>(new Set());
  const [manualAgeFrom, setManualAgeFrom] = useState('');
  const [manualAgeTo, setManualAgeTo] = useState('');
  const [acceptsHealthyVolunteers, setAcceptsHealthyVolunteers] = useState(false);
  const [withResults, setWithResults] = useState(false);
  const [withoutResults, setWithoutResults] = useState(false);

  const isPro = user?.plan === 'pro';

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setIsLoading(true);
    setSearchedQuery(query);
    setStudies(null);
    setError(null);
    setRawErrorData(null);
    setSelectedTrials(new Set());
    setCurrentPage(1);
    
    try {
        const response = await fetch(`/api/clinical-trials?query=${encodeURIComponent(query)}`);
        const result = await response.json();
    
        if (!response.ok) {
            setError(result.error || `An API error occurred: ${response.status}`);
            if (result.rawData) {
                setRawErrorData(result.rawData);
            }
        } else {
            setStudies(result.studies || []);
        }
    } catch (err: any) {
        setError(err.message || 'An unexpected client-side error occurred.');
    } finally {
        setIsLoading(false);
    }
  };
  
  const clearFilters = () => {
    setSelectedStatuses(new Set());
    setSelectedPhases(new Set());
    setSelectedTypes(new Set());
    setLocationFilter('');
    setDateRange(undefined);
    setSelectedGender('All');
    setAgeFilterMode('ranges');
    setSelectedAgeRanges(new Set());
    setManualAgeFrom('');
    setManualAgeTo('');
    setAcceptsHealthyVolunteers(false);
    setWithResults(false);
    setWithoutResults(false);
  };
  
  const { allStatuses, allPhases, allTypes } = useMemo(() => {
    if (!studies) return { allStatuses: [], allPhases: [], allTypes: [] };

    const statuses = new Set<string>();
    const phases = new Set<string>();
    const types = new Set<string>();

    studies.forEach(study => {
        if (study.overallStatus) statuses.add(study.overallStatus);
        if (study.phase) phases.add(study.phase === 'N/A' ? 'Not Applicable' : study.phase);
        if (study.studyType) types.add(study.studyType);
    });

    const statusList = Array.from(statuses).sort().map(s => ({ id: s, label: s.replace(/_/g, ' ') }));
    const phaseList = Array.from(phases).sort().map(p => ({ id: p, label: p }));
    const typeList = Array.from(types).sort();

    return { allStatuses: statusList, allPhases: phaseList, allTypes: typeList };
  }, [studies]);


  const filteredStudies = useMemo(() => {
    if (!studies) {
      return [];
    }

    return studies.filter(study => {
        const statusMatch = selectedStatuses.size === 0 || (study.overallStatus && selectedStatuses.has(study.overallStatus));
        
        const phaseMatch = (() => {
            if (selectedPhases.size === 0) return true;
            if (!study.phase) return false;
            const normalizedPhase = study.phase === 'N/A' || study.phase === 'NA' ? 'Not Applicable' : study.phase;
            return selectedPhases.has(normalizedPhase);
        })();

        const typeMatch = selectedTypes.size === 0 || (study.studyType && selectedTypes.has(study.studyType));
        
        const locationMatch = !locationFilter || 
            (study.locationCountries || []).some(c => c.toLowerCase().includes(locationFilter.toLowerCase())) ||
            (study.locationCities || []).some(c => c.toLowerCase().includes(locationFilter.toLowerCase())) ||
            (study.locationFacilities || []).some(f => f.toLowerCase().includes(locationFilter.toLowerCase()));
        
        const dateMatch = (() => {
          if (!dateRange?.from) return true;
          const filterStart = dateRange.from;
          const filterEnd = dateRange.to || dateRange.from;

          const studyStart = study.startDate ? parseISO(study.startDate) : null;
          if (!studyStart || !isValid(studyStart)) return false;

          return studyStart >= filterStart && studyStart <= filterEnd;
        })();

        const genderMatch = selectedGender === 'All' || study.gender === selectedGender || study.gender === 'ALL';
        
        const healthyVolunteerMatch = !acceptsHealthyVolunteers || study.healthyVolunteers === 'Yes';
        
        const ageMatch = (() => {
            const minAge = parseAge(study.minimumAge);
            const maxAge = parseAge(study.maximumAge);

            if (ageFilterMode === 'ranges') {
                if (selectedAgeRanges.size === 0) return true;
                
                for (const range of selectedAgeRanges) {
                    const { min, max } = ageRanges[range as keyof typeof ageRanges];
                    // Check for overlap between trial's age range and selected filter range
                    if ((minAge === null || minAge <= max) && (maxAge === null || maxAge >= min)) {
                        return true;
                    }
                }
                return false;

            } else { // manual mode
                const from = manualAgeFrom ? parseInt(manualAgeFrom, 10) : null;
                const to = manualAgeTo ? parseInt(manualAgeTo, 10) : null;

                if (from === null && to === null) return true;

                const trialMin = minAge ?? 0;
                const trialMax = maxAge ?? Infinity;
                
                const filterMin = from ?? 0;
                const filterMax = to ?? Infinity;
                
                // Check if trial range overlaps with manual filter range
                return trialMin <= filterMax && trialMax >= filterMin;
            }
        })();

        const resultsMatch = (() => {
            if (withResults && withoutResults) return true;
            if (!withResults && !withoutResults) return true;
            if (withResults) return study.hasResults;
            if (withoutResults) return !study.hasResults;
            return true;
        })();

        return statusMatch && phaseMatch && typeMatch && locationMatch && dateMatch && genderMatch && healthyVolunteerMatch && ageMatch && resultsMatch;
    });
  }, [studies, selectedStatuses, selectedPhases, selectedTypes, locationFilter, dateRange, selectedGender, ageFilterMode, selectedAgeRanges, manualAgeFrom, manualAgeTo, acceptsHealthyVolunteers, withResults, withoutResults]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchedQuery, selectedStatuses, selectedPhases, selectedTypes, locationFilter, dateRange, selectedGender, ageFilterMode, selectedAgeRanges, manualAgeFrom, manualAgeTo, acceptsHealthyVolunteers, withResults, withoutResults, studiesPerPage]);
  
  const totalPages = Math.ceil(filteredStudies.length / studiesPerPage);
  const startIndex = (currentPage - 1) * studiesPerPage;
  const endIndex = startIndex + studiesPerPage;
  const studiesToShow = filteredStudies.slice(startIndex, endIndex);

  const hasActiveFilters = selectedStatuses.size > 0 || selectedPhases.size > 0 || selectedTypes.size > 0 || locationFilter !== '' || !!dateRange || selectedGender !== 'All' || selectedAgeRanges.size > 0 || manualAgeFrom !== '' || manualAgeTo !== '' || acceptsHealthyVolunteers || withResults || withoutResults;

  const handleStatusChange = (statusId: string, checked: boolean) => {
    setSelectedStatuses(prev => {
        const newSet = new Set(prev);
        if (checked) {
            newSet.add(statusId);
        } else {
            newSet.delete(statusId);
        }
        return newSet;
    });
  };

  const handlePhaseChange = (phaseId: string, checked: boolean) => {
    setSelectedPhases(prev => {
        const newSet = new Set(prev);
        if (checked) {
            newSet.add(phaseId);
        } else {
            newSet.delete(phaseId);
        }
        return newSet;
    });
  };

  const handleTypeChange = (typeId: string, checked: boolean) => {
    setSelectedTypes(prev => {
        const newSet = new Set(prev);
        if (checked) {
            newSet.add(typeId);
        } else {
            newSet.delete(typeId);
        }
        return newSet;
    });
  };
  
   const handleAgeRangeChange = (range: string, checked: boolean) => {
    setSelectedAgeRanges(prev => {
      const newSet = new Set(prev);
      if (checked) newSet.add(range);
      else newSet.delete(range);
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTrials(new Set(studiesToShow.map((t) => t.nctId)));
    } else {
      setSelectedTrials(new Set());
    }
  };

  const handleSelectRow = (nctId: string, checked: boolean) => {
    setSelectedTrials((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(nctId);
      } else {
        newSet.delete(nctId);
      }
      return newSet;
    });
  };
  
  const handleOpenSaveFolder = () => {
    if (!filteredStudies) return;
    const trialsToSave = filteredStudies.filter(t => selectedTrials.has(t.nctId));
    setTrialsToSaveFolder(trialsToSave);
  };

  const handleDownload = () => {
    if (!filteredStudies) return;
    const trialsToDownload = filteredStudies.filter(t => selectedTrials.has(t.nctId));
    if (trialsToDownload.length === 0) return;

    const csvString = convertToCSV(trialsToDownload);
    downloadCSV(csvString, `clinical-trials-export-${new Date().toISOString().split('T')[0]}.csv`);
  }
  
  const eligibilityCounts = useMemo(() => {
    if (!studies) return {};
    return {
        all: studies.length,
        female: studies.filter(s => s.gender === 'Female' || s.gender === 'ALL').length,
        male: studies.filter(s => s.gender === 'Male' || s.gender === 'ALL').length,
        child: studies.filter(s => (parseAge(s.minimumAge) ?? 0) <= 17 && (parseAge(s.maximumAge) ?? Infinity) >= 0).length,
        adult: studies.filter(s => (parseAge(s.minimumAge) ?? 0) <= 64 && (parseAge(s.maximumAge) ?? Infinity) >= 18).length,
        older: studies.filter(s => (parseAge(s.maximumAge) ?? Infinity) >= 65).length,
        healthy: studies.filter(s => s.healthyVolunteers === 'Yes').length,
    }
  }, [studies]);

   const resultsCounts = useMemo(() => {
    if (!studies) return { withResults: 0, withoutResults: 0 };
    return {
        withResults: studies.filter(s => s.hasResults).length,
        withoutResults: studies.filter(s => !s.hasResults).length,
    }
  }, [studies]);

  const renderLocations = (trial: ClinicalTrial) => {
    const countries = [...new Set(trial.locationCountries?.filter(Boolean))];
    const cities = [...new Set(trial.locationCities?.filter(Boolean))];
    const facilities = [...new Set(trial.locationFacilities?.filter(Boolean))];

    if (countries.length === 0 && cities.length === 0 && facilities.length === 0) {
      return 'No location data provided.';
    }

    return (
      <div className="space-y-2">
        {countries.length > 0 && (
          <div>
            <p className="font-semibold text-foreground">Countries:</p>
            <p>{countries.join(', ')}</p>
          </div>
        )}
        {cities.length > 0 && (
          <div>
            <p className="font-semibold text-foreground">Cities:</p>
            <p>{cities.join(', ')}</p>
          </div>
        )}
        {facilities.length > 0 && (
          <div>
            <p className="font-semibold text-foreground">Facilities:</p>
            <p className="break-words">{facilities.join(', ')}</p>
          </div>
        )}
      </div>
    );
  };

  const StudyFilters = () => (
     <Card className="w-full md:w-auto md:min-w-[280px]">
        <CardHeader>
             <CardTitle className="flex items-center gap-2 text-lg">
                Study Filters
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Filter studies by their properties.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
             </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Label>Status</Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Indicates the current recruitment status or the expanded access status.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                            <span>
                                Select Status
                                {selectedStatuses.size > 0 && ` (${selectedStatuses.size})`}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto">
                        <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {allStatuses.map(status => (
                            <DropdownMenuCheckboxItem
                                key={status.id}
                                checked={selectedStatuses.has(status.id)}
                                onCheckedChange={(checked) => handleStatusChange(status.id, !!checked)}
                                onSelect={(e) => e.preventDefault()}
                            >
                                {status.label}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
             <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Label>Phase</Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                <p>The stage of a clinical trial studying a drug or biological product, based on definitions developed by the U.S. Food and Drug Administration (FDA). The phase is based on the study's objective, the number of participants, and other characteristics. There are five phases: Early Phase 1 (formerly listed as Phase 0), Phase 1, Phase 2, Phase 3, and Phase 4. Not Applicable is used to describe trials without FDA-defined phases, including trials of devices or behavioral interventions.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                            <span>
                                Select Phase
                                {selectedPhases.size > 0 && ` (${selectedPhases.size})`}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto">
                        <DropdownMenuLabel>Filter by Phase</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {allPhases.map(phase => (
                            <DropdownMenuCheckboxItem
                                key={phase.id}
                                checked={selectedPhases.has(phase.id)}
                                onCheckedChange={(checked) => handlePhaseChange(phase.id, !!checked)}
                                onSelect={(e) => e.preventDefault()}
                            >
                                {phase.label}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Label>Study Type</Label>
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                <p>Describes the nature of a clinical study. Study types include interventional studies (also called clinical trials), observational studies (including patient registries), and expanded access.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                            <span>
                                Select Study Type
                                {selectedTypes.size > 0 && ` (${selectedTypes.size})`}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto">
                        <DropdownMenuLabel>Filter by Study Type</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {allTypes.map(type => (
                            <DropdownMenuCheckboxItem
                                key={type}
                                checked={selectedTypes.has(type)}
                                onCheckedChange={(checked) => handleTypeChange(type, !!checked)}
                                onSelect={(e) => e.preventDefault()}
                            >
                                {type}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Label htmlFor="location-filter">Location</Label>
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Search by address, city, state, or country</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <Input
                  id="location-filter"
                  placeholder="Filter by location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full"
                />
            </div>
             <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} -{" "}
                              {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Filter by Start Date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
            </div>
            {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="w-full">
                    <X className="mr-2 h-4 w-4" />
                    Clear All Filters
                </Button>
            )}
        </CardContent>
    </Card>
  );
  
  const EligibilityFilters = () => (
     <Card className="w-full md:w-auto md:min-w-[280px]">
        <CardHeader>
             <CardTitle className="flex items-center gap-2 text-lg">
                Eligibility Criteria
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                            <p>The key requirements that people who want to participate in a clinical study must meet or the characteristics they must have. Eligibility criteria consist of both inclusion criteria (which are required for a person to participate in the study) and exclusion criteria (which prevent a person from participating). Types of eligibility criteria include whether a study accepts healthy volunteers, has age or age group requirements, or is limited by sex.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
             </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                <Label className="font-semibold">Sex</Label>
                <RadioGroup value={selectedGender} onValueChange={(v) => setSelectedGender(v as any)} className="mt-2 space-y-1">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="All" id="gender-all" />
                        <Label htmlFor="gender-all">All ({eligibilityCounts.all ?? 0})</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Female" id="gender-female" />
                        <Label htmlFor="gender-female">Female ({eligibilityCounts.female ?? 0})</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Male" id="gender-male" />
                        <Label htmlFor="gender-male">Male ({eligibilityCounts.male ?? 0})</Label>
                    </div>
                </RadioGroup>
            </div>
             <div>
                <Label className="font-semibold">Age</Label>
                 <RadioGroup value={ageFilterMode} onValueChange={(v) => setAgeFilterMode(v as any)} className="mt-2 space-y-2">
                    <div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="ranges" id="age-ranges" />
                            <Label htmlFor="age-ranges">Select ranges</Label>
                        </div>
                        <div className={cn("pl-6 mt-2 space-y-2", ageFilterMode !== 'ranges' && 'opacity-50')}>
                           <div className="flex items-center space-x-2">
                                <Checkbox id="age-child" checked={selectedAgeRanges.has('child')} onCheckedChange={(c) => handleAgeRangeChange('child', !!c)} disabled={ageFilterMode !== 'ranges'} />
                                <Label htmlFor="age-child" className="font-normal">Child (birth - 17) ({eligibilityCounts.child ?? 0})</Label>
                           </div>
                           <div className="flex items-center space-x-2">
                                <Checkbox id="age-adult" checked={selectedAgeRanges.has('adult')} onCheckedChange={(c) => handleAgeRangeChange('adult', !!c)} disabled={ageFilterMode !== 'ranges'}/>
                                <Label htmlFor="age-adult" className="font-normal">Adult (18 - 64) ({eligibilityCounts.adult ?? 0})</Label>
                           </div>
                           <div className="flex items-center space-x-2">
                                <Checkbox id="age-older" checked={selectedAgeRanges.has('older')} onCheckedChange={(c) => handleAgeRangeChange('older', !!c)} disabled={ageFilterMode !== 'ranges'}/>
                                <Label htmlFor="age-older" className="font-normal">Older adult (65+) ({eligibilityCounts.older ?? 0})</Label>
                           </div>
                        </div>
                    </div>
                     <div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="manual" id="age-manual" />
                            <Label htmlFor="age-manual">Manually enter range</Label>
                        </div>
                        <div className={cn("pl-6 mt-2 space-y-2", ageFilterMode !== 'manual' && 'opacity-50')}>
                            <div className="flex items-center gap-2">
                                <Input placeholder="From" value={manualAgeFrom} onChange={e => setManualAgeFrom(e.target.value)} disabled={ageFilterMode !== 'manual'} className="w-20"/>
                                <Input placeholder="To" value={manualAgeTo} onChange={e => setManualAgeTo(e.target.value)} disabled={ageFilterMode !== 'manual'} className="w-20"/>
                                <span className="text-sm text-muted-foreground">Years</span>
                            </div>
                        </div>
                    </div>
                </RadioGroup>
            </div>
            <div>
                 <Label className="font-semibold">Accepts healthy volunteers</Label>
                 <div className="mt-2 flex items-center space-x-2">
                    <Checkbox id="healthy-volunteers" checked={acceptsHealthyVolunteers} onCheckedChange={(c) => setAcceptsHealthyVolunteers(!!c)} />
                    <Label htmlFor="healthy-volunteers" className="font-normal">Yes ({eligibilityCounts.healthy ?? 0})</Label>
                 </div>
            </div>
        </CardContent>
    </Card>
  );

  const StudyResultsFilter = () => (
    <Card className="w-full md:w-auto md:min-w-[280px]">
       <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
               Study Results
               <TooltipProvider>
                   <Tooltip>
                       <TooltipTrigger asChild>
                           <Info className="h-4 w-4 text-muted-foreground" />
                       </TooltipTrigger>
                       <TooltipContent>
                           <p>Filter by trials that have posted results.</p>
                       </TooltipContent>
                   </Tooltip>
               </TooltipProvider>
            </CardTitle>
       </CardHeader>
       <CardContent className="space-y-4">
           <div className="flex items-center space-x-2">
               <Checkbox id="with-results" checked={withResults} onCheckedChange={(c) => setWithResults(!!c)} />
               <Label htmlFor="with-results" className="font-normal">With results ({resultsCounts.withResults ?? 0})</Label>
          </div>
          <div className="flex items-center space-x-2">
               <Checkbox id="without-results" checked={withoutResults} onCheckedChange={(c) => setWithoutResults(!!c)} />
               <Label htmlFor="without-results" className="font-normal">Without results ({resultsCounts.withoutResults ?? 0})</Label>
          </div>
       </CardContent>
    </Card>
 );

  const TableActions = () => {
    const numSelected = selectedTrials.size;
    
    const downloadButton = (
        <Button variant="outline" disabled={numSelected === 0 || !isPro} onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" /> Download
        </Button>
    );

    return (
      <div className="flex items-center gap-2 pb-4">
        <Button
          variant="outline"
          className="w-[150px]"
          disabled={numSelected === 0}
          onClick={() => setSelectedTrials(new Set())}
        >
          {numSelected > 0 ? `Clear (${numSelected})` : 'None Selected'}
        </Button>
        
        {isPro ? (
            downloadButton
        ) : (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span tabIndex={0}>{downloadButton}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Upgrade to Pro to download data.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )}

        <Button variant="outline" disabled={numSelected === 0} onClick={handleOpenSaveFolder}>
          <Bookmark className="mr-2 h-4 w-4" /> Save
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>API Search</CardTitle>
                <CardDescription>
                    Enter a drug name, condition, or NCT number to search the ClinicalTrials.gov API.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input 
                        placeholder="e.g., cancer, heart disease, NCT04587352..." 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-grow"
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Search
                    </Button>
                </form>
            </CardContent>
        </Card>
        
        <div className="flex flex-col md:flex-row gap-6">
             {studies && studies.length > 0 && (
                <div className="flex flex-col gap-6 w-full md:w-auto">
                    <StudyFilters />
                    <EligibilityFilters />
                    <StudyResultsFilter />
                </div>
            )}


            <div className="flex-grow space-y-6">
                {isLoading && (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                )}

                {error && !isLoading && (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-destructive bg-destructive/10 rounded-md">
                        <ServerCrash className="h-10 w-10 mb-4" />
                        <p className="font-semibold">An Error Occurred</p>
                        <p className="text-sm">{error}</p>
                        {rawErrorData && (
                            <pre className="mt-4 p-2 bg-black/80 text-white rounded-md text-xs overflow-auto max-h-80 text-left">
                                <code>{JSON.stringify(rawErrorData, null, 2)}</code>
                            </pre>
                        )}
                    </div>
                )}
                
                {!isLoading && !error && studies && (
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Search Results</CardTitle>
                                    <CardDescription>
                                        Showing {startIndex + 1}-{Math.min(endIndex, filteredStudies.length)} of {filteredStudies.length} trials found for: <strong>{searchedQuery}</strong>
                                    </CardDescription>
                                </div>
                                <div className="inline-flex rounded-md" role="group">
                                    <Button
                                        variant={viewMode === 'card' ? 'default' : 'outline'}
                                        onClick={() => setViewMode('card')}
                                        className="rounded-r-none"
                                        size="sm"
                                    >
                                        <LayoutGrid className="mr-2 h-4 w-4" />
                                        Card View
                                    </Button>
                                    <Button
                                        variant={viewMode === 'table' ? 'default' : 'outline'}
                                        onClick={() => setViewMode('table')}
                                        className="rounded-l-none"
                                        size="sm"
                                    >
                                        <List className="mr-2 h-4 w-4" />
                                        Table View
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {filteredStudies.length > 0 ? (
                                    <div className="space-y-4">
                                        {viewMode === 'table' && <TableActions />}
                                        {viewMode === 'card' ? (
                                            <CardView
                                                studies={studiesToShow}
                                                onTrialSelect={setSelectedTrial}
                                                onSaveToFolder={(trial) => setTrialsToSaveFolder([trial])}
                                            />
                                        ) : (
                                            <TableView
                                              studies={studiesToShow}
                                              onTrialSelect={setSelectedTrial}
                                              selectedTrials={selectedTrials}
                                              onSelectAll={handleSelectAll}
                                              onSelectRow={handleSelectRow}
                                            />
                                        )}
                                    </div>
                                ) : (
                                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/50 rounded-md">
                                    {studies.length > 0 ? (
                                        <>
                                            <FilterX className="h-10 w-10 mb-4" />
                                            <p className="font-semibold">No Matching Studies</p>
                                            <p className="text-sm">Your filters did not match any of the {studies.length} results.</p>
                                        </>
                                    ) : (
                                        <>
                                            <PackageOpen className="h-10 w-10 mb-4" />
                                            <p className="font-semibold">No Studies Found</p>
                                            <p className="text-sm">Your query for "{searchedQuery}" did not return any clinical trials.</p>
                                        </>
                                    )}
                                </div>
                                )}
                            </div>
                        </CardContent>
                         {totalPages > 1 && (
                            <CardFooter className="justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <Label htmlFor="items-per-page">Items per page:</Label>
                                    <Select value={String(studiesPerPage)} onValueChange={(v) => setStudiesPerPage(Number(v))}>
                                        <SelectTrigger id="items-per-page" className="w-[80px]">
                                            <SelectValue placeholder={studiesPerPage} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="20">20</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}/>
                                        </PaginationItem>
                                        <PaginationItem>
                                            <span className="text-sm font-medium px-4">
                                                Page {currentPage} of {totalPages}
                                            </span>
                                        </PaginationItem>
                                        <PaginationItem>
                                            <PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}/>
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </CardFooter>
                        )}
                    </Card>
                )}

                {!isLoading && !searchedQuery && studies === null && (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/50 rounded-md">
                        <p className="font-semibold">Enter a search term to begin.</p>
                    </div>
                )}
            </div>
        </div>

        {selectedTrial && (
            <Dialog open={!!selectedTrial} onOpenChange={(isOpen) => !isOpen && setSelectedTrial(null)}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col print-visible">
                    <DialogHeader>
                        <DialogTitle>{selectedTrial.briefTitle}</DialogTitle>
                        <div className="flex justify-between items-center pt-2">
                            <DialogDescription className="font-bold">
                                Study ID: {selectedTrial.nctId}
                            </DialogDescription>
                            <div className="flex items-center gap-1 print-actions">
                                <Button variant="ghost" size="icon" onClick={() => window.print()}>
                                    <Download className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => window.print()}>
                                    <Printer className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <Share2 className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(selectedTrial.url)}&text=${encodeURIComponent(selectedTrial.briefTitle)}`, '_blank')}>
                                            <Twitter className="mr-2 h-4 w-4" />
                                            Share on X
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(selectedTrial.url)}`, '_blank')}>
                                            <Linkedin className="mr-2 h-4 w-4" />
                                            Share on LinkedIn
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button variant="ghost" size="icon" asChild>
                                    <a href={`mailto:?subject=${encodeURIComponent(selectedTrial.briefTitle)}&body=${encodeURIComponent('Check out this clinical trial: ' + selectedTrial.url)}`}>
                                        <MailIcon className="h-4 w-4" />
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="flex-grow overflow-y-auto pr-6 text-sm py-4 print-body">
                        <div className="space-y-4">
                            <ModalDetailRow label="Official Title" value={selectedTrial.officialTitle} />
                            <ModalDetailRow label="Status" value={selectedTrial.overallStatus?.replace(/_/g, ' ')} />
                            <ModalDetailRow label="Phase" value={selectedTrial.phase} />
                            <ModalDetailRow label="Conditions" value={selectedTrial.condition} />
                            <ModalDetailRow label="Study Type" value={selectedTrial.studyType} />
                            <ModalDetailRow label="Enrollment" value={selectedTrial.enrollmentCount} />
                            <ModalDetailRow label="Start Date" value={selectedTrial.startDate ? format(parseISO(selectedTrial.startDate), 'PPP') : 'N/A'} />
                            <ModalDetailRow label="Completion Date" value={selectedTrial.completionDate ? format(parseISO(selectedTrial.completionDate), 'PPP') : 'N/A'} />
                            <ModalDetailRow label="Primary Completion Date" value={selectedTrial.primaryCompletionDate ? format(parseISO(selectedTrial.primaryCompletionDate), 'PPP') : 'N/A'} />
                            <ModalDetailRow label="Sponsor" value={selectedTrial.leadSponsorName} />
                            <ModalDetailRow label="Collaborators" value={selectedTrial.collaboratorNames} />
                            <ModalDetailRow label="Locations" value={renderLocations(selectedTrial)} />
                            <ModalDetailRow label="Gender" value={selectedTrial.gender} />
                            <ModalDetailRow label="Minimum Age" value={selectedTrial.minimumAge} />
                            <ModalDetailRow label="Maximum Age" value={selectedTrial.maximumAge} />
                            <ModalDetailRow label="Healthy Volunteers" value={selectedTrial.healthyVolunteers} />
                            <ModalDetailRow label="Intervention Type" value={selectedTrial.interventionTypes} />
                            <ModalDetailRow label="Intervention Name" value={selectedTrial.interventionNames} />
                            <ModalDetailRow label="Why Study Stopped" value={selectedTrial.whyStopped} />
                            <ModalDetailRow label="Brief Summary" value={selectedTrial.briefSummary} isHtml={true} condenseShortHtml={true} />
                            <ModalDetailRow label="Detailed Description" value={selectedTrial.detailedDescription} isHtml={true} />
                            <OutcomeMeasures outcomes={selectedTrial.outcomes} />
                            <div className="grid grid-cols-[150px_1fr] items-start gap-4">
                                <Label className="text-right font-semibold text-muted-foreground pt-1">Eligibility Criteria</Label>
                                <FormattedCriteria text={selectedTrial.eligibilityCriteria} />
                            </div>
                            <ModalDetailRow label="Last Update Posted" value={selectedTrial.lastUpdatePostDate ? format(parseISO(selectedTrial.lastUpdatePostDate), 'PPP') : 'N/A'} />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-end items-center gap-2 mt-auto pt-4 border-t print-hidden">
                        <div className="flex gap-2">
                            <Button asChild variant="outline" size="sm">
                                 <a 
                                    href={selectedTrial.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    View on ClinicalTrials.gov <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" size="sm">
                                    Close
                                </Button>
                            </DialogClose>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
        <SaveToFolderDialog trials={trialsToSaveFolder} onOpenChange={(open) => !open && setTrialsToSaveFolder([])} />
      </div>
  );
}

    
