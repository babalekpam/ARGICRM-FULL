import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function ClientPortalDeliverables() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');

  const { data: deliverables, isLoading: deliverablesLoading } = useQuery<any[]>({
    queryKey: ['/api/client-portal/deliverables'],
  });

  const { data: projects } = useQuery<any[]>({
    queryKey: ['/api/client-portal/projects'],
  });

  const filteredDeliverables = deliverables?.filter((deliverable: any) => {
    const matchesSearch = deliverable.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = projectFilter === 'all' || deliverable.projectId === projectFilter;
    return matchesSearch && matchesProject;
  });

  const handleDownload = async (deliverable: any) => {
    try {
      const response = await fetch(`/api/client-portal/deliverables/${deliverable.id}/download`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const data = await response.json();
      window.open(data.downloadUrl, '_blank');

      toast({
        title: 'Download started',
        description: `Downloading ${deliverable.title}`,
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Could not download the file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-deliverables">Deliverables</h1>
        <p className="text-muted-foreground">Access and download your project files</p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search deliverables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-deliverables"
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-project-filter">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects?.map((project: any) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {deliverablesLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeliverables?.map((deliverable: any) => {
                  const project = projects?.find((p: any) => p.id === deliverable.projectId);

                  return (
                    <TableRow key={deliverable.id} data-testid={`row-deliverable-${deliverable.id}`}>
                      <TableCell className="font-medium" data-testid={`text-title-${deliverable.id}`}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {deliverable.title}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-project-${deliverable.id}`}>
                        {project?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" data-testid={`badge-type-${deliverable.id}`}>
                          {deliverable.fileType || 'File'}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-size-${deliverable.id}`}>
                        {formatFileSize(deliverable.fileSize)}
                      </TableCell>
                      <TableCell data-testid={`text-date-${deliverable.id}`}>
                        {deliverable.createdAt
                          ? format(new Date(deliverable.createdAt), 'MMM d, yyyy')
                          : 'N/A'}
                      </TableCell>
                      <TableCell data-testid={`text-downloads-${deliverable.id}`}>
                        {deliverable.downloadCount || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleDownload(deliverable)}
                          data-testid={`button-download-${deliverable.id}`}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {(!filteredDeliverables || filteredDeliverables.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center" data-testid="text-no-deliverables">
                      <div className="text-muted-foreground">
                        No deliverables found
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
