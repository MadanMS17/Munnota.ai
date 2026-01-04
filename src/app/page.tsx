import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/linkedin-post-generator');
  return null;
}
