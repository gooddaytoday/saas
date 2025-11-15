import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import MenuWithMenuItems from '../MenuWithMenuItems';

describe('MenuWithMenuItems', () => {
  const mockMenuOptions = {
    id: 'test-menu',
    dataId: 'menu-trigger',
  };

  const mockItemOptions = [
    {
      dataId: 'item-1',
      dataMoreId: 'more-1',
      text: 'Option 1',
      onClick: jest.fn(),
    },
    {
      dataId: 'item-2',
      dataMoreId: 'more-2',
      text: 'Option 2',
      onClick: jest.fn(),
    },
    {
      dataId: 'item-3',
      dataMoreId: 'more-3',
      text: 'Option 3',
      onClick: jest.fn(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders without errors with minimal props', () => {
      render(<MenuWithMenuItems menuOptions={mockMenuOptions} itemOptions={[]} />);

      // Component should render without throwing
      expect(document.body).toBeInTheDocument();
    });

    test('renders MoreVertIcon with correct attributes', () => {
      render(<MenuWithMenuItems menuOptions={mockMenuOptions} itemOptions={mockItemOptions} />);

      const icon = screen.getByTestId('MoreVertIcon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-haspopup', 'true');
      expect(icon).not.toHaveAttribute('aria-controls'); // Menu closed initially, no aria-controls
    });

    test('menu is initially closed', () => {
      render(<MenuWithMenuItems menuOptions={mockMenuOptions} itemOptions={mockItemOptions} />);

      // Menu should not be visible initially
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    test('renders all menu items when menu is open', async () => {
      const user = userEvent.setup();
      render(<MenuWithMenuItems menuOptions={mockMenuOptions} itemOptions={mockItemOptions} />);

      // Open menu
      await user.click(screen.getByTestId('MoreVertIcon'));

      // Check that all options are rendered
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });
  });

  describe('Menu Interactions', () => {
    test('opens menu on icon click', async () => {
      const user = userEvent.setup();
      render(<MenuWithMenuItems menuOptions={mockMenuOptions} itemOptions={mockItemOptions} />);

      await user.click(screen.getByTestId('MoreVertIcon'));

      // Menu should be open and options visible
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    test('updates ARIA attributes when menu opens', async () => {
      const user = userEvent.setup();
      render(<MenuWithMenuItems menuOptions={mockMenuOptions} itemOptions={mockItemOptions} />);

      const icon = screen.getByTestId('MoreVertIcon');
      expect(icon).not.toHaveAttribute('aria-controls');

      await user.click(icon);

      expect(icon).toHaveAttribute('aria-controls', 'test-menu');
    });

    test('closes menu when pressing Escape', async () => {
      const user = userEvent.setup();
      render(<MenuWithMenuItems menuOptions={mockMenuOptions} itemOptions={mockItemOptions} />);

      // Open menu
      await user.click(screen.getByTestId('MoreVertIcon'));
      expect(screen.getByText('Option 1')).toBeInTheDocument();

      // Press Escape key
      await user.keyboard('{Escape}');

      // Menu should close
      await waitFor(() => {
        expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
      });
    });

    test('closes menu when clicking on backdrop', async () => {
      const user = userEvent.setup();
      render(<MenuWithMenuItems menuOptions={mockMenuOptions} itemOptions={mockItemOptions} />);

      // Open menu
      await user.click(screen.getByTestId('MoreVertIcon'));
      expect(screen.getByText('Option 1')).toBeInTheDocument();

      // Click on backdrop (Material-UI backdrop element)
      const backdrop = document.querySelector('.MuiBackdrop-root');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      await waitFor(() => {
        expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
      });
    });
  });

  describe('Menu Item Interactions', () => {
    test('calls onClick callback when menu item is clicked', async () => {
      const user = userEvent.setup();
      render(<MenuWithMenuItems menuOptions={mockMenuOptions} itemOptions={mockItemOptions} />);

      // Open menu
      await user.click(screen.getByTestId('MoreVertIcon'));

      // Click on first menu item
      await user.click(screen.getByText('Option 1'));

      // Callback should be called
      expect(mockItemOptions[0].onClick).toHaveBeenCalledTimes(1);
    });

    test('closes menu after clicking menu item', async () => {
      const user = userEvent.setup();
      render(<MenuWithMenuItems menuOptions={mockMenuOptions} itemOptions={mockItemOptions} />);

      // Open menu
      await user.click(screen.getByTestId('MoreVertIcon'));
      expect(screen.getByText('Option 1')).toBeInTheDocument();

      // Click on menu item
      await user.click(screen.getByText('Option 1'));

      // Menu should close
      await waitFor(() => {
        expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
      });
    });

    test('calls correct callback for each menu item', async () => {
      const user = userEvent.setup();
      render(<MenuWithMenuItems menuOptions={mockMenuOptions} itemOptions={mockItemOptions} />);

      // Open menu
      await user.click(screen.getByTestId('MoreVertIcon'));

      // Click on second menu item
      await user.click(screen.getByText('Option 2'));

      // Only second callback should be called
      expect(mockItemOptions[0].onClick).not.toHaveBeenCalled();
      expect(mockItemOptions[1].onClick).toHaveBeenCalledTimes(1);
      expect(mockItemOptions[2].onClick).not.toHaveBeenCalled();
    });
  });

  describe('Data Attributes', () => {
    test('menu items have correct data-id attributes', async () => {
      const user = userEvent.setup();
      render(<MenuWithMenuItems menuOptions={mockMenuOptions} itemOptions={mockItemOptions} />);

      await user.click(screen.getByTestId('MoreVertIcon'));

      // Check data attributes on menu items
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(3);

      expect(menuItems[0]).toHaveAttribute('data-id', 'item-1');
      expect(menuItems[1]).toHaveAttribute('data-id', 'item-2');
      expect(menuItems[2]).toHaveAttribute('data-id', 'item-3');
    });

    test('menu items have correct data-more-id attributes', async () => {
      const user = userEvent.setup();
      render(<MenuWithMenuItems menuOptions={mockMenuOptions} itemOptions={mockItemOptions} />);

      await user.click(screen.getByTestId('MoreVertIcon'));

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems[0]).toHaveAttribute('data-more-id', 'more-1');
      expect(menuItems[1]).toHaveAttribute('data-more-id', 'more-2');
      expect(menuItems[2]).toHaveAttribute('data-more-id', 'more-3');
    });

    test('icon has correct data-id attribute', () => {
      render(<MenuWithMenuItems menuOptions={mockMenuOptions} itemOptions={mockItemOptions} />);

      const icon = screen.getByTestId('MoreVertIcon');
      expect(icon).toHaveAttribute('data-id', 'menu-trigger');
    });
  });

  describe('Accessibility', () => {
    test('icon has aria-haspopup attribute', () => {
      render(<MenuWithMenuItems menuOptions={mockMenuOptions} itemOptions={mockItemOptions} />);

      const icon = screen.getByTestId('MoreVertIcon');
      expect(icon).toHaveAttribute('aria-haspopup', 'true');
    });

    test('menu has correct id when open', async () => {
      const user = userEvent.setup();
      render(<MenuWithMenuItems menuOptions={mockMenuOptions} itemOptions={mockItemOptions} />);

      await user.click(screen.getByTestId('MoreVertIcon'));

      // Menu id is on the presentation div, not the ul
      const menuContainer = screen.getByRole('presentation');
      expect(menuContainer).toHaveAttribute('id', 'test-menu');
    });

    test('menu items have correct role', async () => {
      const user = userEvent.setup();
      render(<MenuWithMenuItems menuOptions={mockMenuOptions} itemOptions={mockItemOptions} />);

      await user.click(screen.getByTestId('MoreVertIcon'));

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(3);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty itemOptions array', () => {
      render(<MenuWithMenuItems menuOptions={mockMenuOptions} itemOptions={[]} />);

      // Should render without menu items
      expect(screen.getByTestId('MoreVertIcon')).toBeInTheDocument();
    });

    test('handles single menu item', async () => {
      const user = userEvent.setup();
      const singleItem = [mockItemOptions[0]];

      render(<MenuWithMenuItems menuOptions={mockMenuOptions} itemOptions={singleItem} />);

      await user.click(screen.getByTestId('MoreVertIcon'));
      expect(screen.getByText('Option 1')).toBeInTheDocument();

      await user.click(screen.getByText('Option 1'));
      expect(singleItem[0].onClick).toHaveBeenCalledTimes(1);
    });

    test('handles menuOptions without dataId', () => {
      const menuOptionsWithoutDataId = {
        id: 'test-menu',
      };

      render(
        <MenuWithMenuItems menuOptions={menuOptionsWithoutDataId} itemOptions={mockItemOptions} />,
      );

      // Should render without throwing
      expect(document.body).toBeInTheDocument();
    });

    test('handles menuOptions without id', () => {
      const menuOptionsWithoutId = {
        dataId: 'menu-trigger',
      };

      render(
        <MenuWithMenuItems menuOptions={menuOptionsWithoutId} itemOptions={mockItemOptions} />,
      );

      // Should render without throwing
      expect(document.body).toBeInTheDocument();
    });

    test('handles itemOptions with missing properties', () => {
      const incompleteItemOptions = [
        {
          dataId: 'item-1',
          text: 'Option 1',
          onClick: jest.fn(),
          // missing dataMoreId
        },
      ];

      render(
        <MenuWithMenuItems menuOptions={mockMenuOptions} itemOptions={incompleteItemOptions} />,
      );

      // Should render without throwing
      expect(screen.getByTestId('MoreVertIcon')).toBeInTheDocument();
    });
  });
});
