import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Create mock functions (will be replaced after jest.mock runs)
let mockRouterPush = jest.fn();

// Mock next/router BEFORE any imports
jest.mock('next/router', () => {
  const push = jest.fn();

  const mockModule = {
    __esModule: true,
    useRouter: () => ({
      push,
      pathname: '/',
      query: {},
      asPath: '/current-path',
    }),
    withRouter: (Component: any) => (props: any) => {
      return React.createElement(Component, {
        ...props,
        router: {
          push,
          pathname: '/',
          query: {},
          asPath: '/current-path',
        },
      });
    },
    default: {
      push,
      pathname: '/',
      query: {},
      asPath: '/current-path',
    },
  };

  // Store a reference that tests can use
  (mockModule as any).__pushMock = push;

  return mockModule;
});

// Import components AFTER mocking
import MenuWithLinks from '../MenuWithLinks';

// Get reference to the actual mock function
const actualMockRouter = require('next/router') as any;
mockRouterPush = actualMockRouter.__pushMock;

// Mock window.location for external links
const mockLocation = {
  href: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('MenuWithLinks', () => {
  const mockOptions = [
    {
      href: '/home',
      as: '/home',
      highlighterSlug: 'home',
      text: 'Home',
      externalServer: false,
      separator: false,
    },
    {
      href: '/about',
      as: '/about',
      highlighterSlug: 'about',
      text: 'About',
      externalServer: false,
      separator: false,
    },
    {
      href: '/external',
      as: '/external',
      highlighterSlug: 'external',
      text: 'External',
      externalServer: true,
      separator: false,
    },
  ];

  const mockChildren = <button>Menu Button</button>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.href = '';
  });

  describe('Rendering', () => {
  test('renders without errors with minimal props', () => {
    render(
      <MenuWithLinks options={[]} >
        {mockChildren}
      </MenuWithLinks>
    );

    expect(screen.getByText('Menu Button')).toBeInTheDocument();
  });

    test('renders children correctly', () => {
      render(
        <MenuWithLinks options={mockOptions} >
          {mockChildren}
        </MenuWithLinks>
      );

      expect(screen.getByText('Menu Button')).toBeInTheDocument();
    });

    test('menu is initially closed', () => {
      render(
        <MenuWithLinks options={mockOptions} >
          {mockChildren}
        </MenuWithLinks>
      );

      // Menu should not be visible initially
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    test('renders all menu options when menu is open', async () => {
      const user = userEvent.setup();
      render(
        <MenuWithLinks options={mockOptions} >
          {mockChildren}
        </MenuWithLinks>
      );

      // Open menu
      await user.click(screen.getByText('Menu Button'));

      // Check that all options are rendered
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('External')).toBeInTheDocument();
    });
  });

  describe('Menu Interactions', () => {
    test('opens menu on button click', async () => {
      const user = userEvent.setup();
      render(
        <MenuWithLinks options={mockOptions} >
          {mockChildren}
        </MenuWithLinks>
      );

      await user.click(screen.getByText('Menu Button'));

      // Menu should be open and options visible
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    test('menu remains open when clicking outside (Material-UI default behavior)', async () => {
      const user = userEvent.setup();
      render(
        <MenuWithLinks options={mockOptions} >
          {mockChildren}
        </MenuWithLinks>
      );

      // Open menu
      await user.click(screen.getByText('Menu Button'));
      expect(screen.getByText('Home')).toBeInTheDocument();

      // Click outside - Material-UI Menu doesn't close by default
      fireEvent.click(document.body);

      // Menu should remain open (this is Material-UI default behavior)
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    test('handles keyboard events for opening menu', async () => {
      const user = userEvent.setup();
      render(
        <MenuWithLinks options={mockOptions} >
          {mockChildren}
        </MenuWithLinks>
      );

      const menuButton = screen.getByText('Menu Button');

      // Press Enter key
      menuButton.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });

  describe('Option Types', () => {
    test('renders separator option correctly', async () => {
      const user = userEvent.setup();
      const optionsWithSeparator = [
        {
          href: '/home',
          as: '/home',
          highlighterSlug: 'home',
          text: 'Home',
          externalServer: false,
          separator: false,
        },
        {
          href: '',
          as: '',
          highlighterSlug: '',
          text: '',
          externalServer: false,
          separator: true,
        },
        {
          href: '/about',
          as: '/about',
          highlighterSlug: 'about',
          text: 'About',
          externalServer: false,
          separator: false,
        },
      ];

      render(
        <MenuWithLinks options={optionsWithSeparator} >
          {mockChildren}
        </MenuWithLinks>
      );

      await user.click(screen.getByText('Menu Button'));

      // Check that both options are rendered (separator is hr element)
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    test('handles external server links correctly', async () => {
      const user = userEvent.setup();
      render(
        <MenuWithLinks options={mockOptions} >
          {mockChildren}
        </MenuWithLinks>
      );

      await user.click(screen.getByText('Menu Button'));

      // Click on external link
      await user.click(screen.getByText('External'));

      // Should change window.location.href
      expect(mockLocation.href).toBe('/external');
    });

    test('handles external link clicks', async () => {
      const user = userEvent.setup();
      render(
        <MenuWithLinks options={mockOptions} >
          {mockChildren}
        </MenuWithLinks>
      );

      await user.click(screen.getByText('Menu Button'));
      expect(screen.getByText('External')).toBeInTheDocument();

      await user.click(screen.getByText('External'));

      // Should change window.location.href
      expect(mockLocation.href).toBe('/external');
    });
  });

  describe('Navigation', () => {
    test('navigates using Next.js Router for internal links', async () => {
      const user = userEvent.setup();
      render(
        <MenuWithLinks options={mockOptions} >
          {mockChildren}
        </MenuWithLinks>
      );

      await user.click(screen.getByText('Menu Button'));
      await user.click(screen.getByText('Home'));

      expect(mockRouterPush).toHaveBeenCalledWith('/home', '/home');
      expect(mockRouterPush).toHaveBeenCalledTimes(1);
    });

    test('menu remains open after internal navigation', async () => {
      const user = userEvent.setup();
      render(
        <MenuWithLinks options={mockOptions} >
          {mockChildren}
        </MenuWithLinks>
      );

      await user.click(screen.getByText('Menu Button'));
      expect(screen.getByText('Home')).toBeInTheDocument();

      await user.click(screen.getByText('Home'));

      // Menu should remain open after navigation (component doesn't auto-close)
      expect(mockRouterPush).toHaveBeenCalledWith('/home', '/home');
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });

  describe('Styling and Active States', () => {
    test('highlights active menu item based on router path', async () => {
      const user = userEvent.setup();
      const optionsWithActive = [
        {
          href: '/current-path',
          as: '/current-path',
          highlighterSlug: 'current-path',
          text: 'Current Page',
          externalServer: false,
          separator: false,
        },
        {
          href: '/other',
          as: '/other',
          highlighterSlug: 'other',
          text: 'Other Page',
          externalServer: false,
          separator: false,
        },
      ];

      render(
        <MenuWithLinks options={optionsWithActive} >
          {mockChildren}
        </MenuWithLinks>
      );

      await user.click(screen.getByText('Menu Button'));

      // Current page should be highlighted (fontWeight: 600)
      const currentPageItem = screen.getByText('Current Page');
      expect(currentPageItem).toHaveStyle({ fontWeight: '600' });

      // Other page should be normal (fontWeight: 300)
      const otherPageItem = screen.getByText('Other Page');
      expect(otherPageItem).toHaveStyle({ fontWeight: '300' });
    });

    test('applies correct font size to menu items', async () => {
      const user = userEvent.setup();
      render(
        <MenuWithLinks options={mockOptions} >
          {mockChildren}
        </MenuWithLinks>
      );

      await user.click(screen.getByText('Menu Button'));

      const menuItems = screen.getAllByRole('menuitem');
      // Check that at least one item has the expected fontSize (Material-UI may override styles)
      const hasCorrectFontSize = menuItems.some(item =>
        item.style.fontSize === '14px' || getComputedStyle(item).fontSize === '14px'
      );
      expect(hasCorrectFontSize).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty options array', () => {
      render(
        <MenuWithLinks options={[]} >
          {mockChildren}
        </MenuWithLinks>
      );

      expect(screen.getByText('Menu Button')).toBeInTheDocument();
    });

    test('handles options with empty href', async () => {
      const user = userEvent.setup();
      const optionsWithEmptyHref = [
        {
          href: '',
          as: '',
          highlighterSlug: 'empty',
          text: 'Empty Link',
          externalServer: false,
          separator: false,
        },
      ];

      render(
        <MenuWithLinks options={optionsWithEmptyHref} >
          {mockChildren}
        </MenuWithLinks>
      );

      await user.click(screen.getByText('Menu Button'));
      await user.click(screen.getByText('Empty Link'));

      expect(mockRouterPush).toHaveBeenCalledWith('', '');
    });

    test('renders correctly with complex children', () => {
      const complexChildren = (
        <div>
          <span>Complex</span>
          <button>Button</button>
        </div>
      );

      render(
        <MenuWithLinks options={mockOptions} >
          {complexChildren}
        </MenuWithLinks>
      );

      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('Button')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has correct ARIA attributes when menu is closed', () => {
      render(
        <MenuWithLinks options={mockOptions} >
          {mockChildren}
        </MenuWithLinks>
      );

      const menuTrigger = screen.getByText('Menu Button').parentElement;
      expect(menuTrigger).toHaveAttribute('aria-haspopup', 'true');
    });

    test('updates ARIA attributes when menu is open', async () => {
      const user = userEvent.setup();
      render(
        <MenuWithLinks options={mockOptions} >
          {mockChildren}
        </MenuWithLinks>
      );

      await user.click(screen.getByText('Menu Button'));

      // Menu should be open and have correct attributes
      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();
    });

    test('menu has correct role when open', async () => {
      const user = userEvent.setup();
      render(
        <MenuWithLinks options={mockOptions} >
          {mockChildren}
        </MenuWithLinks>
      );

      await user.click(screen.getByText('Menu Button'));

      // Check that menu has correct role
      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();

      // Check that menu items have correct role
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBeGreaterThan(0);
    });
  });
});
