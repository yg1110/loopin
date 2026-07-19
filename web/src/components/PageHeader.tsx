import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PageHeader({ title }: { title: string }) {
  const navigate = useNavigate();
  return (
    <header className="z-10 flex h-12 flex-none items-center border-b border-gray-100 bg-white/90 px-2 backdrop-blur">
      <button
        onClick={() => navigate(-1)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100"
        aria-label="뒤로"
      >
        <ChevronLeft size={24} />
      </button>
      <h1 className="text-base font-semibold text-gray-900">{title}</h1>
    </header>
  );
}
