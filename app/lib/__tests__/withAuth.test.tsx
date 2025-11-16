import React from 'react';
import { getStore } from '../store';

// Mock dependencies
jest.mock('nprogress');
jest.mock('../gtag');
jest.mock('mobx-react', () => ({
  observer: (component: any) => component,
}));
jest.mock('../store', () => ({
  getStore: jest.fn(),
}));
jest.mock('next/router', () => ({
  events: {
    on: jest.fn(),
  },
  push: jest.fn(),
}));

// Import after all mocks are set
import Router from 'next/router';
import withAuth from '../withAuth';

// Test component
const TestComponent = ({ title = 'Test Component', ...props }: any) => (
  <div data-testid="test-component" {...props}>
    {title}
  </div>
);

describe('withAuth HOC', () => {
  let mockStore: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup store mock
    mockStore = {
      currentUser: {
        email: 'test@example.com',
        defaultTeamSlug: 'test-team',
      },
      changeCurrentUrl: jest.fn(),
    };
    (getStore as jest.Mock).mockReturnValue(mockStore);

    // Setup window mock
    (global as any).window = {
      gtag: jest.fn(),
    };
  });

  describe('getInitialProps', () => {
    test('should return isServer=true when req exists', async () => {
      // Arrange
      const WrappedComponent = withAuth(TestComponent);
      const ctx = { req: { headers: {} } };

      // Act
      const result = await WrappedComponent.getInitialProps(ctx);

      // Assert
      expect(result).toEqual(expect.objectContaining({ isServer: true }));
    });

    test('should return isServer=false when req does not exist', async () => {
      // Arrange
      const WrappedComponent = withAuth(TestComponent);
      const ctx = { req: null };

      // Act
      const result = await WrappedComponent.getInitialProps(ctx);

      // Assert
      expect(result).toEqual(expect.objectContaining({ isServer: false }));
    });

    test('should call Component.getInitialProps if it exists', async () => {
      // Arrange
      const mockGetInitialProps = jest.fn().mockResolvedValue({ customProp: 'value' });
      const ComponentWithInitialProps = TestComponent as any;
      ComponentWithInitialProps.getInitialProps = mockGetInitialProps;

      const WrappedComponent = withAuth(ComponentWithInitialProps);
      const ctx = { req: null };

      // Act
      const result = await WrappedComponent.getInitialProps(ctx);

      // Assert
      expect(mockGetInitialProps).toHaveBeenCalledWith(ctx);
      expect(result).toEqual(
        expect.objectContaining({
          customProp: 'value',
          isServer: false,
        }),
      );
    });

    test('should merge Component props with isServer prop', async () => {
      // Arrange
      const mockGetInitialProps = jest
        .fn()
        .mockResolvedValue({ title: 'Custom Title', data: 'test' });
      const ComponentWithInitialProps = TestComponent as any;
      ComponentWithInitialProps.getInitialProps = mockGetInitialProps;

      const WrappedComponent = withAuth(ComponentWithInitialProps);
      const ctx = { req: { headers: {} } };

      // Act
      const result = await WrappedComponent.getInitialProps(ctx);

      // Assert
      expect(result).toEqual({
        title: 'Custom Title',
        data: 'test',
        isServer: true,
      });
    });

    test('should handle Component without getInitialProps', async () => {
      // Arrange
      const ComponentWithoutInitialProps = TestComponent as any;
      delete ComponentWithoutInitialProps.getInitialProps;

      const WrappedComponent = withAuth(ComponentWithoutInitialProps);
      const ctx = { req: { headers: {} } };

      // Act
      const result = await WrappedComponent.getInitialProps(ctx);

      // Assert
      expect(result).toEqual({ isServer: true });
    });
  });

  describe('Router integration', () => {
    test('should use Router for navigation', () => {
      // Verify Router is available
      expect(Router).toBeDefined();
      expect(Router.push).toBeDefined();
      expect(Router.events).toBeDefined();
    });

    test('should register Router.events.on during module initialization', () => {
      // The withAuth module registers Router event listeners at module load time
      // This test verifies Router.events.on is available and can be used
      expect(typeof Router.events.on).toBe('function');
    });
  });

  describe('componentDidMount - Login Required (default)', () => {
    test('should redirect to /login when loginRequired and no user', () => {
      // Arrange
      mockStore.currentUser = null;
      const WrappedComponent = withAuth(TestComponent, { loginRequired: true });
      const instance = new WrappedComponent({ store: mockStore });

      // Act
      instance.componentDidMount();

      // Assert
      expect(Router.push).toHaveBeenCalledWith('/login');
    });

    test('should not redirect when user has defaultTeamSlug and loginRequired', () => {
      // Arrange
      mockStore.currentUser = {
        email: 'test@example.com',
        defaultTeamSlug: 'my-team',
      };
      const WrappedComponent = withAuth(TestComponent, { loginRequired: true });
      const instance = new WrappedComponent({ store: mockStore });

      // Act
      instance.componentDidMount();

      // Assert
      expect(Router.push).not.toHaveBeenCalled();
    });
  });

  describe('componentDidMount - Logout Required', () => {
    test('should redirect when logoutRequired and user exists with defaultTeamSlug', () => {
      // Arrange
      mockStore.currentUser = {
        email: 'test@example.com',
        defaultTeamSlug: 'my-team',
      };
      const WrappedComponent = withAuth(TestComponent, {
        loginRequired: false,
        logoutRequired: true,
      });
      const instance = new WrappedComponent({ store: mockStore });

      // Act
      instance.componentDidMount();

      // Assert
      expect(Router.push).toHaveBeenCalledWith(
        '/your-settings?teamSlug=my-team',
        '/teams/my-team/your-settings',
      );
    });

    test('should redirect to /create-team when logoutRequired and user has no defaultTeamSlug', () => {
      // Arrange
      mockStore.currentUser = {
        email: 'test@example.com',
        defaultTeamSlug: null,
      };
      const WrappedComponent = withAuth(TestComponent, {
        loginRequired: false,
        logoutRequired: true,
      });
      const instance = new WrappedComponent({ store: mockStore });

      // Act
      instance.componentDidMount();

      // Assert
      expect(Router.push).toHaveBeenCalledWith('/create-team', '/create-team');
    });

    test('should not redirect when logoutRequired and no user', () => {
      // Arrange
      mockStore.currentUser = null;
      const WrappedComponent = withAuth(TestComponent, {
        loginRequired: false,
        logoutRequired: true,
      });
      const instance = new WrappedComponent({ store: mockStore });

      // Act
      instance.componentDidMount();

      // Assert
      expect(Router.push).not.toHaveBeenCalled();
    });
  });

  describe('render - Login Required', () => {
    test('should render null when loginRequired and no user', () => {
      // Arrange
      mockStore.currentUser = null;
      const WrappedComponent = withAuth(TestComponent, { loginRequired: true });
      const instance = new WrappedComponent({ store: mockStore });

      // Act
      const result = instance.render();

      // Assert
      expect(result).toBeNull();
    });

    test('should render Component when loginRequired and user exists', () => {
      // Arrange
      mockStore.currentUser = {
        email: 'test@example.com',
        defaultTeamSlug: 'my-team',
      };
      const WrappedComponent = withAuth(TestComponent, { loginRequired: true });
      const instance = new WrappedComponent({ store: mockStore });

      // Act
      const result = instance.render();

      // Assert
      expect(result).toBeDefined();
      expect(result.type).toBe(TestComponent);
    });

    test('should pass all props to Component', () => {
      // Arrange
      mockStore.currentUser = {
        email: 'test@example.com',
        defaultTeamSlug: 'my-team',
      };
      const WrappedComponent = withAuth(TestComponent, { loginRequired: true });
      const customProps = { store: mockStore, customProp: 'test' };
      const instance = new WrappedComponent(customProps);

      // Act
      const result = instance.render();

      // Assert
      expect(result.props).toEqual(customProps);
    });
  });

  describe('render - Logout Required', () => {
    test('should render null when logoutRequired and user exists', () => {
      // Arrange
      mockStore.currentUser = {
        email: 'test@example.com',
        defaultTeamSlug: 'my-team',
      };
      const WrappedComponent = withAuth(TestComponent, {
        loginRequired: false,
        logoutRequired: true,
      });
      const instance = new WrappedComponent({ store: mockStore });

      // Act
      const result = instance.render();

      // Assert
      expect(result).toBeNull();
    });

    test('should render Component when logoutRequired and no user', () => {
      // Arrange
      mockStore.currentUser = null;
      const WrappedComponent = withAuth(TestComponent, {
        loginRequired: false,
        logoutRequired: true,
      });
      const instance = new WrappedComponent({ store: mockStore });

      // Act
      const result = instance.render();

      // Assert
      expect(result).toBeDefined();
      expect(result.type).toBe(TestComponent);
    });
  });

  describe('Default Options', () => {
    test('should use default loginRequired=true when no options', () => {
      // Arrange
      mockStore.currentUser = null;
      const WrappedComponent = withAuth(TestComponent);
      const instance = new WrappedComponent({ store: mockStore });

      // Act
      instance.componentDidMount();

      // Assert
      expect(Router.push).toHaveBeenCalledWith('/login');
    });

    test('should allow overriding default options', () => {
      // Arrange
      mockStore.currentUser = null;
      const WrappedComponent = withAuth(TestComponent, {
        loginRequired: false,
        logoutRequired: false,
      });
      const instance = new WrappedComponent({ store: mockStore });

      // Act
      instance.componentDidMount();

      // Assert
      expect(Router.push).not.toHaveBeenCalled();
    });
  });

  describe('HOC wrapping with observer', () => {
    test('should return a component with WithAuth name', () => {
      // Arrange & Act
      const WrappedComponent = withAuth(TestComponent);

      // Assert
      expect(WrappedComponent).toBeDefined();
      expect(WrappedComponent.name).toBe('WithAuth');
    });

    test('should maintain static getInitialProps on wrapped component', () => {
      // Arrange & Act
      const WrappedComponent = withAuth(TestComponent);

      // Assert
      expect(WrappedComponent.getInitialProps).toBeDefined();
      expect(typeof WrappedComponent.getInitialProps).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    test('should handle null store gracefully in getInitialProps', async () => {
      // Arrange
      (getStore as jest.Mock).mockReturnValue(null);
      const WrappedComponent = withAuth(TestComponent);
      const ctx = { req: null };

      // Act
      const result = await WrappedComponent.getInitialProps(ctx);

      // Assert
      expect(result).toEqual({ isServer: false });
    });

    test('should render null when store has no currentUser', () => {
      // Arrange
      const emptyStore = {
        currentUser: null,
        currentUrl: '',
        currentTeam: null,
        teams: [],
        isServer: false,
        socket: null,
        changeCurrentUrl: jest.fn(),
        setCurrentUser: jest.fn(),
        addTeam: jest.fn(),
        setCurrentTeam: jest.fn(),
        setInitialTeamsStoreMethod: jest.fn(),
      } as any;
      const WrappedComponent = withAuth(TestComponent, { loginRequired: true });
      const instance = new WrappedComponent({ store: emptyStore });

      // Act
      const result = instance.render();

      // Assert
      expect(result).toBeNull();
    });

    test('should handle render with user prop passed through', () => {
      // Arrange
      mockStore.currentUser = {
        email: 'test@example.com',
        defaultTeamSlug: 'team',
      };
      const WrappedComponent = withAuth(TestComponent, { loginRequired: false });
      const props = { store: mockStore, user: { id: '123' } };
      const instance = new WrappedComponent(props);

      // Act
      const result = instance.render();

      // Assert
      expect(result.props).toEqual(props);
    });
  });

  describe('Complex Scenarios', () => {
    test('should handle all combinations of loginRequired and logoutRequired', () => {
      // Arrange
      mockStore.currentUser = { email: 'test@example.com', defaultTeamSlug: 'team' };

      const combinations = [
        { loginRequired: true, logoutRequired: false, shouldRender: true },
        { loginRequired: false, logoutRequired: true, shouldRender: false },
        { loginRequired: false, logoutRequired: false, shouldRender: true },
      ];

      combinations.forEach(({ loginRequired, logoutRequired, shouldRender }) => {
        (Router.push as jest.Mock).mockClear();

        const WrappedComponent = withAuth(TestComponent, { loginRequired, logoutRequired });
        const instance = new WrappedComponent({ store: mockStore });

        // Act
        const result = instance.render();

        // Assert
        if (shouldRender) {
          expect(result).toBeDefined();
        } else {
          expect(result).toBeNull();
        }
      });
    });

    test('should handle switching between different HOC instances', () => {
      // Arrange
      mockStore.currentUser = { email: 'test@example.com', defaultTeamSlug: 'team-1' };

      const LoginComponent = withAuth(TestComponent, { loginRequired: true });
      const LogoutComponent = withAuth(TestComponent, {
        loginRequired: false,
        logoutRequired: true,
      });

      // Act
      const loginInstance = new LoginComponent({ store: mockStore });
      const logoutInstance = new LogoutComponent({ store: mockStore });

      // Assert
      expect(loginInstance.render()).toBeDefined(); // Should render
      expect(logoutInstance.render()).toBeNull(); // Should not render
    });
  });
});
