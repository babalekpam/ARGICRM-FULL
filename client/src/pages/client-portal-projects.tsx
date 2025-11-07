import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function ClientPortalProjects() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: projects, isLoading } = useQuery<any[]>({
    queryKey: ['/api/client-portal/projects'],
  });

  const filteredProjects = projects?.filter((project: any) => {
    const matchesSearch = project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'on_hold':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-projects">Projects</h1>
        <p className="text-muted-foreground">View and track all your projects</p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-projects"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects?.map((project: any) => (
            <Card key={project.id} className="hover-elevate" data-testid={`card-project-${project.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg" data-testid={`text-project-name-${project.id}`}>
                    {project.name}
                  </CardTitle>
                  <Badge
                    className={`${getStatusColor(project.status)} text-white`}
                    data-testid={`badge-status-${project.id}`}
                  >
                    {project.status}
                  </Badge>
                </div>
                <CardDescription data-testid={`text-project-description-${project.id}`}>
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {project.startDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span data-testid={`text-start-date-${project.id}`}>
                      Started: {format(new Date(project.startDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                {project.progress !== undefined && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium" data-testid={`text-progress-${project.id}`}>
                        {project.progress}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                <Button variant="outline" className="w-full mt-4" data-testid={`button-view-${project.id}`}>
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}

          {(!filteredProjects || filteredProjects.length === 0) && (
            <div className="col-span-full text-center py-12" data-testid="text-no-projects">
              <p className="text-muted-foreground">No projects found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
