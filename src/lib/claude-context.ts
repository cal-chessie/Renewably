// ============================================================================
// RENEWABLY.IE — CRM CONTEXT FETCHER FOR CLAUDE
// ============================================================================
// Fetches relevant CRM data from Supabase to provide Claude with
// real-time context about contacts, deals, tasks, and companies.
// ============================================================================

import { supabase } from '@/lib/supabase';
import type { CrmContext, ClaudeRequest } from '@/lib/claude';

/** Helper: safely parse a JSON field that might be a string or already an object */
function parseJsonField<T>(field: unknown): T | null {
  if (field === null || field === undefined) return null;
  if (typeof field === 'string') {
    try { return JSON.parse(field) as T; } catch { return null; }
  }
  return field as T;
}

/**
 * Fetch CRM context data based on the provided context IDs.
 * Returns partial data even if some fetches fail — graceful degradation.
 */
export async function fetchCrmContext(
  context: ClaudeRequest['context']
): Promise<CrmContext> {
  const result: CrmContext = {};
  const promises: Promise<void>[] = [];

  if (context?.contactId) {
    promises.push(
      (async () => {
        try {
          const { data: contact } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', context.contactId)
            .single();

          if (contact) {
            // Fetch company
            let companyData: { id: string; name: string } | null = null;
            if (contact.company_id) {
              const { data: company } = await supabase
                .from('companies')
                .select('id, name')
                .eq('id', contact.company_id)
                .single();
              if (company) companyData = company as { id: string; name: string };
            }

            // Fetch recent deal activities for this contact's company
            let activities: { type: string; title: string; created_at: string }[] = [];
            if (contact.company_id) {
              const { data: deals } = await supabase
                .from('deals')
                .select('id')
                .eq('company_id', contact.company_id)
                .limit(5);
              if (deals && deals.length > 0) {
                const dealIds = deals.map(d => d.id);
                const { data: acts } = await supabase
                  .from('deal_activities')
                  .select('type, title, created_at')
                  .in('deal_id', dealIds)
                  .order('created_at', { ascending: false })
                  .limit(5);
                if (acts) activities = acts;
              }
            }

            // Fetch open deals
            let openDeals: { id: string; product: string; value: number; stage: string }[] = [];
            if (contact.company_id) {
              const { data: deals } = await supabase
                .from('deals')
                .select('id, product, value, stage')
                .eq('company_id', contact.company_id)
                .neq('stage', 'closed_won')
                .neq('stage', 'closed_lost')
                .order('created_at', { ascending: false })
                .limit(3);
              if (deals) openDeals = deals;
            }

            result.contact = {
              id: contact.id,
              firstName: contact.name?.split(' ')[0] || '',
              lastName: contact.name?.split(' ').slice(1).join(' ') || '',
              email: contact.email || '',
              phone: contact.phone || '',
              jobTitle: contact.role || '',
              status: contact.status || '',
              source: contact.source || '',
              company: companyData ? {
                id: companyData.id,
                name: companyData.name,
                industry: '',
              } : undefined,
              recentActivities: activities.map(a => ({
                type: a.type,
                subject: a.title,
                createdAt: a.created_at,
              })),
              openDeals: openDeals.map(d => ({
                id: d.id,
                title: d.product,
                value: Number(d.value || 0),
                probability: d.stage === 'closed_won' ? 100 : d.stage === 'negotiation' ? 75 : 50,
                stageName: d.stage,
              })),
            };
          }
        } catch (err) {
          console.warn('[Claude Context] Failed to fetch contact:', err instanceof Error ? err.message : err);
        }
      })()
    );
  }

  if (context?.dealId) {
    promises.push(
      (async () => {
        try {
          const { data: deal } = await supabase
            .from('deals')
            .select('*')
            .eq('id', context.dealId)
            .single();

          if (deal) {
            // Fetch company
            let companyData: { id: string; name: string } | null = null;
            if (deal.company_id) {
              const { data: company } = await supabase
                .from('companies')
                .select('id, name')
                .eq('id', deal.company_id)
                .single();
              if (company) companyData = company as { id: string; name: string };
            }

            // Fetch contacts for this company
            let contactData: { id: string; name: string; email: string } | null = null;
            if (deal.company_id) {
              const { data: contacts } = await supabase
                .from('contacts')
                .select('id, name, email')
                .eq('company_id', deal.company_id)
                .limit(1);
              if (contacts && contacts.length > 0) contactData = contacts[0] as { id: string; name: string; email: string };
            }

            // Fetch recent activities
            const { data: activities } = await supabase
              .from('deal_activities')
              .select('type, title, created_at')
              .eq('deal_id', deal.id)
              .order('created_at', { ascending: false })
              .limit(5);

            result.deal = {
              id: deal.id,
              title: deal.product || '',
              value: Number(deal.value || deal.mrr || 0),
              currency: 'EUR',
              probability: deal.stage === 'closed_won' ? 100 : deal.stage === 'negotiation' ? 75 : deal.stage === 'proposal_sent' ? 50 : 25,
              closeDate: deal.updated_at || null,
              description: deal.notes || '',
              stageName: deal.stage,
              contact: contactData ? {
                id: contactData.id,
                firstName: contactData.name?.split(' ')[0] || '',
                lastName: contactData.name?.split(' ').slice(1).join(' ') || '',
                email: contactData.email || '',
              } : undefined,
              company: companyData ? {
                id: companyData.id,
                name: companyData.name,
              } : undefined,
              recentActivities: (activities || []).map(a => ({
                type: a.type,
                subject: a.title,
                createdAt: a.created_at,
              })),
            };
          }
        } catch (err) {
          console.warn('[Claude Context] Failed to fetch deal:', err instanceof Error ? err.message : err);
        }
      })()
    );
  }

  if (context?.taskId) {
    promises.push(
      (async () => {
        try {
          const { data: task } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', context.taskId)
            .single();

          if (task) {
            result.task = {
              id: task.id,
              title: task.title || '',
              priority: task.priority || 'medium',
              status: task.status || 'pending',
              dueDate: task.due_date || null,
              description: task.description || '',
              assigneeName: 'Unassigned',
            };
          }
        } catch (err) {
          console.warn('[Claude Context] Failed to fetch task:', err instanceof Error ? err.message : err);
        }
      })()
    );
  }

  if (context?.companyId) {
    promises.push(
      (async () => {
        try {
          const { data: company } = await supabase
            .from('companies')
            .select('*')
            .eq('id', context.companyId)
            .single();

          if (company) {
            // Fetch contacts
            const { data: contacts } = await supabase
              .from('contacts')
              .select('id, name, status')
              .eq('company_id', company.id)
              .order('created_at', { ascending: false })
              .limit(3);

            // Fetch deals
            const { data: deals } = await supabase
              .from('deals')
              .select('id, product, value, stage')
              .eq('company_id', company.id)
              .order('created_at', { ascending: false })
              .limit(3);

            result.company = {
              id: company.id,
              name: company.name,
              industry: '',
              website: company.website || '',
              employeeCount: company.team_size || 0,
              annualRevenue: null,
              notes: company.notes || undefined,
            };
          }
        } catch (err) {
          console.warn('[Claude Context] Failed to fetch company:', err instanceof Error ? err.message : err);
        }
      })()
    );
  }

  await Promise.all(promises);
  return result;
}
