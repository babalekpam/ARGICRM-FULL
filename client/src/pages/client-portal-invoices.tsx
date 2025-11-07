import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function ClientPortalInvoices() {
  const { toast } = useToast();

  const { data: invoices, isLoading } = useQuery<any[]>({
    queryKey: ['/api/client-portal/invoices'],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'overdue':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handlePay = async (invoiceId: number) => {
    try {
      const response = await fetch(`/api/client-portal/invoices/${invoiceId}/pay`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Payment initiation failed');
      }

      const data = await response.json();

      toast({
        title: 'Payment processing',
        description: data.message || 'Redirecting to payment...',
      });
    } catch (error) {
      toast({
        title: 'Payment failed',
        description: 'Could not initiate payment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-invoices">Invoices</h1>
        <p className="text-muted-foreground">View and manage your invoices</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices?.map((invoice: any) => (
                  <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                    <TableCell className="font-medium" data-testid={`text-number-${invoice.id}`}>
                      #{invoice.invoiceNumber || invoice.id}
                    </TableCell>
                    <TableCell data-testid={`text-date-${invoice.id}`}>
                      {invoice.issueDate
                        ? format(new Date(invoice.issueDate), 'MMM d, yyyy')
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="font-semibold" data-testid={`text-amount-${invoice.id}`}>
                      ${invoice.total?.toLocaleString() || '0.00'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${getStatusColor(invoice.status)} text-white`}
                        data-testid={`badge-status-${invoice.id}`}
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-due-date-${invoice.id}`}>
                      {invoice.dueDate
                        ? format(new Date(invoice.dueDate), 'MMM d, yyyy')
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`button-view-${invoice.id}`}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        {invoice.status !== 'paid' && (
                          <Button
                            size="sm"
                            onClick={() => handlePay(invoice.id)}
                            data-testid={`button-pay-${invoice.id}`}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pay
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`button-download-${invoice.id}`}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          PDF
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {(!invoices || invoices.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center" data-testid="text-no-invoices">
                      <div className="text-muted-foreground">
                        No invoices found
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
