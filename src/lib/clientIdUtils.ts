import { Client, TeamMember } from '../types';

/**
 * Returns the Master Client ID if present, otherwise returns the clean formatted document ID.
 */
export function getMasterClientId(client?: { masterClientId?: string; id?: string } | null): string {
  if (!client) return '';
  if (client.masterClientId && client.masterClientId.trim()) {
    return client.masterClientId.trim().toUpperCase();
  }
  if (!client.id) return '';
  // Fallback to human readable form of id if not set
  if (client.id.startsWith('client-')) {
    const parts = client.id.split('-');
    if (parts.length >= 2) {
      return `CL-${parts[1].slice(-4).toUpperCase()}`;
    }
  }
  return client.id.toUpperCase();
}

/**
 * Suggests the next sequential Master Client ID (e.g., CL-1001, CL-1002, CL-1003...)
 */
export function getNextMasterClientId(clients: Client[] = []): string {
  let highestNumber = 1000;

  for (const client of clients) {
    const idToTest = client.masterClientId || client.id || '';
    const match = idToTest.match(/(?:CL|ID|C|CLIENT)[-_]?(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > highestNumber && num < 999999) {
        highestNumber = num;
      }
    }
  }

  // If no numbered IDs found, count existing clients
  if (highestNumber === 1000 && clients.length > 0) {
    highestNumber = 1000 + clients.length;
  }

  return `CL-${highestNumber + 1}`;
}

/**
 * Ensures all clients in a list have a consistent Master Client ID.
 */
export function ensureClientMasterIds(clients: Client[]): { updatedClients: Client[]; hasChanges: boolean } {
  let highestNumber = 1000;
  // First pass: find highest existing number
  for (const client of clients) {
    if (client.masterClientId) {
      const match = client.masterClientId.match(/(?:CL|ID|C|CLIENT)[-_]?(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNumber && num < 999999) {
          highestNumber = num;
        }
      }
    }
  }

  let hasChanges = false;
  const updatedClients = clients.map(client => {
    if (client.masterClientId && client.masterClientId.trim()) {
      return client;
    }
    highestNumber += 1;
    hasChanges = true;
    return {
      ...client,
      masterClientId: `CL-${highestNumber}`
    };
  });

  return { updatedClients, hasChanges };
}

/**
 * Returns formatted Team Member ID (e.g. TM-1001) or fallback.
 */
export function getMasterTeamMemberId(member?: { teamMemberId?: string; id?: string } | null): string {
  if (!member) return '';
  if (member.teamMemberId && member.teamMemberId.trim()) {
    return member.teamMemberId.trim().toUpperCase();
  }
  if (!member.id) return '';
  if (member.id.startsWith('team-') || member.id.startsWith('tm-')) {
    const parts = member.id.split('-');
    if (parts.length >= 2) {
      return `TM-${parts[1].slice(-4).toUpperCase()}`;
    }
  }
  return member.id.toUpperCase();
}

/**
 * Suggests the next sequential Team Member ID (e.g., TM-1001, TM-1002...)
 */
export function getNextTeamMemberId(teamMembers: TeamMember[] = []): string {
  let highestNumber = 1000;

  for (const member of teamMembers) {
    const idToTest = member.teamMemberId || member.id || '';
    const match = idToTest.match(/(?:TM|MEMBER|TEAM)[-_]?(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > highestNumber && num < 999999) {
        highestNumber = num;
      }
    }
  }

  if (highestNumber === 1000 && teamMembers.length > 0) {
    highestNumber = 1000 + teamMembers.length;
  }

  return `TM-${highestNumber + 1}`;
}

export const getNextMasterTeamMemberId = getNextTeamMemberId;

/**
 * Ensures all team members in a list have a consistent Team Member ID.
 */
export function ensureTeamMemberIds(teamMembers: TeamMember[]): { updatedTeamMembers: TeamMember[]; hasChanges: boolean } {
  let highestNumber = 1000;
  for (const member of teamMembers) {
    if (member.teamMemberId) {
      const match = member.teamMemberId.match(/(?:TM|MEMBER|TEAM)[-_]?(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNumber && num < 999999) {
          highestNumber = num;
        }
      }
    }
  }

  let hasChanges = false;
  const updatedTeamMembers = teamMembers.map(member => {
    if (member.teamMemberId && member.teamMemberId.trim()) {
      return member;
    }
    highestNumber += 1;
    hasChanges = true;
    return {
      ...member,
      teamMemberId: `TM-${highestNumber}`
    };
  });

  return { updatedTeamMembers, hasChanges };
}

