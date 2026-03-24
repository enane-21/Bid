# E-Bid Processing System Database Schema

## Collections

### Users
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: 'administrator', 'scientific_director', 'purchasing_team', 'supplier', 'store_keeper', 'finance', 'user'),
  phone: String,
  address: String,
  isVerified: Boolean,
  createdAt: Date
}
```

### Requisitions
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  category: String,
  estimatedBudget: Number,
  requestedBy: ObjectId (ref: User),
  status: String (enum: 'pending', 'approved', 'rejected', 'arranged'),
  approvedBy: ObjectId (ref: User),
  arrangedBy: ObjectId (ref: User),
  approvalDate: Date,
  rejectionReason: String,
  createdAt: Date
}
```

### TenderFiles
```javascript
{
  _id: ObjectId,
  requisition: ObjectId (ref: Requisition),
  title: String,
  description: String,
  documents: [{filename, path, uploadedAt}],
  startDate: Date,
  endDate: Date,
  status: String (enum: 'active', 'closed', 'disabled', 'evaluated'),
  uploadedBy: ObjectId (ref: User),
  disabledBy: ObjectId (ref: User),
  createdAt: Date
}
```

### Bids
```javascript
{
  _id: ObjectId,
  tenderFile: ObjectId (ref: TenderFile),
  supplier: ObjectId (ref: User),
  proposedPrice: Number,
  documents: [{filename, path, uploadedAt}],
  technicalSpecifications: String,
  deliveryTime: String,
  status: String (enum: 'submitted', 'under_evaluation', 'approved', 'rejected', 'winner'),
  evaluationScore: Number,
  evaluatedBy: ObjectId (ref: User),
  evaluationNotes: String,
  timestamp: Date
}
```

### Messages
```javascript
{
  _id: ObjectId,
  sender: ObjectId (ref: User),
  recipient: ObjectId (ref: User),
  subject: String,
  content: String,
  relatedTo: String (enum: 'requisition', 'tender', 'bid', 'general'),
  relatedId: ObjectId,
  isRead: Boolean,
  createdAt: Date
}
```

### Budgets
```javascript
{
  _id: ObjectId,
  department: String,
  fiscalYear: String,
  totalBudget: Number,
  allocatedBudget: Number,
  remainingBudget: Number,
  managedBy: ObjectId (ref: User),
  createdAt: Date
}
```

## Relationships

- One User can create many Requisitions
- One Requisition can have one TenderFile
- One TenderFile can have many Bids
- One User (supplier) can submit many Bids
- Users can send/receive many Messages
- One User (finance) can manage many Budgets
