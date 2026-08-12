import AdminDashboard from '@/components/AdminDashboard';

export default function AdminPage({ params }: { params: { token: string } }) {
  return <AdminDashboard token={params.token} />;
}
