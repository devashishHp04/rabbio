
'use client';

import * as React from 'react';
import { useState, useTransition, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Pipeline, PipelineStatus, Folder, AuthenticatedUser } from '@/lib/types';
import { LayoutGrid, List, Loader2, X, Download, Bookmark, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter, useSearchParams } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { handleCreateFolder, handleGetFolders, handleSavePipelinesToFolders, selectTherapeuticArea } from '@/app/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useActionState } from 'react';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


const statusColors: Record<PipelineStatus, string> = {
  Preclinical: 'bg-purple-500',
  'Phase 1': 'bg-blue-500',
  'Phase 2': 'bg-yellow-500',
  'Phase 3': 'bg-orange-500',
  'Phase 4': 'bg-green-500',
  Approved: 'bg-gray-500',
};

const phaseOptions: PipelineStatus[] = ['Preclinical', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Approved'];

function CreateFolderForm({ onFolderCreated }: { onFolderCreated: (folder: Folder) => void }) {
    const { toast } = useToast();
    const formRef = React.useRef<HTMLFormElement>(null);
    const [state, formAction] = useActionState(handleCreateFolder, { success: false, message: null });
    
    useEffect(() => {
        if (state.success && state.data) {
            toast({ title: "Success", description: state.message });
            onFolderCreated(state.data);
            formRef.current?.reset();
        } else if (!state.success && state.message) {
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

function SavePipelinesToFolderDialog({ pipelines, onOpenChange }: { pipelines: Pipeline[], onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
    const [isSaving, startSavingTransition] = useTransition();

    useEffect(() => {
        if (pipelines.length > 0) {
            handleGetFolders().then(setFolders);
        }
    }, [pipelines]);

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
        if (!pipelines || pipelines.length === 0 || selectedFolders.size === 0) return;
        startSavingTransition(async () => {
            const result = await handleSavePipelinesToFolders(pipelines, Array.from(selectedFolders));
            if(result.success) {
                toast({ title: result.message });
            } else {
                toast({ variant: 'destructive', title: "Failed to save", description: result.message });
            }
            onOpenChange(false);
        });
    };

    if (!pipelines || pipelines.length === 0) return null;
    
    const titleText = pipelines.length === 1 ? `"${pipelines[0].drug}"` : `${pipelines.length} pipelines`;

    return (
        <Dialog open={pipelines.length > 0} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Save to Folder</DialogTitle>
                    <DialogDescription>Select folders to save {titleText}.</DialogDescription>
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

function CardView({ pipelines }: { pipelines: Pipeline[] }) {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pipelines.map((pipeline) => (
            <Link key={pipeline.id} href={`/pipeline/${pipeline.id}`} className="block h-full">
                <Card className="flex flex-col shadow-md rounded-lg cursor-pointer hover:shadow-xl h-full">
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-center gap-4">
                      <CardTitle className="text-xl flex-grow">{pipeline.drug}</CardTitle>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={`${statusColors[pipeline.status]} text-white`}>{pipeline.status}</Badge>
                      </div>
                    </div>
                    <CardDescription className="pt-1 truncate">{pipeline.indication}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow p-4 pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-3">{pipeline.mechanism}</p>
                  </CardContent>
                  {pipeline.company && (
                     <CardFooter className="p-4 pt-0 mt-auto border-t">
                      <div className="flex items-center gap-2 pt-2">
                        <Avatar className="h-6 w-6">
                           {pipeline.companyLogoUrl && <AvatarImage src={pipeline.companyLogoUrl} alt={`${pipeline.company} logo`} />}
                           <AvatarFallback>{pipeline.company.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-muted-foreground">{pipeline.company}</span>
                      </div>
                    </CardFooter>
                  )}
                </Card>
            </Link>
          ))}
        </div>
    )
}

function TableView({ 
    pipelines, 
    selectedPipelines,
    onSelectAll,
    onSelectRow,
}: { 
    pipelines: Pipeline[], 
    selectedPipelines: Set<string>,
    onSelectAll: (checked: boolean) => void,
    onSelectRow: (id: string, checked: boolean) => void,
}) {
    const router = useRouter();

    const handleRowClick = (e: React.MouseEvent, pipelineId: string) => {
        // Prevent row click from navigating when clicking on a checkbox or a favorite button
        if ((e.target as HTMLElement).closest('[role="checkbox"]')) {
            return;
        }
        router.push(`/pipeline/${pipelineId}`);
    };

    return (
        <Card>
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[50px]">
                     <Checkbox
                        checked={pipelines.length > 0 && selectedPipelines.size === pipelines.length}
                        onCheckedChange={(checked) => onSelectAll(!!checked)}
                        aria-label="Select all rows"
                    />
                  </TableHead>
                  <TableHead>Drug Name</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Therapeutic Area</TableHead>
                  <TableHead>Indication</TableHead>
                  <TableHead>Company</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pipelines.map((pipeline) => (
                   <TableRow key={pipeline.id} onClick={(e) => handleRowClick(e, pipeline.id)} className="cursor-pointer">
                    <TableCell>
                        <Checkbox
                            checked={selectedPipelines.has(pipeline.id)}
                            onCheckedChange={(checked) => onSelectRow(pipeline.id, !!checked)}
                            aria-label={`Select pipeline ${pipeline.drug}`}
                        />
                    </TableCell>
                    <TableCell className="font-medium">{pipeline.drug}</TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[pipeline.status]} text-white`}>{pipeline.status}</Badge>
                    </TableCell>
                    <TableCell>{pipeline.therapeuticArea}</TableCell>
                    <TableCell>{pipeline.indication}</TableCell>
                    <TableCell>
                       {pipeline.company && <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          {pipeline.companyLogoUrl && <AvatarImage src={pipeline.companyLogoUrl} alt={pipeline.company} />}
                          <AvatarFallback>{pipeline.company.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {pipeline.company}
                      </div>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </Card>
    )
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


const convertToCSV = (data: Pipeline[]): string => {
    if (!data || data.length === 0) {
        return '';
    }

    const headers = [
        'ID', 'Drug', 'Status', 'Indication', 'Therapeutic Area', 
        'Mechanism', 'Class', 'Target', 'Company', 'Forecast Sales'
    ];

    const rows = data.map(pipeline => [
        escapeCSV(pipeline.id),
        escapeCSV(pipeline.drug),
        escapeCSV(pipeline.status),
        escapeCSV(pipeline.indication),
        escapeCSV(pipeline.therapeuticArea),
        escapeCSV(pipeline.mechanism),
        escapeCSV(pipeline.class),
        escapeCSV(pipeline.target),
        escapeCSV(pipeline.company),
        escapeCSV(pipeline.forecastSales),
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

function TherapeuticAreaSelectionModal({
  isOpen,
  therapeuticAreas,
  onSelectArea,
}: {
  isOpen: boolean;
  therapeuticAreas: string[];
  onSelectArea: (area: string) => Promise<any>;
}) {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!selectedArea) return;
    startTransition(async () => {
      await onSelectArea(selectedArea);
      router.refresh();
    });
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Your Therapeutic Area</DialogTitle>
          <DialogDescription>
            As a Standard plan user, you can select one therapeutic area to track. This choice is permanent and can only be changed by upgrading to a Pro plan.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="flex items-center p-4 rounded-md bg-yellow-100/50 border border-yellow-200 text-yellow-800">
                <AlertTriangle className="h-5 w-5 mr-3" />
                <p className="text-sm font-medium">This selection is permanent.</p>
            </div>
            <Select onValueChange={setSelectedArea} value={selectedArea || ''}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a therapeutic area..." />
                </SelectTrigger>
                <SelectContent>
                    {therapeuticAreas.map((area, index) => (
                        <SelectItem key={`${area}-${index}`} value={area}>{area}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!selectedArea || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function PipelineClient({ pipelines, user }: { pipelines: Pipeline[], user: AuthenticatedUser | null }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string>(searchParams.get('phase') || 'all');
  const [selectedTherapeuticArea, setSelectedTherapeuticArea] = useState<string>(searchParams.get('therapeuticArea') || 'all');
  const [selectedIndication, setSelectedIndication] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedHeadquarters, setSelectedHeadquarters] = useState<string>(searchParams.get('headquarters') || 'all');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [selectedPipelines, setSelectedPipelines] = useState(new Set<string>());
  const [pipelinesToSaveFolder, setPipelinesToSaveFolder] = useState<Pipeline[]>([]);
  
  const isPro = user?.plan === 'pro';

  const allTherapeuticAreas = useMemo(() => [...new Set(pipelines.map((p) => p.therapeuticArea))], [pipelines]);
  const allHeadquarters = useMemo(() => [...new Set(pipelines.map(p => p.headquarters).filter(Boolean) as string[])].sort(), [pipelines]);
  
  const showSelectionModal = user?.plan === 'standard' && !user?.selectedTherapeuticArea;
  
  const filteredPipelines = useMemo(() => {
      let filtered = pipelines;
      
      // Server-side filtering is already done for standard plan.
      // This client-side filtering is for the UI controls.
      if (searchTerm) {
          filtered = filtered.filter(p => p.drug.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      if (selectedPhase !== 'all') {
          filtered = filtered.filter(p => p.status === selectedPhase);
      }
      if (selectedTherapeuticArea !== 'all') {
          filtered = filtered.filter(p => p.therapeuticArea === selectedTherapeuticArea);
      }
      if (selectedIndication !== 'all') {
          filtered = filtered.filter(p => p.indication === selectedIndication);
      }
      if (selectedCompany !== 'all') {
          filtered = filtered.filter(p => p.company === selectedCompany);
      }
      if (selectedHeadquarters !== 'all') {
          filtered = filtered.filter(p => p.headquarters === selectedHeadquarters);
      }
      return filtered;

  }, [pipelines, searchTerm, selectedPhase, selectedTherapeuticArea, selectedIndication, selectedCompany, selectedHeadquarters]);
  
  
  const displayableTherapeuticAreas = isPro ? allTherapeuticAreas : user?.selectedTherapeuticArea ? [user.selectedTherapeuticArea] : allTherapeuticAreas;
  const indications = [...new Set(filteredPipelines.map((p) => p.indication))];
  const companies = [...new Set(filteredPipelines.map((p) => p.company).filter(Boolean) as string[])];
  
  const totalPages = Math.ceil(filteredPipelines.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pipelinesToShow = filteredPipelines.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedPhase, selectedTherapeuticArea, selectedIndication, selectedCompany, selectedHeadquarters, itemsPerPage]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedPhase('all');
    setSelectedTherapeuticArea('all');
    setSelectedIndication('all');
    setSelectedCompany('all');
    setSelectedHeadquarters('all');
    router.push('/pipeline');
  };

  const hasActiveFilters = 
    searchTerm !== '' || 
    selectedPhase !== 'all' || 
    selectedTherapeuticArea !== 'all' || 
    selectedIndication !== 'all' ||
    selectedCompany !== 'all' ||
    selectedHeadquarters !== 'all';

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPipelines(new Set(pipelinesToShow.map((p) => p.id)));
    } else {
      setSelectedPipelines(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedPipelines((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleDownload = () => {
    const pipelinesToDownload = pipelines.filter(p => selectedPipelines.has(p.id));
    if (pipelinesToDownload.length === 0) return;

    const csvString = convertToCSV(pipelinesToDownload);
    downloadCSV(csvString, `pipeline-export-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleOpenSaveFolder = () => {
    const pipelinesToSave = pipelines.filter(p => selectedPipelines.has(p.id));
    setPipelinesToSaveFolder(pipelinesToSave);
  };

  const TableActions = () => {
    const numSelected = selectedPipelines.size;
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
          onClick={() => setSelectedPipelines(new Set())}
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
        <TherapeuticAreaSelectionModal
            isOpen={!!showSelectionModal}
            therapeuticAreas={allTherapeuticAreas}
            onSelectArea={selectTherapeuticArea}
        />
        <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center">
                <Input
                    placeholder="Search by drug name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <Select
                    value={selectedTherapeuticArea}
                    onValueChange={(value) => setSelectedTherapeuticArea(value)}
                    disabled={!isPro && displayableTherapeuticAreas.length === 1}
                >
                    <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filter by Therapeutic Area" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">All Therapeutic Areas</SelectItem>
                    {displayableTherapeuticAreas.map((area, index) => (
                        <SelectItem key={`${area}-${index}`} value={area}>
                        {area}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <Select
                    value={selectedIndication}
                    onValueChange={(value) => setSelectedIndication(value)}
                >
                    <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filter by Indication" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">All Indications</SelectItem>
                    {indications.map((indication, index) => (
                        <SelectItem key={`${indication}-${index}`} value={indication}>
                        {indication}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <Select
                    value={selectedCompany}
                    onValueChange={(value) => setSelectedCompany(value)}
                >
                    <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filter by Company" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {companies.map((company, index) => (
                        <SelectItem key={`${company}-${index}`} value={company}>
                        {company}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                 <Select
                    value={selectedHeadquarters}
                    onValueChange={(value) => setSelectedHeadquarters(value)}
                >
                    <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filter by Headquarters" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">All Headquarters</SelectItem>
                    {allHeadquarters.map((hq, index) => (
                        <SelectItem key={`${hq}-${index}`} value={hq}>
                        {hq}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <Select
                    value={selectedPhase}
                    onValueChange={(value) => setSelectedPhase(value as PipelineStatus | 'all')}
                >
                    <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by phase" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">All Phases</SelectItem>
                    {phaseOptions.map((phase) => (
                        <SelectItem key={phase} value={phase}>
                        {phase}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                {hasActiveFilters && (
                    <Button variant="ghost" onClick={clearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                    </Button>
                )}
            </div>
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                    Showing <strong>{startIndex + 1}-{Math.min(endIndex, filteredPipelines.length)}</strong> of <strong>{filteredPipelines.length}</strong> pipelines.
                </p>
                <div className="inline-flex rounded-md" role="group">
                    <Button
                        variant={viewMode === 'card' ? 'default' : 'outline'}
                        onClick={() => setViewMode('card')}
                        className="rounded-r-none"
                    >
                        <LayoutGrid className="mr-2 h-4 w-4" />
                        Card View
                    </Button>
                    <Button
                        variant={viewMode === 'table' ? 'default' : 'outline'}
                        onClick={() => setViewMode('table')}
                        className="rounded-l-none"
                    >
                        <List className="mr-2 h-4 w-4" />
                        Table View
                    </Button>
                </div>
            </div>
        </div>
        
        {viewMode === 'card' ? (
            <CardView pipelines={pipelinesToShow} />
        ) : (
            <div className="space-y-4">
              <TableActions />
              <TableView 
                  pipelines={pipelinesToShow} 
                  selectedPipelines={selectedPipelines}
                  onSelectAll={handleSelectAll}
                  onSelectRow={handleSelectRow}
              />
            </div>
        )}

         {filteredPipelines.length === 0 && (
          <div className="text-center col-span-full py-12 text-muted-foreground">
            <p>No pipelines found matching your criteria.</p>
          </div>
        )}

        {totalPages > 1 && (
             <div className="flex justify-between items-center gap-4 py-4">
                <div className="flex items-center gap-2">
                    <Label htmlFor="items-per-page">Items per page:</Label>
                    <Select
                        value={String(itemsPerPage)}
                        onValueChange={(value) => setItemsPerPage(Number(value))}
                    >
                        <SelectTrigger id="items-per-page" className="w-[80px]">
                            <SelectValue placeholder={itemsPerPage} />
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
            </div>
        )}

        {pipelinesToSaveFolder.length > 0 && (
            <SavePipelinesToFolderDialog 
                pipelines={pipelinesToSaveFolder}
                onOpenChange={(open) => !open && setPipelinesToSaveFolder([])}
            />
        )}
      </div>
  );
}
