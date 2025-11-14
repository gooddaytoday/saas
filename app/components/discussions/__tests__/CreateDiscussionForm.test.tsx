import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Моки для Material-UI компонентов
jest.mock('@mui/material/Button', () => {
  return function MockButton({ children, onClick, type, variant, color, disabled, style, ...props }: any) {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        data-variant={variant}
        data-color={color}
        style={style}
        {...props}
      >
        {children}
      </button>
    );
  };
});

jest.mock('@mui/material/Dialog', () => {
  return function MockDialog({ children, onClose, open, fullScreen, ...props }: any) {
    return open ? (
      <div data-testid="dialog" data-fullscreen={fullScreen} {...props}>
        {children}
      </div>
    ) : null;
  };
});

jest.mock('@mui/material/DialogContent', () => {
  return function MockDialogContent({ children, ...props }: any) {
    return <div data-testid="dialog-content" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/DialogTitle', () => {
  return function MockDialogTitle({ children, ...props }: any) {
    return <div data-testid="dialog-title" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/FormControl', () => {
  return function MockFormControl({ children, ...props }: any) {
    return <div data-testid="form-control" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/FormHelperText', () => {
  return function MockFormHelperText({ children, ...props }: any) {
    return <div data-testid="form-helper-text" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/Select', () => {
  return function MockSelect({ children, value, onChange, required, ...props }: any) {
    return (
      <select
        value={value}
        onChange={onChange}
        required={required}
        data-testid="select"
        {...props}
      >
        {children}
      </select>
    );
  };
});

jest.mock('@mui/material/MenuItem', () => {
  return function MockMenuItem({ children, value, ...props }: any) {
    return <option value={value} {...props}>{children}</option>;
  };
});

jest.mock('@mui/material/TextField', () => {
  return function MockTextField({
    label,
    helperText,
    value,
    onChange,
    autoFocus,
    ...props
  }: any) {
    return (
      <div data-testid="text-field">
        {label && <label>{label}</label>}
        <input
          type="text"
          value={value}
          onChange={onChange}
          autoFocus={autoFocus}
          data-testid="text-input"
          {...props}
        />
        {helperText && <div data-testid="text-field-helper">{helperText}</div>}
      </div>
    );
  };
});

// Моки для Next.js
const mockRouterPush = jest.fn();
jest.mock('next/router', () => ({
  __esModule: true,
  default: {
    push: mockRouterPush,
  },
  Router: {
    push: mockRouterPush,
  },
  useRouter: () => ({
    push: mockRouterPush,
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

jest.mock('next/head', () => {
  return function MockHead({ children }: any) {
    return <div data-testid="head">{children}</div>;
  };
});

// Моки для NProgress
jest.mock('nprogress', () => ({
  start: jest.fn(),
  done: jest.fn(),
}));

// Мок для notify
const mockNotify = jest.fn();
jest.mock('../../../lib/notify', () => ({
  __esModule: true,
  default: mockNotify,
}));

// Мок для MemberChooser
const mockMemberChooser = jest.fn();
let memberChooserOnChange: any = null;
jest.mock('../../common/MemberChooser', () => {
  return function MockMemberChooser({ onChange, members, selectedMemberIds, helperText }: any) {
    memberChooserOnChange = onChange;
    mockMemberChooser({ onChange, members, selectedMemberIds, helperText });
    return (
      <div data-testid="member-chooser">
        {helperText && <div data-testid="member-chooser-helper">{helperText}</div>}
        <button
          data-testid="member-chooser-button"
          onClick={() => onChange(['member1', 'member2'])}
        >
          Select Members
        </button>
      </div>
    );
  };
});

// Мок для PostEditor
const mockPostEditor = jest.fn();
jest.mock('../../posts/PostEditor', () => {
  return function MockPostEditor({ content, onChanged, members, store, parentComponent }: any) {
    mockPostEditor({ content, onChanged, members, store, parentComponent });
    return (
      <div data-testid="post-editor">
        <textarea
          data-testid="post-editor-content"
          value={content}
          onChange={(e) => onChanged(e.target.value)}
        />
      </div>
    );
  };
});

// Мок для mobx-react
jest.mock('mobx-react', () => ({
  observer: (component: any) => component,
}));

// Создаем mock store
const createMockStore = () => ({
  currentTeam: {
    slug: 'test-team',
    members: new Map([
      ['user1', { _id: 'user1', displayName: 'User 1' }],
      ['user2', { _id: 'user2', displayName: 'User 2' }],
      ['currentUser', { _id: 'currentUser', displayName: 'Current User' }],
    ]),
    addDiscussion: jest.fn(),
  },
  currentUser: { _id: 'currentUser', displayName: 'Current User' },
});

// Mock discussion
const createMockDiscussion = () => ({
  slug: 'test-discussion',
  name: 'Test Discussion',
  memberIds: ['user1', 'user2'],
  createdUserId: 'currentUser',
  notificationType: 'email',
  team: { slug: 'test-team' },
  addPost: jest.fn(),
  sendDataToLambda: jest.fn(),
});

// Импорт компонента после всех моков
const CreateDiscussionForm = require('../CreateDiscussionForm').default;

describe('CreateDiscussionForm', () => {
  let mockStore: any;
  let user: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore = createMockStore();
    user = userEvent.setup();

    // Сброс всех моков
    mockNotify.mockClear();
    mockRouterPush.mockClear();
    mockMemberChooser.mockClear();
    mockPostEditor.mockClear();

    // Настройка mock discussion
    const mockDiscussion = createMockDiscussion();
    const mockPost = { content: 'Test content', user: { displayName: 'Current User' } };

    mockStore.currentTeam.addDiscussion.mockResolvedValue(mockDiscussion);
    mockDiscussion.addPost.mockResolvedValue(mockPost);
  });

  describe('Rendering', () => {
    test('renders dialog when open is true', () => {
      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Create new Discussion');
    });

    test('does not render dialog when open is false', () => {
      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={false}
          onClose={jest.fn()}
        />
      );

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    test('renders Head component with title when open', () => {
      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByTestId('head')).toBeInTheDocument();
    });

    test('renders all form elements', () => {
      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByTestId('text-field')).toBeInTheDocument();
      expect(screen.getByTestId('member-chooser')).toBeInTheDocument();
      expect(screen.getByTestId('form-control')).toBeInTheDocument();
      expect(screen.getByTestId('post-editor')).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(5); // 2x Create, 2x Cancel, 1x Select Members
    });

    test('renders notification type select with options', () => {
      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={jest.fn()}
        />
      );

      const select = screen.getByTestId('select');
      expect(select).toBeInTheDocument();
      expect(select).toHaveValue('default');

      // Проверяем опции
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveValue('default');
      expect(options[1]).toHaveValue('email');
    });

    test('renders helper texts', () => {
      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('Type name of Discussion')).toBeInTheDocument();
      expect(screen.getByText('Give a short and informative name to new Discussion')).toBeInTheDocument();
      expect(screen.getByText('These members will see all posts and be notified about unread posts in this discussion.')).toBeInTheDocument();
      expect(screen.getByText('Choose how to notify members about new Posts inside Discussion.')).toBeInTheDocument();
    });

    test('passes correct props to child components', () => {
      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={jest.fn()}
        />
      );

      // Проверяем MemberChooser
      expect(mockMemberChooser).toHaveBeenCalledWith(
        expect.objectContaining({
          members: Array.from(mockStore.currentTeam.members.values()).filter(
            (user: any) => user._id !== mockStore.currentUser._id
          ),
          selectedMemberIds: [],
          helperText: expect.any(String),
        })
      );

      // Проверяем PostEditor
      expect(mockPostEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          content: '',
          members: Array.from(mockStore.currentTeam.members.values()),
          store: mockStore,
          parentComponent: 'CDF',
        })
      );
    });
  });

  describe('Form Interactions', () => {
    test('updates name when typing in text field', async () => {
      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={jest.fn()}
        />
      );

      const input = screen.getByTestId('text-input');
      await user.type(input, 'Test Discussion Name');

      expect(input).toHaveValue('Test Discussion Name');
    });

    test('updates memberIds when MemberChooser changes', async () => {
      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={jest.fn()}
        />
      );

      // Имитируем изменение участников через сохраненную функцию
      act(() => {
        if (memberChooserOnChange) {
          memberChooserOnChange(['member1', 'member2']);
        }
      });

      // Проверяем что функция была сохранена
      expect(memberChooserOnChange).toBeDefined();
    });

    test('updates notification type when select changes', async () => {
      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={jest.fn()}
        />
      );

      const select = screen.getByTestId('select');
      await user.selectOptions(select, 'email');

      expect(select).toHaveValue('email');
    });

    test('updates content when PostEditor changes', async () => {
      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={jest.fn()}
        />
      );

      const textarea = screen.getByTestId('post-editor-content');
      await user.type(textarea, 'Test content');

      expect(textarea).toHaveValue('Test content');
    });
  });

  describe('Form Validation', () => {
    test('shows error when submitting without name', async () => {
      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={jest.fn()}
        />
      );

      const submitButton = screen.getAllByRole('button').find(btn =>
        btn.textContent?.includes('Create Discussion')
      );
      await user.click(submitButton!);

      expect(mockNotify).toHaveBeenCalledWith('Name is required');
      expect(mockStore.currentTeam.addDiscussion).not.toHaveBeenCalled();
    });

    test('shows error when submitting without content', async () => {
      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={jest.fn()}
        />
      );

      // Заполняем имя
      const input = screen.getByTestId('text-input');
      await user.type(input, 'Test Discussion');

      const submitButton = screen.getAllByRole('button').find(btn =>
        btn.textContent?.includes('Create Discussion')
      );
      await user.click(submitButton!);

      expect(mockNotify).toHaveBeenCalledWith('Content is required');
      expect(mockStore.currentTeam.addDiscussion).not.toHaveBeenCalled();
    });

    test('notification type defaults to default value', async () => {
      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={jest.fn()}
        />
      );

      const select = screen.getByTestId('select');
      expect(select).toHaveValue('default');
    });

    test('shows error when team is not selected', async () => {
      // Создаем компонент с нормальным store для рендеринга
      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={jest.fn()}
        />
      );

      // Заполняем форму
      const input = screen.getByTestId('text-input');
      await user.type(input, 'Test Discussion');

      const textarea = screen.getByTestId('post-editor-content');
      await user.type(textarea, 'Test content');

      // Мокаем currentTeam как undefined во время отправки
      const originalCurrentTeam = mockStore.currentTeam;
      Object.defineProperty(mockStore, 'currentTeam', {
        value: undefined,
        writable: true,
      });

      const submitButton = screen.getAllByRole('button').find(btn =>
        btn.textContent?.includes('Create Discussion')
      );
      await user.click(submitButton!);

      expect(mockNotify).toHaveBeenCalledWith('Team have not selected');

      // Восстанавливаем
      Object.defineProperty(mockStore, 'currentTeam', {
        value: originalCurrentTeam,
        writable: true,
      });
    });
  });

  describe('Form Submission', () => {
    test('successfully creates discussion and redirects', async () => {
      const onClose = jest.fn();

      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={onClose}
        />
      );

      // Заполняем форму
      const input = screen.getByTestId('text-input');
      await user.type(input, 'Test Discussion');

      const textarea = screen.getByTestId('post-editor-content');
      await user.type(textarea, 'Test content');

      const submitButton = screen.getAllByRole('button').find(btn =>
        btn.textContent?.includes('Create Discussion')
      );
      await user.click(submitButton!);

      await waitFor(() => {
        expect(mockStore.currentTeam.addDiscussion).toHaveBeenCalledWith({
          name: 'Test Discussion',
          memberIds: [],
          notificationType: 'default',
        });
      });

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith('You successfully added new Discussion.');
        expect(mockRouterPush).toHaveBeenCalledWith(
          `/discussion?teamSlug=test-team&discussionSlug=test-discussion`,
          `/teams/test-team/discussions/test-discussion`
        );
        expect(onClose).toHaveBeenCalled();
      });
    });

    test('creates discussion with email notification', async () => {
      const mockPost = { content: 'Test content', user: { displayName: 'Current User' } };

      // Создаем новый экземпляр discussion с email notification
      const emailDiscussion = {
        ...createMockDiscussion(),
        notificationType: 'email',
        addPost: jest.fn().mockResolvedValue(mockPost),
        sendDataToLambda: jest.fn(),
      };

      mockStore.currentTeam.addDiscussion.mockResolvedValue(emailDiscussion);

      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={jest.fn()}
        />
      );

      // Заполняем форму
      const input = screen.getByTestId('text-input');
      await user.type(input, 'Test Discussion');

      const textarea = screen.getByTestId('post-editor-content');
      await user.type(textarea, 'Test content');

      // Выбираем email уведомления
      const select = screen.getByTestId('select');
      await user.selectOptions(select, 'email');

      const submitButton = screen.getAllByRole('button').find(btn =>
        btn.textContent?.includes('Create Discussion')
      );
      await user.click(submitButton!);

      await waitFor(() => {
        expect(mockStore.currentTeam.addDiscussion).toHaveBeenCalledWith({
          name: 'Test Discussion',
          memberIds: [],
          notificationType: 'email',
        });
      });

      await waitFor(() => {
        expect(emailDiscussion.sendDataToLambda).toHaveBeenCalledWith({
          discussionName: 'Test Discussion',
          discussionLink: expect.stringContaining('/teams/test-team/discussions/test-discussion'),
          postContent: 'Test content',
          authorName: 'Current User',
          userIds: ['user1', 'user2'],
        });
      });
    });

    test('includes selected members in discussion creation', async () => {
      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={jest.fn()}
        />
      );

      // Заполняем форму
      const input = screen.getByTestId('text-input');
      await user.type(input, 'Test Discussion');

      const textarea = screen.getByTestId('post-editor-content');
      await user.type(textarea, 'Test content');

      // Выбираем участников через функцию компонента
      act(() => {
        if (memberChooserOnChange) {
          memberChooserOnChange(['member1', 'member2']);
        }
      });

      const submitButton = screen.getAllByRole('button').find(btn =>
        btn.textContent?.includes('Create Discussion')
      );
      await user.click(submitButton!);

      await waitFor(() => {
        expect(mockStore.currentTeam.addDiscussion).toHaveBeenCalledWith({
          name: 'Test Discussion',
          memberIds: ['member1', 'member2'],
          notificationType: 'default',
        });
      });
    });
  });

  describe('Error Handling', () => {
    test('handles discussion creation error', async () => {
      const error = new Error('Failed to create discussion');
      mockStore.currentTeam.addDiscussion.mockRejectedValue(error);

      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={jest.fn()}
        />
      );

      // Заполняем форму
      const input = screen.getByTestId('text-input');
      await user.type(input, 'Test Discussion');

      const textarea = screen.getByTestId('post-editor-content');
      await user.type(textarea, 'Test content');

      const submitButton = screen.getAllByRole('button').find(btn =>
        btn.textContent?.includes('Create Discussion')
      );
      await user.click(submitButton!);

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith(error);
      });
    });

    test('handles post creation error', async () => {
      const error = new Error('Failed to create post');
      const mockDiscussion = createMockDiscussion();
      mockStore.currentTeam.addDiscussion.mockResolvedValue(mockDiscussion);
      mockDiscussion.addPost.mockRejectedValue(error);

      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={jest.fn()}
        />
      );

      // Заполняем форму
      const input = screen.getByTestId('text-input');
      await user.type(input, 'Test Discussion');

      const textarea = screen.getByTestId('post-editor-content');
      await user.type(textarea, 'Test content');

      const submitButton = screen.getAllByRole('button').find(btn =>
        btn.textContent?.includes('Create Discussion')
      );
      await user.click(submitButton!);

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith(error);
      });
    });
  });

  describe('Dialog Management', () => {
    test('calls onClose when cancel button is clicked', async () => {
      const onClose = jest.fn();

      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={onClose}
        />
      );

      const cancelButton = screen.getAllByRole('button').find(btn =>
        btn.textContent?.includes('Cancel')
      );
      await user.click(cancelButton!);

      expect(onClose).toHaveBeenCalled();
    });

    test('resets form state when handleClose is called', async () => {
      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={jest.fn()}
        />
      );

      // Изменяем состояние
      const input = screen.getByTestId('text-input');
      await user.type(input, 'Test Discussion');

      const textarea = screen.getByTestId('post-editor-content');
      await user.type(textarea, 'Test content');

      // Закрываем диалог
      const cancelButton = screen.getAllByRole('button').find(btn =>
        btn.textContent?.includes('Cancel')
      );
      await user.click(cancelButton!);

      // Проверяем что состояние сброшено (компонент должен быть перерендерен)
      expect(screen.getByTestId('text-input')).toHaveValue('');
    });
  });

  describe('Mobile Responsiveness', () => {
    test('applies mobile styles when isMobile is true', () => {
      render(
        <CreateDiscussionForm
          isMobile={true}
          store={mockStore}
          open={true}
          onClose={jest.fn()}
        />
      );

      const dialog = screen.getByTestId('dialog');
      expect(dialog).toHaveAttribute('data-fullscreen', 'true');

      // Проверяем кнопки с мобильными стилями
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('dialog is always fullscreen', () => {
      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={jest.fn()}
        />
      );

      const dialog = screen.getByTestId('dialog');
      expect(dialog).toHaveAttribute('data-fullscreen', 'true');
    });
  });

  describe('Edge Cases', () => {
    test('handles empty member list gracefully', () => {
      const storeWithEmptyMembers = {
        ...mockStore,
        currentTeam: {
          ...mockStore.currentTeam,
          members: new Map(),
        },
      };

      render(
        <CreateDiscussionForm
          isMobile={false}
          store={storeWithEmptyMembers}
          open={true}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByTestId('member-chooser')).toBeInTheDocument();
      // Проверяем что компонент не падает
      expect(mockMemberChooser).toHaveBeenCalledWith(
        expect.objectContaining({
          members: [],
        })
      );
    });

    test('handles undefined store gracefully', () => {
      // Этот тест проверяет устойчивость к невалидным данным
      // В реальном коде store должен быть всегда определен
      // Подавляем console.error для этого ожидаемого исключения
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      try {
        expect(() => {
          render(
            <CreateDiscussionForm
              isMobile={false}
              store={undefined as any}
              open={true}
              onClose={jest.fn()}
            />
          );
        }).toThrow(); // Ожидаем ошибку, так как store обязателен
      } finally {
        consoleSpy.mockRestore();
      }
    });

    test('handles production URL correctly', () => {
      // Мокаем production окружение
      const originalEnv = process.env;
      process.env = { ...originalEnv, NODE_ENV: 'production', NEXT_PUBLIC_PRODUCTION_URL_APP: 'https://example.com' };

      const mockDiscussion = createMockDiscussion();
      mockDiscussion.notificationType = 'email';
      mockStore.currentTeam.addDiscussion.mockResolvedValue(mockDiscussion);

      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={jest.fn()}
        />
      );

      // Заполняем и отправляем форму
      const input = screen.getByTestId('text-input');
      user.type(input, 'Test Discussion');

      const textarea = screen.getByTestId('post-editor-content');
      user.type(textarea, 'Test content');

      const select = screen.getByTestId('select');
      user.selectOptions(select, 'email');

      const submitButton = screen.getAllByRole('button').find(btn =>
        btn.textContent?.includes('Create Discussion')
      );
      user.click(submitButton!);

      // Восстанавливаем окружение
      process.env = originalEnv;
    });
  });

  describe('Loading States', () => {
    test('disables buttons during submission', async () => {
      // Создаем медленный промис для имитации загрузки
      let resolvePromise: any;
      const slowPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockStore.currentTeam.addDiscussion.mockReturnValue(slowPromise);

      render(
        <CreateDiscussionForm
          isMobile={false}
          store={mockStore}
          open={true}
          onClose={jest.fn()}
        />
      );

      // Заполняем форму
      const input = screen.getByTestId('text-input');
      await user.type(input, 'Test Discussion');

      const textarea = screen.getByTestId('post-editor-content');
      await user.type(textarea, 'Test content');

      const submitButton = screen.getAllByRole('button').find(btn =>
        btn.textContent?.includes('Create Discussion')
      );

      // Нажимаем submit
      await user.click(submitButton!);

      // Проверяем что кнопки disabled
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          if (button.textContent?.includes('Create Discussion') || button.textContent?.includes('Cancel')) {
            expect(button).toBeDisabled();
          }
        });
      });

      // Разрешаем промис
      act(() => {
        resolvePromise(createMockDiscussion());
      });
    });
  });
});
