
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import type { Pipeline, PipelineStatus, TeamMember } from '@/lib/types';
import {
  Users,
  ArrowUp,
  ArrowDown,
  Minus,
  MoreVertical,
  GripVertical,
  EyeOff,
  View
} from 'lucide-react';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import PipelineWorldMap from '@/components/pipeline-world-map';
import * as React from 'react';
import { DndProvider, useDrag, useDrop, type XYCoord } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';


const ItemTypes = {
  CARD: 'card',
};

interface DraggableCardProps {
  id: any;
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  children: React.ReactNode;
}

const DraggableCard: React.FC<DraggableCardProps> = ({ id, index, moveCard, children }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: ItemTypes.CARD,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: any, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveCard(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.CARD,
    item: () => ({ id, index }),
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.5 : 1;

  preview(drop(ref));

  return (
    <div ref={ref} style={{ opacity }} data-handler-id={handlerId} className="h-full">
      {/* Pass the drag ref to the child component so it can be attached to the drag handle. */}
      {React.cloneElement(children as React.ReactElement, { dragRef: drag })}
    </div>
  );
};


const statusColors: Record<PipelineStatus, string> = {
  Preclinical: 'bg-purple-500',
  'Phase 1': 'bg-blue-500',
  'Phase 2': 'bg-yellow-500',
  'Phase 3': 'bg-orange-500',
  'Phase 4': 'bg-green-500',
  Approved: 'bg-gray-500',
};

const chartColors = ['#6AABDA', '#F05454', '#f59e0b', '#10b981', '#6b7280', '#8b5cf6', '#ec4899', '#f97316', '#3b82f6', '#84cc16', '#a855f7'];

const TrendIndicator = ({ change }: { change: number }) => {
    if (change > 0) {
        return <span className="flex items-center text-xs text-green-500"><ArrowUp className="h-3 w-3 mr-1" /> +{change} this week</span>;
    }
    if (change < 0) {
        return <span className="flex items-center text-xs text-red-500"><ArrowDown className="h-3 w-3 mr-1" /> {change} this week</span>;
    }
    return <span className="flex items-center text-xs text-muted-foreground"><Minus className="h-3 w-3 mr-1" /> No change</span>;
}

const MemoizedPipelineWorldMap = React.memo(PipelineWorldMap);

interface DashboardCardProps {
  dragRef?: React.Ref<any>;
  onHide?: () => void;
  className?: string;
  children: React.ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ onHide, dragRef, className, children }) => {
    return (
        <Card className={cn("h-full flex flex-col", className)}>
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    if (child.type === CustomCardHeader) {
                        return React.cloneElement(child, {
                            onHide,
                            dragRef,
                        } as any);
                    }
                }
                return child;
            })}
        </Card>
    );
};

const CustomCardHeader: React.FC<React.PropsWithChildren<{ title: string; description?: string; onHide?: () => void; dragRef?: React.Ref<any> }>> = ({ title, description, onHide, dragRef, children }) => {
  return (
    <CardHeader>
      <div className="flex items-start justify-between">
          <div className="flex-grow">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center">
              <Button ref={dragRef} variant="ghost" size="icon" className="cursor-move h-8 w-8">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
              </Button>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={onHide}>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Hide Card
                      </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
          </div>
      </div>
       {children}
    </CardHeader>
  );
};


