'use client';
import { useUser } from '@/firebase';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      redirect('/login');
    }
    if (!isUserLoading && user) {
      redirect('/linkedin-post-generator');
    }
  }, [user, isUserLoading]);

  return null;
}
