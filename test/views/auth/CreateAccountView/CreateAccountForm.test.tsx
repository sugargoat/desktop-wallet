import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CreateAccountForm, {
  createAccountFormOnSubmit,
} from '../../../../app/views/auth/CreateAccountView/CreateAccountForm';
import renderSnapshot from '../../../renderSnapshot';

jest.mock('../../../../app/hooks/useMobileCoinD');

function setupComponent() {
  // Mocks
  const mockOnSubmit = jest.fn();

  // Variables
  const validAccountName64 = '64llllllllllllllllllllllllllllllllllllllllllllllllllllllllllllll';
  const invalidAccountName65 = '65lllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllll';
  const invalidPasswordShort = 'shooort';
  const validPassword99 = 'longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglon';

  const { asFragment, mockUseMobileCoinDValues } = renderSnapshot(
    <CreateAccountForm />,
  );

  // Render Elements
  const form = screen.getByRole('form');
  const accountNameField = screen.getByLabelText('Account Name (optional)', {
    exact: false,
    selector: 'input',
  });
  const passwordField = screen.getByLabelText('Password', {
    exact: true,
    selector: 'input',
  });
  const passwordConfirmationField = screen.getByLabelText(
    'Password Confirmation',
    {
      exact: true,
      selector: 'input',
    },
  );
  const checkTermsField = screen.getByRole('checkbox');
  const termsLink = screen.getByText('Terms of Use');
  const submitButton = screen.getByRole('button', { name: 'Create Account' });

  return {
    accountNameField,
    asFragment,
    checkTermsField,
    form,
    invalidAccountName65,
    invalidPasswordShort,
    mockOnSubmit,
    mockUseMobileCoinDValues,
    passwordConfirmationField,
    passwordField,
    submitButton,
    termsLink,
    validAccountName64,
    validPassword99,
  };
}

function setupOnSubmit() {
  // Mocks
  const mockSetStatus = jest.fn();
  const mockSetSubmitting = jest.fn();
  const mockSetErrors = jest.fn();
  const mockCreateAccount = jest.fn();

  // Variables
  const accountName = 'account name';
  const password = 'password';
  const isMountedRefTrue = { current: true };
  const isMountedRefFalse = { current: false };
  const helpers = {
    setErrors: mockSetErrors,
    setStatus: mockSetStatus,
    setSubmitting: mockSetSubmitting,
  };

  return {
    accountName,
    helpers,
    isMountedRefFalse,
    isMountedRefTrue,
    mockCreateAccount,
    mockSetErrors,
    mockSetStatus,
    mockSetSubmitting,
    password,
  };
}

