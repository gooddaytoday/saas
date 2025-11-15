import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Layout from '../index';
import { Store } from '../../../lib/store';

const menuWithLinksProps: any[] = [];
const discussionListProps: any[] = [];

jest.mock('../../discussions/DiscussionList', () => {
  const MockDiscussionList = (props: any) => {
    discussionListProps.push(props);
    return <div data-testid="discussion-list">Discussion list mock</div>;
  };
  MockDiscussionList.displayName = 'MockDiscussionList';
  return MockDiscussionList;
});

jest.mock('../../common/MenuWithLinks', () => {
  const MockMenuWithLinks = (props: any) => {
    menuWithLinksProps.push(props);
    return (
      <div data-testid="menu-with-links">
        {props.children}
        <div data-testid="menu-options">
          {props.options
            ?.filter((option: any) => !option.separator)
            .map((option: any, index: number) => (
              <div
                key={`option-${index}-${option.text || option.href}`}
                data-testid="menu-option"
                data-href={option.href}
                data-as={option.as}
                data-text={option.text}
                data-external={String(option.externalServer)}
              >
                {option.text}
              </div>
            ))}
        </div>
      </div>
    );
  };
  MockMenuWithLinks.displayName = 'MockMenuWithLinks';
  return MockMenuWithLinks;
});

jest.mock('../../common/Notifier', () => {
  const MockNotifier = () => <div data-testid="notifier-mock" />;
  MockNotifier.displayName = 'MockNotifier';
  return MockNotifier;
});

jest.mock('../../common/Confirmer', () => {
  const MockConfirmer = () => <div data-testid="confirmer-mock" />;
  MockConfirmer.displayName = 'MockConfirmer';
  return MockConfirmer;
});

jest.mock('@mui/icons-material/Lens', () => {
  const MockLensIcon = (props: any) => <div data-testid="lens-icon" {...props} />;
  MockLensIcon.displayName = 'MockLensIcon';
  return MockLensIcon;
});

const createCurrentUser = (overrides: Record<string, any> = {}) => {
  const toggleTheme = jest.fn(() => Promise.resolve());
  return {
    avatarUrl: 'https://example.com/avatar.png',
    darkTheme: true,
    toggleTheme,
    ...overrides,
  };
};

const createCurrentTeam = (overrides: Record<string, any> = {}) => ({
  slug: 'team-slug',
  name: 'Team Name',
  loadDiscussions: jest.fn(),
  ...overrides,
});

const makeStore = (options: { currentUser?: any; currentTeam?: any; currentUrl?: string } = {}) => {
  const currentUser = options.currentUser === undefined ? createCurrentUser() : options.currentUser;
  const currentTeam = options.currentTeam === undefined ? createCurrentTeam() : options.currentTeam;

  return {
    currentUser,
    currentTeam,
    currentUrl: options.currentUrl ?? '/teams/team-overview',
    isServer: false,
    teams: [],
    socket: null,
    changeCurrentUrl: jest.fn(),
    setCurrentUser: jest.fn(),
    setCurrentTeam: jest.fn(),
    addTeam: jest.fn(),
  } as unknown as Store;
};

describe('Layout', () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_URL_API = 'https://api.dev.local';
    process.env.NEXT_PUBLIC_PRODUCTION_URL_API = 'https://api.prod';
  });

  afterEach(() => {
    menuWithLinksProps.length = 0;
    discussionListProps.length = 0;
    jest.clearAllMocks();
  });

  it('renders fallback content when no user is signed in', () => {
    const store = makeStore({ currentUser: null, currentTeam: null });
    render(
      <Layout store={store} firstGridItem={false}>
        <div>Standalone content</div>
      </Layout>,
    );

    expect(screen.getByText('Standalone content')).toBeInTheDocument();
    expect(screen.queryByTestId('menu-with-links')).not.toBeInTheDocument();
    expect(screen.getByTestId('notifier-mock')).toBeInTheDocument();
    expect(screen.getByTestId('confirmer-mock')).toBeInTheDocument();
  });

  it('shows create-team call-to-action when team is required but missing', () => {
    const store = makeStore({ currentTeam: null });
    render(
      <Layout store={store} teamRequired firstGridItem={false}>
        <span>Children survive</span>
      </Layout>,
    );

    expect(screen.getByText(/Select existing team or create a new team/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create new team/i })).toBeInTheDocument();
    expect(screen.queryByText('Children survive')).not.toBeInTheDocument();
  });

  it('still renders children when team is optional and missing', () => {
    const store = makeStore({ currentTeam: null });
    render(
      <Layout store={store} teamRequired={false} firstGridItem={false}>
        <p>Optional team view</p>
      </Layout>,
    );

    expect(screen.getByText('Optional team view')).toBeInTheDocument();
    expect(
      screen.queryByText(/Select existing team or create a new team/i),
    ).not.toBeInTheDocument();
  });

  it('renders navigation helpers and discussion list when user has a team', async () => {
    const currentUser = createCurrentUser();
    const currentTeam = createCurrentTeam();
    const store = makeStore({ currentUser, currentTeam, currentUrl: '/teams/team-overview' });

    render(
      <Layout store={store} firstGridItem isMobile={false}>
        <div>Dashboard</div>
      </Layout>,
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('menu-with-links')).toBeInTheDocument();
    expect(menuWithLinksProps[0].options.length).toBeGreaterThan(0);
    const settingsOption = menuWithLinksProps[0].options.find(
      (option: any) => option.text === 'Your Settings',
    );
    expect(settingsOption.href).toContain(`/your-settings?teamSlug=${currentTeam.slug}`);
    expect(settingsOption.as).toContain(`/teams/${currentTeam.slug}/your-settings`);

    const logoutOption = menuWithLinksProps[0].options.find(
      (option: any) => option.text === 'Log out',
    );
    expect(logoutOption.externalServer).toBe(true);
    expect(logoutOption.href).toContain(`${process.env.NEXT_PUBLIC_URL_API}/logout`);

    expect(screen.getByTestId('discussion-list')).toBeInTheDocument();
    expect(discussionListProps[0].team).toBe(currentTeam);
    expect(discussionListProps[0].store.currentUrl).toBe(store.currentUrl);
    expect(discussionListProps[0].isMobile).toBe(false);
  });

  it('toggles theme when the lens icon is clicked', async () => {
    const currentUser = createCurrentUser({ darkTheme: true });
    const store = makeStore({ currentUser, currentTeam: createCurrentTeam() });

    render(
      <Layout store={store} firstGridItem>
        <div>Content</div>
      </Layout>,
    );

    expect(screen.getByTestId('lens-icon')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('lens-icon'));
    expect(currentUser.toggleTheme).toHaveBeenCalledWith(!currentUser.darkTheme);
  });

  it('hides the lens icon and tagline on mobile or create-team routes', () => {
    const currentTeam = createCurrentTeam();
    const store = makeStore({
      currentTeam,
      currentUser: createCurrentUser(),
      currentUrl: '/create-team',
    });

    render(
      <Layout store={store} firstGridItem isMobile>
        <span>Mobile view</span>
      </Layout>,
    );

    expect(screen.queryByTestId('lens-icon')).not.toBeInTheDocument();
    expect(screen.queryByText(/Check up our latest project/i)).not.toBeInTheDocument();
    expect(screen.getByText('Mobile view')).toBeInTheDocument();
  });
});
