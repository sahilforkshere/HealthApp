import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PlaceholderImageProps {
  size?: number;
  icon?: string;
  backgroundColor?: string;
  textColor?: string;
}

export default function PlaceholderImage({ 
  size = 50, 
  icon = '👤', 
  backgroundColor = '#e3f2fd',
  textColor = '#1976d2'
}: PlaceholderImageProps) {
  return (
    <View style={[
      styles.placeholder, 
      { 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        backgroundColor 
      }
    ]}>
      <Text style={[styles.icon, { fontSize: size * 0.5, color: textColor }]}>
        {icon}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  icon: {
    fontWeight: 'bold',
  },
});
