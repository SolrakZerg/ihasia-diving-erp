# GLOBAL iHasia App Standards

## Project Identity
- **Project Name**: Diving Center ERP (Antigravity)
- **Supabase Project ID**: `mowoxxyusicasgxouhxv` (MANDATORY for all DB operations)
- **Region**: ap-southeast-1

## Technical Principles
1. **Atomic Grouping**: Always use the custom bulk selection handler (`onSelectItems`) for grouped records to avoid React state batching issues.
2. **Granular Selection**: Billing uses item-level selection via `selectedItemIds` (Set).
3. **Optimistic UI**: Use local state updates (`setInvoices`) before DB calls to ensure a "snappy" feel.
4. **Safety Filters**: Always filter `itemIds` for valid UUID strings before performing `DELETE` or `UPDATE` operations in Supabase.
