import notify from '../notify';

// Mock the Notifier module
jest.mock('../../components/common/Notifier', () => ({
  openSnackbarExternal: jest.fn(),
}));

import { openSnackbarExternal } from '../../components/common/Notifier';

describe('notify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calls openSnackbarExternal with message from obj.message when message exists', () => {
    // Arrange
    const testMessage = 'Test notification message';
    const obj = { message: testMessage };

    // Act
    notify(obj);

    // Assert
    expect(openSnackbarExternal).toHaveBeenCalledTimes(1);
    expect(openSnackbarExternal).toHaveBeenCalledWith({ message: testMessage });
  });

  test('calls openSnackbarExternal with obj.toString() when obj.message is undefined', () => {
    // Arrange
    const obj = { type: 'error', code: 404 };
    const expectedMessage = obj.toString();

    // Act
    notify(obj);

    // Assert
    expect(openSnackbarExternal).toHaveBeenCalledTimes(1);
    expect(openSnackbarExternal).toHaveBeenCalledWith({ message: expectedMessage });
  });

  test('calls openSnackbarExternal with obj.toString() when obj.message is null', () => {
    // Arrange
    const obj = { message: null, type: 'warning' };
    const expectedMessage = obj.toString();

    // Act
    notify(obj);

    // Assert
    expect(openSnackbarExternal).toHaveBeenCalledTimes(1);
    expect(openSnackbarExternal).toHaveBeenCalledWith({ message: expectedMessage });
  });

  test('calls openSnackbarExternal with obj.toString() when obj.message is empty string', () => {
    // Arrange
    const obj = { message: '', type: 'info' };
    const expectedMessage = obj.toString();

    // Act
    notify(obj);

    // Assert
    expect(openSnackbarExternal).toHaveBeenCalledTimes(1);
    expect(openSnackbarExternal).toHaveBeenCalledWith({ message: expectedMessage });
  });

  test('handles string input by calling toString() on the string', () => {
    // Arrange
    const messageString = 'Direct string message';

    // Act
    notify(messageString);

    // Assert
    expect(openSnackbarExternal).toHaveBeenCalledTimes(1);
    expect(openSnackbarExternal).toHaveBeenCalledWith({ message: messageString });
  });

  test('handles number input by calling toString() on the number', () => {
    // Arrange
    const numberInput = 42;

    // Act
    notify(numberInput);

    // Assert
    expect(openSnackbarExternal).toHaveBeenCalledTimes(1);
    expect(openSnackbarExternal).toHaveBeenCalledWith({ message: numberInput.toString() });
  });

  test('handles Error object by using obj.message property', () => {
    // Arrange
    const error = new Error('Test error message');

    // Act
    notify(error);

    // Assert
    expect(openSnackbarExternal).toHaveBeenCalledTimes(1);
    expect(openSnackbarExternal).toHaveBeenCalledWith({ message: 'Test error message' });
  });
});
