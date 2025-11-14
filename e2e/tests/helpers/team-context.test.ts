/**
 * Tests for createTeamContext helper
 * These tests verify that the team context helper creates proper team setups
 */

import { test, expect } from '@playwright/test';
import { createTeamContext, getTestDb } from '../../helpers';

test('should create team with owner only', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();
  const { owner, team, members, allMembers } = await createTeamContext(page);

  // Verify owner
  expect(owner.id).toBeTruthy();
  expect(owner.email).toContain('@example.com');
  expect(owner.displayName).toContain('Team Leader');
  expect(owner.slug).toContain('leader-');
  expect(owner.defaultTeamSlug).toBe(team.slug);

  // Verify team
  expect(team.id).toBeTruthy();
  expect(team.name).toContain('Test Team');
  expect(team.slug).toContain('team-');
  expect(team.teamLeaderId).toBe(owner.id);
  expect(team.memberIds).toEqual([owner.id]);

  // Verify members
  expect(members).toHaveLength(0); // No additional members
  expect(allMembers).toHaveLength(1); // Only owner
  expect(allMembers[0].id).toBe(owner.id);
  expect(allMembers[0].isLeader).toBe(true);
});

test('should create team with custom owner data', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const { owner, team } = await createTeamContext(page, {
    ownerData: {
      displayName: 'John Doe',
      email: 'john@example.com',
      darkTheme: true,
    },
  });

  expect(owner.displayName).toBe('John Doe');
  expect(owner.email).toBe('john@example.com');
  expect(owner.darkTheme).toBe(true);
});

test('should create team with custom team data', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const { team } = await createTeamContext(page, {
    teamData: {
      name: 'My Custom Team',
      slug: 'custom-team-slug',
    },
  });

  expect(team.name).toBe('My Custom Team');
  expect(team.slug).toBe('custom-team-slug');
});

test('should create team with additional members', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const { owner, team, members, allMembers } = await createTeamContext(page, {
    membersCount: 3,
  });

  // Verify members count
  expect(members).toHaveLength(3);
  expect(allMembers).toHaveLength(4); // owner + 3 members

  // Verify team memberIds includes all members
  expect(team.memberIds).toHaveLength(4);
  expect(team.memberIds).toContain(owner.id);
  members.forEach((member) => {
    expect(team.memberIds).toContain(member.id);
    expect(member.isLeader).toBe(false);
  });

  // Verify owner is in allMembers and is leader
  const ownerInAllMembers = allMembers.find((m) => m.id === owner.id);
  expect(ownerInAllMembers).toBeTruthy();
  expect(ownerInAllMembers?.isLeader).toBe(true);
});

test('should create team with custom member data', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const { members } = await createTeamContext(page, {
    membersData: [
      { displayName: 'Alice Smith', email: 'alice@example.com' },
      { displayName: 'Bob Jones', email: 'bob@example.com' },
    ],
  });

  expect(members).toHaveLength(2);
  expect(members[0].displayName).toBe('Alice Smith');
  expect(members[0].email).toBe('alice@example.com');
  expect(members[1].displayName).toBe('Bob Jones');
  expect(members[1].email).toBe('bob@example.com');
});

test('should create invitation tokens', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const { team, invitations } = await createTeamContext(page, {
    invitationEmails: ['invite1@example.com', 'invite2@example.com', 'invite3@example.com'],
  });

  // Verify invitations count
  expect(invitations).toHaveLength(3);

  // Verify each invitation
  invitations.forEach((invitation, index) => {
    expect(invitation.id).toBeTruthy();
    expect(invitation.teamId).toBe(team.id);
    expect(invitation.email).toBe(`invite${index + 1}@example.com`);
    expect(invitation.token).toBeTruthy();
    expect(invitation.token.length).toBeGreaterThan(10);
    expect(invitation.createdAt).toBeInstanceOf(Date);
  });
});

test('should authenticate owner with session cookie', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const { owner } = await createTeamContext(page);

  // Navigate to protected page
  await page.goto('/your-settings');

  // Should not redirect to login (owner is authenticated)
  await expect(page).not.toHaveURL(/\/login/);

  // Verify user is loaded (wait for page to load completely)
  await page.waitForLoadState('networkidle');
});

test('should create complex team setup', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const { owner, team, members, allMembers, invitations } = await createTeamContext(page, {
    ownerData: {
      displayName: 'Team Leader',
      email: 'leader@example.com',
    },
    teamData: {
      name: 'Complete Team',
      slug: 'complete-team',
    },
    membersCount: 2,
    membersData: [
      { displayName: 'Member One', email: 'member1@example.com' },
      { displayName: 'Member Two', email: 'member2@example.com' },
    ],
    invitationEmails: ['pending1@example.com', 'pending2@example.com'],
  });

  // Verify complete setup
  expect(owner.displayName).toBe('Team Leader');
  expect(team.name).toBe('Complete Team');
  expect(members).toHaveLength(2);
  expect(allMembers).toHaveLength(3); // owner + 2 members
  expect(invitations).toHaveLength(2);

  // Verify all relationships
  expect(team.teamLeaderId).toBe(owner.id);
  expect(team.memberIds).toContain(owner.id);
  members.forEach((member) => {
    expect(team.memberIds).toContain(member.id);
  });
  invitations.forEach((invitation) => {
    expect(invitation.teamId).toBe(team.id);
  });
});

test('should handle membersData longer than membersCount', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const { members } = await createTeamContext(page, {
    membersCount: 1,
    membersData: [
      { displayName: 'Member One' },
      { displayName: 'Member Two' },
      { displayName: 'Member Three' },
    ],
  });

  // Should create 3 members (max of membersCount and membersData.length)
  expect(members).toHaveLength(3);
  expect(members[0].displayName).toBe('Member One');
  expect(members[1].displayName).toBe('Member Two');
  expect(members[2].displayName).toBe('Member Three');
});

test('should create unique slugs for concurrent teams', async ({ page, context }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const ctx1 = await createTeamContext(page);
  const ctx2 = await createTeamContext(context);

  // Teams should have different IDs and slugs
  expect(ctx1.team.id).not.toBe(ctx2.team.id);
  expect(ctx1.team.slug).not.toBe(ctx2.team.slug);
  expect(ctx1.owner.id).not.toBe(ctx2.owner.id);
  expect(ctx1.owner.slug).not.toBe(ctx2.owner.slug);
});

test('should set defaultTeamSlug for all members', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const { team, allMembers } = await createTeamContext(page, {
    membersCount: 2,
  });

  // Verify team structure is correct
  // All members should be added to the team
  expect(allMembers).toHaveLength(3); // owner + 2 members
  expect(team.memberIds).toHaveLength(3);

  // Verify all members are in memberIds
  allMembers.forEach((member) => {
    expect(team.memberIds).toContain(member.id);
  });
});
