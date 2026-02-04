/**
 * Debug user access issues
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
 * Comprehensive debug for user access
 */
export const debugUserAccess = async (email) => {
  console.log('🔍 DEBUGGING USER ACCESS FOR:', email);
  console.log('=====================================');
  
  try {
    // Step 1: Test Firebase connection
    console.log('\n1. Testing Firebase connection...');
    try {
      const testRef = collection(db, 'authorized_users');
      console.log('✅ Firebase connection successful');
    } catch (error) {
      console.log('❌ Firebase connection failed:', error);
      return;
    }
    
    // Step 2: Check if authorized_users collection exists
    console.log('\n2. Checking authorized_users collection...');
    const usersRef = collection(db, 'authorized_users');
    const allUsersSnapshot = await getDocs(usersRef);
    console.log(`📊 Found ${allUsersSnapshot.size} documents in authorized_users collection`);
    
    if (allUsersSnapshot.size === 0) {
      console.log('❌ No documents found in authorized_users collection!');
      console.log('💡 This is likely the issue - the collection is empty');
      return;
    }
    
    // Step 3: List all users in collection
    console.log('\n3. All users in authorized_users collection:');
    allUsersSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`User ${index + 1}:`);
      console.log(`  Document ID: ${doc.id}`);
      console.log(`  Email: ${data.email}`);
      console.log(`  Name: ${data.name}`);
      console.log(`  Role: ${data.role}`);
      console.log(`  IsActive: ${data.isActive}`);
      console.log(`  StoreId: ${data.storeId}`);
      console.log(`  StoreName: ${data.storeName}`);
      console.log('  ---');
    });
    
    // Step 4: Search for specific email (case-insensitive)
    console.log(`\n4. Searching for email: ${email} (case-insensitive)`);
    const emailQuery = query(usersRef, where('email', '==', email.toLowerCase()));
    const emailSnapshot = await getDocs(emailQuery);
    
    if (emailSnapshot.empty) {
      console.log('❌ Email not found with case-insensitive search');
      
      // Try case-sensitive search
      console.log(`\n5. Trying case-sensitive search: ${email}`);
      const caseSensitiveQuery = query(usersRef, where('email', '==', email));
      const caseSensitiveSnapshot = await getDocs(caseSensitiveQuery);
      
      if (caseSensitiveSnapshot.empty) {
        console.log('❌ Email not found with case-sensitive search either');
        console.log('💡 THE ISSUE: User document does not exist in authorized_users collection');
        console.log('🔧 SOLUTION: Add the user document to Firebase');
      } else {
        console.log('✅ Found with case-sensitive search!');
        caseSensitiveSnapshot.forEach((doc) => {
          console.log('Found document:', doc.data());
        });
      }
    } else {
      console.log('✅ Email found in database!');
      emailSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('User document:', data);
        
        // Check required fields
        console.log('\n6. Checking required fields...');
        const requiredFields = ['email', 'role', 'isActive'];
        const missingFields = [];
        
        requiredFields.forEach(field => {
          if (data[field] === undefined || data[field] === null) {
            missingFields.push(field);
          }
        });
        
        if (missingFields.length > 0) {
          console.log('❌ Missing required fields:', missingFields);
          console.log('💡 THE ISSUE: Required fields are missing');
          console.log('🔧 SOLUTION: Add missing fields to the document');
        } else {
          console.log('✅ All required fields present');
          
          // Check if user is active
          if (data.isActive === false) {
            console.log('❌ User is marked as inactive');
            console.log('💡 THE ISSUE: User isActive = false');
            console.log('🔧 SOLUTION: Set isActive = true');
          } else {
            console.log('✅ User is active');
            console.log('🤔 User should have access - there might be another issue');
          }
        }
      });
    }
    
    // Step 7: Test the dynamic role manager directly
    console.log('\n7. Testing dynamic role manager...');
    try {
      const { getUserInfoFromDB, isUserAuthorized } = await import('./dynamicRoleManager.js');
      
      const userInfo = await getUserInfoFromDB(email);
      console.log('getUserInfoFromDB result:', userInfo);
      
      const isAuth = await isUserAuthorized(email);
      console.log('isUserAuthorized result:', isAuth);
      
      if (!userInfo) {
        console.log('❌ getUserInfoFromDB returned null');
        console.log('💡 THE ISSUE: Dynamic role manager cannot find user');
      } else if (!isAuth) {
        console.log('❌ isUserAuthorized returned false');
        console.log('💡 THE ISSUE: User found but not authorized');
      } else {
        console.log('✅ Dynamic role manager working correctly');
        console.log('🤔 User should have access - check App.js authorization logic');
      }
      
    } catch (error) {
      console.log('❌ Error testing dynamic role manager:', error);
    }
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
};

// Export for console use
if (typeof window !== 'undefined') {
  window.debugUserAccess = debugUserAccess;
}

// Auto-run for praba email
console.log('🚀 Debug function loaded. Run: debugUserAccess("praba182589@gmail.com")');