const DashboardClientContent = ({ pipelines, teamMembers }: { pipelines: Pipeline[], teamMembers: TeamMember[] }) => {
  const router = useRouter();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const totalPipelines = pipelines.length;
  const newPipelinesThisWeek = pipelines.filter(p => p.dateCreated && p.dateCreated > sevenDaysAgo).length;

  const pipelinesInProgress = pipelines.filter((p) => p.status !== 'Approved').length;
  const newlyInProgressThisWeek = pipelines.filter(p => p.status !== 'Approved' && p.dateCreated && p.dateCreated > sevenDaysAgo).length;

  const uniqueCompanies = new Set(pipelines.map(p => p.company).filter(Boolean));
  const newCompaniesThisWeek = new Set(pipelines.filter(p => p.dateCreated && p.dateCreated > sevenDaysAgo).map(p => p.company).filter(Boolean)).size;
  
  const recentPipelines = [...pipelines]
    .sort((a, b) => new Date(b.dateUpdated || b.dateCreated || 0).getTime() - new Date(a.dateUpdated || a.dateCreated || 0).getTime())
    .slice(0, 5);

  const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 15;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  const handleChartClick = (path: string, param: string, value: string) => {
      router.push(`${path}?${param}=${encodeURIComponent(value)}`);
  };

  const handleRowClick = (pipelineId: string) => {
    router.push(`/pipeline/${pipelineId}`);
  };

  const allPossibleCards = React.useMemo(() => {
    const pipelinesByTherapeuticArea = pipelines
        .filter(p => typeof p.therapeuticArea === 'string' && p.therapeuticArea.trim() !== '')
        .reduce((acc, pipeline) => {
          let area = pipeline.therapeuticArea.toLowerCase();
          let normalizedArea: string;
          if (area.startsWith('oncology')) normalizedArea = 'Oncology';
          else if (area.includes('infectious')) normalizedArea = 'Infectious Disease';
          else if (area.includes('hematology')) normalizedArea = 'Hematology';
          else if (area.includes('rare') || area.includes('genetic') || area.includes('neuromuscular')) normalizedArea = 'Rare Diseases';
          else normalizedArea = pipeline.therapeuticArea.charAt(0).toUpperCase() + pipeline.therapeuticArea.slice(1);
          acc[normalizedArea] = (acc[normalizedArea] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const sortedTherapeuticAreas = Object.entries(pipelinesByTherapeuticArea).sort(([, a], [, b]) => b - a);
      let therapeuticAreaChartData: { name: string; value: number }[] = sortedTherapeuticAreas.length > 10
        ? [...sortedTherapeuticAreas.slice(0, 10).map(([name, value]) => ({ name, value })), { name: 'Other', value: sortedTherapeuticAreas.slice(10).reduce((acc, [, count]) => acc + count, 0) }]
        : sortedTherapeuticAreas.map(([name, value]) => ({ name, value }));

      const totalPipelinesWithArea = pipelines.filter(p => typeof p.therapeuticArea === 'string' && p.therapeuticArea.trim() !== '').length;
      const therapeuticAreaPercentageData = therapeuticAreaChartData.map(d => ({ ...d, value: parseFloat(((d.value / totalPipelinesWithArea) * 100).toFixed(1)) }));

      const phasesChartData = ['Preclinical', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Approved'].map(phase => ({
          name: phase, count: pipelines.filter(p => p.status === phase).length
      }));
      
      const summaryStats = [
        { id: 'stat-pipelines', title: 'Total Pipelines', value: totalPipelines, trend: newPipelinesThisWeek },
        { id: 'stat-development', title: 'In Development', value: pipelinesInProgress, trend: newlyInProgressThisWeek },
        { id: 'stat-companies', title: 'Companies Tracked', value: uniqueCompanies.size, trend: newCompaniesThisWeek },
      ];

      return [
        ...summaryStats.map(stat => ({
            id: stat.id,
            name: stat.title,
            colSpan: 'lg:col-span-1',
            content: (props: DashboardCardProps) => (
                <DashboardCard {...props}>
                    <CustomCardHeader title={stat.title}>
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                             <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        </div>
                    </CustomCardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">
                            <TrendIndicator change={stat.trend} />
                        </p>
                    </CardContent>
                </DashboardCard>
            ),
        })),
        {
            id: 'chart-phase',
            name: 'Development Phase',
            colSpan: 'lg:col-span-1',
            content: (props: DashboardCardProps) => (
                <DashboardCard {...props}>
                    <CustomCardHeader title="Highest Development Phase" />
                    <CardContent className="flex-grow min-h-0 h-80 w-full p-0">
                    <ChartContainer config={{}} className="h-full w-full">
                        <BarChart data={phasesChartData} layout="vertical" margin={{ left: 20 }} onClick={(data) => handleChartClick('/pipeline', 'phase', data?.activeLabel as string)}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={100} />
                        <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                        <Bar dataKey="count" radius={4} className="cursor-pointer">
                            {phasesChartData.map((_, index) => <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />)}
                        </Bar>
                        </BarChart>
                    </ChartContainer>
                    </CardContent>
                </DashboardCard>
            )
        },
        {
            id: 'chart-therapeutic',
            name: 'Therapeutic Categories',
            colSpan: 'lg:col-span-1',
            content: (props: DashboardCardProps) => (
                <DashboardCard {...props}>
                    <CustomCardHeader title="Therapeutic Categories" />
                    <CardContent className="flex-grow min-h-0 h-80 w-full p-0">
                    <ChartContainer config={{}} className="h-full w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip formatter={(value: number) => `${value}%`} />
                            <Pie data={therapeuticAreaPercentageData} dataKey="value" nameKey="name" cx="40%" cy="50%" outerRadius={100} labelLine={true} label={renderCustomizedLabel} className="cursor-pointer" onClick={(data) => handleChartClick('/pipeline', 'therapeuticArea', data.name)}>
                                {therapeuticAreaPercentageData.map((_, index) => <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />)}
                            </Pie>
                            <Legend layout="vertical" verticalAlign="middle" align="right" />
                        </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                    </CardContent>
                </DashboardCard>
            )
        },
        {
            id: 'map-distribution',
            name: 'Global Distribution',
            colSpan: 'lg:col-span-1',
            content: (props: DashboardCardProps) => (
                <DashboardCard {...props}>
                    <CustomCardHeader title="Global Pipeline Distribution" />
                    <CardContent className="flex-grow min-h-0 h-80 w-full p-0">
                        <MemoizedPipelineWorldMap pipelines={pipelines} />
                    </CardContent>
                </DashboardCard>
            )
        },
        {
            id: 'table-recent',
            name: 'Recent Updates',
            colSpan: 'lg:col-span-2',
            content: (props: DashboardCardProps) => (
                <DashboardCard {...props}>
                    <CustomCardHeader title="Recent Pipeline Updates" description="Top 5 most recently updated pipelines."/>
                    <CardContent>
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Drug Name</TableHead><TableHead>Company</TableHead><TableHead>Phase</TableHead><TableHead>Therapeutic Area</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentPipelines.map((pipeline) => (
                            <TableRow key={pipeline.id} onClick={() => handleRowClick(pipeline.id)} className="cursor-pointer">
                                <TableCell className="font-medium"><Link href={`/pipeline/${pipeline.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>{pipeline.drug}</Link></TableCell>
                                <TableCell>{pipeline.company && <div className="flex items-center gap-2"><Avatar className="h-6 w-6">{pipeline.companyLogoUrl && <AvatarImage src={pipeline.companyLogoUrl} alt={pipeline.company} />}<AvatarFallback>{pipeline.company.charAt(0)}</AvatarFallback></Avatar>{pipeline.company}</div>}</TableCell>
                                <TableCell><Badge className={`${statusColors[pipeline.status]} text-white`}>{pipeline.status}</Badge></TableCell>
                                <TableCell>{pipeline.therapeuticArea}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </CardContent>
                </DashboardCard>
            )
        },
        {
            id: 'list-team',
            name: 'Team Members',
            colSpan: 'lg:col-span-1',
            content: (props: DashboardCardProps) => (
                <DashboardCard {...props}>
                    <CustomCardHeader title="Team Members" />
                    <CardContent className="space-y-4 pt-6">
                        {teamMembers.map((member) => (
                            <div key={member.id} className="flex items-center gap-4">
                                <Avatar><AvatarImage src={member.avatarUrl} /><AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                                <span className="font-medium">{member.name}</span>
                            </div>
                        ))}
                    </CardContent>
                </DashboardCard>
            )
        }
    ];
  }, [pipelines, teamMembers, router]);
  
  const [orderedCards, setOrderedCards] = React.useState(() => {
    const initialOrder = allPossibleCards.map(c => c.id);
    const layoutOrder = [
        'stat-pipelines', 'stat-development', 'stat-companies',
        'chart-phase', 'chart-therapeutic', 'map-distribution',
        'table-recent', 'list-team'
    ];
    const ordered = layoutOrder.filter(id => initialOrder.includes(id));
    const newCards = initialOrder.filter(id => !ordered.includes(id));
    return [...ordered, ...newCards];
  });
  
  const [visibleCards, setVisibleCards] = React.useState(() => new Set(allPossibleCards.map(c => c.id)));

  React.useEffect(() => {
    const savedLayout = localStorage.getItem('dashboardLayout');
    const savedVisibility = localStorage.getItem('dashboardVisibility');
    
    if (savedLayout) {
        try {
            const parsedLayout = JSON.parse(savedLayout);
            const validOrder = parsedLayout.filter((id: string) => allPossibleCards.some(c => c.id === id));
            const newCardIds = allPossibleCards.filter(c => !validOrder.includes(c.id)).map(c => c.id);
            setOrderedCards([...validOrder, ...newCardIds]);
        } catch (e) {
            console.error("Failed to parse dashboard layout from localStorage", e);
        }
    }
    
    if (savedVisibility) {
        try {
            setVisibleCards(new Set(JSON.parse(savedVisibility)));
        } catch (e) {
             console.error("Failed to parse dashboard visibility from localStorage", e);
        }
    }
  }, [allPossibleCards]);

  const moveCard = React.useCallback((dragIndex: number, hoverIndex: number) => {
    setOrderedCards((prev) => {
        const newCards = update(prev, { $splice: [[dragIndex, 1], [hoverIndex, 0, prev[dragIndex]]] });
        localStorage.setItem('dashboardLayout', JSON.stringify(newCards));
        return newCards;
    });
  }, []);

  const toggleCardVisibility = (cardId: string) => {
      setVisibleCards(prev => {
          const newSet = new Set(prev);
          if (newSet.has(cardId)) {
              newSet.delete(cardId);
          } else {
              newSet.add(cardId);
          }
          localStorage.setItem('dashboardVisibility', JSON.stringify(Array.from(newSet)));
          return newSet;
      });
  };

  const cardsToRender = orderedCards
    .map(id => allPossibleCards.find(c => c.id === id))
    .filter(Boolean)
    .filter(card => visibleCards.has(card!.id));
    
  const hiddenCards = allPossibleCards.filter(card => !visibleCards.has(card.id));

  return (
    <>
    <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <View className="mr-2 h-4 w-4" />
                    Add Cards ({hiddenCards.length} hidden)
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Hidden Cards</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {hiddenCards.length > 0 ? (
                    hiddenCards.map(card => (
                        <DropdownMenuItem key={card.id} onClick={() => toggleCardVisibility(card.id)}>
                            Add "{card.name}"
                        </DropdownMenuItem>
                    ))
                ) : (
                    <DropdownMenuItem disabled>No cards to add</DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {cardsToRender.map((card) => {
             const orderedIndex = orderedCards.indexOf(card!.id);
             return (
                <div key={card!.id} className={card!.colSpan}>
                    <DraggableCard 
                        id={card!.id} 
                        index={orderedIndex} 
                        moveCard={moveCard}
                    >
                       {card!.content({ onHide: () => toggleCardVisibility(card!.id) })}
                    </DraggableCard>
                </div>
            )
        })}
    </div>
    </>
  );
}

export default function DashboardClient({ pipelines, teamMembers }: { pipelines: Pipeline[], teamMembers: TeamMember[] }) {
    return (
        <DndProvider backend={HTML5Backend}>
            <DashboardClientContent pipelines={pipelines} teamMembers={teamMembers} />
        </DndProvider>
    );
}
