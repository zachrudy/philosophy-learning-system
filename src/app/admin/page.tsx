import { redirect } from 'next/navigation';

// Admin root page - redirect to dashboard
export default function AdminPage() {
  redirect('/admin/dashboard');
}