describe('CreateAccountForm', () => {
  describe('component', () => {
    describe('initalValues', () => {
      test('sets correct initial values', async () => {
        const { form } = setupComponent();
        const expectedInitialValues = {
          accountName: '',
          checkedTerms: false,
          password: '',
          passwordConfirmation: '',
        };

        expect(form).toHaveFormValues(expectedInitialValues);
      });
    });

    describe('validations', () => {
      test('limits account name to 64 characters.', async () => {
        const {
          accountNameField,
          invalidAccountName65,
          validAccountName64,
        } = setupComponent();
        const expectedErrorMessage = 'Account Name cannot be more than 64 characters.';

        // Fill out with too long account name
        userEvent.type(accountNameField, invalidAccountName65);
        userEvent.tab(); // Tab to trigger validations

        // Await because validations are async
        const errorMessage = await screen.findByText(expectedErrorMessage);
        await waitFor(() => {
          expect(errorMessage).toBeInTheDocument();
        });

        // Clear and use name under the limit
        userEvent.clear(accountNameField);
        userEvent.type(accountNameField, validAccountName64);
        userEvent.tab(); // Tab to trigger validations
        await waitFor(() => {
          expect(errorMessage).not.toBeInTheDocument();
        });
      });

      // TODO: Need to test the checkedTerms value
      // this code doesn't work (wishful thinking)
      // test('checkbox is disabled until reading terms', async () => {
      //   const {
      //     checkTermsField,
      //     termsLink,
      //   } = setupComponent();
      //   const expectedTermsMessage =
      //     'You must read the Terms of Use before using the wallet.';

      //   // The checkbox is diabled until user has read terms
      //   userEvent.click(checkTermsField);

      //   const termsMessage = await screen.findByText(expectedTermsMessage);
      //   await waitFor(() => {
      //     expect(termsMessage).toBeInTheDocument();
      //   });

      //   // Reading the terms removes message and allows you to click terms
      //   userEvent.click(termsLink);
      //   const closeTermsDialog = await screen.findByRole('button', {
      //     name: 'closeTerms',
      //   });
      //   userEvent.click(closeTermsDialog);
      //   await waitFor(() => {
      //     expect(termsMessage).not.toBeInTheDocument();
      //   });
      //   userEvent.click(termsLink);
      //   expect(termsLink.value).toBe(true);
      // });

      test('password is required and must be between 8 and 99 characters', async () => {
        const {
          passwordField,
          validPassword99,
          invalidPasswordShort,
        } = setupComponent();
        const expectedShortErrorMessage = 'Password must be at least 8 characters in length.';
        const expectedRequiredErrorMessage = 'Password is required';
        const expectedLongErrorMessage = 'Passwords cannot be more than 99 characters.';

        // Type up to 1 short from valid and check error
        userEvent.type(passwordField, invalidPasswordShort);
        userEvent.tab(); // Tab to trigger validations

        // Await because validations are async
        const shortErrorMessage = await screen.findByText(
          expectedShortErrorMessage,
        );
        await waitFor(() => {
          expect(shortErrorMessage).toBeInTheDocument();
        });

        // Add a character to become valid
        userEvent.type(passwordField, '1');
        userEvent.tab(); // Tab to trigger validations
        await waitFor(() => {
          expect(shortErrorMessage).not.toBeInTheDocument();
        });

        // Clear to show required error
        userEvent.clear(passwordField);
        // Await because validations are async
        const requiredErrorMessage = await screen.findByText(
          expectedRequiredErrorMessage,
        );
        await waitFor(() => {
          expect(requiredErrorMessage).toBeInTheDocument();
          expect(shortErrorMessage).not.toBeInTheDocument();
        });

        // Write a password at maximum valid length + 1
        userEvent.type(passwordField, validPassword99);
        userEvent.type(passwordField, '1');
        userEvent.tab(); // Tab to trigger validations
        // Await because validations are async
        const longErrorMessage = await screen.findByText(
          expectedLongErrorMessage,
        );
        await waitFor(() => {
          expect(longErrorMessage).toBeInTheDocument();
          expect(shortErrorMessage).not.toBeInTheDocument();
          expect(requiredErrorMessage).not.toBeInTheDocument();
        });

        // Finally, backspace to become valid again
        userEvent.type(passwordField, '{backspace}1');
        await waitFor(() => {
          expect(longErrorMessage).not.toBeInTheDocument();
          expect(shortErrorMessage).not.toBeInTheDocument();
          expect(requiredErrorMessage).not.toBeInTheDocument();
        });
      });

      test('password confirmation is required and must match password', async () => {
        const {
          passwordConfirmationField,
          passwordField,
          validPassword99,
        } = setupComponent();
        const expectedMustMatchMessage = 'Must match Password';
        const expectedRequiredErrorMessage = 'Password Confirmation is required';

        // Type different passwords and password confirmations
        userEvent.type(passwordField, validPassword99);
        userEvent.type(
          passwordConfirmationField,
          'something completely different',
        );
        userEvent.tab(); // Tab to trigger validations
        // Await because validations are async
        const mustMatchErrorMessage = await screen.findByText(
          expectedMustMatchMessage,
        );
        await waitFor(() => {
          expect(mustMatchErrorMessage).toBeInTheDocument();
        });

        // Clear password confirmation to get error
        userEvent.clear(passwordConfirmationField);
        userEvent.tab(); // Tab to trigger validations
        // Await because validations are async
        const requiredErrorMessage = await screen.findByText(
          expectedRequiredErrorMessage,
        );
        await waitFor(() => {
          expect(requiredErrorMessage).toBeInTheDocument();
        });

        // Type matching confirmation to dismiss errors
        userEvent.type(passwordConfirmationField, validPassword99);
        userEvent.tab(); // Tab to trigger validations
        await waitFor(() => {
          expect(requiredErrorMessage).not.toBeInTheDocument();
          expect(mustMatchErrorMessage).not.toBeInTheDocument();
        });
      });
    });

    // TODO: Need to test the checkedTerms value
    // this code is imcomplete
    // I think we should pull our the dialog and checkbox state in a higher level
    // and we can pass it's value down as a prop. But this is a TODO
    // describe('submit', () => {
    //   test('calls createAccount hook with a password and accountName', async () => {
    //     const {
    //       mockCreateAccount,
    //       accountNameField,
    //       passwordField,
    //       passwordConfirmationField,
    //       submitButton,
    //       validAccountName64,
    //       validPassword99,
    //     } = setupComponent();
    //     // First tests that the button is disabled
    //     userEvent.click(submitButton);
    //     expect(mockCreateAccount).not.toBeCalled();
    //     await waitFor(() => {
    //       expect(mockCreateAccount).not.toBeCalled();
    //     });

    //     // Enter valid form information
    //     userEvent.type(accountNameField, validAccountName64);
    //     userEvent.type(passwordField, validPassword99);
    //     userEvent.type(passwordConfirmationField, validPassword99);
    //     userEvent.click(submitButton);
    //     await waitFor(() => {
    //       expect(mockCreateAccount).toBeCalledWith(validPassword99);
    //     });
    //   });
    // });

    describe('render', () => {
      test('it renders correctly', async () => {
        const { asFragment } = setupComponent();
        expect(asFragment()).toMatchSnapshot();
      });
    });
  });

  describe('functions', () => {
    // CBB -- I don't like this. But I want to make sure that the correct
    // hooks are being set with the different scenarios.
    describe('createAccountFormOnSubmit', () => {
      test('calls CreateAccount and helpers when mounted', async () => {
        const {
          accountName,
          helpers,
          isMountedRefTrue,
          mockCreateAccount,
          password,
        } = setupOnSubmit();

        const pseudoProps = {
          createAccount: mockCreateAccount,
          isMountedRef: isMountedRefTrue,
        };
        const values = { accountName, password };
        // @ts-ignore mock
        await createAccountFormOnSubmit(pseudoProps, values, helpers);

        expect(mockCreateAccount).toBeCalledWith(accountName, password);
        expect(helpers.setStatus).toBeCalledWith({ success: true });
        expect(helpers.setSubmitting).toBeCalledWith(false);
        expect(helpers.setErrors).not.toBeCalled();
      });

      test('calls CreateAccount and but not helpers when unmounted', async () => {
        const {
          accountName,
          helpers,
          isMountedRefFalse,
          mockCreateAccount,
          password,
        } = setupOnSubmit();

        const pseudoProps = {
          createAccount: mockCreateAccount,
          isMountedRef: isMountedRefFalse,
        };
        const values = { accountName, password };

        // @ts-ignore mock
        await createAccountFormOnSubmit(pseudoProps, values, helpers);

        expect(helpers.setStatus).not.toBeCalled();
        expect(helpers.setSubmitting).not.toBeCalled();
      });

      test('correctly sets helpers when call fails whem mounted', async () => {
        const {
          accountName,
          helpers,
          isMountedRefTrue,
          mockCreateAccount,
          password,
        } = setupOnSubmit();

        const errorMessage = 'error message.';
        mockCreateAccount.mockRejectedValueOnce(new Error(errorMessage));
        const pseudoProps = {
          createAccount: mockCreateAccount,
          isMountedRef: isMountedRefTrue,
        };
        const values = { accountName, password };

        // @ts-ignore mock
        await createAccountFormOnSubmit(pseudoProps, values, helpers);
        expect(mockCreateAccount).toBeCalled();

        expect(helpers.setStatus).toBeCalledWith({ success: false });
        expect(helpers.setSubmitting).toBeCalledWith(false);
        expect(helpers.setErrors).toBeCalledWith({ submit: errorMessage });
      });

      test('does not call helpers when call fails when unmounted', async () => {
        const {
          accountName,
          helpers,
          isMountedRefFalse,
          mockCreateAccount,
          password,
        } = setupOnSubmit();

        const errorMessage = 'error message.';
        mockCreateAccount.mockRejectedValueOnce(new Error(errorMessage));
        const pseudoProps = {
          createAccount: mockCreateAccount,
          isMountedRef: isMountedRefFalse,
        };
        const values = { accountName, password };

        // @ts-ignore mock
        await createAccountFormOnSubmit(pseudoProps, values, helpers);

        expect(helpers.setStatus).not.toBeCalled();
        expect(helpers.setSubmitting).not.toBeCalled();
        expect(helpers.setErrors).not.toBeCalled();
      });
    });
  });
});
