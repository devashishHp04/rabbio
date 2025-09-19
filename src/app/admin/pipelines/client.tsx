
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Pipeline } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { createPipeline, updatePipeline, deletePipeline } from '../actions';
import { PlusCircle, Edit, Trash2, Search, EyeOff, GripVertical, Eye, X, Plus, Copy, MoreHorizontal, ArrowDown, ArrowUp, Filter, Columns, Lock, Replace, Pin, Pencil, Settings2, ChevronsLeft, ChevronsRight, Trash, ListPlus, ArrowDownAZ, ArrowUpAZ, Unlock, ChevronsLeftRight, Users, Upload, Info, Download, Rows, Columns as ColumnsIcon, Type, Link2, AtSign, Phone, Sigma, ToggleRight, Percent, Star, SlidersHorizontal, Palette, MapPin, Calendar, Clock, Timer, Image as ImageIcon, File, Share2 as ConnectionIcon, Braces, Code, Pilcrow, FunctionSquare, Server, SigmaSquare, History } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import Link from 'next/link';


type UserRole = 'admin' | 'editor' | 'viewer';
type AddColumnMode = 'add' | 'insertLeft' | 'insertRight';

// Helper to render cell content, handling various data types
const renderCellContent = (content: any, columnName: string) => {
  if (columnName === 'status') {
    return String(content);
  }
  if (content === null || content === undefined) {
    return <span className="text-muted-foreground">N/A</span>;
  }
  if (Array.isArray(content)) {
    // If you want to show a summary of an array, you can do it here.
    // For now, we'll just show it as JSON for complex data.
    if (content.every(item => typeof item === 'string' || typeof item === 'number')) {
        return content.join(', ');
    }
    return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(content, null, 2)}</pre>;
  }
  if (typeof content === 'object') {
    return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(content, null, 2)}</pre>;
  }
  return String(content);
};

function AddOrInsertColumnDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  mode,
  targetColumnDisplayName
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (newColumnName: string, fieldKey: string) => void;
  mode: AddColumnMode;
  targetColumnDisplayName?: string;
}) {
  const [newColumnName, setNewColumnName] = React.useState('');
  const [fieldKey, setFieldKey] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(newColumnName, fieldKey || newColumnName.trim().replace(/\s+/g, '_').toLowerCase());
    onOpenChange(false);
    setNewColumnName('');
    setFieldKey('');
  };
  
  const getDialogTitle = () => {
      switch(mode) {
          case 'add': return "Add New Column";
          case 'insertLeft': return `Insert Column Left of "${targetColumnDisplayName}"`;
          case 'insertRight': return `Insert Column Right of "${targetColumnDisplayName}"`;
          default: return "Add Column";
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-column-name">Column name</Label>
            <Input
              id="new-column-name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="e.g., Target Audience"
              required
            />
            <p className="text-sm text-muted-foreground">
                Set the user-facing name for this column.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="field-key">Field key</Label>
            <Input
              id="field-key"
              value={fieldKey}
              onChange={(e) => setFieldKey(e.target.value)}
              placeholder="e.g., target_audience"
            />
             <p className="text-sm text-muted-foreground">
                Set the Firestore field key to link to this column. It will display any existing data for this field key.
            </p>
          </div>
          <div className="space-y-2">
              <Label htmlFor="field-type">Field type</Label>
              <Select>
                <SelectTrigger id="field-type">
                    <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Text</SelectLabel>
                    <SelectItem value="short-text"><Type className="inline-block mr-2 h-4 w-4" />Short Text</SelectItem>
                    <SelectItem value="long-text"><ListPlus className="inline-block mr-2 h-4 w-4" />Long Text</SelectItem>
                    <SelectItem value="rich-text"><Type className="inline-block mr-2 h-4 w-4" />Rich Text</SelectItem>
                    <SelectItem value="email"><AtSign className="inline-block mr-2 h-4 w-4" />Email</SelectItem>
                    <SelectItem value="phone"><Phone className="inline-block mr-2 h-4 w-4" />Phone</SelectItem>
                    <SelectItem value="url"><Link2 className="inline-block mr-2 h-4 w-4" />URL</SelectItem>
                  </SelectGroup>
                   <SelectGroup>
                    <SelectLabel>Select</SelectLabel>
                    <SelectItem value="single-select"><ListPlus className="inline-block mr-2 h-4 w-4" />Single Select</SelectItem>
                    <SelectItem value="multi-select"><ListPlus className="inline-block mr-2 h-4 w-4" />Multi Select</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Numeric</SelectLabel>
                    <SelectItem value="number"><Sigma className="inline-block mr-2 h-4 w-4" />Number</SelectItem>
                    <SelectItem value="toggle"><ToggleRight className="inline-block mr-2 h-4 w-4" />Toggle</SelectItem>
                    <SelectItem value="percentage"><Percent className="inline-block mr-2 h-4 w-4" />Percentage</SelectItem>
                    <SelectItem value="rating"><Star className="inline-block mr-2 h-4 w-4" />Rating</SelectItem>
                    <SelectItem value="slider"><SlidersHorizontal className="inline-block mr-2 h-4 w-4" />Slider</SelectItem>
                    <SelectItem value="color"><Palette className="inline-block mr-2 h-4 w-4" />Color</SelectItem>
                    <SelectItem value="geopoint"><MapPin className="inline-block mr-2 h-4 w-4" />GeoPoint</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Date & Time</SelectLabel>
                    <SelectItem value="date"><Calendar className="inline-block mr-2 h-4 w-4" />Date</SelectItem>
                    <SelectItem value="datetime"><Clock className="inline-block mr-2 h-4 w-4" />Date & Time</SelectItem>
                    <SelectItem value="duration"><Timer className="inline-block mr-2 h-4 w-4" />Duration</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>File</SelectLabel>
                    <SelectItem value="image"><ImageIcon className="inline-block mr-2 h-4 w-4" />Image</SelectItem>
                    <SelectItem value="file"><File className="inline-block mr-2 h-4 w-4" />File</SelectItem>
                  </SelectGroup>
                   <SelectGroup>
                    <SelectLabel>Connection</SelectLabel>
                    <SelectItem value="connector"><ConnectionIcon className="inline-block mr-2 h-4 w-4" />Connector</SelectItem>
                    <SelectItem value="array-subtable">Array SubTable (Alpha)</SelectItem>
                    <SelectItem value="sub-table">Sub-Table</SelectItem>
                    <SelectItem value="reference">Reference</SelectItem>
                    <SelectItem value="connect-table">Connect Table (Alpha)</SelectItem>
                    <SelectItem value="connect-service">Connect Service (Alpha)</SelectItem>
                  </SelectGroup>
                   <SelectGroup>
                    <SelectLabel>Code</SelectLabel>
                    <SelectItem value="json"><Braces className="inline-block mr-2 h-4 w-4" />JSON</SelectItem>
                    <SelectItem value="code"><Code className="inline-block mr-2 h-4 w-4" />Code</SelectItem>
                    <SelectItem value="markdown"><Pilcrow className="inline-block mr-2 h-4 w-4" />Markdown</SelectItem>
                    <SelectItem value="array">Array</SelectItem>
                  </SelectGroup>
                   <SelectGroup>
                    <SelectLabel>Cloud Function</SelectLabel>
                    <SelectItem value="action"><FunctionSquare className="inline-block mr-2 h-4 w-4" />Action</SelectItem>
                    <SelectItem value="derivative"><FunctionSquare className="inline-block mr-2 h-4 w-4" />Derivative</SelectItem>
                    <SelectItem value="status"><Server className="inline-block mr-2 h-4 w-4" />Status</SelectItem>
                  </SelectGroup>
                   <SelectGroup>
                    <SelectLabel>Client Function</SelectLabel>
                    <SelectItem value="formula"><SigmaSquare className="inline-block mr-2 h-4 w-4" />Formula</SelectItem>
                  </SelectGroup>
                   <SelectGroup>
                    <SelectLabel>Auditing</SelectLabel>
                    <SelectItem value="created-by">Created By</SelectItem>
                    <SelectItem value="updated-by">Updated By</SelectItem>
                    <SelectItem value="created-at"><Clock className="inline-block mr-2 h-4 w-4" />Created At</SelectItem>
                    <SelectItem value="updated-at"><History className="inline-block mr-2 h-4 w-4" />Updated At</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Add</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PipelineAdminClient({
  initialPipelines,
  userRole,
}: {
  initialPipelines: Pipeline[];
  userRole: UserRole;
}) {
  const [pipelines, setPipelines] = React.useState(initialPipelines);
  const { toast } = useToast();
  
  const [allPossibleColumns, setAllPossibleColumns] = React.useState<string[]>(() => {
    const columnSet = new Set<string>();
    initialPipelines.forEach(p => Object.keys(p).forEach(key => columnSet.add(key)));
    const sorted = Array.from(columnSet).sort();
    if (sorted.includes('id')) {
        const withName = sorted.filter(c => c !== 'id' && c !== 'drug' && c !== 'status' && c !== 'phases');
        return ['id', 'drug', 'status', ...withName, 'phases'];
    }
    return sorted;
  });

  const [columnDisplayNames, setColumnDisplayNames] = React.useState<Record<string, string>>({});
  const [visibleColumns, setVisibleColumns] = React.useState<string[]>(allPossibleColumns.filter(c => c !== 'phases'));
  const [orderedColumns, setOrderedColumns] = React.useState<string[]>(allPossibleColumns);
  const [columnSearch, setColumnSearch] = React.useState('');
  const [globalSearch, setGlobalSearch] = React.useState('');
  
  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>(
    allPossibleColumns.reduce((acc, col) => ({ ...acc, [col]: 150 }), {})
  );

  const [editingCell, setEditingCell] = React.useState<{ pipelineId: string; columnName: string } | null>(null);
  const [editValue, setEditValue] = React.useState('');
  const editInputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const tableRef = React.useRef<HTMLTableElement>(null);
  const isResizing = React.useRef<string | null>(null);
  const startX = React.useRef(0);
  const startWidth = React.useRef(0);
  const dragItem = React.useRef<string | null>(null);
  const dragOverItem = React.useRef<string | null>(null);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedPipelines, setSelectedPipelines] = React.useState(new Set<string>());
  
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = React.useState(false);
  const [addColumnMode, setAddColumnMode] = React.useState<AddColumnMode>('add');
  const [targetColumn, setTargetColumn] = React.useState<string | null>(null);

  const [isCreateFormOpen, setIsCreateFormOpen] = React.useState(false);
  const createFormRef = React.useRef<HTMLFormElement>(null);
  
  const [pipelineToEdit, setPipelineToEdit] = React.useState<Pipeline | null>(null);
  const editFormRef = React.useRef<HTMLFormElement>(null);
  const [sortConfig, setSortConfig] = React.useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  
  const [renamingColumn, setRenamingColumn] = React.useState<string | null>(null);
  const [newColumnDisplayName, setNewColumnDisplayName] = React.useState('');
  const [lockedColumns, setLockedColumns] = React.useState<Set<string>>(new Set());
  const [frozenColumn, setFrozenColumn] = React.useState<string | null>(null);
  const [isResizeEnabled, setIsResizeEnabled] = React.useState(true);


  const getDisplayName = (key: string) => {
    if (columnDisplayNames[key]) {
        return columnDisplayNames[key];
    }
    // Convert camelCase or snake_case to Title Case
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
  };

  // Load state from localStorage on component mount
  React.useEffect(() => {
    try {
      const savedOrder = localStorage.getItem('pipelineAdminColumnOrder');
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        const validSavedOrder = parsedOrder.filter((col: string) => allPossibleColumns.includes(col));
        const newColumns = allPossibleColumns.filter(col => !validSavedOrder.includes(col));
        setOrderedColumns([...validSavedOrder, ...newColumns]);
      }
    } catch (e) {
      console.error("Failed to parse saved column order:", e);
    }
    
    try {
      const savedWidths = localStorage.getItem('pipelineAdminColumnWidths');
      if (savedWidths) {
        setColumnWidths(prev => ({ ...prev, ...JSON.parse(savedWidths) }));
      }
    } catch (e) {
      console.error("Failed to parse saved column widths:", e);
    }
    
    try {
      const savedDisplayNames = localStorage.getItem('pipelineAdminColumnDisplayNames');
      if (savedDisplayNames) {
        setColumnDisplayNames(JSON.parse(savedDisplayNames));
      }
    } catch (e) {
      console.error("Failed to parse saved column display names:", e);
    }
    
    try {
      const savedLocked = localStorage.getItem('pipelineAdminLockedColumns');
      if (savedLocked) {
        setLockedColumns(new Set(JSON.parse(savedLocked)));
      }
    } catch (e) {
      console.error("Failed to parse saved locked columns:", e);
    }

    try {
      const savedFrozen = localStorage.getItem('pipelineAdminFrozenColumn');
      if (savedFrozen) {
        const parsedFrozen = JSON.parse(savedFrozen);
        if (allPossibleColumns.includes(parsedFrozen)) {
          setFrozenColumn(parsedFrozen);
        }
      }
    } catch (e) {
      console.error("Failed to parse saved frozen column:", e);
    }
  }, [allPossibleColumns]);


  React.useEffect(() => {
    if (editingCell && editInputRef.current) {
        editInputRef.current.focus();
    }
  }, [editingCell]);
  
  React.useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);


  const handleDragStart = (e: React.DragEvent, columnName: string) => {
    if (lockedColumns.has(columnName) || frozenColumn === columnName) {
      e.preventDefault();
      return;
    }
    dragItem.current = columnName;
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent, columnName: string) => {
      e.preventDefault();
      dragOverItem.current = columnName;

      const scrollAreaNode = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollAreaNode) {
          const rect = scrollAreaNode.getBoundingClientRect();
          const { clientY } = e;
          const top = rect.top;
          const bottom = rect.bottom;
          const scrollSpeed = 8;
          
          if (clientY < top + 40) { // 40px from the top
              scrollAreaNode.scrollTop -= scrollSpeed;
          } else if (clientY > bottom - 40) { // 40px from the bottom
              scrollAreaNode.scrollTop += scrollSpeed;
          }
      }
  };
  
  const handleDrop = () => {
    if (dragItem.current && dragOverItem.current && dragItem.current !== dragOverItem.current) {
        const newColumns = [...orderedColumns];
        const dragItemIndex = newColumns.indexOf(dragItem.current);
        const dragOverItemIndex = newColumns.indexOf(dragOverItem.current);
        
        const [removed] = newColumns.splice(dragItemIndex, 1);
        newColumns.splice(dragOverItemIndex, 0, removed);
        
        setOrderedColumns(newColumns);
        localStorage.setItem('pipelineAdminColumnOrder', JSON.stringify(newColumns));
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };
  
  const handleDragEnd = () => {
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    columnName: string
  ) => {
    if (!isResizeEnabled) return;
    isResizing.current = columnName;
    startX.current = e.clientX;
    startWidth.current = columnWidths[columnName] || 150;
    
    const handleMouseMove = (me: MouseEvent) => {
        if (isResizing.current !== columnName) return;
        const diffX = me.clientX - startX.current;
        const newWidth = Math.max(startWidth.current + diffX, 80); // Minimum width
        setColumnWidths(prev => ({...prev, [columnName]: newWidth}));
    };

    const handleMouseUp = () => {
        isResizing.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        
        setColumnWidths(prev => {
            localStorage.setItem('pipelineAdminColumnWidths', JSON.stringify(prev));
            return prev;
        });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig && sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending';
    }
    setSortConfig({ key, direction });
  };


  const sortedPipelines = React.useMemo(() => {
    let sortableItems = [...pipelines];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = (a as any)[sortConfig.key];
        const bValue = (b as any)[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        }
        
        const stringA = String(aValue).toLowerCase();
        const stringB = String(bValue).toLowerCase();

        if (stringA < stringB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (stringA > stringB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [pipelines, sortConfig]);
  

  const filteredPipelines = React.useMemo(() => {
    return sortedPipelines.filter(pipeline => {
        const globalSearchTerm = globalSearch.toLowerCase();
        return !globalSearchTerm || Object.values(pipeline).some(value => 
            String(value).toLowerCase().includes(globalSearchTerm)
        );
    });
  }, [sortedPipelines, globalSearch]);


  const handleCreateFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to create pipelines.' });
  };

  const handleUpdateFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to update pipelines.' });
  };

  const handleAddOrInsertColumn = (displayName: string, fieldKey: string) => {
    toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to add columns.' });
  };

  const openAddColumnDialog = (mode: AddColumnMode, targetCol: string | null) => {
    toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to add columns.' });
  };

  const handleCellEdit = (pipelineId: string, columnName: string, value: any) => {
    toast({ variant: 'destructive', title: 'Read-Only', description: 'Editing data is not permitted.' });
  };

  const handleSaveEdit = async () => {
    if (!editingCell) return;
    toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to update data.' });
    setEditingCell(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSaveEdit();
    } else if (e.key === 'Escape') {
        setEditingCell(null);
    }
  };


  const handleDelete = async (pipelineId: string) => {
    try {
      await deletePipeline(pipelineId);
      setPipelines((prev) => prev.filter((p) => p.id !== pipelineId));
      toast({ title: 'Pipeline Deleted' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error deleting pipeline',
        description: error.message,
      });
    }
  };
  
  const handleDeleteColumn = (columnName: string) => {
    toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to delete columns.' });
  };

  const handleDuplicate = async (pipelineId: string) => {
    toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to duplicate pipelines.' });
  };


  const handleBulkDelete = async () => {
    toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to delete pipelines.' });
  };

  const handleOpenEditModal = () => {
    toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to edit pipelines.' });
  };

  const openFormForCreate = () => {
    toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to create pipelines.' });
  };

  const handleColumnVisibilityChange = (columnName: string) => {
    setVisibleColumns(prev => 
        prev.includes(columnName) ? prev.filter(c => c !== columnName) : [...prev, columnName]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPipelines(new Set(filteredPipelines.map(p => p.id)));
    } else {
      setSelectedPipelines(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedPipelines(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleRenameColumn = (e: React.FormEvent) => {
      e.preventDefault();
      if (!renamingColumn || !newColumnDisplayName) return;

      const newNames = { ...columnDisplayNames, [renamingColumn]: newColumnDisplayName };
      setColumnDisplayNames(newNames);
      localStorage.setItem('pipelineAdminColumnDisplayNames', JSON.stringify(newNames));
      toast({ title: `Renamed column to "${newColumnDisplayName}".` });

      // Close dialog
      setRenamingColumn(null);
      setNewColumnDisplayName('');
  };
  
  const handleToggleLockColumn = (columnName: string) => {
    const newLockedColumns = new Set(lockedColumns);
    if (newLockedColumns.has(columnName)) {
      newLockedColumns.delete(columnName);
    } else {
      newLockedColumns.add(columnName);
    }
    setLockedColumns(newLockedColumns);
    localStorage.setItem('pipelineAdminLockedColumns', JSON.stringify(Array.from(newLockedColumns)));
    toast({ title: `Column "${getDisplayName(columnName)}" has been ${newLockedColumns.has(columnName) ? 'locked' : 'unlocked'}.` });
  };
  
  const handleToggleFreezeColumn = (columnName: string) => {
    let newFrozenColumn = frozenColumn === columnName ? null : columnName;
    setFrozenColumn(newFrozenColumn);
    localStorage.setItem('pipelineAdminFrozenColumn', JSON.stringify(newFrozenColumn));
    toast({
        title: newFrozenColumn
            ? `Column "${getDisplayName(columnName)}" frozen.`
            : `Column "${getDisplayName(columnName)}" unfrozen.`
    });
  };

  const handleToggleResize = () => {
    setIsResizeEnabled(prev => !prev);
    toast({ title: `Column resizing ${!isResizeEnabled ? 'enabled' : 'disabled'}.` });
  };

  const canCreate = userRole === 'admin';
  const canUpdate = userRole === 'admin' || userRole === 'editor';
  const canDelete = userRole === 'admin';

  const currentlyVisibleAndOrderedColumns = React.useMemo(() => {
    const visible = orderedColumns.filter(c => visibleColumns.includes(c));
    if (frozenColumn && visible.includes(frozenColumn)) {
        return [frozenColumn, ...visible.filter(c => c !== frozenColumn)];
    }
    return visible;
  }, [orderedColumns, visibleColumns, frozenColumn]);

  const gridTemplateColumns = ['40px', ...currentlyVisibleAndOrderedColumns.map(colName => `${columnWidths[colName] || 150}px`), 'auto'].join(' ');
  
  const searchedColumns = orderedColumns.filter(c => getDisplayName(c).toLowerCase().includes(columnSearch.toLowerCase()));
  const hiddenCount = allPossibleColumns.length - visibleColumns.length;

  const TableActions = () => {
    const numSelected = selectedPipelines.size;
    if (numSelected === 0) return null;

    return (
      <div className="flex h-10 items-center gap-4 rounded-md bg-muted px-4">
        <div className="text-sm font-medium">
          {numSelected} of {filteredPipelines.length} row(s) selected.
        </div>
        <Button variant="outline" size="sm" disabled={true} onClick={handleOpenEditModal}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={true}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the {numSelected} selected pipeline(s).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkDelete} className={cn(buttonVariants({ variant: "destructive" }))}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  };

  return (
    <div className="space-y-4">
       <div className="flex justify-between items-center gap-4">
        <div className="flex gap-2 items-center">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <EyeOff className="mr-2 h-4 w-4" />
                        {hiddenCount > 0 ? `${hiddenCount} Hidden` : 'Hide'}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="start">
                    <div className="p-2 space-y-2">
                       <div className="relative">
                         <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                         <Input 
                            placeholder="Search fields..."
                            value={columnSearch}
                            onChange={(e) => setColumnSearch(e.target.value)}
                            className="pl-8 h-9"
                         />
                       </div>
                    </div>
                    <DropdownMenuSeparator />
                    <ScrollArea className="h-[500px]" ref={scrollAreaRef}>
                        {searchedColumns.map((column) => {
                            const isVisible = visibleColumns.includes(column);
                            return (
                                <DropdownMenuItem 
                                    key={column} 
                                    onSelect={(e) => e.preventDefault()}
                                    className={cn("group flex items-center justify-between cursor-move", dragItem.current === column && "opacity-50")}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, column)}
                                    onDragOver={(e) => handleDragOver(e, column)}
                                    onDrop={handleDrop}
                                    onDragEnd={handleDragEnd}
                                >
                                    <div className="flex items-center" onClick={() => handleColumnVisibilityChange(column)}>
                                        <Checkbox
                                            checked={isVisible}
                                            onCheckedChange={() => handleColumnVisibilityChange(column)}
                                            className="mr-2"
                                            aria-label={`Toggle visibility of ${getDisplayName(column)} column`}
                                        />
                                        <GripVertical className="h-4 w-4 mr-2 text-muted-foreground" />
                                        <span className="capitalize font-normal flex-grow">{getDisplayName(column)}</span>
                                    </div>
                                </DropdownMenuItem>
                            );
                        })}
                    </ScrollArea>
                     <DropdownMenuSeparator />
                     <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <div className="flex justify-between w-full text-sm">
                            <Button variant="link" className="p-0 h-auto" onClick={() => setVisibleColumns(allPossibleColumns)}>Show all</Button>
                            <Button variant="link" className="p-0 h-auto" onClick={() => setVisibleColumns(['id'])}>Hide all</Button>
                        </div>
                     </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <div className="relative flex items-center">
                 <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setIsSearchOpen(prev => !prev)}
                    className={cn(isSearchOpen && 'rounded-r-none border-r-0')}
                >
                    <Search className="h-4 w-4" />
                </Button>
                <div className={cn("transition-all duration-300 ease-in-out", isSearchOpen ? 'w-64' : 'w-0')}>
                    <Input 
                        ref={searchInputRef}
                        placeholder="Search all columns..." 
                        className={cn("pl-2 h-10 rounded-l-none", !isSearchOpen && "p-0 border-transparent")}
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                        onBlur={() => {if(!globalSearch) setIsSearchOpen(false)}}
                    />
                </div>
            </div>
        </div>
        <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="hidden sm:flex">
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Invite team members
              </Link>
            </Button>
            <Badge variant="outline" className="text-sm py-1 px-3 border-yellow-400 text-yellow-400">PRO</Badge>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild><Button variant="ghost" size="icon"><Info className="h-5 w-5" /></Button></TooltipTrigger>
                    <TooltipContent><p>Get help</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild><Button variant="ghost" size="icon"><Download className="h-5 w-5" /></Button></TooltipTrigger>
                    <TooltipContent><p>Download</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild><Button variant="ghost" size="icon"><Rows className="h-5 w-5" /></Button></TooltipTrigger>
                    <TooltipContent><p>Row height</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild><Button variant="ghost" size="icon"><ColumnsIcon className="h-5 w-5" /></Button></TooltipTrigger>
                    <TooltipContent><p>Fit columns</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild><Button variant="ghost" size="icon"><Upload className="h-5 w-5" /></Button></TooltipTrigger>
                    <TooltipContent><p>Upload</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </div>
      </div>
      
      <TableActions />

      <div className="w-full overflow-hidden rounded-md border group/table">
        <ScrollArea className="w-full whitespace-nowrap">
            <div className="relative overflow-x-auto">
                <Table ref={tableRef} className="min-w-full border-collapse" style={{ display: 'grid', gridTemplateColumns }}>
                    <TableHeader style={{ display: 'contents' }}>
                      <TableRow className="flex w-full sticky top-0 bg-muted/50 z-10" style={{ display: 'contents' }}>
                          <TableHead className="sticky left-0 flex items-center justify-center p-2 border-r border-b h-14 bg-muted/50 z-20">
                            <Checkbox
                              checked={filteredPipelines.length > 0 && selectedPipelines.size === filteredPipelines.length}
                              onCheckedChange={(checked) => handleSelectAll(!!checked)}
                              aria-label="Select all rows"
                            />
                          </TableHead>
                          {currentlyVisibleAndOrderedColumns.map((colName) => (
                              <TableHead 
                                  key={colName} 
                                  className={cn(
                                      "relative font-bold overflow-hidden p-0 transition-opacity border-r border-b flex items-center h-14 bg-muted/50",
                                      dragItem.current === colName && 'opacity-50',
                                      frozenColumn === colName && "sticky z-10"
                                  )}
                                   style={{ left: frozenColumn === colName ? '40px' : undefined }}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, colName)}
                                  onDragOver={(e) => handleDragOver(e, colName)}
                                  onDrop={handleDrop}
                                  onDragEnd={handleDragEnd}
                              >
                                <div className="flex items-center gap-2 flex-grow p-2 cursor-move">
                                      {lockedColumns.has(colName) && <Lock className="h-4 w-4 text-muted-foreground" />}
                                      {frozenColumn === colName && <Pin className="h-4 w-4 text-muted-foreground" />}
                                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                                      <span onClick={() => requestSort(colName)}>{getDisplayName(colName)}</span>
                                      {sortConfig?.key === colName && (
                                        sortConfig.direction === 'ascending' 
                                          ? <ArrowUpAZ className="h-4 w-4" /> 
                                          : <ArrowDownAZ className="h-4 w-4" />
                                      )}
                                </div>
                                <div
                                    onMouseDown={(e) => handleMouseDown(e, colName)}
                                    className={cn("absolute top-0 right-0 h-full w-2 z-10", isResizeEnabled ? "cursor-col-resize" : "cursor-default")}
                                />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-full w-8 rounded-none">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>
                                            {getDisplayName(colName)}
                                            <div className="text-xs font-normal text-muted-foreground mt-1">
                                                Key: <code className="bg-muted px-1.5 py-0.5 rounded-md font-mono">{colName}</code>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => requestSort(colName)}>
                                            <ArrowDown className="mr-2 h-4 w-4" /> Sort: descending
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => requestSort(colName)}>
                                            <ArrowUp className="mr-2 h-4 w-4" /> Sort: ascending
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleColumnVisibilityChange(colName)}>
                                            <Eye className="mr-2 h-4 w-4" /> Hide
                                        </DropdownMenuItem>
                                        <DropdownMenuItem disabled>
                                            <Filter className="mr-2 h-4 w-4" /> Filter...
                                        </DropdownMenuItem>
                                        <DropdownMenuItem disabled>
                                            <Columns className="mr-2 h-4 w-4" /> Set Column Width
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleToggleLockColumn(colName)}>
                                            {lockedColumns.has(colName) ? (
                                                <>
                                                    <Unlock className="mr-2 h-4 w-4" /> Unlock
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="mr-2 h-4 w-4" /> Lock
                                                </>
                                            )}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={handleToggleResize}>
                                            <ChevronsLeftRight className="mr-2 h-4 w-4" />
                                            {isResizeEnabled ? 'Disable resize' : 'Enable resize'}
                                        </DropdownMenuItem>
                                         <DropdownMenuItem onSelect={() => handleToggleFreezeColumn(colName)}>
                                            <Pin className="mr-2 h-4 w-4" /> 
                                            {frozenColumn === colName ? 'Unfreeze' : 'Freeze'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                            onSelect={() => {
                                                setRenamingColumn(colName);
                                                setNewColumnDisplayName(getDisplayName(colName));
                                            }}
                                        >
                                            <Pencil className="mr-2 h-4 w-4" /> Rename...
                                        </DropdownMenuItem>
                                        <DropdownMenuItem disabled>
                                            <Replace className="mr-2 h-4 w-4" /> Edit type: Long Text...
                                        </DropdownMenuItem>
                                        <DropdownMenuItem disabled>
                                            <Settings2 className="mr-2 h-4 w-4" /> Column config...
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                              </TableHead>
                          ))}
                          <TableHead className="sticky right-0 text-right font-bold overflow-hidden p-2 border-b flex items-center justify-end h-14 bg-muted/50 z-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody style={{ display: 'contents' }}>
                    {filteredPipelines.map((pipeline) => (
                        <TableRow key={pipeline.id} className="contents group/row">
                            <TableCell className={cn(
                              "sticky left-0 flex items-center justify-center p-2 border-r border-b bg-white group-hover/row:bg-[#F5F4F5] h-20 z-10",
                              selectedPipelines.has(pipeline.id) && "bg-[#F5F4F5]"
                            )}>
                                <Checkbox
                                    checked={selectedPipelines.has(pipeline.id)}
                                    onCheckedChange={(checked) => handleSelectRow(pipeline.id, !!checked)}
                                    aria-label={`Select row for ${pipeline.drug}`}
                                />
                            </TableCell>
                            {currentlyVisibleAndOrderedColumns.map(colName => {
                                const isEditing = editingCell?.pipelineId === pipeline.id && editingCell?.columnName === colName;
                                return (
                                <TableCell 
                                  key={`${pipeline.id}-${colName}`} 
                                  className={cn(
                                    "font-medium border-r border-b p-0 bg-white group-hover/row:bg-[#F5F4F5] flex items-center h-20 overflow-hidden",
                                    selectedPipelines.has(pipeline.id) && "bg-[#F5F4F5]",
                                    frozenColumn === colName && "sticky z-10"
                                  )}
                                  style={{ left: frozenColumn === colName ? '40px' : undefined }}
                                  onClick={() => handleCellEdit(pipeline.id, colName, (pipeline as any)[colName])}
                                >
                                  {isEditing ? (
                                      <div className="h-full w-full">
                                          <Textarea
                                              ref={editInputRef as React.Ref<HTMLTextAreaElement>}
                                              value={editValue}
                                              onChange={(e) => setEditValue(e.target.value)}
                                              onBlur={handleSaveEdit}
                                              onKeyDown={handleEditKeyDown}
                                              className="h-full w-full rounded-none border-2 border-primary ring-0 focus-visible:ring-0 p-2"
                                              rows={3}
                                          />
                                      </div>
                                  ) : (
                                      <div className="p-2 w-full whitespace-normal break-words">
                                          {renderCellContent((pipeline as any)[colName], colName)}
                                      </div>
                                  )}
                                </TableCell>
                            )})}
                            <TableCell className={cn(
                              "sticky right-0 text-right border-b p-2 flex items-center bg-white group-hover/row:bg-[#F5F4F5] h-20 z-10",
                              selectedPipelines.has(pipeline.id) && "bg-[#F5F4F5]"
                            )}>
                                <div className="flex justify-end items-center w-full">
                                  <span className="text-muted-foreground text-xs">Read-only</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

       <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
        <DialogContent className="max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create Pipeline</DialogTitle>
            <DialogDescription>Enter the details for the new pipeline.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-6 -mr-6">
              <form ref={createFormRef} onSubmit={handleCreateFormSubmit} className="space-y-4 py-4">
                {allPossibleColumns.map(colName => {
                  if (['id', 'dateCreated', 'dateUpdated', 'createdBy', 'updatedBy'].includes(colName)) return null;

                  const isTextarea = ['description', 'mechanism', 'sourceSummary'].includes(colName);
                  const isObject = ['financials', 'phases', 'lead'].includes(colName);
                  const isReadonly = ['companyLogoUrl', 'headquarters', 'progress'].includes(colName);
                  
                  if (isReadonly) return null;

                  return (
                    <div key={`form-${colName}`} className="space-y-2">
                      <Label htmlFor={colName}>{getDisplayName(colName)}</Label>
                      {isTextarea || isObject ? (
                          <Textarea 
                              id={colName} 
                              name={colName} 
                              rows={4}
                              placeholder={isObject ? "Enter valid JSON" : ""}
                          />
                      ) : (
                          <Input 
                              id={colName} 
                              name={colName} 
                              required={colName === 'drug'} 
                          />
                      )}
                    </div>
                  );
                })}
              </form>
            </ScrollArea>
          </div>
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => setIsCreateFormOpen(false)}>Cancel</Button>
              <Button type="button" onClick={() => createFormRef.current?.requestSubmit()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <AddOrInsertColumnDialog
        isOpen={isAddColumnDialogOpen}
        onOpenChange={setIsAddColumnDialogOpen}
        onSubmit={handleAddOrInsertColumn}
        mode={addColumnMode}
        targetColumnDisplayName={targetColumn ? getDisplayName(targetColumn) : ''}
      />

      {/* Edit Pipeline Dialog */}
      <Dialog open={!!pipelineToEdit} onOpenChange={(open) => !open && setPipelineToEdit(null)}>
        <DialogContent className="max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Pipeline</DialogTitle>
            <DialogDescription>Update the details for "{pipelineToEdit?.drug}".</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-6 -mr-6">
              <form ref={editFormRef} onSubmit={handleUpdateFormSubmit} className="space-y-4 py-4">
                {pipelineToEdit && allPossibleColumns.map(colName => {
                  if (['id', 'dateCreated', 'dateUpdated', 'createdBy', 'updatedBy'].includes(colName)) return null;

                  const isTextarea = ['description', 'mechanism', 'sourceSummary'].includes(colName);
                  const rawValue = (pipelineToEdit as any)[colName];
                  const isObject = typeof rawValue === 'object' && rawValue !== null && !Array.isArray(rawValue);
                  
                  const defaultValue = isObject ? JSON.stringify(rawValue, null, 2) : rawValue ?? '';

                  return (
                    <div key={`edit-form-${colName}`} className="space-y-2">
                      <Label htmlFor={`edit-${colName}`}>{getDisplayName(colName)}</Label>
                      {isTextarea || isObject ? (
                          <Textarea 
                              id={`edit-${colName}`}
                              name={colName} 
                              rows={4}
                              defaultValue={defaultValue}
                              placeholder={isObject ? "Enter valid JSON" : ""}
                          />
                      ) : (
                          <Input 
                              id={`edit-${colName}`}
                              name={colName} 
                              required={colName === 'drug'} 
                              defaultValue={defaultValue}
                          />
                      )}
                    </div>
                  );
                })}
              </form>
            </ScrollArea>
          </div>
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => setPipelineToEdit(null)}>Cancel</Button>
              <Button type="button" onClick={() => editFormRef.current?.requestSubmit()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
       {/* Rename Column Dialog */}
       <Dialog open={!!renamingColumn} onOpenChange={(isOpen) => !isOpen && setRenamingColumn(null)}>
         <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleRenameColumn}>
                 <DialogHeader>
                   <DialogTitle>Rename column</DialogTitle>
                 </DialogHeader>
                 <div className="space-y-4 py-4">
                   <div className="space-y-2">
                     <Label htmlFor="column-name">
                       Column name
                     </Label>
                     <Input
                       id="column-name"
                       value={newColumnDisplayName}
                       onChange={(e) => setNewColumnDisplayName(e.target.value)}
                     />
                   </div>
                 </div>
                 <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setRenamingColumn(null)}>Cancel</Button>
                    <Button type="submit">Update</Button>
                 </DialogFooter>
            </form>
         </DialogContent>
       </Dialog>
    </div>
  );
}
