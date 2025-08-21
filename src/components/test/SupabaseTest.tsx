'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function SupabaseTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testConnection = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      const supabase = createClient();
      
      // Test connection with a simple query
      const { error } = await supabase
        .from('_test_connection')
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          setResult('✅ Bağlantı başarılı! Veritabanına erişim var.');
        } else {
          setResult(`❌ Hata: ${error.message}`);
        }
      } else {
        setResult('✅ Bağlantı ve sorgu başarılı!');
      }
    } catch (error) {
      setResult(`❌ Bağlantı hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supabase Bağlantı Testi</CardTitle>
        <CardDescription>
          Backend veritabanı bağlantısını test edin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testConnection} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Test Ediliyor...
            </>
          ) : (
            'Bağlantıyı Test Et'
          )}
        </Button>
        
        {result && (
          <div className="p-3 rounded-md bg-muted">
            <p className="text-sm">{result}</p>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
          <p>Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</p>
        </div>
      </CardContent>
    </Card>
  );
}