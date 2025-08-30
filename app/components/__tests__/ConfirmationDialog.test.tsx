/**
 * Unit tests for ConfirmationDialog component
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConfirmationDialog from '../ConfirmationDialog';

describe('ConfirmationDialog', () => {
  const defaultProps = {
    visible: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    onConfirm: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when visible is true', () => {
    const { getByText } = render(
      <ConfirmationDialog {...defaultProps} />
    );

    expect(getByText('Confirm Action')).toBeTruthy();
    expect(getByText('Are you sure you want to proceed?')).toBeTruthy();
    expect(getByText('Confirm')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('should not render when visible is false', () => {
    const { queryByText } = render(
      <ConfirmationDialog {...defaultProps} visible={false} />
    );

    expect(queryByText('Confirm Action')).toBeFalsy();
  });

  it('should render custom button text', () => {
    const { getByText } = render(
      <ConfirmationDialog 
        {...defaultProps} 
        confirmText="Save Now"
        cancelText="Not Now"
      />
    );

    expect(getByText('Save Now')).toBeTruthy();
    expect(getByText('Not Now')).toBeTruthy();
  });

  it('should call onConfirm when confirm button is pressed', () => {
    const { getByLabelText } = render(
      <ConfirmationDialog {...defaultProps} />
    );

    const confirmButton = getByLabelText('Confirm');
    fireEvent.press(confirmButton);

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button is pressed', () => {
    const { getByLabelText } = render(
      <ConfirmationDialog {...defaultProps} />
    );

    const cancelButton = getByLabelText('Cancel');
    fireEvent.press(cancelButton);

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('should show loading state on confirm button', () => {
    const { getByText, getByLabelText } = render(
      <ConfirmationDialog {...defaultProps} loading={true} />
    );

    expect(getByText('Saving...')).toBeTruthy();
    
    const confirmButton = getByLabelText('Saving...');
    expect(confirmButton.props.accessibilityState.disabled).toBe(true);
  });

  it('should disable buttons when loading', () => {
    const { getByLabelText } = render(
      <ConfirmationDialog {...defaultProps} loading={true} />
    );

    const confirmButton = getByLabelText('Saving...');
    const cancelButton = getByLabelText('Cancel');

    expect(confirmButton.props.accessibilityState.disabled).toBe(true);
    expect(cancelButton.props.disabled).toBe(true);
  });

  it('should not call onConfirm when confirm button is pressed while loading', () => {
    const { getByLabelText } = render(
      <ConfirmationDialog {...defaultProps} loading={true} />
    );

    const confirmButton = getByLabelText('Saving...');
    fireEvent.press(confirmButton);

    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('should not call onCancel when cancel button is pressed while loading', () => {
    const { getByLabelText } = render(
      <ConfirmationDialog {...defaultProps} loading={true} />
    );

    const cancelButton = getByLabelText('Cancel');
    fireEvent.press(cancelButton);

    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });

  it('should have proper accessibility labels', () => {
    const { getByLabelText } = render(
      <ConfirmationDialog 
        {...defaultProps} 
        confirmText="Save Image"
        cancelText="Cancel Export"
      />
    );

    expect(getByLabelText('Save Image')).toBeTruthy();
    expect(getByLabelText('Cancel Export')).toBeTruthy();
  });

  it('should render with custom confirm text in loading state', () => {
    const { getByText } = render(
      <ConfirmationDialog 
        {...defaultProps} 
        confirmText="Export Now"
        loading={true}
      />
    );

    expect(getByText('Saving...')).toBeTruthy();
  });

  it('should handle long messages properly', () => {
    const longMessage = 'This is a very long message that should wrap properly within the dialog container and maintain good readability for the user.';
    
    const { getByText } = render(
      <ConfirmationDialog 
        {...defaultProps} 
        message={longMessage}
      />
    );

    expect(getByText(longMessage)).toBeTruthy();
  });

  it('should handle empty title and message', () => {
    const { getByText } = render(
      <ConfirmationDialog 
        {...defaultProps} 
        title=""
        message=""
      />
    );

    // Should still render buttons
    expect(getByText('Confirm')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('should maintain button functionality with custom text', () => {
    const customProps = {
      ...defaultProps,
      confirmText: 'Yes, Save It',
      cancelText: 'No, Cancel'
    };

    const { getByLabelText } = render(
      <ConfirmationDialog {...customProps} />
    );

    const confirmButton = getByLabelText('Yes, Save It');
    const cancelButton = getByLabelText('No, Cancel');

    fireEvent.press(confirmButton);
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.press(cancelButton);
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });
});
