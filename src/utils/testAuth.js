import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export const testFirebaseAuth = async () => {
  try {
    console.log('Testing Firebase Auth connection...');
    console.log('Auth instance:', auth);
    console.log('Auth config:', auth.config);
    
    // Test if auth is properly initialized
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    
    console.log('✅ Firebase Auth is properly configured');
    return true;
  } catch (error) {
    console.error('❌ Firebase Auth test failed:', error);
    return false;
  }
};

export const createTestUser = async () => {
  try {
    const email = `test${Date.now()}@prabastore.com`;
    const password = 'test123456';
    
    console.log('Creating test user:', email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ Test user created successfully:', userCredential.user.email);
    
    // Clean up - delete the test user
    await userCredential.user.delete();
    console.log('✅ Test user cleaned up');
    
    return true;
  } catch (error) {
    console.error('❌ Test user creation failed:', error);
    return false;
  }
};

// Make functions available globally for testing
window.testFirebaseAuth = testFirebaseAuth;
window.createTestUser = createTestUser;