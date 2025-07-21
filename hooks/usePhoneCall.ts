import { Linking, Alert } from 'react-native';

export const usePhoneCall = () => {
  const makeCall = async (phoneNumber: string, contactName?: string) => {
    if (!phoneNumber) {
      Alert.alert('No Phone Number', 'Phone number is not available');
      return;
    }

    // Clean the phone number (remove spaces, dashes, parentheses, etc.)
    const cleanPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    // Validate phone number (basic validation)
    if (cleanPhoneNumber.length < 10) {
      Alert.alert('Invalid Number', 'The phone number appears to be invalid');
      return;
    }
    
    // Create the tel: URL
    const phoneUrl = `tel:${cleanPhoneNumber}`;
    
    try {
      // Check if the device can handle phone calls
      const canCall = await Linking.canOpenURL(phoneUrl);
      
      if (canCall) {
        // Confirm before calling (optional)
        Alert.alert(
          'Call Confirmation',
          `Do you want to call ${contactName || 'this number'}?\n${phoneNumber}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Call', 
              style: 'default',
              onPress: () => Linking.openURL(phoneUrl)
            }
          ]
        );
      } else {
        Alert.alert('Cannot Make Call', 'Your device does not support phone calls');
      }
    } catch (error) {
      console.error('Error making phone call:', error);
      Alert.alert('Call Failed', 'Unable to initiate phone call');
    }
  };

  return { makeCall };
};
