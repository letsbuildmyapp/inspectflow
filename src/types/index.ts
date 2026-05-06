export type Role = 'admin' | 'inspector' | 'manager';

export interface UserDoc {
  uid: string;
  email: string;
  name: string;
  role: Role;
  createdAt: number;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  type: 'residential' | 'commercial' | 'mixed';
  yearBuilt: number;
  managerId: string;
  managerName: string;
  photoUrl?: string;
  unitCount: number;
  createdAt: number;
}

export interface Unit {
  id: string;
  propertyId: string;
  label: string; // "Unit 2B", "Suite 401"
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  tenant?: string;
  notes?: string;
  createdAt: number;
}

export type InspectionStatus = 'scheduled' | 'in_progress' | 'completed' | 'canceled';
export type ItemStatus = 'pending' | 'pass' | 'fail' | 'na';

export interface InspectionItem {
  id: string;
  category: string;     // e.g. "Kitchen", "Bathroom", "Exterior"
  label: string;        // e.g. "Sink fixtures operable"
  status: ItemStatus;
  notes?: string;
  photos: string[];     // dataURL or storage URL
  ticketCreated?: boolean;
  severity?: 'low' | 'medium' | 'high';
}

export interface Inspection {
  id: string;
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitLabel: string;
  inspectorId: string;
  inspectorName: string;
  status: InspectionStatus;
  scheduledFor: number;
  startedAt?: number;
  completedAt?: number;
  items: InspectionItem[];
  generalNotes?: string;
  aiSummary?: string;
  aiSummaryCachedAt?: number;
  reportUrl?: string;
  createdAt: number;
}

export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'resolved';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Ticket {
  id: string;
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitLabel: string;
  inspectionId?: string;
  inspectionItemId?: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId?: string;
  assigneeName?: string;
  photos: string[];
  createdBy: string;
  createdAt: number;
  resolvedAt?: number;
  resolutionNotes?: string;
}
