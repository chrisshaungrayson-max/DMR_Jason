/**
 * ConfirmationDialog - Reusable confirmation dialog component
 */

import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { 
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogCloseButton,
  AlertDialogBody,
  AlertDialogFooter,
  Text,
  Button,
  ButtonText,
  CloseIcon
} from '@gluestack-ui/themed';
import { ConfirmationDialogProps } from '@/types/image-export';


export function ConfirmationDialog({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmationDialogProps) {
  return (
    <AlertDialog isOpen={visible} onClose={onCancel}>
      <AlertDialogBackdrop />
      <AlertDialogContent style={styles.dialog}>
        <AlertDialogHeader>
          <Text style={styles.title}>{title}</Text>
          <AlertDialogCloseButton>
            <CloseIcon />
          </AlertDialogCloseButton>
        </AlertDialogHeader>
        
        <AlertDialogBody>
          <Text style={styles.message}>{message}</Text>
        </AlertDialogBody>
        
        <AlertDialogFooter>
          <View style={styles.buttonContainer}>
            <Button
              variant="outline"
              style={styles.cancelButton}
              onPress={onCancel}
              isDisabled={loading}
            >
              <ButtonText style={styles.cancelButtonText}>{cancelText}</ButtonText>
            </Button>
            
            <Button
              style={[styles.confirmButton, loading && styles.disabledButton]}
              onPress={onConfirm}
              isDisabled={loading}
            >
              <View style={styles.confirmButtonContent}>
                {loading && (
                  <ActivityIndicator 
                    size="small" 
                    color="#FFFFFF" 
                    style={styles.loadingIcon}
                  />
                )}
                <ButtonText style={styles.confirmButtonText}>
                  {loading ? 'Saving...' : confirmText}
                </ButtonText>
              </View>
            </Button>
          </View>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    marginRight: 6,
  },
  confirmButton: {
    flex: 1,
    marginLeft: 6,
    backgroundColor: '#D4A574',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  confirmButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ConfirmationDialog;
