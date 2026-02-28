'use client';

import { useEffect, useState } from 'react';

export default function TestFirebasePage() {
  const [config, setConfig] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    async function testFirebase() {
      try {
        // Import Firebase config
        const { auth } = await import('@/lib/firebase/config');
        
        // Get current config
        const fbConfig = {
          apiKey: auth.app.options.apiKey,
          authDomain: auth.app.options.authDomain,
          projectId: auth.app.options.projectId,
          storageBucket: auth.app.options.storageBucket,
          messagingSenderId: auth.app.options.messagingSenderId,
          appId: auth.app.options.appId,
        };
        
        setConfig(fbConfig);
        
        // Test creating a user (will fail but we can see the error)
        try {
          const { signInWithEmailAndPassword } = await import('firebase/auth');
          await signInWithEmailAndPassword(auth, 'test@test.com', 'test123456');
        } catch (err: any) {
          setTestResult(`Auth test error: ${err.code} - ${err.message}`);
        }
        
      } catch (err: any) {
        setError(err.message);
      }
    }
    
    testFirebase();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Firebase Configuration Test</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h2 className="font-bold text-red-800">Error:</h2>
            <pre className="text-sm text-red-600 mt-2">{error}</pre>
          </div>
        )}
        
        {config && (
          <div className="bg-white border rounded-lg p-6 mb-4">
            <h2 className="font-bold text-lg mb-4">Current Firebase Config:</h2>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-medium">API Key:</td>
                  <td className="py-2 font-mono text-xs">{config.apiKey}</td>
                  <td className="py-2">{config.apiKey ? '✅' : '❌'}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Auth Domain:</td>
                  <td className="py-2 font-mono text-xs">{config.authDomain}</td>
                  <td className="py-2">{config.authDomain ? '✅' : '❌'}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Project ID:</td>
                  <td className="py-2 font-mono text-xs">{config.projectId}</td>
                  <td className="py-2">{config.projectId ? '✅' : '❌'}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Storage Bucket:</td>
                  <td className="py-2 font-mono text-xs">{config.storageBucket}</td>
                  <td className="py-2">{config.storageBucket ? '✅' : '❌'}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Messaging Sender ID:</td>
                  <td className="py-2 font-mono text-xs">{config.messagingSenderId}</td>
                  <td className="py-2">{config.messagingSenderId ? '✅' : '❌'}</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">App ID:</td>
                  <td className="py-2 font-mono text-xs">{config.appId}</td>
                  <td className="py-2">{config.appId ? '✅' : '❌'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        
        {testResult && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h2 className="font-bold text-blue-800 mb-2">Test Result:</h2>
            <pre className="text-sm text-blue-600 whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="font-bold text-yellow-800 mb-2">Next Steps:</h2>
          <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
            <li>Check if all values above are correct</li>
            <li>Compare API Key with Firebase Console</li>
            <li>Check browser console (F12) for errors</li>
            <li>Verify Email/Password is enabled in Firebase Console</li>
            <li>Verify Google sign-in is enabled</li>
          </ol>
        </div>
        
        <div className="mt-6">
          <a 
            href="/login" 
            className="text-blue-600 hover:underline"
          >
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
