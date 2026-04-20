// ============================================================================
// RENEWABLY.IE — CRM CONTEXT FETCHER FOR CLAUDE
// ============================================================================
// Fetches relevant CRM data from the database to provide Claude with
// real-time context about contacts, deals, tasks, and companies.
// ============================================================================

import { db } from '@/lib/db';
import type { CrmContext, ClaudeRequest } from '@/lib/claude';

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
      db.contact
        .findUnique({
          where: { id: context.contactId },
          include: {
            company: { select: { id: true, name: true, industry: true } },
            activities: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              select: { type: true, subject: true, createdAt: true, status: true },
            },
            deals: {
              take: 3,
              orderBy: { updatedAt: 'desc' },
              where: { stage: { name: { not: 'Closed Won' } } },
              select: {
                id: true,
                title: true,
                value: true,
                probability: true,
                stage: { select: { name: true } },
              },
            },
          },
        })
        .then((contact) => {
          if (contact) {
            result.contact = {
              id: contact.id,
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email,
              phone: contact.phone,
              jobTitle: contact.jobTitle,
              status: contact.status,
              source: contact.source,
              company: contact.company ? {
                id: contact.company.id,
                name: contact.company.name,
                industry: contact.company.industry,
              } : undefined,
              recentActivities: contact.activities.map(a => ({
                type: a.type,
                subject: a.subject,
                createdAt: a.createdAt.toISOString(),
              })),
              openDeals: contact.deals.map(d => ({
                id: d.id,
                title: d.title,
                value: Number(d.value),
                probability: d.probability,
                stageName: d.stage.name,
              })),
            };
          }
        })
        .catch((err) => {
          console.warn('[Claude Context] Failed to fetch contact:', err instanceof Error ? err.message : err);
        })
    );
  }

  if (context?.dealId) {
    promises.push(
      db.deal
        .findUnique({
          where: { id: context.dealId },
          include: {
            stage: { select: { name: true, order: true } },
            contact: { select: { id: true, firstName: true, lastName: true, email: true, status: true } },
            company: { select: { id: true, name: true } },
            activities: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              select: { type: true, subject: true, createdAt: true },
            },
          },
        })
        .then((deal) => {
          if (deal) {
            result.deal = {
              id: deal.id,
              title: deal.title,
              value: Number(deal.value),
              currency: deal.currency || 'EUR',
              probability: deal.probability,
              closeDate: deal.closeDate?.toISOString() || null,
              description: deal.description,
              stageName: deal.stage.name,
              contact: deal.contact ? {
                id: deal.contact.id,
                firstName: deal.contact.firstName,
                lastName: deal.contact.lastName,
                email: deal.contact.email,
              } : undefined,
              company: deal.company ? {
                id: deal.company.id,
                name: deal.company.name,
              } : undefined,
              recentActivities: deal.activities.map(a => ({
                type: a.type,
                subject: a.subject,
                createdAt: a.createdAt.toISOString(),
              })),
            };
          }
        })
        .catch((err) => {
          console.warn('[Claude Context] Failed to fetch deal:', err instanceof Error ? err.message : err);
        })
    );
  }

  if (context?.taskId) {
    promises.push(
      db.task
        .findUnique({
          where: { id: context.taskId },
          include: {
            contact: { select: { id: true, firstName: true, lastName: true } },
            deal: { select: { id: true, title: true } },
            assignee: { select: { id: true, name: true } },
          },
        })
        .then((task) => {
          if (task) {
            result.task = {
              id: task.id,
              title: task.title,
              priority: task.priority,
              status: task.status,
              dueDate: task.dueDate?.toISOString() || null,
              description: task.description,
              assigneeName: task.assignee?.name || 'Unassigned',
            };
          }
        })
        .catch((err) => {
          console.warn('[Claude Context] Failed to fetch task:', err instanceof Error ? err.message : err);
        })
    );
  }

  if (context?.companyId) {
    promises.push(
      db.company
        .findUnique({
          where: { id: context.companyId },
          include: {
            contacts: {
              take: 3,
              orderBy: { createdAt: 'desc' },
              select: { id: true, firstName: true, lastName: true, status: true },
            },
            deals: {
              take: 3,
              orderBy: { updatedAt: 'desc' },
              select: { id: true, title: true, value: true, probability: true, stage: { select: { name: true } } },
            },
          },
        })
        .then((company) => {
          if (company) {
            result.company = {
              id: company.id,
              name: company.name,
              industry: company.industry,
              website: company.website,
              employeeCount: company.employeeCount,
              annualRevenue: company.annualRevenue ? Number(company.annualRevenue) : null,
              notes: company.notes || undefined,
            };
          }
        })
        .catch((err) => {
          console.warn('[Claude Context] Failed to fetch company:', err instanceof Error ? err.message : err);
        })
    );
  }

  await Promise.all(promises);
  return result;
}
