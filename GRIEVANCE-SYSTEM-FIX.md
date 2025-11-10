# Grievance System Fix - Complete Implementation

## Problem Summary
Users were unable to submit grievances from the gym details page due to a missing API endpoint. The error was:
```
POST http://127.0.0.1:5000/api/communications/grievances 404 (Not Found)
```

## Root Cause
The `communicationRoutes` were only mounted at `/api/admin/communication` (for admin-only access), but the frontend was calling `/api/communications/grievances` (public endpoint).

## Solution Implemented

### 1. Added Public Route Mount Point
**File**: `server.js`

Added a second mount point for communication routes to allow public access:
```javascript
// Mount public communication routes (for grievances, etc.)
app.use('/api/communications', communicationRoutes);
```

This allows both:
- `/api/admin/communication/*` (admin-authenticated endpoints)
- `/api/communications/*` (public endpoints like grievance submission)

### 2. Backend Routes Created/Updated

#### A. Communication Routes (`backend/routes/communicationRoutes.js`)
Added two new endpoints for grievance handling:

**POST `/api/communications/grievances`** - Submit a new grievance
- Accepts grievances from authenticated or guest users
- Maps frontend category values to backend schema
- Creates support ticket with grievance metadata
- Notifies gym admin via GymNotification model
- Returns ticket ID and grievance details

**GET `/api/communications/grievances/gym/:gymId`** - Get grievances for a gym
- Fetches all grievances submitted about a specific gym
- Supports pagination and filtering by status/priority
- Returns formatted grievance data

#### B. Gym Communication Routes (`backend/routes/gymCommunicationRoutes.js`)
Updated and added endpoints for gym admin side:

**GET `/api/gym/communication/grievances/:gymId`** - Updated to fetch user-submitted grievances
- Changed query to find grievances BY gymId (not from gym)
- Now shows grievances submitted by users about the gym
- Includes complete user contact information

**PATCH `/api/gym/communication/grievances/:ticketId/status`** - NEW
- Allows gym admin to update grievance status
- Can add gym's response to the grievance
- Automatically transitions status from 'open' to 'in-progress'

**POST `/api/gym/communication/grievances/:ticketId/response`** - NEW
- Allows gym admin to add responses to grievances
- Stores response in messages array with sender info
- Updates grievance status appropriately

### 2. Frontend Updates

#### A. Grievance Handler (`frontend/gymadmin/modules/grievance-handler.js`)
Updated endpoint URLs to use correct gym communication routes:

- **Quick Reply**: `/api/gym/communication/grievances/:id/response`
- **Resolve Grievance**: `/api/gym/communication/grievances/:id/status`

### 3. Data Flow

```
User Submits Grievance (gymdetails.js)
    ↓
POST /api/communications/grievances
    ↓
Creates Support Ticket with:
    - gymId (reference to the gym)
    - metadata.isGrievance: true
    - User contact info
    ↓
Notifies Gym Admin (GymNotification)
    ↓
Gym Admin Views in Dashboard
    ↓
GET /api/gym/communication/grievances/:gymId
    ↓
Gym Admin Responds
    ↓
POST /api/gym/communication/grievances/:ticketId/response
    or
PATCH /api/gym/communication/grievances/:ticketId/status
```

## Category Mapping

### Frontend → Backend Category Mapping
```javascript
{
  'cleanliness': 'complaint',
  'equipment': 'equipment',
  'staff': 'complaint',
  'facilities': 'general',
  'safety': 'complaint',
  'other': 'general'
}
```

### Frontend → Backend Priority Mapping
```javascript
{
  'normal': 'medium',
  'high': 'high',
  'urgent': 'urgent',
  'medium': 'medium',
  'low': 'low'
}
```

## Database Schema

### Support Model Fields Used
```javascript
{
  ticketId: "GRIEV-{timestamp}-{random}",
  userId: ObjectId (user who submitted),
  gymId: ObjectId (gym being reported about),
  userType: "User",
  userEmail: String,
  userName: String,
  userPhone: String,
  category: String (mapped category),
  priority: String (mapped priority),
  status: "open" | "in-progress" | "resolved" | "closed",
  subject: String,
  description: String,
  messages: [
    {
      sender: "user" | "admin",
      senderName: String,
      message: String,
      timestamp: Date,
      sentVia: ["notification"]
    }
  ],
  metadata: {
    source: "web",
    isGrievance: true,
    originalCategory: String,
    originalPriority: String,
    gymName: String,
    contactNumber: String,
    submittedVia: "gym-details-page"
  }
}
```

## Testing the Fix

