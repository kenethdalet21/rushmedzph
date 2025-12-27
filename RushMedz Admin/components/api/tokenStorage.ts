import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage-based JWT storage for React Native
export async function setToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem('jwt_token', token);
  } catch (error) {
    console.error('Failed to save token:', error);
  }
}

export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('jwt_token');
  } catch (error) {
    console.error('Failed to get token:', error);
    return null;
  }
}

export async function clearToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem('jwt_token');
  } catch (error) {
    console.error('Failed to clear token:', error);
  }
}
