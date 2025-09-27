"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Search, TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";

interface KeywordTableProps {
  keywordData: any[];
}

export function KeywordTable({ keywordData }: KeywordTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortField, setSortField] = useState("projected_roas");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "high_intent":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "brand":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "awareness":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const filteredAndSortedData = keywordData
    .filter(item => {
      const matchesSearch = item.keyword?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const aValue = (a[sortField as keyof typeof a] as number) || 0;
      const bValue = (b[sortField as keyof typeof b] as number) || 0;
      return sortDirection === "desc" ? bValue - aValue : aValue - bValue;
    });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  if (!keywordData || keywordData.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Keyword Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No keyword data available. Generate a campaign analysis to see results.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Keyword Performance</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search keywords..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-border text-foreground"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-background border-border text-foreground">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="high_intent">High Intent</SelectItem>
              <SelectItem value="brand">Brand</SelectItem>
              <SelectItem value="awareness">Awareness</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Keyword</TableHead>
                <TableHead className="text-muted-foreground">Category</TableHead>
                <TableHead
                  className="text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("monthly_search_volume")}
                >
                  <div className="flex items-center gap-1">
                    Search Volume
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("estimated_cpc")}
                >
                  <div className="flex items-center gap-1">
                    CPC
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("projected_monthly_conversions")}
                >
                  <div className="flex items-center gap-1">
                    Conversions
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("projected_monthly_revenue")}
                >
                  <div className="flex items-center gap-1">
                    Revenue
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("projected_roas")}
                >
                  <div className="flex items-center gap-1">
                    ROAS
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.map((item, index) => (
                <TableRow key={index} className="border-border hover:bg-muted/50">
                  <TableCell className="font-medium text-foreground max-w-xs">
                    <div className="truncate" title={item.keyword}>
                      {item.keyword}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(item.category)}>
                      {item.category?.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground">
                    {item.monthly_search_volume?.toLocaleString() || 0}
                  </TableCell>
                  <TableCell className="text-foreground">
                    ${item.estimated_cpc?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {item.projected_monthly_conversions?.toFixed(1) || "0.0"}
                  </TableCell>
                  <TableCell className="text-foreground">
                    ${item.projected_monthly_revenue?.toLocaleString() || "0"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {(item.projected_roas || 0) >= 3 ? (
                        <TrendingUp className="h-4 w-4 text-green-400" />
                      ) : (item.projected_roas || 0) >= 1 ? (
                        <TrendingUp className="h-4 w-4 text-yellow-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      )}
                      <span
                        className={
                          (item.projected_roas || 0) >= 3
                            ? "text-green-400"
                            : (item.projected_roas || 0) >= 1
                            ? "text-yellow-400"
                            : "text-red-400"
                        }
                      >
                        {item.projected_roas?.toFixed(2) || "0.00"}x
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
