import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Phone, 
  Mail, 
  Building2, 
  MapPin, 
  MoreVertical,
  Edit,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  location?: string;
  status?: string;
  lastContact?: string;
}

interface MobileContactCardProps {
  contact: Contact;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  onCall?: (contact: Contact) => void;
  onEmail?: (contact: Contact) => void;
}

export default function MobileContactCard({
  contact,
  onEdit,
  onDelete,
  onCall,
  onEmail
}: MobileContactCardProps) {
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'prospect': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              {getInitials(contact.name)}
            </AvatarFallback>
          </Avatar>

          {/* Contact Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {contact.name}
                </h3>
                {contact.position && contact.company && (
                  <p className="text-xs text-gray-600 truncate">
                    {contact.position} at {contact.company}
                  </p>
                )}
              </div>
              
              {/* Status Badge */}
              {contact.status && (
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getStatusColor(contact.status)} ml-2`}
                >
                  {contact.status}
                </Badge>
              )}
            </div>

            {/* Contact Details */}
            <div className="mt-2 space-y-1">
              {contact.email && (
                <div className="flex items-center space-x-1">
                  <Mail className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-600 truncate">{contact.email}</span>
                </div>
              )}
              
              {contact.phone && (
                <div className="flex items-center space-x-1">
                  <Phone className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-600">{contact.phone}</span>
                </div>
              )}
              
              {contact.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-600 truncate">{contact.location}</span>
                </div>
              )}
            </div>

            {/* Last Contact */}
            {contact.lastContact && (
              <p className="text-xs text-gray-500 mt-2">
                Last contact: {contact.lastContact}
              </p>
            )}
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(contact)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onCall && contact.phone && (
                <DropdownMenuItem onClick={() => onCall(contact)}>
                  <Phone className="mr-2 h-4 w-4" />
                  Call
                </DropdownMenuItem>
              )}
              {onEmail && contact.email && (
                <DropdownMenuItem onClick={() => onEmail(contact)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(contact)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-2 mt-3">
          {onCall && contact.phone && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onCall(contact)}
            >
              <Phone className="h-3 w-3 mr-1" />
              Call
            </Button>
          )}
          
          {onEmail && contact.email && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onEmail(contact)}
            >
              <Mail className="h-3 w-3 mr-1" />
              Email
            </Button>
          )}
          
          {onEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onEdit(contact)}
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}