import GuestUpload from '@/components/GuestUpload';

export default function GuestUploadPage({ params }: { params: { id: string } }) {
  return <GuestUpload eventId={params.id} />;
}
