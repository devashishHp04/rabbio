
// src/components/pipeline-world-map.tsx
'use client';

import React, { useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Pipeline } from '@/lib/types';
import { scaleLinear } from 'd3-scale';
import { useRouter } from 'next/navigation';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function PipelineWorldMap({ pipelines }: { pipelines: Pipeline[] }) {
    const router = useRouter();
    
    const data = useMemo(() => {
        const pipelineCounts: { [key: string]: number } = {};

        pipelines.forEach(pipeline => {
            const country = pipeline.headquarters;
            if (country) {
                pipelineCounts[country] = (pipelineCounts[country] || 0) + 1;
            }
        });
        
        return Object.keys(pipelineCounts).map(country => ({
            country: country,
            value: pipelineCounts[country]
        }));
    }, [pipelines]);

    const maxPipelines = Math.max(...data.map(d => d.value), 0);

    const colorScale = scaleLinear<string>()
      .domain([0, maxPipelines])
      .range(["#E6F2FF", "#003D7A"]); // Light blue to dark blue

    const handleCountryClick = (countryName: string) => {
        if (countryName) {
            router.push(`/pipeline?headquarters=${encodeURIComponent(countryName)}`);
        }
    };

    return (
        <TooltipProvider>
            <ComposableMap
                projection="geoMercator"
                style={{ width: "100%", height: "100%" }}
            >
                <ZoomableGroup center={[0, 20]} zoom={1}>
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map(geo => {
                                const countryName = geo.properties.name;
                                const d = data.find(s => s.country === countryName);
                                const pipelineCount = d ? d.value : 0;
                                const tooltipText = `${countryName}: ${pipelineCount} pipeline(s)`;
                                
                                return (
                                    <Tooltip key={geo.rsmKey}>
                                        <TooltipTrigger asChild>
                                            <Geography
                                                geography={geo}
                                                fill={d ? colorScale(d.value) : "#F5F4F6"}
                                                stroke="#FFF"
                                                strokeWidth={0.5}
                                                onClick={() => pipelineCount > 0 && handleCountryClick(countryName)}
                                                style={{
                                                  default: { outline: 'none', cursor: pipelineCount > 0 ? 'pointer' : 'default' },
                                                  hover: { outline: 'none', fill: pipelineCount > 0 ? "#007bff" : "#F5F4F6" },
                                                  pressed: { outline: 'none' },
                                                }}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{tooltipText}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>
        </TooltipProvider>
    );
}
