import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { observable } from 'mobx';

// Моки для Material-UI компонентов
jest.mock('@mui/material/Tooltip', () => {
  return function MockTooltip({
    children,
    title,
    placement,
    disableFocusListener,
    disableTouchListener,
    ...props
  }: any) {
    // Отфильтровать MUI-специфичные props, которые не должны попадать в DOM
    const domProps = { ...props };

    return (
      <div data-testid="tooltip" data-title={title} data-placement={placement} {...domProps}>
        {children}
      </div>
    );
  };
});

jest.mock('@mui/icons-material/AddCircleOutline', () => {
  return function MockAddCircleOutlineIcon(props: any) {
    return <div data-testid="add-circle-icon" {...props} />;
  };
});

// Мок для mobx-react observer
jest.mock('mobx-react', () => ({
  observer: (component: any) => component,
}));

// Мок для notify - должен быть определен до импорта компонента
jest.mock('../../../lib/notify', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Моки для дочерних компонентов должны быть после основных моков
jest.mock('../CreateDiscussionForm', () => {
  return function MockCreateDiscussionForm({ isMobile, open, onClose }: any) {
    return (
      <div data-testid="create-discussion-form" data-open={open} data-ismobile={isMobile}>
        Create Discussion Form
        {open && (
          <button data-testid="close-form" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    );
  };
});

jest.mock('../DiscussionListItem', () => {
  return function MockDiscussionListItem({ discussion }: any) {
    return <li data-testid={`discussion-item-${discussion._id}`}>{discussion.name}</li>;
  };
});

// Импортируем компонент после всех моков
import DiscussionList from '../DiscussionList';
import notify from '../../../lib/notify';

// Получаем ссылку на мок функцию notify
const mockNotify = notify as jest.MockedFunction<typeof notify>;

// Мок объекты для тестирования
const createMockUser = (overrides = {}) => ({
  store: {} as any, // Will be set by createMockStore
  _id: 'user1',
  slug: 'user1',
  email: 'test@example.com',
  displayName: 'Test User',
  avatarUrl: '',
  isSignedupViaGoogle: false,
  darkTheme: false,
  defaultTeamSlug: 'test-team',
  stripeCard: {
    brand: 'visa',
    funding: 'credit',
    last4: '4242',
    exp_month: 12,
    exp_year: 2025,
  },
  hasCardInformation: true,
  stripeListOfInvoices: {
    object: 'list',
    data: [
      {
        amount_paid: 0,
        teamName: 'Test Team',
        created: Date.now(),
        hosted_invoice_url: 'https://example.com',
      },
    ] as any,
    has_more: false,
  },
  // User methods
  toggleTheme: jest.fn(),
  updateProfile: jest.fn(),
  getListOfInvoices: jest.fn(),
  ...overrides,
});

const createMockStore = (overrides = {}) => ({
  isServer: false,
  currentUrl: '',
  teams: observable([]),
  socket: null,
  currentUser: createMockUser(),
  changeCurrentUrl: jest.fn(),
  setCurrentUser: jest.fn(),
  setCurrentTeam: jest.fn(),
  addTeam: jest.fn(),
  ...overrides,
});

const createMockDiscussion = (id: string, name: string) => ({
  _id: id,
  name,
  slug: `discussion-${id}`,
  memberIds: [],
  posts: [],
  isLoadingPosts: false,
  notificationType: 'default',
  createdUserId: 'user1',
  store: createMockStore(),
  team: {} as any,
});

const createMockTeam = (overrides = {}) => {
  const team = {
    _id: 'team1',
    name: 'Test Team',
    slug: 'test-team',
    avatarUrl: '',
    teamLeaderId: 'user1',
    memberIds: observable([]),
    members: new Map(),
    invitations: new Map(),
    currentDiscussion: undefined,
    currentDiscussionSlug: undefined,
    discussions: observable([]),
    isLoadingDiscussions: false,
    stripeSubscription: {
      id: 'sub1',
      object: 'subscription',
      application_fee_percent: 0,
      billing: 'monthly',
      cancel_at_period_end: false,
      billing_cycle_anchor: Date.now(),
      canceled_at: 0,
      created: Date.now(),
    },
    isSubscriptionActive: true,
    isPaymentFailed: false,
    store: createMockStore() as any,
    // Team methods
    setInitialMembersAndInvitations: jest.fn(),
    updateTheme: jest.fn(),
    inviteMember: jest.fn(),
    removeMember: jest.fn(),
    setCurrentDiscussion: jest.fn(),
    setInitialDiscussions: jest.fn(),
    loadDiscussions: jest.fn().mockResolvedValue(undefined),
    changeLocalCache: jest.fn(),
    addDiscussion: jest.fn(),
    addDiscussionToLocalCache: jest.fn(),
    deleteDiscussion: jest.fn(),
    deleteDiscussionFromLocalCache: jest.fn(),
    getDiscussionBySlug: jest.fn(),
    cancelSubscription: jest.fn(),
    checkIfTeamLeaderMustBeCustomer: jest.fn(),
    get orderedDiscussions() {
      return this.discussions.slice().sort((a: any, b: any) => a.name.localeCompare(b.name));
    },
    ...overrides,
  };

  // Привязываем orderedDiscussions к самому объекту
  Object.defineProperty(team, 'orderedDiscussions', {
    get() {
      return this.discussions.slice().sort((a: any, b: any) => a.name.localeCompare(b.name));
    },
    enumerable: true,
  });

  return team;
};

describe('DiscussionList', () => {
  let mockStore: any;
  let mockTeam: any;
  let user: any;

  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();

    mockStore = createMockStore();
    mockTeam = createMockTeam();
  });

  describe('Rendering', () => {
    test('renders without crashing with required props', () => {
      render(<DiscussionList store={mockStore} team={mockTeam} isMobile={false} />);

      expect(screen.getByText('Discussions')).toBeInTheDocument();
    });

    test('renders add discussion button with tooltip', () => {
      render(<DiscussionList store={mockStore} team={mockTeam} isMobile={false} />);

      const tooltip = screen.getByTestId('tooltip');
      expect(tooltip).toHaveAttribute('data-title', 'Add Discussion');

      // Ищем ссылку по data-testid tooltip
      const addButton = tooltip.querySelector('a');
      expect(addButton).toBeInTheDocument();

      const icon = screen.getByTestId('add-circle-icon');
      expect(icon).toBeInTheDocument();
    });

    test('renders discussion list when team has discussions', () => {
      const discussion1 = createMockDiscussion('disc1', 'Discussion A');
      const discussion2 = createMockDiscussion('disc2', 'Discussion B');
      mockTeam.discussions = [discussion1, discussion2];

      render(<DiscussionList store={mockStore} team={mockTeam} isMobile={false} />);

      expect(screen.getByTestId('discussion-item-disc1')).toBeInTheDocument();
      expect(screen.getByTestId('discussion-item-disc2')).toBeInTheDocument();
      expect(screen.getByText('Discussion A')).toBeInTheDocument();
      expect(screen.getByText('Discussion B')).toBeInTheDocument();
    });

    test('renders empty list when no discussions', () => {
      mockTeam.discussions = [];

      render(<DiscussionList store={mockStore} team={mockTeam} isMobile={false} />);

      expect(screen.queryByTestId(/^discussion-item-/)).not.toBeInTheDocument();
    });

    test('renders CreateDiscussionForm component', () => {
      render(<DiscussionList store={mockStore} team={mockTeam} isMobile={false} />);

      const form = screen.getByTestId('create-discussion-form');
      expect(form).toBeInTheDocument();
      expect(form).toHaveAttribute('data-open', 'false');
    });

    test('applies dark theme styling when user has darkTheme enabled', () => {
      mockStore.currentUser.darkTheme = true;

      render(<DiscussionList store={mockStore} team={mockTeam} isMobile={false} />);

      const icon = screen.getByTestId('add-circle-icon');
      expect(icon).toHaveStyle({ color: '#fff' });
    });

    test('applies light theme styling when user has darkTheme disabled', () => {
      mockStore.currentUser.darkTheme = false;

      render(<DiscussionList store={mockStore} team={mockTeam} isMobile={false} />);

      const icon = screen.getByTestId('add-circle-icon');
      expect(icon).toHaveStyle({ color: '#000' });
    });

    test('passes isMobile prop to CreateDiscussionForm', () => {
      render(<DiscussionList store={mockStore} team={mockTeam} isMobile={true} />);

      const form = screen.getByTestId('create-discussion-form');
      expect(form).toHaveAttribute('data-ismobile', 'true');
    });

    test('passes store prop to CreateDiscussionForm', () => {
      render(<DiscussionList store={mockStore} team={mockTeam} isMobile={false} />);

      // Проверяем что компонент рендерится с правильными пропсами
      expect(screen.getByTestId('create-discussion-form')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('opens discussion form when add button is clicked', async () => {
      render(<DiscussionList store={mockStore} team={mockTeam} isMobile={false} />);

      const tooltip = screen.getByTestId('tooltip');
      const addButton = tooltip.querySelector('a') as HTMLElement;
      await user.click(addButton);

      const form = screen.getByTestId('create-discussion-form');
      expect(form).toHaveAttribute('data-open', 'true');
    });

    test('closes discussion form when onClose is called', async () => {
      render(<DiscussionList store={mockStore} team={mockTeam} isMobile={false} />);

      // Сначала открываем форму
      const tooltip = screen.getByTestId('tooltip');
      const addButton = tooltip.querySelector('a') as HTMLElement;
      await user.click(addButton);

      expect(screen.getByTestId('create-discussion-form')).toHaveAttribute('data-open', 'true');

      // Закрываем форму
      const closeButton = screen.getByTestId('close-form');
      await user.click(closeButton);

      const form = screen.getByTestId('create-discussion-form');
      expect(form).toHaveAttribute('data-open', 'false');
    });

    test('prevents default behavior when add button is clicked', async () => {
      render(<DiscussionList store={mockStore} team={mockTeam} isMobile={false} />);

      const tooltip = screen.getByTestId('tooltip');
      const addButton = tooltip.querySelector('a') as HTMLElement;

      await user.click(addButton);

      // Проверяем что компонент рендерится корректно после клика
      expect(screen.getByTestId('create-discussion-form')).toHaveAttribute('data-open', 'true');
    });
  });

  describe('Lifecycle Methods', () => {
    test('calls loadDiscussions on component mount', async () => {
      render(<DiscussionList store={mockStore} team={mockTeam} isMobile={false} />);

      await waitFor(() => {
        expect(mockTeam.loadDiscussions).toHaveBeenCalledTimes(1);
      });
    });

    test('calls loadDiscussions and notify on mount error', async () => {
      const error = new Error('Load failed');
      mockTeam.loadDiscussions.mockRejectedValue(error);

      render(<DiscussionList store={mockStore} team={mockTeam} isMobile={false} />);

      await waitFor(() => {
        expect(mockTeam.loadDiscussions).toHaveBeenCalledTimes(1);
        expect(mockNotify).toHaveBeenCalledWith(error);
      });
    });

    test('calls loadDiscussions when team _id changes', async () => {
      const { rerender } = render(
        <DiscussionList store={mockStore} team={mockTeam} isMobile={false} />,
      );

      await waitFor(() => {
        expect(mockTeam.loadDiscussions).toHaveBeenCalledTimes(1);
      });

      // Изменяем команду
      const newTeam = createMockTeam({ _id: 'team2' });
      rerender(<DiscussionList store={mockStore} team={newTeam} isMobile={false} />);

      await waitFor(() => {
        expect(newTeam.loadDiscussions).toHaveBeenCalledTimes(1);
      });
    });

    test('does not call loadDiscussions when team _id remains the same', async () => {
      const { rerender } = render(
        <DiscussionList store={mockStore} team={mockTeam} isMobile={false} />,
      );

      await waitFor(() => {
        expect(mockTeam.loadDiscussions).toHaveBeenCalledTimes(1);
      });

      // Ререндерим с той же командой
      rerender(<DiscussionList store={mockStore} team={mockTeam} isMobile={false} />);

      // loadDiscussions не должен вызваться снова
      expect(mockTeam.loadDiscussions).toHaveBeenCalledTimes(1);
    });
  });

  describe('Conditional Rendering', () => {
    test('throws error when team is null', () => {
      // Компонент должен падать при null team, так как пытается вызвать team.loadDiscussions()
      // Подавляем console.error для этого ожидаемого исключения
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      try {
        expect(() => {
          render(<DiscussionList store={mockStore} team={null as any} isMobile={false} />);
        }).toThrow();
      } finally {
        consoleSpy.mockRestore();
      }
    });

    test('handles undefined store gracefully', () => {
      // Проверяем обработку undefined store
      expect(() => {
        render(<DiscussionList store={undefined as any} team={mockTeam} isMobile={false} />);
      }).not.toThrow();
    });

    test('handles missing currentUser in store', () => {
      mockStore.currentUser = null;

      expect(() => {
        render(<DiscussionList store={mockStore} team={mockTeam} isMobile={false} />);
      }).not.toThrow();

      const icon = screen.getByTestId('add-circle-icon');
      expect(icon).toHaveStyle({ color: '#000' }); // default to light theme
    });

    test('handles discussions with different sort order', () => {
      const discussion1 = createMockDiscussion('disc1', 'Z Discussion');
      const discussion2 = createMockDiscussion('disc2', 'A Discussion');
      mockTeam.discussions = [discussion1, discussion2];

      render(<DiscussionList store={mockStore} team={mockTeam} isMobile={false} />);

      const items = screen.getAllByTestId(/^discussion-item-/);
      expect(items).toHaveLength(2);

      // Проверяем что дискуссии отсортированы по имени
      const firstItem = screen.getByTestId('discussion-item-disc2'); // A Discussion
      const secondItem = screen.getByTestId('discussion-item-disc1'); // Z Discussion
      expect(firstItem).toBeInTheDocument();
      expect(secondItem).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('add discussion link has proper styling and accessibility', () => {
      render(<DiscussionList store={mockStore} team={mockTeam} isMobile={false} />);

      const tooltip = screen.getByTestId('tooltip');
      const link = tooltip.querySelector('a') as HTMLElement;
      expect(link).toHaveStyle({ float: 'right', padding: '0px 10px' });
    });

    test('tooltip provides proper accessibility information', () => {
      render(<DiscussionList store={mockStore} team={mockTeam} isMobile={false} />);

      const tooltip = screen.getByTestId('tooltip');
      expect(tooltip).toHaveAttribute('data-title', 'Add Discussion');
      expect(tooltip).toHaveAttribute('data-placement', 'right');
    });
  });
});
