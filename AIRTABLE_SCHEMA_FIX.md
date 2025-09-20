# Airtable Schema Fix

## Problem
The Airtable API is rejecting requests with "Unknown field name: 'time'" error, indicating a schema mismatch.

## Solution Applied
I've updated the service to use more common Airtable field naming conventions:

### New Field Mapping
- `title` → `Title`
- `description` → `Description`  
- `date` + `time` → `Date` (combined datetime field)
- `location` → `Location`
- `capacity` → `Capacity`
- `organizer_id` → `Organizer ID`

## Next Steps

### 1. Test the Connection
Open the browser console and run:
```javascript
await window.airtableDebug.debugConnection()
```
This will show you the actual field structure in your Airtable base.

### 2. Test Different Field Combinations
If the above doesn't work, try:
```javascript
await window.airtableDebug.testFieldCombinations()
```
This will test multiple field name patterns to find what works.

### 3. Based on Results
- If you see the actual field names, I can update the service to match exactly
- If one of the test combinations works, we'll know which pattern to use

## Current Approach
The service now:
- Uses capitalized field names (Title, Description, etc.)
- Combines date and time into a single Date field with ISO datetime format
- Handles the transformation back to separate date/time for the frontend

## Debug Commands Available
```javascript
// Check connection and see actual fields
await window.airtableDebug.debugConnection()

// Test different field name patterns  
await window.airtableDebug.testFieldCombinations()

// Test event creation with current schema
await window.airtableDebug.testSchema()

// List existing events
await window.airtableDebug.listEvents()
```

Try creating an event again, and if it still fails, run the debug commands to see what the actual Airtable schema expects!