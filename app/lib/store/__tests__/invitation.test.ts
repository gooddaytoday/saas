import { Invitation } from '../invitation';

describe('Invitation', () => {
  describe('constructor', () => {
    test('initializes Invitation with correct properties', () => {
      const invitationParams = {
        _id: 'invitation123',
        teamId: 'team123',
        email: 'test@example.com',
        createdAt: new Date('2023-01-01'),
      };

      const invitation = new Invitation(invitationParams);

      expect(invitation._id).toBe('invitation123');
      expect(invitation.teamId).toBe('team123');
      expect(invitation.email).toBe('test@example.com');
      expect(invitation.createdAt).toEqual(new Date('2023-01-01'));
    });

    test('handles different data types correctly', () => {
      const invitationParams = {
        _id: 'inv-456',
        teamId: 'team-789',
        email: 'user@domain.org',
        createdAt: new Date('2023-06-15T10:30:00Z'),
      };

      const invitation = new Invitation(invitationParams);

      expect(invitation._id).toBe('inv-456');
      expect(invitation.teamId).toBe('team-789');
      expect(invitation.email).toBe('user@domain.org');
      expect(invitation.createdAt).toEqual(new Date('2023-06-15T10:30:00Z'));
    });

    test('handles empty string values', () => {
      const invitationParams = {
        _id: '',
        teamId: '',
        email: '',
        createdAt: new Date(),
      };

      const invitation = new Invitation(invitationParams);

      expect(invitation._id).toBe('');
      expect(invitation.teamId).toBe('');
      expect(invitation.email).toBe('');
      expect(invitation.createdAt).toBeInstanceOf(Date);
    });

    test('assigns all provided properties using Object.assign', () => {
      const invitationParams = {
        _id: 'test-id',
        teamId: 'test-team',
        email: 'test@email.com',
        createdAt: new Date('2023-01-01'),
        additionalProperty: 'extra-value',
      };

      const invitation = new Invitation(invitationParams);

      expect(invitation._id).toBe('test-id');
      expect(invitation.teamId).toBe('test-team');
      expect(invitation.email).toBe('test@email.com');
      expect(invitation.createdAt).toEqual(new Date('2023-01-01'));
      expect((invitation as any).additionalProperty).toBe('extra-value');
    });
  });
});
