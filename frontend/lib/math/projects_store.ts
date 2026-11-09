import { SavedProject } from "../types";

let projectsCache: SavedProject[] = [
  {
    id: 1,
    name: "S&P 500 2007 TradingFives Benchmark",
    description: "March 14, 2007 (1363.98) to July 13, 2007 (1555.10) verified 84-day squaring analysis",
    symbol: "SP500_2007",
    timeframe: "1D",
    config: {
      bullGrid: {
        startDate: "2007-03-14",
        startTime: "09:30",
        startPrice: 1363.98,
        degreeSet: 90,
        degreeFactor: 0.8125,
        multiplier: 1.0
      },
      bearGrid: {
        startDate: "2007-07-13",
        startTime: "09:30",
        startPrice: 1555.10,
        degreeSet: 90,
        degreeFactor: 0.8125,
        multiplier: 1.0
      }
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export function listProjects(): SavedProject[] {
  return [...projectsCache];
}

export function saveProject(p: {
  name: string;
  description?: string;
  symbol: string;
  timeframe: string;
  config: Record<string, any>;
}): SavedProject {
  const newProj: SavedProject = {
    id: Date.now(),
    name: p.name,
    description: p.description || "",
    symbol: p.symbol,
    timeframe: p.timeframe,
    config: p.config,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  projectsCache.push(newProj);
  return newProj;
}

export function deleteProject(id: number): boolean {
  const initLen = projectsCache.length;
  projectsCache = projectsCache.filter((p) => p.id !== id);
  return projectsCache.length < initLen;
}
