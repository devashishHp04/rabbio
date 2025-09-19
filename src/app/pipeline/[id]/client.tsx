
// src/app/pipeline/[id]/client.tsx
'use client';

import * as React from 'react';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ExternalLink, TrendingDown, TrendingUp, Loader2, AlertTriangle, CalendarDays, CheckCircle, ListTree, Microscope, Building, Globe, BookOpen, Printer, Share2, Mail as MailIcon, Twitter, Linkedin, FolderPlus, Download, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useState, useEffect, useTransition, useRef } from 'react';
import type { Pipeline, PipelineStatus, ClinicalTrial, Folder } from '@/lib/types';
import { handleGetFolders, handleCreateFolder, handleSaveStudyToFolders, handleSavePipelinesToFolders } from '@/app/actions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { FormattedCriteria } from '@/components/formatted-criteria';
import { OutcomeMeasures } from '@/components/outcome-measures';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useActionState } from 'react';
import { format, parseISO, isValid } from 'date-fns';

const DetailRow = ({ label, value, isHtml = false, align = 'middle' }: { label: string; value?: string | React.ReactNode; isHtml?: boolean, align?: 'top' | 'middle' }) => {
  if (!value) return null;

  const displayValue = Array.isArray(value) ? value.join(', ') : value;

  return (
    <TableRow>
      <TableCell className={cn("font-semibold text-muted-foreground w-1/3", { 'align-top': align === 'top' })}>{label}</TableCell>
      {isHtml && typeof displayValue === 'string' ? (
        <TableCell className={cn({ 'align-top': align === 'top' })} dangerouslySetInnerHTML={{ __html: displayValue }} />
      ) : (
        <TableCell className={cn({ 'align-top': align === 'top' })}>{value}</TableCell>
      )}
    </TableRow>
  );
};