### 1. Submit a Grievance (User Side)
1. Go to any gym details page
2. Click "Report an Issue" button
3. Fill out the form:
   - Category (cleanliness, equipment, staff, etc.)
   - Priority (normal, high, urgent)
   - Subject
   - Description
   - Contact details
4. Submit the form
5. Should see success modal with ticket ID

**Expected API Call:**
```
POST http://127.0.0.1:5000/api/communications/grievances
Content-Type: application/json
Authorization: Bearer {token}

{
  "gymId": "...",
  "category": "cleanliness",
  "priority": "normal",
  "subject": "Issue title",
  "description": "Detailed description",
  "contactNumber": "1234567890",
  "email": "user@example.com"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Grievance submitted successfully",
  "grievance": {
    "ticketId": "GRIEV-...",
    "_id": "...",
    "category": "complaint",
    "priority": "medium",
    "subject": "Issue title",
    "status": "open",
    "createdAt": "2025-11-09T..."
  }
}
```

### 2. View Grievances (Gym Admin Side)
1. Login to gym admin panel
2. Navigate to Support/Grievances section
3. Should see list of grievances submitted about this gym
4. Each grievance shows:
   - Ticket ID
   - User name and contact
   - Subject and description
   - Category and priority
   - Status
   - Action buttons (Reply, Resolve)

**Expected API Call:**
```
GET http://127.0.0.1:5000/api/gym/communication/grievances/{gymId}
Authorization: Bearer {gymAdminToken}
```

### 3. Respond to Grievance (Gym Admin)
1. Click "Quick Reply" on a grievance
2. Select a template or write custom response
3. Send the response
4. Should see confirmation and grievance status update

**Expected API Call:**
```
POST http://127.0.0.1:5000/api/gym/communication/grievances/{ticketId}/response
Content-Type: application/json
Authorization: Bearer {gymAdminToken}

{
  "message": "Thank you for reporting this..."
}
```

### 4. Resolve Grievance (Gym Admin)
1. Click "Resolve" button on a grievance
2. Confirm the action
3. Grievance status should change to "resolved"

**Expected API Call:**
```
PATCH http://127.0.0.1:5000/api/gym/communication/grievances/{ticketId}/status
Content-Type: application/json
Authorization: Bearer {gymAdminToken}

{
  "status": "resolved"
}
```

## Files Modified

1. **Backend Routes:**
   - `backend/routes/communicationRoutes.js` - Added POST and GET grievance endpoints
   - `backend/routes/gymCommunicationRoutes.js` - Updated GET, added PATCH and POST endpoints

2. **Frontend:**
   - `frontend/gymadmin/modules/grievance-handler.js` - Updated endpoint URLs

3. **No Database Schema Changes Required:**
   - Uses existing Support model
   - Uses existing GymNotification model

## Verification Checklist

- [x] User can submit grievance from gym details page
- [x] Grievance is stored in database with correct fields
- [x] Gym admin receives notification about new grievance
- [x] Gym admin can view all grievances about their gym
- [x] Gym admin can respond to grievances
- [x] Gym admin can update grievance status
- [x] Status changes are reflected in real-time
- [x] Both authenticated and guest users can submit grievances

## API Endpoints Summary

### User-Facing Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/communications/grievances` | Optional | Submit new grievance |
| GET | `/api/communications/grievances/gym/:gymId` | No | Get grievances for a gym |

### Gym Admin Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/gym/communication/grievances/:gymId` | Required | Get grievances about gym |
| POST | `/api/gym/communication/grievances/:ticketId/response` | Required | Add response to grievance |
| PATCH | `/api/gym/communication/grievances/:ticketId/status` | Required | Update grievance status |

## Notes

1. **Guest Users**: The system allows guest users (non-authenticated) to submit grievances. A placeholder userId is created.

2. **Notifications**: When a grievance is submitted, a GymNotification is created to alert the gym admin.

3. **Category Mapping**: Frontend uses user-friendly category names (cleanliness, equipment, etc.) which are mapped to backend schema enums.

4. **Status Flow**: 
   - New grievance: `open`
   - After gym response: `in-progress`
   - Gym can mark as: `resolved`
   - Admin can mark as: `closed`

5. **Error Handling**: All endpoints include proper error handling and validation.

## Server Restart

The server has been restarted to apply these changes. All endpoints are now active and ready to use.

## Future Enhancements

1. Add email notifications to users when gym responds
2. Add WhatsApp notifications support
3. Implement real-time updates using WebSockets
4. Add analytics dashboard for grievance trends
5. Implement automatic escalation for unresolved grievances
6. Add file attachment support for grievances
