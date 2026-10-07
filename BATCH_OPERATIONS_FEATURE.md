# Batch Operations Feature

## Overview
New batch operations workflow that allows users to:
1. Select multiple companies
2. View all directors from those companies
3. Select specific directors
4. Export director details to Excel
5. Mark directors as contacted

## Backend Endpoints

### File: `backend/src/routes/batch.py`

**GET /api/batch/companies/selected**
- Get details of selected companies by CINs
- Query param: `cins` (comma-separated list)

**GET /api/batch/directors/by-companies**
- Get all directors for selected companies
- Query param: `cins` (comma-separated list)
- Returns directors with company names and contact info

**GET /api/batch/directors/selected**
- Get detailed info for selected directors by DINs
- Query param: `dins` (comma-separated list)
- Includes all mobile numbers (1-5), emails (1-3), and company details

**POST /api/batch/directors/mark-contacted**
- Mark selected directors as contacted
- Body: `{ "dins": ["din1", "din2", ...] }`
- Updates `contacted` field to `true`

**GET /api/batch/directors/export-selected**
- Export selected directors to Excel file
- Query param: `dins` (comma-separated list)
- Returns `.xlsx` file with complete director and company information
- Includes: DIN, Name, Designation, Date Joined, All Mobile Numbers, All Emails, Contacted Status, Company Details, City, State, Capitals

## Frontend Pages

### 1. Batch Operations Home (`/batch`)
- **File**: `frontend/src/app/batch/page.tsx`
- Overview of 3-step workflow
- Links to each step with visual cards

### 2. Select Companies (`/batch/select-companies`)
- **File**: `frontend/src/app/batch/select-companies/page.tsx`
- Features:
  - Search companies by name/CIN
  - Filter by state
  - Select/deselect companies with checkboxes
  - Select all on current page
  - Pagination
  - Selection persists in localStorage
  - Shows count of selected companies
  - "View Directors" button to proceed

### 3. Select Directors (`/batch/select-directors`)
- **File**: `frontend/src/app/batch/select-directors/page.tsx`
- Features:
  - Displays all directors from selected companies
  - Shows company name, designation, phone, email, contacted status
  - Select/deselect directors with checkboxes
  - Select all / clear all buttons
  - Action buttons:
    - **Mark as Contacted**: Updates database to mark selected directors
    - **Export to Excel**: Downloads .xlsx file with all director details
  - Selection persists in localStorage
  - Visual indicators for contacted/not contacted status

### 4. Dashboard Integration
- **File**: `frontend/src/app/page.tsx`
- Added "Batch Operations" card with "NEW" badge
- Links to `/batch` workflow

## Workflow

1. **User starts at** `/batch`
   - Sees overview of 3-step process

2. **Step 1**: User navigates to `/batch/select-companies`
   - Searches/filters companies
   - Selects companies of interest
   - Selections saved in localStorage
   - Clicks "View Directors" button

3. **Step 2**: Redirected to `/batch/select-directors?cins=...`
   - Backend fetches all directors for selected company CINs
   - User reviews directors list
   - Selects specific directors for export
   - Options:
     - **Export to Excel**: Downloads complete details
     - **Mark as Contacted**: Updates database

4. **Export includes**:
   - All director personal info (DIN, Name, Designation, Date Joined)
   - All 5 mobile number fields
   - All 3 email fields
   - Contacted status
   - Company details (Name, CIN, City, State, Email, Capitals)
   - Formatted Excel with headers, colors, and auto-sized columns

## Technical Details

### Dependencies Added
- `lucide-react`: Icon library for UI components
- Existing: `pandas`, `xlsxwriter` for Excel export

### Database Updates
- Uses existing `director_det.contacted` boolean field
- Updates via SQL: `UPDATE director_det SET contacted = true WHERE din IN (...)`

### State Management
- Uses browser `localStorage` to persist selections across page navigation
- Keys:
  - `selectedCompanyCins`: Array of selected company CINs
  - `selectedDirectorDins`: Array of selected director DINs

### API Authentication
- All batch endpoints require `X-API-Key: dev-key-12345` header
- Protected by existing `require_api_key` middleware

## Features

✅ **Multi-select with checkboxes** - Select individual items or all on page
✅ **Persistent selections** - Selections survive page navigation
✅ **Real-time count** - Shows how many items selected
✅ **Bulk actions** - Mark multiple directors as contacted at once
✅ **Excel export** - Download complete details in formatted spreadsheet
✅ **Visual feedback** - Highlighted rows for selected items
✅ **Status indicators** - Badge showing contacted/not contacted
✅ **Responsive design** - Works on all screen sizes
✅ **Dark mode support** - Full dark theme support

## Usage Example

1. User wants to contact directors from tech companies in Maharashtra
2. Goes to Batch Operations → Select Companies
3. Filters by state "Maharashtra", searches for tech-related names
4. Selects 10 companies
5. Clicks "View Directors" → sees 50 directors from those 10 companies
6. Selects 20 directors who match their criteria
7. Clicks "Export to Excel" → downloads `selected_directors.xlsx`
8. After contacting them, comes back and clicks "Mark as Contacted"
9. Database updated, can filter out contacted directors in future queries

## Non-Breaking Changes

✅ All existing screens remain unchanged
✅ No modifications to existing routes
✅ New endpoints in separate `batch.py` file
✅ No database schema changes (uses existing `contacted` field)
✅ Completely new UI paths under `/batch/*`
