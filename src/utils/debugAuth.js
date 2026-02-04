/**
 * Debug authentication issues
 */

import { 
  collection, 
  doc, 
  getDocs, 
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Debug Firebase connection and user data
 */
export const debugFirebaseAuth = async (email) => {
  console.log('🔍 Debugging Firebase Auth for:', email);
  
  try {
    // Test 1: Check if we can connect to Firebase
    console.log('\n1. Testing Firebase connection...');
    const testRef = collection(db, 'authorized_users');
    console.log('✅ Firebase connection successful');
    
    // Test 2: Get all documents in authorized_users collection
    console.log('\n2. Getting all users from authorized_users collection...');
    const allUsersSnapshot = await getDocs(testRef);
    console.log(`Found ${allUsersSnapshot.size} documents in authorized_users collection`);
    
    allUsersSnapshot.forEach((doc) => {
      console.log('Document ID:', doc.id);
      console.log('Document Data:', doc.data());
      console.log('---');
    });
    
    // Test 3: Query for specific email
    console.log(`\n3. Querying for email: ${email}`);
    const emailQuery = query(testRef, where('email', '==', email.toLowerCase()));
    const emailSnapshot = await getDocs(emailQuery);
    
    if (emailSnapshot.empty) {
      console.log('❌ No documents found for this email');
      
      // Test 4: Try case-sensitive search
      console.log('\n4. Trying case-sensitive search...');
      const caseSensitiveQuery = query(testRef, where('email', '==', email));
      const caseSensitiveSnapshot = await getDocs(caseSensitiveQuery);
      
      if (caseSensitiveSnapshot.empty) {
        console.log('❌ No documents found with case-sensitive search either');
      } else {
        console.log('✅ Found with case-sensitive search!');
        caseSensitiveSnapshot.forEach((doc) => {
          console.log('Found Document:', doc.data());
        });
      }
    } else {
      console.log('✅ Found documents for this email:');
      emailSnapshot.forEach((doc) => {
        console.log('Document ID:', doc.id);
        console.log('Document Data:', doc.data());
      });
    }
    
    // Test 5: Check field types
    console.log('\n5. Checking field types...');
    allUsersSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Document ${doc.id} field types:`);
      Object.keys(data).forEach(key => {
        console.log(`  ${key}: ${typeof data[key]} = ${data[key]}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error debugging Firebase auth:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
  }
};

/**
 * Test the dynamic role manager functions
 */
export const testDynamicRoleManager = async (email) => {
  console.log('🧪 Testing Dynamic Role Manager for:', email);
  
  try {
    const { getUserInfoFromDB, isUserAuthorized } = await import('./dynamicRoleManager');
    
    console.log('\n1. Testing getUserInfoFromDB...');
    const userInfo = await getUserInfoFromDB(email);
    console.log('User Info Result:', userInfo);
    
    console.log('\n2. Testing isUserAuthorized...');
    const isAuth = await isUserAuthorized(email);
    console.log('Is Authorized Result:', isAuth);
    
  } catch (error) {
    console.error('❌ Error testing dynamic role manager:', error);
  }
};

// Export for console use
if (typeof window !== 'undefined') {
  window.debugFirebaseAuth = debugFirebaseAuth;
  window.testDynamicRoleManager = testDynamicRoleManager;
}