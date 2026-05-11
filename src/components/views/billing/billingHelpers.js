import { supabase } from '../../../lib/supabaseClient';

/**
 * Adds an array of customers to billing.
 * If a customer already has an 'Open' invoice (either as the main customer_id
 * or as part of an invoice_item), it appends a new item to that existing invoice.
 * Otherwise, it creates a new invoice for them.
 * 
 * @param {Array<Object>} customers - Array of customers (e.g. [{ id: '...', first_name: '...' }])
 * @returns {Promise<void>}
 */
export async function addCustomersToBilling(customers) {
  for (const cust of customers) {
    if (!cust || !cust.id) continue;
    
    let invoiceId = null;

    // 1. Check if there's an open invoice directly owned by the customer
    const { data: invData, error: invErr } = await supabase
      .from('invoices')
      .select('id')
      .eq('customer_id', cust.id)
      .eq('status', 'Open')
      .limit(1);

    if (invErr) {
      console.error('Error checking existing invoices:', invErr);
      throw invErr;
    }

    if (invData && invData.length > 0) {
      invoiceId = invData[0].id;
    } else {
      // 2. Check if the customer is part of any open invoice as an item
      // We query invoice_items for this customer and join invoices to filter by status='Open'
      const { data: itemData, error: itemErr } = await supabase
        .from('invoice_items')
        .select('invoice_id, invoices!inner(status)')
        .eq('customer_id', cust.id)
        .eq('invoices.status', 'Open')
        .limit(1);

      if (itemErr) {
        console.error('Error checking existing invoice items:', itemErr);
        throw itemErr;
      }

      if (itemData && itemData.length > 0) {
        invoiceId = itemData[0].invoice_id;
      }
    }

    // 3. If no existing open invoice is found, create a new one
    if (!invoiceId) {
      const { data: newInv, error: createInvErr } = await supabase
        .from('invoices')
        .insert({ customer_id: cust.id, status: 'Open' })
        .select()
        .single();
        
      if (createInvErr) {
        console.error('Error creating new invoice:', createInvErr);
        throw createInvErr;
      }
      invoiceId = newInv.id;
    }

    // 4. Create the new invoice item with NULL date
    const { error: createItemErr } = await supabase.from('invoice_items').insert({
      invoice_id: invoiceId,
      customer_id: cust.id,
      date: null, // Forces manual validation in the UI
      quantity: 1,
      unit_price_thb: 0,
      total_thb: 0,
      status: 'Pending'
    });

    if (createItemErr) {
      console.error('Error creating invoice item:', createItemErr);
      throw createItemErr;
    }
  }
}
