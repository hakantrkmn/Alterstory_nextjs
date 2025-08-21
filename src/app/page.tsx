'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, XCircle, Loader2, Database, Wifi } from 'lucide-react';

interface ConnectionStatus {
  status: 'loading' | 'success' | 'error';
  message: string;
  details?: string;
}

export default function Home() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'loading',
    message: 'Supabase bağlantısı test ediliyor...'
  });

  useEffect(() => {
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    try {
      const supabase = createClient();
      
      console.log('Testing Supabase connection...');
      console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
      
      // Method 1: Try to get auth user (this should work even without tables)
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError && authError.message !== 'Auth session missing!') {
        throw new Error(`Auth test failed: ${authError.message}`);
      }
      
      // Method 2: Try a simple query to test database connection
      const { data, error } = await supabase
        .from('_test_connection')
        .select('*')
        .limit(1);

      console.log('Supabase response:', { data, error, authData });

      if (error) {
        // These error codes indicate successful connection but missing table (expected)
        const expectedErrorCodes = ['PGRST116', 'PGRST205', '42P01'];
        const expectedErrorMessages = ['does not exist', 'relation', 'table', 'schema cache'];
        
        const isExpectedError = expectedErrorCodes.includes(error.code) || 
                               expectedErrorMessages.some(msg => error.message.toLowerCase().includes(msg.toLowerCase()));
        
        if (isExpectedError) {
          setConnectionStatus({
            status: 'success',
            message: 'Supabase bağlantısı başarılı! ✅',
            details: `Veritabanına erişim sağlandı. Auth servisi çalışıyor. Test tablosu bulunamadı (beklenen durum). Error code: ${error.code}`
          });
        } else {
          console.error('Supabase error:', error);
          setConnectionStatus({
            status: 'error',
            message: 'Supabase bağlantısı başarısız! ❌',
            details: `Database Error: ${error.message} (Code: ${error.code || 'unknown'})`
          });
        }
      } else {
        setConnectionStatus({
          status: 'success',
          message: 'Supabase bağlantısı başarılı! ✅',
          details: 'Veritabanı bağlantısı ve test sorgusu başarılı.'
        });
      }
    } catch (error: unknown) {
      console.error('Connection test error:', error);
      let errorMessage = 'Bilinmeyen hata oluştu.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as { message: unknown }).message);
      }
      
      setConnectionStatus({
        status: 'error',
        message: 'Supabase bağlantısı başarısız! ❌',
        details: `Connection Error: ${errorMessage}`
      });
    }
  };

  const retryConnection = () => {
    setConnectionStatus({
      status: 'loading',
      message: 'Supabase bağlantısı yeniden test ediliyor...'
    });
    testSupabaseConnection();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Interactive Story Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Collaborate to create branching stories with other writers
          </p>
        </div>

        {/* Supabase Connection Test Card */}
        <div className="max-w-2xl mx-auto mb-8">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Supabase Bağlantı Testi
              </CardTitle>
              <CardDescription>
                Backend veritabanı bağlantısının durumu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                {connectionStatus.status === 'loading' && (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    <span className="text-blue-600">{connectionStatus.message}</span>
                  </>
                )}
                {connectionStatus.status === 'success' && (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-600 font-medium">{connectionStatus.message}</span>
                  </>
                )}
                {connectionStatus.status === 'error' && (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-600 font-medium">{connectionStatus.message}</span>
                  </>
                )}
              </div>
              
              {connectionStatus.details && (
                <div className="bg-muted p-3 rounded-md mb-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Detaylar:</strong> {connectionStatus.details}
                  </p>
                </div>
              )}

              {connectionStatus.status === 'error' && (
                <Button onClick={retryConnection} variant="outline" size="sm">
                  <Wifi className="h-4 w-4 mr-2" />
                  Tekrar Dene
                </Button>
              )}

              {connectionStatus.status === 'success' && (
                <div className="text-sm text-muted-foreground">
                  <p>✅ Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
                  <p>✅ Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create Stories</CardTitle>
              <CardDescription>
                Start a new story that others can continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled={connectionStatus.status !== 'success'}>
                Get Started
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Explore Stories</CardTitle>
              <CardDescription>
                Read and continue existing stories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled={connectionStatus.status !== 'success'}>
                Browse Stories
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Join Community</CardTitle>
              <CardDescription>
                Connect with other writers and readers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full" disabled={connectionStatus.status !== 'success'}>
                Sign Up
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            {connectionStatus.status === 'success' 
              ? 'Project foundation setup complete ✅ - Backend ready!' 
              : 'Project foundation setup complete ✅ - Backend connection pending...'}
          </p>
        </div>
      </div>
    </div>
  );
}