const FinancialRow = ({ label, value }: { label: string; value?: string | null }) => {
  if (!value) return null;
  const [isUp, setIsUp] = useState(false);

  useEffect(() => {
    setIsUp(Math.random() > 0.5);
  }, []);

  return (
    <TableRow>
      <TableCell className="font-semibold">{label}</TableCell>
      <TableCell className="flex items-center gap-2">
        {isUp ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
        {value}
      </TableCell>
    </TableRow>
  );
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
            <Label htmlFor="new-folder-pipeline">Create New Folder</Label>
            <div className="flex gap-2">
                <Input
                    id="new-folder-pipeline"
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
    const [isSaving, startSavingTransition] = useTransition();

    useEffect(() => {
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
        setSelectedFolders(prev => new Set(prev).add(newFolder.id));
    };
    
    const handleSave = () => {
        if (trials.length === 0 || selectedFolders.size === 0) return;
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

    if (trials.length === 0) return null;

    return (
        <Dialog open={trials.length > 0} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Save to Folder</DialogTitle>
                    <DialogDescription>Select folders to save the {trials.length} selected studies.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Existing Folders</Label>
                        <div className="max-h-40 overflow-y-auto space-y-2 rounded-md border p-2">
                            {folders.length > 0 ? folders.map(folder => (
                                <div key={folder.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`folder-pipeline-${folder.id}`}
                                        onCheckedChange={(c) => handleSelectFolder(folder.id, !!c)}
                                        checked={selectedFolders.has(folder.id)}
                                    />
                                    <Label htmlFor={`folder-pipeline-${folder.id}`} className="font-normal">{folder.name}</Label>
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

function SavePipelineToFolderDialog({ pipeline, onOpenChange }: { pipeline: Pipeline, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
    const [isSaving, startSavingTransition] = useTransition();

    useEffect(() => {
        handleGetFolders().then(setFolders);
    }, []);

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
        setSelectedFolders(prev => new Set(prev).add(newFolder.id));
    };
    
    const handleSave = () => {
        if (!pipeline || selectedFolders.size === 0) return;
        startSavingTransition(async () => {
            const result = await handleSavePipelinesToFolders([pipeline], Array.from(selectedFolders));
            if (result.success) {
                toast({ title: result.message });
            } else {
                toast({ variant: 'destructive', title: "Failed to save pipeline", description: result.message });
            }
            onOpenChange(false);
        });
    };

    return (
        <Dialog open={!!pipeline} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Save Pipeline to Folder</DialogTitle>
                    <DialogDescription>Select folders to save "{pipeline.drug}".</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Existing Folders</Label>
                        <div className="max-h-40 overflow-y-auto space-y-2 rounded-md border p-2">
                            {folders.length > 0 ? folders.map(folder => (
                                <div key={folder.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`folder-pipeline-detail-${folder.id}`}
                                        onCheckedChange={(c) => handleSelectFolder(folder.id, !!c)}
                                        checked={selectedFolders.has(folder.id)}
                                    />
                                    <Label htmlFor={`folder-pipeline-detail-${folder.id}`} className="font-normal">{folder.name}</Label>
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

const escapeCSV = (field: any): string => {
    if (field === null || field === undefined) {
        return '';
    }
    let str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        str = str.replace(/"/g, '""');
        return `"${str}"`;
    }
    return str;
};

const convertToCSV = (data: ClinicalTrial[]): string => {
    if (!data || data.length === 0) return '';
    const headers = ['NCT ID', 'Brief Title', 'Official Title', 'Status', 'Phase', 'Conditions', 'Intervention Names', 'Sponsor', 'Study Type', 'Enrollment', 'Start Date', 'Completion Date', 'URL'];
    const rows = data.map(trial => [
        escapeCSV(trial.nctId), escapeCSV(trial.briefTitle), escapeCSV(trial.officialTitle),
        escapeCSV(trial.overallStatus), escapeCSV(trial.phase), escapeCSV(trial.condition),
        escapeCSV(trial.interventionNames?.join('; ')), escapeCSV(trial.leadSponsorName),
        escapeCSV(trial.studyType), escapeCSV(trial.enrollmentCount), escapeCSV(trial.startDate),
        escapeCSV(trial.completionDate), escapeCSV(trial.url),
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

function ClinicalTrialsCard({ pipelineName }: { pipelineName: string }) {
    const [trialsData, setTrialsData] = useState<ClinicalTrial[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [rawErrorData, setRawErrorData] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [studiesPerPage, setStudiesPerPage] = useState(5);
    const [selectedTrials, setSelectedTrials] = useState(new Set<string>());
    const [selectedTrial, setSelectedTrial] = useState<ClinicalTrial | null>(null);
    const [trialsToSaveFolder, setTrialsToSaveFolder] = useState<ClinicalTrial[]>([]);

    useEffect(() => {
        if (!pipelineName) return;
        let isCancelled = false;
        
        const fetchTrials = async () => {
            setIsLoading(true);
            setError(null);
            setRawErrorData(null);
            
            try {
                const response = await fetch(`/api/clinical-trials?query=${encodeURIComponent(pipelineName)}`);
                if (!isCancelled) {
                    const data = await response.json();
                    if (!response.ok) {
                        setError(data.error || `Request failed with status ${response.status}`);
                        if(data.rawData) setRawErrorData(JSON.stringify(data.rawData, null, 2));
                        setTrialsData([]);
                    } else {
                       setTrialsData(data.studies || []);
                    }
                }
            } catch (err: any) {
                if (!isCancelled) {
                    setError(err.message || 'An unknown error occurred.');
                    setTrialsData([]);
                }
            } finally {
              if (!isCancelled) setIsLoading(false);
            }
        };

        fetchTrials();
        return () => { isCancelled = true; };
    }, [pipelineName]);
    
    const handleSelectAll = (checked: boolean) => {
      if (checked && trialsData && Array.isArray(trialsData)) {
        setSelectedTrials(new Set(trialsData.map(t => t.nctId)));
      } else {
        setSelectedTrials(new Set());
      }
    };

    const handleSelectRow = (nctId: string, checked: boolean) => {
        setSelectedTrials(prev => {
            const newSet = new Set(prev);
            if (checked) newSet.add(nctId);
            else newSet.delete(nctId);
            return newSet;
        });
    };

    const handleOpenSaveFolder = () => {
        if (!trialsData) return;
        const trialsToSave = trialsData.filter(t => selectedTrials.has(t.nctId));
        setTrialsToSaveFolder(trialsToSave);
    }
    
    const handleDownload = () => {
        if (!trialsData) return;
        const trialsToDownload = trialsData.filter(t => selectedTrials.has(t.nctId));
        if (trialsToDownload.length === 0) return;
        const csvString = convertToCSV(trialsToDownload);
        downloadCSV(csvString, `clinical-trials-${pipelineName.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.csv`);
    }

    const TableActions = () => {
        const numSelected = selectedTrials.size;
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
            <Button variant="outline" disabled={numSelected === 0} onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
            <Button variant="outline" disabled={numSelected === 0} onClick={handleOpenSaveFolder}>
              <Bookmark className="mr-2 h-4 w-4" /> Save
            </Button>
          </div>
        );
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col text-destructive p-4 bg-destructive/10 rounded-md">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-8 w-8" />
                      <p className="font-semibold">{error}</p>
                    </div>
                    {rawErrorData && (
                      <div className="mt-4">
                        <p className="font-semibold text-sm">Raw API Response:</p>
                        <pre className="mt-2 p-2 bg-black/80 text-white rounded-md text-xs overflow-auto max-h-80">
                          <code>{rawErrorData}</code>
                        </pre>
                      </div>
                    )}
                </div>
            );
        }
        
        if (!trialsData || trialsData.length === 0) {
            return (
                <div className="text-center py-8">
                    <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Clinical Trials Found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">There are no clinical trials matching "{pipelineName}" on ClinicalTrials.gov.</p>
                </div>
            );
        }
        
        const trialsToShow = trialsData?.slice(0, studiesPerPage) || [];
        const formatDate = (dateString: string | null) => {
            if (!dateString) return 'N/A';
            const date = parseISO(dateString);
            return isValid(date) ? format(date, 'MMM yyyy') : 'N/A';
        };

        return (
            <>
                <div className="space-y-4">
                    <TableActions />
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={!!trialsData && trialsData.length > 0 && selectedTrials.size === trialsData.length}
                                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                        aria-label="Select all rows"
                                    />
                                </TableHead>
                                <TableHead className="font-semibold text-foreground">Study Title</TableHead>
                                <TableHead className="font-semibold text-foreground">NCT Number</TableHead>
                                <TableHead className="font-semibold text-foreground">Status</TableHead>
                                <TableHead className="font-semibold text-foreground">Conditions</TableHead>
                                <TableHead className="font-semibold text-foreground">Phase</TableHead>
                                <TableHead className="font-semibold text-foreground">Study Type</TableHead>
                                <TableHead className="font-semibold text-foreground">Study Start</TableHead>
                                <TableHead className="font-semibold text-foreground">Study Completion</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {trialsToShow.map((trial, index) => (
                                <TableRow key={trial.nctId}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedTrials.has(trial.nctId)}
                                            onCheckedChange={(checked) => handleSelectRow(trial.nctId, !!checked)}
                                            aria-label={`Select row ${index + 1}`}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="link" className="p-0 h-auto text-left whitespace-normal" onClick={() => setSelectedTrial(trial)}>
                                            {trial.briefTitle}
                                        </Button>
                                    </TableCell>
                                    <TableCell>{trial.nctId}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col items-start gap-1">
                                            <div
                                                className={cn('inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold text-white', {
                                                    'bg-green-600': ['RECRUITING', 'ENROLLING_BY_INVITATION'].includes(trial.overallStatus),
                                                    'bg-red-600': ['TERMINATED', 'WITHDRAWN'].includes(trial.overallStatus),
                                                    'bg-yellow-500': ['NOT_YET_RECRUITING', 'ACTIVE_NOT_RECRUITING'].includes(trial.overallStatus),
                                                    'bg-blue-600': trial.overallStatus === 'COMPLETED',
                                                    'bg-gray-500': !['RECRUITING', 'ENROLLING_BY_INVITATION', 'NOT_YET_RECRUITING', 'ACTIVE_NOT_RECRUITING', 'COMPLETED', 'TERMINATED', 'WITHDRAWN'].includes(trial.overallStatus),
                                                })}
                                            >
                                                {trial.overallStatus.replace(/_/g, ' ')}
                                            </div>
                                            {trial.hasResults && (
                                                <a href={`${trial.url}?view=results`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                                                    WITH RESULTS
                                                </a>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{trial.condition}</TableCell>
                                    <TableCell>{trial.phase}</TableCell>
                                    <TableCell>{trial.studyType}</TableCell>
                                    <TableCell>{formatDate(trial.startDate)}</TableCell>
                                    <TableCell>{formatDate(trial.completionDate)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                 {trialsData && trialsData.length > 5 && (
                    <div className="flex items-center justify-between gap-4 pt-4">
                        <div className="flex items-center gap-2 text-sm">
                            <Select value={String(studiesPerPage)} onValueChange={(v) => setStudiesPerPage(Number(v))}>
                                <SelectTrigger className="w-20">
                                    <SelectValue placeholder={String(studiesPerPage)} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                            <span className="text-muted-foreground">studies per page</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Showing {trialsToShow.length} of {trialsData.length} trials.
                        </p>
                    </div>
                 )}
            </>
        );
    };

    return (
        <>
            <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>ClinicalTrials.gov Results</CardTitle>
                        <CardDescription>Live search results for "{pipelineName}"</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>
            
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
             {trialsToSaveFolder.length > 0 && (
                <SaveToFolderDialog
                    trials={trialsToSaveFolder}
                    onOpenChange={(open) => !open && setTrialsToSaveFolder([])}
                />
            )}
        </>
    );
}

export default function PipelineDetailClient({ pipeline }: { pipeline: Pipeline; }) {
  const tabs = [
    { value: "drug-profile", label: "Drug Profile" },
    { value: "regulatory", label: "Regulatory Status" },
    { value: "safety-profile", label: "Safety Profile" },
    { value: "pharmacoeconomics", label: "Pharmacoeconomics" },
    { value: "references", label: "References" },
  ];

  return (
      <div className="space-y-6">
         <div className="flex items-center gap-4 print-hidden">
            <Button variant="outline" size="sm" asChild>
                <Link href="/pipeline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Pipeline
                </Link>
            </Button>
         </div>
         <div className="flex items-start justify-between gap-4 pt-4">
            <div className="flex-grow">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight">{pipeline.drug}</h1>
                </div>
                <p className="text-muted-foreground mt-1">{pipeline.description}</p>
            </div>
         </div>
         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
           <div className="lg:col-span-3">
            <Tabs defaultValue="drug-profile" orientation="vertical" className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-full md:w-1/4 print-hidden">
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">Table of Contents</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 pt-0">
                    <TabsList className="flex flex-col h-auto w-full bg-transparent p-0">
                      {tabs.map((tab) => (
                        <TabsTrigger key={tab.value} value={tab.value} className="w-full justify-start font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </CardContent>
                </Card>
              </div>

              <div className="w-full md:w-3/4 space-y-6">
                 <TabsContent value="drug-profile" className="mt-0 space-y-6">
                  <Card>
                      <CardHeader>
                        <CardTitle>Drug Information</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                          <Table>
                              <TableBody>
                                <DetailRow label="Synonyms" value={pipeline.synonyms} />
                                <DetailRow label="Class" value={pipeline.class} />
                                <DetailRow label="Target" value={pipeline.target} align="top" />
                                <DetailRow label="Mechanism of Action" value={pipeline.mechanism} align="top" />
                                <DetailRow label="Pharmacokinetics" value={pipeline.pharmacokinetics} align="top" />
                                <DetailRow label="Biomarkers" value={pipeline.biomarkers} align="top" />
                                <DetailRow label="Therapeutic Area" value={pipeline.therapeuticArea} />
                                <DetailRow label="Indication" value={pipeline.indication} align="top" />
                                <DetailRow label="Phase" value={pipeline.status} />
                                <DetailRow label="Route(s) of Administration" value={pipeline.routes} />
                                <DetailRow label="Delivery Platform" value={pipeline.deliveryPlatform} />
                                <DetailRow label="Discontinuation Status" value={pipeline.discontinuationStatus} />
                                <DetailRow label="Source Summary" value={pipeline.sourceSummary} />
                                <DetailRow label="Date Created" value={pipeline.dateCreated ? new Date(pipeline.dateCreated).toLocaleDateString() : undefined} />
                              </TableBody>
                          </Table>
                      </CardContent>
                    </Card>
                    <ClinicalTrialsCard pipelineName={pipeline.drug} />
                </TabsContent>
                <TabsContent value="regulatory" className="mt-0">
                  <Card>
                    <CardHeader>
                        <CardTitle>Regulatory Information</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                          <Table>
                            <TableBody>
                                <DetailRow label="Regulatory Milestones" value={pipeline.regulatoryMilestones} />
                                <DetailRow label="Priority Designation" value={pipeline.priorityDesignation} />
                                <DetailRow label="Designation" value={pipeline.designation} />
                                <DetailRow label="Geographic Status" value={pipeline.geographicStatus} />
                            </TableBody>
                          </Table>
                      </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="safety-profile" className="mt-0">
                  <Card>
                    <CardHeader>
                        <CardTitle>Safety Profile</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                          <Table>
                            <TableBody>
                              <DetailRow label="Adverse Events" value={pipeline.adverseEvents} align="top" />
                            </TableBody>
                          </Table>
                      </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="pharmacoeconomics" className="mt-0">
                  <Card>
                    <CardHeader>
                        <CardTitle>Pharmacoeconomics</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                          <Table>
                            <TableBody>
                              <DetailRow label="Licensing Status" value={pipeline.licensingStatus} />
                              <DetailRow label="Licensing / Deal Info" value={pipeline.licensingDealInfo} />
                              <DetailRow label="Competitive Landscape" value={pipeline.competitiveLandscape} />
                              <DetailRow label="Patent Expiry" value={pipeline.patentExpiry} />
                              <DetailRow label="Forecast Sales / Peak Sales" value={pipeline.forecastSales} />
                              <DetailRow label="Launch Date" value={pipeline.launchDate} />
                              <DetailRow label="Commercialization Strategy" value={pipeline.commercializationStrategy} />
                            </TableBody>
                          </Table>
                      </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="references" className="mt-0">
                  <Card>
                    <CardHeader>
                        <CardTitle>References</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                          <Table>
                            <TableBody>
                              <DetailRow label="Source Summary" value={pipeline.sourceSummary} />
                            </TableBody>
                          </Table>
                      </CardContent>
                    </Card>
                </TabsContent>
              </div>
            </Tabs>
           </div>
          <div className="space-y-6 print-hidden">
             <Card>
                <CardHeader>
                  <CardTitle>{pipeline.company}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pipeline.companyLogoUrl && (
                    <div className="flex justify-center">
                      <Image
                        src={pipeline.companyLogoUrl}
                        alt={`${pipeline.company} logo`}
                        width={150}
                        height={40}
                        className="object-contain"
                      />
                    </div>
                  )}
                  <Table>
                    <TableBody>
                      <DetailRow label="Company Type" value={pipeline.companyType} />
                      <DetailRow label="Traded As" value={pipeline.tradedAs} />
                      <DetailRow label="Industry" value={pipeline.industry} />
                      <DetailRow label="Founded" value={pipeline.founded} />
                      <DetailRow label="Founders" value={pipeline.founders?.join(', ')} />
                      <DetailRow label="Headquarters" value={pipeline.headquarters} />
                      <DetailRow label="Key People" value={pipeline.keyPeople?.join(', ')} />
                      <DetailRow label="Products" value={pipeline.products?.join(' • ')} />
                      <DetailRow label="Employees" value={pipeline.employees} />
                       <DetailRow label="Website" value={pipeline.website && (
                          <a href={pipeline.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            {pipeline.website} <ExternalLink className="h-4 w-4" />
                          </a>
                        )} />
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              {pipeline.financials && Object.keys(pipeline.financials).length > 0 && (
                 <Card>
                  <CardHeader>
                    <CardTitle>Financial Overview</CardTitle>
                    <CardDescription>Latest financial data (2024)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableBody>
                        <FinancialRow label="Revenue" value={pipeline.financials.revenue} />
                        <FinancialRow label="Operating Income" value={pipeline.financials.operatingIncome} />
                        <FinancialRow label="Net Income" value={pipeline.financials.netIncome} />
                        <FinancialRow label="Total Assets" value={pipeline.financials.totalAssets} />
                        <FinancialRow label="Total Equity" value={pipeline.financials.totalEquity} />
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
          </div>
         </div>
      </div>
  );
}
